import { sql } from 'kysely';
import { isPgError, PG, type Tx } from '../db/database.js';
import type { AppointmentSource, Business, CancellationSource } from '../db/types.js';
import type { AppLogger } from '../observability/logger.js';
import type { Metrics } from '../observability/metrics.js';
import { recordCrmEvent } from '../crm/crm-events.js';
import { localDateOf } from '../shared/time.js';
import {
  cancelAppointmentNotifications,
  scheduleAppointmentNotifications,
  type ScheduledNotification,
} from '../reminders/scheduler.js';
import { getAppointmentView, type AppointmentView } from './appointments.repository.js';
import {
  type AvailabilityService,
  type ResolvedBooking,
  type ServiceResolutionFailure,
  resolveServicesAndStaff,
  validateBookingDate,
} from './availability.service.js';
import type { Slot } from './availability-engine.js';

/**
 * Booking rules
 *  1. The LLM never books. Callers pass a slot the customer explicitly chose
 *     from options the backend generated (or staff entered manually).
 *  2. Inside the transaction we take an advisory lock per candidate staff
 *     member (sorted -> no deadlocks), then RE-VALIDATE availability against
 *     the database. "It was free 30 seconds ago" is never trusted.
 *  3. The exclusion constraint appointments_no_overlap is the last line of
 *     defence; a violation is reported as SLOT_UNAVAILABLE (savepoint keeps
 *     the surrounding transaction usable).
 *  4. Idempotency keys make retries (job retry, webhook redelivery) return the
 *     appointment created by the first attempt instead of a second one.
 *  5. CRM event + reminder jobs are written in the same transaction.
 */

export type BookingFailure =
  | ServiceResolutionFailure
  | 'SLOT_UNAVAILABLE'
  | 'OUTSIDE_BOOKING_WINDOW'
  | 'CUSTOMER_NOT_FOUND'
  | 'APPOINTMENT_NOT_FOUND'
  | 'APPOINTMENT_NOT_ACTIVE'
  | 'NOT_OWNER'
  | 'VERSION_MISMATCH';

export type BookingResult =
  | { ok: true; appointment: AppointmentView; alreadyExisted: boolean; notifications: ScheduledNotification[] }
  | { ok: false; reason: BookingFailure };

export interface BookRequest {
  business: Business;
  customerId: string;
  serviceIds: string[];
  /** Specific staff member requested, or null for "anyone". */
  staffId: string | null;
  /** Staff who were free when the slot was offered (preference order). */
  preferredStaffIds?: string[];
  startsAt: Date;
  source: AppointmentSource;
  conversationId?: string | null;
  idempotencyKey?: string | null;
  now: Date;
}

export interface RescheduleRequest {
  business: Business;
  appointmentId: string;
  /** When set (customer channel) the appointment must belong to this customer. */
  customerId?: string;
  newStartsAt: Date;
  staffId?: string | null;
  preferredStaffIds?: string[];
  source: AppointmentSource;
  idempotencyKey?: string | null;
  now: Date;
}

export interface CancelRequest {
  business: Business;
  appointmentId: string;
  customerId?: string;
  source: CancellationSource;
  reason?: string | null;
  now: Date;
}

export interface ConfirmRequest {
  business: Business;
  appointmentId: string;
  customerId?: string;
  expectedVersion?: number;
  now: Date;
}

export type CancelResult =
  | { ok: true; appointment: AppointmentView; alreadyCancelled: boolean }
  | { ok: false; reason: BookingFailure };

export type ConfirmResult =
  | { ok: true; appointment: AppointmentView; alreadyConfirmed: boolean }
  | { ok: false; reason: BookingFailure };

const crmSourceFor = (source: AppointmentSource): 'WHATSAPP_RECEPTIONIST' | 'STAFF' =>
  source === 'WHATSAPP' ? 'WHATSAPP_RECEPTIONIST' : 'STAFF';
const crmChannelFor = (source: AppointmentSource): 'WHATSAPP' | 'ADMIN_API' => (source === 'WHATSAPP' ? 'WHATSAPP' : 'ADMIN_API');

