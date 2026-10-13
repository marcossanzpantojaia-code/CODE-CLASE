import { json, type DB } from '../db/database.js';
import type { AppLogger } from '../observability/logger.js';
import type { Metrics } from '../observability/metrics.js';
import { recordIncident } from '../observability/incidents.js';
import { recordCrmEvent } from '../crm/crm-events.js';
import { upsertCustomerFromWhatsApp } from '../crm/customers.js';
import { enqueueJob } from '../jobs/queue.js';
import type { Clock } from '../shared/clock.js';
import { addMs } from '../shared/clock.js';
import { errorMessage } from '../shared/errors.js';
import { maskPhone, normalizePhone } from '../shared/phone.js';
import { getActiveChannelByPhoneNumberId } from '../tenancy/tenants.repository.js';
import { upsertConversationOnInbound } from './conversations.repository.js';
import { applyStatusEvents, recordStatusEvent } from './status.service.js';
import {
  ChangeValueSchema,
  InboundMessageSchema,
  StatusSchema,
  WebhookPayloadSchema,
  normalizeInboundContent,
  type InboundMessage,
} from './whatsapp/webhook-schema.js';

export interface WebhookResult {
  messagesStored: number;
  duplicates: number;
  statusesRecorded: number;
  ignored: number;
}

/**
 * Turns a verified webhook payload into durable state. Runs inside the HTTP
 * request, so it only does fast, local work; interpretation and replies
 * happen in the worker (`receptionist.process`).
 *
 * Idempotency: messages.provider_message_id is UNIQUE. A message delivered 3
 * times is stored, counted in the CRM and enqueued for processing exactly once.
 */
export class InboundService {
  constructor(
    private readonly db: DB,
    private readonly clock: Clock,
    private readonly options: { inboundDebounceMs: number },
    private readonly logger: AppLogger,
    private readonly metrics?: Metrics,
  ) {}

  async handleWebhook(payload: unknown): Promise<WebhookResult> {
    const result: WebhookResult = { messagesStored: 0, duplicates: 0, statusesRecorded: 0, ignored: 0 };
    const parsed = WebhookPayloadSchema.safeParse(payload);
    if (!parsed.success || parsed.data.object !== 'whatsapp_business_account') {
      this.logger.warn({ event: 'whatsapp.webhook.unrecognized' }, 'ignoring webhook with unexpected shape');
      result.ignored++;
      return result;
    }
    for (const entry of parsed.data.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') {
          result.ignored++;
          continue;
        }
        const value = ChangeValueSchema.safeParse(change.value);
        if (!value.success || !value.data.metadata) {
          result.ignored++;
          continue;
        }
        const phoneNumberId = value.data.metadata.phone_number_id;
        const channel = await getActiveChannelByPhoneNumberId(this.db, phoneNumberId);
        if (!channel) {
          // Not ours (or deactivated): acknowledge so Meta does not retry forever.
          this.metrics?.unknownChannelWebhooks.inc();
          this.logger.warn({ event: 'whatsapp.webhook.unknown_channel', phoneNumberId }, 'webhook for unmapped phone_number_id');
          result.ignored++;
          continue;
        }
        const profileNames = new Map((value.data.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]));

        for (const raw of value.data.messages ?? []) {
          const msg = InboundMessageSchema.safeParse(raw);
          if (!msg.success) {
            result.ignored++;
            continue;
          }
          const outcome = await this.storeMessage(channel.business_id, channel.id, msg.data, profileNames.get(msg.data.from) ?? null);
          if (outcome === 'stored') {
            result.messagesStored++;
          } else if (outcome === 'duplicate') {
            result.duplicates++;
            this.metrics?.duplicateWebhooks.inc({ kind: 'message' });
            this.logger.info({ event: 'whatsapp.webhook.duplicate', businessId: channel.business_id, providerMessageId: msg.data.id }, 'duplicate message ignored');
          } else {
            result.ignored++;
          }
        }

