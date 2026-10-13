import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { inject } from 'vitest';
import { createDatabase, type DatabaseHandle } from '../../src/db/database.js';

export interface TestDatabase {
  url: string;
  handle: DatabaseHandle;
  drop(): Promise<void>;
}

async function withAdmin<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: inject('testDatabaseUrl') });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Clones the migrated template into a fresh database for this test file. */
export async function createTestDatabase(poolMax = 10): Promise<TestDatabase> {
  const name = `rt_${randomBytes(6).toString('hex')}`;
  const template = inject('templateDatabase');
  await withAdmin((c) => c.query(`CREATE DATABASE "${name}" TEMPLATE "${template}"`));
  const url = new URL(inject('testDatabaseUrl'));
  url.pathname = `/${name}`;
  const handle = createDatabase({ url: url.toString(), poolMax, ssl: 'disable', statementTimeoutMs: 30_000 });
  return {
    url: url.toString(),
    handle,
    async drop() {
      await handle.close();
      await withAdmin((c) => c.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`));
    },
  };
}
