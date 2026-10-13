import { sql } from 'kysely';
import { z } from 'zod';
import type { DB } from '../db/database.js';
import { isValidTimeZone, LOCAL_TIME, parseTimeToMinutes } from '../shared/time.js';

/**
 * Declarative tenant configuration (business data, WhatsApp channel, services,
 * staff, schedules). Applied idempotently by `cli tenant:apply`. Operational
 * switches (receptionist on/off, safe mode) are deliberately NOT part of this
 * file so re-applying configuration can never switch the bot on by accident.
 */

const time = z.string().regex(LOCAL_TIME, 'expected HH:MM');
const WEEKDAYS = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 } as const;
const weekday = z.union([z.number().int().min(1).max(7), z.enum(Object.keys(WEEKDAYS) as [keyof typeof WEEKDAYS])]).transform((v) => (typeof v === 'number' ? v : WEEKDAYS[v]));

const interval = z
  .object({ weekday, start: time, end: time })
  .strict()
  .refine((i) => parseTimeToMinutes(i.end) > parseTimeToMinutes(i.start), { message: 'end must be after start' });

const ServiceSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    category: z.string().trim().max(60).optional(),
    description: z.string().trim().max(300).optional(),
    durationMinutes: z.number().int().min(5).max(600),
    bufferMinutes: z.number().int().min(0).max(120).default(0),
    priceType: z.enum(['FIXED', 'FROM', 'ON_REQUEST']).default('FIXED'),
    /** Price in currency units (e.g. 25 or 12.5). Required unless ON_REQUEST. */
    price: z.number().min(0).max(100_000).optional(),
    bookableOnline: z.boolean().default(true),
    active: z.boolean().default(true),
  })
  .strict()
  .refine((s) => s.priceType === 'ON_REQUEST' || s.price !== undefined, { message: 'price is required unless priceType is ON_REQUEST' });

const StaffSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    /** Service names this person performs, or "*" for all services. */
    services: z.union([z.literal('*'), z.array(z.string().trim().min(1)).min(1)]),
    /** Optional custom weekly hours; omitted = works whenever the business is open. */
    hours: z.array(interval).optional(),
    active: z.boolean().default(true),
  })
  .strict();

export const TenantConfigSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
    name: z.string().trim().min(1).max(120),
    timezone: z.string().refine(isValidTimeZone, 'invalid IANA timezone'),
    currency: z.string().regex(/^[A-Z]{3}$/).default('EUR'),
    defaultCountryCode: z.string().regex(/^[1-9]\d{0,2}$/).default('34'),
    address: z.string().trim().max(300).optional(),
    mapsUrl: z.string().regex(/^https:\/\//).optional(),
    publicPhone: z.string().trim().max(30).optional(),
    settings: z
      .object({
        slotIntervalMinutes: z.number().int().min(5).max(120).optional(),
        minBookingNoticeMinutes: z.number().int().min(0).max(10_080).optional(),
        maxBookingDaysAhead: z.number().int().min(1).max(365).optional(),
        confirmationRequestMinutesBefore: z.number().int().min(60).max(10_080).nullable().optional(),
        reminderMinutesBefore: z.number().int().min(15).max(2_880).nullable().optional(),
        handoffAutoResumeHours: z.number().int().min(1).max(720).nullable().optional(),
        remindersEnabled: z.boolean().optional(),
      })
      .strict()
      .default({}),
    whatsapp: z
      .object({
        phoneNumberId: z.string().regex(/^\d{5,30}$/),
        wabaId: z.string().regex(/^\d{5,30}$/).optional(),
        displayPhoneNumber: z.string().max(30).optional(),
        accessTokenRef: z
          .string()
          .regex(/^env:WHATSAPP_ACCESS_TOKEN(_[A-Z0-9_]{1,80})?$/, 'must be env:WHATSAPP_ACCESS_TOKEN or env:WHATSAPP_ACCESS_TOKEN_<SUFFIX>')
          .default('env:WHATSAPP_ACCESS_TOKEN'),
        templateLanguage: z.string().regex(/^[a-z]{2}(_[A-Z]{2})?$/).default('es'),
        confirmationTemplateName: z.string().regex(/^[a-z0-9_]{1,512}$/).optional(),
        reminderTemplateName: z.string().regex(/^[a-z0-9_]{1,512}$/).optional(),
      })
      .strict()
      .optional(),
    businessHours: z.array(interval).min(1),
    services: z.array(ServiceSchema).min(1),
    staff: z.array(StaffSchema).min(1),
  })
  .strict()
  .superRefine((cfg, ctx) => {
    const names = new Set<string>();
    for (const s of cfg.services) {
      const k = s.name.toLowerCase();
      if (names.has(k)) ctx.addIssue({ code: 'custom', path: ['services'], message: `duplicate service ${s.name}` });
      names.add(k);
    }
    const staffNames = new Set<string>();
    for (const st of cfg.staff) {
      const k = st.name.toLowerCase();
      if (staffNames.has(k)) ctx.addIssue({ code: 'custom', path: ['staff'], message: `duplicate staff ${st.name}` });
      staffNames.add(k);
      if (st.services !== '*') {
        for (const sv of st.services) {
          if (!names.has(sv.toLowerCase())) ctx.addIssue({ code: 'custom', path: ['staff'], message: `${st.name}: unknown service ${sv}` });
        }
      }
    }
  });

