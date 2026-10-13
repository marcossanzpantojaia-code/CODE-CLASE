/**
 * All business logic reads time through a Clock so behaviour that depends on
 * "now" (availability, reminders, leases, expiry) is deterministic in tests.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1_000);
}

export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}
