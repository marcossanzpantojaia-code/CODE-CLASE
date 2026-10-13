import { json, type Executor } from '../db/database.js';
import type { CrmChannel, CrmSource } from '../db/types.js';

/**
 * CRM timeline. Events reference rows (message, appointment, conversation)
 * instead of copying their content, so no message text or duplicated data
 * lives here. dedupe_key makes recording idempotent across retries.
 */
export type CrmEventType =
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_NAME_CAPTURED'
  | 'MESSAGE_RECEIVED'
  | 'INTENT_DETECTED'
  | 'SERVICE_INTEREST'
  | 'AVAILABILITY_OFFERED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'CONFIRMATION_REQUEST_SENT'
  | 'REMINDER_SENT'
  | 'HUMAN_HANDOFF_REQUESTED'
  | 'HUMAN_HANDOFF_RESOLVED';

export interface CrmEventInput {
  businessId: string;
  customerId: string;
  type: CrmEventType;
  occurredAt: Date;
  source: CrmSource;
  channel?: CrmChannel | null;
  conversationId?: string | null;
  appointmentId?: string | null;
  messageId?: string | null;
  data?: Record<string, unknown>;
  dedupeKey?: string | null;
}

/** Returns false when an event with the same dedupe key already exists. */
export async function recordCrmEvent(db: Executor, e: CrmEventInput): Promise<boolean> {
  const row = await db
    .insertInto('crm_events')
    .values({
      business_id: e.businessId,
      customer_id: e.customerId,
      type: e.type,
      occurred_at: e.occurredAt,
      source: e.source,
      channel: e.channel ?? null,
      conversation_id: e.conversationId ?? null,
      appointment_id: e.appointmentId ?? null,
      message_id: e.messageId ?? null,
      data: json(e.data ?? {}),
      dedupe_key: e.dedupeKey ?? null,
    })
    .onConflict((oc) => oc.columns(['business_id', 'dedupe_key']).where('dedupe_key', 'is not', null).doNothing())
    .returning('id')
    .executeTakeFirst();
  return row !== undefined;
}
