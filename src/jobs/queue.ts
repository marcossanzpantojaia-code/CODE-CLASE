import { sql } from 'kysely';
import { json, type DB, type Executor } from '../db/database.js';
import type { Job } from '../db/types.js';
import { addMs, addSeconds } from '../shared/clock.js';

/**
 * Durable job queue on PostgreSQL.
 *
 * Why not Redis/BullMQ: enqueueing happens inside the same transaction as the
 * business change (appointment created -> reminder jobs; reply decided ->
 * send job). That *is* a transactional outbox: either both commit or neither
 * does. PostgreSQL is already the source of truth, so no extra infrastructure
 * and no dual-write window.
 *
 * Guarantees
 *  - dedupe_key: a logical job is enqueued at most once, ever.
 *  - concurrency_key: jobs sharing a key run one at a time, strictly in id
 *    order (per-conversation serialisation of inbound processing and of
 *    outbound sends).
 *  - leases: a RUNNING job whose lease expires (worker crash) is re-queued;
 *    completion is fenced by locked_by so a stale worker cannot overwrite it.
 */

export const JOB_TYPES = ['receptionist.process', 'outbound.send', 'appointment.notify'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export interface EnqueueOptions {
  type: JobType;
  payload: Record<string, unknown>;
  businessId: string | null;
  runAt: Date;
  maxAttempts?: number;
  concurrencyKey?: string | null;
  dedupeKey?: string | null;
  groupKey?: string | null;
}

/** Inserts a job; returns null when a job with the same dedupe key already exists. */
export async function enqueueJob(db: Executor, options: EnqueueOptions): Promise<{ id: number } | null> {
  const row = await db
    .insertInto('jobs')
    .values({
      type: options.type,
      payload: json(options.payload),
      business_id: options.businessId,
      run_at: options.runAt,
      max_attempts: options.maxAttempts ?? 8,
      concurrency_key: options.concurrencyKey ?? null,
      dedupe_key: options.dedupeKey ?? null,
      group_key: options.groupKey ?? null,
    })
    .onConflict((oc) => oc.column('dedupe_key').where('dedupe_key', 'is not', null).doNothing())
    .returning('id')
    .executeTakeFirst();
  return row ? { id: row.id } : null;
}

/** Cancels every PENDING job of a group (e.g. all reminders of an appointment). */
export async function cancelJobGroup(db: Executor, groupKey: string, now: Date, reason: string): Promise<number> {
  const res = await db
    .updateTable('jobs')
    .set({ status: 'CANCELLED', finished_at: now, outcome: reason, locked_by: null, locked_until: null })
    .where('group_key', '=', groupKey)
    .where('status', '=', 'PENDING')
    .executeTakeFirst();
  return Number(res.numUpdatedRows);
}

export interface ClaimedJob extends Job {
  payload: Record<string, unknown>;
}

/**
 * Atomically claims the next runnable job. A job with a concurrency key is
 * runnable only if no job with the same key is RUNNING and no older job with
 * the same key is still PENDING (strict FIFO per key).
 */
export async function claimNextJob(
  db: DB,
  params: { workerId: string; now: Date; leaseSeconds: number; types?: readonly JobType[] },
): Promise<ClaimedJob | null> {
  const types = params.types ?? JOB_TYPES;
  const lockedUntil = addSeconds(params.now, params.leaseSeconds);
  const result = await sql<ClaimedJob>`
    WITH candidate AS (
      SELECT j.id
      FROM jobs j
      WHERE j.status = 'PENDING'
        AND j.run_at <= ${params.now}
        AND j.type = ANY(${sql.val([...types])}::text[])
        AND (
          j.concurrency_key IS NULL
          OR (
            NOT EXISTS (
              SELECT 1 FROM jobs r
              WHERE r.concurrency_key = j.concurrency_key AND r.status = 'RUNNING'
            )
            AND NOT EXISTS (
              SELECT 1 FROM jobs e
              WHERE e.concurrency_key = j.concurrency_key AND e.status = 'PENDING' AND e.id < j.id
            )
          )
        )
      ORDER BY j.run_at, j.id
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE jobs
    SET status = 'RUNNING',
        attempts = jobs.attempts + 1,
        locked_by = ${params.workerId},
        locked_until = ${lockedUntil}
    FROM candidate
    WHERE jobs.id = candidate.id
    RETURNING jobs.*`.execute(db);
  return result.rows[0] ?? null;
}

/** Extends the lease of a job still owned by this worker. Returns false if ownership was lost. */
export async function extendLease(db: DB, jobId: number, workerId: string, now: Date, leaseSeconds: number): Promise<boolean> {
  const res = await db
    .updateTable('jobs')
    .set({ locked_until: addSeconds(now, leaseSeconds) })
    .where('id', '=', jobId)
    .where('locked_by', '=', workerId)
    .where('status', '=', 'RUNNING')
    .executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}

export async function completeJob(db: DB, jobId: number, workerId: string, now: Date, outcome: string): Promise<boolean> {
  const res = await db
    .updateTable('jobs')
    .set({ status: 'DONE', outcome, finished_at: now, locked_by: null, locked_until: null, last_error: null })
    .where('id', '=', jobId)
    .where('locked_by', '=', workerId)
    .where('status', '=', 'RUNNING')
    .executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}

/** Records a failed attempt: retry later, or fail permanently when out of attempts / not retryable. */
export async function failJob(
  db: DB,
  job: ClaimedJob,
  workerId: string,
  now: Date,
  error: string,
  retry: { retryable: boolean; delayMs: number },
): Promise<'RETRY' | 'FAILED' | 'LOST'> {
  const willRetry = retry.retryable && job.attempts < job.max_attempts;
  const res = await db
    .updateTable('jobs')
    .set(
      willRetry
        ? { status: 'PENDING', run_at: addMs(now, retry.delayMs), last_error: error.slice(0, 2000), locked_by: null, locked_until: null }
        : { status: 'FAILED', finished_at: now, last_error: error.slice(0, 2000), outcome: 'FAILED', locked_by: null, locked_until: null },
    )
    .where('id', '=', job.id)
    .where('locked_by', '=', workerId)
    .where('status', '=', 'RUNNING')
    .executeTakeFirst();
  if (Number(res.numUpdatedRows) !== 1) return 'LOST';
  return willRetry ? 'RETRY' : 'FAILED';
}

/** Puts a job back without consuming an attempt (kill switch active, circuit open...). */
export async function deferJob(db: DB, job: ClaimedJob, workerId: string, now: Date, delayMs: number, reason: string): Promise<boolean> {
  const res = await db
    .updateTable('jobs')
    .set({
      status: 'PENDING',
      attempts: Math.max(0, job.attempts - 1),
      run_at: addMs(now, delayMs),
      last_error: reason.slice(0, 2000),
      locked_by: null,
      locked_until: null,
    })
    .where('id', '=', job.id)
    .where('locked_by', '=', workerId)
    .where('status', '=', 'RUNNING')
    .executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}

/**
 * Re-queues RUNNING jobs whose lease expired (their worker died or hung).
 * Jobs that already used all their attempts are marked FAILED.
 */
export async function reapExpiredLeases(db: DB, now: Date): Promise<{ requeued: number; failed: number }> {
  const requeued = await db
    .updateTable('jobs')
    .set({ status: 'PENDING', locked_by: null, locked_until: null, last_error: 'lease expired (worker lost)' })
    .where('status', '=', 'RUNNING')
    .where('locked_until', '<', now)
    .whereRef('attempts', '<', 'max_attempts')
    .executeTakeFirst();
  const failed = await db
    .updateTable('jobs')
    .set({ status: 'FAILED', finished_at: now, outcome: 'FAILED', locked_by: null, locked_until: null, last_error: 'lease expired on last attempt' })
    .where('status', '=', 'RUNNING')
    .where('locked_until', '<', now)
    .whereRef('attempts', '>=', 'max_attempts')
    .executeTakeFirst();
  return { requeued: Number(requeued.numUpdatedRows), failed: Number(failed.numUpdatedRows) };
}

export async function queueDepth(db: DB): Promise<Record<string, number>> {
  const rows = await db
    .selectFrom('jobs')
    .select(['status', (eb) => eb.fn.countAll<number>().as('n')])
    .where('status', 'in', ['PENDING', 'RUNNING', 'FAILED'])
    .groupBy('status')
    .execute();
  const out: Record<string, number> = { PENDING: 0, RUNNING: 0, FAILED: 0 };
  for (const r of rows) out[r.status] = Number(r.n);
  return out;
}

/** Deletes finished jobs older than the retention window. */
export async function purgeFinishedJobs(db: DB, olderThan: Date): Promise<number> {
  const res = await db
    .deleteFrom('jobs')
    .where('status', 'in', ['DONE', 'CANCELLED', 'FAILED'])
    .where('finished_at', '<', olderThan)
    .executeTakeFirst();
  return Number(res.numDeletedRows);
}
