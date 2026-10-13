import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { sql } from 'kysely';
import { createApiKey, revokeApiKey } from '../admin/api-keys.js';
import { loadConfig, type AppConfig } from '../config/env.js';
import { createDatabase, type DB } from '../db/database.js';
import { migrate, pendingMigrations } from '../db/migrator.js';
import { purgeFinishedJobs, queueDepth } from '../jobs/queue.js';
import { resolveSecretRef, WhatsAppCloudClient } from '../messaging/whatsapp/cloud-api.js';
import { errorMessage } from '../shared/errors.js';
import { maskPhone, normalizePhone } from '../shared/phone.js';
import { applyTenantConfig, TenantConfigSchema } from '../tenancy/tenant-config.js';
import { runLlmEval } from './llm-eval.js';
import { getActiveChannelForBusiness, getBusinessBySlug, updateBusinessFlags } from '../tenancy/tenants.repository.js';

/**
 * Operator CLI. Every command is idempotent or explicitly destructive-scoped,
 * prints JSON, and never prints secrets.
 *
 *   migrate
 *   tenant:apply   --file tenant.json
 *   tenant:flags   --tenant <slug> [--receptionist on|off] [--safe-mode on|off] [--reminders on|off]
 *   apikey:create  --tenant <slug> --name <label>
 *   apikey:revoke  --prefix <prefix>
 *   whatsapp:check --tenant <slug>
 *   jobs:stats
 *   jobs:requeue-failed --type outbound.send [--tenant <slug>] [--since <ISO>]
 *   evidence       --tenant <slug> --phone <E.164> [--since <ISO>]
 *   maintenance:purge [--days 30] [--text-days 180]
 *   llm:eval       --tenant <slug> --file config/llm-eval-cases.json --confirm-cost
 */

const CLI_OPTIONS = {
  file: { type: 'string' },
  tenant: { type: 'string' },
  name: { type: 'string' },
  prefix: { type: 'string' },
  receptionist: { type: 'string' },
  'safe-mode': { type: 'string' },
  reminders: { type: 'string' },
  type: { type: 'string' },
  since: { type: 'string' },
  phone: { type: 'string' },
  days: { type: 'string' },
  'text-days': { type: 'string' },
  'confirm-cost': { type: 'boolean' },
} as const;

type CliValues = { [K in keyof typeof CLI_OPTIONS]?: (typeof CLI_OPTIONS)[K]['type'] extends 'boolean' ? boolean : string };

const out = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
};
function fail(message: string): never {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}
const onOff = (v: string | undefined, flag: string): boolean | undefined => {
  if (v === undefined) return undefined;
  if (v === 'on' || v === 'true') return true;
  if (v === 'off' || v === 'false') return false;
  return fail(`--${flag} must be on|off`);
};

async function requireTenant(db: DB, slug: string | undefined) {
  if (!slug) fail('--tenant <slug> is required');
  const business = await getBusinessBySlug(db, slug);
  if (!business) fail(`tenant ${slug} not found`);
  return business;
}

