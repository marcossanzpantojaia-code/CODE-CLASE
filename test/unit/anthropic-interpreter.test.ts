import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Catalog } from '../../src/catalog/catalog.repository.js';
import { AnthropicInterpreter } from '../../src/receptionist/llm/anthropic-interpreter.js';
import type { InterpretRequest } from '../../src/receptionist/llm/interpreter.js';
import { CircuitBreaker } from '../../src/shared/circuit-breaker.js';
import { MutableClock } from '../helpers/clock.js';
import { FakeAnthropic } from '../helpers/fake-anthropic.js';

const catalog: Catalog = {
  services: [
    { id: '11111111-1111-4111-8111-111111111111', name: 'Corte caballero', category: 'Corte', description: null, durationMinutes: 30, bufferMinutes: 0, priceType: 'FIXED', priceCents: 1500, bookableOnline: true },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Corte + barba', category: 'Corte', description: null, durationMinutes: 45, bufferMinutes: 0, priceType: 'FIXED', priceCents: 2500, bookableOnline: true },
  ],
  staff: [{ id: '33333333-3333-4333-8333-333333333333', name: 'Juan', hasCustomHours: false }],
  staffServices: new Map(),
};

const request = (text: string): InterpretRequest => ({
  businessName: 'Barbería Piloto',
  catalog,
  turn: { localDateTime: 'martes 13/10/2026 10:00 (2026-10-13)', timezone: 'Europe/Madrid', stateSummary: 'Sin proceso en curso.', history: [], customerText: text },
});

