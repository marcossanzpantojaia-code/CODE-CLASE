import { describe, expect, it } from 'vitest';
import { resolveDateExpr, windowFor } from '../../src/receptionist/dates.js';

// Tuesday 13 Oct 2026
const TODAY = '2026-10-13';

describe('resolveDateExpr (backend computes dates, the model only describes them)', () => {
  it('relative days', () => {
    expect(resolveDateExpr({ type: 'OFFSET', days: 0 }, TODAY)).toBe('2026-10-13');
    expect(resolveDateExpr({ type: 'OFFSET', days: 1 }, TODAY)).toBe('2026-10-14');
    expect(resolveDateExpr({ type: 'OFFSET', days: 2 }, TODAY)).toBe('2026-10-15');
  });

  it('weekdays: next occurrence, same weekday means next week, weekOffset adds weeks', () => {
    expect(resolveDateExpr({ type: 'WEEKDAY', weekday: 4, weekOffset: 0 }, TODAY)).toBe('2026-10-15'); // jueves
    expect(resolveDateExpr({ type: 'WEEKDAY', weekday: 2, weekOffset: 0 }, TODAY)).toBe('2026-10-20'); // "el martes" on a Tuesday
    expect(resolveDateExpr({ type: 'WEEKDAY', weekday: 1, weekOffset: 0 }, TODAY)).toBe('2026-10-19');
    expect(resolveDateExpr({ type: 'WEEKDAY', weekday: 4, weekOffset: 1 }, TODAY)).toBe('2026-10-22');
  });

  it('calendar dates: month/year inference and validation', () => {
    expect(resolveDateExpr({ type: 'CALENDAR', day: 20, month: null, year: null }, TODAY)).toBe('2026-10-20');
    expect(resolveDateExpr({ type: 'CALENDAR', day: 3, month: null, year: null }, TODAY)).toBe('2026-11-03'); // past day -> next month
    expect(resolveDateExpr({ type: 'CALENDAR', day: 10, month: 1, year: null }, TODAY)).toBe('2027-01-10'); // past month -> next year
    expect(resolveDateExpr({ type: 'CALENDAR', day: 30, month: 2, year: null }, TODAY)).toBeNull();
    expect(resolveDateExpr({ type: 'CALENDAR', day: 3, month: null, year: null }, '2026-12-20')).toBe('2027-01-03');
  });

  it('time windows', () => {
    expect(windowFor({ kind: 'RANGE', range: 'AFTERNOON' })).toEqual({ fromMinutes: 840, toMinutes: 1260 });
    expect(windowFor({ kind: 'EXACT', minutes: 1110 })).toEqual({ fromMinutes: 1110, toMinutes: 1111 });
    expect(windowFor({ kind: 'AFTER', minutes: 1020 })).toEqual({ fromMinutes: 1020, toMinutes: 1440 });
    expect(windowFor(null)).toBeUndefined();
  });
});
