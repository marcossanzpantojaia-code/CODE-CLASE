import { sql } from 'kysely';
import { json, type Executor, type Tx } from '../db/database.js';
import type { Conversation } from '../db/types.js';

/** One conversation per (tenant, customer, channel); upsert is race-safe. */
export async function upsertConversationOnInbound(
  db: Executor,
  params: { businessId: string; customerId: string; channelId: string; inboundAt: Date },
): Promise<Conversation> {
  return db
    .insertInto('conversations')
    .values({
      business_id: params.businessId,
      customer_id: params.customerId,
      whatsapp_channel_id: params.channelId,
      last_inbound_at: params.inboundAt,
    })
    .onConflict((oc) =>
      oc.columns(['business_id', 'customer_id', 'channel']).doUpdateSet({
        whatsapp_channel_id: sql`excluded.whatsapp_channel_id`,
        last_inbound_at: sql`GREATEST(COALESCE(conversations.last_inbound_at, excluded.last_inbound_at), excluded.last_inbound_at)`,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Used by reminders: a conversation must exist to attach outbound messages. */
export async function getOrCreateConversation(db: Executor, params: { businessId: string; customerId: string; channelId: string | null }): Promise<Conversation> {
  await db
    .insertInto('conversations')
    .values({ business_id: params.businessId, customer_id: params.customerId, whatsapp_channel_id: params.channelId })
    .onConflict((oc) => oc.columns(['business_id', 'customer_id', 'channel']).doNothing())
    .execute();
  return db
    .selectFrom('conversations')
    .selectAll()
    .where('business_id', '=', params.businessId)
    .where('customer_id', '=', params.customerId)
    .where('channel', '=', 'WHATSAPP')
    .executeTakeFirstOrThrow();
}

export async function getConversation(db: Executor, businessId: string, conversationId: string): Promise<Conversation | null> {
  return (await db.selectFrom('conversations').selectAll().where('business_id', '=', businessId).where('id', '=', conversationId).executeTakeFirst()) ?? null;
}

export async function lockConversation(trx: Tx, businessId: string, conversationId: string): Promise<Conversation | null> {
  return (
    (await trx
      .selectFrom('conversations')
      .selectAll()
      .where('business_id', '=', businessId)
      .where('id', '=', conversationId)
      .forUpdate()
      .executeTakeFirst()) ?? null
  );
}

/** Optimistic write: succeeds only if nobody changed the conversation since `expectedVersion`. */
export async function saveConversationState(
  trx: Tx,
  params: { businessId: string; conversationId: string; expectedVersion: number; state: unknown; expiresAt: Date | null },
): Promise<boolean> {
  const res = await trx
    .updateTable('conversations')
    .set({ state: json(params.state), state_expires_at: params.expiresAt, version: params.expectedVersion + 1 })
    .where('business_id', '=', params.businessId)
    .where('id', '=', params.conversationId)
    .where('version', '=', params.expectedVersion)
    .executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}

export async function markNeedsHuman(trx: Executor, params: { businessId: string; conversationId: string; reason: string; at: Date }): Promise<boolean> {
  const res = await trx
    .updateTable('conversations')
    .set({ needs_human: true, needs_human_reason: params.reason.slice(0, 200), needs_human_since: params.at, version: sql`version + 1` })
    .where('business_id', '=', params.businessId)
    .where('id', '=', params.conversationId)
    .where('needs_human', '=', false)
    .executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}

/**
 * A person wrote to the customer: the bot stays out of the conversation and the
 * auto-resume clock restarts from now. Returns true when this started the hold.
 */
export async function holdForStaff(trx: Executor, params: { businessId: string; conversationId: string; at: Date }): Promise<boolean> {
  if (await markNeedsHuman(trx, { ...params, reason: 'STAFF_REPLY' })) return true;
  await trx
    .updateTable('conversations')
    .set({ needs_human_since: params.at, version: sql`version + 1` })
    .where('business_id', '=', params.businessId)
    .where('id', '=', params.conversationId)
    .where('needs_human', '=', true)
    .execute();
  return false;
}

export async function resumeBot(trx: Executor, params: { businessId: string; conversationId: string }): Promise<boolean> {
  const res = await trx
    .updateTable('conversations')
    .set({
      needs_human: false,
      needs_human_reason: null,
      needs_human_since: null,
      state: json({ kind: 'IDLE' }),
      state_expires_at: null,
      version: sql`version + 1`,
    })
    .where('business_id', '=', params.businessId)
    .where('id', '=', params.conversationId)
    .where('needs_human', '=', true)
    .executeTakeFirst();
  return Number(res.numUpdatedRows) === 1;
}
