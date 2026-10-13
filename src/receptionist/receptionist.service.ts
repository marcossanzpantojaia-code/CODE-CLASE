import { DateTime } from 'luxon';
import { sql } from 'kysely';
import type { DB, Executor, Tx } from '../db/database.js';
import type { Business, Conversation, Customer, Message, MessagePurpose } from '../db/types.js';
import type { ClaimedJob } from '../jobs/queue.js';
import { PermanentJobError, RetryableJobError, type JobContext } from '../jobs/worker.js';
import { recordIncident } from '../observability/incidents.js';
import type { AppLogger } from '../observability/logger.js';
import type { Metrics } from '../observability/metrics.js';
import { loadCatalog, type Catalog } from '../catalog/catalog.repository.js';
import { recordCrmEvent } from '../crm/crm-events.js';
import { getCustomer, setCustomerNameIfMissing } from '../crm/customers.js';
import { enqueueOutboundMessage } from '../messaging/outbound.service.js';
import { lockConversation, markNeedsHuman, resumeBot, saveConversationState } from '../messaging/conversations.repository.js';
import type { AvailabilityService } from '../scheduling/availability.service.js';
import type { BookingService } from '../scheduling/booking.service.js';
import type { Clock } from '../shared/clock.js';
import { addMinutes } from '../shared/clock.js';
import { errorMessage } from '../shared/errors.js';
import { localDateOf } from '../shared/time.js';
import { getBusinessById } from '../tenancy/tenants.repository.js';
import { Dialog, type DialogInput, type DialogOutcome } from './dialog.js';
import type { InterpretResult, MessageInterpreter } from './llm/interpreter.js';
import { quickParse, type TurnInput } from './quick-parse.js';
import { loadState, type ConversationState, type LoadedState } from './state.js';
import { summarizeState } from './state-summary.js';

export interface ReceptionistConfig {
  stateTtlMinutes: number;
  replyMaxAgeMinutes: number;
  runawayMaxRepliesPer10Min: number;
  llmMaxCallsPerConversationPerDay: number;
  historyMessages: number;
  searchDays: number;
}

export interface ReceptionistDeps {
  db: DB;
  clock: Clock;
  interpreter: MessageInterpreter;
  availability: AvailabilityService;
  booking: BookingService;
  /** Global kill switches, read on every turn so they can change at runtime. */
  flags: () => { automatedReceptionistEnabled: boolean; safeMode: boolean };
  config: ReceptionistConfig;
  logger: AppLogger;
  metrics?: Metrics;
}

type Gate = 'OPEN' | 'GLOBAL_DISABLED' | 'TENANT_DISABLED' | 'SAFE_MODE' | 'HUMAN_HANDLING';

interface Turn {
  input: TurnInput;
  messageIds: string[];
  lastMessageId: string;
  sentAt: Date;
}

/** Messages older than this are not answered automatically (a human follows up). */
const STALE_INBOUND_MS = 6 * 3_600_000;
/** A reply after this much silence starts with a greeting. */
const NEW_SESSION_MS = 4 * 3_600_000;
const MAX_TEXT_PER_TURN = 1_500;

export class ReceptionistService {
  constructor(private readonly deps: ReceptionistDeps) {}

