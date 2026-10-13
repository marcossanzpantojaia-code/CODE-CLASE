import type { Executor } from '../db/database.js';
import type { PriceType } from '../db/types.js';
import type { BusyBlock, WeeklyHours } from '../scheduling/availability-engine.js';

/**
 * Tenant-scoped catalog queries. Every query filters by business_id first;
 * IDs coming from outside (admin API, conversation state) are always checked
 * against the tenant, never trusted on their own.
 */

export interface CatalogService {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceType: PriceType;
  priceCents: number | null;
  bookableOnline: boolean;
}

export interface CatalogStaff {
  id: string;
  name: string;
  hasCustomHours: boolean;
}

export interface Catalog {
  services: CatalogService[];
  staff: CatalogStaff[];
  /** staffId -> serviceIds the staff member performs (active rows only). */
  staffServices: Map<string, Set<string>>;
}

const serviceColumns = [
  'id',
  'name',
  'category',
  'description',
  'duration_minutes',
  'buffer_minutes',
  'price_type',
  'price_cents',
  'bookable_online',
] as const;

function toService(row: {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price_type: PriceType;
  price_cents: number | null;
  bookable_online: boolean;
}): CatalogService {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    durationMinutes: row.duration_minutes,
    bufferMinutes: row.buffer_minutes,
    priceType: row.price_type,
    priceCents: row.price_cents,
    bookableOnline: row.bookable_online,
  };
}

/** Active services and staff of a tenant, in a stable order. */
export async function loadCatalog(db: Executor, businessId: string): Promise<Catalog> {
  const [services, staff, links] = await Promise.all([
    db
      .selectFrom('services')
      .select(serviceColumns)
      .where('business_id', '=', businessId)
      .where('active', '=', true)
      .orderBy('category')
      .orderBy('name')
      .execute(),
    db
      .selectFrom('staff')
      .select(['id', 'name', 'has_custom_hours'])
      .where('business_id', '=', businessId)
      .where('active', '=', true)
      .orderBy('name')
      .execute(),
    db
      .selectFrom('staff_services')
      .innerJoin('services', 'services.id', 'staff_services.service_id')
      .innerJoin('staff', 'staff.id', 'staff_services.staff_id')
      .select(['staff_services.staff_id', 'staff_services.service_id'])
      .where('staff_services.business_id', '=', businessId)
      .where('services.active', '=', true)
      .where('staff.active', '=', true)
      .execute(),
  ]);
  const staffServices = new Map<string, Set<string>>();
  for (const l of links) {
    const set = staffServices.get(l.staff_id) ?? new Set<string>();
    set.add(l.service_id);
    staffServices.set(l.staff_id, set);
  }
  return {
    services: services.map(toService),
    staff: staff.map((s) => ({ id: s.id, name: s.name, hasCustomHours: s.has_custom_hours })),
    staffServices,
  };
}

/** Active services by id, in the order requested. Unknown/foreign/inactive ids are dropped. */
export async function getServicesByIds(db: Executor, businessId: string, ids: readonly string[]): Promise<CatalogService[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const rows = await db
    .selectFrom('services')
    .select(serviceColumns)
    .where('business_id', '=', businessId)
    .where('id', 'in', unique)
    .where('active', '=', true)
    .execute();
  const byId = new Map(rows.map((r) => [r.id, toService(r)]));
  return unique.map((id) => byId.get(id)).filter((s): s is CatalogService => s !== undefined);
}

/** Active staff of the tenant who perform ALL the given services, sorted by id. */
export async function getCompatibleStaffIds(db: Executor, businessId: string, serviceIds: readonly string[]): Promise<string[]> {
  const unique = [...new Set(serviceIds)];
  if (unique.length === 0) return [];
  const rows = await db
    .selectFrom('staff_services')
    .innerJoin('staff', 'staff.id', 'staff_services.staff_id')
    .select('staff_services.staff_id')
    .where('staff_services.business_id', '=', businessId)
    .where('staff.business_id', '=', businessId)
    .where('staff.active', '=', true)
    .where('staff_services.service_id', 'in', unique)
    .groupBy('staff_services.staff_id')
    .having((eb) => eb.fn.count<number>('staff_services.service_id').distinct(), '=', unique.length)
    .orderBy('staff_services.staff_id')
    .execute();
  return rows.map((r) => r.staff_id);
}