async function run(command: string, values: CliValues, config: AppConfig, db: DB): Promise<void> {
  switch (command) {
    case 'migrate': {
      const res = await migrate(db);
      return out({ applied: res.applied, pending: await pendingMigrations(db) });
    }
    case 'tenant:apply': {
      if (!values.file) fail('--file is required');
      const raw = JSON.parse(await readFile(values.file, 'utf8')) as unknown;
      const parsed = TenantConfigSchema.safeParse(raw);
      if (!parsed.success) fail(`invalid tenant file:\n${parsed.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n')}`);
      const res = await applyTenantConfig(db, raw as Parameters<typeof applyTenantConfig>[1]);
      return out({ ...res, note: res.created ? 'tenant created with the receptionist DISABLED; enable it with tenant:flags --receptionist on' : 'tenant updated' });
    }
    case 'tenant:flags': {
      const business = await requireTenant(db, values.tenant);
      const updated = await updateBusinessFlags(db, business.id, {
        ...(onOff(values.receptionist, 'receptionist') !== undefined && { automatedReceptionistEnabled: onOff(values.receptionist, 'receptionist') }),
        ...(onOff(values['safe-mode'], 'safe-mode') !== undefined && { safeMode: onOff(values['safe-mode'], 'safe-mode') }),
        ...(onOff(values.reminders, 'reminders') !== undefined && { remindersEnabled: onOff(values.reminders, 'reminders') }),
      });
      return out({
        tenant: updated?.slug,
        automatedReceptionistEnabled: updated?.automated_receptionist_enabled,
        safeMode: updated?.safe_mode,
        remindersEnabled: updated?.reminders_enabled,
        globalKillSwitches: config.flags,
      });
    }
    case 'apikey:create': {
      const business = await requireTenant(db, values.tenant);
      if (!values.name) fail('--name is required');
      const key = await createApiKey(db, business.id, values.name);
      process.stderr.write('Store this key in your secret manager now: it will never be shown again.\n');
      return out({ tenant: business.slug, prefix: key.prefix, key: key.key });
    }
    case 'apikey:revoke': {
      if (!values.prefix) fail('--prefix is required');
      return out({ revoked: await revokeApiKey(db, values.prefix, new Date()) });
    }
    case 'whatsapp:check': {
      const business = await requireTenant(db, values.tenant);
      const channel = await getActiveChannelForBusiness(db, business.id);
      if (!channel) fail('tenant has no active WhatsApp channel');
      const token = resolveSecretRef(channel.access_token_ref);
      if (!token) fail(`secret ${channel.access_token_ref} is not available in this environment`);
      const client = new WhatsAppCloudClient({ baseUrl: config.whatsapp.graphBaseUrl, apiVersion: config.whatsapp.graphApiVersion, timeoutMs: config.whatsapp.httpTimeoutMs });
      try {
        const info = await client.getPhoneNumber(channel.phone_number_id, token);
        return out({ ok: true, phoneNumberId: channel.phone_number_id, ...info, templates: { confirmation: channel.confirmation_template_name, reminder: channel.reminder_template_name } });
      } catch (err) {
        return out({ ok: false, phoneNumberId: channel.phone_number_id, error: errorMessage(err) });
      }
    }
    case 'jobs:stats': {
      const byType = await db
        .selectFrom('jobs')
        .select(['type', 'status', (eb) => eb.fn.countAll<number>().as('n')])
        .groupBy(['type', 'status'])
        .orderBy('type')
        .execute();
      return out({ depth: await queueDepth(db), byType });
    }
    case 'jobs:requeue-failed': {
      // After fixing the cause (e.g. rotated access token), give failed sends another chance.
      // Conversational replies older than their expiry are NOT revived (they would be stale).
      const type = values.type ?? 'outbound.send';
      const since = values.since ? new Date(values.since) : new Date(Date.now() - 24 * 3_600_000);
      let q = db.selectFrom('jobs').select(['id', 'payload', 'business_id']).where('type', '=', type).where('status', '=', 'FAILED').where('updated_at', '>=', since);
      if (values.tenant) q = q.where('business_id', '=', (await requireTenant(db, values.tenant)).id);
      const failed = await q.execute();
      let requeued = 0;
      for (const job of failed) {
        if (type === 'outbound.send' && typeof job.payload.messageId === 'string') {
          const msg = await db.selectFrom('messages').select(['status', 'expires_at']).where('id', '=', job.payload.messageId).executeTakeFirst();
          if (!msg || msg.status !== 'FAILED' || (msg.expires_at && msg.expires_at < new Date())) continue;
          await db.updateTable('messages').set({ status: 'QUEUED' }).where('id', '=', job.payload.messageId).execute();
        }
        await db
          .updateTable('jobs')
          .set({ status: 'PENDING', attempts: 0, run_at: new Date(), finished_at: null, last_error: 'requeued by operator', outcome: null })
          .where('id', '=', job.id)
          .execute();
        requeued++;
      }
      return out({ candidates: failed.length, requeued });
    }
    case 'evidence':
      return out(await evidence(db, config, values));
    case 'llm:eval': {
      // Each case is a paid API call to the real model: require explicit consent.
      if (values['confirm-cost'] === undefined) fail('llm:eval calls the real LLM (costs money): re-run with --confirm-cost');
      const business = await requireTenant(db, values.tenant);
      return out(await runLlmEval(db, config, business, values.file ?? 'config/llm-eval-cases.json'));
    }
    case 'maintenance:purge': {
      const days = Number(values.days ?? '30');
      if (!Number.isInteger(days) || days < 7) fail('--days must be an integer >= 7');
      const cutoff = new Date(Date.now() - days * 24 * 3_600_000);
      const jobs = await purgeFinishedJobs(db, cutoff);
      const statuses = await db.deleteFrom('message_status_events').where('received_at', '<', cutoff).executeTakeFirst();
      // PII minimisation: message bodies older than --text-days are erased; metadata
      // (ids, statuses, timestamps) stays for audit and statistics.
      const textDays = Number(values['text-days'] ?? '180');
      if (!Number.isInteger(textDays) || textDays < 7) fail('--text-days must be an integer >= 7');
      const textCutoff = new Date(Date.now() - textDays * 24 * 3_600_000);
      const texts = await db
        .updateTable('messages')
        .set({ text: null, payload: '{}' })
        .where('created_at', '<', textCutoff)
        .where((eb) => eb.or([eb('text', 'is not', null), sql<boolean>`payload <> '{}'::jsonb`]))
        .executeTakeFirst();
      return out({
        cutoff: cutoff.toISOString(),
        jobsDeleted: jobs,
        statusEventsDeleted: Number(statuses.numDeletedRows),
        textCutoff: textCutoff.toISOString(),
        messageBodiesErased: Number(texts.numUpdatedRows),
      });
    }
    default:
      fail(`unknown command "${command}". See src/cli/index.ts header for usage.`);
  }
}

/**
 * Redacted, machine-readable evidence of one customer's end-to-end flow:
 * webhook -> message ids -> conversation -> CRM -> appointment -> jobs ->
 * delivery statuses. Used for staging/production verification. No message
 * text, no full phone number, no secrets.
 */
