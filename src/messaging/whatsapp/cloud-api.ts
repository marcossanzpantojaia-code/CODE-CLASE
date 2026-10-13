import { parseRetryAfterMs } from '../../shared/backoff.js';
import { errorMessage } from '../../shared/errors.js';
import type { OutboundContent } from '../content.js';

/**
 * Minimal client for the WhatsApp Business Platform Cloud API (Graph API).
 * POST /{version}/{phone-number-id}/messages
 */

export type WhatsAppErrorClass =
  /** Transient (timeout, network, 5xx, "something went wrong"): retry with backoff. */
  | 'RETRYABLE'
  /** Throughput / pair / spam rate limits: retry later, honouring Retry-After. */
  | 'RATE_LIMITED'
  /** Token expired/invalid, missing permission, account locked: do NOT retry; alert. */
  | 'AUTH'
  /** Recipient cannot receive (not on WhatsApp, not in the test allow-list...). */
  | 'INVALID_RECIPIENT'
  /** Free-form message outside the 24h customer service window. */
  | 'OUTSIDE_WINDOW'
  /** Template missing/paused/param mismatch. */
  | 'TEMPLATE'
  /** Any other permanent bad request. */
  | 'PERMANENT';

export class WhatsAppApiError extends Error {
  constructor(
    message: string,
    public readonly classification: WhatsAppErrorClass,
    public readonly httpStatus: number | null,
    public readonly code: number | null,
    public readonly subcode: number | null,
    public readonly retryAfterMs: number | null,
    public readonly fbtraceId: string | null,
  ) {
    super(message);
    this.name = 'WhatsAppApiError';
  }

  get retryable(): boolean {
    return this.classification === 'RETRYABLE' || this.classification === 'RATE_LIMITED';
  }

  toJSON(): Record<string, unknown> {
    return {
      classification: this.classification,
      httpStatus: this.httpStatus,
      code: this.code,
      subcode: this.subcode,
      fbtraceId: this.fbtraceId,
      message: this.message.slice(0, 500),
    };
  }
}

const RATE_LIMIT_CODES = new Set([4, 80007, 130429, 131048, 131056]);
const RETRYABLE_CODES = new Set([1, 2, 17, 341, 131000, 131016, 131057, 133004]);
const AUTH_CODES = new Set([0, 3, 10, 190, 131005, 131031, 131042, 133010, 368]);
const RECIPIENT_CODES = new Set([131026, 131030, 131021]);
const WINDOW_CODES = new Set([131047, 470]);
const TEMPLATE_CODES = new Set([132000, 132001, 132005, 132007, 132012, 132015, 132016]);

export function classifyGraphError(httpStatus: number | null, code: number | null): WhatsAppErrorClass {
  if (code !== null) {
    if (RATE_LIMIT_CODES.has(code)) return 'RATE_LIMITED';
    if (RETRYABLE_CODES.has(code)) return 'RETRYABLE';
    if (AUTH_CODES.has(code) || (code >= 200 && code <= 299)) return 'AUTH';
    if (RECIPIENT_CODES.has(code)) return 'INVALID_RECIPIENT';
    if (WINDOW_CODES.has(code)) return 'OUTSIDE_WINDOW';
    if (TEMPLATE_CODES.has(code)) return 'TEMPLATE';
  }
  if (httpStatus === null) return 'RETRYABLE';
  if (httpStatus === 429) return 'RATE_LIMITED';
  if (httpStatus === 401 || httpStatus === 403) return 'AUTH';
  if (httpStatus >= 500) return 'RETRYABLE';
  if (httpStatus === 408) return 'RETRYABLE';
  return 'PERMANENT';
}

export interface SendResult {
  providerMessageId: string;
  /** e.g. "accepted" / "held_for_quality_assessment" when Meta reports it. */
  messageStatus: string | null;
}

export interface WhatsAppClientOptions {
  baseUrl: string;
  apiVersion: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export function buildMessageBody(to: string, content: OutboundContent, replyToProviderId?: string | null): Record<string, unknown> {
  const base: Record<string, unknown> = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
  if (replyToProviderId) base.context = { message_id: replyToProviderId };
  switch (content.type) {
    case 'text':
      return { ...base, type: 'text', text: { preview_url: false, body: content.text } };
    case 'buttons':
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: content.text },
          action: { buttons: content.buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
        },
      };
    case 'list':
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: content.text },
          action: {
            button: content.buttonLabel,
            sections: [{ title: 'Opciones', rows: content.rows.map((r) => ({ id: r.id, title: r.title, ...(r.description ? { description: r.description } : {}) })) }],
          },
        },
      };
    case 'template': {
      const components: Array<Record<string, unknown>> = [];
      if (content.bodyParams.length > 0) {
        components.push({ type: 'body', parameters: content.bodyParams.map((text) => ({ type: 'text', text })) });
      }
      content.quickReplyPayloads.forEach((payload, index) => {
        components.push({ type: 'button', sub_type: 'quick_reply', index: String(index), parameters: [{ type: 'payload', payload }] });
      });
      return {
        ...base,
        type: 'template',
        template: { name: content.name, language: { code: content.language }, ...(components.length > 0 ? { components } : {}) },
      };
    }
  }
}

