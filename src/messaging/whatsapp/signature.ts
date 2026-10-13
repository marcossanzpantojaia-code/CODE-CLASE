import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Meta signs every webhook POST with HMAC-SHA256(app_secret, raw_body) and
 * sends it as `X-Hub-Signature-256: sha256=<hex>`. The signature must be
 * computed over the exact raw bytes received (not re-serialised JSON).
 */
export function computeSignature(rawBody: Buffer, appSecret: string): string {
  return `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
}

export function verifyWebhookSignature(rawBody: Buffer, header: string | undefined, appSecret: string): boolean {
  if (!header || !/^sha256=[0-9a-f]{64}$/i.test(header)) return false;
  const expected = Buffer.from(computeSignature(rawBody, appSecret), 'utf8');
  const received = Buffer.from(header.toLowerCase(), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** GET verification handshake (hub.mode=subscribe & hub.verify_token). Constant-time compare. */
export function verifySubscriptionToken(mode: unknown, token: unknown, expected: string): boolean {
  if (mode !== 'subscribe' || typeof token !== 'string') return false;
  const a = Buffer.from(token, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
