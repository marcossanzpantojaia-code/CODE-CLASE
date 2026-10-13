import { z } from 'zod';

/**
 * What the AI is allowed to say about a message. The LLM only INTERPRETS:
 * it returns this structure, which is validated at runtime and then mapped by
 * the backend. It never sees database IDs (only ephemeral catalog codes such
 * as "S3"/"P1"), never computes dates (only describes them) and has no tools
 * with side effects.
 */

export const INTENTS = [
  'GREETING',
  'ASK_SERVICES',
  'ASK_PRICE',
  'ASK_AVAILABILITY',
  'BOOK_APPOINTMENT',
  'CONFIRM_APPOINTMENT',
  'CANCEL_APPOINTMENT',
  'RESCHEDULE_APPOINTMENT',
  'ASK_LOCATION',
  'ASK_OPENING_HOURS',
  'ASK_EMPLOYEE',
  'ASK_EXISTING_APPOINTMENT',
  'HUMAN_HANDOFF',
  'OUT_OF_SCOPE',
  'UNKNOWN',
] as const;
export type Intent = (typeof INTENTS)[number];

/**
 * Schema sent to the model as a structured-output JSON schema. Kept to the
 * subset structured outputs support (no numeric/string constraints); stricter
 * checks happen in `refineLlmOutput`.
 */
export const LlmOutputSchema = z.object({
  intent: z.enum(INTENTS),
  confidence: z.number(),
  serviceCodes: z.array(z.string()),
  ambiguousServiceCodes: z.array(z.string()),
  staffCode: z.string().nullable(),
  dateType: z.enum(['TODAY_OFFSET', 'WEEKDAY', 'CALENDAR']).nullable(),
  daysFromToday: z.number().int().nullable(),
  weekday: z.number().int().nullable(),
  weekOffset: z.number().int().nullable(),
  day: z.number().int().nullable(),
  month: z.number().int().nullable(),
  year: z.number().int().nullable(),
  timeOfDay: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).nullable(),
  exactTime: z.string().nullable(),
  afterTime: z.string().nullable(),
  beforeTime: z.string().nullable(),
  selectedOption: z.number().int().nullable(),
  answer: z.enum(['YES', 'NO']).nullable(),
  customerName: z.string().nullable(),
  tentative: z.boolean(),
});
export type LlmOutput = z.infer<typeof LlmOutputSchema>;

export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type DateExpr =
  | { type: 'OFFSET'; days: number }
  | { type: 'WEEKDAY'; weekday: number; weekOffset: number }
  | { type: 'CALENDAR'; day: number; month: number | null; year: number | null };

export type TimePreference =
  | { kind: 'RANGE'; range: TimeOfDay }
  | { kind: 'EXACT'; minutes: number }
  | { kind: 'AFTER'; minutes: number }
  | { kind: 'BEFORE'; minutes: number };

/** Interpretation with codes mapped to real, tenant-scoped IDs. */
export interface Interpretation {
  intent: Intent;
  confidence: number;
  serviceIds: string[];
  ambiguousServiceIds: string[];
  staffId: string | null;
  date: DateExpr | null;
  timePreference: TimePreference | null;
  selectedOption: number | null;
  answer: 'YES' | 'NO' | null;
  customerName: string | null;
  tentative: boolean;
}

/**
 * Confidence policy. LLM confidence is not calibrated, so it is used only to
 * decide between acting and asking; it never authorises a state change on its
 * own: bookings, cancellations and reschedules always require an explicit
 * customer choice of a backend-generated option or an explicit "sí".
 */
export const CONFIDENCE = {
  /** Below this the message is treated as not understood. */
  understand: 0.5,
  /** Choosing an offered option / answering yes-no from free text needs this. */
  act: 0.8,
  /** A handoff request is honoured from this value (err on the side of a human). */
  handoff: 0.5,
} as const;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function hhmmToMinutes(v: string | null): number | null {
  if (v === null) return null;
  const m = HHMM.exec(v.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export interface CodeMaps {
  services: Map<string, string>;
  staff: Map<string, string>;
}

/**
 * Validates semantic constraints the JSON schema cannot express and maps
 * catalog codes to IDs. Unknown codes are dropped (never trusted).
 */
export function refineLlmOutput(raw: LlmOutput, maps: CodeMaps): { interpretation: Interpretation; droppedCodes: string[] } {
  const dropped: string[] = [];
  const mapCodes = (codes: string[]) =>
    [...new Set(codes.map((c) => c.trim().toUpperCase()))].flatMap((c) => {
      const id = maps.services.get(c);
      if (!id) {
        dropped.push(c);
        return [];
      }
      return [id];
    });

  let date: DateExpr | null = null;
  if (raw.dateType === 'TODAY_OFFSET' && raw.daysFromToday !== null && raw.daysFromToday >= 0 && raw.daysFromToday <= 400) {
    date = { type: 'OFFSET', days: raw.daysFromToday };
  } else if (raw.dateType === 'WEEKDAY' && raw.weekday !== null && raw.weekday >= 1 && raw.weekday <= 7) {
    const offset = raw.weekOffset ?? 0;
    date = { type: 'WEEKDAY', weekday: raw.weekday, weekOffset: offset >= 0 && offset <= 8 ? offset : 0 };
  } else if (raw.dateType === 'CALENDAR' && raw.day !== null && raw.day >= 1 && raw.day <= 31) {
    const month = raw.month !== null && raw.month >= 1 && raw.month <= 12 ? raw.month : null;
    const year = raw.year !== null && raw.year >= 2000 && raw.year <= 2100 ? raw.year : null;
    date = { type: 'CALENDAR', day: raw.day, month, year };
  }

  let timePreference: TimePreference | null = null;
  const exact = hhmmToMinutes(raw.exactTime);
  const after = hhmmToMinutes(raw.afterTime);
  const before = hhmmToMinutes(raw.beforeTime);
  if (exact !== null) timePreference = { kind: 'EXACT', minutes: exact };
  else if (after !== null) timePreference = { kind: 'AFTER', minutes: after };
  else if (before !== null) timePreference = { kind: 'BEFORE', minutes: before };
  else if (raw.timeOfDay) timePreference = { kind: 'RANGE', range: raw.timeOfDay };

  let staffId: string | null = null;
  if (raw.staffCode) {
    staffId = maps.staff.get(raw.staffCode.trim().toUpperCase()) ?? null;
    if (!staffId) dropped.push(raw.staffCode);
  }

  const confidence = Number.isFinite(raw.confidence) ? Math.min(1, Math.max(0, raw.confidence)) : 0;
  const selected = raw.selectedOption !== null && raw.selectedOption >= 1 && raw.selectedOption <= 10 ? raw.selectedOption : null;
  const name = raw.customerName?.trim() ? raw.customerName.trim().slice(0, 60) : null;

  return {
    interpretation: {
      intent: raw.intent,
      confidence,
      serviceIds: mapCodes(raw.serviceCodes),
      ambiguousServiceIds: mapCodes(raw.ambiguousServiceCodes),
      staffId,
      date,
      timePreference,
      selectedOption: selected,
      answer: raw.answer,
      customerName: name,
      tentative: raw.tentative,
    },
    droppedCodes: dropped,
  };
}
