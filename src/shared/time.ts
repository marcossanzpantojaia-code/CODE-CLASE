import { DateTime, IANAZone } from 'luxon';

/**
 * Timezone-aware helpers. Rule of thumb used across the codebase:
 *  - instants are JS Dates (UTC) and are what we store (timestamptz);
 *  - "local" values (YYYY-MM-DD dates, HH:MM times) are always interpreted in
 *    the business timezone, never in the server's timezone.
 */

export const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const LOCAL_TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export function isValidTimeZone(tz: string): boolean {
  return IANAZone.isValidZone(tz);
}

function zoned(instant: Date, tz: string): DateTime {
  return DateTime.fromJSDate(instant, { zone: tz });
}

export function localDateOf(instant: Date, tz: string): string {
  return zoned(instant, tz).toISODate() as string;
}

export function localTimeOf(instant: Date, tz: string): string {
  return zoned(instant, tz).toFormat('HH:mm');
}

export function localMinutesOfDay(instant: Date, tz: string): number {
  const d = zoned(instant, tz);
  return d.hour * 60 + d.minute;
}

/** ISO weekday (1 = Monday ... 7 = Sunday) of a local date. */
export function weekdayOfLocalDate(localDate: string): number {
  const d = DateTime.fromISO(localDate, { zone: 'UTC' });
  if (!d.isValid) throw new Error(`Invalid local date: ${localDate}`);
  return d.weekday;
}

export function addLocalDays(localDate: string, days: number): string {
  const d = DateTime.fromISO(localDate, { zone: 'UTC' });
  if (!d.isValid) throw new Error(`Invalid local date: ${localDate}`);
  return d.plus({ days }).toISODate();
}

/** Days between two local dates (b - a). */
export function diffLocalDays(a: string, b: string): number {
  const da = DateTime.fromISO(a, { zone: 'UTC' });
  const db = DateTime.fromISO(b, { zone: 'UTC' });
  return Math.round(db.diff(da, 'days').days);
}

export function parseTimeToMinutes(time: string): number {
  const m = LOCAL_TIME.exec(time);
  if (!m) throw new Error(`Invalid time: ${time}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts a wall-clock time on a local date into an instant. Non-existent
 * local times (DST spring-forward gap) are shifted forward by Luxon; ambiguous
 * ones (fall-back) resolve to the earlier offset. Salons do not operate in
 * those windows, but the behaviour is defined and tested.
 */
export function instantFromLocal(localDate: string, minutesOfDay: number, tz: string): Date {
  const [y, mo, d] = localDate.split('-').map(Number) as [number, number, number];
  const dt = DateTime.fromObject(
    { year: y, month: mo, day: d, hour: Math.floor(minutesOfDay / 60), minute: minutesOfDay % 60 },
    { zone: tz },
  );
  if (!dt.isValid) throw new Error(`Invalid local datetime ${localDate} ${minutesOfDay} in ${tz}`);
  return dt.toJSDate();
}

export function startOfLocalDay(localDate: string, tz: string): Date {
  const dt = DateTime.fromISO(localDate, { zone: tz }).startOf('day');
  if (!dt.isValid) throw new Error(`Invalid local date: ${localDate}`);
  return dt.toJSDate();
}

/** Start of the following local day (exclusive end of `localDate`). */
export function endOfLocalDay(localDate: string, tz: string): Date {
  return startOfLocalDay(addLocalDays(localDate, 1), tz);
}

export function isValidLocalDate(value: string): boolean {
  if (!LOCAL_DATE.test(value)) return false;
  return DateTime.fromISO(value, { zone: 'UTC' }).isValid;
}
