import { describe, expect, it } from 'vitest';
import { buttonsMessage, listMessage, sanitizeTemplateParam, templateMessage, textMessage } from '../../src/messaging/content.js';
import { buildMessageBody, classifyGraphError, resolveSecretRef, WhatsAppCloudClient, WhatsAppApiError } from '../../src/messaging/whatsapp/cloud-api.js';
import { computeSignature, verifySubscriptionToken, verifyWebhookSignature } from '../../src/messaging/whatsapp/signature.js';
import { InboundMessageSchema, normalizeInboundContent } from '../../src/messaging/whatsapp/webhook-schema.js';

describe('webhook authenticity', () => {
  const secret = 'meta-app-secret-for-tests-123456';
  const body = Buffer.from('{"object":"whatsapp_business_account","entry":[]}');

  it('accepts a valid X-Hub-Signature-256 computed over the raw body', () => {
    expect(verifyWebhookSignature(body, computeSignature(body, secret), secret)).toBe(true);
  });

  it('rejects missing, malformed, wrong-secret or tampered signatures', () => {
    expect(verifyWebhookSignature(body, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(body, 'sha1=abc', secret)).toBe(false);
    expect(verifyWebhookSignature(body, computeSignature(body, 'another-secret-xxxxxxxx'), secret)).toBe(false);
    const tampered = Buffer.from('{"object":"whatsapp_business_account","entry":[{}]}');
    expect(verifyWebhookSignature(tampered, computeSignature(body, secret), secret)).toBe(false);
  });

  it('GET verification requires hub.mode=subscribe and the exact token', () => {
    expect(verifySubscriptionToken('subscribe', 'tok-1234567890abcdef', 'tok-1234567890abcdef')).toBe(true);
    expect(verifySubscriptionToken('subscribe', 'tok-1234567890abcdeX', 'tok-1234567890abcdef')).toBe(false);
    expect(verifySubscriptionToken('unsubscribe', 'tok-1234567890abcdef', 'tok-1234567890abcdef')).toBe(false);
    expect(verifySubscriptionToken('subscribe', undefined, 'tok-1234567890abcdef')).toBe(false);
  });
});

describe('inbound normalisation', () => {
  const base = { from: '34600000001', id: 'wamid.1', timestamp: '1760342400' };
  it('text, interactive replies and template quick replies', () => {
    expect(normalizeInboundContent(InboundMessageSchema.parse({ ...base, type: 'text', text: { body: 'hola' } }))).toEqual({ kind: 'text', text: 'hola' });
    expect(
      normalizeInboundContent(InboundMessageSchema.parse({ ...base, type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'YES:abc123def0', title: 'Sí' } } })),
    ).toEqual({ kind: 'reply', replyId: 'YES:abc123def0', title: 'Sí' });
    expect(normalizeInboundContent(InboundMessageSchema.parse({ ...base, type: 'button', button: { payload: 'APPT_CONFIRM:x:1', text: 'Confirmar' } }))).toEqual({
      kind: 'reply',
      replyId: 'APPT_CONFIRM:x:1',
      title: 'Confirmar',
    });
  });
  it('audio/images are unsupported (polite reply); reactions are ignored', () => {
    expect(normalizeInboundContent(InboundMessageSchema.parse({ ...base, type: 'audio', audio: { id: 'm' } }))).toEqual({ kind: 'unsupported', waType: 'audio' });
    expect(normalizeInboundContent(InboundMessageSchema.parse({ ...base, type: 'reaction', reaction: {} }))).toEqual({ kind: 'ignored', waType: 'reaction' });
  });
});

