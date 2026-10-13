import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const LATENCY_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 60];

/**
 * Prometheus metrics. p50/p95/p99 are obtained with histogram_quantile() over
 * the *_seconds histograms. Business KPIs per tenant (bookings generated
 * automatically, conversion) are also exposed via SQL in the admin stats
 * endpoint because Prometheus counters reset on restart.
 */
export class Metrics {
  readonly registry: Registry;

  readonly messagesReceived: Counter<'type'>;
  readonly messagesSent: Counter<'purpose' | 'content_type'>;
  readonly whatsappFailures: Counter<'reason'>;
  readonly duplicateWebhooks: Counter<'kind'>;
  readonly invalidWebhookSignatures: Counter;
  readonly statusUpdates: Counter<'status'>;
  readonly unknownChannelWebhooks: Counter;

  readonly intentDetected: Counter<'intent' | 'via'>;
  readonly intentDetectionSeconds: Histogram<'via'>;
  readonly availabilityQueries: Counter<'result'>;
  readonly availabilitySeconds: Histogram;
  readonly appointmentsCreated: Counter<'source'>;
  readonly appointmentsCancelled: Counter<'source'>;
  readonly appointmentsRescheduled: Counter<'source'>;
  readonly appointmentsConfirmed: Counter<'source'>;
  readonly bookingConflicts: Counter<'stage'>;
  readonly bookingIntents: Counter;
  readonly humanHandoffs: Counter<'reason'>;
  readonly replyLatencySeconds: Histogram;
  readonly turnProcessingSeconds: Histogram<'outcome'>;

  readonly llmRequests: Counter<'outcome'>;
  readonly llmFailures: Counter<'reason'>;
  readonly llmLatencySeconds: Histogram<'outcome'>;
  readonly llmTokens: Counter<'kind'>;
  readonly llmCostUsd: Counter;

  readonly jobsProcessed: Counter<'type' | 'outcome'>;
  readonly jobDurationSeconds: Histogram<'type'>;
  readonly jobQueueDepth: Gauge<'status'>;
  readonly circuitState: Gauge<'name'>;
  readonly incidents: Counter<'kind' | 'severity'>;

  constructor(options: { collectDefault?: boolean } = {}) {
    this.registry = new Registry();
    const r = [this.registry];
    if (options.collectDefault) collectDefaultMetrics({ register: this.registry });

    this.messagesReceived = new Counter({ name: 'messages_received_total', help: 'Inbound WhatsApp messages stored (deduplicated)', labelNames: ['type'], registers: r });
    this.messagesSent = new Counter({ name: 'messages_sent_total', help: 'Outbound WhatsApp messages accepted by the provider', labelNames: ['purpose', 'content_type'], registers: r });
    this.whatsappFailures = new Counter({ name: 'whatsapp_failures_total', help: 'WhatsApp send failures by classified reason', labelNames: ['reason'], registers: r });
    this.duplicateWebhooks = new Counter({ name: 'duplicate_webhooks_total', help: 'Webhook items ignored because they were already processed', labelNames: ['kind'], registers: r });
    this.invalidWebhookSignatures = new Counter({ name: 'webhook_invalid_signature_total', help: 'Webhook POSTs rejected for missing/invalid X-Hub-Signature-256', registers: r });
    this.statusUpdates = new Counter({ name: 'whatsapp_status_updates_total', help: 'Delivery status callbacks received', labelNames: ['status'], registers: r });
    this.unknownChannelWebhooks = new Counter({ name: 'webhook_unknown_channel_total', help: 'Webhook changes for a phone_number_id not mapped to any tenant', registers: r });

    this.intentDetected = new Counter({ name: 'intents_detected_total', help: 'Interpreted customer intents', labelNames: ['intent', 'via'], registers: r });
    this.intentDetectionSeconds = new Histogram({ name: 'intent_detection_latency_seconds', help: 'Time to interpret a customer turn', labelNames: ['via'], buckets: LATENCY_BUCKETS, registers: r });
    this.availabilityQueries = new Counter({ name: 'availability_queries_total', help: 'Availability computations', labelNames: ['result'], registers: r });
    this.availabilitySeconds = new Histogram({ name: 'availability_query_seconds', help: 'Availability computation latency', buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5], registers: r });
    this.appointmentsCreated = new Counter({ name: 'appointments_created_total', help: 'Appointments created (source=WHATSAPP are bookings generated automatically)', labelNames: ['source'], registers: r });
    this.appointmentsCancelled = new Counter({ name: 'appointments_cancelled_total', help: 'Appointments cancelled', labelNames: ['source'], registers: r });
    this.appointmentsRescheduled = new Counter({ name: 'appointments_rescheduled_total', help: 'Appointments rescheduled', labelNames: ['source'], registers: r });
    this.appointmentsConfirmed = new Counter({ name: 'appointments_confirmed_total', help: 'Appointments confirmed by the customer', labelNames: ['source'], registers: r });
    this.bookingConflicts = new Counter({ name: 'booking_conflicts_total', help: 'Booking attempts rejected because the slot was taken', labelNames: ['stage'], registers: r });
    this.bookingIntents = new Counter({ name: 'booking_intents_total', help: 'Turns with availability/booking intent (conversion denominator)', registers: r });
    this.humanHandoffs = new Counter({ name: 'human_handoff_total', help: 'Conversations handed off to a human', labelNames: ['reason'], registers: r });
    this.replyLatencySeconds = new Histogram({ name: 'reply_latency_seconds', help: 'Inbound message stored -> reply accepted by WhatsApp', buckets: LATENCY_BUCKETS, registers: r });
    this.turnProcessingSeconds = new Histogram({ name: 'turn_processing_seconds', help: 'Receptionist turn processing time', labelNames: ['outcome'], buckets: LATENCY_BUCKETS, registers: r });

    this.llmRequests = new Counter({ name: 'llm_requests_total', help: 'LLM interpretation calls', labelNames: ['outcome'], registers: r });
    this.llmFailures = new Counter({ name: 'llm_failures_total', help: 'LLM interpretation failures', labelNames: ['reason'], registers: r });
    this.llmLatencySeconds = new Histogram({ name: 'llm_latency_seconds', help: 'LLM call latency', labelNames: ['outcome'], buckets: LATENCY_BUCKETS, registers: r });
    this.llmTokens = new Counter({ name: 'llm_tokens_total', help: 'LLM tokens', labelNames: ['kind'], registers: r });
    this.llmCostUsd = new Counter({ name: 'llm_cost_usd_total', help: 'Estimated LLM cost in USD', registers: r });

    this.jobsProcessed = new Counter({ name: 'jobs_processed_total', help: 'Background jobs processed', labelNames: ['type', 'outcome'], registers: r });
    this.jobDurationSeconds = new Histogram({ name: 'job_duration_seconds', help: 'Background job duration', labelNames: ['type'], buckets: LATENCY_BUCKETS, registers: r });
    this.jobQueueDepth = new Gauge({ name: 'job_queue_depth', help: 'Jobs by status (sampled)', labelNames: ['status'], registers: r });
    this.circuitState = new Gauge({ name: 'circuit_breaker_open', help: '1 when the circuit is open or half-open', labelNames: ['name'], registers: r });
    this.incidents = new Counter({ name: 'incidents_total', help: 'Incidents recorded', labelNames: ['kind', 'severity'], registers: r });
  }
}
