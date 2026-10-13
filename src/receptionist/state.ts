import { randomBytes } from 'node:crypto';
import { z } from 'zod';

/**
 * Conversation state machine persisted in conversations.state (JSONB) and
 * validated on every read. Only the backend writes it; all IDs inside come
 * from the database, never from the model. It expires
 * (conversations.state_expires_at) so a "sí" written weeks later is never
 * applied to an old question.
 */

const TimeOfDaySchema = z.enum(['MORNING', 'AFTERNOON', 'EVENING']);
const TimePrefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('RANGE'), range: TimeOfDaySchema }),
  z.object({ kind: z.literal('EXACT'), minutes: z.number().int().min(0).max(1439) }),
  z.object({ kind: z.literal('AFTER'), minutes: z.number().int().min(0).max(1439) }),
  z.object({ kind: z.literal('BEFORE'), minutes: z.number().int().min(0).max(1439) }),
]);
const SlotSchema = z.object({ start: z.iso.datetime(), staffIds: z.array(z.uuid()).min(1) });
const Purpose = z.enum(['BOOK', 'RESCHEDULE']);
const OfferId = z.string().regex(/^[a-z0-9]{6,16}$/);
const LocalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ConversationStateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('IDLE'),
    /** Services the customer talked about recently (follow-ups like "¿y mañana?"). */
    focusServiceIds: z.array(z.uuid()).optional(),
    clarifications: z.number().int().min(0).default(0),
  }),
  z.object({
    kind: z.literal('COLLECTING'),
    purpose: Purpose,
    appointmentId: z.uuid().nullable(),
    serviceIds: z.array(z.uuid()),
    staffId: z.uuid().nullable(),
    date: LocalDate.nullable(),
    timePref: TimePrefSchema.nullable(),
    awaiting: z.enum(['SERVICE', 'DATE', 'TIME_OF_DAY']),
    offerId: OfferId,
    /** When awaiting SERVICE among ambiguous candidates (numbered options). */
    serviceChoices: z.array(z.uuid()).optional(),
    clarifications: z.number().int().min(0).default(0),
  }),
  z.object({
    kind: z.literal('OFFERING_SLOTS'),
    purpose: Purpose,
    appointmentId: z.uuid().nullable(),
    offerId: OfferId,
    serviceIds: z.array(z.uuid()).min(1),
    staffId: z.uuid().nullable(),
    date: LocalDate,
    timePref: TimePrefSchema.nullable(),
    slots: z.array(SlotSchema).min(1).max(10),
    clarifications: z.number().int().min(0).default(0),
  }),
  z.object({
    kind: z.literal('CONFIRMING_BOOKING'),
    purpose: Purpose,
    appointmentId: z.uuid().nullable(),
    offerId: OfferId,
    serviceIds: z.array(z.uuid()).min(1),
    staffId: z.uuid().nullable(),
    slot: SlotSchema,
    clarifications: z.number().int().min(0).default(0),
  }),
  z.object({
    kind: z.literal('CONFIRMING_CANCELLATION'),
    offerId: OfferId,
    appointmentId: z.uuid(),
    clarifications: z.number().int().min(0).default(0),
  }),
  z.object({
    kind: z.literal('CHOOSING_APPOINTMENT'),
    offerId: OfferId,
    purpose: z.enum(['CANCEL', 'RESCHEDULE', 'CONFIRM']),
    appointmentIds: z.array(z.uuid()).min(1).max(10),
    date: LocalDate.nullable(),
    timePref: TimePrefSchema.nullable(),
    clarifications: z.number().int().min(0).default(0),
  }),
  z.object({
    kind: z.literal('OFFERING_HANDOFF'),
    offerId: OfferId,
  }),
]);

export type ConversationState = z.infer<typeof ConversationStateSchema>;
export type StateKind = ConversationState['kind'];
export type StoredSlot = z.infer<typeof SlotSchema>;

export const IDLE: ConversationState = { kind: 'IDLE', clarifications: 0 };

export interface LoadedState {
  state: ConversationState;
  /** True when a non-idle state existed but timed out. */
  expired: boolean;
  /** True when the stored JSON was invalid (defensive: treated as IDLE). */
  corrupt: boolean;
}

export function loadState(raw: unknown, expiresAt: Date | null, now: Date): LoadedState {
  const parsed = ConversationStateSchema.safeParse(raw);
  if (!parsed.success) return { state: IDLE, expired: false, corrupt: raw !== null && raw !== undefined };
  const state = parsed.data;
  if (state.kind !== 'IDLE' && expiresAt !== null && expiresAt.getTime() <= now.getTime()) {
    return { state: IDLE, expired: true, corrupt: false };
  }
  return { state, expired: false, corrupt: false };
}

export function newOfferId(): string {
  return randomBytes(5).toString('hex');
}

export function clarificationsOf(state: ConversationState): number {
  return 'clarifications' in state ? state.clarifications : 0;
}
