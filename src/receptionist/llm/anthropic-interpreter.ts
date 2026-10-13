import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { Metrics } from '../../observability/metrics.js';
import type { CircuitBreaker } from '../../shared/circuit-breaker.js';
import { errorMessage } from '../../shared/errors.js';
import { LlmOutputSchema, refineLlmOutput } from '../interpretation.js';
import type { InterpretRequest, InterpretResult, InterpreterFailure, LlmUsage, MessageInterpreter } from './interpreter.js';
import { SYSTEM_PROMPT, buildCatalogBlock, buildUserMessage } from './prompt.js';

export interface AnthropicInterpreterOptions {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  maxOutputTokens: number;
  timeoutMs: number;
  maxRetries: number;
  /** Server-side refusal fallback (`fallbacks: "default"`). */
  serverFallbacks: boolean;
  pricesPerMTok: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

const OUTPUT_FORMAT = zodOutputFormat(LlmOutputSchema);

/**
 * Claude-based interpreter. One Messages API call per customer turn with a
 * structured-output JSON schema; the response is then re-validated with Zod
 * and every catalog code is mapped server-side. Timeouts, retries and the
 * circuit breaker bound the latency/cost of a provider outage.
 */
export class AnthropicInterpreter implements MessageInterpreter {
  readonly provider = 'anthropic';
  private readonly client: Anthropic | null;

  constructor(
    private readonly options: AnthropicInterpreterOptions,
    private readonly breaker: CircuitBreaker,
    private readonly metrics?: Metrics,
    client?: Anthropic,
  ) {
    this.client =
      client ??
      (options.apiKey
        ? new Anthropic({
            apiKey: options.apiKey,
            // Never pick up ambient credentials (ANTHROPIC_AUTH_TOKEN) or base URLs from the host.
            authToken: null,
            baseURL: options.baseUrl,
            timeout: options.timeoutMs,
            maxRetries: options.maxRetries,
          })
        : null);
  }

  async interpret(request: InterpretRequest): Promise<InterpretResult> {
    if (!this.client) return this.fail('NOT_CONFIGURED', 'ANTHROPIC_API_KEY is not configured', null);
    if (!this.breaker.tryAcquire()) return this.fail('CIRCUIT_OPEN', 'LLM circuit breaker is open', null);

    const catalog = buildCatalogBlock(request.businessName, request.catalog);
    const started = performance.now();
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await this.client.beta.messages.create(
        {
          model: this.options.model,
          max_tokens: this.options.maxOutputTokens,
          system: [
            { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: catalog.block, cache_control: { type: 'ephemeral' } },
          ],
          messages: [{ role: 'user', content: buildUserMessage(request.turn) }],
          output_config: { effort: this.options.effort, format: OUTPUT_FORMAT },
          ...(this.options.serverFallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        },
        { timeout: this.options.timeoutMs, maxRetries: this.options.maxRetries },
      );
    } catch (err) {
      const latencyMs = Math.round(performance.now() - started);
      const failure = classifyAnthropicError(err);
      if (failure === 'TIMEOUT' || failure === 'RATE_LIMITED' || failure === 'PROVIDER_ERROR' || failure === 'AUTH') {
        this.breaker.recordFailure();
      } else {
        this.breaker.recordSuccess();
      }
      this.metrics?.llmLatencySeconds.observe({ outcome: failure }, latencyMs / 1000);
      return this.fail(failure, errorMessage(err).slice(0, 300), { ...emptyUsage(this.options.model), latencyMs });
    }

    this.breaker.recordSuccess();
    const usage = this.usageOf(response, Math.round(performance.now() - started));

    if (response.stop_reason === 'refusal') return this.fail('REFUSAL', 'model declined the request', usage);
    if (response.stop_reason === 'max_tokens') return this.fail('INVALID_OUTPUT', 'output truncated (max_tokens)', usage);
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return this.fail('INVALID_OUTPUT', 'response is not valid JSON', usage);
    }
    const parsed = LlmOutputSchema.safeParse(json);
    if (!parsed.success) return this.fail('INVALID_OUTPUT', `schema validation failed: ${parsed.error.issues.slice(0, 3).map((i) => i.path.join('.')).join(', ')}`, usage);

    const { interpretation, droppedCodes } = refineLlmOutput(parsed.data, catalog.maps);
    this.metrics?.llmRequests.inc({ outcome: 'OK' });
    this.metrics?.llmLatencySeconds.observe({ outcome: 'OK' }, usage.latencyMs / 1000);
    return { ok: true, interpretation, usage, droppedCodes };
  }

  private usageOf(response: Anthropic.Beta.BetaMessage, latencyMs: number): LlmUsage {
    const u = response.usage;
    const input = u.input_tokens ?? 0;
    const output = u.output_tokens ?? 0;
    const cacheRead = u.cache_read_input_tokens ?? 0;
    const cacheWrite = u.cache_creation_input_tokens ?? 0;
    const p = this.options.pricesPerMTok;
    const costUsd = (input * p.input + output * p.output + cacheRead * p.cacheRead + cacheWrite * p.cacheWrite) / 1_000_000;
    this.metrics?.llmTokens.inc({ kind: 'input' }, input);
    this.metrics?.llmTokens.inc({ kind: 'output' }, output);
    this.metrics?.llmTokens.inc({ kind: 'cache_read' }, cacheRead);
    this.metrics?.llmTokens.inc({ kind: 'cache_write' }, cacheWrite);
    this.metrics?.llmCostUsd.inc(costUsd);
    return {
      model: response.model,
      latencyMs,
      inputTokens: input,
      outputTokens: output,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      costMicroUsd: Math.round(costUsd * 1_000_000),
    };
  }

  private fail(failure: InterpreterFailure, detail: string, usage: LlmUsage | null): InterpretResult {
    this.metrics?.llmRequests.inc({ outcome: failure });
    this.metrics?.llmFailures.inc({ reason: failure });
    return { ok: false, failure, detail, usage };
  }
}

function emptyUsage(model: string): LlmUsage {
  return { model, latencyMs: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costMicroUsd: 0 };
}

/** Most specific first: typed SDK errors, never message matching. */
export function classifyAnthropicError(err: unknown): InterpreterFailure {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return 'TIMEOUT';
  if (err instanceof Anthropic.APIUserAbortError) return 'TIMEOUT';
  if (err instanceof Anthropic.APIConnectionError) return 'PROVIDER_ERROR';
  if (err instanceof Anthropic.RateLimitError) return 'RATE_LIMITED';
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return 'AUTH';
  if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.NotFoundError || err instanceof Anthropic.UnprocessableEntityError) return 'BAD_REQUEST';
  if (err instanceof Anthropic.InternalServerError) return 'PROVIDER_ERROR';
  if (err instanceof Anthropic.APIError) return (err.status ?? 500) >= 500 ? 'PROVIDER_ERROR' : 'BAD_REQUEST';
  return 'PROVIDER_ERROR';
}