export async function getActiveStaff(db: Executor, businessId: string, staffId: string): Promise<CatalogStaff | null> {
  const row = await db
    .selectFrom('staff')
    .select(['id', 'name', 'has_custom_hours'])
    .where('business_id', '=', businessId)
    .where('id', '=', staffId)
    .where('active', '=', true)
    .executeTakeFirst();
  return row ? { id: row.id, name: row.name, hasCustomHours: row.has_custom_hours } : null;
}

export async function loadBusinessHours(db: Executor, businessId: string): Promise<WeeklyHours[]> {
  const rows = await db
    .selectFrom('business_hours')
    .select(['weekday', 'opens_at', 'closes_at'])
    .where('business_id', '=', businessId)
    .orderBy('weekday')
    .orderBy('opens_at')
    .execute();
  return rows.map((r) => ({ weekday: r.weekday, start: r.opens_at, end: r.closes_at }));
}

/** Custom hours for staff that use them; staff without custom hours are absent from the map. */
export async function loadStaffHours(db: Executor, businessId: string, staffIds: readonly string[]): Promise<Map<string, WeeklyHours[]>> {
  const out = new Map<string, WeeklyHours[]>();
  if (staffIds.length === 0) return out;
  const custom = await db
    .selectFrom('staff')
    .select('id')
    .where('business_id', '=', businessId)
    .where('id', 'in', [...staffIds])
    .where('has_custom_hours', '=', true)
    .execute();
  const customIds = custom.map((c) => c.id);
  for (const id of customIds) out.set(id, []);
  if (customIds.length === 0) return out;
  const rows = await db
    .selectFrom('staff_hours')
    .select(['staff_id', 'weekday', 'starts_at', 'ends_at'])
    .where('business_id', '=', businessId)
    .where('staff_id', 'in', customIds)
    .execute();
  for (const r of rows) out.get(r.staff_id)?.push({ weekday: r.weekday, start: r.starts_at, end: r.ends_at });
  return out;
}

/**
 * Everything that blocks time in [from, to): business-wide closures, staff
 * time off and active appointments (occupied until end + buffer).
 */
export async function loadBusyBlocks(
  db: Executor,
  businessId: string,
  staffIds: readonly string[],
  from: Date,
  to: Date,
  excludeAppointmentId?: string,
): Promise<BusyBlock[]> {
  const timeOff = await db
    .selectFrom('time_off')
    .select(['staff_id', 'starts_at', 'ends_at'])
    .where('business_id', '=', businessId)
    .where('starts_at', '<', to)
    .where('ends_at', '>', from)
    .where((eb) => (staffIds.length > 0 ? eb.or([eb('staff_id', 'is', null), eb('staff_id', 'in', [...staffIds])]) : eb('staff_id', 'is', null)))
    .execute();
  const blocks: BusyBlock[] = timeOff.map((t) => ({ staffId: t.staff_id, start: t.starts_at, end: t.ends_at }));
  if (staffIds.length > 0) {
    let q = db
      .selectFrom('appointments')
      .select(['staff_id', 'starts_at', 'occupied_until'])
      .where('business_id', '=', businessId)
      .where('staff_id', 'in', [...staffIds])
      .where('status', 'in', ['BOOKED', 'CONFIRMED'])
      .where('starts_at', '<', to)
      .where('occupied_until', '>', from);
    if (excludeAppointmentId) q = q.where('id', '!=', excludeAppointmentId);
    const appts = await q.execute();
    for (const a of appts) blocks.push({ staffId: a.staff_id, start: a.starts_at, end: a.occupied_until });
  }
  return blocks;
}