  /** Job handler for `receptionist.process` (serialised per conversation by the queue). */
  handle = async (job: ClaimedJob, ctx: JobContext): Promise<string> => {
    const conversationId = job.payload.conversationId;
    if (typeof conversationId !== 'string' || !job.business_id) throw new PermanentJobError('invalid receptionist.process payload');
    const businessId = job.business_id;
    const { db, clock } = this.deps;
    const log = ctx.logger.child({ businessId, conversationId });

    const business = await getBusinessById(db, businessId);
    if (!business) throw new PermanentJobError('business not found');
    const pending = await db
      .selectFrom('messages')
      .selectAll()
      .where('business_id', '=', businessId)
      .where('conversation_id', '=', conversationId)
      .where('direction', '=', 'INBOUND')
      .where('processed_at', 'is', null)
      .orderBy('provider_timestamp')
      .orderBy('created_at')
      .limit(20)
      .execute();
    if (pending.length === 0) return 'NOOP';

    let conversation = await db.selectFrom('conversations').selectAll().where('business_id', '=', businessId).where('id', '=', conversationId).executeTakeFirst();
    if (!conversation) throw new PermanentJobError('conversation not found');
    const customer = await getCustomer(db, businessId, conversation.customer_id);
    if (!customer) throw new PermanentJobError('customer not found');

    const now = clock.now();
    const gate = await this.gate(business, conversation, customer, now);
    if (gate !== 'OPEN') {
      await db.transaction().execute(async (trx) => {
        await this.markProcessed(trx, pending.map((m) => m.id), gate, now);
        if (gate !== 'HUMAN_HANDLING') {
          // Nothing automatic will answer, so the team must: this also covers
          // taps on reminder buttons while the bot is off (reminders are a
          // separate flag and stay on by default).
          const reason = gate === 'SAFE_MODE' ? 'SAFE_MODE' : 'BOT_DISABLED';
          const flagged = await markNeedsHuman(trx, { businessId, conversationId, reason, at: now });
          if (flagged) await this.handoffEvent(trx, business, customer, conversationId, reason, now);
        }
      });
      log.info({ event: 'receptionist.turn.skipped', gate, messages: pending.length }, 'automatic reply suppressed');
      return gate;
    }

    const outcomes: string[] = [];
    const handled = new Set<string>();
    for (const turn of groupTurns(pending)) {
      conversation = await db.selectFrom('conversations').selectAll().where('id', '=', conversationId).executeTakeFirstOrThrow();
      const outcome = await this.processTurn(business, conversation, customer, turn, log);
      outcomes.push(outcome);
      for (const id of turn.messageIds) handled.add(id);
      if (outcome === 'HANDOFF' || outcome === 'HUMAN_HANDLING' || outcome.startsWith('GUARD_')) {
        // A human owns the conversation now: the remaining messages are stored, not answered.
        const rest = pending.filter((m) => !handled.has(m.id)).map((m) => m.id);
        if (rest.length > 0) await db.transaction().execute((trx) => this.markProcessed(trx, rest, 'HUMAN_HANDLING', clock.now()));
        break;
      }
    }
    return outcomes.join(',').slice(0, 200);
  };

