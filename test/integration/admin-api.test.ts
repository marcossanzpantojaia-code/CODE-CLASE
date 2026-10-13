import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { App } from '../../src/app.js';
import { createApiKey, revokeApiKey } from '../../src/admin/api-keys.js';
import type { DB } from '../../src/db/database.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { MutableClock, TEST_NOW } from '../helpers/clock.js';
import { madrid, otherSalonConfig, pilotSalonConfig, seedTenant, type SeededTenant } from '../helpers/fixtures.js';
import { createTestApp } from '../helpers/test-app.js';

describe('Admin API (tenant isolation, auth, validation)', () => {
  let tdb: TestDatabase;
  let db: DB;
  let app: App;
  let salon: SeededTenant;
  let other: SeededTenant;
  let keyA: string;
  let keyB: string;
  const clock = new MutableClock(TEST_NOW);

  beforeAll(async () => {
    tdb = await createTestDatabase();
    db = tdb.handle.db;
    salon = await seedTenant(db, pilotSalonConfig());
    other = await seedTenant(db, otherSalonConfig());
    keyA = (await createApiKey(db, salon.business.id, 'recepcion')).key;
    keyB = (await createApiKey(db, other.business.id, 'otra')).key;
    app = await createTestApp({ databaseUrl: tdb.url, clock, role: 'web' });
  });
  afterAll(async () => {
    await app.stop('test');
    await tdb.drop();
  });

  const call = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, key: string | null, body?: unknown, headers: Record<string, string> = {}) =>
    app.server!.inject({
      method,
      url: `/admin/v1${url}`,
      headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), ...headers },
      ...(body !== undefined ? { payload: body as object } : {}),
    });

  it('rejects missing, malformed, unknown and revoked keys; keys are stored hashed', async () => {
    expect((await call('GET', '/business', null)).statusCode).toBe(401);
    expect((await call('GET', '/business', 'not-a-key')).statusCode).toBe(401);
    expect((await call('GET', '/business', 'rk_aaaaaaaaaaaa_' + 'x'.repeat(43))).statusCode).toBe(401);
    const temp = await createApiKey(db, salon.business.id, 'temporal');
    expect((await call('GET', '/business', temp.key)).statusCode).toBe(200);
    await revokeApiKey(db, temp.prefix, clock.now());
    expect((await call('GET', '/business', temp.key)).statusCode).toBe(401);
    const stored = await db.selectFrom('api_keys').select('key_hash').execute();
    expect(stored.some((s) => s.key_hash.includes(temp.key))).toBe(false);
  });

  it('each key only sees its own tenant', async () => {
    expect((await call('GET', '/business', keyA)).json()).toMatchObject({ slug: 'barberia-piloto' });
    expect((await call('GET', '/business', keyB)).json()).toMatchObject({ slug: 'peluqueria-otra' });
  });

  it('manual booking by staff (phone normalised, Idempotency-Key honoured) and cross-tenant IDOR is impossible', async () => {
    const body = { customerPhone: '612 345 678', customerName: 'Pepe', serviceIds: [salon.service('Barba')], startsAt: madrid('2026-10-15', '11:00').toISOString() };
    const created = await call('POST', '/appointments', keyA, body, { 'idempotency-key': 'walkin-1' });
    expect(created.statusCode).toBe(201);
    const appt = created.json<{ appointment: { id: string; customerId: string } }>().appointment;
    const again = await call('POST', '/appointments', keyA, body, { 'idempotency-key': 'walkin-1' });
    expect(again.statusCode).toBe(200);
    expect(again.json<{ appointment: { id: string } }>().appointment.id).toBe(appt.id);
    const customer = await db.selectFrom('customers').selectAll().where('id', '=', appt.customerId).executeTakeFirstOrThrow();
    expect(customer).toMatchObject({ phone_e164: '+34612345678', name: 'Pepe', source: 'STAFF' });
    // Tenant B cannot cancel, reschedule or read tenant A's resources.
    expect((await call('POST', `/appointments/${appt.id}/cancel`, keyB, {})).statusCode).toBe(404);
    expect((await call('POST', `/appointments/${appt.id}/reschedule`, keyB, { startsAt: madrid('2026-10-16', '11:00').toISOString() })).statusCode).toBe(404);
    expect((await call('GET', `/customers/${appt.customerId}`, keyB)).statusCode).toBe(404);
    // Tenant B cannot book tenant A's services either.
    const cross = await call('POST', '/appointments', keyB, { ...body, startsAt: madrid('2026-10-15', '12:00').toISOString() });
    expect(cross.statusCode).toBe(409);
    expect(cross.json()).toEqual({ error: 'SERVICE_NOT_FOUND' });
    // Double booking through the admin API is rejected too (only Juan does "Barba").
    const clash = await call('POST', '/appointments', keyA, { ...body, customerPhone: '+34699999999' });
    expect(clash.statusCode).toBe(409);
    expect(clash.json()).toEqual({ error: 'SLOT_UNAVAILABLE' });
  });

  it('strict validation: unknown fields (mass assignment) and bad values are rejected', async () => {
    const res = await call('PATCH', '/business/flags', keyA, { safeMode: true, business_id: other.business.id });
    expect(res.statusCode).toBe(400);
    expect((await call('POST', '/appointments', keyA, { customerPhone: '1', serviceIds: ['nope'], startsAt: 'tomorrow' })).statusCode).toBe(400);
    expect((await call('GET', '/appointments?from=x&to=y', keyA)).statusCode).toBe(400);
  });

  it('flags can be toggled at runtime per tenant (safe mode / bot on-off) without a deploy', async () => {
    const res = await call('PATCH', '/business/flags', keyA, { automatedReceptionistEnabled: true, safeMode: true });
    expect(res.json()).toEqual({ automatedReceptionistEnabled: true, safeMode: true, remindersEnabled: true });
    const other = await call('GET', '/business', keyB);
    expect(other.json<{ flags: { safeMode: boolean } }>().flags.safeMode).toBe(false);
    await call('PATCH', '/business/flags', keyA, { safeMode: false });
  });

  it('availability endpoint returns the same deterministic slots the bot offers', async () => {
    const res = await call('GET', `/availability?date=2026-10-15&serviceIds=${salon.service('Corte + barba')}`, keyA);
    expect(res.statusCode).toBe(200);
    const slots = res.json<{ slots: Array<{ startsAt: string }> }>().slots;
    expect(slots[0]?.startsAt).toBe(madrid('2026-10-15', '10:00').toISOString());
  });

  it('time off reports conflicting appointments instead of silently cancelling them', async () => {
    const res = await call('POST', '/time-off', keyA, { kind: 'CLOSURE', startsAt: madrid('2026-10-15', '10:30').toISOString(), endsAt: madrid('2026-10-15', '12:00').toISOString(), note: 'Avería' });
    expect(res.statusCode).toBe(201);
    expect(res.json<{ conflictingAppointments: unknown[] }>().conflictingAppointments.length).toBeGreaterThanOrEqual(1);
    const id = res.json<{ timeOff: { id: string } }>().timeOff.id;
    expect((await call('DELETE', `/time-off/${id}`, keyB)).statusCode).toBe(404);
    expect((await call('DELETE', `/time-off/${id}`, keyA)).statusCode).toBe(204);
  });

  it('stats expose automatic bookings and conversion per tenant', async () => {
    const res = await call('GET', `/stats?from=${encodeURIComponent('2026-10-01T00:00:00Z')}&to=${encodeURIComponent('2026-11-01T00:00:00Z')}`, keyA);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ automaticBookings: 0, appointmentsCreated: { staff: expect.any(Number) as number } });
  });

  it('spoofed X-Forwarded-For entries cannot rotate the client IP to dodge the limiter', async () => {
    let last = 0;
    for (let i = 0; i < 25; i++) {
      const res = await app.server!.inject({
        method: 'GET',
        url: '/admin/v1/business',
        // left entries are attacker-controlled; the right-most one is appended by our proxy
        headers: { authorization: `Bearer rk_cccccccccccc_${'z'.repeat(43)}`, 'x-forwarded-for': `10.0.0.${i}, 203.0.113.7` },
      });
      last = res.statusCode;
    }
    expect(last).toBe(429);
  });

  it('failed authentication is rate limited per IP', async () => {
    let last = 0;
    for (let i = 0; i < 25; i++) last = (await call('GET', '/business', 'rk_bbbbbbbbbbbb_' + 'y'.repeat(43))).statusCode;
    expect(last).toBe(429);
  });
});
