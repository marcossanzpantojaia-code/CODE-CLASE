import { describe, expect, it } from 'vitest';
import { quickParse } from '../../src/receptionist/quick-parse.js';
import { decodeReplyId, encodeReplyId } from '../../src/receptionist/reply-ids.js';
import { IDLE, type ConversationState } from '../../src/receptionist/state.js';

const offering: ConversationState = {
  kind: 'OFFERING_SLOTS',
  purpose: 'BOOK',
  appointmentId: null,
  offerId: 'abc123def0',
  serviceIds: ['5f0a3f5e-7b1e-4f3c-9b0a-0b8f5c2f1a11'],
  staffId: null,
  date: '2026-10-14',
  timePref: null,
  slots: [{ start: '2026-10-14T15:00:00.000Z', staffIds: ['5f0a3f5e-7b1e-4f3c-9b0a-0b8f5c2f1a12'] }],
  clarifications: 0,
};
const confirming: ConversationState = { kind: 'CONFIRMING_CANCELLATION', offerId: 'abc123def0', appointmentId: '5f0a3f5e-7b1e-4f3c-9b0a-0b8f5c2f1a13', clarifications: 0 };

describe('quickParse (deterministic fast path, no LLM)', () => {
  it('decodes interactive replies bound to the offer that produced them', () => {
    expect(quickParse({ kind: 'reply', replyId: 'SLOT:abc123def0:1', title: '18:30' }, offering)).toEqual({ type: 'SELECT_OPTION', offerId: 'abc123def0', index: 1 });
    expect(quickParse({ kind: 'reply', replyId: 'YES:abc123def0', title: 'Sí' }, confirming)).toEqual({ type: 'ANSWER', offerId: 'abc123def0', answer: 'YES' });
    expect(quickParse({ kind: 'reply', replyId: 'APPT_CONFIRM:5f0a3f5e-7b1e-4f3c-9b0a-0b8f5c2f1a13:2', title: 'Confirmar' }, IDLE)).toEqual({
      type: 'APPOINTMENT_ACTION',
      action: 'CONFIRM',
      appointmentId: '5f0a3f5e-7b1e-4f3c-9b0a-0b8f5c2f1a13',
      version: 2,
    });
  });

  it('rejects forged / malformed reply ids', () => {
    expect(quickParse({ kind: 'reply', replyId: "SLOT:abc123def0:1'; DROP TABLE x", title: 'x' }, offering)).toEqual({ type: 'UNKNOWN_REPLY' });
    expect(quickParse({ kind: 'reply', replyId: 'APPT_CONFIRM:not-a-uuid:1', title: 'x' }, IDLE)).toEqual({ type: 'UNKNOWN_REPLY' });
    expect(decodeReplyId('SLOT:ABC:1')).toBeNull();
  });

  it('understands numeric and time selections while slots are on offer', () => {
    expect(quickParse({ kind: 'text', text: '2' }, offering)).toEqual({ type: 'SELECT_OPTION', offerId: null, index: 1 });
    expect(quickParse({ kind: 'text', text: '2️⃣' }, offering)).toEqual({ type: 'SELECT_OPTION', offerId: null, index: 1 });
    expect(quickParse({ kind: 'text', text: 'la 3' }, offering)).toEqual({ type: 'SELECT_OPTION', offerId: null, index: 2 });
    expect(quickParse({ kind: 'text', text: '18:30' }, offering)).toEqual({ type: 'SELECT_TIME', minutes: 1110 });
    expect(quickParse({ kind: 'text', text: 'a las 18.30h' }, offering)).toEqual({ type: 'SELECT_TIME', minutes: 1110 });
    expect(quickParse({ kind: 'text', text: 'mejor el jueves por la tarde' }, offering)).toBeNull(); // -> LLM
  });

  it('yes/no only in a yes/no context; bare "sí" with no context is flagged, never applied', () => {
    expect(quickParse({ kind: 'text', text: 'Sí!' }, confirming)).toEqual({ type: 'ANSWER', offerId: null, answer: 'YES' });
    expect(quickParse({ kind: 'text', text: 'no, gracias' }, confirming)).toEqual({ type: 'ANSWER', offerId: null, answer: 'NO' });
    expect(quickParse({ kind: 'text', text: 'si' }, IDLE)).toEqual({ type: 'ANSWER', offerId: null, answer: 'YES' });
    expect(quickParse({ kind: 'text', text: 'creo que mañana quizá pueda ir' }, IDLE)).toBeNull();
  });

  it('explicit requests for a human are detected without the LLM', () => {
    for (const t of ['Quiero hablar con una persona', 'pásame con el encargado', 'necesito hablar con alguien', 'Tengo una queja']) {
      expect(quickParse({ kind: 'text', text: t }, IDLE)).toEqual({ type: 'HANDOFF', offerId: null, explicitRequest: true });
    }
    // Mentioning staff in a normal question is not a handoff.
    expect(quickParse({ kind: 'text', text: '¿Quién es el encargado de los tintes?' }, IDLE)).toBeNull();
  });

  it('reply ids round-trip', () => {
    for (const a of [
      { action: 'SLOT', offerId: 'abc123def0', index: 2 },
      { action: 'TOD', offerId: 'abc123def0', value: 'AFTERNOON' },
      { action: 'APPT_CANCEL', appointmentId: '5f0a3f5e-7b1e-4f3c-9b0a-0b8f5c2f1a13', version: 7 },
    ] as const) {
      expect(decodeReplyId(encodeReplyId(a))).toEqual(a);
    }
  });
});
