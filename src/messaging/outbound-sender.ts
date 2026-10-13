import { json, type DB } from '../db/database.js';
import type { Message } from '../db/types.js';
import type { ClaimedJob } from '../jobs/queue.js';
import { DeferJobError, PermanentJobError, RetryableJobError, type JobContext } from '../jobs/worker.js';
import { recordIncident } from '../observability/incidents.js';
import type { Metrics } from '../observability/metrics.js';
import { recordCrmEvent } from '../crm/crm-events.js';
import { backoffDelayMs } from '../shared/backoff.js';
import type { CircuitBreaker } from '../shared/circuit-breaker.js';
import type { Clock } from '../shared/clock.js';
import { errorMessage } from '../shared/errors.js';
import { toWhatsAppRecipient } from '../shared/phone.js';
import { getActiveChannelForBusiness } from '../tenancy/tenants.repository.js';
import type { OutboundContent } from './content.js';
import { markNeedsHuman } from './conversations.repository.js';
import { applyStatusEvents } from './status.service.js';
import { resolveSecretRef, WhatsAppApiError, type WhatsAppCloudClient } from './whatsapp/cloud-api.js';

const SERVICE_WINDOW_MS = 24 * 3_600_000;
/** Safety margin: do not attempt free-form messages in the last minutes of the window. */
const WINDOW_MARGIN_MS = 5 * 60_000;

export interface OutboundSenderDeps {
  db: DB;
  clock: Clock;
  client: WhatsAppCloudClient;
  breaker: CircuitBreaker;
  isOutboundEnabled: () => boolean;
  env?: NodeJS.ProcessEnv;
  metrics?: Metrics;
}

/**
 * Job handler for `outbound.send`. Every check that could make a message
 * wrong or harmful happens right before the provider call.
 */
export class OutboundSender {
  constructor(private readonly deps: OutboundSenderDeps) {}

