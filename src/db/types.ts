import type { ColumnType, Generated, Insertable, Selectable } from 'kysely';

/**
 * Kysely table typings. They mirror src/db/migrations/*.sql — when a migration
 * changes a table, this file must change in the same commit.
 *
 * JSONB columns are written as JSON strings (see `json()` in database.ts) and
 * read back as parsed values.
 */

type Json<T> = ColumnType<T, string, string>;
type JsonDefault<T> = ColumnType<T, string | undefined, string>;
type Timestamp = ColumnType<Date, Date, Date>;
type NullableTimestamp = ColumnType<Date | null, Date | null | undefined, Date | null>;
type DefaultTimestamp = ColumnType<Date, Date | undefined, Date>;

export type PriceType = 'FIXED' | 'FROM' | 'ON_REQUEST';
export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type AppointmentSource = 'WHATSAPP' | 'STAFF' | 'API';
export type CustomerSource = 'WHATSAPP' | 'STAFF' | 'IMPORT';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus =
  | 'RECEIVED'
  | 'PROCESSED'
  | 'QUEUED'
  | 'SENDING'
  | 'ACCEPTED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'CANCELLED';
export type MessagePurpose = 'REPLY' | 'CONFIRMATION_REQUEST' | 'REMINDER' | 'HANDOFF_ACK' | 'MANUAL' | 'FALLBACK';
export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED';
export type TimeOffKind = 'CLOSURE' | 'HOLIDAY' | 'VACATION' | 'BREAK' | 'BLOCK';
export type CrmSource = 'WHATSAPP_RECEPTIONIST' | 'STAFF' | 'SYSTEM' | 'CUSTOMER';
export type CrmChannel = 'WHATSAPP' | 'ADMIN_API' | 'CLI';
export type IncidentSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type CancellationSource = 'CUSTOMER_WHATSAPP' | 'STAFF' | 'SYSTEM';

export interface BusinessesTable {
  id: Generated<string>;
  slug: string;
  name: string;
  timezone: Generated<string>;
  currency: Generated<string>;
  default_country_code: Generated<string>;
  address: string | null;
  maps_url: string | null;
  public_phone: string | null;
  slot_interval_minutes: Generated<number>;
  min_booking_notice_minutes: Generated<number>;
  max_booking_days_ahead: Generated<number>;
  automated_receptionist_enabled: Generated<boolean>;
  safe_mode: Generated<boolean>;
  reminders_enabled: Generated<boolean>;
  confirmation_request_minutes_before: Generated<number | null>;
  reminder_minutes_before: Generated<number | null>;
  handoff_auto_resume_hours: Generated<number | null>;
  created_at: DefaultTimestamp;
  updated_at: DefaultTimestamp;
}

export interface WhatsappChannelsTable {
  id: Generated<string>;
  business_id: string;
  phone_number_id: string;
  waba_id: string | null;
  display_phone_number: string | null;
  access_token_ref: Generated<string>;
  template_language: Generated<string>;
  confirmation_template_name: string | null;
  reminder_template_name: string | null;
  active: Generated<boolean>;
  created_at: DefaultTimestamp;
  updated_at: DefaultTimestamp;
}

export interface StaffTable {
  id: Generated<string>;
  business_id: string;
  name: string;
  active: Generated<boolean>;
  has_custom_hours: Generated<boolean>;
  created_at: DefaultTimestamp;
  updated_at: DefaultTimestamp;
}

export interface ServicesTable {
  id: Generated<string>;
  business_id: string;
  name: string;
  category: string | null;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: Generated<number>;
  price_type: Generated<PriceType>;
  price_cents: number | null;
  active: Generated<boolean>;
  bookable_online: Generated<boolean>;
  created_at: DefaultTimestamp;
  updated_at: DefaultTimestamp;
}

export interface StaffServicesTable {
  business_id: string;
  staff_id: string;
  service_id: string;
}

export interface BusinessHoursTable {
  id: Generated<string>;
  business_id: string;
  weekday: number;
  opens_at: string;
  closes_at: string;
}

export interface StaffHoursTable {
  id: Generated<string>;
  business_id: string;
  staff_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
}

export interface TimeOffTable {
  id: Generated<string>;
  business_id: string;
  staff_id: string | null;
  kind: TimeOffKind;
  starts_at: Timestamp;
  ends_at: Timestamp;
  note: string | null;
  created_at: DefaultTimestamp;
}

export interface CustomersTable {
  id: Generated<string>;
  business_id: string;
  phone_e164: string;
  name: string | null;
  name_source: 'CUSTOMER_STATED' | 'STAFF' | 'IMPORT' | null;
  whatsapp_profile_name: string | null;
  source: CustomerSource;
  first_contact_at: Timestamp;
  last_contact_at: Timestamp;
  notes: string | null;
  created_at: DefaultTimestamp;
  updated_at: DefaultTimestamp;
}

export interface ConversationsTable {
  id: Generated<string>;
  business_id: string;
  customer_id: string;
  channel: Generated<'WHATSAPP'>;
  whatsapp_channel_id: string | null;
  state: JsonDefault<unknown>;
  state_expires_at: NullableTimestamp;
  needs_human: Generated<boolean>;
  needs_human_reason: string | null;
  needs_human_since: NullableTimestamp;
  last_inbound_at: NullableTimestamp;
  last_outbound_at: NullableTimestamp;
  version: Generated<number>;
  created_at: DefaultTimestamp;
  updated_at: DefaultTimestamp;
}