describe('AnthropicInterpreter against a Messages-API-compatible HTTP server', () => {
  const fake = new FakeAnthropic();
  const clock = new MutableClock('2026-10-13T08:00:00Z');
  let breaker: CircuitBreaker;
  let interpreter: AnthropicInterpreter;

  beforeAll(async () => {
    await fake.start();
  });
  afterAll(async () => {
    await fake.stop();
  });
  beforeEach(() => {
    fake.reset();
    breaker = new CircuitBreaker({ name: 'llm', failureThreshold: 3, windowMs: 60_000, openDurationMs: 30_000, clock });
    interpreter = new AnthropicInterpreter(
      {
        apiKey: 'sk-ant-test',
        baseUrl: fake.url,
        model: 'claude-opus-5-5',
        effort: 'low',
        maxOutputTokens: 4096,
        timeoutMs: 400,
        maxRetries: 0,
        serverFallbacks: true,
        pricesPerMTok: { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
      },
      breaker,
    );
  });

  it('valid structured output -> validated interpretation with real IDs, usage and cost', async () => {
    fake.on(/corte y barba/i, (c) => ({ intent: 'ASK_AVAILABILITY', confidence: 0.97, serviceCodes: [c.serviceCode('Corte + barba')], dateType: 'TODAY_OFFSET', daysFromToday: 1, timeOfDay: 'AFTERNOON' }));
    const r = await interpreter.interpret(request('Hola, ¿tenéis mañana por la tarde para corte y barba?'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.interpretation).toMatchObject({ intent: 'ASK_AVAILABILITY', serviceIds: ['22222222-2222-4222-8222-222222222222'], date: { type: 'OFFSET', days: 1 } });
    // 900 in * $4 + 120 out * $20 + 1400 cache-read * $0.2 per MTok = $0.00628
    expect(r.usage).toMatchObject({ inputTokens: 900, outputTokens: 120, cacheReadTokens: 1400, costMicroUsd: 6280 });
  });

  it('sends a cache-friendly, structured-output request with server-side refusal fallback and no PII', async () => {
    await interpreter.interpret(request('Hola, soy Laura'));
    const req = fake.requests[0]!;
    expect(req.headers['anthropic-beta']).toContain('server-side-fallback-2026-07-01');
    expect(req.body.fallbacks).toBe('default');
    expect(req.body.model).toBe('claude-opus-5-5');
    expect(req.body.output_config?.effort).toBe('low');
    expect(req.body.output_config?.format?.type).toBe('json_schema');
    expect(Object.keys(req.body.output_config?.format?.schema.properties as object)).toContain('intent');
    expect(req.body.system?.map((s) => s.cache_control)).toEqual([{ type: 'ephemeral' }, { type: 'ephemeral' }]);
    expect(req.body).not.toHaveProperty('tools');
    expect(req.body).not.toHaveProperty('thinking');
    const all = JSON.stringify(req.body);
    expect(all).not.toMatch(/\+?34\d{9}/); // no phone numbers
    expect(all).not.toContain('11111111-1111'); // no database IDs
  });

  it('invalid JSON from the model -> INVALID_OUTPUT (no crash, no guess)', async () => {
    fake.next({ kind: 'raw-text', text: 'Claro, aquí tienes horarios: 17:00, 18:30' });
    const r = await interpreter.interpret(request('hola'));
    expect(r).toMatchObject({ ok: false, failure: 'INVALID_OUTPUT' });
  });

  it('JSON that violates the schema -> INVALID_OUTPUT', async () => {
    fake.next({ kind: 'raw-text', text: JSON.stringify({ intent: 'CREATE_APPOINTMENT_NOW', slots: ['18:30'] }) });
    expect(await interpreter.interpret(request('hola'))).toMatchObject({ ok: false, failure: 'INVALID_OUTPUT' });
  });

  it('timeout -> TIMEOUT, bounded by the configured timeout', async () => {
    fake.next({ kind: 'delay', ms: 2_000 });
    const started = Date.now();
    const r = await interpreter.interpret(request('hola'));
    expect(r).toMatchObject({ ok: false, failure: 'TIMEOUT' });
    expect(Date.now() - started).toBeLessThan(1_500);
  });

  it('provider down (500/529), rate limit (429), auth (401) and refusal are classified', async () => {
    fake.next({ kind: 'status', status: 500 });
    expect(await interpreter.interpret(request('hola'))).toMatchObject({ ok: false, failure: 'PROVIDER_ERROR' });
    fake.next({ kind: 'status', status: 529, body: { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } } });
    expect(await interpreter.interpret(request('hola'))).toMatchObject({ ok: false, failure: 'PROVIDER_ERROR' });
    breaker.recordSuccess();
    fake.next({ kind: 'status', status: 429, body: { type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } } });
    expect(await interpreter.interpret(request('hola'))).toMatchObject({ ok: false, failure: 'RATE_LIMITED' });
    breaker.recordSuccess();
    fake.next({ kind: 'status', status: 401, body: { type: 'error', error: { type: 'authentication_error', message: 'bad key' } } });
    expect(await interpreter.interpret(request('hola'))).toMatchObject({ ok: false, failure: 'AUTH' });
    breaker.recordSuccess();
    fake.next({ kind: 'refusal' });
    expect(await interpreter.interpret(request('hola'))).toMatchObject({ ok: false, failure: 'REFUSAL' });
  });

  it('opens the circuit after repeated provider failures and stops calling it', async () => {
    fake.next({ kind: 'status', status: 503 }, { kind: 'status', status: 503 }, { kind: 'status', status: 503 });
    for (let i = 0; i < 3; i++) await interpreter.interpret(request('hola'));
    const callsBefore = fake.requests.length;
    const r = await interpreter.interpret(request('hola'));
    expect(r).toMatchObject({ ok: false, failure: 'CIRCUIT_OPEN' });
    expect(fake.requests.length).toBe(callsBefore);
    clock.advanceMs(30_000);
    fake.on(/hola/, () => ({ intent: 'GREETING', confidence: 0.95 }));
    expect((await interpreter.interpret(request('hola'))).ok).toBe(true); // half-open probe succeeds
    expect(breaker.currentState()).toBe('CLOSED');
  });

  it('without an API key the interpreter reports NOT_CONFIGURED instead of calling anything', async () => {
    const unconfigured = new AnthropicInterpreter(
      { apiKey: undefined, baseUrl: fake.url, model: 'm', effort: 'low', maxOutputTokens: 1000, timeoutMs: 100, maxRetries: 0, serverFallbacks: false, pricesPerMTok: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } },
      breaker,
    );
    expect(await unconfigured.interpret(request('hola'))).toMatchObject({ ok: false, failure: 'NOT_CONFIGURED' });
    expect(fake.requests).toHaveLength(0);
  });
});