  handle = async (job: ClaimedJob, ctx: JobContext): Promise<string> => {
    const { db, clock, metrics } = this.deps;
    const messageId = job.payload.messageId;
    if (typeof messageId !== 'string' || !job.business_id) throw new PermanentJobError('invalid outbound.send payload');
    const businessId = job.business_id;
    const log = ctx.logger.child({ businessId, messageId });

    const msg = await db
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', messageId)
      .where('business_id', '=', businessId)
      .where('direction', '=', 'OUTBOUND')
      .executeTakeFirst();
    if (!msg) return 'MISSING';
    if (['ACCEPTED', 'SENT', 'DELIVERED', 'READ'].includes(msg.status)) return 'ALREADY_SENT';
    if (msg.status === 'CANCELLED' || msg.status === 'FAILED') return `SKIPPED_${msg.status}`;
    if (msg.status === 'SENDING') {
      // A previous attempt died mid-call: the provider may or may not have the
      // message. We favour delivery (at-least-once) and record the risk.
      log.warn({ event: 'outbound.unknown_outcome_resend', conversationId: msg.conversation_id }, 're-sending message whose previous attempt outcome is unknown');
    }

    // 1. Global kill switch: hold the message, do not drop it.
    if (!this.deps.isOutboundEnabled()) throw new DeferJobError('outbound messaging disabled (OUTBOUND_MESSAGING_ENABLED=false)', 60_000);

    const now = clock.now();
    // 2. Stale conversational replies are dropped (no zombie answers after an outage).
    if (msg.expires_at && msg.expires_at.getTime() <= now.getTime()) {
      await this.finish(msg, 'CANCELLED', 'EXPIRED_BEFORE_SEND', null);
      if (msg.purpose === 'REPLY' || msg.purpose === 'FALLBACK') {
        await markNeedsHuman(db, { businessId, conversationId: msg.conversation_id, reason: 'REPLY_NOT_DELIVERED_IN_TIME', at: now });
      }
      await recordIncident(db, { businessId, conversationId: msg.conversation_id, kind: 'STALE_REPLY_DROPPED', severity: 'WARNING', details: { messageId: msg.id, purpose: msg.purpose }, at: now }, log, metrics);
      return 'EXPIRED';
    }

    // 3. Appointment-bound messages must still match the live appointment.
    if (msg.appointment_id) {
      const appt = await db
        .selectFrom('appointments')
        .select(['status', 'version', 'starts_at'])
        .where('id', '=', msg.appointment_id)
        .where('business_id', '=', businessId)
        .executeTakeFirst();
      const stillValid =
        appt &&
        (appt.status === 'BOOKED' || appt.status === 'CONFIRMED') &&
        (msg.appointment_version === null || appt.version === msg.appointment_version) &&
        appt.starts_at.getTime() > now.getTime();
      if (!stillValid && (msg.purpose === 'CONFIRMATION_REQUEST' || msg.purpose === 'REMINDER')) {
        await this.finish(msg, 'CANCELLED', 'APPOINTMENT_CHANGED', null);
        log.info({ event: 'outbound.skipped_appointment_changed', appointmentId: msg.appointment_id }, 'reminder skipped: appointment changed or cancelled');
        return 'SKIPPED_APPOINTMENT_CHANGED';
      }
    }

    const conversation = await db
      .selectFrom('conversations')
      .innerJoin('customers', (j) => j.onRef('customers.id', '=', 'conversations.customer_id').onRef('customers.business_id', '=', 'conversations.business_id'))
      .select(['conversations.id', 'conversations.last_inbound_at', 'conversations.whatsapp_channel_id', 'customers.phone_e164'])
      .where('conversations.id', '=', msg.conversation_id)
      .where('conversations.business_id', '=', businessId)
      .executeTakeFirst();
    if (!conversation) throw new PermanentJobError('conversation not found for outbound message');

    const content = msg.payload as unknown as OutboundContent;
    // 4. 24h customer service window: free-form messages only inside it.
    if (content.type !== 'template') {
      const last = conversation.last_inbound_at?.getTime() ?? 0;
      if (now.getTime() - last > SERVICE_WINDOW_MS - WINDOW_MARGIN_MS) {
        await this.finish(msg, 'FAILED', 'OUTSIDE_SERVICE_WINDOW', { classification: 'OUTSIDE_WINDOW', message: 'free-form message outside 24h window' });
        await recordIncident(db, { businessId, conversationId: msg.conversation_id, kind: 'OUTSIDE_SERVICE_WINDOW', severity: 'WARNING', details: { messageId: msg.id, purpose: msg.purpose }, at: now }, log, metrics);
        return 'OUTSIDE_SERVICE_WINDOW';
      }
    }

    // Reply from the number the customer wrote to; if that channel was deactivated,
    // fall back to the tenant's current active number.
    const conversationChannel = conversation.whatsapp_channel_id
      ? await db
          .selectFrom('whatsapp_channels')
          .selectAll()
          .where('id', '=', conversation.whatsapp_channel_id)
          .where('business_id', '=', businessId)
          .where('active', '=', true)
          .executeTakeFirst()
      : undefined;
    const activeChannel = conversationChannel ?? (await getActiveChannelForBusiness(db, businessId));
    if (!activeChannel) {
      await this.finish(msg, 'FAILED', 'NO_ACTIVE_CHANNEL', { classification: 'PERMANENT', message: 'no active WhatsApp channel' });
      await recordIncident(db, { businessId, kind: 'WHATSAPP_SEND_FAILURE', severity: 'CRITICAL', details: { reason: 'NO_ACTIVE_CHANNEL' }, at: now }, log, metrics);
      return 'NO_CHANNEL';
    }
    const token = resolveSecretRef(activeChannel.access_token_ref, this.deps.env);
    if (!token) {
      await this.finish(msg, 'FAILED', 'MISSING_ACCESS_TOKEN', { classification: 'AUTH', message: `secret ${activeChannel.access_token_ref} not available` });
      await recordIncident(db, { businessId, kind: 'WHATSAPP_AUTH_FAILURE', severity: 'CRITICAL', details: { reason: 'MISSING_ACCESS_TOKEN', ref: activeChannel.access_token_ref }, at: now }, log, metrics);
      return 'NO_TOKEN';
    }

    // 5. Provider outage protection.
    if (!this.deps.breaker.tryAcquire()) throw new DeferJobError('WhatsApp circuit open', 30_000);

    await db.updateTable('messages').set({ status: 'SENDING', attempts: msg.attempts + 1 }).where('id', '=', msg.id).execute();
    let providerMessageId: string;
    let providerStatus: string | null;
    try {
      const result = await this.deps.client.sendMessage({
        phoneNumberId: activeChannel.phone_number_id,
        accessToken: token,
        to: toWhatsAppRecipient(conversation.phone_e164),
        content,
      });
      this.deps.breaker.recordSuccess();
      providerMessageId = result.providerMessageId;
      providerStatus = result.messageStatus;
    } catch (err) {
      return this.handleSendError(err, msg, businessId, job, log);
    }

    const acceptedAt = clock.now();
    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('messages')
        .set({
          status: 'ACCEPTED',
          provider_message_id: providerMessageId,
          accepted_at: acceptedAt,
          provider_error: providerStatus && providerStatus !== 'accepted' ? json({ messageStatus: providerStatus }) : null,
        })
        .where('id', '=', msg.id)
        .execute();
      await trx.updateTable('conversations').set({ last_outbound_at: acceptedAt }).where('id', '=', msg.conversation_id).execute();
      await applyStatusEvents(trx, providerMessageId);
      if ((msg.purpose === 'CONFIRMATION_REQUEST' || msg.purpose === 'REMINDER') && msg.appointment_id) {
        const appt = await trx.selectFrom('appointments').select('customer_id').where('id', '=', msg.appointment_id).executeTakeFirst();
        if (appt) {
          await recordCrmEvent(trx, {
            businessId,
            customerId: appt.customer_id,
            type: msg.purpose === 'REMINDER' ? 'REMINDER_SENT' : 'CONFIRMATION_REQUEST_SENT',
            occurredAt: acceptedAt,
            source: 'SYSTEM',
            channel: 'WHATSAPP',
            conversationId: msg.conversation_id,
            appointmentId: msg.appointment_id,
            messageId: msg.id,
            data: { contentType: content.type },
            dedupeKey: `${msg.purpose.toLowerCase()}_sent:${msg.id}`,
          });
        }
      }
    });

    metrics?.messagesSent.inc({ purpose: msg.purpose ?? 'UNKNOWN', content_type: content.type });
    if (msg.reply_to_message_id) {
      const inbound = await db.selectFrom('messages').select('created_at').where('id', '=', msg.reply_to_message_id).executeTakeFirst();
      if (inbound) metrics?.replyLatencySeconds.observe(Math.max(0, acceptedAt.getTime() - inbound.created_at.getTime()) / 1000);
    }
    log.info(
      { event: 'whatsapp.message.sent', conversationId: msg.conversation_id, providerMessageId, purpose: msg.purpose, appointmentId: msg.appointment_id ?? undefined },
      'outbound message accepted by WhatsApp',
    );
    return 'SENT';
  };

  private async handleSendError(err: unknown, msg: Message, businessId: string, job: ClaimedJob, log: JobContext['logger']): Promise<never> {
    const { db, clock, metrics } = this.deps;
    const now = clock.now();
    const apiErr =
      err instanceof WhatsAppApiError ? err : new WhatsAppApiError(errorMessage(err), 'RETRYABLE', null, null, null, null, null);
    metrics?.whatsappFailures.inc({ reason: apiErr.classification });
    if (apiErr.classification === 'RETRYABLE' || apiErr.classification === 'RATE_LIMITED' || apiErr.classification === 'AUTH') {
      this.deps.breaker.recordFailure();
    } else {
      // The provider answered sensibly; the request itself was bad.
      this.deps.breaker.recordSuccess();
    }
    log.warn({ event: 'provider.error', provider: 'whatsapp', conversationId: msg.conversation_id, error: apiErr.toJSON() }, 'WhatsApp send failed');

    const lastAttempt = job.attempts >= job.max_attempts;
    if (apiErr.retryable && !lastAttempt) {
      await db.updateTable('messages').set({ status: 'QUEUED', provider_error: json(apiErr.toJSON()) }).where('id', '=', msg.id).execute();
      const base = apiErr.classification === 'RATE_LIMITED' ? 15_000 : 2_000;
      const delay = apiErr.retryAfterMs ?? backoffDelayMs(job.attempts, { baseMs: base, maxMs: 10 * 60_000 });
      throw new RetryableJobError(`WhatsApp ${apiErr.classification}: ${apiErr.message}`, delay);
    }

    await this.finish(msg, 'FAILED', apiErr.classification, apiErr.toJSON());
    const critical = apiErr.classification === 'AUTH';
    await recordIncident(
      db,
      {
        businessId,
        conversationId: msg.conversation_id,
        kind: critical ? 'WHATSAPP_AUTH_FAILURE' : 'WHATSAPP_SEND_FAILURE',
        severity: critical ? 'CRITICAL' : 'WARNING',
        details: { messageId: msg.id, purpose: msg.purpose, error: apiErr.toJSON() },
        at: now,
      },
      log,
      metrics,
    );
    if (msg.purpose === 'REPLY' || msg.purpose === 'FALLBACK' || msg.purpose === 'HANDOFF_ACK') {
      // The customer is waiting for an answer that will not arrive: a human must follow up.
      await markNeedsHuman(db, { businessId, conversationId: msg.conversation_id, reason: `SEND_FAILED_${apiErr.classification}`, at: now });
    }
    throw new PermanentJobError(`WhatsApp ${apiErr.classification}: ${apiErr.message}`);
  }

  private async finish(msg: Message, status: 'FAILED' | 'CANCELLED', outcome: string, error: Record<string, unknown> | null): Promise<void> {
    const now = this.deps.clock.now();
    await this.deps.db
      .updateTable('messages')
      .set({
        status,
        processing_outcome: outcome,
        ...(status === 'FAILED' ? { failed_at: now } : {}),
        ...(error ? { provider_error: json(error) } : {}),
      })
      .where('id', '=', msg.id)
      .execute();
  }
}
