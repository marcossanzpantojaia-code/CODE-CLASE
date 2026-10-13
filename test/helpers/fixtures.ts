import type { DB } from '../../src/db/database.js';
import type { Business } from '../../src/db/types.js';
import { applyTenantConfig, type ApplyResult, type TenantConfigInput } from '../../src/tenancy/tenant-config.js';
import { getBusinessById } from '../../src/tenancy/tenants.repository.js';

/**
 * A realistic pilot barbershop in Madrid:
 *  - Mon-Fri 10:00-14:00 and 16:00-20:00 (split shift), Sat 10:00-14:00, Sun closed
 *  - Juan does men's services; Ana does everything except beard;
 *  - "Corte + barba" is a combo with its own price; Balayage needs consultation.
 */
export const PILOT_PHONE_NUMBER_ID = '109876543210001';
export const OTHER_PHONE_NUMBER_ID = '109876543210002';

export function pilotSalonConfig(overrides: Partial<TenantConfigInput> = {}): TenantConfigInput {
  return {
    slug: 'barberia-piloto',
    name: 'Barbería Piloto',
    timezone: 'Europe/Madrid',
    address: 'Calle Mayor 1, Madrid',
    mapsUrl: 'https://maps.example.com/barberia-piloto',
    settings: {
      slotIntervalMinutes: 15,
      minBookingNoticeMinutes: 60,
      maxBookingDaysAhead: 60,
      confirmationRequestMinutesBefore: 1440,
      reminderMinutesBefore: 120,
    },
    whatsapp: {
      phoneNumberId: PILOT_PHONE_NUMBER_ID,
      wabaId: '209876543210001',
      displayPhoneNumber: '+34 910 000 001',
      accessTokenRef: 'env:WHATSAPP_ACCESS_TOKEN',
      confirmationTemplateName: 'cita_confirmacion',
      reminderTemplateName: 'cita_recordatorio',
    },
    businessHours: [
      ...[1, 2, 3, 4, 5].flatMap((d) => [
        { weekday: d, start: '10:00', end: '14:00' },
        { weekday: d, start: '16:00', end: '20:00' },
      ]),
      { weekday: 6, start: '10:00', end: '14:00' },
    ],
    services: [
      { name: 'Corte caballero', category: 'Corte', durationMinutes: 30, price: 15 },
      { name: 'Barba', category: 'Barba', durationMinutes: 20, price: 10 },
      { name: 'Corte + barba', category: 'Corte', durationMinutes: 45, price: 25 },
      { name: 'Corte mujer', category: 'Corte', durationMinutes: 45, price: 25, bufferMinutes: 15 },
      { name: 'Tinte', category: 'Color', durationMinutes: 90, priceType: 'FROM', price: 40 },
      { name: 'Balayage', category: 'Color', durationMinutes: 180, priceType: 'ON_REQUEST', bookableOnline: false },
    ],
    staff: [
      { name: 'Juan', services: ['Corte caballero', 'Barba', 'Corte + barba'] },
      { name: 'Ana', services: ['Corte caballero', 'Corte mujer', 'Tinte', 'Balayage'] },
    ],
    ...overrides,
  };
}

export function otherSalonConfig(): TenantConfigInput {
  return {
    slug: 'peluqueria-otra',
    name: 'Peluquería Otra',
    timezone: 'Europe/Madrid',
    whatsapp: { phoneNumberId: OTHER_PHONE_NUMBER_ID, accessTokenRef: 'env:WHATSAPP_ACCESS_TOKEN' },
    businessHours: [1, 2, 3, 4, 5, 6].map((d) => ({ weekday: d, start: '09:00', end: '21:00' })),
    services: [{ name: 'Corte caballero', durationMinutes: 30, price: 99 }],
    staff: [{ name: 'Pedro', services: '*' }],
  };
}

export interface SeededTenant {
  business: Business;
  ids: ApplyResult;
  service(name: string): string;
  staff(name: string): string;
}

export async function seedTenant(db: DB, config: TenantConfigInput, flags: { receptionist?: boolean } = {}): Promise<SeededTenant> {
  const ids = await applyTenantConfig(db, config);
  if (flags.receptionist) {
    await db.updateTable('businesses').set({ automated_receptionist_enabled: true }).where('id', '=', ids.businessId).execute();
  }
  const business = await getBusinessById(db, ids.businessId);
  if (!business) throw new Error('seed failed');
  return {
    business,
    ids,
    service: (name) => {
      const id = ids.services[name.toLowerCase()];
      if (!id) throw new Error(`no service ${name}`);
      return id;
    },
    staff: (name) => {
      const id = ids.staff[name.toLowerCase()];
      if (!id) throw new Error(`no staff ${name}`);
      return id;
    },
  };
}

export async function createCustomer(db: DB, businessId: string, phone: string, name: string | null = null): Promise<string> {
  const row = await db
    .insertInto('customers')
    .values({
      business_id: businessId,
      phone_e164: phone,
      name,
      name_source: name ? 'STAFF' : null,
      source: 'WHATSAPP',
      first_contact_at: new Date('2026-01-01T00:00:00Z'),
      last_contact_at: new Date('2026-01-01T00:00:00Z'),
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  return row.id;
}

/** Local Madrid wall-clock time on a date -> instant (CEST = UTC+2 in October before the 25th). */
export function madrid(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+02:00`);
}
