import type { TimeWindow } from '../scheduling/availability-engine.js';
import { addLocalDays, diffLocalDays, isValidLocalDate, weekdayOfLocalDate } from '../shared/time.js';
import type { DateExpr, TimeOfDay, TimePreference } from './interpretation.js';

/**
 * Deterministic resolution of date expressions. The model describes ("next
 * Thursday"); the backend computes the actual calendar date relative to the
 * message's local date in the business timezone.
 */
export function resolveDateExpr(expr: DateExpr, today: string): string | null {
  switch (expr.type) {
    case 'OFFSET':
      return addLocalDays(today, expr.days);
    case 'WEEKDAY': {
      let delta = expr.weekday - weekdayOfLocalDate(today);
      // "el martes" said on a Tuesday means next week's Tuesday ("hoy" is used for today).
      if (delta <= 0) delta += 7;
      return addLocalDays(today, delta + 7 * expr.weekOffset);
    }
    case 'CALENDAR': {
      const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
      let year = expr.year ?? ty;
      let month = expr.month ?? tm;
      if (expr.month === null && expr.day < td) {
        // "el 3" said on the 20th -> the 3rd of next month.
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
      let candidate = `${year}-${String(month).padStart(2, '0')}-${String(expr.day).padStart(2, '0')}`;
      if (!isValidLocalDate(candidate)) return null;
      if (expr.year === null && diffLocalDays(today, candidate) < 0) {
        candidate = `${year + 1}-${String(month).padStart(2, '0')}-${String(expr.day).padStart(2, '0')}`;
        if (!isValidLocalDate(candidate)) return null;
      }
      return candidate;
    }
  }
}

/** Local start-time windows for "mañana/tarde/noche" in Spanish salons. */
export const TIME_OF_DAY_WINDOWS: Record<TimeOfDay, TimeWindow> = {
  MORNING: { fromMinutes: 0, toMinutes: 14 * 60 },
  AFTERNOON: { fromMinutes: 14 * 60, toMinutes: 21 * 60 },
  EVENING: { fromMinutes: 19 * 60, toMinutes: 24 * 60 },
};

export function windowFor(pref: TimePreference | null): TimeWindow | undefined {
  if (!pref) return undefined;
  switch (pref.kind) {
    case 'RANGE':
      return TIME_OF_DAY_WINDOWS[pref.range];
    case 'EXACT':
      return { fromMinutes: pref.minutes, toMinutes: pref.minutes + 1 };
    case 'AFTER':
      return { fromMinutes: pref.minutes, toMinutes: 24 * 60 };
    case 'BEFORE':
      return { fromMinutes: 0, toMinutes: pref.minutes };
  }
}
