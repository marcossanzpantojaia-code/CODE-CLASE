import type { FastifyInstance } from 'fastify';
import type { AppConfig } from './config/env.js';
import { createDatabase, type DatabaseHandle, type DB } from './db/database.js';
import { Worker } from './jobs/worker.js';
import { createLogger, type AppLogger } from './observability/logger.js';
import { Metrics } from './observability/metrics.js';
import { InboundService } from './messaging/inbound.service.js';
import { OutboundSender } from './messaging/outbound-sender.js';
import { WhatsAppCloudClient } from './messaging/whatsapp/cloud-api.js';
import { AppointmentNotifier } from './reminders/notifier.js';
import { AnthropicInterpreter } from './receptionist/llm/anthropic-interpreter.js';
import type { MessageInterpreter } from './receptionist/llm/interpreter.js';
import { ReceptionistService } from './receptionist/receptionist.service.js';
import { AvailabilityService } from './scheduling/availability.service.js';
import { BookingService } from './scheduling/booking.service.js';
import { CircuitBreaker, type CircuitState } from './shared/circuit-breaker.js';
import { systemClock, type Clock } from './shared/clock.js';
import { errorMessage } from './shared/errors.js';
import { buildServer } from './http/server.js';

export interface AppOptions {
  config: AppConfig;
  clock?: Clock;
  logger?: AppLogger;
  /** Source for secret references (env:NAME). Defaults to process.env. */
  env?: NodeJS.ProcessEnv;
  /** Replace the LLM interpreter (tests of other layers). Production uses Claude. */
  interpreter?: MessageInterpreter;
  fetchImpl?: typeof fetch;
}

export interface App {
  config: AppConfig;
  db: DB;
  logger: AppLogger;
  metrics: Metrics;
  clock: Clock;
  server: FastifyInstance | null;
  worker: Worker | null;
  breakers: { whatsapp: CircuitBreaker; llm: CircuitBreaker };
  services: {
    inbound: InboundService;
    availability: AvailabilityService;
    booking: BookingService;
    receptionist: ReceptionistService;
    sender: OutboundSender;
    notifier: AppointmentNotifier;
    interpreter: MessageInterpreter;
  };
  start(): Promise<void>;
  stop(reason: string): Promise<void>;
  isDraining(): boolean;
}

