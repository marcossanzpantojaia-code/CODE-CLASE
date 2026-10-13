import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import Fastify, { type FastifyBaseLogger, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { sql } from 'kysely';
import { ZodError } from 'zod';
import type { AppConfig } from '../config/env.js';
import type { DB } from '../db/database.js';
import { pendingMigrations } from '../db/migrator.js';
import type { Worker } from '../jobs/worker.js';
import type { AppLogger } from '../observability/logger.js';
import type { Metrics } from '../observability/metrics.js';
import type { InboundService } from '../messaging/inbound.service.js';
import type { AvailabilityService } from '../scheduling/availability.service.js';
import type { BookingService } from '../scheduling/booking.service.js';
import type { CircuitBreaker } from '../shared/circuit-breaker.js';
import type { Clock } from '../shared/clock.js';
import { DomainError, errorMessage } from '../shared/errors.js';
import { verifySubscriptionToken, verifyWebhookSignature } from '../messaging/whatsapp/signature.js';
import { registerAdminRoutes } from './admin.routes.js';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
    businessId?: string;
  }
}

export interface ServerDeps {
  config: AppConfig;
  db: DB;
  clock: Clock;
  logger: AppLogger;
  metrics: Metrics;
  inbound: InboundService;
  availability: AvailabilityService;
  booking: BookingService;
  breakers: { whatsapp: CircuitBreaker; llm: CircuitBreaker };
  /** Present when this process also runs the worker (ROLE=all|worker). */
  worker?: Worker | undefined;
  isDraining: () => boolean;
}

