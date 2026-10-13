import type { Executor } from '../db/database.js';
import type { Business, WhatsappChannel } from '../db/types.js';

export async function getBusinessById(db: Executor, businessId: string): Promise<Business | null> {
  return (await db.selectFrom('businesses').selectAll().where('id', '=', businessId).executeTakeFirst()) ?? null;
}

export async function getBusinessBySlug(db: Executor, slug: string): Promise<Business | null> {
  return (await db.selectFrom('businesses').selectAll().where('slug', '=', slug).executeTakeFirst()) ?? null;
}

/** Tenant resolution for inbound webhooks: Meta's phone_number_id -> active channel. */
export async function getActiveChannelByPhoneNumberId(db: Executor, phoneNumberId: string): Promise<WhatsappChannel | null> {
  return (
    (await db
      .selectFrom('whatsapp_channels')
      .selectAll()
      .where('phone_number_id', '=', phoneNumberId)
      .where('active', '=', true)
      .executeTakeFirst()) ?? null
  );
}

export async function getActiveChannelForBusiness(db: Executor, businessId: string): Promise<WhatsappChannel | null> {
  return (
    (await db
      .selectFrom('whatsapp_channels')
      .selectAll()
      .where('business_id', '=', businessId)
      .where('active', '=', true)
      .executeTakeFirst()) ?? null
  );
}

export interface BusinessFlags {
  automatedReceptionistEnabled?: boolean;
  safeMode?: boolean;
  remindersEnabled?: boolean;
}

export async function updateBusinessFlags(db: Executor, businessId: string, flags: BusinessFlags): Promise<Business | null> {
  const set: { automated_receptionist_enabled?: boolean; safe_mode?: boolean; reminders_enabled?: boolean } = {};
  if (flags.automatedReceptionistEnabled !== undefined) set.automated_receptionist_enabled = flags.automatedReceptionistEnabled;
  if (flags.safeMode !== undefined) set.safe_mode = flags.safeMode;
  if (flags.remindersEnabled !== undefined) set.reminders_enabled = flags.remindersEnabled;
  if (Object.keys(set).length === 0) return getBusinessById(db, businessId);
  return (await db.updateTable('businesses').set(set).where('id', '=', businessId).returningAll().executeTakeFirst()) ?? null;
}
