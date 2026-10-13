import { readFile } from 'node:fs/promises';
import { DateTime } from 'luxon';
import { z } from 'zod';
import type { AppConfig } from '../config/env.js';
import type { DB } from '../db/database.js';
import { loadCatalog } from '../catalog/catalog.repository.js';
import { AnthropicInterpreter } from '../receptionist/llm/anthropic-interpreter.js';
import { CircuitBreaker } from '../shared/circuit-breaker.js';
import { systemClock } from '../shared/clock.js';
import type { Business } from '../db/types.js';
import type { Interpretation } from '../receptionist/interpretation.js';

/**
 * Measures how the REAL model interprets realistic Spanish messages for a
 * tenant's real catalog. Spends real money (one API call per case), so it
 * requires --confirm-cost. Output: per-case result, accuracy, latency
 * percentiles and cost. This is the evidence for "LLM productivo verificado".
 */

const Expect = z
  .object({
    intent: z.string().optional(),
    intentIn: z.array(z.string()).optional(),
    services: z.array(z.string()).optional(),
    ambiguousIncludes: z.array(z.string()).optional(),
    staff: z.string().optional(),
    dateType: z.string().optional(),
    daysFromToday: z.number().optional(),
    weekday: z.number().optional(),
    day: z.number().optional(),
    month: z.number().optional(),
    timeOfDay: z.string().optional(),
    exactTime: z.string().optional(),
    afterTime: z.string().optional(),
    selectedOption: z.number().optional(),
    selectedOptionOrTime: z.object({ option: z.number(), time: z.string() }).optional(),
    answer: z.enum(['YES', 'NO']).optional(),
    customerName: z.string().optional(),
    tentative: z.boolean().optional(),
    maxConfidence: z.number().optional(),
    noInventedCodes: z.boolean().optional(),
  })
  .strict();
const CasesFile = z.object({ description: z.string().optional(), cases: z.array(z.object({ text: z.string(), state: z.string().optional(), expect: Expect })) });

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function check(i: Interpretation, e: z.infer<typeof Expect>, names: { service: (id: string) => string; staff: (id: string) => string }, dropped: string[]): string[] {
  const problems: string[] = [];
  const eq = (label: string, actual: unknown, expected: unknown) => {
    if (expected !== undefined && actual !== expected) problems.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  };
  eq('intent', i.intent, e.intent);
  if (e.intentIn && !e.intentIn.includes(i.intent)) problems.push(`intent: expected one of ${e.intentIn.join('|')}, got ${i.intent}`);
  if (e.services) {
    const got = i.serviceIds.map(names.service).sort();
    if (JSON.stringify(got) !== JSON.stringify([...e.services].sort())) problems.push(`services: expected ${JSON.stringify(e.services)}, got ${JSON.stringify(got)}`);
  }
  if (e.ambiguousIncludes) {
    const got = i.ambiguousServiceIds.map(names.service);
    for (const n of e.ambiguousIncludes) if (!got.includes(n)) problems.push(`ambiguous services should include ${n}, got ${JSON.stringify(got)}`);
  }
  if (e.staff !== undefined) eq('staff', i.staffId ? names.staff(i.staffId) : null, e.staff);
  if (e.dateType) {
    const map: Record<string, string> = { TODAY_OFFSET: 'OFFSET', WEEKDAY: 'WEEKDAY', CALENDAR: 'CALENDAR' };
    eq('dateType', i.date?.type, map[e.dateType]);
  }
  if (e.daysFromToday !== undefined) eq('daysFromToday', i.date?.type === 'OFFSET' ? i.date.days : undefined, e.daysFromToday);
  if (e.weekday !== undefined) eq('weekday', i.date?.type === 'WEEKDAY' ? i.date.weekday : undefined, e.weekday);
  if (e.day !== undefined) eq('day', i.date?.type === 'CALENDAR' ? i.date.day : undefined, e.day);
  if (e.month !== undefined) eq('month', i.date?.type === 'CALENDAR' ? i.date.month : undefined, e.month);
  if (e.timeOfDay) eq('timeOfDay', i.timePreference?.kind === 'RANGE' ? i.timePreference.range : undefined, e.timeOfDay);
  if (e.exactTime) eq('exactTime', i.timePreference?.kind === 'EXACT' ? hhmm(i.timePreference.minutes) : undefined, e.exactTime);
  if (e.afterTime) eq('afterTime', i.timePreference?.kind === 'AFTER' ? hhmm(i.timePreference.minutes) : undefined, e.afterTime);
  eq('selectedOption', i.selectedOption ?? undefined, e.selectedOption);
  if (e.selectedOptionOrTime) {
    const byOption = i.selectedOption === e.selectedOptionOrTime.option;
    const byTime = i.timePreference?.kind === 'EXACT' && hhmm(i.timePreference.minutes) === e.selectedOptionOrTime.time;
    if (!byOption && !byTime) problems.push(`selection: expected option ${e.selectedOptionOrTime.option} or time ${e.selectedOptionOrTime.time}`);
  }
  eq('answer', i.answer ?? undefined, e.answer);
  eq('customerName', i.customerName ?? undefined, e.customerName);
  eq('tentative', e.tentative === undefined ? undefined : i.tentative, e.tentative);
  if (e.maxConfidence !== undefined && i.confidence > e.maxConfidence) problems.push(`confidence ${i.confidence} > ${e.maxConfidence}`);
  if (e.noInventedCodes && dropped.length > 0) problems.push(`model referenced codes not in catalog: ${dropped.join(',')}`);
  return problems;
}

