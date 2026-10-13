import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticateApiKey } from '../admin/api-keys.js';
import { tenantStats } from '../admin/stats.js';
import { loadCatalog } from '../catalog/catalog.repository.js';
import { recordCrmEvent } from '../crm/crm-events.js';
import { findOrCreateCustomer, getCustomer } from '../crm/customers.js';
import { textMessage } from '../messaging/content.js';
import { getConversation, resumeBot } from '../messaging/conversations.repository.js';
import { enqueueOutboundMessage } from '../messaging/outbound.service.js';
import { listAppointments } from '../scheduling/appointments.repository.js';
import { resolveServicesAndStaff, validateBookingDate } from '../scheduling/availability.service.js';
import { NotFoundError, ValidationError } from '../shared/errors.js';
import { normalizePhone } from '../shared/phone.js';
import { FixedWindowLimiter } from '../shared/rate-limiter.js';
import { getBusinessById, updateBusinessFlags } from '../tenancy/tenants.repository.js';
import type { ServerDeps } from './server.js';

/**
 * Tenant-scoped admin API (Bearer rk_... key). Every handler derives the
 * tenant from the key and scopes every query by it; resource IDs from the URL
 * are always checked against that tenant. Bodies are parsed with strict Zod
 * schemas (unknown fields rejected: no mass assignment).
 */
const uuid = z.uuid();
const isoDate = z.iso.datetime({ offset: true });

const AppointmentCreateSchema = z
  .object({
    customerPhone: z.string().min(6).max(32),
    customerName: z.string().trim().min(1).max(80).optional(),
    serviceIds: z.array(uuid).min(1).max(6),
    startsAt: isoDate,
    staffId: uuid.optional(),
  })
  .strict();

const TimeOffSchema = z
  .object({
    staffId: uuid.optional(),
    kind: z.enum(['CLOSURE', 'HOLIDAY', 'VACATION', 'BREAK', 'BLOCK']),
    startsAt: isoDate,
    endsAt: isoDate,
    note: z.string().max(200).optional(),
  })
  .strict()
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), { message: 'endsAt must be after startsAt' });

