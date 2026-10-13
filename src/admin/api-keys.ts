import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Executor } from '../db/database.js';

/**
 * Admin API keys are per tenant: the key IS the tenant identity, so no admin
 * route ever accepts a business id from the client (no IDOR across tenants).
 * Format: rk_<12-char prefix>_<43-char secret>. Only SHA-256(key) is stored;
 * the plaintext is shown once at creation.
 */
const KEY_FORMAT = /^rk_([a-z0-9]{12})_([A-Za-z0-9_-]{43})$/;

export function hashKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

function randomPrefix(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(12);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

export async function createApiKey(db: Executor, businessId: string, name: string): Promise<{ id: string; key: string; prefix: string }> {
  const prefix = randomPrefix();
  const key = `rk_${prefix}_${randomBytes(32).toString('base64url')}`;
  const row = await db
    .insertInto('api_keys')
    .values({ business_id: businessId, name, key_prefix: prefix, key_hash: hashKey(key) })
    .returning('id')
    .executeTakeFirstOrThrow();
  return { id: row.id, key, prefix };
}

export async function revokeApiKey(db: Executor, prefix: string, now: Date): Promise<boolean> {
  const res = await db.updateTable('api_keys').set({ revoked_at: now }).where('key_prefix', '=', prefix).where('revoked_at', 'is', null).executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}

/** Returns the tenant of a valid, non-revoked key; null otherwise. */
export async function authenticateApiKey(db: Executor, presented: string, now: Date): Promise<{ businessId: string; keyId: string } | null> {
  const m = KEY_FORMAT.exec(presented);
  if (!m) return null;
  const row = await db
    .selectFrom('api_keys')
    .select(['id', 'business_id', 'key_hash', 'last_used_at'])
    .where('key_prefix', '=', m[1] as string)
    .where('revoked_at', 'is', null)
    .executeTakeFirst();
  if (!row) return null;
  const a = Buffer.from(hashKey(presented), 'hex');
  const b = Buffer.from(row.key_hash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (!row.last_used_at || now.getTime() - row.last_used_at.getTime() > 60_000) {
    await db.updateTable('api_keys').set({ last_used_at: now }).where('id', '=', row.id).execute();
  }
  return { businessId: row.business_id, keyId: row.id };
}
