import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app.js';
import type { DB } from '../../src/db/database.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { TickingClock } from '../helpers/clock.js';
import { CustomerSim } from '../helpers/customer-sim.js';
import { FakeAnthropic } from '../helpers/fake-anthropic.js';
import { buttonTitles, FakeGraphApi } from '../helpers/fake-graph-api.js';
import { createCustomer, madrid, PILOT_PHONE_NUMBER_ID, pilotSalonConfig, seedTenant, type SeededTenant } from '../helpers/fixtures.js';
import { createTestApp, TEST_APP_SECRET } from '../helpers/test-app.js';
import { nextWamid, signedRequest, statusWebhook, textWebhook } from '../helpers/webhooks.js';

/**
 * Full-system E2E: the real service listens on a TCP port and runs its worker
 * loop; webhooks are signed and POSTed over HTTP; the real Claude adapter calls
 * a Messages-API-compatible HTTP server and the real WhatsApp client calls a
 * Graph-API-compatible HTTP server; PostgreSQL is real.
 *
 * What this does NOT prove: that Meta delivers to a real phone or that the
 * real model interprets Spanish as scripted here. Those require STAGING and
 * PRODUCTION verification (docs/VERIFICACION.md).
 */
describe('E2E: WhatsApp receptionist over HTTP with a running worker', () => {
  let tdb: TestDatabase;
  let db: DB;
  let app: App;
  let salon: SeededTenant;
  let baseUrl: string;
  const graph = new FakeGraphApi();
  const anthropic = new FakeAnthropic();
  let clock: TickingClock;

  const customer = (waId: string) => new CustomerSim(app, graph, clock, PILOT_PHONE_NUMBER_ID, waId, { kind: 'http', baseUrl });
  const until = async (predicate: () => Promise<boolean>, timeoutMs = 10_000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await predicate()) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('condition not met in time');
  };

  const startApp = async () => {
    const a = await createTestApp({ databaseUrl: tdb.url, clock, graphUrl: graph.url, anthropicUrl: anthropic.url, env: { INBOUND_DEBOUNCE_MS: '300' } });
    await a.start();
    return a;
  };

  beforeAll(async () => {
    tdb = await createTestDatabase(20);
    db = tdb.handle.db;
    await graph.start();
    await anthropic.start();
    salon = await seedTenant(db, pilotSalonConfig(), { receptionist: true });
  });
  afterAll(async () => {
    await graph.stop();
    await anthropic.stop();
    await tdb.drop();
  });
  beforeEach(async () => {
    clock = new TickingClock('2026-10-13T08:00:00.000Z'); // Tue 10:00 Madrid
    graph.reset();
    anthropic.reset();
    for (const t of ['jobs', 'incidents', 'llm_calls', 'crm_events', 'message_status_events', 'messages', 'appointment_services', 'appointments', 'conversations', 'customers'] as const) {
      await db.deleteFrom(t).execute();
    }
    anthropic
      .on(/tenéis mañana por la tarde para corte y barba/i, (c) => ({ intent: 'ASK_AVAILABILITY', confidence: 0.97, serviceCodes: [c.serviceCode('Corte + barba')], dateType: 'TODAY_OFFSET', daysFromToday: 1, timeOfDay: 'AFTERNOON' }))
      .on(/cuánto cuesta corte y barba/i, (c) => ({ intent: 'ASK_PRICE', confidence: 0.96, serviceCodes: [c.serviceCode('Corte + barba')] }))
      .on(/qué horario/i, () => ({ intent: 'ASK_OPENING_HOURS', confidence: 0.95 }))
      .on(/resérvame el jueves por la mañana un corte caballero/i, (c) => ({ intent: 'BOOK_APPOINTMENT', confidence: 0.95, serviceCodes: [c.serviceCode('Corte caballero')], dateType: 'WEEKDAY', weekday: 4, weekOffset: 0, timeOfDay: 'MORNING' }))
      .on(/no puedo ir mañana/i, () => ({ intent: 'CANCEL_APPOINTMENT', confidence: 0.75, dateType: 'TODAY_OFFSET', daysFromToday: 1 }))
      .on(/cambiar la cita al jueves/i, () => ({ intent: 'RESCHEDULE_APPOINTMENT', confidence: 0.95, dateType: 'WEEKDAY', weekday: 4, weekOffset: 0 }))
      .on(/^hola$/i, () => ({ intent: 'GREETING', confidence: 0.95 }));
    app = await startApp();
    baseUrl = `http://127.0.0.1:${(app.server!.server.address() as AddressInfo).port}`;
  });
  afterEach(async () => {
    await app.stop('test');
  });

  it('E2E 1 — new customer: availability -> choice -> appointment -> CRM -> confirmation -> reminders -> confirm attendance', async () => {
    const c = customer('34611111111');
    const offer = await c.say('Hola, ¿tenéis mañana por la tarde para corte y barba?');
    expect(offer[0]).toContain('Para mañana tenemos disponibilidad para corte + barba');
    expect(buttonTitles(c.lastMessage!.body)).toEqual(['16:00', '17:45', '19:15']);

    const booked = await c.tap('17:45');
    expect(booked[0]).toContain('Tu cita queda reservada');
    expect(booked[0]).toContain('📅 Miércoles 14 de octubre');

    const appt = await db.selectFrom('appointments').selectAll().executeTakeFirstOrThrow();
    expect(appt).toMatchObject({ status: 'BOOKED', source: 'WHATSAPP', staff_id: salon.staff('Juan') });
    expect(appt.starts_at.toISOString()).toBe(madrid('2026-10-14', '17:45').toISOString());
    const cust = await db.selectFrom('customers').selectAll().executeTakeFirstOrThrow();
    expect(cust).toMatchObject({ phone_e164: '+34611111111', source: 'WHATSAPP' });
    const crm = (await db.selectFrom('crm_events').select('type').where('customer_id', '=', cust.id).execute()).map((e) => e.type);
    expect(crm).toEqual(expect.arrayContaining(['CUSTOMER_CREATED', 'MESSAGE_RECEIVED', 'INTENT_DETECTED', 'SERVICE_INTEREST', 'AVAILABILITY_OFFERED', 'APPOINTMENT_CREATED']));
    const jobs = await db.selectFrom('jobs').select(['payload', 'run_at', 'status']).where('type', '=', 'appointment.notify').orderBy('run_at').execute();
    expect(jobs.map((j) => [j.payload.kind, j.run_at.toISOString(), j.status])).toEqual([
      ['CONFIRMATION_REQUEST', madrid('2026-10-13', '17:45').toISOString(), 'PENDING'],
      ['REMINDER', madrid('2026-10-14', '15:45').toISOString(), 'PENDING'],
    ]);
    // The LLM was used once (the first free-text message); the tap needed no LLM.
    expect(anthropic.requests).toHaveLength(1);

    // Time passes: the confirmation request goes out (customer wrote today -> interactive buttons).
    clock.jumpTo(madrid('2026-10-13', '17:45'));
    const confirmation = await c.waitForReplies();
    expect(confirmation[0]).toContain('¿Nos confirmas que vienes?');
    const confirmed = await c.tap('Confirmar');
    expect(confirmed[0]).toContain('queda confirmada');
    expect((await db.selectFrom('appointments').select('status').executeTakeFirstOrThrow()).status).toBe('CONFIRMED');

    // Delivery receipts for the booking confirmation flow through the webhook.
    const sent = await db.selectFrom('messages').select(['provider_message_id']).where('direction', '=', 'OUTBOUND').where('text', 'like', 'Perfecto ✅%').executeTakeFirstOrThrow();
    for (const status of ['sent', 'delivered', 'read'] as const) {
      const { payload, headers } = signedRequest(statusWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, wamid: sent.provider_message_id!, status, at: clock.now(), recipient: '34611111111' }), TEST_APP_SECRET);
      expect((await fetch(`${baseUrl}/webhooks/whatsapp`, { method: 'POST', body: payload, headers })).status).toBe(200);
    }
    const receipt = await db.selectFrom('messages').select(['status', 'sent_at', 'delivered_at', 'read_at']).where('provider_message_id', '=', sent.provider_message_id).executeTakeFirstOrThrow();
    expect(receipt.status).toBe('READ');
    expect(receipt.sent_at && receipt.delivered_at && receipt.read_at).toBeTruthy();
  });

  it('E2E 2 — existing customer: price -> opening hours -> booking', async () => {
    await createCustomer(db, salon.business.id, '+34622222222', 'Marcos');
    const c = customer('34622222222');
    expect((await c.say('¿Cuánto cuesta corte y barba?'))[0]).toContain('Hola Marcos 👋');
    expect(c.newReplies()).toEqual([]);
    expect(graph.textsTo('34622222222')[0]).toContain('Corte + barba cuesta 25 €.');
    expect((await c.say('¿Qué horario tenéis?'))[0]).toContain('• Sábado: 10:00–14:00');
    const offer = await c.say('Resérvame el jueves por la mañana un corte caballero');
    expect(offer[0]).toContain('Para pasado mañana tenemos disponibilidad para corte caballero');
    const booked = await c.say('2');
    expect(booked[0]).toContain('Tu cita queda reservada');
    const customers = await db.selectFrom('customers').selectAll().execute();
    expect(customers).toHaveLength(1); // the existing record was reused
    const appt = await db.selectFrom('appointments').selectAll().executeTakeFirstOrThrow();
    expect(appt.customer_id).toBe(customers[0]!.id);
  });

  it('E2E 3 — two customers, same slot, simultaneous choice: exactly one gets it', async () => {
    const a = customer('34633333331');
    const b = customer('34633333332');
    await Promise.all([a.say('Hola, ¿tenéis mañana por la tarde para corte y barba?'), b.say('Hola, ¿tenéis mañana por la tarde para corte y barba?')]);
    expect(buttonTitles(a.lastMessage!.body)).toContain('17:45');
    expect(buttonTitles(b.lastMessage!.body)).toContain('17:45');
    const [ra, rb] = await Promise.all([a.tap('17:45'), b.tap('17:45')]);
    const outcomes = [ra.join('\n'), rb.join('\n')];
    expect(outcomes.filter((t) => t.includes('Tu cita queda reservada'))).toHaveLength(1);
    expect(outcomes.filter((t) => t.includes('ese hueco se acaba de ocupar'))).toHaveLength(1);
    const active = await db.selectFrom('appointments').selectAll().where('status', 'in', ['BOOKED', 'CONFIRMED']).execute();
    expect(active).toHaveLength(1);
  });

  it('E2E 4 — customer cancels: appointment cancelled, slot freed, reminders invalidated', async () => {
    const c = customer('34644444444');
    await c.say('Hola, ¿tenéis mañana por la tarde para corte y barba?');
    await c.tap('17:45');
    const ask = await c.say('No puedo ir mañana');
    expect(ask[0]).toContain('¿Quieres cancelar tu cita de mañana');
    const done = await c.tap('Sí, cancelar');
    expect(done[0]).toContain('ha sido cancelada');
    expect((await db.selectFrom('appointments').select('status').executeTakeFirstOrThrow()).status).toBe('CANCELLED');
    const jobs = await db.selectFrom('jobs').select('status').where('type', '=', 'appointment.notify').execute();
    expect(jobs.every((j) => j.status === 'CANCELLED')).toBe(true);
    // Even at reminder time nothing is sent.
    clock.jumpTo(madrid('2026-10-14', '15:46'));
    await new Promise((r) => setTimeout(r, 400));
    expect(c.newReplies()).toEqual([]);
    // Slot is offered again to someone else.
    const other = customer('34644444445');
    await other.say('Hola, ¿tenéis mañana por la tarde para corte y barba?');
    expect(buttonTitles(other.lastMessage!.body)).toContain('17:45');
  });

  it('E2E 5 — customer reschedules: new time, version bump, notification jobs rotated', async () => {
    const c = customer('34655555555');
    await c.say('Hola, ¿tenéis mañana por la tarde para corte y barba?');
    await c.tap('17:45');
    await c.say('¿Me puedes cambiar la cita al jueves?');
    await c.tap('Por la tarde');
    const options = buttonTitles(c.lastMessage!.body);
    const done = await c.tap(options[0]!);
    expect(done[0]).toContain('Tu cita queda cambiada');
    const appt = await db.selectFrom('appointments').selectAll().executeTakeFirstOrThrow();
    expect(appt.version).toBe(2);
    expect(appt.starts_at.toISOString()).toBe(madrid('2026-10-15', options[0]!).toISOString());
    const jobs = await db.selectFrom('jobs').select(['status', 'payload']).where('type', '=', 'appointment.notify').execute();
    expect(jobs.filter((j) => j.status === 'CANCELLED').map((j) => j.payload.version)).toEqual([1, 1]);
    expect(jobs.filter((j) => j.status === 'PENDING').map((j) => j.payload.version)).toEqual([2, 2]);
  });

  it('resilience — the same webhook delivered 3 times over HTTP produces one reply', async () => {
    const wamid = nextWamid();
    const payload = textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34666666666', wamid, at: clock.now(), text: 'hola' });
    const c = customer('34666666666');
    await Promise.all([c.deliver(payload, false), c.deliver(payload, false), c.deliver(payload, false)]);
    const replies = await c.waitForReplies();
    await new Promise((r) => setTimeout(r, 500));
    expect([...replies, ...c.newReplies()]).toHaveLength(1);
    expect(anthropic.requests).toHaveLength(1);
  });

  it('resilience — LLM timeout degrades to the human-handoff fallback, WhatsApp keeps working', async () => {
    anthropic.next({ kind: 'delay', ms: 3_000 });
    const c = customer('34677777777');
    const r = await c.say('¿Tenéis hueco el sábado?');
    expect(r[0]).toContain('No he podido procesar tu solicitud ahora mismo');
    const llmCall = await db.selectFrom('llm_calls').selectAll().executeTakeFirstOrThrow();
    expect(llmCall.outcome).toBe('TIMEOUT');
    expect((await db.selectFrom('incidents').select('kind').executeTakeFirstOrThrow()).kind).toBe('LLM_FAILURE');
  });

  it('resilience — WhatsApp 500 is retried and the reply is delivered once', async () => {
    graph.failNext({ status: 500, body: { error: { message: 'Internal error', code: 2 } } });
    const c = customer('34688888888');
    await c.deliver(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34688888888', at: clock.now(), text: 'hola' }), false);
    await until(async () => (await db.selectFrom('jobs').select('attempts').where('type', '=', 'outbound.send').executeTakeFirst())?.attempts === 1);
    clock.advanceMinutes(5); // pass the backoff window
    const r = await c.waitForReplies();
    expect(r).toHaveLength(1);
    const out = await db.selectFrom('messages').select(['status', 'attempts']).where('direction', '=', 'OUTBOUND').executeTakeFirstOrThrow();
    expect(out).toEqual({ status: 'ACCEPTED', attempts: 2 });
  });

  it('resilience — restart: work queued while the service is down is processed after restart, without duplicates', async () => {
    await app.stop('SIGTERM'); // graceful shutdown
    // A message arrives while only the web tier of another instance is up (worker down).
    const web = await createTestApp({ databaseUrl: tdb.url, clock, graphUrl: graph.url, anthropicUrl: anthropic.url, role: 'web' });
    await web.start();
    const webUrl = `http://127.0.0.1:${(web.server!.server.address() as AddressInfo).port}`;
    const c = new CustomerSim(web, graph, clock, PILOT_PHONE_NUMBER_ID, '34699999999', { kind: 'http', baseUrl: webUrl });
    await c.deliver(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34699999999', at: clock.now(), text: 'Hola, ¿tenéis mañana por la tarde para corte y barba?' }), false);
    await new Promise((r) => setTimeout(r, 500));
    expect(c.newReplies()).toEqual([]); // nobody processing yet, but the message is durable
    expect((await db.selectFrom('jobs').select('status').executeTakeFirstOrThrow()).status).toBe('PENDING');
    await web.stop('test');
    // Worker comes back.
    app = await startApp();
    const r = await c.waitForReplies();
    expect(r).toHaveLength(1);
    expect(r[0]).toContain('Para mañana tenemos disponibilidad');
    await new Promise((res) => setTimeout(res, 500));
    expect(c.newReplies()).toEqual([]);
  });

  it('resilience — database unavailable: webhook answers 5xx so Meta retries (nothing acknowledged and lost)', async () => {
    const broken = await createTestApp({ databaseUrl: 'postgres://nobody@127.0.0.1:1/none', clock, role: 'web' });
    await broken.start();
    try {
      const url = `http://127.0.0.1:${(broken.server!.server.address() as AddressInfo).port}`;
      const { payload, headers } = signedRequest(textWebhook({ phoneNumberId: PILOT_PHONE_NUMBER_ID, from: '34612121212', at: clock.now(), text: 'hola' }), TEST_APP_SECRET);
      const res = await fetch(`${url}/webhooks/whatsapp`, { method: 'POST', body: payload, headers });
      expect(res.status).toBeGreaterThanOrEqual(500);
    } finally {
      await broken.stop('test');
    }
  });
});