export async function buildServer(deps: ServerDeps): Promise<FastifyInstance> {
  const { config, logger, metrics } = deps;
  const app: FastifyInstance = Fastify<Server, IncomingMessage, ServerResponse, FastifyBaseLogger>({
    loggerInstance: logger,
    bodyLimit: config.whatsapp.webhookMaxBodyBytes,
    // Hop count (not `true`): only the address appended by our own proxy is trusted,
    // so clients cannot spoof X-Forwarded-For to dodge rate limits.
    trustProxy: config.http.trustProxyHops > 0 ? (_address: string, hop: number) => hop < config.http.trustProxyHops : false,
    requestIdHeader: 'x-request-id',
    return503OnClosing: true,
  });

  // Keep the raw bytes: the webhook signature is computed over them.
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    const buf = body as Buffer;
    req.rawBody = buf;
    if (buf.length === 0) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(buf.toString('utf8')));
    } catch {
      const err = new Error('invalid JSON body') as Error & { statusCode: number };
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    }
    if (error instanceof DomainError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'VALIDATION_ERROR' ? 400 : 409;
      return reply.code(status).send({ error: error.code, message: error.message });
    }
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
    if (status >= 500) request.log.error({ event: 'http.error', err: { message: errorMessage(error) } }, 'request failed');
    return reply.code(status).send({ error: status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST' });
  });

  // ------------------------------------------------------------------ health
  app.get('/health/live', (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, reply) => {
    const checks: Record<string, unknown> = {};
    let ready = true;
    if (deps.isDraining()) {
      return reply.code(503).send({ status: 'draining' });
    }
    try {
      await withTimeout(sql`SELECT 1`.execute(deps.db), 2_000);
      checks.database = 'ok';
    } catch (err) {
      ready = false;
      // Unauthenticated endpoint: the detail (host, user...) goes to the logs only.
      checks.database = 'error';
      logger.warn({ event: 'health.ready.check_failed', check: 'database', err: { message: errorMessage(err) } }, 'readiness check failed');
    }
    if (checks.database === 'ok') {
      try {
        const pending = await pendingMigrations(deps.db);
        checks.migrations = pending.length === 0 ? 'ok' : `pending: ${pending.join(',')}`;
        if (pending.length > 0) ready = false;
        const q = await deps.db
          .selectFrom('jobs')
          .select([sql<number>`count(*)`.as('pending'), sql<Date | null>`min(run_at)`.as('oldest')])
          .where('status', '=', 'PENDING')
          .where('run_at', '<=', deps.clock.now())
          .executeTakeFirstOrThrow();
        const lagSeconds = q.oldest ? Math.round((deps.clock.now().getTime() - new Date(q.oldest).getTime()) / 1000) : 0;
        checks.queue = { duePending: Number(q.pending), oldestDueLagSeconds: lagSeconds };
      } catch (err) {
        ready = false;
        checks.migrations = 'error';
        logger.warn({ event: 'health.ready.check_failed', check: 'migrations', err: { message: errorMessage(err) } }, 'readiness check failed');
      }
    }
    if (config.role !== 'web') {
      const w = deps.worker;
      const fresh = w !== undefined && w.isRunning && Date.now() - w.lastTickAt < Math.max(30_000, config.worker.pollIntervalMs * 10);
      checks.worker = fresh ? 'ok' : 'stalled';
      if (!fresh) ready = false;
    }
    const whatsappConfigured = Boolean(config.whatsapp.appSecret && config.whatsapp.verifyToken);
    checks.whatsapp = { configured: whatsappConfigured, circuit: deps.breakers.whatsapp.currentState() };
    if (!whatsappConfigured && config.role !== 'worker') ready = false;
    // The LLM is reported, not probed: a remote call per probe would cost money,
    // and an LLM outage degrades to the human-handoff fallback, it does not
    // stop webhook intake.
    checks.llm = { configured: Boolean(config.llm.apiKey), circuit: deps.breakers.llm.currentState(), model: config.llm.model };
    checks.flags = {
      automatedReceptionistEnabled: config.flags.automatedReceptionistEnabled,
      safeMode: config.flags.safeMode,
      outboundMessagingEnabled: config.flags.outboundMessagingEnabled,
    };
    return reply.code(ready ? 200 : 503).send({ status: ready ? 'ready' : 'not_ready', env: config.appEnv, checks });
  });

  app.get('/metrics', async (request, reply) => {
    const token = config.metricsToken;
    const deployed = config.nodeEnv === 'production' || config.appEnv === 'production' || config.appEnv === 'staging';
    if (!token && deployed) return reply.code(404).send({ error: 'NOT_FOUND' });
    if (token && !bearerMatches(request.headers.authorization, token)) return reply.code(401).send({ error: 'UNAUTHORIZED' });
    return reply.header('content-type', metrics.registry.contentType).send(await metrics.registry.metrics());
  });

  // ---------------------------------------------------------------- webhooks
  app.get('/webhooks/whatsapp', async (request: FastifyRequest<{ Querystring: Record<string, string | undefined> }>, reply: FastifyReply) => {
    const q = request.query;
    const expected = config.whatsapp.verifyToken;
    if (expected && verifySubscriptionToken(q['hub.mode'], q['hub.verify_token'], expected) && typeof q['hub.challenge'] === 'string') {
      logger.info({ event: 'whatsapp.webhook.verified' }, 'webhook subscription verified');
      return reply.code(200).header('content-type', 'text/plain').send(q['hub.challenge']);
    }
    logger.warn({ event: 'whatsapp.webhook.verification_failed' }, 'webhook verification rejected');
    return reply.code(403).send({ error: 'FORBIDDEN' });
  });

  app.post('/webhooks/whatsapp', async (request, reply) => {
    const secret = config.whatsapp.appSecret;
    if (!secret) {
      logger.error({ event: 'whatsapp.webhook.misconfigured' }, 'WHATSAPP_APP_SECRET not set: refusing unsigned webhooks');
      return reply.code(503).send({ error: 'WEBHOOK_NOT_CONFIGURED' });
    }
    const raw = request.rawBody ?? Buffer.alloc(0);
    const signature = request.headers['x-hub-signature-256'];
    if (!verifyWebhookSignature(raw, typeof signature === 'string' ? signature : undefined, secret)) {
      metrics.invalidWebhookSignatures.inc();
      logger.warn({ event: 'whatsapp.webhook.invalid_signature', ip: request.ip }, 'rejected webhook with invalid signature');
      return reply.code(401).send({ error: 'INVALID_SIGNATURE' });
    }
    // Errors propagate as 5xx so Meta retries; processing is idempotent.
    const result = await deps.inbound.handleWebhook(request.body);
    return reply.code(200).send({ status: 'ok', ...result });
  });

  await registerAdminRoutes(app, deps);
  return app;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([p, new Promise<never>((_, reject) => (t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)))]);
  } finally {
    if (t) clearTimeout(t);
  }
}

/** Constant-time `Authorization: Bearer <token>` check (digests have a fixed length, so nothing leaks through it either). */
function bearerMatches(header: string | undefined, token: string): boolean {
  if (typeof header !== 'string') return false;
  const digest = (v: string) => createHash('sha256').update(v, 'utf8').digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${token}`));
}
