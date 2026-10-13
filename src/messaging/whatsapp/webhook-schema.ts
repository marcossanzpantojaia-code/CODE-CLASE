import { z } from 'zod';

/**
 * WhatsApp Cloud API webhook payload. Parsing is tolerant to fields Meta may
 * add (loose objects) but strict about the fields we rely on.
 */

const ErrorSchema = z.looseObject({
  code: z.number(),
  title: z.string().optional(),
  message: z.string().optional(),
  error_data: z.looseObject({ details: z.string().optional() }).optional(),
});

export const InboundMessageSchema = z.looseObject({
  from: z.string().min(1).max(64),
  id: z.string().min(1).max(256),
  timestamp: z.string().regex(/^\d{1,13}$/),
  type: z.string().min(1).max(40),
  text: z.looseObject({ body: z.string().max(65_536) }).optional(),
  interactive: z
    .looseObject({
      type: z.string(),
      button_reply: z.looseObject({ id: z.string().max(256), title: z.string().max(256) }).optional(),
      list_reply: z.looseObject({ id: z.string().max(256), title: z.string().max(256), description: z.string().max(512).optional() }).optional(),
    })
    .optional(),
  button: z.looseObject({ payload: z.string().max(256).optional(), text: z.string().max(256).optional() }).optional(),
  context: z.looseObject({ from: z.string().optional(), id: z.string().optional() }).optional(),
  errors: z.array(ErrorSchema).optional(),
});
export type InboundMessage = z.infer<typeof InboundMessageSchema>;

export const StatusSchema = z.looseObject({
  id: z.string().min(1).max(256),
  status: z.string().min(1).max(30),
  timestamp: z.string().regex(/^\d{1,13}$/),
  recipient_id: z.string().optional(),
  errors: z.array(ErrorSchema).optional(),
});
export type StatusUpdate = z.infer<typeof StatusSchema>;

export const ChangeValueSchema = z.looseObject({
  messaging_product: z.string().optional(),
  metadata: z.looseObject({ display_phone_number: z.string().optional(), phone_number_id: z.string() }).optional(),
  contacts: z.array(z.looseObject({ wa_id: z.string(), profile: z.looseObject({ name: z.string().optional() }).optional() })).optional(),
  messages: z.array(z.unknown()).optional(),
  statuses: z.array(z.unknown()).optional(),
});

export const WebhookPayloadSchema = z.looseObject({
  object: z.string(),
  entry: z.array(
    z.looseObject({
      id: z.string(),
      changes: z.array(z.looseObject({ field: z.string(), value: z.unknown() })),
    }),
  ),
});
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/** Normalised view of an inbound message, independent of WhatsApp's shapes. */
export type InboundContent =
  | { kind: 'text'; text: string }
  /** Interactive button/list reply or template quick-reply button. */
  | { kind: 'reply'; replyId: string; title: string }
  /** Audio, images, stickers, location... the receptionist only reads text. */
  | { kind: 'unsupported'; waType: string }
  /** Reactions and system notifications: stored, never answered. */
  | { kind: 'ignored'; waType: string };

export function normalizeInboundContent(msg: InboundMessage): InboundContent {
  switch (msg.type) {
    case 'text':
      return msg.text ? { kind: 'text', text: msg.text.body } : { kind: 'unsupported', waType: 'text' };
    case 'interactive': {
      const r = msg.interactive?.button_reply ?? msg.interactive?.list_reply;
      return r ? { kind: 'reply', replyId: r.id, title: r.title } : { kind: 'unsupported', waType: 'interactive' };
    }
    case 'button': {
      // Template quick-reply buttons carry our payload (e.g. APPT_CONFIRM:<id>:<v>).
      const payload = msg.button?.payload;
      if (payload) return { kind: 'reply', replyId: payload, title: msg.button?.text ?? '' };
      return msg.button?.text ? { kind: 'text', text: msg.button.text } : { kind: 'unsupported', waType: 'button' };
    }
    case 'reaction':
    case 'system':
    case 'ephemeral':
    case 'request_welcome':
      return { kind: 'ignored', waType: msg.type };
    default:
      return { kind: 'unsupported', waType: msg.type };
  }
}