  private async processTurn(business: Business, conversation: Conversation, customer: Customer, turn: Turn, log: AppLogger): Promise<string> {
    const { db, clock, metrics, config } = this.deps;
    const started = performance.now();
    const now = clock.now();
    const businessId = business.id;
    const loaded = loadState(conversation.state, conversation.state_expires_at, now);

    // --- Guards -----------------------------------------------------------------
    if (now.getTime() - turn.sentAt.getTime() > STALE_INBOUND_MS) {
      // Too late for an automatic answer (outage / delayed delivery): a human follows up.
      // Not a safety stop, so the conversation may auto-resume later (STALE_INBOUND reason).
      await this.guardHandoff(business, conversation, customer, turn, 'GUARD_STALE_INBOUND', null, false, 'STALE_INBOUND');
      return 'GUARD_STALE_INBOUND';
    }
    const recentReplies = await db
      .selectFrom('messages')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('conversation_id', '=', conversation.id)
      .where('direction', '=', 'OUTBOUND')
      .where('purpose', 'in', ['REPLY', 'FALLBACK'])
      .where('created_at', '>', addMinutes(now, -10))
      .executeTakeFirstOrThrow();
    if (Number(recentReplies.n) >= config.runawayMaxRepliesPer10Min) {
      await this.guardHandoff(business, conversation, customer, turn, 'GUARD_RUNAWAY', 'RUNAWAY_GUARD', false);
      return 'GUARD_RUNAWAY';
    }

    // --- Understanding ------------------------------------------------------------
    const catalog = await loadCatalog(db, businessId);
    let input: DialogInput;
    let via: 'RULES' | 'LLM' | 'NONE' = 'NONE';
    const interpretStarted = performance.now();
    if (turn.input.kind === 'unsupported') {
      input = { kind: 'unsupported' };
    } else {
      const command = quickParse(turn.input, loaded.state);
      if (command) {
        input = { kind: 'command', command };
        via = 'RULES';
      } else {
        const llmCalls = await db
          .selectFrom('llm_calls')
          .select((eb) => eb.fn.countAll<number>().as('n'))
          .where('conversation_id', '=', conversation.id)
          .where('created_at', '>', addMinutes(now, -24 * 60))
          .executeTakeFirstOrThrow();
        if (Number(llmCalls.n) >= config.llmMaxCallsPerConversationPerDay) {
          await this.guardHandoff(business, conversation, customer, turn, 'GUARD_LLM_BUDGET', 'LLM_BUDGET_EXCEEDED', true);
          return 'GUARD_LLM_BUDGET';
        }
        const result = await this.interpret(business, conversation, catalog, loaded, turn);
        via = 'LLM';
        if (result.ok) {
          input = { kind: 'interpretation', interpretation: result.interpretation };
          if (result.droppedCodes.length > 0) log.warn({ event: 'llm.output.unknown_codes', dropped: result.droppedCodes }, 'LLM referenced codes not in catalog');
        } else {
          input = { kind: 'llm_failure' };
          log.warn({ event: 'llm.error', failure: result.failure, detail: result.detail }, 'LLM interpretation failed, using fallback');
          await recordIncident(
            db,
            { businessId, conversationId: conversation.id, kind: 'LLM_FAILURE', severity: 'WARNING', details: { failure: result.failure, detail: result.detail }, at: now },
            log,
            metrics,
          );
        }
      }
    }
    metrics?.intentDetectionSeconds.observe({ via }, (performance.now() - interpretStarted) / 1000);

    // --- Decide + persist atomically ------------------------------------------------
    let outcome: DialogOutcome | 'HUMAN_HANDLING';
    try {
      outcome = await db.transaction().execute(async (trx) => {
        const locked = await lockConversation(trx, businessId, conversation.id);
        if (!locked) throw new PermanentJobError('conversation vanished');
        if (locked.version !== conversation.version) {
          throw new RetryableJobError('conversation changed while interpreting; retrying turn', 500);
        }
        if (locked.needs_human) {
          await this.markProcessed(trx, turn.messageIds, 'HUMAN_HANDLING', now);
          return 'HUMAN_HANDLING' as const;
        }
        const dialog = new Dialog({
          trx,
          now,
          messageDate: localDateOf(turn.sentAt, business.timezone),
          business,
          catalog,
          customer,
          conversationId: conversation.id,
          state: loaded.state,
          stateExpired: loaded.expired,
          greet: !locked.last_outbound_at || now.getTime() - locked.last_outbound_at.getTime() > NEW_SESSION_MS,
          turnKey: turn.lastMessageId,
          searchDays: config.searchDays,
          availability: this.deps.availability,
          booking: this.deps.booking,
        });
        const result = await dialog.run(input);
        await this.persist(trx, business, customer, locked, turn, result, now);
        return result;
      });
    } catch (err) {
      metrics?.turnProcessingSeconds.observe({ outcome: 'ERROR' }, (performance.now() - started) / 1000);
      if (err instanceof RetryableJobError || err instanceof PermanentJobError) throw err;
      log.error({ event: 'receptionist.turn.failed', err: { message: errorMessage(err) } }, 'turn processing failed');
      throw err;
    }

    if (outcome === 'HUMAN_HANDLING') return 'HUMAN_HANDLING';
    if (input.kind === 'interpretation') metrics?.intentDetected.inc({ intent: input.interpretation.intent, via: 'LLM' });
    if (input.kind === 'command') metrics?.intentDetected.inc({ intent: input.command.type, via: 'RULES' });
    if (outcome.bookingIntent) metrics?.bookingIntents.inc();
    if (outcome.handoff) metrics?.humanHandoffs.inc({ reason: outcome.handoff.reason });
    metrics?.turnProcessingSeconds.observe({ outcome: outcome.outcome }, (performance.now() - started) / 1000);
    log.info(
      {
        event: 'conversation.turn.processed',
        outcome: outcome.outcome,
        via,
        intent: input.kind === 'interpretation' ? input.interpretation.intent : input.kind === 'command' ? input.command.type : input.kind,
        replies: outcome.replies.length,
        appointmentId: outcome.appointmentId ?? undefined,
        handoff: outcome.handoff?.reason,
      },
      'receptionist turn processed',
    );
    if (outcome.handoff) log.info({ event: 'human_handoff.requested', reason: outcome.handoff.reason }, 'conversation handed off to a human');
    return outcome.handoff ? 'HANDOFF' : outcome.outcome;
  }