export interface MessagesTable {
  id: Generated<string>;
  business_id: string;
  conversation_id: string;
  direction: MessageDirection;
  provider_message_id: string | null;
  content_type: string;
  text: string | null;
  payload: JsonDefault<Record<string, unknown>>;
  status: MessageStatus;
  provider_timestamp: NullableTimestamp;
  processed_at: NullableTimestamp;
  processing_outcome: string | null;
  idempotency_key: string | null;
  purpose: MessagePurpose | null;
  appointment_id: string | null;
  appointment_version: number | null;
  reply_to_message_id: string | null;
  expires_at: NullableTimestamp;
  attempts: Generated<number>;
  accepted_at: NullableTimestamp;
  sent_at: NullableTimestamp;
  delivered_at: NullableTimestamp;
  read_at: NullableTimestamp;
  failed_at: NullableTimestamp;
  provider_error: ColumnType<Record<string, unknown> | null, string | null | undefined, string | null>;
  created_at: Timestamp;
  updated_at: DefaultTimestamp;
}

export interface MessageStatusEventsTable {
  id: Generated<number>;
  business_id: string | null;
  provider_message_id: string;
  status: string;
  occurred_at: Timestamp;
  errors: ColumnType<unknown[] | null, string | null | undefined, string | null>;
  received_at: DefaultTimestamp;
}

export interface AppointmentsTable {
  id: Generated<string>;
  business_id: string;
  customer_id: string;
  staff_id: string;
  conversation_id: string | null;
  starts_at: Timestamp;
  ends_at: Timestamp;
  occupied_until: Timestamp;
  status: Generated<AppointmentStatus>;
  source: AppointmentSource;
  total_price_cents: number | null;
  price_is_estimate: Generated<boolean>;
  currency: string;
  version: Generated<number>;
  idempotency_key: string | null;
  confirmed_at: NullableTimestamp;
  cancelled_at: NullableTimestamp;
  cancellation_source: CancellationSource | null;
  cancellation_reason: string | null;
  created_at: Timestamp;
  updated_at: DefaultTimestamp;
}

export interface AppointmentServicesTable {
  appointment_id: string;
  business_id: string;
  position: number;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  buffer_minutes: Generated<number>;
  price_type: PriceType;
  price_cents: number | null;
}

export interface CrmEventsTable {
  id: Generated<string>;
  business_id: string;
  customer_id: string;
  type: string;
  occurred_at: Timestamp;
  source: CrmSource;
  channel: CrmChannel | null;
  conversation_id: string | null;
  appointment_id: string | null;
  message_id: string | null;
  data: JsonDefault<Record<string, unknown>>;
  dedupe_key: string | null;
  created_at: DefaultTimestamp;
}

export interface JobsTable {
  id: Generated<number>;
  business_id: string | null;
  type: string;
  payload: Json<Record<string, unknown>>;
  status: Generated<JobStatus>;
  run_at: Timestamp;
  attempts: Generated<number>;
  max_attempts: Generated<number>;
  concurrency_key: string | null;
  dedupe_key: string | null;
  group_key: string | null;
  locked_by: string | null;
  locked_until: NullableTimestamp;
  last_error: string | null;
  outcome: string | null;
  created_at: DefaultTimestamp;
  updated_at: DefaultTimestamp;
  finished_at: NullableTimestamp;
}

export interface LlmCallsTable {
  id: Generated<number>;
  business_id: string;
  conversation_id: string | null;
  provider: string;
  model: string;
  outcome: string;
  latency_ms: number;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_read_tokens: number | null;
  cache_write_tokens: number | null;
  cost_micro_usd: number | null;
  error: string | null;
  created_at: Timestamp;
}

export interface IncidentsTable {
  id: Generated<string>;
  business_id: string | null;
  conversation_id: string | null;
  kind: string;
  severity: IncidentSeverity;
  details: JsonDefault<Record<string, unknown>>;
  created_at: Timestamp;
  resolved_at: NullableTimestamp;
}

export interface ApiKeysTable {
  id: Generated<string>;
  business_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  created_at: DefaultTimestamp;
  last_used_at: NullableTimestamp;
  revoked_at: NullableTimestamp;
}

export interface SchemaMigrationsTable {
  version: string;
  checksum: string;
  applied_at: DefaultTimestamp;
}

export interface Database {
  businesses: BusinessesTable;
  whatsapp_channels: WhatsappChannelsTable;
  staff: StaffTable;
  services: ServicesTable;
  staff_services: StaffServicesTable;
  business_hours: BusinessHoursTable;
  staff_hours: StaffHoursTable;
  time_off: TimeOffTable;
  customers: CustomersTable;
  conversations: ConversationsTable;
  messages: MessagesTable;
  message_status_events: MessageStatusEventsTable;
  appointments: AppointmentsTable;
  appointment_services: AppointmentServicesTable;
  crm_events: CrmEventsTable;
  jobs: JobsTable;
  llm_calls: LlmCallsTable;
  incidents: IncidentsTable;
  api_keys: ApiKeysTable;
  schema_migrations: SchemaMigrationsTable;
}

export type Business = Selectable<BusinessesTable>;
export type WhatsappChannel = Selectable<WhatsappChannelsTable>;
export type Staff = Selectable<StaffTable>;
export type Service = Selectable<ServicesTable>;
export type Customer = Selectable<CustomersTable>;
export type Conversation = Selectable<ConversationsTable>;
export type Message = Selectable<MessagesTable>;
export type Appointment = Selectable<AppointmentsTable>;
export type AppointmentServiceLine = Selectable<AppointmentServicesTable>;
export type CrmEvent = Selectable<CrmEventsTable>;
export type Job = Selectable<JobsTable>;
export type NewJob = Insertable<JobsTable>;
export type TimeOff = Selectable<TimeOffTable>;