export async function registerAdminRoutes(app: FastifyInstance, deps: ServerDeps): Promise<void> {
  const { db, clock } = deps;
  const failedAuth = new FixedWindowLimiter(20, 60_000);

  await app.register(
    (admin, _opts, done) => {
      admin.addHook('onRequest', async (request, reply) => {
        const ip = request.ip;
        if (failedAuth.isBlocked(ip)) return reply.code(429).send({ error: 'TOO_MANY_REQUESTS' });
        const header = request.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
        const auth = token ? await authenticateApiKey(db, token, clock.now()) : null;
        if (!auth) {
          failedAuth.hit(ip);
          return reply.code(401).send({ error: 'UNAUTHORIZED' });
        }
        request.businessId = auth.businessId;
      });

      const tenant = async (request: FastifyRequest) => {
        const business = await getBusinessById(db, request.businessId as string);
        if (!business) throw new NotFoundError('business');
        return business;
      };

      admin.get('/business', async (request) => {
        const b = await tenant(request);
        return {
          id: b.id,
          slug: b.slug,
          name: b.name,
          timezone: b.timezone,
          flags: { automatedReceptionistEnabled: b.automated_receptionist_enabled, safeMode: b.safe_mode, remindersEnabled: b.reminders_enabled },
          settings: {
            slotIntervalMinutes: b.slot_interval_minutes,
            minBookingNoticeMinutes: b.min_booking_notice_minutes,
            maxBookingDaysAhead: b.max_booking_days_ahead,
            confirmationRequestMinutesBefore: b.confirmation_request_minutes_before,
            reminderMinutesBefore: b.reminder_minutes_before,
            handoffAutoResumeHours: b.handoff_auto_resume_hours,
          },
        };
      });

      admin.patch('/business/flags', async (request) => {
        const body = z
          .object({ automatedReceptionistEnabled: z.boolean().optional(), safeMode: z.boolean().optional(), remindersEnabled: z.boolean().optional() })
          .strict()
          .parse(request.body);
        const updated = await updateBusinessFlags(db, request.businessId as string, body);
        if (!updated) throw new NotFoundError('business');
        request.log.warn({ event: 'tenant.flags.changed', businessId: updated.id, flags: body }, 'tenant flags changed via admin API');
        return { automatedReceptionistEnabled: updated.automated_receptionist_enabled, safeMode: updated.safe_mode, remindersEnabled: updated.reminders_enabled };
      });

      admin.get('/services', async (request) => {
        const catalog = await loadCatalog(db, request.businessId as string);
        return { services: catalog.services, staff: catalog.staff.map((s) => ({ ...s, serviceIds: [...(catalog.staffServices.get(s.id) ?? [])] })) };
      });

      admin.get('/availability', async (request) => {
        const q = z
          .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), serviceIds: z.string().min(1), staffId: uuid.optional() })
          .strict()
          .parse(request.query);
        const business = await tenant(request);
        const ids = q.serviceIds.split(',').map((s) => uuid.parse(s.trim()));
        const resolved = await resolveServicesAndStaff(db, business.id, ids, q.staffId ?? null, 'STAFF');
        if (!resolved.ok) throw new ValidationError(resolved.reason);
        const validity = validateBookingDate(business, q.date, clock.now());
        if (validity !== 'OK') throw new ValidationError(validity);
        const slots = await deps.availability.slotsForDate(db, business, resolved.value, q.date, { now: clock.now() });
        return { date: q.date, durationMinutes: resolved.value.durationMinutes, slots: slots.map((s) => ({ startsAt: s.start.toISOString(), staffIds: s.staffIds })) };
      });

      admin.get('/appointments', async (request) => {
        const q = z
          .object({ from: isoDate, to: isoDate, status: z.enum(['BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional() })
          .strict()
          .parse(request.query);
        const list = await listAppointments(db, request.businessId as string, {
          from: new Date(q.from),
          to: new Date(q.to),
          ...(q.status ? { statuses: [q.status] } : {}),
        });
        return { appointments: list };
      });

      admin.post('/appointments', async (request, reply) => {
        const body = AppointmentCreateSchema.parse(request.body);
        const business = await tenant(request);
        const phone = normalizePhone(body.customerPhone, { defaultCountryCode: business.default_country_code });
        if (!phone) throw new ValidationError('customerPhone is not a valid phone number');
        const idempotencyKey = typeof request.headers['idempotency-key'] === 'string' ? `admin:${request.headers['idempotency-key'].slice(0, 100)}` : null;
        const now = clock.now();
        const result = await db.transaction().execute(async (trx) => {
          const { customer } = await findOrCreateCustomer(trx, { businessId: business.id, phoneE164: phone, name: body.customerName ?? null, source: 'STAFF', at: now });
          return deps.booking.book(trx, {
            business,
            customerId: customer.id,
            serviceIds: body.serviceIds,
            staffId: body.staffId ?? null,
            startsAt: new Date(body.startsAt),
            source: 'STAFF',
            idempotencyKey,
            now,
          });
        });
        if (!result.ok) return reply.code(409).send({ error: result.reason });
        return reply.code(result.alreadyExisted ? 200 : 201).send({ appointment: result.appointment, notifications: result.notifications });
      });

      admin.post('/appointments/:id/cancel', async (request, reply) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const body = z.object({ reason: z.string().max(300).optional() }).strict().parse(request.body ?? {});
        const business = await tenant(request);
        const result = await db.transaction().execute((trx) =>
          deps.booking.cancel(trx, { business, appointmentId: id, source: 'STAFF', reason: body.reason ?? null, now: clock.now() }),
        );
        if (!result.ok) return reply.code(result.reason === 'APPOINTMENT_NOT_FOUND' ? 404 : 409).send({ error: result.reason });
        return { appointment: result.appointment, alreadyCancelled: result.alreadyCancelled };
      });

      admin.post('/appointments/:id/reschedule', async (request, reply) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const body = z.object({ startsAt: isoDate, staffId: uuid.optional() }).strict().parse(request.body);
        const business = await tenant(request);
        const result = await db.transaction().execute((trx) =>
          deps.booking.reschedule(trx, { business, appointmentId: id, newStartsAt: new Date(body.startsAt), staffId: body.staffId ?? null, source: 'STAFF', now: clock.now() }),
        );
        if (!result.ok) return reply.code(result.reason === 'APPOINTMENT_NOT_FOUND' ? 404 : 409).send({ error: result.reason });
        return { appointment: result.appointment, notifications: result.notifications };
      });

      admin.get('/time-off', async (request) => {
        const q = z.object({ from: isoDate, to: isoDate }).strict().parse(request.query);
        const rows = await db
          .selectFrom('time_off')
          .selectAll()
          .where('business_id', '=', request.businessId as string)
          .where('starts_at', '<', new Date(q.to))
          .where('ends_at', '>', new Date(q.from))
          .orderBy('starts_at')
          .execute();
        return { timeOff: rows };
      });

      admin.post('/time-off', async (request, reply) => {
        const body = TimeOffSchema.parse(request.body);
        const businessId = request.businessId as string;
        if (body.staffId) {
          const staff = await db.selectFrom('staff').select('id').where('business_id', '=', businessId).where('id', '=', body.staffId).executeTakeFirst();
          if (!staff) throw new NotFoundError('staff');
        }
        const row = await db
          .insertInto('time_off')
          .values({ business_id: businessId, staff_id: body.staffId ?? null, kind: body.kind, starts_at: new Date(body.startsAt), ends_at: new Date(body.endsAt), note: body.note ?? null })
          .returningAll()
          .executeTakeFirstOrThrow();
        // Existing appointments are NOT cancelled automatically: report them so staff can act.
        let q = db
          .selectFrom('appointments')
          .select(['id', 'starts_at', 'staff_id', 'customer_id'])
          .where('business_id', '=', businessId)
          .where('status', 'in', ['BOOKED', 'CONFIRMED'])
          .where('starts_at', '<', row.ends_at)
          .where('occupied_until', '>', row.starts_at);
        if (row.staff_id) q = q.where('staff_id', '=', row.staff_id);
        const conflicts = await q.execute();
        return reply.code(201).send({ timeOff: row, conflictingAppointments: conflicts });
      });

      admin.delete('/time-off/:id', async (request, reply) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const res = await db.deleteFrom('time_off').where('business_id', '=', request.businessId as string).where('id', '=', id).executeTakeFirst();
        if (Number(res.numDeletedRows) === 0) throw new NotFoundError('time off');
        return reply.code(204).send();
      });

      admin.get('/conversations', async (request) => {
        const q = z
          .object({ needsHuman: z.enum(['true', 'false']).optional(), limit: z.coerce.number().int().min(1).max(200).default(50) })
          .strict()
          .parse(request.query);
        let query = db
          .selectFrom('conversations as c')
          .innerJoin('customers as cu', (j) => j.onRef('cu.id', '=', 'c.customer_id').onRef('cu.business_id', '=', 'c.business_id'))
          .select(['c.id', 'c.customer_id', 'cu.name', 'cu.phone_e164', 'c.needs_human', 'c.needs_human_reason', 'c.needs_human_since', 'c.last_inbound_at', 'c.last_outbound_at'])
          .where('c.business_id', '=', request.businessId as string);
        if (q.needsHuman !== undefined) query = query.where('c.needs_human', '=', q.needsHuman === 'true');
        return { conversations: await query.orderBy('c.last_inbound_at', 'desc').limit(q.limit).execute() };
      });

      admin.get('/conversations/:id/messages', async (request) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const q = z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) }).strict().parse(request.query);
        const conv = await getConversation(db, request.businessId as string, id);
        if (!conv) throw new NotFoundError('conversation');
        const messages = await db
          .selectFrom('messages')
          .select(['id', 'direction', 'content_type', 'text', 'status', 'purpose', 'provider_message_id', 'created_at', 'accepted_at', 'sent_at', 'delivered_at', 'read_at', 'failed_at', 'processing_outcome'])
          .where('business_id', '=', request.businessId as string)
          .where('conversation_id', '=', id)
          .orderBy('created_at', 'desc')
          .limit(q.limit)
          .execute();
        return { conversation: { id: conv.id, needsHuman: conv.needs_human, reason: conv.needs_human_reason }, messages: messages.reverse() };
      });

      admin.post('/conversations/:id/resume-bot', async (request) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const businessId = request.businessId as string;
        const conv = await getConversation(db, businessId, id);
        if (!conv) throw new NotFoundError('conversation');
        const resumed = await db.transaction().execute(async (trx) => {
          const ok = await resumeBot(trx, { businessId, conversationId: id });
          if (ok) {
            await recordCrmEvent(trx, {
              businessId,
              customerId: conv.customer_id,
              type: 'HUMAN_HANDOFF_RESOLVED',
              occurredAt: clock.now(),
              source: 'STAFF',
              channel: 'ADMIN_API',
              conversationId: id,
              data: { auto: false },
            });
          }
          return ok;
        });
        return { resumed };
      });

      admin.post('/conversations/:id/reply', async (request, reply) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const body = z.object({ text: z.string().trim().min(1).max(4096) }).strict().parse(request.body);
        const businessId = request.businessId as string;
        const conv = await getConversation(db, businessId, id);
        if (!conv) throw new NotFoundError('conversation');
        const key = typeof request.headers['idempotency-key'] === 'string' ? request.headers['idempotency-key'].slice(0, 100) : randomUUID();
        const res = await db.transaction().execute((trx) =>
          enqueueOutboundMessage(trx, { businessId, conversationId: id, content: textMessage(body.text), purpose: 'MANUAL', idempotencyKey: `manual:${key}`, now: clock.now() }),
        );
        return reply.code(res.created ? 202 : 200).send({ messageId: res.messageId, queued: res.created });
      });

      admin.get('/customers/:id', async (request) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const businessId = request.businessId as string;
        const customer = await getCustomer(db, businessId, id);
        if (!customer) throw new NotFoundError('customer');
        const timeline = await db
          .selectFrom('crm_events')
          .select(['type', 'occurred_at', 'source', 'channel', 'appointment_id', 'data'])
          .where('business_id', '=', businessId)
          .where('customer_id', '=', id)
          .orderBy('occurred_at', 'desc')
          .limit(200)
          .execute();
        return { customer, timeline };
      });

      admin.get('/incidents', async (request) => {
        const q = z.object({ open: z.enum(['true', 'false']).optional() }).strict().parse(request.query);
        let query = db.selectFrom('incidents').selectAll().where('business_id', '=', request.businessId as string);
        if (q.open === 'true') query = query.where('resolved_at', 'is', null);
        return { incidents: await query.orderBy('created_at', 'desc').limit(200).execute() };
      });

      admin.post('/incidents/:id/resolve', async (request) => {
        const { id } = z.object({ id: uuid }).parse(request.params);
        const res = await db
          .updateTable('incidents')
          .set({ resolved_at: clock.now() })
          .where('business_id', '=', request.businessId as string)
          .where('id', '=', id)
          .where('resolved_at', 'is', null)
          .executeTakeFirst();
        return { resolved: Number(res.numUpdatedRows) === 1 };
      });

      admin.get('/stats', async (request) => {
        const q = z.object({ from: isoDate, to: isoDate }).strict().parse(request.query);
        return tenantStats(db, request.businessId as string, new Date(q.from), new Date(q.to));
      });
      done();
    },
    { prefix: '/admin/v1' },
  );
}
