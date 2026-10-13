import { Kysely, PostgresDialect, type Transaction } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';
import type { AppLogger } from '../observability/logger.js';

// int8 (bigserial ids, count(*)) -> number. Values here stay far below 2^53.
pg.types.setTypeParser(20, (value: string) => Number(value));
// date -> keep the literal 'YYYY-MM-DD' (never shift it through a JS Date/timezone).
pg.types.setTypeParser(1082, (value: string) => value);

export type DB = Kysely<Database>;
export type Tx = Transaction<Database>;
/** Anything that can run queries: the root handle or an open transaction. */
export type Executor = Kysely<Database>;

export interface DatabaseOptions {
  url: string;
  poolMax: number;
  ssl: 'disable' | 'require' | 'no-verify';
  statementTimeoutMs: number;
  applicationName?: string;
}

export interface DatabaseHandle {
  db: DB;
  pool: pg.Pool;
  close(): Promise<void>;
}

export function createDatabase(options: DatabaseOptions, logger?: AppLogger): DatabaseHandle {
  const pool = new pg.Pool({
    connectionString: options.url,
    max: options.poolMax,
    ssl:
      options.ssl === 'disable'
        ? undefined
        : options.ssl === 'require'
          ? { rejectUnauthorized: true }
          : { rejectUnauthorized: false },
    statement_timeout: options.statementTimeoutMs,
    idle_in_transaction_session_timeout: options.statementTimeoutMs * 2,
    connectionTimeoutMillis: 5_000,
    application_name: options.applicationName ?? 'salon-receptionist',
  });
  // An idle client losing its connection must not crash the process.
  pool.on('error', (err) => {
    logger?.error({ event: 'db.pool.error', err: { message: err.message } }, 'idle database client error');
  });
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
  let closed = false;
  return {
    db,
    pool,
    async close() {
      if (closed) return;
      closed = true;
      await db.destroy(); // also ends the pool
    },
  };
}

/** Serialises a value for a JSONB column (pg would turn JS arrays into PG arrays). */
export function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export interface PgError {
  code: string;
  constraint?: string;
  detail?: string;
}

export function isPgError(err: unknown, code?: string): err is PgError {
  if (typeof err !== 'object' || err === null) return false;
  const c = (err as { code?: unknown }).code;
  if (typeof c !== 'string' || !/^[0-9A-Z]{5}$/.test(c)) return false;
  return code === undefined || c === code;
}

export const PG = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  EXCLUSION_VIOLATION: '23P01',
  CHECK_VIOLATION: '23514',
  SERIALIZATION_FAILURE: '40001',
  DEADLOCK_DETECTED: '40P01',
} as const;
