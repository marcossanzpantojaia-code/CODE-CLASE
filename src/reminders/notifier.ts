import type { DB } from '../db/database.js';
import type { ClaimedJob } from '../jobs/queue.js';
import { PermanentJobError, type JobContext } from '../jobs/worker.js';
import { recordIncident } from '../observability/incidents.js';
import type { Metrics } from '../observability/metrics.js';
import { getCustomer } from '../crm/customers.js';
import { buttonsMessage, templateMessage, textMessage, type OutboundContent } from '../messaging/content.js';
import { getOrCreateConversation } from '../messaging/conversations.repository.js';
import { enqueueOutboundMessage } from '../messaging/outbound.service.js';
import { getAppointmentView } from '../scheduling/appointments.repository.js';
import type { Clock } from '../shared/clock.js';
import { localDateOf } from '../shared/time.js';
import { getActiveChannelForBusiness, getBusinessById } from '../tenancy/tenants.repository.js';
import { formatLongDateInline, formatTime, relativeDayLabel, servicesLabel } from '../receptionist/format.js';
import { encodeReplyId } from '../receptionist/reply-ids.js';
import type { NotificationKind } from './scheduler.js';

const WINDOW_MS = 24 * 3_600_000;
/** Use free-form messages only if the window stays open well past the send. */
const WINDOW_SAFETY_MS = 30 * 60_000;

/**
 * Job handler for `appointment.notify` (confirmation request ~24h before and
 * reminder ~2h before). Re-validates the appointment at run time: a cancelled
 * or rescheduled appointment (version changed) never gets a stale message.
 *
 * Inside the 24h customer-service window it sends interactive buttons;
 * outside it MUST use a pre-approved template (WhatsApp policy). Expected
 * templates are documented in docs/OPERACION.md.
 */
export class AppointmentNotifier {
  constructor(private readonly deps: { db: DB; clock: Clock; metrics?: Metrics }) {}

  handle = async (job: ClaimedJob, ctx: JobContext): Promise<string> => {
    const { db, clock, metrics } = this.deps;
    const { appointmentId, version, kind } = job.payload as { appointmentId?: unknown; version?: unknown; kind?: unknown };
    if (typeof appointmentId !== 'string' || typeof version !== 'number' || (kind !== 'CONFIRMATION_REQUEST' && kind !== 'REMINDER') || !job.business_id) {
      throw new PermanentJobError('invalid appointment.notify payload');
    }
    const now = clock.now();
    const log = ctx.logger.child({ businessId: job.business_id, appointmentId, kind });
    const business = await getBusinessById(db, job.business_id);
    if (!business) throw new PermanentJobError('business not found');
    if (!business.reminders_enabled) return 'SKIPPED_REMINDERS_DISABLED';

    const appt = await getAppointmentView(db, business.id, appointmentId);
    if (!appt || (appt.status !== 'BOOKED' && appt.status !== 'CONFIRMED') || appt.version !== version || appt.startsAt.getTime() <= now.getTime()) {
      log.info({ event: 'reminder.skipped', reason: 'APPOINTMENT_CHANGED' }, 'notification skipped');
      return 'SKIPPED_APPOINTMENT_CHANGED';
    }
    if (kind === 'CONFIRMATION_REQUEST' && appt.status === 'CONFIRMED') return 'SKIPPED_ALREADY_CONFIRMED';

    const customer = await getCustomer(db, business.id, appt.customerId);
    if (!customer) throw new PermanentJobError('customer not found');
    const channel = await getActiveChannelForBusiness(db, business.id);
    if (!channel) {
      await recordIncident(db, { businessId: business.id, kind: 'WHATSAPP_SEND_FAILURE', severity: 'CRITICAL', details: { reason: 'NO_ACTIVE_CHANNEL', appointmentId }, at: now }, log, metrics);
      return 'NO_CHANNEL';
    }
    const conversation = await getOrCreateConversation(db, { businessId: business.id, customerId: customer.id, channelId: channel.id });
    const windowOpen = conversation.last_inbound_at !== null && now.getTime() - conversation.last_inbound_at.getTime() < WINDOW_MS - WINDOW_SAFETY_MS;

    const tz = business.timezone;
    const localDate = localDateOf(appt.startsAt, tz);
    const today = localDateOf(now, tz);
    const time = formatTime(appt.startsAt, tz);
    const services = servicesLabel(appt.services.map((s) => s.name));
    const name = customer.name ?? customer.whatsapp_profile_name ?? null;
    const greeting = customer.name ? `Hola ${customer.name} 👋` : '¡Hola! 👋';
    const confirmId = encodeReplyId({ action: 'APPT_CONFIRM', appointmentId: appt.id, version: appt.version });
    const cancelId = encodeReplyId({ action: 'APPT_CANCEL', appointmentId: appt.id, version: appt.version });

    let content: OutboundContent | null = null;
    const notifKind: NotificationKind = kind;
    if (notifKind === 'CONFIRMATION_REQUEST') {
      const text = `${greeting} Te recordamos tu cita en ${business.name} ${relativeDayLabel(localDate, today)} (${formatLongDateInline(localDate)}) a las ${time} para ${services}.\n\n¿Nos confirmas que vienes?`;
      if (windowOpen) {
        content = buttonsMessage(text, [
          { id: confirmId, title: 'Confirmar' },
          { id: cancelId, title: 'Cancelar cita' },
        ]);
      } else if (channel.confirmation_template_name) {
        content = templateMessage({
          name: channel.confirmation_template_name,
          language: channel.template_language,
          bodyParams: [name ?? 'cliente', business.name, formatLongDateInline(localDate), time, services],
          quickReplyPayloads: [confirmId, cancelId],
          fallbackText: text,
        });
      }
    } else {
      const text = `⏰ Recordatorio: ${relativeDayLabel(localDate, today)} a las ${time} tienes cita en ${business.name} para ${services}. ¡Te esperamos!\n\nSi no puedes venir, avísanos por aquí.`;
      if (windowOpen) {
        content = textMessage(text);
      } else if (channel.reminder_template_name) {
        content = templateMessage({
          name: channel.reminder_template_name,
          language: channel.template_language,
          bodyParams: [name ?? 'cliente', business.name, formatLongDateInline(localDate), time, services],
          fallbackText: text,
        });
      }
    }

    if (!content) {
      // Outside the 24h window WhatsApp only allows approved templates.
      await recordIncident(
        db,
        { businessId: business.id, conversationId: conversation.id, kind: 'TEMPLATE_NOT_CONFIGURED', severity: 'WARNING', details: { appointmentId, kind }, at: now },
        log,
        metrics,
      );
      return 'NOT_SENT_NO_TEMPLATE';
    }

    await enqueueOutboundMessage(db, {
      businessId: business.id,
      conversationId: conversation.id,
      content,
      purpose: notifKind,
      idempotencyKey: `notify:${appt.id}:v${appt.version}:${notifKind}`,
      appointmentId: appt.id,
      appointmentVersion: appt.version,
      expiresAt: appt.startsAt,
      now,
    });
    log.info({ event: 'reminder.queued', template: content.type === 'template' }, 'appointment notification queued');
    return 'QUEUED';
  };
}
