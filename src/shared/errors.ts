/** Base class for expected, domain-level failures (never 5xx, never retried). */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string) {
    super('NOT_FOUND', `${what} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

/** Optimistic concurrency conflict: the caller should retry the whole unit of work. */
export class ConcurrentModificationError extends Error {
  constructor(what: string) {
    super(`${what} was modified concurrently`);
    this.name = 'ConcurrentModificationError';
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function assertNever(value: never, context: string): never {
  throw new Error(`Unexpected value in ${context}: ${JSON.stringify(value)}`);
}
