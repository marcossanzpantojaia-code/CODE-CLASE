import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app.js';
import type { DB } from '../../src/db/database.js';
import { textMessage } from '../../src/messaging/content.js';
import { enqueueOutboundMessage } from '../../src/messaging/outbound.service.js';
import { recordStatusEvent } from '../../src/messaging/status.service.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { MutableClock, TEST_NOW } from '../helpers/clock.js';
import { FakeGraphApi } from '../helpers/fake-graph-api.js';
import { PILOT_PHONE_NUMBER_ID, createCustomer, pilotSalonConfig, seedTenant, type SeededTenant } from '../helpers/fixtures.js';
import { createTestApp } from '../helpers/test-app.js';

describe('Outbound sender (WhatsApp Cloud API boundary over HTTP)', () => {
  let tdb: TestDatabase;
  let db: DB;
  let app: App;
  let salon: SeededTenant;
  let conversationId: string;
  const clock = new MutableClock(TEST_NOW);
  const graph = new FakeGraphApi();

  beforeAll(async () => {
    tdb = await createTestDatabase();
    db = tdb.handle.db;
    await graph.start();
    salon = await seedTenant(db, pilotSalonConfig(), { receptionist: true });
    app = await createTestApp({ databaseUrl: tdb.url, clock, graphUrl: graph.url, role: 'worker' });
  });
  afterAll(async () => {
    await app.stop('test');
    await graph.stop();
    await tdb.drop();
  });
  beforeEach(async () => {
    clock.set(TEST_NOW);
    graph.reset();
    app.breakers.whatsapp.recordSuccess();
    for (const t of ['jobs', 'incidents', 'crm_events', 'message_status_events', 'messages', 'appointment_services', 'appointments', 'conversations', 'customers'] as const) {
      await db.deleteFrom(t).execute();
    }
    const customerId = await createCustomer(db, salon.business.id, '+34612345678', 'Marcos');
    const conv = await db
      .insertInto('conversations')
      .values({ business_id: salon.business.id, customer_id: customerId, whatsapp_channel_id: salon.ids.channelId, last_inbound_at: clock.now() })
      .returning('id')
      .executeTakeFirstOrThrow();
    conversationId = conv.id;
  });

  const queue = (text: string, extra: { key?: string; expiresAt?: Date; purpose?: 'REPLY' | 'REMINDER'; appointmentId?: string; appointmentVersion?: number } = {}) =>
    db.transaction().execute((trx) =>
      enqueueOutboundMessage(trx, {
        businessId: salon.business.id,
        conversationId,
        content: textMessage(text),
        purpose: extra.purpose ?? 'REPLY',
        idempotencyKey: extra.key ?? `k-${text}`,
        expiresAt: extra.expiresAt ?? null,
        appointmentId: extra.appointmentId ?? null,
        appointmentVersion: extra.appointmentVersion ?? null,
        now: clock.now(),
      }),
    );
  const message = (id: string) => db.selectFrom('messages').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
  const job = (messageId: string) => db.selectFrom('jobs').selectAll().where('dedupe_key', '=', `send:${messageId}`).executeTakeFirstOrThrow();

  it('sends with the channel token and records the provider message id (accepted)', async () => {
    const { messageId } = await queue('Hola Marcos 👋');
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(1);
    expect(graph.sent[0]).toMatchObject({ phoneNumberId: PILOT_PHONE_NUMBER_ID, authorization: 'Bearer test-whatsapp-token' });
    expect(graph.sent[0]?.body).toMatchObject({ to: '34612345678', type: 'text', text: { body: 'Hola Marcos 👋' } });
    const m = await message(messageId);
    expect(m).toMatchObject({ status: 'ACCEPTED', provider_message_id: graph.sent[0]?.wamid, attempts: 1 });
    expect(m.accepted_at?.toISOString()).toBe(clock.now().toISOString());
  });

  it('idempotency: the same logical reply is stored and sent once', async () => {
    const a = await queue('Perfecto ✅', { key: 'reply:wamid.X:0' });
    const b = await queue('Perfecto ✅', { key: 'reply:wamid.X:0' });
    expect(b).toEqual({ messageId: a.messageId, created: false });
    await app.worker!.drain();
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(1);
  });

  it('transient 5xx is retried with backoff and then delivered', async () => {
    graph.failNext({ status: 500, body: { error: { message: 'Something went wrong', code: 131000 } } });
    const { messageId } = await queue('hola');
    await app.worker!.drain();
    expect((await message(messageId)).status).toBe('QUEUED');
    const j = await job(messageId);
    expect(j.status).toBe('PENDING');
    expect(j.run_at.getTime()).toBeGreaterThan(clock.now().getTime());
    clock.advanceMs(10 * 60_000);
    await app.worker!.drain();
    expect((await message(messageId)).status).toBe('ACCEPTED');
    expect(graph.sent).toHaveLength(1);
  });

  it('429 rate limit honours Retry-After', async () => {
    graph.failNext({ status: 429, body: { error: { message: 'Rate limit hit', code: 130429 } }, headers: { 'retry-after': '45' } });
    const { messageId } = await queue('hola');
    await app.worker!.drain();
    const j = await job(messageId);
    expect(j.run_at.toISOString()).toBe(new Date(clock.now().getTime() + 45_000).toISOString());
  });

  it('permanent errors are not retried: outside 24h window (131047) fails and is recorded', async () => {
    graph.failNext({ status: 400, body: { error: { message: 'Re-engagement message', code: 131047 } } });
    const { messageId } = await queue('hola');
    await app.worker!.drain();
    expect((await message(messageId)).status).toBe('FAILED');
    expect((await job(messageId)).status).toBe('FAILED');
    const incident = await db.selectFrom('incidents').selectAll().executeTakeFirstOrThrow();
    expect(incident).toMatchObject({ kind: 'WHATSAPP_SEND_FAILURE', severity: 'WARNING' });
  });

  it('auth failure (expired token) fails fast, raises a CRITICAL incident and hands the conversation to a human', async () => {
    graph.failNext({ status: 401, body: { error: { message: 'Error validating access token', code: 190, type: 'OAuthException' } } });
    const { messageId } = await queue('hola');
    await app.worker!.drain();
    expect((await message(messageId)).status).toBe('FAILED');
    const incident = await db.selectFrom('incidents').selectAll().executeTakeFirstOrThrow();
    expect(incident).toMatchObject({ kind: 'WHATSAPP_AUTH_FAILURE', severity: 'CRITICAL' });
    const conv = await db.selectFrom('conversations').selectAll().executeTakeFirstOrThrow();
    expect(conv).toMatchObject({ needs_human: true, needs_human_reason: 'SEND_FAILED_AUTH' });
  });

  it('a reply that could not be sent in time is dropped (no zombie answers) and flagged for a human', async () => {
    graph.failNext({ status: 503 }, { status: 503 }, { status: 503 });
    const { messageId } = await queue('¿Con cuál te quedas?', { expiresAt: new Date(clock.now().getTime() + 5 * 60_000) });
    await app.worker!.drain();
    clock.advanceMs(6 * 60_000);
    await app.worker!.drain();
    expect((await message(messageId)).status).toBe('CANCELLED');
    expect((await db.selectFrom('conversations').select('needs_human').executeTakeFirstOrThrow()).needs_human).toBe(true);
  });

  it('free-form messages are never attempted outside the 24h customer-service window', async () => {
    await db.updateTable('conversations').set({ last_inbound_at: new Date(clock.now().getTime() - 25 * 3_600_000) }).execute();
    const { messageId } = await queue('hola');
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(0);
    expect(await message(messageId)).toMatchObject({ status: 'FAILED', processing_outcome: 'OUTSIDE_SERVICE_WINDOW' });
  });

  it('reminders for a cancelled appointment are never sent', async () => {
    const appt = await db
      .insertInto('appointments')
      .values({
        business_id: salon.business.id,
        customer_id: (await db.selectFrom('customers').select('id').executeTakeFirstOrThrow()).id,
        staff_id: salon.staff('Juan'),
        starts_at: new Date('2026-10-15T16:30:00Z'),
        ends_at: new Date('2026-10-15T17:15:00Z'),
        occupied_until: new Date('2026-10-15T17:15:00Z'),
        source: 'WHATSAPP',
        currency: 'EUR',
        status: 'CANCELLED',
        version: 2,
        created_at: clock.now(),
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    const { messageId } = await queue('⏰ Recordatorio', { purpose: 'REMINDER', appointmentId: appt.id, appointmentVersion: 1 });
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(0);
    expect(await message(messageId)).toMatchObject({ status: 'CANCELLED', processing_outcome: 'APPOINTMENT_CHANGED' });
  });

  it('messages of one conversation leave in order even when the first one needs a retry', async () => {
    graph.failNext({ status: 503 });
    await queue('primero', { key: 'a' });
    await queue('segundo', { key: 'b' });
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(0); // "segundo" waits behind "primero"
    clock.advanceMs(10 * 60_000);
    await app.worker!.drain();
    expect(graph.textsTo('34612345678')).toEqual(['primero', 'segundo']);
  });

  it('a status webhook that arrives before the send completes is applied afterwards', async () => {
    const { messageId } = await queue('hola');
    // Meta assigns wamid.FAKE000001 to the first send in this fake; record its 'delivered' first.
    await recordStatusEvent(db, { businessId: salon.business.id, providerMessageId: 'wamid.FAKE000001', status: 'delivered', occurredAt: clock.now(), errors: null });
    await app.worker!.drain();
    const m = await message(messageId);
    expect(m.provider_message_id).toBe('wamid.FAKE000001');
    expect(m.status).toBe('DELIVERED');
    expect(m.delivered_at?.toISOString()).toBe(clock.now().toISOString());
  });

  it('circuit breaker: after repeated provider failures sends are deferred instead of hammering Meta', async () => {
    for (let i = 0; i < 5; i++) app.breakers.whatsapp.recordFailure();
    const { messageId } = await queue('hola');
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(0);
    const j = await job(messageId);
    expect(j).toMatchObject({ status: 'PENDING', attempts: 0 });
    clock.advanceMs(31_000);
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(1);
  });
});

describe('Outbound kill switch (OUTBOUND_MESSAGING_ENABLED=false)', () => {
  it('holds messages without losing them or burning retries', async () => {
    const tdb = await createTestDatabase();
    const clock = new MutableClock(TEST_NOW);
    const graph = new FakeGraphApi();
    await graph.start();
    const salon = await seedTenant(tdb.handle.db, pilotSalonConfig(), { receptionist: true });
    const app = await createTestApp({ databaseUrl: tdb.url, clock, graphUrl: graph.url, role: 'worker', env: { OUTBOUND_MESSAGING_ENABLED: 'false' } });
    try {
      const customerId = await createCustomer(tdb.handle.db, salon.business.id, '+34612345678');
      const conv = await tdb.handle.db
        .insertInto('conversations')
        .values({ business_id: salon.business.id, customer_id: customerId, last_inbound_at: clock.now() })
        .returning('id')
        .executeTakeFirstOrThrow();
      const { messageId } = await enqueueOutboundMessage(tdb.handle.db, {
        businessId: salon.business.id,
        conversationId: conv.id,
        content: textMessage('hola'),
        purpose: 'REPLY',
        idempotencyKey: 'k',
        now: clock.now(),
      });
      await app.worker!.drain();
      expect(graph.sent).toHaveLength(0);
      const j = await tdb.handle.db.selectFrom('jobs').selectAll().where('dedupe_key', '=', `send:${messageId}`).executeTakeFirstOrThrow();
      expect(j).toMatchObject({ status: 'PENDING', attempts: 0 });
      expect((await tdb.handle.db.selectFrom('messages').select('status').where('id', '=', messageId).executeTakeFirstOrThrow()).status).toBe('QUEUED');
    } finally {
      await app.stop('test');
      await graph.stop();
      await tdb.drop();
    }
  });
});
