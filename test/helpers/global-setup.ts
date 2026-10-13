import { createHash } from 'node:crypto';
import pg from 'pg';
import type { TestProject } from 'vitest/node';
import { createDatabase } from '../../src/db/database.js';
import { loadMigrations, migrate } from '../../src/db/migrator.js';

/**
 * Integration/E2E tests run against a REAL PostgreSQL server
 * (TEST_DATABASE_URL: an admin connection able to CREATE DATABASE).
 * A template database with all migrations applied is built once per migration
 * set; each test file then clones it (CREATE DATABASE ... TEMPLATE), which
 * gives full isolation between files at ~50ms per clone.
 */
declare module 'vitest' {
  export interface ProvidedContext {
    testDatabaseUrl: string;
    templateDatabase: string;
  }
}

export default async function setup(project: TestProject): Promise<void> {
  const adminUrl = process.env.TEST_DATABASE_URL;
  if (!adminUrl) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Start PostgreSQL (scripts/test-db.sh start, docker, or CI service) and export TEST_DATABASE_URL=postgres://user@host:port/postgres',
    );
  }
  const migrations = await loadMigrations();
  const hash = createHash('sha256')
    .update(migrations.map((m) => m.checksum).join(':'))
    .digest('hex')
    .slice(0, 12);
  const template = `receptionist_tpl_${hash}`;

  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [template]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${template}"`);
      const url = new URL(adminUrl);
      url.pathname = `/${template}`;
      const handle = createDatabase({ url: url.toString(), poolMax: 2, ssl: 'disable', statementTimeoutMs: 60_000 });
      try {
        await migrate(handle.db);
      } catch (err) {
        await handle.close();
        await admin.query(`DROP DATABASE IF EXISTS "${template}"`);
        throw err;
      }
      await handle.close();
    }
  } finally {
    await admin.end();
  }
  project.provide('testDatabaseUrl', adminUrl);
  project.provide('templateDatabase', template);
}
