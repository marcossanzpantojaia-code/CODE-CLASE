import { sql } from 'kysely';
import type { Executor } from '../db/database.js';
import type { Customer, CustomerSource } from '../db/types.js';

/**
 * Customers are identified per tenant by their normalised E.164 phone number
 * (UNIQUE(business_id, phone_e164)). Upserts are atomic, so two webhooks for
 * the same new customer racing each other still produce exactly one row.
 */

export async function upsertCustomerFromWhatsApp(
  db: Executor,
  params: { businessId: string; phoneE164: string; profileName: string | null; at: Date },
): Promise<{ customer: Customer; created: boolean }> {
  const profileName = params.profileName ? params.profileName.slice(0, 120) : null;
  const row = await db
    .insertInto('customers')
    .values({
      business_id: params.businessId,
      phone_e164: params.phoneE164,
      source: 'WHATSAPP',
      whatsapp_profile_name: profileName,
      first_contact_at: params.at,
      last_contact_at: params.at,
    })
    .onConflict((oc) =>
      oc.columns(['business_id', 'phone_e164']).doUpdateSet({
        last_contact_at: sql`GREATEST(customers.last_contact_at, excluded.last_contact_at)`,
        whatsapp_profile_name: sql`COALESCE(excluded.whatsapp_profile_name, customers.whatsapp_profile_name)`,
      }),
    )
    .returningAll()
    .returning(sql<boolean>`(xmax = 0)`.as('inserted'))
    .executeTakeFirstOrThrow();
  const { inserted, ...customer } = row;
  return { customer, created: inserted };
}

export async function findOrCreateCustomer(
  db: Executor,
  params: { businessId: string; phoneE164: string; name: string | null; source: CustomerSource; at: Date },
): Promise<{ customer: Customer; created: boolean }> {
  const row = await db
    .insertInto('customers')
    .values({
      business_id: params.businessId,
      phone_e164: params.phoneE164,
      source: params.source,
      name: params.name,
      name_source: params.name ? 'STAFF' : null,
      first_contact_at: params.at,
      last_contact_at: params.at,
    })
    .onConflict((oc) => oc.columns(['business_id', 'phone_e164']).doUpdateSet({ last_contact_at: sql`customers.last_contact_at` }))
    .returningAll()
    .returning(sql<boolean>`(xmax = 0)`.as('inserted'))
    .executeTakeFirstOrThrow();
  const { inserted, ...customer } = row;
  // A staff-provided name never overwrites an existing one.
  if (!inserted && params.name && !customer.name) {
    await setCustomerNameIfMissing(db, { businessId: params.businessId, customerId: customer.id, name: params.name, source: 'STAFF' });
    customer.name = params.name;
  }
  return { customer, created: inserted };
}

export async function getCustomer(db: Executor, businessId: string, customerId: string): Promise<Customer | null> {
  const row = await db.selectFrom('customers').selectAll().where('business_id', '=', businessId).where('id', '=', customerId).executeTakeFirst();
  return row ?? null;
}

/** Sets the name only if none is stored yet. Returns true when updated. */
export async function setCustomerNameIfMissing(
  db: Executor,
  params: { businessId: string; customerId: string; name: string; source: 'CUSTOMER_STATED' | 'STAFF' | 'IMPORT' },
): Promise<boolean> {
  const res = await db
    .updateTable('customers')
    .set({ name: params.name, name_source: params.source })
    .where('business_id', '=', params.businessId)
    .where('id', '=', params.customerId)
    .where('name', 'is', null)
    .executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}

/**
 * Validates a name the customer stated about themselves ("soy Laura").
 * Conservative: letters (incl. accents), spaces, apostrophes and hyphens only.
 */
export function sanitizeStatedName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 40) return null;
  if (!/^[\p{L}][\p{L}'’\- ]*$/u.test(name)) return null;
  // Title-case each word ("laura" -> "Laura") without touching the rest.
  return name
    .split(' ')
    .map((w) => (w.length > 0 ? w[0]!.toLocaleUpperCase('es') + w.slice(1) : w))
    .join(' ');
}
