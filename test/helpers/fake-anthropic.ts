import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { LlmOutput } from '../../src/receptionist/interpretation.js';

/**
 * Local HTTP server speaking the Anthropic Messages API shape. TEST DOUBLE for
 * the LLM provider boundary: our real AnthropicInterpreter (SDK, request
 * construction, structured-output parsing, Zod validation, timeouts, error
 * classification) talks to it over HTTP. It does NOT measure how well the real
 * model understands Spanish — that requires the real API (see docs/VERIFICACION.md).
 */

export interface CapturedRequest {
  headers: Record<string, string | string[] | undefined>;
  body: {
    model: string;
    max_tokens: number;
    system?: Array<{ type: string; text: string; cache_control?: unknown }>;
    messages: Array<{ role: string; content: string }>;
    output_config?: { effort?: string; format?: { type: string; schema: Record<string, unknown> } };
    fallbacks?: unknown;
    [k: string]: unknown;
  };
}

export interface ScriptContext {
  customerText: string;
  stateSummary: string;
  /** Catalog name (lower case) -> code, parsed from the system block like the model would read it. */
  serviceCode: (name: string) => string;
  staffCode: (name: string) => string;
}

export type Scripted = (ctx: ScriptContext) => Partial<LlmOutput>;

export type AnthropicBehaviour =
  | { kind: 'script' }
  | { kind: 'status'; status: number; body?: unknown; headers?: Record<string, string> }
  | { kind: 'delay'; ms: number }
  | { kind: 'raw-text'; text: string }
  | { kind: 'refusal' };

export const BASE_OUTPUT: LlmOutput = {
  intent: 'UNKNOWN',
  confidence: 0.3,
  serviceCodes: [],
  ambiguousServiceCodes: [],
  staffCode: null,
  dateType: null,
  daysFromToday: null,
  weekday: null,
  weekOffset: null,
  day: null,
  month: null,
  year: null,
  timeOfDay: null,
  exactTime: null,
  afterTime: null,
  beforeTime: null,
  selectedOption: null,
  answer: null,
  customerName: null,
  tentative: false,
};

export class FakeAnthropic {
  readonly requests: CapturedRequest[] = [];
  private server: Server | null = null;
  private queue: AnthropicBehaviour[] = [];
  /** Rules tried in order; first whose regex matches the customer text answers. */
  private rules: Array<{ pattern: RegExp; script: Scripted }> = [];
  usage = { input_tokens: 900, output_tokens: 120, cache_read_input_tokens: 1400, cache_creation_input_tokens: 0 };

  get url(): string {
    const addr = this.server?.address() as AddressInfo | null;
    if (!addr) throw new Error('fake anthropic not started');
    return `http://127.0.0.1:${addr.port}`;
  }

  on(pattern: RegExp, script: Scripted): this {
    this.rules.push({ pattern, script });
    return this;
  }

  /** Next responses (in order) override the scripted behaviour. */
  next(...behaviours: AnthropicBehaviour[]): void {
    this.queue.push(...behaviours);
  }

  reset(): void {
    this.requests.length = 0;
    this.queue = [];
    this.rules = [];
  }

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });
    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
  }

  async stop(): Promise<void> {
    this.server?.closeAllConnections();
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
    this.server = null;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
      if (res.writableEnded) return;
      res.writeHead(status, { 'content-type': 'application/json', 'request-id': `req_fake_${this.requests.length}`, ...headers });
      res.end(JSON.stringify(body));
    };
    if (!req.url?.startsWith('/v1/messages')) return send(404, { type: 'error', error: { type: 'not_found_error', message: 'not found' } });
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as CapturedRequest['body'];
    this.requests.push({ headers: req.headers, body });
    if (!req.headers['x-api-key']) return send(401, { type: 'error', error: { type: 'authentication_error', message: 'missing key' } });

    const behaviour = this.queue.shift() ?? { kind: 'script' };
    switch (behaviour.kind) {
      case 'status':
        return send(behaviour.status, behaviour.body ?? { type: 'error', error: { type: 'api_error', message: 'fake failure' } }, behaviour.headers);
      case 'delay':
        await new Promise((r) => setTimeout(r, behaviour.ms));
        return send(200, this.message(body, JSON.stringify(BASE_OUTPUT), 'end_turn'));
      case 'raw-text':
        return send(200, this.message(body, behaviour.text, 'end_turn'));
      case 'refusal':
        return send(200, { ...this.message(body, '', 'refusal'), content: [], stop_details: { type: 'refusal', category: null, explanation: null } });
      case 'script': {
        const ctx = this.contextOf(body);
        const rule = this.rules.find((r) => r.pattern.test(ctx.customerText));
        const output: LlmOutput = { ...BASE_OUTPUT, ...(rule ? rule.script(ctx) : {}) };
        return send(200, this.message(body, JSON.stringify(output), 'end_turn'));
      }
    }
  }

  private message(body: CapturedRequest['body'], text: string, stop: string) {
    return {
      id: `msg_fake_${this.requests.length}`,
      type: 'message',
      role: 'assistant',
      model: body.model,
      content: text ? [{ type: 'text', text }] : [],
      stop_reason: stop,
      stop_sequence: null,
      usage: { ...this.usage },
    };
  }

  private contextOf(body: CapturedRequest['body']): ScriptContext {
    const user = body.messages[body.messages.length - 1]?.content ?? '';
    const customerText = /<mensaje_cliente>\n([\s\S]*?)\n<\/mensaje_cliente>/.exec(user)?.[1] ?? '';
    const stateSummary = /Estado de la conversación: (.*)/.exec(user)?.[1] ?? '';
    const catalog = body.system?.[1]?.text ?? '';
    const services = new Map<string, string>();
    const staff = new Map<string, string>();
    for (const line of catalog.split('\n')) {
      const s = /^(S\d+) \| ([^|]+)/.exec(line);
      if (s) services.set(s[2]!.trim().toLowerCase(), s[1]!);
      const p = /^(P\d+) \| (.+)$/.exec(line);
      if (p) staff.set(p[2]!.trim().toLowerCase(), p[1]!);
    }
    return {
      customerText,
      stateSummary,
      serviceCode: (name) => {
        const code = services.get(name.toLowerCase());
        if (!code) throw new Error(`fake anthropic: service ${name} not in catalog block`);
        return code;
      },
      staffCode: (name) => {
        const code = staff.get(name.toLowerCase());
        if (!code) throw new Error(`fake anthropic: staff ${name} not in catalog block`);
        return code;
      },
    };
  }
}