export type TenantConfigInput = z.input<typeof TenantConfigSchema>;
export type TenantConfig = z.output<typeof TenantConfigSchema>;

export interface ApplyResult {
  businessId: string;
  created: boolean;
  services: Record<string, string>;
  staff: Record<string, string>;
  channelId: string | null;
}

export class TenantConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantConfigError';
  }
}

/** Upserts the whole tenant configuration in a single transaction. */
export async function applyTenantConfig(db: DB, input: TenantConfigInput): Promise<ApplyResult> {
  const cfg = TenantConfigSchema.parse(input);
  return db.transaction().execute(async (trx) => {
    const s = cfg.settings;
    const values = {
      name: cfg.name,
      timezone: cfg.timezone,
      currency: cfg.currency,
      default_country_code: cfg.defaultCountryCode,
      address: cfg.address ?? null,
      maps_url: cfg.mapsUrl ?? null,
      public_phone: cfg.publicPhone ?? null,
      ...(s.slotIntervalMinutes !== undefined && { slot_interval_minutes: s.slotIntervalMinutes }),
      ...(s.minBookingNoticeMinutes !== undefined && { min_booking_notice_minutes: s.minBookingNoticeMinutes }),
      ...(s.maxBookingDaysAhead !== undefined && { max_booking_days_ahead: s.maxBookingDaysAhead }),
      ...(s.confirmationRequestMinutesBefore !== undefined && { confirmation_request_minutes_before: s.confirmationRequestMinutesBefore }),
      ...(s.reminderMinutesBefore !== undefined && { reminder_minutes_before: s.reminderMinutesBefore }),
      ...(s.handoffAutoResumeHours !== undefined && { handoff_auto_resume_hours: s.handoffAutoResumeHours }),
      ...(s.remindersEnabled !== undefined && { reminders_enabled: s.remindersEnabled }),
    };
    const business = await trx
      .insertInto('businesses')
      .values({ slug: cfg.slug, ...values })
      .onConflict((oc) => oc.column('slug').doUpdateSet(values))
      .returning(['id', sql<boolean>`(xmax = 0)`.as('inserted')])
      .executeTakeFirstOrThrow();
    const businessId = business.id;

    // --- WhatsApp channel ---------------------------------------------------
    let channelId: string | null = null;
    if (cfg.whatsapp) {
      const w = cfg.whatsapp;
      const existing = await trx.selectFrom('whatsapp_channels').select(['id', 'business_id']).where('phone_number_id', '=', w.phoneNumberId).executeTakeFirst();
      if (existing && existing.business_id !== businessId) {
        throw new TenantConfigError(`phone_number_id ${w.phoneNumberId} already belongs to another business`);
      }
      // Only one active channel per business.
      await trx
        .updateTable('whatsapp_channels')
        .set({ active: false })
        .where('business_id', '=', businessId)
        .where('phone_number_id', '!=', w.phoneNumberId)
        .execute();
      const channelValues = {
        waba_id: w.wabaId ?? null,
        display_phone_number: w.displayPhoneNumber ?? null,
        access_token_ref: w.accessTokenRef,
        template_language: w.templateLanguage,
        confirmation_template_name: w.confirmationTemplateName ?? null,
        reminder_template_name: w.reminderTemplateName ?? null,
        active: true,
      };
      const ch = await trx
        .insertInto('whatsapp_channels')
        .values({ business_id: businessId, phone_number_id: w.phoneNumberId, ...channelValues })
        .onConflict((oc) => oc.column('phone_number_id').doUpdateSet(channelValues))
        .returning('id')
        .executeTakeFirstOrThrow();
      channelId = ch.id;
    }

    // --- Services -------------------------------------------------------------
    const serviceIds: Record<string, string> = {};
    for (const sv of cfg.services) {
      const v = {
        name: sv.name,
        category: sv.category ?? null,
        description: sv.description ?? null,
        duration_minutes: sv.durationMinutes,
        buffer_minutes: sv.bufferMinutes,
        price_type: sv.priceType,
        price_cents: sv.price === undefined ? null : Math.round(sv.price * 100),
        bookable_online: sv.bookableOnline,
        active: sv.active,
      };
      const existing = await trx
        .selectFrom('services')
        .select('id')
        .where('business_id', '=', businessId)
        .where(sql<string>`lower(name)`, '=', sv.name.toLowerCase())
        .executeTakeFirst();
      const id = existing
        ? (await trx.updateTable('services').set(v).where('id', '=', existing.id).returning('id').executeTakeFirstOrThrow()).id
        : (await trx.insertInto('services').values({ business_id: businessId, ...v }).returning('id').executeTakeFirstOrThrow()).id;
      serviceIds[sv.name.toLowerCase()] = id;
    }
    // Services removed from the file are deactivated, never deleted (history).
    await trx
      .updateTable('services')
      .set({ active: false })
      .where('business_id', '=', businessId)
      .where('id', 'not in', Object.values(serviceIds))
      .execute();

    // --- Staff ------------------------------------------------------------------
    const staffIds: Record<string, string> = {};
    for (const st of cfg.staff) {
      const v = { name: st.name, active: st.active, has_custom_hours: st.hours !== undefined };
      const existing = await trx
        .selectFrom('staff')
        .select('id')
        .where('business_id', '=', businessId)
        .where(sql<string>`lower(name)`, '=', st.name.toLowerCase())
        .executeTakeFirst();
      const id = existing
        ? (await trx.updateTable('staff').set(v).where('id', '=', existing.id).returning('id').executeTakeFirstOrThrow()).id
        : (await trx.insertInto('staff').values({ business_id: businessId, ...v }).returning('id').executeTakeFirstOrThrow()).id;
      staffIds[st.name.toLowerCase()] = id;

      await trx.deleteFrom('staff_services').where('business_id', '=', businessId).where('staff_id', '=', id).execute();
      const svc = st.services === '*' ? Object.values(serviceIds) : st.services.map((n) => serviceIds[n.toLowerCase()] as string);
      if (svc.length > 0) {
        await trx
          .insertInto('staff_services')
          .values(svc.map((service_id) => ({ business_id: businessId, staff_id: id, service_id })))
          .execute();
      }
      await trx.deleteFrom('staff_hours').where('business_id', '=', businessId).where('staff_id', '=', id).execute();
      if (st.hours && st.hours.length > 0) {
        await trx
          .insertInto('staff_hours')
          .values(st.hours.map((h) => ({ business_id: businessId, staff_id: id, weekday: h.weekday, starts_at: h.start, ends_at: h.end })))
          .execute();
      }
    }
    await trx
      .updateTable('staff')
      .set({ active: false })
      .where('business_id', '=', businessId)
      .where('id', 'not in', Object.values(staffIds))
      .execute();

    // --- Opening hours ----------------------------------------------------------
    await trx.deleteFrom('business_hours').where('business_id', '=', businessId).execute();
    await trx
      .insertInto('business_hours')
      .values(cfg.businessHours.map((h) => ({ business_id: businessId, weekday: h.weekday, opens_at: h.start, closes_at: h.end })))
      .execute();

    return { businessId, created: business.inserted, services: serviceIds, staff: staffIds, channelId };
  });
}