  private async persist(
    tx: Tx,
    business: Business,
    customer: Customer,
    conversation: Conversation,
    turn: Turn,
    result: DialogOutcome,
    now: Date,
  ): Promise<void> {
    const base = { businessId: business.id, customerId: customer.id, conversationId: conversation.id, occurredAt: now };

    if (result.customerName) {
      const updated = await setCustomerNameIfMissing(tx, { businessId: business.id, customerId: customer.id, name: result.customerName, source: 'CUSTOMER_STATED' });
      if (updated) {
        await recordCrmEvent(tx, { ...base, type: 'CUSTOMER_NAME_CAPTURED', source: 'CUSTOMER', channel: 'WHATSAPP', messageId: turn.lastMessageId, data: {}, dedupeKey: `name_captured:${customer.id}` });
      }
    }
    for (const e of result.events) {
      await recordCrmEvent(tx, {
        ...base,
        type: e.type,
        source: 'WHATSAPP_RECEPTIONIST',
        channel: 'WHATSAPP',
        messageId: turn.lastMessageId,
        appointmentId: e.appointmentId ?? null,
        data: e.data,
        dedupeKey: e.dedupeKey ?? `${e.type.toLowerCase()}:${turn.lastMessageId}`,
      });
    }

    const saved = await saveConversationState(tx, {
      businessId: business.id,
      conversationId: conversation.id,
      expectedVersion: conversation.version,
      state: result.state,
      expiresAt: stateExpiry(result.state, now, this.deps.config.stateTtlMinutes),
    });
    if (!saved) throw new RetryableJobError('conversation version conflict while saving state', 500);

    if (result.handoff) {
      await markNeedsHuman(tx, { businessId: business.id, conversationId: conversation.id, reason: result.handoff.reason, at: now });
      await this.handoffEvent(tx, business, customer, conversation.id, result.handoff.reason, now);
    }

    const expiresAt = addMinutes(now, this.deps.config.replyMaxAgeMinutes);
    for (const [i, content] of result.replies.entries()) {
      const purpose: MessagePurpose =
        result.handoff && i === result.replies.length - 1 ? 'HANDOFF_ACK' : result.outcome === 'LLM_FALLBACK' ? 'FALLBACK' : 'REPLY';
      await enqueueOutboundMessage(tx, {
        businessId: business.id,
        conversationId: conversation.id,
        content,
        purpose,
        idempotencyKey: `reply:${turn.lastMessageId}:${i}`,
        replyToMessageId: turn.lastMessageId,
        appointmentId: result.appointmentId,
        expiresAt,
        now,
      });
    }
    await this.markProcessed(tx, turn.messageIds, result.outcome, now);
  }