export class BookingService {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly metrics?: Metrics,
    private readonly logger?: AppLogger,
  ) {}

  async book(trx: Tx, req: BookRequest): Promise<BookingResult> {
    const { business } = req;
    if (req.idempotencyKey) {
      const existing = await this.findByIdempotencyKey(trx, business.id, req.idempotencyKey);
      if (existing) return { ok: true, appointment: existing, alreadyExisted: true, notifications: [] };
    }
    const customer = await trx
      .selectFrom('customers')
      .select('id')
      .where('business_id', '=', business.id)
      .where('id', '=', req.customerId)
      .executeTakeFirst();
    if (!customer) return { ok: false, reason: 'CUSTOMER_NOT_FOUND' };

    const resolved = await resolveServicesAndStaff(trx, business.id, req.serviceIds, req.staffId, req.source === 'WHATSAPP' ? 'WHATSAPP' : 'STAFF');
    if (!resolved.ok) return resolved;

    const slot = await this.lockAndRevalidate(trx, business, resolved.value, req.startsAt, req.now);
    if (!slot.ok) return slot;

    const staffId = await this.chooseStaff(trx, business, slot.slot, req.preferredStaffIds ?? []);
    const pricing = priceOf(resolved.value);

    await sql`SAVEPOINT book_appointment`.execute(trx);
    let appointmentId: string;
    try {
      const inserted = await trx
        .insertInto('appointments')
        .values({
          business_id: business.id,
          customer_id: req.customerId,
          staff_id: staffId,
          conversation_id: req.conversationId ?? null,
          starts_at: slot.slot.start,
          ends_at: slot.slot.end,
          occupied_until: slot.slot.occupiedUntil,
          source: req.source,
          total_price_cents: pricing.totalCents,
          price_is_estimate: pricing.isEstimate,
          currency: business.currency,
          idempotency_key: req.idempotencyKey ?? null,
          created_at: req.now,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
      appointmentId = inserted.id;
      await trx
        .insertInto('appointment_services')
        .values(
          resolved.value.services.map((s, i) => ({
            appointment_id: appointmentId,
            business_id: business.id,
            position: i,
            service_id: s.id,
            service_name: s.name,
            duration_minutes: s.durationMinutes,
            buffer_minutes: s.bufferMinutes,
            price_type: s.priceType,
            price_cents: s.priceCents,
          })),
        )
        .execute();
      await sql`RELEASE SAVEPOINT book_appointment`.execute(trx);
    } catch (err) {
      await sql`ROLLBACK TO SAVEPOINT book_appointment`.execute(trx);
      if (isPgError(err, PG.EXCLUSION_VIOLATION)) {
        this.metrics?.bookingConflicts.inc({ stage: 'constraint' });
        this.logger?.warn({ event: 'appointment.failed', reason: 'SLOT_UNAVAILABLE', stage: 'constraint', businessId: business.id }, 'exclusion constraint rejected booking');
        return { ok: false, reason: 'SLOT_UNAVAILABLE' };
      }
      if (isPgError(err, PG.UNIQUE_VIOLATION) && req.idempotencyKey) {
        const existing = await this.findByIdempotencyKey(trx, business.id, req.idempotencyKey);
        if (existing) return { ok: true, appointment: existing, alreadyExisted: true, notifications: [] };
      }
      throw err;
    }

    const notifications = await scheduleAppointmentNotifications(trx, {
      business,
      appointmentId,
      version: 1,
      startsAt: slot.slot.start,
      now: req.now,
    });
    const appointment = await this.mustLoad(trx, business.id, appointmentId);
    await recordCrmEvent(trx, {
      businessId: business.id,
      customerId: req.customerId,
      type: 'APPOINTMENT_CREATED',
      occurredAt: req.now,
      source: crmSourceFor(req.source),
      channel: crmChannelFor(req.source),
      conversationId: req.conversationId ?? null,
      appointmentId,
      data: {
        origin: req.source,
        startsAt: appointment.startsAt.toISOString(),
        staffId: appointment.staffId,
        staffName: appointment.staffName,
        services: appointment.services.map((s) => ({ id: s.serviceId, name: s.name, priceCents: s.priceCents, priceType: s.priceType })),
        totalPriceCents: appointment.totalPriceCents,
        priceIsEstimate: appointment.priceIsEstimate,
        currency: appointment.currency,
        notifications: notifications.map((n) => ({ kind: n.kind, runAt: n.runAt.toISOString() })),
      },
      dedupeKey: `appointment_created:${appointmentId}`,
    });
    this.metrics?.appointmentsCreated.inc({ source: req.source });
    this.logger?.info(
      { event: 'appointment.created', businessId: business.id, appointmentId, conversationId: req.conversationId ?? undefined, source: req.source, staffId },
      'appointment created',
    );
    return { ok: true, appointment, alreadyExisted: false, notifications };
  }

  async reschedule(trx: Tx, req: RescheduleRequest): Promise<BookingResult> {
    const { business } = req;
    const appt = await trx
      .selectFrom('appointments')
      .selectAll()
      .where('business_id', '=', business.id)
      .where('id', '=', req.appointmentId)
      .forUpdate()
      .executeTakeFirst();
    if (!appt) return { ok: false, reason: 'APPOINTMENT_NOT_FOUND' };
    if (req.customerId && appt.customer_id !== req.customerId) return { ok: false, reason: 'NOT_OWNER' };

    const dedupeKey = req.idempotencyKey ? `appointment_rescheduled:${req.idempotencyKey}` : null;
    if (dedupeKey) {
      const done = await trx
        .selectFrom('crm_events')
        .select('id')
        .where('business_id', '=', business.id)
        .where('dedupe_key', '=', dedupeKey)
        .executeTakeFirst();
      if (done) return { ok: true, appointment: await this.mustLoad(trx, business.id, appt.id), alreadyExisted: true, notifications: [] };
    }
    if (appt.status !== 'BOOKED' && appt.status !== 'CONFIRMED') return { ok: false, reason: 'APPOINTMENT_NOT_ACTIVE' };

    const lines = await trx
      .selectFrom('appointment_services')
      .select('service_id')
      .where('appointment_id', '=', appt.id)
      .orderBy('position')
      .execute();
    const resolved = await resolveServicesAndStaff(
      trx,
      business.id,
      lines.map((l) => l.service_id),
      req.staffId ?? null,
      req.source === 'WHATSAPP' ? 'WHATSAPP' : 'STAFF',
    );
    if (!resolved.ok) return resolved;

    const slot = await this.lockAndRevalidate(trx, business, resolved.value, req.newStartsAt, req.now, appt.id);
    if (!slot.ok) return slot;
    // Keep the same professional when possible.
    const staffId = await this.chooseStaff(trx, business, slot.slot, [appt.staff_id, ...(req.preferredStaffIds ?? [])]);
    const newVersion = appt.version + 1;

    await sql`SAVEPOINT reschedule_appointment`.execute(trx);
    try {
      await trx
        .updateTable('appointments')
        .set({
          starts_at: slot.slot.start,
          ends_at: slot.slot.end,
          occupied_until: slot.slot.occupiedUntil,
          staff_id: staffId,
          version: newVersion,
          status: 'BOOKED',
          confirmed_at: null,
        })
        .where('id', '=', appt.id)
        .where('business_id', '=', business.id)
        .execute();
      await sql`RELEASE SAVEPOINT reschedule_appointment`.execute(trx);
    } catch (err) {
      await sql`ROLLBACK TO SAVEPOINT reschedule_appointment`.execute(trx);
      if (isPgError(err, PG.EXCLUSION_VIOLATION)) {
        this.metrics?.bookingConflicts.inc({ stage: 'constraint' });
        return { ok: false, reason: 'SLOT_UNAVAILABLE' };
      }
      throw err;
    }

    await cancelAppointmentNotifications(trx, { businessId: business.id, appointmentId: appt.id, now: req.now, reason: 'RESCHEDULED' });
    const notifications = await scheduleAppointmentNotifications(trx, {
      business,
      appointmentId: appt.id,
      version: newVersion,
      startsAt: slot.slot.start,
      now: req.now,
    });
    const appointment = await this.mustLoad(trx, business.id, appt.id);
    await recordCrmEvent(trx, {
      businessId: business.id,
      customerId: appt.customer_id,
      type: 'APPOINTMENT_RESCHEDULED',
      occurredAt: req.now,
      source: crmSourceFor(req.source),
      channel: crmChannelFor(req.source),
      conversationId: appt.conversation_id,
      appointmentId: appt.id,
      data: {
        origin: req.source,
        from: { startsAt: appt.starts_at.toISOString(), staffId: appt.staff_id },
        to: { startsAt: appointment.startsAt.toISOString(), staffId: appointment.staffId, staffName: appointment.staffName },
        version: newVersion,
      },
      dedupeKey: dedupeKey ?? `appointment_rescheduled:${appt.id}:v${newVersion}`,
    });
    this.metrics?.appointmentsRescheduled.inc({ source: req.source });
    this.logger?.info({ event: 'appointment.rescheduled', businessId: business.id, appointmentId: appt.id, version: newVersion }, 'appointment rescheduled');
    return { ok: true, appointment, alreadyExisted: false, notifications };
  }

  async cancel(trx: Tx, req: CancelRequest): Promise<CancelResult> {
    const { business } = req;
    const appt = await trx
      .selectFrom('appointments')
      .selectAll()
      .where('business_id', '=', business.id)
      .where('id', '=', req.appointmentId)
      .forUpdate()
      .executeTakeFirst();
    if (!appt) return { ok: false, reason: 'APPOINTMENT_NOT_FOUND' };
    if (req.customerId && appt.customer_id !== req.customerId) return { ok: false, reason: 'NOT_OWNER' };
    if (appt.status === 'CANCELLED') {
      return { ok: true, appointment: await this.mustLoad(trx, business.id, appt.id), alreadyCancelled: true };
    }
    if (appt.status !== 'BOOKED' && appt.status !== 'CONFIRMED') return { ok: false, reason: 'APPOINTMENT_NOT_ACTIVE' };

    const newVersion = appt.version + 1;
    await trx
      .updateTable('appointments')
      .set({
        status: 'CANCELLED',
        cancelled_at: req.now,
        cancellation_source: req.source,
        cancellation_reason: req.reason ?? null,
        version: newVersion,
      })
      .where('id', '=', appt.id)
      .where('business_id', '=', business.id)
      .execute();
    await cancelAppointmentNotifications(trx, { businessId: business.id, appointmentId: appt.id, now: req.now, reason: 'APPOINTMENT_CANCELLED' });
    const hoursBefore = (appt.starts_at.getTime() - req.now.getTime()) / 3_600_000;
    await recordCrmEvent(trx, {
      businessId: business.id,
      customerId: appt.customer_id,
      type: 'APPOINTMENT_CANCELLED',
      occurredAt: req.now,
      source: req.source === 'CUSTOMER_WHATSAPP' ? 'CUSTOMER' : req.source === 'STAFF' ? 'STAFF' : 'SYSTEM',
      channel: req.source === 'CUSTOMER_WHATSAPP' ? 'WHATSAPP' : 'ADMIN_API',
      conversationId: appt.conversation_id,
      appointmentId: appt.id,
      data: { startsAt: appt.starts_at.toISOString(), cancellationSource: req.source, hoursBefore: Math.round(hoursBefore * 10) / 10 },
      dedupeKey: `appointment_cancelled:${appt.id}`,
    });
    this.metrics?.appointmentsCancelled.inc({ source: req.source });
    this.logger?.info({ event: 'appointment.cancelled', businessId: business.id, appointmentId: appt.id, source: req.source }, 'appointment cancelled');
    return { ok: true, appointment: await this.mustLoad(trx, business.id, appt.id), alreadyCancelled: false };
  }

  /** Confirmation does NOT bump the version: pending reminders stay valid. */
  async confirm(trx: Tx, req: ConfirmRequest): Promise<ConfirmResult> {
    const { business } = req;
    const appt = await trx
      .selectFrom('appointments')
      .selectAll()
      .where('business_id', '=', business.id)
      .where('id', '=', req.appointmentId)
      .forUpdate()
      .executeTakeFirst();
    if (!appt) return { ok: false, reason: 'APPOINTMENT_NOT_FOUND' };
    if (req.customerId && appt.customer_id !== req.customerId) return { ok: false, reason: 'NOT_OWNER' };
    if (appt.status !== 'BOOKED' && appt.status !== 'CONFIRMED') return { ok: false, reason: 'APPOINTMENT_NOT_ACTIVE' };
    if (req.expectedVersion !== undefined && appt.version !== req.expectedVersion) return { ok: false, reason: 'VERSION_MISMATCH' };
    if (appt.status === 'CONFIRMED') {
      return { ok: true, appointment: await this.mustLoad(trx, business.id, appt.id), alreadyConfirmed: true };
    }
    await trx
      .updateTable('appointments')
      .set({ status: 'CONFIRMED', confirmed_at: req.now })
      .where('id', '=', appt.id)
      .where('business_id', '=', business.id)
      .execute();
    await recordCrmEvent(trx, {
      businessId: business.id,
      customerId: appt.customer_id,
      type: 'APPOINTMENT_CONFIRMED',
      occurredAt: req.now,
      source: 'CUSTOMER',
      channel: 'WHATSAPP',
      conversationId: appt.conversation_id,
      appointmentId: appt.id,
      data: { startsAt: appt.starts_at.toISOString(), version: appt.version },
      dedupeKey: `appointment_confirmed:${appt.id}:v${appt.version}`,
    });
    this.metrics?.appointmentsConfirmed.inc({ source: 'WHATSAPP' });
    this.logger?.info({ event: 'appointment.confirmed', businessId: business.id, appointmentId: appt.id }, 'appointment confirmed');
    return { ok: true, appointment: await this.mustLoad(trx, business.id, appt.id), alreadyConfirmed: false };
  }

  // -------------------------------------------------------------------------

  private async lockAndRevalidate(
    trx: Tx,
    business: Business,
    resolved: ResolvedBooking,
    startsAt: Date,
    now: Date,
    excludeAppointmentId?: string,
  ): Promise<{ ok: true; slot: Slot } | { ok: false; reason: BookingFailure }> {
    if (startsAt.getTime() <= now.getTime()) return { ok: false, reason: 'OUTSIDE_BOOKING_WINDOW' };
    const date = localDateOf(startsAt, business.timezone);
    if (validateBookingDate(business, date, now) !== 'OK') return { ok: false, reason: 'OUTSIDE_BOOKING_WINDOW' };

    // Serialise concurrent bookings per staff member. Sorted order -> no deadlocks.
    for (const staffId of [...resolved.candidateStaffIds].sort()) {
      await sql`SELECT pg_advisory_xact_lock(hashtextextended(${`staff-schedule:${staffId}`}, 0))`.execute(trx);
    }
    // Re-read the agenda AFTER acquiring the locks.
    const slots = await this.availability.slotsForDate(trx, business, resolved, date, { now, excludeAppointmentId });
    const slot = slots.find((s) => s.start.getTime() === startsAt.getTime());
    if (!slot) {
      this.metrics?.bookingConflicts.inc({ stage: 'revalidation' });
      this.logger?.info({ event: 'appointment.failed', reason: 'SLOT_UNAVAILABLE', stage: 'revalidation', businessId: business.id }, 'slot no longer available');
      return { ok: false, reason: 'SLOT_UNAVAILABLE' };
    }
    return { ok: true, slot };
  }

  /** Preferred staff first; otherwise the least busy that day; ties broken by id. */
  private async chooseStaff(trx: Tx, business: Business, slot: Slot, preferred: readonly string[]): Promise<string> {
    for (const id of preferred) if (slot.staffIds.includes(id)) return id;
    if (slot.staffIds.length === 1) return slot.staffIds[0] as string;
    const dayStart = new Date(slot.start.getTime() - 12 * 3_600_000);
    const dayEnd = new Date(slot.start.getTime() + 12 * 3_600_000);
    const loads = await trx
      .selectFrom('appointments')
      .select(['staff_id', (eb) => eb.fn.countAll<number>().as('n')])
      .where('business_id', '=', business.id)
      .where('staff_id', 'in', slot.staffIds)
      .where('status', 'in', ['BOOKED', 'CONFIRMED'])
      .where('starts_at', '>=', dayStart)
      .where('starts_at', '<', dayEnd)
      .groupBy('staff_id')
      .execute();
    const load = new Map(loads.map((l) => [l.staff_id, Number(l.n)]));
    return [...slot.staffIds].sort((a, b) => (load.get(a) ?? 0) - (load.get(b) ?? 0) || a.localeCompare(b))[0] as string;
  }

  private async findByIdempotencyKey(trx: Tx, businessId: string, key: string): Promise<AppointmentView | null> {
    const row = await trx
      .selectFrom('appointments')
      .select('id')
      .where('business_id', '=', businessId)
      .where('idempotency_key', '=', key)
      .executeTakeFirst();
    return row ? getAppointmentView(trx, businessId, row.id) : null;
  }

  private async mustLoad(trx: Tx, businessId: string, id: string): Promise<AppointmentView> {
    const view = await getAppointmentView(trx, businessId, id);
    if (!view) throw new Error(`appointment ${id} vanished inside its own transaction`);
    return view;
  }
}

function priceOf(resolved: ResolvedBooking): { totalCents: number | null; isEstimate: boolean } {
  let total = 0;
  let isEstimate = false;
  let known = false;
  for (const s of resolved.services) {
    if (s.priceType === 'ON_REQUEST' || s.priceCents === null) {
      isEstimate = true;
      continue;
    }
    known = true;
    total += s.priceCents;
    if (s.priceType === 'FROM') isEstimate = true;
  }
  return { totalCents: known ? total : null, isEstimate };
}
