-- 0001_initial.sql
-- Core schema for the WhatsApp receptionist.
--
-- Design notes
--  * Every tenant-owned table carries business_id. Child tables reference their
--    parents through composite (business_id, id) foreign keys, so the database
--    itself rejects rows that mix tenants (e.g. an appointment of business A
--    pointing at a customer of business B).
--  * Double booking is impossible at the storage level: an exclusion constraint
--    forbids overlapping active appointments for the same staff member.
--  * Idempotency is enforced with unique indexes (WhatsApp message ids,
--    outbound idempotency keys, job dedupe keys, CRM event dedupe keys).

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  currency char(3) NOT NULL DEFAULT 'EUR',
  default_country_code text NOT NULL DEFAULT '34' CHECK (default_country_code ~ '^[1-9][0-9]{0,2}$'),
  address text CHECK (address IS NULL OR length(address) <= 300),
  maps_url text CHECK (maps_url IS NULL OR maps_url ~ '^https://'),
  public_phone text,
  slot_interval_minutes integer NOT NULL DEFAULT 15 CHECK (slot_interval_minutes BETWEEN 5 AND 120),
  min_booking_notice_minutes integer NOT NULL DEFAULT 60 CHECK (min_booking_notice_minutes BETWEEN 0 AND 10080),
  max_booking_days_ahead integer NOT NULL DEFAULT 60 CHECK (max_booking_days_ahead BETWEEN 1 AND 365),
  -- Feature flags (per tenant). The receptionist is OFF until explicitly enabled.
  automated_receptionist_enabled boolean NOT NULL DEFAULT false,
  safe_mode boolean NOT NULL DEFAULT false,
  reminders_enabled boolean NOT NULL DEFAULT true,
  -- NULL disables the corresponding notification.
  confirmation_request_minutes_before integer DEFAULT 1440 CHECK (confirmation_request_minutes_before IS NULL OR confirmation_request_minutes_before BETWEEN 60 AND 10080),
  reminder_minutes_before integer DEFAULT 120 CHECK (reminder_minutes_before IS NULL OR reminder_minutes_before BETWEEN 15 AND 2880),
  -- NULL = a human must explicitly hand the conversation back to the bot.
  handoff_auto_resume_hours integer DEFAULT 24 CHECK (handoff_auto_resume_hours IS NULL OR handoff_auto_resume_hours BETWEEN 1 AND 720),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- One WhatsApp Business phone number (Cloud API) per row. phone_number_id is
-- what Meta puts in webhook metadata, so it is the tenant resolution key.
CREATE TABLE whatsapp_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  phone_number_id text NOT NULL UNIQUE CHECK (phone_number_id ~ '^[0-9]{5,30}$'),
  waba_id text CHECK (waba_id IS NULL OR waba_id ~ '^[0-9]{5,30}$'),
  display_phone_number text,
  -- Secrets never live in the database: this is a reference resolved at runtime.
  access_token_ref text NOT NULL DEFAULT 'env:WHATSAPP_ACCESS_TOKEN' CHECK (access_token_ref ~ '^env:WHATSAPP_ACCESS_TOKEN(_[A-Z0-9_]{1,80})?$'),
  template_language text NOT NULL DEFAULT 'es' CHECK (template_language ~ '^[a-z]{2}(_[A-Z]{2})?$'),
  confirmation_template_name text CHECK (confirmation_template_name IS NULL OR (confirmation_template_name ~ '^[a-z0-9_]+$' AND length(confirmation_template_name) <= 512)),
  reminder_template_name text CHECK (reminder_template_name IS NULL OR (reminder_template_name ~ '^[a-z0-9_]+$' AND length(reminder_template_name) <= 512)),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, id)
);
CREATE UNIQUE INDEX whatsapp_channels_one_active_per_business ON whatsapp_channels (business_id) WHERE active;
CREATE TRIGGER whatsapp_channels_updated_at BEFORE UPDATE ON whatsapp_channels FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalog: staff, services, schedules
-- ---------------------------------------------------------------------------
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  active boolean NOT NULL DEFAULT true,
  -- false: works whenever the business is open; true: uses staff_hours.
  has_custom_hours boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, id)
);
CREATE UNIQUE INDEX staff_business_name_uq ON staff (business_id, lower(name));
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  category text CHECK (category IS NULL OR length(category) <= 60),
  description text CHECK (description IS NULL OR length(description) <= 300),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 600),
  buffer_minutes integer NOT NULL DEFAULT 0 CHECK (buffer_minutes BETWEEN 0 AND 120),
  price_type text NOT NULL DEFAULT 'FIXED' CHECK (price_type IN ('FIXED', 'FROM', 'ON_REQUEST')),
  price_cents integer CHECK (price_cents IS NULL OR price_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  -- Services that need an in-person consultation can be excluded from self-booking.
  bookable_online boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, id),
  CHECK (price_type = 'ON_REQUEST' OR price_cents IS NOT NULL)
);
CREATE UNIQUE INDEX services_business_name_uq ON services (business_id, lower(name));
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE staff_services (
  business_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  service_id uuid NOT NULL,
  PRIMARY KEY (staff_id, service_id),
  FOREIGN KEY (business_id, staff_id) REFERENCES staff (business_id, id) ON DELETE CASCADE,
  FOREIGN KEY (business_id, service_id) REFERENCES services (business_id, id) ON DELETE CASCADE
);
CREATE INDEX staff_services_by_service ON staff_services (business_id, service_id);