  private async interpret(business: Business, conversation: Conversation, catalog: Catalog, loaded: LoadedState, turn: Turn): Promise<InterpretResult> {
    const { db, clock } = this.deps;
    const text = turn.input.kind === 'text' ? turn.input.text : turn.input.kind === 'reply' ? turn.input.title : '';
    const historyRows = await db
      .selectFrom('messages')
      .select(['direction', 'text', 'created_at'])
      .where('conversation_id', '=', conversation.id)
      .where('id', 'not in', turn.messageIds)
      .where('text', 'is not', null)
      .where('status', '!=', 'CANCELLED')
      .orderBy('created_at', 'desc')
      .limit(this.deps.config.historyMessages)
      .execute();
    const history = historyRows
      .reverse()
      .map((h) => ({ role: h.direction === 'INBOUND' ? ('Cliente' as const) : ('Asistente' as const), text: h.text ?? '' }));
    const local = DateTime.fromJSDate(turn.sentAt, { zone: business.timezone }).setLocale('es');
    const result = await this.deps.interpreter.interpret({
      businessName: business.name,
      catalog,
      turn: {
        localDateTime: `${local.toFormat('cccc dd/LL/yyyy HH:mm')} (${local.toISODate() ?? ''})`,
        timezone: business.timezone,
        stateSummary: loaded.expired ? 'Sin proceso en curso (la conversación anterior caducó).' : summarizeState(loaded.state, catalog, business.timezone),
        history,
        customerText: text,
      },
    });
    const usage = result.usage;
    await db
      .insertInto('llm_calls')
      .values({
        business_id: business.id,
        conversation_id: conversation.id,
        provider: this.deps.interpreter.provider,
        model: usage?.model ?? 'unknown',
        outcome: result.ok ? 'OK' : result.failure,
        latency_ms: usage?.latencyMs ?? 0,
        input_tokens: usage?.inputTokens ?? null,
        output_tokens: usage?.outputTokens ?? null,
        cache_read_tokens: usage?.cacheReadTokens ?? null,
        cache_write_tokens: usage?.cacheWriteTokens ?? null,
        cost_micro_usd: usage?.costMicroUsd ?? null,
        error: result.ok ? null : `${result.failure}: ${result.detail}`.slice(0, 500),
        created_at: clock.now(),
      })
      .execute();
    return result;
  }

  private async gate(business: Business, conversation: Conversation, customer: Customer, now: Date): Promise<Gate> {
    const flags = this.deps.flags();
    if (flags.safeMode || business.safe_mode) return 'SAFE_MODE';
    if (!flags.automatedReceptionistEnabled) return 'GLOBAL_DISABLED';
    if (!business.automated_receptionist_enabled) return 'TENANT_DISABLED';
    if (conversation.needs_human) {
      const hours = business.handoff_auto_resume_hours;
      const since = conversation.needs_human_since;
      const humanReason = conversation.needs_human_reason ?? '';
      // Safety stops (runaway, budget) never auto-resume.
      const autoResumable = !humanReason.startsWith('GUARD_') && humanReason !== 'SAFE_MODE';
      if (hours !== null && since && autoResumable && now.getTime() - since.getTime() > hours * 3_600_000) {
        await this.deps.db.transaction().execute(async (trx) => {
          if (await resumeBot(trx, { businessId: business.id, conversationId: conversation.id })) {
            await recordCrmEvent(trx, {
              businessId: business.id,
              customerId: customer.id,
              type: 'HUMAN_HANDOFF_RESOLVED',
              occurredAt: now,
              source: 'SYSTEM',
              channel: 'WHATSAPP',
              conversationId: conversation.id,
              data: { auto: true, afterHours: hours },
            });
          }
        });
        return 'OPEN';
      }
      return 'HUMAN_HANDLING';
    }
    return 'OPEN';
  }

