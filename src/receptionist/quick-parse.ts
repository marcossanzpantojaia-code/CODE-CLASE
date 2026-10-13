import type { TimeOfDay } from './interpretation.js';
import { decodeReplyId } from './reply-ids.js';
import type { ConversationState } from './state.js';

/**
 * Deterministic understanding of structured or trivially unambiguous input.
 * Runs before the LLM: it is free, instant, and keeps the critical "choose
 * an option / say yes" steps working even when the LLM provider is down.
 */
export type Command =
  | { type: 'SELECT_OPTION'; offerId: string | null; index: number }
  | { type: 'SELECT_TIME'; minutes: number }
  | { type: 'ANSWER'; offerId: string | null; answer: 'YES' | 'NO' }
  | { type: 'TIME_OF_DAY'; offerId: string | null; value: TimeOfDay }
  | { type: 'APPOINTMENT_ACTION'; action: 'CONFIRM' | 'CANCEL'; appointmentId: string; version: number }
  | { type: 'HANDOFF'; offerId: string | null; explicitRequest: boolean }
  | { type: 'UNKNOWN_REPLY' };

export type TurnInput =
  | { kind: 'reply'; replyId: string; title: string }
  | { kind: 'text'; text: string }
  | { kind: 'unsupported'; waType: string };

const KEYCAP_DIGITS: Record<string, string> = {
  '1️⃣': '1', '2️⃣': '2', '3️⃣': '3', '4️⃣': '4', '5️⃣': '5', '6️⃣': '6', '7️⃣': '7', '8️⃣': '8', '9️⃣': '9', '🔟': '10',
};

function normalize(text: string): string {
  let t = text.trim();
  for (const [k, v] of Object.entries(KEYCAP_DIGITS)) t = t.split(k).join(v);
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[!¡?¿.,;:)\]👍🙏😊🙂]+$/u, '')
    .trim();
}

const OPTION = /^(?:(?:la|el|opcion|numero|num|n)\s*)?(\d{1,2})(?:\s*[).º°])?$/;
const TIME = /^(?:a\s+las?\s+)?([01]?\d|2[0-3])[:.h]([0-5]\d)\s*(?:h|hrs?|horas)?$/;
const YES = /^(si+|sip|vale|ok|okay|okey|de acuerdo|confirmo|confirmado|correcto|perfecto|claro|adelante|hecho|si,? por favor|si,? gracias|si,? reservalo|si,? cancela(?:la)?)$/;
const NO = /^(no+|nop|nope|mejor no|no,? gracias|ninguna|ninguno)$/;
/** Only explicit, unambiguous requests for a person. Complaints go through the LLM. */
const HUMAN =
  /\b(hablar|habla|hable|pasame|pasa(?:me)? con|ponme con|quiero|necesito|puedo hablar)\b.{0,25}\b(persona|humano|humana|alguien|encargad[oa]|responsable|duen[oa]|gerente|recepcionista de verdad)\b/;
const COMPLAINT = /\b(quiero poner una (queja|reclamacion)|tengo una (queja|reclamacion)|hoja de reclamaciones)\b/;

export function quickParse(input: TurnInput, state: ConversationState): Command | null {
  if (input.kind === 'unsupported') return null;
  if (input.kind === 'reply') {
    const a = decodeReplyId(input.replyId);
    if (!a) return { type: 'UNKNOWN_REPLY' };
    switch (a.action) {
      case 'SLOT':
      case 'APPT':
      case 'SVC':
        return { type: 'SELECT_OPTION', offerId: a.offerId, index: a.index };
      case 'YES':
      case 'NO':
        return { type: 'ANSWER', offerId: a.offerId, answer: a.action };
      case 'TOD':
        return { type: 'TIME_OF_DAY', offerId: a.offerId, value: a.value };
      case 'HANDOFF':
        return { type: 'HANDOFF', offerId: a.offerId, explicitRequest: true };
      case 'APPT_CONFIRM':
        return { type: 'APPOINTMENT_ACTION', action: 'CONFIRM', appointmentId: a.appointmentId, version: a.version };
      case 'APPT_CANCEL':
        return { type: 'APPOINTMENT_ACTION', action: 'CANCEL', appointmentId: a.appointmentId, version: a.version };
    }
  }

  const t = normalize(input.text);
  if (t.length === 0) return null;
  if (HUMAN.test(t) || COMPLAINT.test(t)) return { type: 'HANDOFF', offerId: null, explicitRequest: true };

  switch (state.kind) {
    case 'OFFERING_SLOTS': {
      const time = TIME.exec(t);
      if (time) return { type: 'SELECT_TIME', minutes: Number(time[1]) * 60 + Number(time[2]) };
      const opt = OPTION.exec(t);
      if (opt) return { type: 'SELECT_OPTION', offerId: null, index: Number(opt[1]) - 1 };
      return null;
    }
    case 'CHOOSING_APPOINTMENT': {
      const opt = OPTION.exec(t);
      return opt ? { type: 'SELECT_OPTION', offerId: null, index: Number(opt[1]) - 1 } : null;
    }
    case 'COLLECTING': {
      if (state.awaiting === 'SERVICE' && state.serviceChoices && state.serviceChoices.length > 0) {
        const opt = OPTION.exec(t);
        if (opt) return { type: 'SELECT_OPTION', offerId: null, index: Number(opt[1]) - 1 };
      }
      if (state.awaiting === 'TIME_OF_DAY') {
        if (/^(por la )?tarde$/.test(t)) return { type: 'TIME_OF_DAY', offerId: null, value: 'AFTERNOON' };
        if (/^por la manana$/.test(t)) return { type: 'TIME_OF_DAY', offerId: null, value: 'MORNING' };
        if (/^(por la )?noche$/.test(t)) return { type: 'TIME_OF_DAY', offerId: null, value: 'EVENING' };
      }
      return null;
    }
    case 'CONFIRMING_BOOKING':
    case 'CONFIRMING_CANCELLATION':
    case 'OFFERING_HANDOFF': {
      if (YES.test(t) || t === '1') return { type: 'ANSWER', offerId: null, answer: 'YES' };
      if (NO.test(t) || t === '2') return { type: 'ANSWER', offerId: null, answer: 'NO' };
      return null;
    }
    case 'IDLE': {
      // A bare "sí"/"no"/"2" with no pending question (e.g. the previous
      // question expired weeks ago) must never be applied to anything.
      if (YES.test(t)) return { type: 'ANSWER', offerId: null, answer: 'YES' };
      if (NO.test(t)) return { type: 'ANSWER', offerId: null, answer: 'NO' };
      const opt = OPTION.exec(t);
      if (opt) return { type: 'SELECT_OPTION', offerId: null, index: Number(opt[1]) - 1 };
      return null;
    }
  }
}
