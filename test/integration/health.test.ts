import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { App } from '../../src/app.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { MutableClock, TEST_NOW } from '../helpers/clock.js';
import { createTestApp } from '../helpers/test-app.js';
import { buildServer } from '../../src/http/server.js';

describe('Health checks and metrics', () => {
  let tdb: TestDatabase;
  let app: App;
  const clock = new MutableClock(TEST_NOW);

  beforeAll(async () => {
    tdb = await createTestDatabase();
    app = await createTestApp({ databaseUrl: tdb.url, clock });
    await app.start();
  });
  afterAll(async () => {
    await app.stop('test');
    await tdb.drop();
  });

  it('/health/live is always cheap and 200', async () => {
    const res = await app.server!.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
  });

  it('/health/ready checks DB, migrations, worker and WhatsApp config; reports LLM without calling it', async () => {
    const res = await app.server!.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      status: 'ready',
      checks: { database: 'ok', migrations: 'ok', worker: 'ok', whatsapp: { configured: true, circuit: 'CLOSED' }, llm: { configured: true, circuit: 'CLOSED' } },
    });
  });

  it('/metrics exposes the business and reliability metrics (non-production without token)', async () => {
    const res = await app.server!.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    for (const name of [
      'messages_received_total',
      'messages_sent_total',
      'intent_detection_latency_seconds',
      'availability_queries_total',
      'appointments_created_total',
      'booking_intents_total',
      'human_handoff_total',
      'llm_failures_total',
      'whatsapp_failures_total',
      'duplicate_webhooks_total',
      'reply_latency_seconds',
    ]) {
      expect(res.body).toContain(name);
    }
  });

  it('/metrics is never public in a production deployment, even if APP_ENV was left unset', async () => {
    const prodLike = { NODE_ENV: 'production', APP_ENV: 'development' };
    const noToken = await createTestApp({ databaseUrl: tdb.url, clock, role: 'web', env: prodLike });
    try {
      expect((await noToken.server!.inject({ method: 'GET', url: '/metrics' })).statusCode).toBe(404);
    } finally {
      await noToken.stop('test');
    }
    const token = 'metrics-token-0123456789abcdef';
    const withToken = await createTestApp({ databaseUrl: tdb.url, clock, role: 'web', env: { ...prodLike, METRICS_TOKEN: token } });
    try {
      const get = (authorization?: string) =>
        withToken.server!.inject({ method: 'GET', url: '/metrics', headers: authorization ? { authorization } : {} });
      expect((await get()).statusCode).toBe(401);
      expect((await get(`Bearer ${token}x`)).statusCode).toBe(401);
      expect((await get(token)).statusCode).toBe(401);
      const ok = await get(`Bearer ${token}`);
      expect(ok.statusCode).toBe(200);
      expect(ok.body).toContain('messages_received_total');
    } finally {
      await withToken.stop('test');
    }
  });

  it('readiness fails when the database is unreachable (webhooks must not be accepted)', async () => {
    const broken = await createTestApp({ databaseUrl: 'postgres://nobody@127.0.0.1:1/none', clock, role: 'web' });
    try {
      const res = await broken.server!.inject({ method: 'GET', url: '/health/ready' });
      expect(res.statusCode).toBe(503);
      expect(res.json<{ checks: { database: string } }>().checks.database).toBe('error');
      // Public endpoint: no connection details (host, port, user) in the response.
      expect(res.body).not.toMatch(/127\.0\.0\.1|ECONNREFUSED|nobody/);
    } finally {
      await broken.stop('test');
    }
  });

  it('while draining (SIGTERM received) readiness answers 503 so the load balancer stops routing', async () => {
    const draining = await buildServer({
      config: app.config,
      db: app.db,
      clock,
      logger: app.logger,
      metrics: app.metrics,
      inbound: app.services.inbound,
      availability: app.services.availability,
      booking: app.services.booking,
      breakers: app.breakers,
      worker: app.worker ?? undefined,
      isDraining: () => true,
    });
    const res = await draining.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ status: 'draining' });
    await draining.close();
  });

  it('stop() is graceful and idempotent', async () => {
    const other = await createTestApp({ databaseUrl: tdb.url, clock, role: 'web' });
    await Promise.all([other.stop('SIGTERM'), other.stop('SIGTERM')]);
    expect(other.isDraining()).toBe(true);
  });
});
