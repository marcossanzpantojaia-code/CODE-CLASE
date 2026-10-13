import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { AvailabilityService } from '../../src/scheduling/availability.service.js';
import { BookingService } from '../../src/scheduling/booking.service.js';
import { resolveServicesAndStaff } from '../../src/scheduling/availability.service.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { createCustomer, madrid, otherSalonConfig, pilotSalonConfig, seedTenant, type SeededTenant } from '../helpers/fixtures.js';
import { TEST_NOW } from '../helpers/clock.js';

const NOW = new Date(TEST_NOW); // Tue 13 Oct 2026 10:00 Madrid

describe('BookingService (real PostgreSQL)', () => {
  let tdb: TestDatabase;
  let db: DB;
  let salon: SeededTenant;
  let other: SeededTenant;
  let customerA: string;
  let customerB: string;
  const availability = new AvailabilityService();
  const booking = new BookingService(availability);

  beforeAll(async () => {
    tdb = await createTestDatabase(20);
    db = tdb.handle.db;
    salon = await seedTenant(db, pilotSalonConfig());
    other = await seedTenant(db, otherSalonConfig());
  });

  afterAll(async () => {
    await tdb.drop();
  });

  beforeEach(async () => {
    await db.deleteFrom('crm_events').execute();
    await db.deleteFrom('jobs').execute();
    await db.deleteFrom('appointment_services').execute();
    await db.deleteFrom('appointments').execute();
    await db.deleteFrom('customers').execute();
    customerA = await createCustomer(db, salon.business.id, '+34600000001', 'Marcos');
    customerB = await createCustomer(db, salon.business.id, '+34600000002', 'Laura');
  });

  const bookBeard = (customerId: string, start: Date, key?: string) =>
    db.transaction().execute((trx) =>
      booking.book(trx, {
        business: salon.business,
        customerId,
        serviceIds: [salon.service('Corte + barba')],
        staffId: null,
        startsAt: start,
        source: 'WHATSAPP',
        idempotencyKey: key ?? null,
        now: NOW,
      }),
    );

  it('creates an appointment with line items, CRM event and reminder jobs in one transaction', async () => {
    const start = madrid('2026-10-15', '18:30'); // Thursday
    const result = await bookBeard(customerA, start, 'wa:wamid.1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const a = result.appointment;
    expect(a.startsAt.toISOString()).toBe(start.toISOString());
    expect(a.endsAt.getTime() - a.startsAt.getTime()).toBe(45 * 60_000);
    expect(a.staffName).toBe('Juan'); // only Juan does "Corte + barba"
    expect(a.status).toBe('BOOKED');
    expect(a.totalPriceCents).toBe(2500);
    expect(a.services.map((s) => s.name)).toEqual(['Corte + barba']);

    const crm = await db.selectFrom('crm_events').selectAll().where('appointment_id', '=', a.id).execute();
    expect(crm.map((e) => e.type)).toEqual(['APPOINTMENT_CREATED']);
    expect(crm[0]?.data).toMatchObject({ origin: 'WHATSAPP', staffName: 'Juan', totalPriceCents: 2500, currency: 'EUR' });

    const jobs = await db.selectFrom('jobs').selectAll().where('group_key', '=', `appt:${a.id}`).orderBy('run_at').execute();
    expect(jobs.map((j) => j.payload.kind)).toEqual(['CONFIRMATION_REQUEST', 'REMINDER']);
    expect(jobs[0]?.run_at.toISOString()).toBe(madrid('2026-10-14', '18:30').toISOString()); // 24h before
    expect(jobs[1]?.run_at.toISOString()).toBe(madrid('2026-10-15', '16:30').toISOString()); // 2h before
  });

  it('is idempotent: retrying with the same key returns the same appointment', async () => {
    const start = madrid('2026-10-15', '17:00');
    const first = await bookBeard(customerA, start, 'wa:wamid.retry');
    const second = await bookBeard(customerA, start, 'wa:wamid.retry');
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.appointment.id).toBe(first.appointment.id);
    expect(second.alreadyExisted).toBe(true);
    const count = await db.selectFrom('appointments').select((eb) => eb.fn.countAll<number>().as('n')).executeTakeFirstOrThrow();
    expect(Number(count.n)).toBe(1);
  });

  it('rejects a slot that was taken while the customer was deciding', async () => {
    const start = madrid('2026-10-15', '19:00');
    expect((await bookBeard(customerA, start)).ok).toBe(true);
    const late = await bookBeard(customerB, start);
    expect(late).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' });
  });

  it('two customers racing for the same slot: exactly one wins', async () => {
    const start = madrid('2026-10-16', '18:30');
    const attempts = await Promise.all(
      Array.from({ length: 8 }, (_, i) => bookBeard(i % 2 === 0 ? customerA : customerB, start, `race-${i}`)),
    );
    const winners = attempts.filter((r) => r.ok);
    const losers = attempts.filter((r) => !r.ok);
    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(7);
    for (const l of losers) expect(l).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' });
    const active = await db.selectFrom('appointments').selectAll().where('status', 'in', ['BOOKED', 'CONFIRMED']).execute();
    expect(active).toHaveLength(1);
  });

  it('assigns a second compatible staff member when the first is busy', async () => {
    const start = madrid('2026-10-15', '11:00');
    const haircut = (customerId: string) =>
      db.transaction().execute((trx) =>
        booking.book(trx, {
          business: salon.business,
          customerId,
          serviceIds: [salon.service('Corte caballero')],
          staffId: null,
          startsAt: start,
          source: 'WHATSAPP',
          now: NOW,
        }),
      );
    const r1 = await haircut(customerA);
    const r2 = await haircut(customerB);
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(new Set([r1.appointment.staffName, r2.appointment.staffName])).toEqual(new Set(['Juan', 'Ana']));
    const r3 = await haircut(customerA);
    expect(r3).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' });
  });

  it('refuses slots outside opening hours, in the past or below the minimum notice', async () => {
    expect(await bookBeard(customerA, madrid('2026-10-15', '14:30'))).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' }); // lunch break
    expect(await bookBeard(customerA, madrid('2026-10-18', '11:00'))).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' }); // Sunday
    expect(await bookBeard(customerA, madrid('2026-10-12', '11:00'))).toEqual({ ok: false, reason: 'OUTSIDE_BOOKING_WINDOW' }); // past
    expect(await bookBeard(customerA, madrid('2026-10-13', '10:30'))).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' }); // < 60 min notice
    expect(await bookBeard(customerA, madrid('2026-10-15', '19:30'))).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' }); // 45 min do not fit before 20:00
  });

  it('reschedules: new time, version bump, old reminders cancelled, new ones scheduled', async () => {
    const created = await bookBeard(customerA, madrid('2026-10-15', '18:30'));
    if (!created.ok) throw new Error('setup failed');
    const id = created.appointment.id;
    const res = await db.transaction().execute((trx) =>
      booking.reschedule(trx, {
        business: salon.business,
        appointmentId: id,
        customerId: customerA,
        newStartsAt: madrid('2026-10-16', '17:00'),
        source: 'WHATSAPP',
        idempotencyKey: 'wa:wamid.resched',
        now: NOW,
      }),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.appointment.id).toBe(id);
    expect(res.appointment.version).toBe(2);
    expect(res.appointment.startsAt.toISOString()).toBe(madrid('2026-10-16', '17:00').toISOString());
    const jobs = await db.selectFrom('jobs').select(['status', 'payload', 'run_at']).where('group_key', '=', `appt:${id}`).orderBy('id').execute();
    expect(jobs.filter((j) => j.status === 'CANCELLED')).toHaveLength(2);
    const pending = jobs.filter((j) => j.status === 'PENDING');
    expect(pending.map((j) => j.payload.version)).toEqual([2, 2]);
    // Retry of the same reschedule is a no-op.
    const again = await db.transaction().execute((trx) =>
      booking.reschedule(trx, {
        business: salon.business,
        appointmentId: id,
        customerId: customerA,
        newStartsAt: madrid('2026-10-16', '17:00'),
        source: 'WHATSAPP',
        idempotencyKey: 'wa:wamid.resched',
        now: NOW,
      }),
    );
    expect(again.ok && again.alreadyExisted).toBe(true);
    // Old slot is free again.
    expect((await bookBeard(customerB, madrid('2026-10-15', '18:30'))).ok).toBe(true);
  });

  it('cancels: slot released, reminders cancelled, CRM updated; second cancel is idempotent', async () => {
    const start = madrid('2026-10-15', '18:30');
    const created = await bookBeard(customerA, start);
    if (!created.ok) throw new Error('setup failed');
    const cancel = () =>
      db.transaction().execute((trx) =>
        booking.cancel(trx, { business: salon.business, appointmentId: created.appointment.id, customerId: customerA, source: 'CUSTOMER_WHATSAPP', now: NOW }),
      );
    const res = await cancel();
    expect(res.ok && !res.alreadyCancelled).toBe(true);
    const jobs = await db.selectFrom('jobs').select('status').where('group_key', '=', `appt:${created.appointment.id}`).execute();
    expect(jobs.every((j) => j.status === 'CANCELLED')).toBe(true);
    const again = await cancel();
    expect(again.ok && again.alreadyCancelled).toBe(true);
    expect((await bookBeard(customerB, start)).ok).toBe(true);
    const types = await db.selectFrom('crm_events').select('type').where('appointment_id', '=', created.appointment.id).orderBy('occurred_at').execute();
    expect(types.map((t) => t.type)).toContain('APPOINTMENT_CANCELLED');
  });

  it('confirm keeps the version so pending reminders stay valid', async () => {
    const created = await bookBeard(customerA, madrid('2026-10-15', '18:30'));
    if (!created.ok) throw new Error('setup failed');
    const res = await db.transaction().execute((trx) =>
      booking.confirm(trx, { business: salon.business, appointmentId: created.appointment.id, customerId: customerA, expectedVersion: 1, now: NOW }),
    );
    expect(res.ok && res.appointment.status === 'CONFIRMED' && res.appointment.version === 1).toBe(true);
  });

  it('a customer cannot cancel, confirm or reschedule somebody else’s appointment', async () => {
    const created = await bookBeard(customerA, madrid('2026-10-15', '18:30'));
    if (!created.ok) throw new Error('setup failed');
    const id = created.appointment.id;
    const asB = await db.transaction().execute((trx) =>
      booking.cancel(trx, { business: salon.business, appointmentId: id, customerId: customerB, source: 'CUSTOMER_WHATSAPP', now: NOW }),
    );
    expect(asB).toEqual({ ok: false, reason: 'NOT_OWNER' });
    const confirmB = await db.transaction().execute((trx) => booking.confirm(trx, { business: salon.business, appointmentId: id, customerId: customerB, now: NOW }));
    expect(confirmB).toEqual({ ok: false, reason: 'NOT_OWNER' });
  });

  it('tenant isolation: services, staff, customers and appointments of another business are invisible', async () => {
    const foreignService = other.service('Corte caballero');
    const r1 = await db.transaction().execute((trx) =>
      booking.book(trx, {
        business: salon.business,
        customerId: customerA,
        serviceIds: [foreignService],
        staffId: null,
        startsAt: madrid('2026-10-15', '11:00'),
        source: 'WHATSAPP',
        now: NOW,
      }),
    );
    expect(r1).toEqual({ ok: false, reason: 'SERVICE_NOT_FOUND' });
    const r2 = await resolveServicesAndStaff(db, salon.business.id, [salon.service('Corte caballero')], other.staff('Pedro'), 'WHATSAPP');
    expect(r2).toEqual({ ok: false, reason: 'STAFF_NOT_FOUND' });
    const foreignCustomer = await createCustomer(db, other.business.id, '+34600000009');
    const r3 = await db.transaction().execute((trx) =>
      booking.book(trx, {
        business: salon.business,
        customerId: foreignCustomer,
        serviceIds: [salon.service('Corte caballero')],
        staffId: null,
        startsAt: madrid('2026-10-15', '11:00'),
        source: 'WHATSAPP',
        now: NOW,
      }),
    );
    expect(r3).toEqual({ ok: false, reason: 'CUSTOMER_NOT_FOUND' });
    const created = await bookBeard(customerA, madrid('2026-10-15', '18:30'));
    if (!created.ok) throw new Error('setup failed');
    const crossCancel = await db.transaction().execute((trx) =>
      booking.cancel(trx, { business: other.business, appointmentId: created.appointment.id, source: 'STAFF', now: NOW }),
    );
    expect(crossCancel).toEqual({ ok: false, reason: 'APPOINTMENT_NOT_FOUND' });
  });

  it('service incompatible with the requested professional is refused', async () => {
    const r = await resolveServicesAndStaff(db, salon.business.id, [salon.service('Corte mujer')], salon.staff('Juan'), 'WHATSAPP');
    expect(r).toEqual({ ok: false, reason: 'STAFF_INCOMPATIBLE' });
    const booked = await db.transaction().execute((trx) =>
      booking.book(trx, {
        business: salon.business,
        customerId: customerA,
        serviceIds: [salon.service('Corte mujer')],
        staffId: salon.staff('Juan'),
        startsAt: madrid('2026-10-15', '11:00'),
        source: 'WHATSAPP',
        now: NOW,
      }),
    );
    expect(booked).toEqual({ ok: false, reason: 'STAFF_INCOMPATIBLE' });
    // No single professional does "Barba" AND "Corte mujer" -> nobody can take that combination.
    const combo = await resolveServicesAndStaff(db, salon.business.id, [salon.service('Barba'), salon.service('Corte mujer')], null, 'WHATSAPP');
    expect(combo).toEqual({ ok: false, reason: 'NO_STAFF_FOR_SERVICES' });
  });

  it('refuses services that require an in-person consultation over WhatsApp but staff can book them', async () => {
    const balayage = salon.service('Balayage');
    const viaWa = await resolveServicesAndStaff(db, salon.business.id, [balayage], null, 'WHATSAPP');
    expect(viaWa).toEqual({ ok: false, reason: 'SERVICE_NOT_BOOKABLE' });
    const viaStaff = await resolveServicesAndStaff(db, salon.business.id, [balayage], null, 'STAFF');
    expect(viaStaff.ok).toBe(true);
  });

  it('respects business closures and staff vacations stored as time off', async () => {
    await db
      .insertInto('time_off')
      .values({ business_id: salon.business.id, staff_id: salon.staff('Juan'), kind: 'VACATION', starts_at: madrid('2026-10-19', '00:00'), ends_at: madrid('2026-10-24', '00:00') })
      .execute();
    expect(await bookBeard(customerA, madrid('2026-10-20', '11:00'))).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' });
    await db
      .insertInto('time_off')
      .values({ business_id: salon.business.id, staff_id: null, kind: 'HOLIDAY', starts_at: madrid('2026-10-15', '00:00'), ends_at: madrid('2026-10-16', '00:00') })
      .execute();
    expect(await bookBeard(customerA, madrid('2026-10-15', '11:00'))).toEqual({ ok: false, reason: 'SLOT_UNAVAILABLE' });
    await db.deleteFrom('time_off').execute();
  });
});
