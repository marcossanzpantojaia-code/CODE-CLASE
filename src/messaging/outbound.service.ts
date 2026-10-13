import { json, type Executor } from '../db/database.js';
import type { MessagePurpose } from '../db/types.js';
import { enqueueJob } from '../jobs/queue.js';
import { renderPlainText, type OutboundContent } from './content.js';

export interface OutboundRequest {
  businessId: string;
  conversationId: string;
  content: OutboundContent;
  purpose: MessagePurpose;
  /** Deterministic key: the same logical message is stored (and sent) at most once. */
  idempotencyKey: string;
  replyToMessageId?: string | null;
  appointmentId?: string | null;
  appointmentVersion?: number | null;
  /** After this instant the message is stale and will be dropped instead of sent. */
  expiresAt?: Date | null;
  now: Date;
}

/**
 * Stores an outbound message as QUEUED and enqueues its send job in the SAME
 * transaction (outbox). Sends of one conversation share a concurrency key,
 * so they leave in order.
 */
export async function enqueueOutboundMessage(db: Executor, req: OutboundRequest): Promise<{ messageId: string; created: boolean }> {
  const inserted = await db
    .insertInto('messages')
    .values({
      business_id: req.businessId,
      conversation_id: req.conversationId,
      direction: 'OUTBOUND',
      content_type: req.content.type,
      text: renderPlainText(req.content),
      payload: json(req.content),
      status: 'QUEUED',
      idempotency_key: req.idempotencyKey,
      purpose: req.purpose,
      reply_to_message_id: req.replyToMessageId ?? null,
      appointment_id: req.appointmentId ?? null,
      appointment_version: req.appointmentVersion ?? null,
      expires_at: req.expiresAt ?? null,
      created_at: req.now,
    })
    .onConflict((oc) => oc.columns(['business_id', 'idempotency_key']).where('idempotency_key', 'is not', null).doNothing())
    .returning('id')
    .executeTakeFirst();
  if (!inserted) {
    const existing = await db
      .selectFrom('messages')
      .select('id')
      .where('business_id', '=', req.businessId)
      .where('idempotency_key', '=', req.idempotencyKey)
      .executeTakeFirstOrThrow();
    return { messageId: existing.id, created: false };
  }
  await enqueueJob(db, {
    type: 'outbound.send',
    businessId: req.businessId,
    payload: { messageId: inserted.id },
    runAt: req.now,
    maxAttempts: 6,
    concurrencyKey: `conv:${req.conversationId}:out`,
    dedupeKey: `send:${inserted.id}`,
  });
  return { messageId: inserted.id, created: true };
}