interface GraphErrorBody {
  error?: { message?: string; code?: number; error_subcode?: number; fbtrace_id?: string; error_data?: { details?: string } };
}

export class WhatsAppCloudClient {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(private readonly options: WhatsAppClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async sendMessage(params: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    content: OutboundContent;
    replyToProviderId?: string | null;
  }): Promise<SendResult> {
    const url = `${this.options.baseUrl}/${this.options.apiVersion}/${encodeURIComponent(params.phoneNumberId)}/messages`;
    const body = buildMessageBody(params.to, params.content, params.replyToProviderId);
    const json = await this.request(url, params.accessToken, { method: 'POST', body: JSON.stringify(body) });
    const messages = (json as { messages?: Array<{ id?: unknown; message_status?: unknown }> }).messages;
    const first = messages?.[0];
    if (!first || typeof first.id !== 'string' || first.id.length === 0) {
      // 200 without a message id: we cannot prove the message exists -> treat as transient.
      throw new WhatsAppApiError('Graph API returned no message id', 'RETRYABLE', 200, null, null, null, null);
    }
    return { providerMessageId: first.id, messageStatus: typeof first.message_status === 'string' ? first.message_status : null };
  }

  /** Lightweight credential/number check (used by the cached readiness probe). */
  async getPhoneNumber(phoneNumberId: string, accessToken: string): Promise<{ displayPhoneNumber: string | null; qualityRating: string | null }> {
    const url = `${this.options.baseUrl}/${this.options.apiVersion}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,quality_rating`;
    const json = (await this.request(url, accessToken, { method: 'GET' })) as { display_phone_number?: string; quality_rating?: string };
    return { displayPhoneNumber: json.display_phone_number ?? null, qualityRating: json.quality_rating ?? null };
  }

  private async request(url: string, accessToken: string, init: { method: 'GET' | 'POST'; body?: string }): Promise<unknown> {
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: init.method,
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        ...(init.body !== undefined ? { body: init.body } : {}),
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (err) {
      const timeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
      throw new WhatsAppApiError(timeout ? 'Graph API request timed out' : `Graph API network error: ${errorMessage(err)}`, 'RETRYABLE', null, null, null, null, null);
    }
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text.length > 0 ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    if (res.ok) {
      if (parsed === null || typeof parsed !== 'object') {
        throw new WhatsAppApiError('Graph API returned a non-JSON success body', 'RETRYABLE', res.status, null, null, null, null);
      }
      return parsed;
    }
    const err = (parsed as GraphErrorBody | null)?.error;
    const code = typeof err?.code === 'number' ? err.code : null;
    const subcode = typeof err?.error_subcode === 'number' ? err.error_subcode : null;
    const classification = classifyGraphError(res.status, code);
    const message = [err?.message, err?.error_data?.details].filter(Boolean).join(' | ') || `HTTP ${res.status}`;
    throw new WhatsAppApiError(
      message,
      classification,
      res.status,
      code,
      subcode,
      parseRetryAfterMs(res.headers.get('retry-after'), this.now()),
      err?.fbtrace_id ?? null,
    );
  }
}

/**
 * Secrets are referenced, never stored: "env:WHATSAPP_ACCESS_TOKEN" resolves
 * to process.env.WHATSAPP_ACCESS_TOKEN (populated by the platform's secret
 * manager). Returns null when missing.
 */
export function resolveSecretRef(ref: string, env: NodeJS.ProcessEnv = process.env): string | null {
  // Only WhatsApp access tokens may be referenced: a misconfigured channel must
  // never be able to ship another secret (DATABASE_URL, API keys...) to Meta.
  const m = /^env:(WHATSAPP_ACCESS_TOKEN(?:_[A-Z0-9_]{1,80})?)$/.exec(ref);
  if (!m) return null;
  const value = env[m[1] as string];
  return value && value.length > 0 ? value : null;
}
