import { json, type Executor } from '../db/database.js';
import type { IncidentSeverity } from '../db/types.js';
import type { AppLogger } from './logger.js';
import type { Metrics } from './metrics.js';

export type IncidentKind =
  | 'LLM_FAILURE'
  | 'WHATSAPP_SEND_FAILURE'
  | 'WHATSAPP_AUTH_FAILURE'
  | 'TEMPLATE_NOT_CONFIGURED'
  | 'OUTSIDE_SERVICE_WINDOW'
  | 'RUNAWAY_GUARD'
  | 'LLM_BUDGET_EXCEEDED'
  | 'STALE_REPLY_DROPPED'
  | 'INVALID_SENDER'
  | 'UNEXPECTED_ERROR';

export interface IncidentInput {
  businessId: string | null;
  conversationId?: string | null;
  kind: IncidentKind;
  severity: IncidentSeverity;
  details?: Record<string, unknown>;
  at: Date;
}

/** Persists an incident (operator-visible via the admin API) and emits log + metric. */
export async function recordIncident(db: Executor, input: IncidentInput, logger?: AppLogger, metrics?: Metrics): Promise<void> {
  await db
    .insertInto('incidents')
    .values({
      business_id: input.businessId,
      conversation_id: input.conversationId ?? null,
      kind: input.kind,
      severity: input.severity,
      details: json(input.details ?? {}),
      created_at: input.at,
    })
    .execute();
  metrics?.incidents.inc({ kind: input.kind, severity: input.severity });
  const level = input.severity === 'CRITICAL' ? 'error' : input.severity === 'WARNING' ? 'warn' : 'info';
  logger?.[level](
    { event: 'incident.recorded', kind: input.kind, severity: input.severity, businessId: input.businessId, conversationId: input.conversationId ?? undefined },
    `incident ${input.kind}`,
  );
}
