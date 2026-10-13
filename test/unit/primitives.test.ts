import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../../src/config/env.js';
import { formatLongDate, formatPrice, formatServicePrice, clockEmoji, relativeDayLabel, midSentence } from '../../src/receptionist/format.js';
import { loadState, IDLE } from '../../src/receptionist/state.js';
import { backoffDelayMs, parseRetryAfterMs } from '../../src/shared/backoff.js';
import { CircuitBreaker } from '../../src/shared/circuit-breaker.js';
import { FixedWindowLimiter } from '../../src/shared/rate-limiter.js';
import { MutableClock } from '../helpers/clock.js';

describe('circuit breaker', () => {
  it('opens after N failures in the window, half-opens after the cool-down and closes on success', () => {
    const clock = new MutableClock('2026-10-13T08:00:00Z');
    const states: string[] = [];
    const cb = new CircuitBreaker({ name: 'llm', failureThreshold: 3, windowMs: 60_000, openDurationMs: 30_000, clock, onStateChange: (_n, s) => states.push(s) });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.tryAcquire()).toBe(true);
    cb.recordFailure();
    expect(cb.currentState()).toBe('OPEN');
    expect(cb.tryAcquire()).toBe(false);
    clock.advanceMs(30_000);
    expect(cb.tryAcquire()).toBe(true); // single probe
    expect(cb.tryAcquire()).toBe(false); // second concurrent probe refused
    cb.recordSuccess();
    expect(cb.currentState()).toBe('CLOSED');
    expect(states).toEqual(['OPEN', 'HALF_OPEN', 'CLOSED']);
  });

  it('a failed probe re-opens immediately; old failures fall out of the window', () => {
    const clock = new MutableClock('2026-10-13T08:00:00Z');
    const cb = new CircuitBreaker({ name: 'wa', failureThreshold: 2, windowMs: 10_000, openDurationMs: 5_000, clock });
    cb.recordFailure();
    clock.advanceMs(11_000);
    cb.recordFailure();
    expect(cb.currentState()).toBe('CLOSED');
    cb.recordFailure();
    expect(cb.currentState()).toBe('OPEN');
    clock.advanceMs(5_000);
    expect(cb.tryAcquire()).toBe(true);
    cb.recordFailure();
    expect(cb.currentState()).toBe('OPEN');
  });
});

describe('backoff & retry-after', () => {
  it('grows exponentially with jitter and is capped', () => {
    expect(backoffDelayMs(1, { baseMs: 1000, maxMs: 60_000 }, () => 0)).toBe(500);
    expect(backoffDelayMs(3, { baseMs: 1000, maxMs: 60_000 }, () => 1)).toBe(4000);
    expect(backoffDelayMs(20, { baseMs: 1000, maxMs: 60_000 }, () => 1)).toBe(60_000);
  });
  it('parses seconds and HTTP dates', () => {
    expect(parseRetryAfterMs('3', 0)).toBe(3000);
    expect(parseRetryAfterMs(new Date(10_000).toUTCString(), 0)).toBe(10_000);
    expect(parseRetryAfterMs('soon', 0)).toBeNull();
  });
});

describe('rate limiter', () => {
  it('blocks after the limit inside a window and recovers after it', () => {
    let t = 0;
    const rl = new FixedWindowLimiter(2, 1000, () => t);
    expect([rl.hit('ip'), rl.hit('ip'), rl.hit('ip')]).toEqual([true, true, false]);
    expect(rl.isBlocked('ip')).toBe(true);
    t = 1000;
    expect(rl.hit('ip')).toBe(true);
  });
});

describe('conversation state expiry', () => {
  const now = new Date('2026-10-13T10:00:00Z');
  const pending = { kind: 'OFFERING_HANDOFF', offerId: 'abc123def0' };
  it('expired states reset to IDLE and are reported as expired', () => {
    expect(loadState(pending, new Date('2026-09-20T10:00:00Z'), now)).toEqual({ state: IDLE, expired: true, corrupt: false });
  });
  it('valid states survive until expiry', () => {
    expect(loadState(pending, new Date('2026-10-13T10:10:00Z'), now).state.kind).toBe('OFFERING_HANDOFF');
  });
  it('corrupt JSON never crashes the conversation', () => {
    expect(loadState({ kind: 'HACKED', appointmentId: 'x' }, null, now)).toEqual({ state: IDLE, expired: false, corrupt: true });
  });
});

describe('configuration', () => {
  const minimal = { DATABASE_URL: 'postgres://x@localhost/db' };
  it('defaults are safe: bot off, outbound on, configured default model at low effort', () => {
    const c = loadConfig(minimal);
    expect(c.flags.automatedReceptionistEnabled).toBe(false);
    expect(c.flags.safeMode).toBe(false);
    expect(c.llm.model).toBe('claude-opus-5-5');
    expect(c.llm.effort).toBe('low');
    expect(c.llm.baseUrl).toBe('https://api.anthropic.com');
  });
  it('production refuses to start without webhook secrets, and never echoes values', () => {
    try {
      loadConfig({ ...minimal, NODE_ENV: 'production', APP_ENV: 'production', AUTOMATED_RECEPTIONIST_ENABLED: 'true', WHATSAPP_APP_SECRET: 'tiny' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const msg = (err as Error).message;
      expect(msg).toContain('WHATSAPP_VERIFY_TOKEN');
      expect(msg).toContain('ANTHROPIC_API_KEY');
      expect(msg).toContain('WHATSAPP_APP_SECRET');
      expect(msg).not.toContain('tiny');
    }
  });
});

describe('Spanish formatting', () => {
  it('dates, times, prices and clock emoji match the expected copy', () => {
    expect(formatLongDate('2026-10-14')).toBe('Miércoles 14 de octubre');
    expect(relativeDayLabel('2026-10-14', '2026-10-13')).toBe('mañana');
    expect(relativeDayLabel('2026-10-15', '2026-10-13')).toBe('pasado mañana');
    expect(relativeDayLabel('2026-10-16', '2026-10-13')).toBe('el viernes 16');
    // Intl uses a no-break space (U+00A0) so "25" and "€" never split across lines.
    expect(formatPrice(2500, 'EUR')).toBe('25\u00a0€');
    expect(formatPrice(1250, 'EUR')).toBe('12,50\u00a0€');
    expect(formatServicePrice({ name: 'Tinte', priceType: 'FROM', priceCents: 4000 }, 'EUR')).toBe('desde 40\u00a0€');
    expect(formatServicePrice({ name: 'Balayage', priceType: 'ON_REQUEST', priceCents: null }, 'EUR')).toBe('precio a consultar');
    expect(clockEmoji(new Date('2026-10-14T16:30:00Z'), 'Europe/Madrid')).toBe('🕡'); // 18:30
    expect(midSentence('Corte + barba')).toBe('corte + barba');
    expect(midSentence('UV facial')).toBe('UV facial');
  });
});
