import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';
import type { DB } from './database.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * SQL migrations live in src/db/migrations as NNNN_name.sql and are copied to
 * dist by the build. They run in order, each one inside its own transaction,
 * under a cluster-wide advisory lock so concurrent deploys cannot race. Applied
 * migrations are checksummed: editing an already-applied file is an error.
 */
const MIGRATION_LOCK_KEY = 8_133_742_001;

export interface MigrationFile {
  version: string;
  sql: string;
  checksum: string;
}

export function migrationsDir(): string {
  // dist/db/migrator.js -> dist/db/migrations ; src/db/migrator.ts -> src/db/migrations
  return path.join(here, 'migrations');
}

export async function loadMigrations(dir = migrationsDir()): Promise<MigrationFile[]> {
  const files = (await readdir(dir)).filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f)).sort();
  return Promise.all(
    files.map(async (file) => {
      const content = await readFile(path.join(dir, file), 'utf8');
      return {
        version: file.replace(/\.sql$/, ''),
        sql: content,
        checksum: createHash('sha256').update(content).digest('hex'),
      };
    }),
  );
}

export async function migrate(db: DB, dir?: string): Promise<{ applied: string[] }> {
  const migrations = await loadMigrations(dir);
  return db.connection().execute(async (conn) => {
    await sql`SELECT pg_advisory_lock(${MIGRATION_LOCK_KEY})`.execute(conn);
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version text PRIMARY KEY,
          checksum text NOT NULL,
          applied_at timestamptz NOT NULL DEFAULT now()
        )`.execute(conn);
      const rows = await conn.selectFrom('schema_migrations').select(['version', 'checksum']).execute();
      const done = new Map(rows.map((r) => [r.version, r.checksum]));
      const applied: string[] = [];
      for (const m of migrations) {
        const existing = done.get(m.version);
        if (existing !== undefined) {
          if (existing !== m.checksum) {
            throw new Error(`Migration ${m.version} was modified after being applied (checksum mismatch)`);
          }
          continue;
        }
        await conn.transaction().execute(async (trx) => {
          await sql.raw(m.sql).execute(trx);
          await trx.insertInto('schema_migrations').values({ version: m.version, checksum: m.checksum }).execute();
        });
        applied.push(m.version);
      }
      return { applied };
    } finally {
      await sql`SELECT pg_advisory_unlock(${MIGRATION_LOCK_KEY})`.execute(conn);
    }
  });
}

/** Used by readiness: the running code must not be ahead of the database schema. */
export async function pendingMigrations(db: DB, dir?: string): Promise<string[]> {
  const migrations = await loadMigrations(dir);
  const exists = await sql<{ exists: boolean }>`SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists`.execute(db);
  if (!exists.rows[0]?.exists) return migrations.map((m) => m.version);
  const rows = await db.selectFrom('schema_migrations').select('version').execute();
  const done = new Set(rows.map((r) => r.version));
  return migrations.filter((m) => !done.has(m.version)).map((m) => m.version);
}
