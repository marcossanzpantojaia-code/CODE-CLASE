import { describe, expect, it } from 'vitest';
import {
  AvailabilityInputError,
  computeAvailability,
  pickNearestSlots,
  pickSpreadSlots,
  subtractIntervals,
  type AvailabilityParams,
} from '../../src/scheduling/availability-engine.js';

const TZ = 'Europe/Madrid';
const at = (date: string, time: string, offset = '+02:00') => new Date(`${date}T${time}:00${offset}`);
const times = (slots: { start: Date }[], offset = '+02:00') =>
  slots.map((s) => {
    const local = new Date(s.start.getTime() + (offset === '+01:00' ? 1 : 2) * 3_600_000);
    return local.toISOString().slice(11, 16);
  });

// Thursday 15 Oct 2026; split shift 10-14 / 16-20.
const base = (overrides: Partial<AvailabilityParams> = {}): AvailabilityParams => ({
  timezone: TZ,
  date: '2026-10-15',
  durationMinutes: 45,
  bufferMinutes: 0,
  slotIntervalMinutes: 15,
  businessHours: [
    { weekday: 4, start: '10:00', end: '14:00' },
    { weekday: 4, start: '16:00', end: '20:00' },
  ],
  staff: [{ staffId: 'juan', customHours: null }],
  busy: [],
  earliestStart: at('2026-10-13', '00:00'),
  latestStart: at('2026-12-31', '00:00'),
  ...overrides,
});

describe('computeAvailability', () => {
  it('returns real free slots respecting split shifts and service duration', () => {
    const slots = computeAvailability(base());
    const t = times(slots);
    expect(t[0]).toBe('10:00');
    expect(t).toContain('13:15'); // 13:15 + 45 = 14:00 fits exactly
    expect(t).not.toContain('13:30'); // would end 14:15 (lunch break)
    expect(t).toContain('16:00');
    expect(t[t.length - 1]).toBe('19:15'); // last start that ends by 20:00
    expect(slots.every((s) => s.end.getTime() - s.start.getTime() === 45 * 60_000)).toBe(true);
  });

  it('a fully booked day yields no slots', () => {
    const slots = computeAvailability(
      base({
        busy: [
          { staffId: 'juan', start: at('2026-10-15', '10:00'), end: at('2026-10-15', '14:00') },
          { staffId: 'juan', start: at('2026-10-15', '16:00'), end: at('2026-10-15', '20:00') },
        ],
      }),
    );
    expect(slots).toEqual([]);
  });

  it('a closed weekday (no opening hours) yields no slots', () => {
    expect(computeAvailability(base({ date: '2026-10-18' }))).toEqual([]); // Sunday
  });

  it('business-wide closures and holidays block everyone', () => {
    const slots = computeAvailability(
      base({ staff: [{ staffId: 'juan', customHours: null }, { staffId: 'ana', customHours: null }], busy: [{ staffId: null, start: at('2026-10-15', '00:00'), end: at('2026-10-16', '00:00') }] }),
    );
    expect(slots).toEqual([]);
  });

  it('staff unavailable (vacation / custom hours) are excluded per person', () => {
    const slots = computeAvailability(
      base({
        staff: [
          { staffId: 'juan', customHours: null },
          { staffId: 'ana', customHours: [{ weekday: 4, start: '16:00', end: '20:00' }] }, // afternoons only
        ],
        busy: [{ staffId: 'juan', start: at('2026-10-15', '00:00'), end: at('2026-10-16', '00:00') }], // Juan on vacation
      }),
    );
    expect(times(slots)[0]).toBe('16:00');
    expect(slots.every((s) => s.staffIds.join() === 'ana')).toBe(true);
  });

  it('existing appointments and their cleanup buffer block the chair', () => {
    const slots = computeAvailability(
      base({ busy: [{ staffId: 'juan', start: at('2026-10-15', '17:00'), end: at('2026-10-15', '17:45') }] }),
    );
    const t = times(slots);
    expect(t).toContain('16:15'); // 16:15-17:00 fits right before
    expect(t).not.toContain('16:30'); // would overlap 17:00
    expect(t).not.toContain('17:00');
    expect(t).toContain('17:45'); // back-to-back after
  });

  it('service buffer must fit inside opening hours', () => {
    const slots = computeAvailability(base({ durationMinutes: 45, bufferMinutes: 15 }));
    expect(times(slots)).not.toContain('19:15'); // 19:15 + 45 + 15 = 20:15
    expect(times(slots)).toContain('19:00');
  });

  it('honours minimum notice and booking horizon', () => {
    const slots = computeAvailability(base({ earliestStart: at('2026-10-15', '18:00'), latestStart: at('2026-10-15', '19:00') }));
    expect(times(slots)).toEqual(['18:00', '18:15', '18:30', '18:45', '19:00']);
  });

  it('filters by local time window ("por la tarde")', () => {
    const slots = computeAvailability(base({ window: { fromMinutes: 14 * 60, toMinutes: 21 * 60 } }));
    expect(times(slots)[0]).toBe('16:00');
  });

  it('merges staff: a slot lists every compatible free professional', () => {
    const slots = computeAvailability(base({ staff: [{ staffId: 'juan', customHours: null }, { staffId: 'ana', customHours: null }] }));
    expect(slots[0]?.staffIds).toEqual(['ana', 'juan']);
  });

  it('is timezone-correct across the DST change (Sunday 25 Oct 2026, Madrid goes UTC+2 -> UTC+1)', () => {
    const slots = computeAvailability(
      base({
        date: '2026-10-26', // Monday after the change: UTC+1
        businessHours: [{ weekday: 1, start: '10:00', end: '11:00' }],
        durationMinutes: 30,
      }),
    );
    expect(slots.map((s) => s.start.toISOString())).toEqual(['2026-10-26T09:00:00.000Z', '2026-10-26T09:15:00.000Z', '2026-10-26T09:30:00.000Z']);
  });

  it('rejects invalid input', () => {
    expect(() => computeAvailability(base({ timezone: 'Mars/Olympus' }))).toThrow(AvailabilityInputError);
    expect(() => computeAvailability(base({ date: '2026-02-30' }))).toThrow(AvailabilityInputError);
    expect(() => computeAvailability(base({ durationMinutes: 0 }))).toThrow(AvailabilityInputError);
  });
});

describe('slot selection helpers', () => {
  const slots = computeAvailability(base());
  it('spreads offers over the range (first and last included)', () => {
    const picked = pickSpreadSlots(slots, 3);
    expect(picked).toHaveLength(3);
    expect(picked[0]).toBe(slots[0]);
    expect(picked[2]).toBe(slots[slots.length - 1]);
  });
  it('picks the nearest alternatives to a requested time in chronological order', () => {
    // 13:15 is 75 min away; 13:00 and 16:00 tie at 90 min; 16:15 (105 min) is left out.
    const near = pickNearestSlots(slots, at('2026-10-15', '14:30'), 3);
    expect(times(near)).toEqual(['13:00', '13:15', '16:00']);
  });
  it('interval subtraction handles partial overlaps', () => {
    expect(subtractIntervals([[0, 100]], [[20, 30], [90, 200]])).toEqual([[0, 20], [30, 90]]);
  });
});