  /** Safety stop: hand the conversation to a human, once, with an incident. */
  private async guardHandoff(
    business: Business,
    conversation: Conversation,
    customer: Customer,
    turn: Turn,
    reason: string,
    incident: 'RUNAWAY_GUARD' | 'LLM_BUDGET_EXCEEDED' | null,
    acknowledge: boolean,
    humanReason: string = reason,
  ): Promise<void> {
    const { db, clock, logger, metrics } = this.deps;
    const now = clock.now();
    await db.transaction().execute(async (trx) => {
      const flagged = await markNeedsHuman(trx, { businessId: business.id, conversationId: conversation.id, reason: humanReason, at: now });
      if (flagged) {
        await this.handoffEvent(trx, business, customer, conversation.id, humanReason, now);
        if (acknowledge) {
          await enqueueOutboundMessage(trx, {
            businessId: business.id,
            conversationId: conversation.id,
            content: { type: 'text', text: 'Te paso con una persona del equipo. 🙋 Te responderán por aquí lo antes posible.' },
            purpose: 'HANDOFF_ACK',
            idempotencyKey: `guard:${turn.lastMessageId}`,
            replyToMessageId: turn.lastMessageId,
            expiresAt: addMinutes(now, this.deps.config.replyMaxAgeMinutes),
            now,
          });
        }
      }
      await this.markProcessed(trx, turn.messageIds, reason, now);
    });
    metrics?.humanHandoffs.inc({ reason });
    if (incident) {
      await recordIncident(db, { businessId: business.id, conversationId: conversation.id, kind: incident, severity: incident === 'RUNAWAY_GUARD' ? 'CRITICAL' : 'WARNING', details: { reason }, at: now }, logger, metrics);
    }
  }

  private async handoffEvent(trx: Executor, business: Business, customer: Customer, conversationId: string, reason: string, now: Date): Promise<void> {
    await recordCrmEvent(trx, {
      businessId: business.id,
      customerId: customer.id,
      type: 'HUMAN_HANDOFF_REQUESTED',
      occurredAt: now,
      source: 'WHATSAPP_RECEPTIONIST',
      channel: 'WHATSAPP',
      conversationId,
      data: { reason },
    });
  }

  private async markProcessed(trx: Executor, ids: string[], outcome: string, now: Date): Promise<void> {
    if (ids.length === 0) return;
    await trx
      .updateTable('messages')
      .set({ status: 'PROCESSED', processed_at: now, processing_outcome: outcome.slice(0, 100) })
      .where('id', 'in', ids)
      .where('processed_at', 'is', null)
      .execute();
  }
}

export function stateExpiry(state: ConversationState, now: Date, ttlMinutes: number): Date | null {
  if (state.kind === 'IDLE') return state.focusServiceIds && state.focusServiceIds.length > 0 ? addMinutes(now, ttlMinutes) : null;
  return addMinutes(now, ttlMinutes);
}

/** Consecutive text messages form one turn (customers often split a request into several messages). */
export function groupTurns(messages: Message[]): Turn[] {
  const turns: Turn[] = [];
  for (const m of messages) {
    const sentAt = m.provider_timestamp ?? m.created_at;
    const payload = m.payload as { replyId?: unknown; waType?: unknown };
    let input: TurnInput;
    if (m.content_type === 'text') input = { kind: 'text', text: m.text ?? '' };
    else if (m.content_type === 'reply' && typeof payload.replyId === 'string') input = { kind: 'reply', replyId: payload.replyId, title: m.text ?? '' };
    else input = { kind: 'unsupported', waType: typeof payload.waType === 'string' ? payload.waType : m.content_type };

    const last = turns[turns.length - 1];
    if (input.kind === 'text' && last && last.input.kind === 'text' && last.input.text.length + input.text.length < MAX_TEXT_PER_TURN) {
      last.input = { kind: 'text', text: `${last.input.text}\n${input.text}` };
      last.messageIds.push(m.id);
      last.lastMessageId = m.id;
      continue;
    }
    if (input.kind === 'text' && input.text.length > MAX_TEXT_PER_TURN) input = { kind: 'text', text: input.text.slice(0, MAX_TEXT_PER_TURN) };
    turns.push({ input, messageIds: [m.id], lastMessageId: m.id, sentAt });
  }
  return turns;
}

/** Exposed for the admin API / CLI: how many inbound messages wait for a reply. */
export async function countUnprocessedInbound(db: DB, businessId: string): Promise<number> {
  const r = await db
    .selectFrom('messages')
    .select(sql<number>`count(*)`.as('n'))
    .where('business_id', '=', businessId)
    .where('direction', '=', 'INBOUND')
    .where('processed_at', 'is', null)
    .executeTakeFirstOrThrow();
  return Number(r.n);
}
