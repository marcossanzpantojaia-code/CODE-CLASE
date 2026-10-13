import { addLocalDays, instantFromLocal, isValidLocalDate, isValidTimeZone, localMinutesOfDay, parseTimeToMinutes, weekdayOfLocalDate } from '../shared/time.js';

/**
 * Deterministic availability engine. Pure function: no I/O, no clock, no LLM.
 * Given the schedule data of ONE local day it returns every start time at which
 * the requested services fit for at least one compatible staff member.
 *
 * It considers: business opening hours (split shifts), staff working hours,
 * breaks / closures / holidays / vacations / manual blocks (busy blocks),
 * existing appointments (busy blocks, including their cleanup buffer), service
 * duration + buffer, minimum booking notice, maximum horizon and the business
 * timezone (all wall-clock values are interpreted in `timezone`, DST-safe).
 */

export interface WeeklyHours {
  /** ISO weekday, 1 = Monday ... 7 = Sunday */
  weekday: number;
  /** 'HH:MM' or 'HH:MM:SS' local wall-clock time */
  start: string;
  end: string;
}

export interface StaffScheduleInput {
  staffId: string;
  /** null: the staff member works whenever the business is open. */
  customHours: WeeklyHours[] | null;
}

export interface BusyBlock {
  /** null: applies to the whole business (closure, holiday...). */
  staffId: string | null;
  start: Date;
  end: Date;
}

export interface TimeWindow {
  /** Local minutes of day, inclusive. */
  fromMinutes: number;
  /** Local minutes of day, exclusive. */
  toMinutes: number;
}

export interface AvailabilityParams {
  timezone: string;
  /** Local date 'YYYY-MM-DD' in `timezone`. */
  date: string;
  durationMinutes: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  businessHours: WeeklyHours[];
  staff: StaffScheduleInput[];
  busy: BusyBlock[];
  /** No slot may start before this instant (now + minimum notice). */
  earliestStart: Date;
  /** No slot may start after this instant (now + booking horizon). */
  latestStart: Date;
  /** Optional filter on the local start time (e.g. "por la tarde"). */
  window?: TimeWindow | undefined;
}

export interface Slot {
  start: Date;
  /** start + service duration (what the customer is told). */
  end: Date;
  /** end + buffer (what blocks the chair). */
  occupiedUntil: Date;
  /** Staff members free for the whole slot, sorted for determinism. */
  staffIds: string[];
}

type Interval = readonly [number, number];

export function mergeIntervals(list: readonly Interval[]): Interval[] {
  const sorted = list.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const out: Array<[number, number]> = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

export function intersectIntervals(a: readonly Interval[], b: readonly Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const [a0, a1] of a) {
    for (const [b0, b1] of b) {
      const s = Math.max(a0, b0);
      const e = Math.min(a1, b1);
      if (e > s) out.push([s, e]);
    }
  }
  return mergeIntervals(out);
}

export function subtractIntervals(base: readonly Interval[], remove: readonly Interval[]): Interval[] {
  let current: Interval[] = mergeIntervals(base);
  for (const [r0, r1] of mergeIntervals(remove)) {
    const next: Interval[] = [];
    for (const [c0, c1] of current) {
      if (r1 <= c0 || r0 >= c1) {
        next.push([c0, c1]);
        continue;
      }
      if (r0 > c0) next.push([c0, r0]);
      if (r1 < c1) next.push([r1, c1]);
    }
    current = next;
  }
  return current;
}

function dayIntervals(hours: readonly WeeklyHours[], weekday: number, date: string, tz: string): Interval[] {
  return mergeIntervals(
    hours
      .filter((h) => h.weekday === weekday)
      .map((h) => {
        const startMin = parseTimeToMinutes(h.start);
        const endMin = parseTimeToMinutes(h.end);
        // '24:00' is not representable in `time`; an end <= start is ignored (invalid row).
        return [instantFromLocal(date, startMin, tz).getTime(), instantFromLocal(date, endMin, tz).getTime()] as const;
      }),
  );
}

export class AvailabilityInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvailabilityInputError';
  }
}