export async function runLlmEval(db: DB, config: AppConfig, business: Business, file: string): Promise<Record<string, unknown>> {
  if (!config.llm.apiKey) throw new Error('ANTHROPIC_API_KEY is not set: the evaluation needs the real model');
  const cases = CasesFile.parse(JSON.parse(await readFile(file, 'utf8')));
  const catalog = await loadCatalog(db, business.id);
  const names = {
    service: (id: string) => catalog.services.find((s) => s.id === id)?.name ?? id,
    staff: (id: string) => catalog.staff.find((s) => s.id === id)?.name ?? id,
  };
  const breaker = new CircuitBreaker({ name: 'llm-eval', failureThreshold: 1_000, windowMs: 60_000, openDurationMs: 1, clock: systemClock });
  const interpreter = new AnthropicInterpreter(
    {
      apiKey: config.llm.apiKey,
      baseUrl: config.llm.baseUrl,
      model: config.llm.model,
      effort: config.llm.effort,
      maxOutputTokens: config.llm.maxOutputTokens,
      timeoutMs: config.llm.timeoutMs,
      maxRetries: config.llm.maxRetries,
      serverFallbacks: config.llm.serverFallbacks,
      pricesPerMTok: config.llm.pricesPerMTok,
    },
    breaker,
  );
  const now = DateTime.now().setZone(business.timezone).setLocale('es');
  const results: Array<Record<string, unknown>> = [];
  const latencies: number[] = [];
  let cost = 0;
  let passed = 0;
  for (const c of cases.cases) {
    const r = await interpreter.interpret({
      businessName: business.name,
      catalog,
      turn: {
        localDateTime: `${now.toFormat('cccc dd/LL/yyyy HH:mm')} (${now.toISODate() ?? ''})`,
        timezone: business.timezone,
        stateSummary: c.state ?? 'Sin proceso en curso.',
        history: [],
        customerText: c.text,
      },
    });
    if (r.usage) {
      latencies.push(r.usage.latencyMs);
      cost += r.usage.costMicroUsd / 1_000_000;
    }
    if (!r.ok) {
      results.push({ text: c.text, ok: false, failure: r.failure, detail: r.detail });
      continue;
    }
    const problems = check(r.interpretation, c.expect, names, r.droppedCodes);
    if (problems.length === 0) passed++;
    results.push({ text: c.text, ok: problems.length === 0, intent: r.interpretation.intent, confidence: r.interpretation.confidence, problems });
  }
  latencies.sort((a, b) => a - b);
  const pct = (p: number) => (latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))] : null);
  return {
    model: config.llm.model,
    effort: config.llm.effort,
    tenant: business.slug,
    cases: cases.cases.length,
    passed,
    accuracy: cases.cases.length ? Math.round((passed / cases.cases.length) * 1000) / 1000 : null,
    latencyMs: { p50: pct(50), p95: pct(95), max: latencies[latencies.length - 1] ?? null },
    costUsd: Math.round(cost * 10_000) / 10_000,
    results,
  };
}
