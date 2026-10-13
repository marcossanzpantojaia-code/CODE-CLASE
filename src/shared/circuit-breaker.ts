import type { Clock } from './clock.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  name: string;
  /** Failures inside `windowMs` needed to open the circuit. */
  failureThreshold: number;
  windowMs: number;
  /** How long the circuit stays open before allowing a probe. */
  openDurationMs: number;
  clock: Clock;
  onStateChange?: (name: string, state: CircuitState) => void;
}

/**
 * Minimal in-process circuit breaker. Its job is to stop hammering a provider
 * (LLM, WhatsApp) that is failing massively, so callers degrade immediately
 * (fallback message / reschedule) instead of piling up timeouts.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number[] = [];
  private openedAt = 0;
  private probeInFlight = false;

  constructor(private readonly options: CircuitBreakerOptions) {}

  get name(): string {
    return this.options.name;
  }

  currentState(): CircuitState {
    this.refresh();
    return this.state;
  }

  /** Returns true when a call may proceed. In HALF_OPEN only one probe is allowed at a time. */
  tryAcquire(): boolean {
    this.refresh();
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') return false;
    if (this.probeInFlight) return false;
    this.probeInFlight = true;
    return true;
  }

  recordSuccess(): void {
    this.probeInFlight = false;
    this.failures = [];
    this.transition('CLOSED');
  }

  recordFailure(): void {
    const now = this.options.clock.now().getTime();
    this.probeInFlight = false;
    if (this.state === 'HALF_OPEN') {
      this.open(now);
      return;
    }
    this.failures.push(now);
    this.failures = this.failures.filter((t) => now - t <= this.options.windowMs);
    if (this.failures.length >= this.options.failureThreshold) this.open(now);
  }

  /** Releases a HALF_OPEN probe slot without counting success/failure (e.g. caller aborted). */
  release(): void {
    this.probeInFlight = false;
  }

  private open(now: number): void {
    this.openedAt = now;
    this.failures = [];
    this.transition('OPEN');
  }

  private refresh(): void {
    if (this.state === 'OPEN') {
      const now = this.options.clock.now().getTime();
      if (now - this.openedAt >= this.options.openDurationMs) this.transition('HALF_OPEN');
    }
  }

  private transition(next: CircuitState): void {
    if (this.state === next) return;
    this.state = next;
    this.options.onStateChange?.(this.options.name, next);
  }
}