export function computeAvailability(p: AvailabilityParams): Slot[] {
  if (!isValidTimeZone(p.timezone)) throw new AvailabilityInputError(`invalid timezone ${p.timezone}`);
  if (!isValidLocalDate(p.date)) throw new AvailabilityInputError(`invalid date ${p.date}`);
  if (!Number.isInteger(p.durationMinutes) || p.durationMinutes <= 0) throw new AvailabilityInputError('duration must be a positive integer');
  if (!Number.isInteger(p.bufferMinutes) || p.bufferMinutes < 0) throw new AvailabilityInputError('buffer must be >= 0');
  if (!Number.isInteger(p.slotIntervalMinutes) || p.slotIntervalMinutes <= 0) throw new AvailabilityInputError('slot interval must be > 0');

  const weekday = weekdayOfLocalDate(p.date);
  const business = dayIntervals(p.businessHours, weekday, p.date, p.timezone);
  if (business.length === 0 || p.staff.length === 0) return [];

  // Candidate start instants on the local wall-clock grid (00:00, 00:15, ...).
  const candidates = new Map<number, number>(); // epoch ms -> local minute of day
  for (let m = 0; m < 24 * 60; m += p.slotIntervalMinutes) {
    const instant = instantFromLocal(p.date, m, p.timezone);
    // Shifted by a DST gap into the next day? Then it is not on this local date.
    if (instant.getTime() >= instantFromLocal(addLocalDays(p.date, 1), 0, p.timezone).getTime()) continue;
    const t = instant.getTime();
    if (!candidates.has(t)) candidates.set(t, localMinutesOfDay(instant, p.timezone));
  }

  const occupyMs = (p.durationMinutes + p.bufferMinutes) * 60_000;
  const earliest = p.earliestStart.getTime();
  const latest = p.latestStart.getTime();
  const byStart = new Map<number, string[]>();

  for (const staff of p.staff) {
    const working = staff.customHours
      ? intersectIntervals(dayIntervals(staff.customHours, weekday, p.date, p.timezone), business)
      : business;
    if (working.length === 0) continue;
    const busy = p.busy
      .filter((b) => b.staffId === null || b.staffId === staff.staffId)
      .map((b) => [b.start.getTime(), b.end.getTime()] as const);
    const free = subtractIntervals(working, busy);
    if (free.length === 0) continue;

    for (const [t, localMinute] of candidates) {
      if (t < earliest || t > latest) continue;
      if (p.window && (localMinute < p.window.fromMinutes || localMinute >= p.window.toMinutes)) continue;
      const fits = free.some(([f0, f1]) => f0 <= t && t + occupyMs <= f1);
      if (!fits) continue;
      const list = byStart.get(t);
      if (list) list.push(staff.staffId);
      else byStart.set(t, [staff.staffId]);
    }
  }

  return [...byStart.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, staffIds]) => ({
      start: new Date(t),
      end: new Date(t + p.durationMinutes * 60_000),
      occupiedUntil: new Date(t + occupyMs),
      staffIds: [...staffIds].sort(),
    }));
}

/** Picks up to `max` slots evenly spread over the list (first and last included). */
export function pickSpreadSlots<T>(slots: readonly T[], max: number): T[] {
  if (max <= 0) return [];
  if (slots.length <= max) return [...slots];
  if (max === 1) return [slots[0] as T];
  const out: T[] = [];
  const used = new Set<number>();
  for (let k = 0; k < max; k++) {
    const idx = Math.round((k * (slots.length - 1)) / (max - 1));
    if (!used.has(idx)) {
      used.add(idx);
      out.push(slots[idx] as T);
    }
  }
  return out;
}

/** Picks the `max` slots closest to `target`, returned in chronological order. */
export function pickNearestSlots(slots: readonly Slot[], target: Date, max: number): Slot[] {
  const t = target.getTime();
  return [...slots]
    .sort((a, b) => Math.abs(a.start.getTime() - t) - Math.abs(b.start.getTime() - t) || a.start.getTime() - b.start.getTime())
    .slice(0, max)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
