import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import type { DB } from '../db/database.js';
import type { AppLogger } from '../observability/logger.js';
import type { Metrics } from '../observability/metrics.js';
import { backoffDelayMs } from '../shared/backoff.js';
import type { Clock } from '../shared/clock.js';
import { errorMessage } from '../shared/errors.js';
import {
  type ClaimedJob,
  type JobType,
  JOB_TYPES,
  claimNextJob,
  completeJob,
  deferJob,
  extendLease,
  failJob,
  queueDepth,
  reapExpiredLeases,
} from './queue.js';

/** Thrown by handlers: retry with exponential backoff (counts an attempt). */
export class RetryableJobError extends Error {
  constructor(
    message: string,
    public readonly delayMs?: number,
  ) {
    super(message);
    this.name = 'RetryableJobError';
  }
}

/** Thrown by handlers: do not retry. */
export class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentJobError';
  }
}

/** Thrown by handlers: try again later without consuming an attempt. */
export class DeferJobError extends Error {
  constructor(
    message: string,
    public readonly delayMs: number,
  ) {
    super(message);
    this.name = 'DeferJobError';
  }
}

export interface JobContext {
  workerId: string;
  logger: AppLogger;
}

export type JobHandler = (job: ClaimedJob, ctx: JobContext) => Promise<string | void>;

export interface WorkerOptions {
  concurrency: number;
  pollIntervalMs: number;
  leaseSeconds: number;
  types?: readonly JobType[];
  workerId?: string;
}

/**
 * Polling worker. Claims up to `concurrency` jobs, keeps their leases alive
 * while they run, classifies handler errors and supports graceful shutdown:
 * stop() stops claiming new jobs and waits for in-flight ones.
 */
export class Worker {
  readonly workerId: string;
  private running = false;
  private readonly inFlight = new Map<number, Promise<void>>();
  private loopPromise: Promise<void> | null = null;
  private wake: (() => void) | null = null;
  private lastTick = 0;
  private ticks = 0;

