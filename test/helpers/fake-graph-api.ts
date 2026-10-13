import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Local HTTP server speaking the subset of the WhatsApp Cloud API (Graph API)
 * that the app uses. It is a TEST DOUBLE for the provider boundary: it proves
 * our client/serialisation/error handling against realistic HTTP responses,
 * NOT that Meta accepts the messages (that needs staging/production).
 */
export interface SentMessage {
  phoneNumberId: string;
  authorization: string | undefined;
  body: Record<string, unknown>;
  wamid: string;
}

export interface ScriptedFailure {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Delay before answering (timeouts). */
  delayMs?: number;
}

export class FakeGraphApi {
  readonly sent: SentMessage[] = [];
  private failures: ScriptedFailure[] = [];
  private server: Server | null = null;
  private counter = 0;
  readonly expectedToken: string;
  latencyMs = 0;

  constructor(expectedToken = 'test-whatsapp-token') {
    this.expectedToken = expectedToken;
  }

  get url(): string {
    const addr = this.server?.address() as AddressInfo | null;
    if (!addr) throw new Error('fake graph api not started');
    return `http://127.0.0.1:${addr.port}`;
  }

  /** Queue failures answered (in order) before going back to success. */
  failNext(...failures: ScriptedFailure[]): void {
    this.failures.push(...failures);
  }

  reset(): void {
    this.sent.length = 0;
    this.failures = [];
    this.latencyMs = 0;
    this.counter = 0;
  }

  /** Text bodies (or interactive body text) of the messages sent to a recipient. */
  textsTo(recipient: string): string[] {
    return this.sent.filter((m) => m.body.to === recipient).map((m) => messageText(m.body));
  }

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });
    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
    this.server = null;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString('utf8');
    const url = new URL(req.url ?? '/', 'http://localhost');
    const match = /^\/(v\d+\.\d+)\/(\d+)(\/messages)?$/.exec(url.pathname);
    const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { 'content-type': 'application/json', ...headers });
      res.end(JSON.stringify(body));
    };
    if (!match) return send(404, { error: { message: 'unknown path', code: 100 } });
    if (req.headers.authorization !== `Bearer ${this.expectedToken}`) {
      return send(401, { error: { message: 'Invalid OAuth access token.', type: 'OAuthException', code: 190, fbtrace_id: 'trace-auth' } });
    }
    const failure = this.failures.shift();
    const delay = failure?.delayMs ?? this.latencyMs;
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    if (failure) return send(failure.status, failure.body ?? {}, failure.headers);
    if (req.method === 'GET' && !match[3]) return send(200, { display_phone_number: '+34 910 000 001', quality_rating: 'GREEN', id: match[2] });
    if (req.method !== 'POST' || !match[3]) return send(405, { error: { message: 'method not allowed', code: 100 } });
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return send(400, { error: { message: 'Invalid JSON', code: 100 } });
    }
    const validation = validateMessageBody(body);
    if (validation) return send(400, { error: { message: validation, code: 100, error_subcode: 2494010 } });
    const wamid = `wamid.FAKE${String(++this.counter).padStart(6, '0')}`;
    this.sent.push({ phoneNumberId: match[2] as string, authorization: req.headers.authorization, body, wamid });
    return send(200, { messaging_product: 'whatsapp', contacts: [{ input: body.to, wa_id: body.to }], messages: [{ id: wamid }] });
  }
}

/** Mirrors the documented constraints so invalid payloads fail like they would at Meta. */
function validateMessageBody(body: Record<string, unknown>): string | null {
  if (body.messaging_product !== 'whatsapp') return 'messaging_product must be whatsapp';
  if (typeof body.to !== 'string' || !/^\d{7,15}$/.test(body.to)) return 'invalid recipient';
  switch (body.type) {
    case 'text': {
      const t = (body.text as { body?: unknown } | undefined)?.body;
      return typeof t === 'string' && t.length > 0 && t.length <= 4096 ? null : 'invalid text body';
    }
    case 'interactive': {
      const i = body.interactive as { type?: string; body?: { text?: string }; action?: { buttons?: Array<{ reply: { id: string; title: string } }>; sections?: Array<{ rows: Array<{ id: string; title: string }> }>; button?: string } };
      if (!i?.body?.text || i.body.text.length > 1024) return 'invalid interactive body';
      if (i.type === 'button') {
        const b = i.action?.buttons ?? [];
        if (b.length < 1 || b.length > 3) return 'buttons must be 1-3';
        if (b.some((x) => x.reply.title.length > 20 || x.reply.id.length > 256)) return 'button title/id too long';
        return null;
      }
      if (i.type === 'list') {
        const rows = (i.action?.sections ?? []).flatMap((s) => s.rows);
        if (rows.length < 1 || rows.length > 10) return 'rows must be 1-10';
        if (rows.some((r) => r.title.length > 24)) return 'row title too long';
        if (!i.action?.button || i.action.button.length > 20) return 'invalid list button';
        return null;
      }
      return 'unsupported interactive type';
    }
    case 'template': {
      const t = body.template as { name?: string; language?: { code?: string } } | undefined;
      return t?.name && t.language?.code ? null : 'invalid template';
    }
    default:
      return 'unsupported message type';
  }
}

export function messageText(body: Record<string, unknown>): string {
  if (body.type === 'text') return String((body.text as { body: string }).body);
  if (body.type === 'interactive') return String((body.interactive as { body: { text: string } }).body.text);
  if (body.type === 'template') return `[template:${(body.template as { name: string }).name}]`;
  return '';
}

export function buttonIds(body: Record<string, unknown>): string[] {
  if (body.type !== 'interactive') return [];
  const i = body.interactive as { type: string; action: { buttons?: Array<{ reply: { id: string } }>; sections?: Array<{ rows: Array<{ id: string }> }> } };
  if (i.type === 'button') return (i.action.buttons ?? []).map((b) => b.reply.id);
  return (i.action.sections ?? []).flatMap((s) => s.rows.map((r) => r.id));
}

export function buttonTitles(body: Record<string, unknown>): string[] {
  if (body.type !== 'interactive') return [];
  const i = body.interactive as { type: string; action: { buttons?: Array<{ reply: { title: string } }>; sections?: Array<{ rows: Array<{ title: string }> }> } };
  if (i.type === 'button') return (i.action.buttons ?? []).map((b) => b.reply.title);
  return (i.action.sections ?? []).flatMap((s) => s.rows.map((r) => r.title));
}
