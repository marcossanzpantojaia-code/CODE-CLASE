import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app.js';
import type { DB } from '../../src/db/database.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { MutableClock, TEST_NOW } from '../helpers/clock.js';
import { OTHER_PHONE_NUMBER_ID, PILOT_PHONE_NUMBER_ID, otherSalonConfig, pilotSalonConfig, seedTenant, type SeededTenant } from '../helpers/fixtures.js';
import { createTestApp, TEST_APP_SECRET, TEST_VERIFY_TOKEN } from '../helpers/test-app.js';
import { mediaWebhook, nextWamid, signedRequest, statusWebhook, textWebhook } from '../helpers/webhooks.js';

describe('WhatsApp webhook (real HTTP stack + PostgreSQL)', () => {
  let tdb: TestDatabase;
  let db: DB;
  let app: App;
  let salon: SeededTenant;
  let other: SeededTenant;
  const clock = new MutableClock(TEST_NOW);

  beforeAll(async () => {
    tdb = await createTestDatabase();
    db = tdb.handle.db;
    salon = await seedTenant(db, pilotSalonConfig(), { receptionist: true });
    other = await seedTenant(db, otherSalonConfig(), { receptionist: true });
    app = await createTestApp({ databaseUrl: tdb.url, clock, role: 'web' });
  });
  afterAll(async () => {
    await app.stop('test');
    await tdb.drop();
  });
  beforeEach(async () => {
    for (const t of ['jobs', 'crm_events', 'message_status_events', 'messages', 'conversations', 'customers'] as const) await db.deleteFrom(t).execute();
  });

  const post = (body: unknown, opts: { secret?: string; signature?: string } = {}) => {
    const { payload, headers } = signedRequest(body, opts.secret ?? TEST_APP_SECRET);
    if (opts.signature !== undefined) headers['x-hub-signature-256'] = opts.signature;
    return app.server!.inject({ method: 'POST', url: '/webhooks/whatsapp', payload, headers });
  };

  it('GET verification echoes hub.challenge only with the right token', async () => {
    const ok = await app.server!.inject({ method: 'GET', url: `/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${TEST_VERIFY_TOKEN}&hub.challenge=12345` });
    expect(ok.statusCode).toBe(200);
    expect(ok.body).toBe('12345');
    const bad = await app.server!.inject({ method: 'GET', url: '/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345' });
    expect(bad.statusCode).toBe(403);
  });

  it('valid signed message: customer created (source WHATSAPP, no invented name), message stored, CRM updated, processing job queued', async () => {
    const wamid = nextWamid();
    const res = await post(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', wamid, at: clock.now(), text: 'Hola, quiero reservar un corte', profileName: 'Marquitos 🔥' }));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ messagesStored: 1, duplicates: 0 });
    const customer = await db.selectFrom('customers').selectAll().executeTakeFirstOrThrow();
    expect(customer).toMatchObject({ business_id: salon.business.id, phone_e164: '+34612345678', source: 'WHATSAPP', name: null, whatsapp_profile_name: 'Marquitos 🔥' });
    const msg = await db.selectFrom('messages').selectAll().executeTakeFirstOrThrow();
    expect(msg).toMatchObject({ direction: 'INBOUND', provider_message_id: wamid, text: 'Hola, quiero reservar un corte', status: 'RECEIVED' });
    const events = await db.selectFrom('crm_events').select('type').orderBy('created_at').execute();
    expect(events.map((e) => e.type).sort()).toEqual(['CUSTOMER_CREATED', 'MESSAGE_RECEIVED']);
    const jobs = await db.selectFrom('jobs').selectAll().execute();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ type: 'receptionist.process', concurrency_key: `conv:${msg.conversation_id}:in`, dedupe_key: `inbound:${wamid}` });
  });

  it('invalid or missing signature -> 401 and nothing is stored', async () => {
    const body = textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), text: 'hola' });
    expect((await post(body, { signature: 'sha256=' + '0'.repeat(64) })).statusCode).toBe(401);
    expect((await post(body, { secret: 'attacker-secret-xxxxxxxxxxxx' })).statusCode).toBe(401);
    expect((await post(body, { signature: '' })).statusCode).toBe(401);
    expect(await db.selectFrom('messages').selectAll().execute()).toHaveLength(0);
  });

  it('the same wamid delivered 3 times (also concurrently) is processed exactly once', async () => {
    const wamid = nextWamid();
    const body = textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', wamid, at: clock.now(), text: 'Hola' });
    const results = await Promise.all([post(body), post(body), post(body)]);
    expect(results.every((r) => r.statusCode === 200)).toBe(true);
    expect(results.reduce((n, r) => n + r.json<{ messagesStored: number }>().messagesStored, 0)).toBe(1);
    expect(await db.selectFrom('messages').selectAll().execute()).toHaveLength(1);
    expect(await db.selectFrom('jobs').selectAll().execute()).toHaveLength(1);
    expect((await db.selectFrom('crm_events').select('type').where('type', '=', 'MESSAGE_RECEIVED').execute()).length).toBe(1);
    // A later redelivery (Meta retries for days) is also ignored.
    expect((await post(body)).json()).toMatchObject({ messagesStored: 0, duplicates: 1 });
  });

  it('same phone, existing customer: reused; same phone on another tenant: a different customer', async () => {
    await post(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), text: 'uno' }));
    await post(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), text: 'dos' }));
    await post(textWebhook({ phoneNumberId: OTHER_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), text: 'tres' }));
    const customers = await db.selectFrom('customers').select(['business_id', 'phone_e164']).execute();
    expect(customers).toHaveLength(2);
    expect(new Set(customers.map((c) => c.business_id))).toEqual(new Set([salon.business.id, other.business.id]));
    const convs = await db.selectFrom('conversations').select('business_id').execute();
    expect(convs).toHaveLength(2);
  });

  it('webhooks for an unknown phone_number_id are acknowledged but ignored (no tenant guessing)', async () => {
    const res = await post(textWebhook({ phoneNumberId: '999999999999', from: '34612345678', at: clock.now(), text: 'hola' }));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ messagesStored: 0, ignored: 1 });
    expect(await db.selectFrom('customers').selectAll().execute()).toHaveLength(0);
  });

  it('reactions are stored but never answered; audio is queued for a polite text-only reply', async () => {
    await post(mediaWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), type: 'reaction' }));
    await post(mediaWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), type: 'audio' }));
    const msgs = await db.selectFrom('messages').select(['content_type', 'status']).orderBy('created_at').execute();
    expect(msgs).toEqual([
      { content_type: 'reaction', status: 'PROCESSED' },
      { content_type: 'audio', status: 'RECEIVED' },
    ]);
    expect(await db.selectFrom('jobs').selectAll().execute()).toHaveLength(1);
  });

  it('delivery statuses arriving out of order and duplicated converge to the right state', async () => {
    await post(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), text: 'hola' }));
    const conv = await db.selectFrom('conversations').select('id').executeTakeFirstOrThrow();
    const out = await db
      .insertInto('messages')
      .values({
        business_id: salon.business.id,
        conversation_id: conv.id,
        direction: 'OUTBOUND',
        provider_message_id: 'wamid.OUT1',
        content_type: 'text',
        text: 'x',
        payload: '{}',
        status: 'ACCEPTED',
        created_at: clock.now(),
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    const t = (s: number) => new Date(clock.now().getTime() + s * 1000);
    await post(statusWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, wamid: 'wamid.OUT1', status: 'read', at: t(30), recipient: '34612345678' }));
    await post(statusWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, wamid: 'wamid.OUT1', status: 'sent', at: t(10), recipient: '34612345678' }));
    await post(statusWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, wamid: 'wamid.OUT1', status: 'delivered', at: t(20), recipient: '34612345678' }));
    await post(statusWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, wamid: 'wamid.OUT1', status: 'delivered', at: t(20), recipient: '34612345678' }));
    const msg = await db.selectFrom('messages').selectAll().where('id', '=', out.id).executeTakeFirstOrThrow();
    expect(msg.status).toBe('READ');
    expect(msg.sent_at?.toISOString()).toBe(t(10).toISOString());
    expect(msg.delivered_at?.toISOString()).toBe(t(20).toISOString());
    expect(msg.read_at?.toISOString()).toBe(t(30).toISOString());
  });

  it('a failed delivery status records the provider error', async () => {
    await post(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612345678', at: clock.now(), text: 'hola' }));
    const conv = await db.selectFrom('conversations').select('id').executeTakeFirstOrThrow();
    await db
      .insertInto('messages')
      .values({ business_id: salon.business.id, conversation_id: conv.id, direction: 'OUTBOUND', provider_message_id: 'wamid.OUT2', content_type: 'text', text: 'x', payload: '{}', status: 'ACCEPTED', created_at: clock.now() })
      .execute();
    await post(
      statusWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, wamid: 'wamid.OUT2', status: 'failed', at: clock.now(), recipient: '34612345678', errors: [{ code: 131026, title: 'Message undeliverable' }] }),
    );
    const msg = await db.selectFrom('messages').selectAll().where('provider_message_id', '=', 'wamid.OUT2').executeTakeFirstOrThrow();
    expect(msg.status).toBe('FAILED');
    expect(msg.provider_error).toMatchObject({ errors: [{ code: 131026 }] });
  });

  it('malformed JSON -> 400; non-WhatsApp objects are ignored', async () => {
    const bad = await app.server!.inject({
      method: 'POST',
      url: '/webhooks/whatsapp',
      payload: '{not json',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=' + '0'.repeat(64) },
    });
    expect(bad.statusCode).toBe(400);
    const res = await post({ object: 'page', entry: [] });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ignored: 1 });
  });
});
