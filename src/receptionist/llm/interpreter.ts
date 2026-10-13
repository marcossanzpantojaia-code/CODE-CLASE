import type { Catalog } from '../../catalog/catalog.repository.js';
import type { Interpretation } from '../interpretation.js';
import type { TurnContext } from './prompt.js';

export type InterpreterFailure =
  | 'CIRCUIT_OPEN'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'AUTH'
  | 'BAD_REQUEST'
  | 'REFUSAL'
  | 'INVALID_OUTPUT'
  | 'NOT_CONFIGURED';

export interface LlmUsage {
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costMicroUsd: number;
}

export type InterpretResult =
  | { ok: true; interpretation: Interpretation; usage: LlmUsage; droppedCodes: string[] }
  | { ok: false; failure: InterpreterFailure; detail: string; usage: LlmUsage | null };

export interface InterpretRequest {
  businessName: string;
  catalog: Catalog;
  turn: TurnContext;
}

/** The only capability the model has: turn text into a validated Interpretation. */
export interface MessageInterpreter {
  readonly provider: string;
  interpret(request: InterpretRequest): Promise<InterpretResult>;
}
