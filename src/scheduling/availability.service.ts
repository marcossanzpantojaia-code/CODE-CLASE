import type { Executor } from '../db/database.js';
import type { Business } from '../db/types.js';
import type { Metrics } from '../observability/metrics.js';
import { addMinutes } from '../shared/clock.js';
import { addLocalDays, diffLocalDays, endOfLocalDay, isValidLocalDate, localDateOf, startOfLocalDay } from '../shared/time.js';
import {
  type CatalogService,
  getActiveStaff,
  getCompatibleStaffIds,
  getServicesByIds,
  loadBusinessHours,
  loadBusyBlocks,
  loadStaffHours,
} from '../catalog/catalog.repository.js';
import { computeAvailability, type Slot, type TimeWindow } from './availability-engine.js';

export type ServiceResolutionFailure =
  | 'SERVICE_NOT_FOUND'
  | 'SERVICE_NOT_BOOKABLE'
  | 'NO_STAFF_FOR_SERVICES'
  | 'STAFF_NOT_FOUND'
  | 'STAFF_INCOMPATIBLE';

export type DateValidation = 'OK' | 'INVALID_DATE' | 'DATE_IN_PAST' | 'DATE_TOO_FAR';

export interface ResolvedBooking {
  services: CatalogService[];
  durationMinutes: number;
  bufferMinutes: number;
  /** Active staff able to perform every requested service (or the requested staff member). */
  candidateStaffIds: string[];
}

export type BookingChannel = 'WHATSAPP' | 'STAFF';

/**
 * Validates services (tenant, active, self-bookable) and staff compatibility.
 * Durations add up; the cleanup buffer of a multi-service appointment is the
 * largest buffer (no cleanup between services performed back to back).
 */
export async function resolveServicesAndStaff(
  db: Executor,
  businessId: string,
  serviceIds: readonly string[],
  staffId: string | null | undefined,
  channel: BookingChannel,
): Promise<{ ok: true; value: ResolvedBooking } | { ok: false; reason: ServiceResolutionFailure }> {
  const unique = [...new Set(serviceIds)];
  if (unique.length === 0) return { ok: false, reason: 'SERVICE_NOT_FOUND' };
  const services = await getServicesByIds(db, businessId, unique);
  if (services.length !== unique.length) return { ok: false, reason: 'SERVICE_NOT_FOUND' };
  if (channel === 'WHATSAPP' && services.some((s) => !s.bookableOnline)) return { ok: false, reason: 'SERVICE_NOT_BOOKABLE' };

  let candidates = await getCompatibleStaffIds(db, businessId, unique);
  if (staffId) {
    const staff = await getActiveStaff(db, businessId, staffId);
    if (!staff) return { ok: false, reason: 'STAFF_NOT_FOUND' };
    if (!candidates.includes(staffId)) return { ok: false, reason: 'STAFF_INCOMPATIBLE' };
    candidates = [staffId];
  }
  if (candidates.length === 0) return { ok: false, reason: 'NO_STAFF_FOR_SERVICES' };

  return {
    ok: true,
    value: {
      services,
      durationMinutes: services.reduce((sum, s) => sum + s.durationMinutes, 0),
      bufferMinutes: services.reduce((max, s) => Math.max(max, s.bufferMinutes), 0),
      candidateStaffIds: candidates,
    },
  };
}

export function validateBookingDate(business: Business, localDate: string, now: Date): DateValidation {
  if (!isValidLocalDate(localDate)) return 'INVALID_DATE';
  const today = localDateOf(now, business.timezone);
  const diff = diffLocalDays(today, localDate);
  if (diff < 0) return 'DATE_IN_PAST';
  if (diff > business.max_booking_days_ahead) return 'DATE_TOO_FAR';
  return 'OK';
}

export interface SlotSearchOptions {
  window?: TimeWindow | undefined;
  excludeAppointmentId?: string | undefined;
  now: Date;
}

export class AvailabilityService {
  constructor(private readonly metrics?: Metrics) {}

  /**
   * Computes slots for several local dates with a single round of queries.
   * Dates in the past or beyond the booking horizon yield an empty list.
   */
  async slotsForDates(
    db: Executor,
    business: Business,
    resolved: ResolvedBooking,
    dates: readonly string[],
    options: SlotSearchOptions,
  ): Promise<Map<string, Slot[]>> {
    const started = performance.now();
    const result = new Map<string, Slot[]>();
    const valid = [...new Set(dates)].filter((d) => validateBookingDate(business, d, options.now) === 'OK').sort();
    for (const d of dates) result.set(d, []);
    if (valid.length === 0) return result;

    const first = valid[0] as string;
    const last = valid[valid.length - 1] as string;
    const tz = business.timezone;
    const [businessHours, staffHours, busy] = await Promise.all([
      loadBusinessHours(db, business.id),
      loadStaffHours(db, business.id, resolved.candidateStaffIds),
      loadBusyBlocks(
        db,
        business.id,
        resolved.candidateStaffIds,
        // Appointments that started the previous evening can spill into the morning.
        startOfLocalDay(addLocalDays(first, -1), tz),
        endOfLocalDay(last, tz),
        options.excludeAppointmentId,
      ),
    ]);

    const staff = resolved.candidateStaffIds.map((id) => ({ staffId: id, customHours: staffHours.get(id) ?? null }));
    const earliestStart = addMinutes(options.now, business.min_booking_notice_minutes);
    const latestStart = addMinutes(options.now, business.max_booking_days_ahead * 24 * 60);

    for (const date of valid) {
      result.set(
        date,
        computeAvailability({
          timezone: tz,
          date,
          durationMinutes: resolved.durationMinutes,
          bufferMinutes: resolved.bufferMinutes,
          slotIntervalMinutes: business.slot_interval_minutes,
          businessHours,
          staff,
          busy,
          earliestStart,
          latestStart,
          window: options.window,
        }),
      );
    }

    const total = [...result.values()].reduce((n, s) => n + s.length, 0);
    this.metrics?.availabilityQueries.inc({ result: total > 0 ? 'found' : 'none' });
    this.metrics?.availabilitySeconds.observe((performance.now() - started) / 1000);
    return result;
  }

  async slotsForDate(db: Executor, business: Business, resolved: ResolvedBooking, date: string, options: SlotSearchOptions): Promise<Slot[]> {
    const map = await this.slotsForDates(db, business, resolved, [date], options);
    return map.get(date) ?? [];
  }

  /** First date in [fromDate, fromDate + days) with at least one slot. */
  async firstAvailableDate(
    db: Executor,
    business: Business,
    resolved: ResolvedBooking,
    fromDate: string,
    days: number,
    options: SlotSearchOptions,
  ): Promise<{ date: string; slots: Slot[] } | null> {
    const dates = Array.from({ length: Math.max(1, days) }, (_, i) => addLocalDays(fromDate, i));
    const map = await this.slotsForDates(db, business, resolved, dates, options);
    for (const d of dates) {
      const slots = map.get(d) ?? [];
      if (slots.length > 0) return { date: d, slots };
    }
    return null;
  }
}
