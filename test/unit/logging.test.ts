import { Writable } from 'node:stream';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/observability/logger.js';
import { maskPhone } from '../../src/shared/phone.js';

function capture() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _enc, cb) {
      lines.push(chunk.toString('utf8'));
      cb();
    },
  });
  return { lines, logger: createLogger({ level: 'info', appEnv: 'test', destination }) };
}

describe('logs never contain secrets or raw PII', () => {
  it('request logs drop query strings (webhook verify token) and headers (Authorization)', async () => {
    const { lines, logger } = capture();
    const app = Fastify({ loggerInstance: logger });
    app.get('/webhooks/whatsapp', () => Promise.resolve('ok'));
    await app.inject({
      method: 'GET',
      url: '/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=SECRET-TOKEN-123&hub.challenge=1',
      headers: { authorization: 'Bearer XYZ-SECRET', 'x-hub-signature-256': 'sha256=abc' },
    });
    await app.close();
    const all = lines.join('');
    expect(all).toContain('"path":"/webhooks/whatsapp"');
    expect(all).not.toContain('SECRET-TOKEN-123');
    expect(all).not.toContain('XYZ-SECRET');
    expect(all).not.toContain('sha256=abc');
  });

  it('redaction safety net covers tokens, text and phone fields passed by mistake', () => {
    const { lines, logger } = capture();
    logger.info({ event: 't', accessToken: 'EAAG-secret', text: 'mi pelo', phone: '+34612345678', nested: { apiKey: 'sk-ant-x', body: 'hola' } }, 'x');
    const all = lines.join('');
    for (const leaked of ['EAAG-secret', 'mi pelo', '+34612345678', 'sk-ant-x', '"hola"']) expect(all).not.toContain(leaked);
    expect(maskPhone('+34612345678')).toBe('+34******678');
  });
});
