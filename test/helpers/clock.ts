import type { Clock } from '../../src/shared/clock.js';

/** Controllable clock for deterministic tests. */
export class MutableClock implements Clock {
  private current: number;

  constructor(start: Date | string) {
    this.current = new Date(start).getTime();
  }

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date | string): void {
    this.current = new Date(date).getTime();
  }

  advanceMinutes(minutes: number): void {
    this.current += minutes * 60_000;
  }

  advanceMs(ms: number): void {
    this.current += ms;
  }
}

/** Tuesday 13 Oct 2026, 10:00 in Madrid (CEST, UTC+2). */
export const TEST_NOW = '2026-10-13T08:00:00.000Z';

/** Clock that advances with real time (for E2E with a running worker) and supports jumps. */
export class TickingClock implements Clock {
  private readonly base: number;
  private readonly realStart = Date.now();
  private offset = 0;

  constructor(start: Date | string) {
    this.base = new Date(start).getTime();
  }

  now(): Date {
    return new Date(this.base + (Date.now() - this.realStart) + this.offset);
  }

  advanceMinutes(minutes: number): void {
    this.offset += minutes * 60_000;
  }

  jumpTo(date: Date | string): void {
    this.offset += new Date(date).getTime() - this.now().getTime();
  }
}
