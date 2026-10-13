import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { cancelJobGroup, claimNextJob, completeJob, enqueueJob, failJob, reapExpiredLeases } from '../../src/jobs/queue.js';
import { DeferJobError, PermanentJobError, Worker } from '../../src/jobs/worker.js';
import { createSilentLogger } from '../../src/observability/logger.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { MutableClock, TEST_NOW } from '../helpers/clock.js';

describe('PostgreSQL job queue (outbox + scheduler)', () => {
  let tdb: TestDatabase;
  let db: DB;
  const clock = new MutableClock(TEST_NOW);

  beforeAll(async () => {
    tdb = await createTestDatabase(20);
    db = tdb.handle.db;
  });
  afterAll(async () => {
    await tdb.drop();
  });
  beforeEach(async () => {
    clock.set(TEST_NOW);
    await db.deleteFrom('jobs').execute();
  });

  const enqueue = (o: { key?: string; dedupe?: string; group?: string; runAt?: Date; n?: number }) =>
    enqueueJob(db, {
      type: 'outbound.send',
      businessId: null,
      payload: { n: o.n ?? 0 },
      runAt: o.runAt ?? clock.now(),
      concurrencyKey: o.key ?? null,
      dedupeKey: o.dedupe ?? null,
      groupKey: o.group ?? null,
    });

  it('dedupe key: the same logical job is enqueued once, ever', async () => {
    expect(await enqueue({ dedupe: 'inbound:wamid.1' })).not.toBeNull();
    expect(await enqueue({ dedupe: 'inbound:wamid.1' })).toBeNull();
    expect(await enqueue({ dedupe: 'inbound:wamid.1' })).toBeNull();
    const n = await db.selectFrom('jobs').select((eb) => eb.fn.countAll<number>().as('n')).executeTakeFirstOrThrow();
    expect(Number(n.n)).toBe(1);
  });

  it('jobs scheduled in the future are not claimable until due', async () => {
    await enqueue({ runAt: new Date(clock.now().getTime() + 60_000) });
    expect(await claimNextJob(db, { workerId: 'w1', now: clock.now(), leaseSeconds: 30 })).toBeNull();
    clock.advanceMs(60_000);
    expect(await claimNextJob(db, { workerId: 'w1', now: clock.now(), leaseSeconds: 30 })).not.toBeNull();
  });

  it('same concurrency key: strictly one at a time and in order, even with competing workers', async () => {
    for (let i = 1; i <= 3; i++) await enqueue({ key: 'conv:A:out', n: i });
    await enqueue({ key: 'conv:B:out', n: 99 });
    const claims = await Promise.all(['w1', 'w2', 'w3', 'w4'].map((w) => claimNextJob(db, { workerId: w, now: clock.now(), leaseSeconds: 30 })));
    const claimed = claims.filter((c) => c !== null);
    // Only the head of each key may run concurrently.
    expect(claimed.map((c) => c.payload.n).sort()).toEqual([1, 99]);
    const a1 = claimed.find((c) => c.payload.n === 1)!;
    expect(await claimNextJob(db, { workerId: 'w5', now: clock.now(), leaseSeconds: 30 })).toBeNull(); // A2 waits for A1
    await completeJob(db, a1.id, a1.locked_by!, clock.now(), 'OK');
    const next = await claimNextJob(db, { workerId: 'w5', now: clock.now(), leaseSeconds: 30 });
    expect(next?.payload.n).toBe(2);
  });

  it('a retry keeps its place: the next job of the key waits (no reordering of replies)', async () => {
    await enqueue({ key: 'conv:A:out', n: 1 });
    await enqueue({ key: 'conv:A:out', n: 2 });
    const j1 = (await claimNextJob(db, { workerId: 'w1', now: clock.now(), leaseSeconds: 30 }))!;
    expect(await failJob(db, j1, 'w1', clock.now(), 'boom', { retryable: true, delayMs: 10_000 })).toBe('RETRY');
    expect(await claimNextJob(db, { workerId: 'w2', now: clock.now(), leaseSeconds: 30 })).toBeNull();
    clock.advanceMs(10_000);
    expect((await claimNextJob(db, { workerId: 'w2', now: clock.now(), leaseSeconds: 30 }))?.payload.n).toBe(1);
  });

  it('worker crash: an expired lease is re-queued and the stale worker cannot complete it (fencing)', async () => {
    await enqueue({ n: 7 });
    const job = (await claimNextJob(db, { workerId: 'dead-worker', now: clock.now(), leaseSeconds: 30 }))!;
    clock.advanceMs(31_000);
    expect(await reapExpiredLeases(db, clock.now())).toEqual({ requeued: 1, failed: 0 });
    const again = (await claimNextJob(db, { workerId: 'w2', now: clock.now(), leaseSeconds: 30 }))!;
    expect(again.id).toBe(job.id);
    expect(again.attempts).toBe(2);
    expect(await completeJob(db, job.id, 'dead-worker', clock.now(), 'OK')).toBe(false);
    expect(await completeJob(db, job.id, 'w2', clock.now(), 'OK')).toBe(true);
  });

  it('cancelling a group cancels only pending jobs of that group', async () => {
    await enqueue({ group: 'appt:1', runAt: new Date(clock.now().getTime() + 3_600_000) });
    await enqueue({ group: 'appt:1', runAt: new Date(clock.now().getTime() + 7_200_000) });
    await enqueue({ group: 'appt:2', runAt: new Date(clock.now().getTime() + 3_600_000) });
    expect(await cancelJobGroup(db, 'appt:1', clock.now(), 'APPOINTMENT_CANCELLED')).toBe(2);
    const statuses = await db.selectFrom('jobs').select(['group_key', 'status']).orderBy('id').execute();
    expect(statuses.map((s) => `${s.group_key}:${s.status}`)).toEqual(['appt:1:CANCELLED', 'appt:1:CANCELLED', 'appt:2:PENDING']);
  });

  it('Worker: classifies handler errors (retry with backoff, permanent fail, defer without consuming attempts)', async () => {
    const seen: string[] = [];
    let attemptsOfFlaky = 0;
    const worker = new Worker(
      db,
      {
        'outbound.send': (job) => {
          const kind = String(job.payload.kind);
          seen.push(kind);
          if (kind === 'flaky' && ++attemptsOfFlaky < 3) return Promise.reject(new Error('transient'));
          if (kind === 'bad') return Promise.reject(new PermanentJobError('bad payload'));
          if (kind === 'held') return Promise.reject(new DeferJobError('kill switch', 60_000));
          return Promise.resolve('DONE_OK');
        },
      },
      { concurrency: 2, pollIntervalMs: 20, leaseSeconds: 30 },
      clock,
      createSilentLogger(),
    );
    for (const kind of ['flaky', 'bad', 'held']) await enqueueJob(db, { type: 'outbound.send', businessId: null, payload: { kind }, runAt: clock.now(), maxAttempts: 5 });
    for (let i = 0; i < 6; i++) {
      await worker.drain();
      clock.advanceMs(10 * 60_000); // let backoff/defer windows pass
    }
    const rows = await db.selectFrom('jobs').select(['payload', 'status', 'attempts', 'outcome']).execute();
    const byKind = Object.fromEntries(rows.map((r) => [String(r.payload.kind), r]));
    expect(byKind.flaky).toMatchObject({ status: 'DONE', attempts: 3, outcome: 'DONE_OK' });
    expect(byKind.bad).toMatchObject({ status: 'FAILED', attempts: 1 });
    expect(byKind.held?.status).toBe('PENDING');
    expect(byKind.held?.attempts).toBe(0); // deferrals never burn retry budget
  });

  it('Worker.stop() waits for in-flight jobs (graceful shutdown)', async () => {
    let finished = false;
    const worker = new Worker(
      db,
      {
        'outbound.send': async () => {
          await new Promise((r) => setTimeout(r, 300));
          finished = true;
          return 'OK';
        },
      },
      { concurrency: 1, pollIntervalMs: 10, leaseSeconds: 30 },
      clock,
      createSilentLogger(),
    );
    await enqueue({ n: 1 });
    worker.start();
    await new Promise((r) => setTimeout(r, 100)); // job is now running
    const res = await worker.stop(5_000);
    expect(res.drained).toBe(true);
    expect(finished).toBe(true);
    const row = await db.selectFrom('jobs').select('status').executeTakeFirstOrThrow();
    expect(row.status).toBe('DONE');
  });
});
