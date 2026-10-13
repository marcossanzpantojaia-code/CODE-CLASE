import type { Executor } from '../db/database.js';
import type { Business } from '../db/types.js';
import { addMinutes } from '../shared/clock.js';
import { cancelJobGroup, enqueueJob } from '../jobs/queue.js';

/**
 * Appointment notifications (confirmation request + reminder) are ordinary
 * scheduled jobs enqueued in the SAME transaction that creates/reschedules the
 * appointment. Cancelling or rescheduling cancels the whole job group, and the
 * handler re-checks status + version before sending (double protection
 * against "reminder sent after cancelling").
 */

export type NotificationKind = 'CONFIRMATION_REQUEST' | 'REMINDER';

export interface ScheduledNotification {
  kind: NotificationKind;
  runAt: Date;
}

export function appointmentGroupKey(appointmentId: string): string {
  return `appt:${appointmentId}`;
}

/** Minimum distance between "now" and a notification for it to be worth scheduling. */
const MIN_LEAD_MINUTES: Record<NotificationKind, number> = { CONFIRMATION_REQUEST: 15, REMINDER: 5 };

export function planNotifications(business: Business, startsAt: Date, now: Date): ScheduledNotification[] {
  if (!business.reminders_enabled) return [];
  const plan: ScheduledNotification[] = [];
  const entries: Array<[NotificationKind, number | null]> = [
    ['CONFIRMATION_REQUEST', business.confirmation_request_minutes_before],
    ['REMINDER', business.reminder_minutes_before],
  ];
  for (const [kind, minutesBefore] of entries) {
    if (minutesBefore === null) continue;
    const runAt = addMinutes(startsAt, -minutesBefore);
    if (runAt.getTime() >= addMinutes(now, MIN_LEAD_MINUTES[kind]).getTime()) plan.push({ kind, runAt });
  }
  return plan;
}

export async function scheduleAppointmentNotifications(
  db: Executor,
  params: { business: Business; appointmentId: string; version: number; startsAt: Date; now: Date },
): Promise<ScheduledNotification[]> {
  const plan = planNotifications(params.business, params.startsAt, params.now);
  for (const n of plan) {
    await enqueueJob(db, {
      type: 'appointment.notify',
      businessId: params.business.id,
      payload: { appointmentId: params.appointmentId, version: params.version, kind: n.kind },
      runAt: n.runAt,
      maxAttempts: 5,
      dedupeKey: `appt:${params.appointmentId}:v${params.version}:${n.kind}`,
      groupKey: appointmentGroupKey(params.appointmentId),
    });
  }
  return plan;
}

/** Cancels pending notification jobs and not-yet-sent notification messages of an appointment. */
export async function cancelAppointmentNotifications(db: Executor, params: { businessId: string; appointmentId: string; now: Date; reason: string }): Promise<void> {
  await cancelJobGroup(db, appointmentGroupKey(params.appointmentId), params.now, params.reason);
  await db
    .updateTable('messages')
    .set({ status: 'CANCELLED', processing_outcome: params.reason })
    .where('business_id', '=', params.businessId)
    .where('appointment_id', '=', params.appointmentId)
    .where('direction', '=', 'OUTBOUND')
    .where('purpose', 'in', ['CONFIRMATION_REQUEST', 'REMINDER'])
    .where('status', '=', 'QUEUED')
    .execute();
}
