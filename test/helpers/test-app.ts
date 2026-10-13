import { createApp, type App } from '../../src/app.js';
import { loadConfig } from '../../src/config/env.js';
import { createSilentLogger, type AppLogger } from '../../src/observability/logger.js';
import type { MessageInterpreter } from '../../src/receptionist/llm/interpreter.js';
import type { Clock } from '../../src/shared/clock.js';

export const TEST_APP_SECRET = 'test-app-secret-0123456789abcdef';
export const TEST_VERIFY_TOKEN = 'test-verify-token-0123456789';
export const TEST_WA_TOKEN = 'test-whatsapp-token';

export interface TestAppOptions {
  databaseUrl: string;
  clock: Clock;
  graphUrl?: string;
  anthropicUrl?: string;
  interpreter?: MessageInterpreter;
  role?: 'all' | 'web' | 'worker';
  env?: Record<string, string>;
  logger?: AppLogger;
}

/** Builds the real application (same composition root as production) for tests. */
export async function createTestApp(o: TestAppOptions): Promise<App> {
  const env: Record<string, string> = {
    NODE_ENV: 'test',
    APP_ENV: 'test',
    ROLE: o.role ?? 'all',
    PORT: '0',
    HOST: '127.0.0.1',
    LOG_LEVEL: 'silent',
    DATABASE_URL: o.databaseUrl,
    DATABASE_POOL_MAX: '10',
    WHATSAPP_APP_SECRET: TEST_APP_SECRET,
    WHATSAPP_VERIFY_TOKEN: TEST_VERIFY_TOKEN,
    WHATSAPP_GRAPH_BASE_URL: o.graphUrl ?? 'http://127.0.0.1:9',
    WHATSAPP_GRAPH_API_VERSION: 'v23.0',
    WHATSAPP_HTTP_TIMEOUT_MS: '2000',
    ANTHROPIC_API_KEY: 'sk-ant-test-fake-key',
    LLM_BASE_URL: o.anthropicUrl ?? 'http://127.0.0.1:9',
    LLM_TIMEOUT_MS: '1500',
    LLM_MAX_RETRIES: '0',
    AUTOMATED_RECEPTIONIST_ENABLED: 'true',
    SAFE_MODE: 'false',
    OUTBOUND_MESSAGING_ENABLED: 'true',
    INBOUND_DEBOUNCE_MS: '0',
    WORKER_POLL_INTERVAL_MS: '50',
    WORKER_CONCURRENCY: '4',
    JOB_LEASE_SECONDS: '30',
    SHUTDOWN_TIMEOUT_MS: '5000',
    ...o.env,
  };
  const config = loadConfig(env);
  return createApp({
    config,
    clock: o.clock,
    logger: o.logger ?? createSilentLogger(),
    env: { WHATSAPP_ACCESS_TOKEN: TEST_WA_TOKEN },
    ...(o.interpreter ? { interpreter: o.interpreter } : {}),
  });
}
