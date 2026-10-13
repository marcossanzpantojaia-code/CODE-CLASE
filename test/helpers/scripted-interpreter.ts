import { LlmOutputSchema, refineLlmOutput, type LlmOutput } from '../../src/receptionist/interpretation.js';
import type { InterpretRequest, InterpretResult, InterpreterFailure, MessageInterpreter } from '../../src/receptionist/llm/interpreter.js';
import { buildCatalogBlock } from '../../src/receptionist/llm/prompt.js';
import { BASE_OUTPUT, type ScriptContext } from './fake-anthropic.js';

/**
 * Test double at the MessageInterpreter interface (no HTTP): lets dialog tests
 * script what "the model understood" while exercising the same validation and
 * code->ID mapping as production. The real Anthropic adapter is tested
 * separately against an HTTP server, and E2E tests use the full chain.
 */
export class ScriptedInterpreter implements MessageInterpreter {
  readonly provider = 'scripted';
  readonly calls: string[] = [];
  private rules: Array<{ pattern: RegExp; script: (c: ScriptContext) => Partial<LlmOutput> }> = [];
  private failures: InterpreterFailure[] = [];

  on(pattern: RegExp, script: (c: ScriptContext) => Partial<LlmOutput>): this {
    this.rules.push({ pattern, script });
    return this;
  }

  failNext(...f: InterpreterFailure[]): void {
    this.failures.push(...f);
  }

  reset(): void {
    this.rules = [];
    this.failures = [];
    this.calls.length = 0;
  }

  interpret(request: InterpretRequest): Promise<InterpretResult> {
    const text = request.turn.customerText;
    this.calls.push(text);
    const usage = { model: 'scripted', latencyMs: 1, inputTokens: 10, outputTokens: 5, cacheReadTokens: 0, cacheWriteTokens: 0, costMicroUsd: 1 };
    const failure = this.failures.shift();
    if (failure) return Promise.resolve({ ok: false, failure, detail: 'scripted failure', usage: null });
    const { maps } = buildCatalogBlock(request.businessName, request.catalog);
    const byName = (list: Map<string, string>, names: Array<{ id: string; name: string }>) => (name: string) => {
      const entity = names.find((n) => n.name.toLowerCase() === name.toLowerCase());
      const code = entity ? [...list.entries()].find(([, id]) => id === entity.id)?.[0] : undefined;
      if (!code) throw new Error(`scripted interpreter: ${name} not in catalog`);
      return code;
    };
    const ctx: ScriptContext = {
      customerText: text,
      stateSummary: request.turn.stateSummary,
      serviceCode: byName(maps.services, request.catalog.services),
      staffCode: byName(maps.staff, request.catalog.staff),
    };
    const rule = this.rules.find((r) => r.pattern.test(text));
    const raw = LlmOutputSchema.parse({ ...BASE_OUTPUT, ...(rule ? rule.script(ctx) : {}) });
    const { interpretation, droppedCodes } = refineLlmOutput(raw, maps);
    return Promise.resolve({ ok: true, interpretation, usage, droppedCodes });
  }
}
