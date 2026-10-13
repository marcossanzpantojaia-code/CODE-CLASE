/**
 * Small in-memory fixed-window limiter (per process). Used to throttle failed
 * admin authentications and abusive clients; not a substitute for an edge/WAF
 * rate limit, which should also be configured in front of the service.
 */
export class FixedWindowLimiter {
  private readonly hits = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records a hit; returns false when the key exceeded its quota in the current window. */
  hit(key: string): boolean {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || t - entry.windowStart >= this.windowMs) {
      this.hits.set(key, { count: 1, windowStart: t });
      this.gc(t);
      return true;
    }
    entry.count++;
    return entry.count <= this.limit;
  }

  isBlocked(key: string): boolean {
    const entry = this.hits.get(key);
    return !!entry && this.now() - entry.windowStart < this.windowMs && entry.count > this.limit;
  }

  private gc(t: number): void {
    if (this.hits.size < 10_000) return;
    for (const [k, v] of this.hits) if (t - v.windowStart >= this.windowMs) this.hits.delete(k);
  }
}