  constructor(
    private readonly db: DB,
    private readonly handlers: Partial<Record<JobType, JobHandler>>,
    private readonly options: WorkerOptions,
    private readonly clock: Clock,
    private readonly logger: AppLogger,
    private readonly metrics?: Metrics,
  ) {
    this.workerId = options.workerId ?? `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
  }

  /** Epoch ms of the last loop iteration (readiness uses it to detect a stalled worker). */
  get lastTickAt(): number {
    return this.lastTick;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get inFlightCount(): number {
    return this.inFlight.size;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.loopPromise = this.loop();
    this.logger.info({ event: 'worker.started', workerId: this.workerId, concurrency: this.options.concurrency }, 'worker started');
  }

  async stop(timeoutMs: number): Promise<{ drained: boolean }> {
    if (!this.running) return { drained: true };
    this.running = false;
    this.wake?.();
    await this.loopPromise;
    const pending = [...this.inFlight.values()];
    let timer: NodeJS.Timeout | undefined;
    const drained = await Promise.race([
      Promise.allSettled(pending).then(() => true),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
    if (timer) clearTimeout(timer);
    this.logger.info({ event: 'worker.stopped', workerId: this.workerId, drained, abandoned: this.inFlight.size }, 'worker stopped');
    return { drained };
  }

  /**
   * Runs claimable jobs until the queue is idle. Test/CLI helper: processes
   * synchronously instead of polling. Returns the number of jobs processed.
   */
  async drain(maxJobs = 1_000): Promise<number> {
    let processed = 0;
    while (processed < maxJobs) {
      const job = await claimNextJob(this.db, {
        workerId: this.workerId,
        now: this.clock.now(),
        leaseSeconds: this.options.leaseSeconds,
        types: this.options.types,
      });
      if (!job) break;
      await this.execute(job);
      processed++;
    }
    return processed;
  }

  private async loop(): Promise<void> {
    while (this.running) {
      this.lastTick = Date.now();
      this.ticks++;
      try {
        if (this.ticks % 20 === 1) await this.housekeeping();
        while (this.running && this.inFlight.size < this.options.concurrency) {
          const job = await claimNextJob(this.db, {
            workerId: this.workerId,
            now: this.clock.now(),
            leaseSeconds: this.options.leaseSeconds,
            types: this.options.types,
          });
          if (!job) break;
          const p = this.execute(job).finally(() => {
            this.inFlight.delete(job.id);
            this.wake?.();
          });
          this.inFlight.set(job.id, p);
        }
      } catch (err) {
        this.logger.error({ event: 'worker.loop.error', err: { message: errorMessage(err) } }, 'worker loop error');
      }
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, this.options.pollIntervalMs);
        this.wake = () => {
          clearTimeout(t);
          resolve();
        };
      });
      this.wake = null;
    }
  }

  private async housekeeping(): Promise<void> {
    const reaped = await reapExpiredLeases(this.db, this.clock.now());
    if (reaped.requeued || reaped.failed) {
      this.logger.warn({ event: 'jobs.lease.expired', ...reaped }, 'requeued jobs with expired leases');
    }
    if (this.metrics) {
      const depth = await queueDepth(this.db);
      for (const [status, n] of Object.entries(depth)) this.metrics.jobQueueDepth.set({ status }, n);
    }
  }

  private async execute(job: ClaimedJob): Promise<void> {
    const type = job.type as JobType;
    const handler = JOB_TYPES.includes(type) ? this.handlers[type] : undefined;
    const log = this.logger.child({ jobId: job.id, jobType: job.type, businessId: job.business_id, attempt: job.attempts });
    const started = performance.now();
    const heartbeat = setInterval(
      () => {
        extendLease(this.db, job.id, this.workerId, this.clock.now(), this.options.leaseSeconds).catch((err: unknown) =>
          log.warn({ event: 'jobs.lease.extend_failed', err: { message: errorMessage(err) } }, 'lease extension failed'),
        );
      },
      Math.max(1_000, (this.options.leaseSeconds * 1000) / 3),
    );
    heartbeat.unref();
    try {
      if (!handler) throw new PermanentJobError(`no handler registered for job type ${job.type}`);
      const outcome = (await handler(job, { workerId: this.workerId, logger: log })) ?? 'OK';
      const ok = await completeJob(this.db, job.id, this.workerId, this.clock.now(), outcome);
      if (!ok) log.warn({ event: 'jobs.complete.lost_ownership' }, 'job completed after losing its lease');
      this.metrics?.jobsProcessed.inc({ type: job.type, outcome });
    } catch (err) {
      const message = errorMessage(err);
      if (err instanceof DeferJobError) {
        await deferJob(this.db, job, this.workerId, this.clock.now(), err.delayMs, message);
        this.metrics?.jobsProcessed.inc({ type: job.type, outcome: 'DEFERRED' });
        log.info({ event: 'jobs.deferred', reason: message, delayMs: err.delayMs }, 'job deferred');
      } else {
        const retryable = !(err instanceof PermanentJobError);
        const delayMs =
          err instanceof RetryableJobError && err.delayMs !== undefined
            ? err.delayMs
            : backoffDelayMs(job.attempts, { baseMs: 2_000, maxMs: 5 * 60_000 });
        const result = await failJob(this.db, job, this.workerId, this.clock.now(), message, { retryable, delayMs });
        this.metrics?.jobsProcessed.inc({ type: job.type, outcome: result });
        const level = result === 'FAILED' ? 'error' : 'warn';
        log[level]({ event: 'jobs.failed', result, retryable, delayMs, err: { message, name: (err as Error).name } }, 'job attempt failed');
      }
    } finally {
      clearInterval(heartbeat);
      this.metrics?.jobDurationSeconds.observe({ type: job.type }, (performance.now() - started) / 1000);
    }
  }
}
