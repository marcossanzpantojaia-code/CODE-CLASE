import { computeSignature } from '../../src/messaging/whatsapp/signature.js';

/** Builders for WhatsApp Cloud API webhook payloads (shapes per Meta's documentation). */

let seq = 0;
export function nextWamid(): string {
  seq++;
  return `wamid.TEST${Date.now().toString(36)}${String(seq).padStart(5, '0')}`;
}

function envelope(phoneNumberId: string, value: Record<string, unknown>) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '209876543210001',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '34910000001', phone_number_id: phoneNumberId },
              ...value,
            },
          },
        ],
      },
    ],
  };
}

export interface InboundOptions {
  phoneNumberId: string;
  from: string;
  wamid?: string;
  at: Date;
  profileName?: string;
}

export function textWebhook(o: InboundOptions & { text: string }) {
  return envelope(o.phoneNumberId, {
    contacts: [{ profile: { name: o.profileName ?? 'Cliente' }, wa_id: o.from }],
    messages: [{ from: o.from, id: o.wamid ?? nextWamid(), timestamp: String(Math.floor(o.at.getTime() / 1000)), type: 'text', text: { body: o.text } }],
  });
}

export function buttonReplyWebhook(o: InboundOptions & { replyId: string; title: string }) {
  return envelope(o.phoneNumberId, {
    contacts: [{ profile: { name: o.profileName ?? 'Cliente' }, wa_id: o.from }],
    messages: [
      {
        from: o.from,
        id: o.wamid ?? nextWamid(),
        timestamp: String(Math.floor(o.at.getTime() / 1000)),
        type: 'interactive',
        interactive: { type: 'button_reply', button_reply: { id: o.replyId, title: o.title } },
      },
    ],
  });
}

export function templateButtonWebhook(o: InboundOptions & { payload: string; text: string }) {
  return envelope(o.phoneNumberId, {
    contacts: [{ profile: { name: o.profileName ?? 'Cliente' }, wa_id: o.from }],
    messages: [{ from: o.from, id: o.wamid ?? nextWamid(), timestamp: String(Math.floor(o.at.getTime() / 1000)), type: 'button', button: { payload: o.payload, text: o.text } }],
  });
}

export function mediaWebhook(o: InboundOptions & { type: 'audio' | 'image' | 'sticker' | 'reaction' }) {
  const extra =
    o.type === 'reaction' ? { reaction: { message_id: 'wamid.x', emoji: '👍' } } : { [o.type]: { id: 'media-id', mime_type: o.type === 'audio' ? 'audio/ogg' : 'image/jpeg' } };
  return envelope(o.phoneNumberId, {
    contacts: [{ profile: { name: o.profileName ?? 'Cliente' }, wa_id: o.from }],
    messages: [{ from: o.from, id: o.wamid ?? nextWamid(), timestamp: String(Math.floor(o.at.getTime() / 1000)), type: o.type, ...extra }],
  });
}

export function statusWebhook(o: { phoneNumberId: string; wamid: string; status: 'sent' | 'delivered' | 'read' | 'failed'; at: Date; recipient: string; errors?: unknown[] }) {
  return envelope(o.phoneNumberId, {
    statuses: [
      {
        id: o.wamid,
        status: o.status,
        timestamp: String(Math.floor(o.at.getTime() / 1000)),
        recipient_id: o.recipient,
        ...(o.errors ? { errors: o.errors } : {}),
      },
    ],
  });
}

export function signedRequest(body: unknown, secret: string): { payload: string; headers: Record<string, string> } {
  const payload = JSON.stringify(body);
  return {
    payload,
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': computeSignature(Buffer.from(payload, 'utf8'), secret) },
  };
}
