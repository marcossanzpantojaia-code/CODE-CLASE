export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
}

/**
 * Exponential backoff with "equal jitter": half of the delay is fixed, half is
 * random, so retries from many workers spread out without collapsing to ~0.
 * `attempt` is 1-based (delay before the 2nd try is attempt=1).
 */
export function backoffDelayMs(attempt: number, options: BackoffOptions, random: () => number = Math.random): number {
  const exp = Math.min(options.maxMs, options.baseMs * 2 ** Math.max(0, attempt - 1));
  const half = exp / 2;
  return Math.round(half + random() * half);
}

/** Parses an HTTP Retry-After header (seconds or HTTP date) into milliseconds. */
export function parseRetryAfterMs(value: string | null | undefined, nowMs: number): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, date - nowMs);
  return null;
}
