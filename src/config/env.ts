import { z } from 'zod';

/**
 * Runtime configuration, validated once at startup. Secrets are only ever read
 * from the environment (or a secret manager that injects env vars); nothing
 * sensitive has a default value in code.
 */

const bool = (defaultValue: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? defaultValue : v === 'true' || v === '1'));

const int = (defaultValue: number, min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).default(defaultValue);

const num = (defaultValue: number, min: number, max: number) =>
  z.coerce.number().min(min).max(max).default(defaultValue);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
    /** Free-form label used in logs and evidence reports (production, staging, ...). */
    APP_ENV: z.enum(['production', 'staging', 'development', 'test']).default('development'),
    ROLE: z.enum(['all', 'web', 'worker']).default('all'),
    HOST: z.string().default('0.0.0.0'),
    /** Number of reverse proxies in front of the app (TLS terminator / load balancer). */
    TRUST_PROXY: int(1, 0, 10),
    PORT: int(3000, 0, 65535),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    DATABASE_URL: z.string().min(1),
    DATABASE_POOL_MAX: int(10, 1, 100),
    DATABASE_SSL: z.enum(['disable', 'require', 'no-verify']).default('disable'),
    DATABASE_STATEMENT_TIMEOUT_MS: int(15_000, 1_000, 120_000),

    // --- WhatsApp Business Platform (Cloud API) ---
    WHATSAPP_APP_SECRET: z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().optional(),
    WHATSAPP_GRAPH_BASE_URL: z.url().default('https://graph.facebook.com'),
    WHATSAPP_GRAPH_API_VERSION: z
      .string()
      .regex(/^v\d+\.\d+$/)
      .default('v23.0'),
    WHATSAPP_HTTP_TIMEOUT_MS: int(10_000, 1_000, 60_000),
    WHATSAPP_WEBHOOK_MAX_BODY_BYTES: int(1_048_576, 10_000, 10_485_760),

    // --- LLM (Claude) ---
    ANTHROPIC_API_KEY: z.string().optional(),
    /** Explicit base URL so the app never silently inherits an unrelated ANTHROPIC_BASE_URL. */
    LLM_BASE_URL: z.url().default('https://api.anthropic.com'),
    LLM_MODEL: z.string().min(1).default('claude-opus-5-5'),
    LLM_EFFORT: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).default('low'),
    LLM_MAX_OUTPUT_TOKENS: int(4_096, 256, 32_000),
    LLM_TIMEOUT_MS: int(15_000, 1_000, 120_000),
    LLM_MAX_RETRIES: int(1, 0, 5),
    LLM_SERVER_FALLBACKS: bool(true),
    LLM_PRICE_INPUT_PER_MTOK: num(4, 0, 1_000),
    LLM_PRICE_OUTPUT_PER_MTOK: num(20, 0, 1_000),
    LLM_PRICE_CACHE_READ_PER_MTOK: num(0.2, 0, 1_000),
    LLM_PRICE_CACHE_WRITE_PER_MTOK: num(5, 0, 1_000),
    LLM_MAX_CALLS_PER_CONVERSATION_PER_DAY: int(60, 1, 10_000),
    LLM_HISTORY_MESSAGES: int(6, 0, 20),

    // --- Kill switches / feature flags (global; tenants have their own flags too) ---
    AUTOMATED_RECEPTIONIST_ENABLED: bool(false),
    SAFE_MODE: bool(false),
    OUTBOUND_MESSAGING_ENABLED: bool(true),

    // --- Receptionist behaviour ---
    CONVERSATION_STATE_TTL_MINUTES: int(30, 1, 24 * 60),
    INBOUND_DEBOUNCE_MS: int(1_500, 0, 30_000),
    REPLY_MAX_AGE_MINUTES: int(15, 1, 24 * 60),
    RUNAWAY_MAX_REPLIES_PER_10_MIN: int(12, 2, 1_000),
    AVAILABILITY_SEARCH_DAYS: int(14, 1, 60),

    // --- Worker ---
    WORKER_CONCURRENCY: int(4, 1, 64),
    WORKER_POLL_INTERVAL_MS: int(500, 50, 60_000),
    JOB_LEASE_SECONDS: int(120, 10, 3_600),
    SHUTDOWN_TIMEOUT_MS: int(25_000, 1_000, 300_000),

    // --- Observability ---
    METRICS_TOKEN: z.string().min(16).optional(),
  });