/** Composition root: wires every dependency explicitly (no hidden singletons). */
export async function createApp(options: AppOptions): Promise<App> {
  const { config } = options;
  const clock = options.clock ?? systemClock;
  const logger = options.logger ?? createLogger({ level: config.logLevel, appEnv: config.appEnv });
  const metrics = new Metrics({ collectDefault: config.nodeEnv === 'production' });
  const dbHandle: DatabaseHandle = createDatabase(
    { url: config.database.url, poolMax: config.database.poolMax, ssl: config.database.ssl, statementTimeoutMs: config.database.statementTimeoutMs },
    logger,
  );
  const db = dbHandle.db;

  const onBreaker = (name: string, state: CircuitState) => {
    metrics.circuitState.set({ name }, state === 'CLOSED' ? 0 : 1);
    logger.warn({ event: 'circuit.state_changed', circuit: name, state }, `circuit ${name} is ${state}`);
  };
  const breakers = {
    whatsapp: new CircuitBreaker({ name: 'whatsapp', failureThreshold: 5, windowMs: 60_000, openDurationMs: 30_000, clock, onStateChange: onBreaker }),
    llm: new CircuitBreaker({ name: 'llm', failureThreshold: 5, windowMs: 60_000, openDurationMs: 30_000, clock, onStateChange: onBreaker }),
  };

  const availability = new AvailabilityService(metrics);
  const booking = new BookingService(availability, metrics, logger);
  const inbound = new InboundService(db, clock, { inboundDebounceMs: config.receptionist.inboundDebounceMs }, logger, metrics);
  const whatsappClient = new WhatsAppCloudClient({
    baseUrl: config.whatsapp.graphBaseUrl,
    apiVersion: config.whatsapp.graphApiVersion,
    timeoutMs: config.whatsapp.httpTimeoutMs,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  });
  const sender = new OutboundSender({
    db,
    clock,
    client: whatsappClient,
    breaker: breakers.whatsapp,
    isOutboundEnabled: () => config.flags.outboundMessagingEnabled,
    env: options.env ?? process.env,
    metrics,
  });
  const interpreter =
    options.interpreter ??
    new AnthropicInterpreter(
      {
        apiKey: config.llm.apiKey,
        baseUrl: config.llm.baseUrl,
        model: config.llm.model,
        effort: config.llm.effort,
        maxOutputTokens: config.llm.maxOutputTokens,
        timeoutMs: config.llm.timeoutMs,
        maxRetries: config.llm.maxRetries,
        serverFallbacks: config.llm.serverFallbacks,
        pricesPerMTok: config.llm.pricesPerMTok,
      },
      breakers.llm,
      metrics,
    );
  const receptionist = new ReceptionistService({
    db,
    clock,
    interpreter,
    availability,
    booking,
    flags: () => ({ automatedReceptionistEnabled: config.flags.automatedReceptionistEnabled, safeMode: config.flags.safeMode }),
    config: {
      stateTtlMinutes: config.receptionist.stateTtlMinutes,
      replyMaxAgeMinutes: config.receptionist.replyMaxAgeMinutes,
      runawayMaxRepliesPer10Min: config.receptionist.runawayMaxRepliesPer10Min,
      llmMaxCallsPerConversationPerDay: config.llm.maxCallsPerConversationPerDay,
      historyMessages: config.llm.historyMessages,
      searchDays: config.receptionist.availabilitySearchDays,
    },
    logger,
    metrics,
  });
  const notifier = new AppointmentNotifier({ db, clock, metrics });

  const worker =
    config.role === 'web'
      ? null
      : new Worker(
          db,
          { 'receptionist.process': receptionist.handle, 'outbound.send': sender.handle, 'appointment.notify': notifier.handle },
          { concurrency: config.worker.concurrency, pollIntervalMs: config.worker.pollIntervalMs, leaseSeconds: config.worker.leaseSeconds },
          clock,
          logger,
          metrics,
        );

  let draining = false;
  const server =
    config.role === 'worker'
      ? null
      : await buildServer({ config, db, clock, logger, metrics, inbound, availability, booking, breakers, worker: worker ?? undefined, isDraining: () => draining });

  let stopped = false;
  return {
    config,
    db,
    logger,
    metrics,
    clock,
    server,
    worker,
    breakers,
    services: { inbound, availability, booking, receptionist, sender, notifier, interpreter },
    isDraining: () => draining,
    async start() {
      worker?.start();
      if (server) {
        await server.listen({ host: config.http.host, port: config.http.port });
        logger.info({ event: 'app.started', role: config.role, port: config.http.port, env: config.appEnv }, 'service started');
      }
      if (!config.flags.automatedReceptionistEnabled) logger.warn({ event: 'flags.receptionist_disabled' }, 'AUTOMATED_RECEPTIONIST_ENABLED=false: no automatic replies');
      if (config.flags.safeMode) logger.warn({ event: 'flags.safe_mode' }, 'SAFE_MODE=true: automatic replies suspended, conversations flagged for humans');
      if (!config.flags.outboundMessagingEnabled) logger.warn({ event: 'flags.outbound_disabled' }, 'OUTBOUND_MESSAGING_ENABLED=false: sends are held');
    },
    async stop(reason: string) {
      if (stopped) return;
      stopped = true;
      draining = true;
      logger.info({ event: 'app.stopping', reason }, 'graceful shutdown started');
      const timeout = config.worker.shutdownTimeoutMs;
      const results = await Promise.allSettled([server ? server.close() : Promise.resolve(), worker ? worker.stop(timeout) : Promise.resolve({ drained: true })]);
      for (const r of results) if (r.status === 'rejected') logger.error({ event: 'app.stop.error', err: { message: errorMessage(r.reason) } }, 'error while stopping');
      await dbHandle.close();
      logger.info({ event: 'app.stopped', reason }, 'graceful shutdown complete');
    },
  };
}
