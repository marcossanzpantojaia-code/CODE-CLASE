import { sql } from 'kysely';
import type { Executor } from '../db/database.js';

export interface TenantStats {
  from: string;
  to: string;
  appointmentsCreated: { whatsapp: number; staff: number; api: number };
  /** Appointments booked end-to-end by the receptionist (source = WHATSAPP). */
  automaticBookings: number;
  appointmentsCancelled: number;
  appointmentsRescheduled: number;
  conversationsWithBookingIntent: number;
  /** automaticBookings / conversationsWithBookingIntent (null if no intent). */
  bookingConversionRate: number | null;
  humanHandoffs: number;
  messages: { inbound: number; outbound: number; outboundFailed: number };
  replyLatencySeconds: { p50: number | null; p95: number | null; p99: number | null };
  llm: { calls: number; failures: number; costUsd: number; latencyP50Ms: number | null; latencyP95Ms: number | null };
  incidentsOpen: number;
}

/** Business KPIs from the database (Prometheus counters reset on restart; these do not). */
export async function tenantStats(db: Executor, businessId: string, from: Date, to: Date): Promise<TenantStats> {
  const created = await db
    .selectFrom('appointments')
    .select(['source', sql<number>`count(*)`.as('n')])
    .where('business_id', '=', businessId)
    .where('created_at', '>=', from)
    .where('created_at', '<', to)
    .groupBy('source')
    .execute();
  const bySource = Object.fromEntries(created.map((r) => [r.source, Number(r.n)])) as Record<string, number>;

  const events = await db
    .selectFrom('crm_events')
    .select(['type', sql<number>`count(*)`.as('n'), sql<number>`count(DISTINCT conversation_id)`.as('conversations')])
    .where('business_id', '=', businessId)
    .where('occurred_at', '>=', from)
    .where('occurred_at', '<', to)
    .where('type', 'in', ['APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'HUMAN_HANDOFF_REQUESTED', 'AVAILABILITY_OFFERED'])
    .groupBy('type')
    .execute();
  const ev = Object.fromEntries(events.map((e) => [e.type, { n: Number(e.n), conversations: Number(e.conversations) }]));

  const intent = await db
    .selectFrom('crm_events')
    .select(sql<number>`count(DISTINCT conversation_id)`.as('n'))
    .where('business_id', '=', businessId)
    .where('occurred_at', '>=', from)
    .where('occurred_at', '<', to)
    .where((eb) =>
      eb.or([
        eb('type', '=', 'AVAILABILITY_OFFERED'),
        eb.and([eb('type', '=', 'INTENT_DETECTED'), sql<boolean>`data->>'intent' IN ('ASK_AVAILABILITY','BOOK_APPOINTMENT')`]),
      ]),
    )
    .executeTakeFirstOrThrow();

  const msgs = await db
    .selectFrom('messages')
    .select([
      sql<number>`count(*) FILTER (WHERE direction = 'INBOUND')`.as('inbound'),
      sql<number>`count(*) FILTER (WHERE direction = 'OUTBOUND' AND status IN ('ACCEPTED','SENT','DELIVERED','READ'))`.as('outbound'),
      sql<number>`count(*) FILTER (WHERE direction = 'OUTBOUND' AND status = 'FAILED')`.as('failed'),
    ])
    .where('business_id', '=', businessId)
    .where('created_at', '>=', from)
    .where('created_at', '<', to)
    .executeTakeFirstOrThrow();

  const latency = await sql<{ p50: number | null; p95: number | null; p99: number | null }>`
    SELECT
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (o.accepted_at - i.created_at))) AS p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY extract(epoch FROM (o.accepted_at - i.created_at))) AS p95,
      percentile_cont(0.99) WITHIN GROUP (ORDER BY extract(epoch FROM (o.accepted_at - i.created_at))) AS p99
    FROM messages o
    JOIN messages i ON i.id = o.reply_to_message_id
    WHERE o.business_id = ${businessId}
      AND o.direction = 'OUTBOUND'
      AND o.accepted_at IS NOT NULL
      AND o.created_at >= ${from} AND o.created_at < ${to}`.execute(db);

  const llm = await sql<{ calls: number; failures: number; cost: number | null; p50: number | null; p95: number | null }>`
    SELECT count(*) AS calls,
           count(*) FILTER (WHERE outcome <> 'OK') AS failures,
           sum(cost_micro_usd) AS cost,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
           percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
    FROM llm_calls
    WHERE business_id = ${businessId} AND created_at >= ${from} AND created_at < ${to}`.execute(db);

  const incidents = await db
    .selectFrom('incidents')
    .select(sql<number>`count(*)`.as('n'))
    .where('business_id', '=', businessId)
    .where('resolved_at', 'is', null)
    .executeTakeFirstOrThrow();

  const automatic = bySource.WHATSAPP ?? 0;
  const withIntent = Number(intent.n);
  const lat = latency.rows[0];
  const l = llm.rows[0];
  const round = (v: number | null | undefined) => (v === null || v === undefined ? null : Math.round(Number(v) * 1000) / 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    appointmentsCreated: { whatsapp: automatic, staff: bySource.STAFF ?? 0, api: bySource.API ?? 0 },
    automaticBookings: automatic,
    appointmentsCancelled: ev.APPOINTMENT_CANCELLED?.n ?? 0,
    appointmentsRescheduled: ev.APPOINTMENT_RESCHEDULED?.n ?? 0,
    conversationsWithBookingIntent: withIntent,
    bookingConversionRate: withIntent > 0 ? Math.round((automatic / withIntent) * 1000) / 1000 : null,
    humanHandoffs: ev.HUMAN_HANDOFF_REQUESTED?.n ?? 0,
    messages: { inbound: Number(msgs.inbound), outbound: Number(msgs.outbound), outboundFailed: Number(msgs.failed) },
    replyLatencySeconds: { p50: round(lat?.p50), p95: round(lat?.p95), p99: round(lat?.p99) },
    llm: {
      calls: Number(l?.calls ?? 0),
      failures: Number(l?.failures ?? 0),
      costUsd: Math.round(Number(l?.cost ?? 0)) / 1_000_000,
      latencyP50Ms: round(l?.p50),
      latencyP95Ms: round(l?.p95),
    },
    incidentsOpen: Number(incidents.n),
  };
}