/** Requirements that only apply to the process serving webhooks / replying. */
const ServerEnvSchema = EnvSchema.superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' || env.APP_ENV === 'production' || env.APP_ENV === 'staging') {
      const required: Array<keyof typeof env> = ['WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN'];
      for (const key of required) {
        if (!env[key]) {
          ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when NODE_ENV=production or APP_ENV=production|staging` });
        }
      }
      if (env.AUTOMATED_RECEPTIONIST_ENABLED && !env.ANTHROPIC_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['ANTHROPIC_API_KEY'],
          message: 'ANTHROPIC_API_KEY is required when AUTOMATED_RECEPTIONIST_ENABLED=true',
        });
      }
    }
    if (env.WHATSAPP_APP_SECRET !== undefined && env.WHATSAPP_APP_SECRET.length < 16) {
      ctx.addIssue({ code: 'custom', path: ['WHATSAPP_APP_SECRET'], message: 'looks too short to be a Meta app secret' });
    }
    if (env.WHATSAPP_VERIFY_TOKEN !== undefined && env.WHATSAPP_VERIFY_TOKEN.length < 16) {
      ctx.addIssue({ code: 'custom', path: ['WHATSAPP_VERIFY_TOKEN'], message: 'must be at least 16 characters' });
    }
});

export type Env = z.infer<typeof EnvSchema>;

export interface AppConfig {
  nodeEnv: Env['NODE_ENV'];
  appEnv: Env['APP_ENV'];
  role: Env['ROLE'];
  http: { host: string; port: number; trustProxyHops: number };
  logLevel: Env['LOG_LEVEL'];
  database: { url: string; poolMax: number; ssl: Env['DATABASE_SSL']; statementTimeoutMs: number };
  whatsapp: {
    appSecret: string | undefined;
    verifyToken: string | undefined;
    graphBaseUrl: string;
    graphApiVersion: string;
    httpTimeoutMs: number;
    webhookMaxBodyBytes: number;
  };
  llm: {
    apiKey: string | undefined;
    baseUrl: string;
    model: string;
    effort: Env['LLM_EFFORT'];
    maxOutputTokens: number;
    timeoutMs: number;
    maxRetries: number;
    serverFallbacks: boolean;
    pricesPerMTok: { input: number; output: number; cacheRead: number; cacheWrite: number };
    maxCallsPerConversationPerDay: number;
    historyMessages: number;
  };
  flags: {
    automatedReceptionistEnabled: boolean;
    safeMode: boolean;
    outboundMessagingEnabled: boolean;
  };
  receptionist: {
    stateTtlMinutes: number;
    inboundDebounceMs: number;
    replyMaxAgeMinutes: number;
    runawayMaxRepliesPer10Min: number;
    availabilitySearchDays: number;
  };
  worker: { concurrency: number; pollIntervalMs: number; leaseSeconds: number; shutdownTimeoutMs: number };
  metricsToken: string | undefined;
}

export class ConfigError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid configuration:\n - ${issues.join('\n - ')}`);
    this.name = 'ConfigError';
  }
}

export interface LoadConfigOptions {
  /**
   * The HTTP server must never run without webhook secrets in production; the
   * operator CLI (migrations, tenant setup) does not serve webhooks.
   */
  forCli?: boolean;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env, options: LoadConfigOptions = {}): AppConfig {
  const parsed = (options.forCli ? EnvSchema : ServerEnvSchema).safeParse(source);
  if (!parsed.success) {
    // Never echo values: only variable names and the validation message.
    throw new ConfigError(parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`));
  }
  const e = parsed.data;
  return {
    nodeEnv: e.NODE_ENV,
    appEnv: e.APP_ENV,
    role: e.ROLE,
    http: { host: e.HOST, port: e.PORT, trustProxyHops: e.TRUST_PROXY },
    logLevel: e.LOG_LEVEL,
    database: {
      url: e.DATABASE_URL,
      poolMax: e.DATABASE_POOL_MAX,
      ssl: e.DATABASE_SSL,
      statementTimeoutMs: e.DATABASE_STATEMENT_TIMEOUT_MS,
    },
    whatsapp: {
      appSecret: e.WHATSAPP_APP_SECRET,
      verifyToken: e.WHATSAPP_VERIFY_TOKEN,
      graphBaseUrl: e.WHATSAPP_GRAPH_BASE_URL.replace(/\/+$/, ''),
      graphApiVersion: e.WHATSAPP_GRAPH_API_VERSION,
      httpTimeoutMs: e.WHATSAPP_HTTP_TIMEOUT_MS,
      webhookMaxBodyBytes: e.WHATSAPP_WEBHOOK_MAX_BODY_BYTES,
    },
    llm: {
      apiKey: e.ANTHROPIC_API_KEY,
      baseUrl: e.LLM_BASE_URL.replace(/\/+$/, ''),
      model: e.LLM_MODEL,
      effort: e.LLM_EFFORT,
      maxOutputTokens: e.LLM_MAX_OUTPUT_TOKENS,
      timeoutMs: e.LLM_TIMEOUT_MS,
      maxRetries: e.LLM_MAX_RETRIES,
      serverFallbacks: e.LLM_SERVER_FALLBACKS,
      pricesPerMTok: {
        input: e.LLM_PRICE_INPUT_PER_MTOK,
        output: e.LLM_PRICE_OUTPUT_PER_MTOK,
        cacheRead: e.LLM_PRICE_CACHE_READ_PER_MTOK,
        cacheWrite: e.LLM_PRICE_CACHE_WRITE_PER_MTOK,
      },
      maxCallsPerConversationPerDay: e.LLM_MAX_CALLS_PER_CONVERSATION_PER_DAY,
      historyMessages: e.LLM_HISTORY_MESSAGES,
    },
    flags: {
      automatedReceptionistEnabled: e.AUTOMATED_RECEPTIONIST_ENABLED,
      safeMode: e.SAFE_MODE,
      outboundMessagingEnabled: e.OUTBOUND_MESSAGING_ENABLED,
    },
    receptionist: {
      stateTtlMinutes: e.CONVERSATION_STATE_TTL_MINUTES,
      inboundDebounceMs: e.INBOUND_DEBOUNCE_MS,
      replyMaxAgeMinutes: e.REPLY_MAX_AGE_MINUTES,
      runawayMaxRepliesPer10Min: e.RUNAWAY_MAX_REPLIES_PER_10_MIN,
      availabilitySearchDays: e.AVAILABILITY_SEARCH_DAYS,
    },
    worker: {
      concurrency: e.WORKER_CONCURRENCY,
      pollIntervalMs: e.WORKER_POLL_INTERVAL_MS,
      leaseSeconds: e.JOB_LEASE_SECONDS,
      shutdownTimeoutMs: e.SHUTDOWN_TIMEOUT_MS,
    },
    metricsToken: e.METRICS_TOKEN,
  };
}