async function evidence(db: DB, config: AppConfig, values: CliValues) {
  const business = await requireTenant(db, values.tenant);
  const phone = normalizePhone(values.phone ?? '', { defaultCountryCode: business.default_country_code });
  if (!phone) fail('--phone must be a valid phone number');
  const since = values.since ? new Date(values.since) : new Date(Date.now() - 24 * 3_600_000);
  const customer = await db.selectFrom('customers').selectAll().where('business_id', '=', business.id).where('phone_e164', '=', phone).executeTakeFirst();
  if (!customer) return { environment: config.appEnv, tenant: business.slug, found: false, phone: maskPhone(phone) };
  const conversation = await db.selectFrom('conversations').selectAll().where('business_id', '=', business.id).where('customer_id', '=', customer.id).executeTakeFirst();
  const messages = conversation
    ? await db
        .selectFrom('messages')
        .select(['id', 'direction', 'provider_message_id', 'content_type', 'purpose', 'status', 'processing_outcome', 'created_at', 'accepted_at', 'sent_at', 'delivered_at', 'read_at', 'failed_at', 'provider_error', 'attempts'])
        .where('conversation_id', '=', conversation.id)
        .where('created_at', '>=', since)
        .orderBy('created_at')
        .execute()
    : [];
  const appointments = await db
    .selectFrom('appointments as a')
    .innerJoin('staff as s', 's.id', 'a.staff_id')
    .select(['a.id', 'a.status', 'a.source', 'a.starts_at', 'a.ends_at', 'a.version', 'a.created_at', 'a.confirmed_at', 'a.cancelled_at', 's.name as staff'])
    .where('a.business_id', '=', business.id)
    .where('a.customer_id', '=', customer.id)
    .where('a.created_at', '>=', since)
    .orderBy('a.created_at')
    .execute();
  const lines = appointments.length
    ? await db.selectFrom('appointment_services').select(['appointment_id', 'service_name', 'price_cents']).where('appointment_id', 'in', appointments.map((a) => a.id)).execute()
    : [];
  const crm = await db
    .selectFrom('crm_events')
    .select(['type', 'occurred_at', 'appointment_id', 'message_id', 'source'])
    .where('business_id', '=', business.id)
    .where('customer_id', '=', customer.id)
    .where('occurred_at', '>=', since)
    .orderBy('occurred_at')
    .execute();
  const jobs = appointments.length
    ? await db
        .selectFrom('jobs')
        .select(['type', 'status', 'run_at', 'outcome', 'payload', 'finished_at'])
        .where('group_key', 'in', appointments.map((a) => `appt:${a.id}`))
        .orderBy('run_at')
        .execute()
    : [];
  const llm = conversation
    ? await db
        .selectFrom('llm_calls')
        .select(['model', 'outcome', 'latency_ms', 'input_tokens', 'output_tokens', 'cache_read_tokens', 'cost_micro_usd', 'created_at'])
        .where('conversation_id', '=', conversation.id)
        .where('created_at', '>=', since)
        .orderBy('created_at')
        .execute()
    : [];
  const dbInfo = await sql<{ now: Date; database: string }>`SELECT now() AS now, current_database() AS database`.execute(db);
  return {
    generatedAt: new Date().toISOString(),
    environment: config.appEnv,
    database: { name: dbInfo.rows[0]?.database, serverTime: dbInfo.rows[0]?.now },
    tenant: { slug: business.slug, businessIdPrefix: business.id.slice(0, 8), receptionistEnabled: business.automated_receptionist_enabled, safeMode: business.safe_mode },
    customer: { id: customer.id, phone: maskPhone(customer.phone_e164), source: customer.source, hasName: customer.name !== null, createdAt: customer.created_at },
    conversation: conversation ? { id: conversation.id, needsHuman: conversation.needs_human, needsHumanReason: conversation.needs_human_reason, lastInboundAt: conversation.last_inbound_at } : null,
    messages: messages.map((m) => ({ ...m, provider_error: m.provider_error ? '[present]' : null })),
    appointments: appointments.map((a) => ({ ...a, services: lines.filter((l) => l.appointment_id === a.id).map((l) => ({ name: l.service_name, priceCents: l.price_cents })) })),
    crmEvents: crm,
    notificationJobs: jobs.map((j) => ({ type: j.type, status: j.status, kind: j.payload.kind, version: j.payload.version, runAt: j.run_at, outcome: j.outcome, finishedAt: j.finished_at })),
    llmCalls: llm,
  };
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) fail('usage: cli <command> [options] (see src/cli/index.ts)');
  const { values } = parseArgs({ args: rest, options: CLI_OPTIONS, strict: true });
  let config: AppConfig;
  try {
    config = loadConfig(process.env, { forCli: true });
  } catch (err) {
    return fail(errorMessage(err));
  }
  const handle = createDatabase({ url: config.database.url, poolMax: 2, ssl: config.database.ssl, statementTimeoutMs: 60_000, applicationName: 'salon-receptionist-cli' });
  try {
    await run(command, values, config, handle.db);
  } catch (err) {
    process.stderr.write(`error: ${errorMessage(err)}\n`);
    process.exitCode = 1;
  } finally {
    await handle.close();
  }
}

void main();