        for (const raw of value.data.statuses ?? []) {
          const st = StatusSchema.safeParse(raw);
          if (!st.success) {
            result.ignored++;
            continue;
          }
          const inserted = await this.db.transaction().execute(async (trx) => {
            const ok = await recordStatusEvent(trx, {
              businessId: channel.business_id,
              providerMessageId: st.data.id,
              status: st.data.status,
              occurredAt: new Date(Number(st.data.timestamp) * 1000),
              errors: st.data.errors ?? null,
            });
            if (ok) await applyStatusEvents(trx, st.data.id);
            return ok;
          });
          if (inserted) {
            result.statusesRecorded++;
            this.metrics?.statusUpdates.inc({ status: st.data.status });
            if (st.data.status === 'failed') {
              this.logger.warn(
                { event: 'whatsapp.message.delivery_failed', businessId: channel.business_id, providerMessageId: st.data.id, errorCodes: st.data.errors?.map((e) => e.code) },
                'WhatsApp reported delivery failure',
              );
            }
          } else {
            this.metrics?.duplicateWebhooks.inc({ kind: 'status' });
          }
        }
      }
    }
    return result;
  }

  private async storeMessage(
    businessId: string,
    channelId: string,
    msg: InboundMessage,
    profileName: string | null,
  ): Promise<'stored' | 'duplicate' | 'invalid'> {
    const now = this.clock.now();
    const phone = normalizePhone(msg.from, { assumeInternational: true });
    if (!phone) {
      await recordIncident(this.db, { businessId, kind: 'INVALID_SENDER', severity: 'WARNING', details: { waType: msg.type }, at: now }, this.logger, this.metrics);
      return 'invalid';
    }
    const content = normalizeInboundContent(msg);
    const sentAt = new Date(Number(msg.timestamp) * 1000);

    try {
      return await this.db.transaction().execute(async (trx) => {
        // Duplicate check first: a redelivered webhook must not touch anything.
        const already = await trx.selectFrom('messages').select('id').where('provider_message_id', '=', msg.id).executeTakeFirst();
        if (already) return 'duplicate' as const;

        const { customer, created } = await upsertCustomerFromWhatsApp(trx, { businessId, phoneE164: phone, profileName, at: now });
        const conversation = await upsertConversationOnInbound(trx, { businessId, customerId: customer.id, channelId, inboundAt: now });
        const inserted = await trx
          .insertInto('messages')
          .values({
            business_id: businessId,
            conversation_id: conversation.id,
            direction: 'INBOUND',
            provider_message_id: msg.id,
            content_type: content.kind === 'text' ? 'text' : content.kind === 'reply' ? 'reply' : msg.type.slice(0, 40),
            text: content.kind === 'text' ? content.text.slice(0, 4096) : content.kind === 'reply' ? content.title.slice(0, 256) : null,
            payload: json(content.kind === 'reply' ? { replyId: content.replyId } : content.kind === 'text' ? {} : { waType: content.waType }),
            status: content.kind === 'ignored' ? 'PROCESSED' : 'RECEIVED',
            provider_timestamp: sentAt,
            processed_at: content.kind === 'ignored' ? now : null,
            processing_outcome: content.kind === 'ignored' ? 'IGNORED_TYPE' : null,
            created_at: now,
          })
          .onConflict((oc) => oc.column('provider_message_id').where('provider_message_id', 'is not', null).doNothing())
          .returning('id')
          .executeTakeFirst();
        if (!inserted) return 'duplicate' as const;

        if (created) {
          await recordCrmEvent(trx, {
            businessId,
            customerId: customer.id,
            type: 'CUSTOMER_CREATED',
            occurredAt: now,
            source: 'WHATSAPP_RECEPTIONIST',
            channel: 'WHATSAPP',
            conversationId: conversation.id,
            messageId: inserted.id,
            data: { source: 'WHATSAPP' },
            dedupeKey: `customer_created:${customer.id}`,
          });
        }
        await recordCrmEvent(trx, {
          businessId,
          customerId: customer.id,
          type: 'MESSAGE_RECEIVED',
          occurredAt: now,
          source: 'CUSTOMER',
          channel: 'WHATSAPP',
          conversationId: conversation.id,
          messageId: inserted.id,
          data: { contentType: content.kind },
          dedupeKey: `message_received:${msg.id}`,
        });
        if (content.kind !== 'ignored') {
          await enqueueJob(trx, {
            type: 'receptionist.process',
            businessId,
            payload: { conversationId: conversation.id },
            // Short debounce: bursts of messages are interpreted together.
            runAt: addMs(now, this.options.inboundDebounceMs),
            maxAttempts: 5,
            concurrencyKey: `conv:${conversation.id}:in`,
            dedupeKey: `inbound:${msg.id}`,
          });
        }
        this.metrics?.messagesReceived.inc({ type: content.kind });
        this.logger.info(
          {
            event: 'whatsapp.message.received',
            businessId,
            conversationId: conversation.id,
            messageId: inserted.id,
            providerMessageId: msg.id,
            from: maskPhone(phone),
            contentType: content.kind,
            newCustomer: created,
          },
          'inbound WhatsApp message stored',
        );
        return 'stored' as const;
      });
    } catch (err) {
      // Unique violation from a concurrent duplicate delivery racing this one.
      if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') return 'duplicate';
      this.logger.error({ event: 'whatsapp.message.store_failed', businessId, err: { message: errorMessage(err) } }, 'failed to store inbound message');
      throw err;
    }
  }
}