-- Weekly opening hours. Several rows per weekday model split shifts
-- (e.g. 10:00-14:00 and 16:00-20:00); a weekday without rows is closed.
CREATE TABLE business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  opens_at time NOT NULL,
  closes_at time NOT NULL,
  CHECK (closes_at > opens_at)
);
CREATE INDEX business_hours_lookup ON business_hours (business_id, weekday);

CREATE TABLE staff_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  starts_at time NOT NULL,
  ends_at time NOT NULL,
  CHECK (ends_at > starts_at),
  FOREIGN KEY (business_id, staff_id) REFERENCES staff (business_id, id) ON DELETE CASCADE
);
CREATE INDEX staff_hours_lookup ON staff_hours (business_id, staff_id, weekday);

-- Closures, public holidays, vacations, one-off breaks and manual blocks.
-- staff_id NULL means the whole business is unavailable.
CREATE TABLE time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  staff_id uuid,
  kind text NOT NULL CHECK (kind IN ('CLOSURE', 'HOLIDAY', 'VACATION', 'BREAK', 'BLOCK')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  note text CHECK (note IS NULL OR length(note) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  FOREIGN KEY (business_id, staff_id) REFERENCES staff (business_id, id) ON DELETE CASCADE
);
CREATE INDEX time_off_range ON time_off USING gist (business_id, tstzrange(starts_at, ends_at, '[)'));

-- ---------------------------------------------------------------------------
-- CRM
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  name text CHECK (name IS NULL OR length(name) BETWEEN 1 AND 80),
  name_source text CHECK (name_source IS NULL OR name_source IN ('CUSTOMER_STATED', 'STAFF', 'IMPORT')),
  whatsapp_profile_name text CHECK (whatsapp_profile_name IS NULL OR length(whatsapp_profile_name) <= 120),
  source text NOT NULL CHECK (source IN ('WHATSAPP', 'STAFF', 'IMPORT')),
  first_contact_at timestamptz NOT NULL,
  last_contact_at timestamptz NOT NULL,
  notes text CHECK (notes IS NULL OR length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- A normalised phone number identifies exactly one customer per tenant.
  UNIQUE (business_id, phone_e164),
  UNIQUE (business_id, id)
);
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Conversations & messages
-- ---------------------------------------------------------------------------
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'WHATSAPP' CHECK (channel IN ('WHATSAPP')),
  whatsapp_channel_id uuid,
  state jsonb NOT NULL DEFAULT '{"kind":"IDLE"}'::jsonb,
  state_expires_at timestamptz,
  needs_human boolean NOT NULL DEFAULT false,
  needs_human_reason text,
  needs_human_since timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, customer_id, channel),
  UNIQUE (business_id, id),
  FOREIGN KEY (business_id, customer_id) REFERENCES customers (business_id, id) ON DELETE CASCADE,
  FOREIGN KEY (business_id, whatsapp_channel_id) REFERENCES whatsapp_channels (business_id, id)
);
CREATE INDEX conversations_needs_human ON conversations (business_id, needs_human_since) WHERE needs_human;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  -- WhatsApp message id (wamid). Unique: the same inbound message is stored once
  -- no matter how many times Meta delivers the webhook.
  provider_message_id text,
  content_type text NOT NULL CHECK (length(content_type) <= 40),
  text text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN (
    'RECEIVED', 'PROCESSED',
    'QUEUED', 'SENDING', 'ACCEPTED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED'
  )),
  -- inbound
  provider_timestamp timestamptz,
  processed_at timestamptz,
  processing_outcome text,
  -- outbound
  idempotency_key text,
  purpose text CHECK (purpose IS NULL OR purpose IN ('REPLY', 'CONFIRMATION_REQUEST', 'REMINDER', 'HANDOFF_ACK', 'MANUAL', 'FALLBACK')),
  appointment_id uuid,
  appointment_version integer,
  reply_to_message_id uuid,
  expires_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  accepted_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  provider_error jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (business_id, conversation_id) REFERENCES conversations (business_id, id) ON DELETE CASCADE,
  CHECK (direction = 'OUTBOUND' OR provider_message_id IS NOT NULL)
);
CREATE UNIQUE INDEX messages_provider_message_id_uq ON messages (provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE UNIQUE INDEX messages_idempotency_uq ON messages (business_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX messages_conversation_time ON messages (conversation_id, created_at);
CREATE INDEX messages_unprocessed_inbound ON messages (conversation_id, provider_timestamp) WHERE direction = 'INBOUND' AND processed_at IS NULL;
CREATE INDEX messages_appointment ON messages (appointment_id) WHERE appointment_id IS NOT NULL;
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Raw delivery-status callbacks (append-only, idempotent). Kept separately so a
-- status that arrives before we stored the wamid is not lost: it is re-applied
-- as soon as the send completes.
CREATE TABLE message_status_events (
  id bigserial PRIMARY KEY,
  business_id uuid,
  provider_message_id text NOT NULL,
  status text NOT NULL CHECK (length(status) <= 30),
  occurred_at timestamptz NOT NULL,
  errors jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_message_id, status)
);

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  conversation_id uuid,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  -- ends_at + service buffers: the time the chair is actually blocked.
  occupied_until timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
  source text NOT NULL CHECK (source IN ('WHATSAPP', 'STAFF', 'API')),
  total_price_cents integer CHECK (total_price_cents IS NULL OR total_price_cents >= 0),
  price_is_estimate boolean NOT NULL DEFAULT false,
  currency char(3) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  idempotency_key text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_source text CHECK (cancellation_source IS NULL OR cancellation_source IN ('CUSTOMER_WHATSAPP', 'STAFF', 'SYSTEM')),
  cancellation_reason text CHECK (cancellation_reason IS NULL OR length(cancellation_reason) <= 300),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (occupied_until >= ends_at),
  FOREIGN KEY (business_id, customer_id) REFERENCES customers (business_id, id) ON DELETE CASCADE,
  FOREIGN KEY (business_id, staff_id) REFERENCES staff (business_id, id),
  FOREIGN KEY (business_id, conversation_id) REFERENCES conversations (business_id, id),
  -- The core guarantee: no two active appointments of the same staff member
  -- overlap, regardless of how many requests race for the same slot.
  CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(starts_at, occupied_until, '[)') WITH &&
  ) WHERE (status IN ('BOOKED', 'CONFIRMED'))
);
CREATE UNIQUE INDEX appointments_idempotency_uq ON appointments (business_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX appointments_customer_time ON appointments (business_id, customer_id, starts_at);
CREATE INDEX appointments_staff_time ON appointments (business_id, staff_id, starts_at);
CREATE INDEX appointments_business_time ON appointments (business_id, starts_at);
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Line items with a snapshot of name/duration/price at booking time, so later
-- catalog edits never rewrite history.
CREATE TABLE appointment_services (
  appointment_id uuid NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  business_id uuid NOT NULL,
  position smallint NOT NULL CHECK (position >= 0),
  service_id uuid NOT NULL,
  service_name text NOT NULL,
  duration_minutes integer NOT NULL,
  buffer_minutes integer NOT NULL DEFAULT 0,
  price_type text NOT NULL CHECK (price_type IN ('FIXED', 'FROM', 'ON_REQUEST')),
  price_cents integer,
  PRIMARY KEY (appointment_id, position),
  FOREIGN KEY (business_id, service_id) REFERENCES services (business_id, id)
);

-- ---------------------------------------------------------------------------
-- CRM timeline
-- ---------------------------------------------------------------------------
CREATE TABLE crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  type text NOT NULL CHECK (type ~ '^[A-Z][A-Z_]{2,60}$'),
  occurred_at timestamptz NOT NULL,
  source text NOT NULL CHECK (source IN ('WHATSAPP_RECEPTIONIST', 'STAFF', 'SYSTEM', 'CUSTOMER')),
  channel text CHECK (channel IS NULL OR channel IN ('WHATSAPP', 'ADMIN_API', 'CLI')),
  conversation_id uuid,
  appointment_id uuid,
  message_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (business_id, customer_id) REFERENCES customers (business_id, id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX crm_events_dedupe_uq ON crm_events (business_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX crm_events_customer_time ON crm_events (business_id, customer_id, occurred_at DESC);
CREATE INDEX crm_events_type_time ON crm_events (business_id, type, occurred_at);

-- ---------------------------------------------------------------------------
-- Jobs (durable queue + transactional outbox + scheduler)
-- ---------------------------------------------------------------------------
CREATE TABLE jobs (
  id bigserial PRIMARY KEY,
  business_id uuid,
  type text NOT NULL CHECK (length(type) <= 60),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED')),
  run_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 8 CHECK (max_attempts BETWEEN 1 AND 100),
  -- Jobs sharing a concurrency_key run one at a time, in id order (FIFO).
  concurrency_key text,
  dedupe_key text,
  group_key text,
  locked_by text,
  locked_until timestamptz,
  last_error text,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE UNIQUE INDEX jobs_dedupe_uq ON jobs (dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX jobs_ready ON jobs (run_at, id) WHERE status = 'PENDING';
CREATE INDEX jobs_running_lease ON jobs (locked_until) WHERE status = 'RUNNING';
CREATE INDEX jobs_concurrency ON jobs (concurrency_key, id) WHERE concurrency_key IS NOT NULL AND status IN ('PENDING', 'RUNNING');
CREATE INDEX jobs_group_pending ON jobs (group_key) WHERE group_key IS NOT NULL AND status = 'PENDING';
CREATE INDEX jobs_finished ON jobs (finished_at) WHERE status IN ('DONE', 'FAILED', 'CANCELLED');
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- LLM usage, incidents, admin API keys
-- ---------------------------------------------------------------------------
CREATE TABLE llm_calls (
  id bigserial PRIMARY KEY,
  business_id uuid NOT NULL,
  conversation_id uuid,
  provider text NOT NULL,
  model text NOT NULL,
  outcome text NOT NULL,
  latency_ms integer NOT NULL,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_write_tokens integer,
  cost_micro_usd bigint,
  error text,
  created_at timestamptz NOT NULL
);
CREATE INDEX llm_calls_business_time ON llm_calls (business_id, created_at);
CREATE INDEX llm_calls_conversation_time ON llm_calls (conversation_id, created_at);

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  conversation_id uuid,
  kind text NOT NULL CHECK (kind ~ '^[A-Z][A-Z_]{2,60}$'),
  severity text NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz
);
CREATE INDEX incidents_business_time ON incidents (business_id, created_at DESC);
CREATE INDEX incidents_open ON incidents (created_at) WHERE resolved_at IS NULL;

CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  key_prefix text NOT NULL UNIQUE CHECK (key_prefix ~ '^[a-z0-9]{8,32}$'),
  key_hash text NOT NULL CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX api_keys_business ON api_keys (business_id);
