import { json, type Executor } from '../db/database.js';
import type { MessageStatus } from '../db/types.js';

/**
 * Delivery statuses (sent -> delivered -> read, or failed) arrive as separate
 * webhooks, possibly duplicated and out of order. Every event is stored once
 * (UNIQUE(provider_message_id, status)) and the message's fields are recomputed
 * from ALL stored events, which makes the result order-independent and
 * idempotent. Events that arrive before we know the wamid are re-applied when
 * the send completes.
 */

export async function recordStatusEvent(
  db: Executor,
  e: { businessId: string | null; providerMessageId: string; status: string; occurredAt: Date; errors: unknown[] | null },
): Promise<boolean> {
  const row = await db
    .insertInto('message_status_events')
    .values({
      business_id: e.businessId,
      provider_message_id: e.providerMessageId,
      status: e.status.toLowerCase(),
      occurred_at: e.occurredAt,
      errors: e.errors ? json(e.errors) : null,
    })
    .onConflict((oc) => oc.columns(['provider_message_id', 'status']).doNothing())
    .returning('id')
    .executeTakeFirst();
  return row !== undefined;
}

const RANK: Record<string, number> = { ACCEPTED: 1, SENT: 2, DELIVERED: 3, READ: 4 };

/** Returns the derived status of the message after applying all known events, or null if unknown wamid. */
export async function applyStatusEvents(db: Executor, providerMessageId: string): Promise<MessageStatus | null> {
  const message = await db
    .selectFrom('messages')
    .select(['id', 'status'])
    .where('provider_message_id', '=', providerMessageId)
    .where('direction', '=', 'OUTBOUND')
    .executeTakeFirst();
  if (!message) return null;
  const events = await db
    .selectFrom('message_status_events')
    .select(['status', 'occurred_at', 'errors'])
    .where('provider_message_id', '=', providerMessageId)
    .execute();
  if (events.length === 0) return message.status;

  const at = (s: string) => events.find((e) => e.status === s)?.occurred_at ?? null;
  const sentAt = at('sent');
  const deliveredAt = at('delivered');
  const readAt = at('read');
  const failed = events.find((e) => e.status === 'failed');

  let status: MessageStatus = message.status;
  const candidates: MessageStatus[] = [];
  if (sentAt) candidates.push('SENT');
  if (deliveredAt) candidates.push('DELIVERED');
  if (readAt) candidates.push('READ');
  for (const c of candidates) if ((RANK[c] ?? 0) > (RANK[status] ?? 0)) status = c;
  // A failure is terminal unless the message was demonstrably delivered/read.
  if (failed && !deliveredAt && !readAt) status = 'FAILED';

  await db
    .updateTable('messages')
    .set({
      status,
      ...(sentAt ? { sent_at: sentAt } : {}),
      ...(deliveredAt ? { delivered_at: deliveredAt } : {}),
      ...(readAt ? { read_at: readAt } : {}),
      ...(failed ? { failed_at: failed.occurred_at, provider_error: json({ source: 'status_webhook', errors: failed.errors }) } : {}),
    })
    .where('id', '=', message.id)
    .execute();
  return status;
}
