import type { Executor } from '../db/database.js';
import type { AppointmentSource, AppointmentStatus, PriceType } from '../db/types.js';

export interface AppointmentServiceView {
  serviceId: string;
  name: string;
  durationMinutes: number;
  priceType: PriceType;
  priceCents: number | null;
}

export interface AppointmentView {
  id: string;
  businessId: string;
  customerId: string;
  staffId: string;
  staffName: string;
  conversationId: string | null;
  startsAt: Date;
  endsAt: Date;
  occupiedUntil: Date;
  status: AppointmentStatus;
  source: AppointmentSource;
  version: number;
  totalPriceCents: number | null;
  priceIsEstimate: boolean;
  currency: string;
  createdAt: Date;
  services: AppointmentServiceView[];
}

export const ACTIVE_STATUSES: readonly AppointmentStatus[] = ['BOOKED', 'CONFIRMED'];

async function attachServices(
  db: Executor,
  rows: Array<Omit<AppointmentView, 'services'>>,
): Promise<AppointmentView[]> {
  if (rows.length === 0) return [];
  const lines = await db
    .selectFrom('appointment_services')
    .select(['appointment_id', 'service_id', 'service_name', 'duration_minutes', 'price_type', 'price_cents', 'position'])
    .where('appointment_id', 'in', rows.map((r) => r.id))
    .orderBy('appointment_id')
    .orderBy('position')
    .execute();
  const byAppt = new Map<string, AppointmentServiceView[]>();
  for (const l of lines) {
    const list = byAppt.get(l.appointment_id) ?? [];
    list.push({ serviceId: l.service_id, name: l.service_name, durationMinutes: l.duration_minutes, priceType: l.price_type, priceCents: l.price_cents });
    byAppt.set(l.appointment_id, list);
  }
  return rows.map((r) => ({ ...r, services: byAppt.get(r.id) ?? [] }));
}

function baseQuery(db: Executor, businessId: string) {
  return db
    .selectFrom('appointments as a')
    .innerJoin('staff as s', (j) => j.onRef('s.id', '=', 'a.staff_id').onRef('s.business_id', '=', 'a.business_id'))
    .select([
      'a.id',
      'a.business_id as businessId',
      'a.customer_id as customerId',
      'a.staff_id as staffId',
      's.name as staffName',
      'a.conversation_id as conversationId',
      'a.starts_at as startsAt',
      'a.ends_at as endsAt',
      'a.occupied_until as occupiedUntil',
      'a.status',
      'a.source',
      'a.version',
      'a.total_price_cents as totalPriceCents',
      'a.price_is_estimate as priceIsEstimate',
      'a.currency',
      'a.created_at as createdAt',
    ])
    .where('a.business_id', '=', businessId);
}

export async function getAppointmentView(db: Executor, businessId: string, appointmentId: string): Promise<AppointmentView | null> {
  const row = await baseQuery(db, businessId).where('a.id', '=', appointmentId).executeTakeFirst();
  if (!row) return null;
  const [view] = await attachServices(db, [row]);
  return view ?? null;
}

/** Active future appointments of a customer (soonest first). */
export async function getUpcomingAppointments(db: Executor, businessId: string, customerId: string, now: Date, limit = 5): Promise<AppointmentView[]> {
  const rows = await baseQuery(db, businessId)
    .where('a.customer_id', '=', customerId)
    .where('a.status', 'in', [...ACTIVE_STATUSES])
    .where('a.starts_at', '>', now)
    .orderBy('a.starts_at')
    .limit(limit)
    .execute();
  return attachServices(db, rows);
}

export async function listAppointments(
  db: Executor,
  businessId: string,
  filter: { from: Date; to: Date; statuses?: AppointmentStatus[]; limit?: number },
): Promise<AppointmentView[]> {
  let q = baseQuery(db, businessId).where('a.starts_at', '>=', filter.from).where('a.starts_at', '<', filter.to);
  if (filter.statuses && filter.statuses.length > 0) q = q.where('a.status', 'in', filter.statuses);
  const rows = await q.orderBy('a.starts_at').limit(filter.limit ?? 500).execute();
  return attachServices(db, rows);
}
