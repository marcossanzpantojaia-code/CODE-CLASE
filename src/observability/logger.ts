import { pino, stdTimeFunctions, type Logger } from 'pino';

export type AppLogger = Logger;

/**
 * Structured JSON logs. Event names follow `<area>.<thing>.<what>` (e.g.
 * `whatsapp.message.received`) and carry businessId / conversationId /
 * messageId / appointmentId when known.
 *
 * PII policy: phone numbers are only logged masked (see maskPhone) and message
 * text is never logged. The redact list below is a safety net in case a
 * future log call passes a raw object by mistake.
 */
/**
 * Request serializer: path only. Query strings can carry secrets
 * (e.g. hub.verify_token on the webhook verification GET) and are never logged.
 */
export function serializeRequest(req: { method?: string; url?: string; ip?: string; id?: string }): Record<string, unknown> {
  const url = typeof req.url === 'string' ? req.url.split('?')[0] : undefined;
  return { method: req.method, path: url, remoteAddress: req.ip, reqId: req.id };
}

export function createLogger(options: { level: string; appEnv: string; destination?: NodeJS.WritableStream }): AppLogger {
  return pino(
    {
      level: options.level,
      base: { service: 'salon-receptionist', env: options.appEnv },
      timestamp: stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
      serializers: { req: serializeRequest },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-hub-signature-256"]',
          'headers.authorization',
          'apiKey',
          '*.apiKey',
          'accessToken',
          '*.accessToken',
          'token',
          '*.token',
          'secret',
          '*.secret',
          'text',
          '*.text',
          'body',
          '*.body',
          'phone',
          '*.phone',
          'phoneE164',
          '*.phoneE164',
        ],
        censor: '[REDACTED]',
      },
    },
    options.destination as Parameters<typeof pino>[1],
  );
}

export function createSilentLogger(): AppLogger {
  return pino({ level: 'silent' });
}