describe('outbound payloads respect WhatsApp limits', () => {
  it('builds text, buttons, list and template bodies', () => {
    expect(buildMessageBody('34600000001', textMessage('Hola'))).toMatchObject({ type: 'text', text: { body: 'Hola', preview_url: false } });
    const btn = buildMessageBody('34600000001', buttonsMessage('Elige', [{ id: 'SLOT:abc123def0:0', title: '17:00' }]));
    expect(btn).toMatchObject({ type: 'interactive', interactive: { type: 'button', action: { buttons: [{ type: 'reply', reply: { id: 'SLOT:abc123def0:0', title: '17:00' } }] } } });
    const tpl = buildMessageBody(
      '34600000001',
      templateMessage({ name: 'cita_confirmacion', language: 'es', bodyParams: ['Marcos', 'Barbería'], quickReplyPayloads: ['APPT_CONFIRM:x:1', 'APPT_CANCEL:x:1'], fallbackText: 'x' }),
    );
    expect(tpl).toMatchObject({
      type: 'template',
      template: {
        name: 'cita_confirmacion',
        language: { code: 'es' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: 'Marcos' }, { type: 'text', text: 'Barbería' }] },
          { type: 'button', sub_type: 'quick_reply', index: '0', parameters: [{ type: 'payload', payload: 'APPT_CONFIRM:x:1' }] },
          { type: 'button', sub_type: 'quick_reply', index: '1', parameters: [{ type: 'payload', payload: 'APPT_CANCEL:x:1' }] },
        ],
      },
    });
  });
  it('enforces button/list limits and clips long titles', () => {
    expect(() => buttonsMessage('x', [])).toThrow();
    expect(() => buttonsMessage('x', [1, 2, 3, 4].map((i) => ({ id: `b${i}`, title: `${i}` })))).toThrow();
    const clipped = buttonsMessage('x', [{ id: 'a', title: 'Un título larguísimo para un botón' }]);
    expect(clipped.type === 'buttons' && [...clipped.buttons[0]!.title].length).toBe(20);
    expect(() => listMessage('x', 'Ver', Array.from({ length: 11 }, (_, i) => ({ id: `r${i}`, title: `${i}` })))).toThrow();
    expect(sanitizeTemplateParam('línea 1\nlínea 2\t     fin')).toBe('línea 1 línea 2   fin');
  });
});

describe('Graph API error classification (what is retried and what is not)', () => {
  it.each([
    [500, null, 'RETRYABLE'],
    [503, null, 'RETRYABLE'],
    [null, null, 'RETRYABLE'], // network error / timeout
    [429, null, 'RATE_LIMITED'],
    [400, 130429, 'RATE_LIMITED'],
    [400, 131056, 'RATE_LIMITED'],
    [400, 131000, 'RETRYABLE'],
    [401, 190, 'AUTH'],
    [403, 10, 'AUTH'],
    [400, 131026, 'INVALID_RECIPIENT'],
    [400, 131030, 'INVALID_RECIPIENT'],
    [400, 131047, 'OUTSIDE_WINDOW'],
    [400, 132001, 'TEMPLATE'],
    [400, 100, 'PERMANENT'],
    [400, null, 'PERMANENT'],
  ] as const)('HTTP %s / code %s -> %s', (status, code, expected) => {
    expect(classifyGraphError(status, code)).toBe(expected);
  });

  it('client maps timeouts and HTTP errors to classified WhatsAppApiError', async () => {
    const slow: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'TimeoutError' })));
      });
    const client = new WhatsAppCloudClient({ baseUrl: 'http://x', apiVersion: 'v23.0', timeoutMs: 50, fetchImpl: slow });
    const err = await client.sendMessage({ phoneNumberId: '1', accessToken: 't', to: '34600000001', content: textMessage('hola') }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WhatsAppApiError);
    expect((err as WhatsAppApiError).classification).toBe('RETRYABLE');

    const rateLimited: typeof fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ error: { code: 130429, message: 'Rate limit hit' } }), { status: 400, headers: { 'retry-after': '7' } }));
    const c2 = new WhatsAppCloudClient({ baseUrl: 'http://x', apiVersion: 'v23.0', timeoutMs: 500, fetchImpl: rateLimited });
    const e2 = (await c2.sendMessage({ phoneNumberId: '1', accessToken: 't', to: '34600000001', content: textMessage('hola') }).catch((e: unknown) => e)) as WhatsAppApiError;
    expect(e2.classification).toBe('RATE_LIMITED');
    expect(e2.retryAfterMs).toBe(7000);
    expect(e2.retryable).toBe(true);
  });

  it('secret references resolve from the environment only', () => {
    expect(resolveSecretRef('env:WHATSAPP_ACCESS_TOKEN', { WHATSAPP_ACCESS_TOKEN: 'abc' })).toBe('abc');
    expect(resolveSecretRef('env:WHATSAPP_ACCESS_TOKEN_SALON2', { WHATSAPP_ACCESS_TOKEN_SALON2: 'def' })).toBe('def');
    expect(resolveSecretRef('env:WHATSAPP_ACCESS_TOKEN', {})).toBeNull();
    expect(resolveSecretRef('plain-token', { 'plain-token': 'x' })).toBeNull();
    // A misconfigured channel cannot exfiltrate other secrets to the Graph API.
    expect(resolveSecretRef('env:DATABASE_URL', { DATABASE_URL: 'postgres://secret' })).toBeNull();
    expect(resolveSecretRef('env:WHATSAPP_APP_SECRET', { WHATSAPP_APP_SECRET: 'app-secret' })).toBeNull();
  });
});
