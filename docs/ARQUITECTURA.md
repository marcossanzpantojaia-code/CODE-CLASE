# Arquitectura

## 1. Visión general

```
 Cliente (WhatsApp)
        │
        ▼
 Meta WhatsApp Cloud API ──(webhook firmado X-Hub-Signature-256)──┐
        ▲                                                         │
        │ Graph API /{phone_number_id}/messages                   ▼
        │                                        ┌──────────────────────────────┐
        │                                        │  WEB (Fastify)               │
        │                                        │  POST /webhooks/whatsapp     │
        │                                        │   1. verifica HMAC (raw body)│
        │                                        │   2. tenant = phone_number_id│
        │                                        │   3. TX: cliente (upsert E164)│
        │                                        │      conversación, mensaje   │
        │                                        │      (wamid UNIQUE), CRM,    │
        │                                        │      job receptionist.process│
        │                                        │   4. 200 a Meta (rápido)     │
        │                                        └──────────────┬───────────────┘
        │                                                       │ PostgreSQL (fuente de verdad)
        │                                                       ▼
        │                                        ┌──────────────────────────────┐
        │                                        │  WORKER (cola en PostgreSQL) │
        │                                        │  SKIP LOCKED + leases        │
        │                                        │  FIFO por conversación       │
        │                                        └───┬──────────┬───────────┬───┘
        │                                            │          │           │
        │                    receptionist.process ◄──┘          │           └──► appointment.notify
        │                    ┌─────────────────────────────┐    │                (confirmación 24h /
        │                    │ compuertas: flags, safe mode,│    │                 recordatorio 2h)
        │                    │ handoff, anti-bucle, coste   │    │                 revalida estado+versión
        │                    │ fast-path determinista       │    │                 plantilla fuera de 24h
        │                    │ ─ o ─ Claude (solo INTERPRETA)│    │
        │                    │   salida JSON + Zod + códigos│    │
        │                    │ diálogo determinista (DECIDE)│    │
        │                    │ TX: disponibilidad real,     │    │
        │                    │   reserva (lock + EXCLUDE),  │    │
        │                    │   CRM, estado, respuestas    │    │
        │                    └─────────────────────────────┘    │
        │                                                       ▼
        └─────────────────────────────────────────── outbound.send (orden por conversación,
                                                    reintentos clasificados, circuit breaker,
                                                    ventana 24h, caducidad, kill switch)
```

**Principio**: la IA *interpreta*, el backend *decide*, la base de datos es la *fuente de verdad*.

## 2. Componentes

| Módulo | Ruta | Responsabilidad |
|---|---|---|
| Config | `src/config/env.ts` | Variables de entorno validadas con Zod; secretos solo desde el entorno. |
| BD | `src/db/` | Kysely + `pg`, migraciones SQL con lock consultivo y checksum. |
| Tenancy | `src/tenancy/` | Negocios, canal WhatsApp (`phone_number_id` → tenant), configuración declarativa (`tenant:apply`). |
| Catálogo | `src/catalog/` | Servicios, profesionales, compatibilidades, horarios, bloqueos. Todo filtrado por `business_id`. |
| Disponibilidad | `src/scheduling/availability-engine.ts` | **Función pura y determinista**: horario del negocio (turnos partidos), horario del profesional, descansos/festivos/vacaciones/bloqueos, citas existentes + margen de limpieza, duración, antelación mínima, horizonte, zona horaria con DST. |
| Reservas | `src/scheduling/booking.service.ts` | Crear / reprogramar / cancelar / confirmar en transacción: lock por profesional, revalidación, `SAVEPOINT`, idempotencia, evento CRM, recordatorios. |
| CRM | `src/crm/` | Cliente por teléfono E.164 (upsert atómico), línea temporal de eventos con dedupe. |
| Mensajería | `src/messaging/` | Webhook (firma, esquema, idempotencia), cliente Cloud API, estados de entrega, envío con reintentos. |
| Recepcionista | `src/receptionist/` | Intérprete (Claude), fast-path determinista, estado conversacional, diálogo, textos. |
| Recordatorios | `src/reminders/` | Programación transaccional + envío con revalidación. |
| Cola | `src/jobs/` | Outbox + scheduler + worker sobre PostgreSQL. |
| HTTP | `src/http/` | Webhook, health, métricas, API admin multi-tenant. |
| CLI | `src/cli/` | Migraciones, alta de tenant, flags, API keys, comprobación WhatsApp, evidencia, mantenimiento. |

## 3. Decisiones de diseño (y por qué)

1. **PostgreSQL como única dependencia con estado (sin Redis/BullMQ).** Los jobs se encolan en la *misma transacción* que el cambio de negocio (cita creada → recordatorios; respuesta decidida → envío). Eso es un *transactional outbox* real: no existe la ventana de doble escritura BD/cola. Con PostgreSQL ya presente, añadir Redis solo aportaría otra pieza que operar y otro punto de inconsistencia.
2. **Kysely + SQL explícito en lugar de Prisma.** La corrección depende de capacidades específicas de PostgreSQL (restricción `EXCLUDE USING gist`, `FOR UPDATE SKIP LOCKED`, locks consultivos, `ON CONFLICT` con índices parciales). Con SQL visible y tipado se controlan exactamente; no hay motor binario que descargar.
3. **El LLM no tiene herramientas con efectos.** Una sola llamada por turno con *structured output* (esquema JSON), revalidada con Zod. El modelo solo ve códigos efímeros (`S3`, `P1`), nunca IDs; describe fechas (“jueves”, “mañana”) y el backend las calcula. Las herramientas de negocio (`get_availability`, `create_appointment`, `request_cancellation`…) son funciones del backend que el diálogo determinista invoca con `businessId/customerId/conversationId` del contexto de confianza (webhook verificado), nunca de la IA.
4. **Fast-path determinista.** Botones, “2”, “18:30”, “sí/no” en contexto y peticiones explícitas de persona se resuelven sin IA: coste cero, latencia mínima y los pasos críticos funcionan con el LLM caído.
5. **Todo hecho que ve el cliente sale de la BD.** Horarios, precios, nombres y direcciones se formatean con plantillas de texto deterministas.
6. **Toda acción que cambia estado exige una elección explícita** del cliente sobre opciones generadas por el backend (botón/número/hora ofrecida) o un “sí” a una pregunta concreta. La confianza del LLM solo decide entre actuar o preguntar.

## 4. Idempotencia (exacta)

| Riesgo | Mecanismo |
|---|---|
| Meta reenvía el mismo webhook | `messages.provider_message_id` **UNIQUE** (wamid). Se comprueba dentro de la transacción y además `ON CONFLICT DO NOTHING`. El evento CRM (`message_received:<wamid>`) y el job (`inbound:<wamid>`) tienen claves únicas. |
| Estados de entrega duplicados/desordenados | `message_status_events UNIQUE(provider_message_id, status)`; el estado del mensaje se **recalcula** a partir de todos los eventos (independiente del orden). |
| Reintento de un job tras crear la cita | `appointments.idempotency_key = wa:<último wamid del turno>` (UNIQUE por tenant): el reintento devuelve la misma cita. |
| Reprogramación reintentada | Evento CRM con `dedupe_key appointment_rescheduled:<clave>`; el reintento no mueve otra vez. |
| Respuesta generada dos veces | `messages.idempotency_key = reply:<wamid>:<n>` (UNIQUE): mismo mensaje, un solo job de envío (`send:<messageId>`). |
| Recordatorios duplicados | `jobs.dedupe_key = appt:<id>:v<versión>:<tipo>`. |
| Envío cuyo resultado se desconoce (caída entre la llamada a Meta y el commit) | El mensaje queda en `SENDING`; al reintentar se reenvía (al-menos-una-vez) y se registra `outbound.unknown_outcome_resend`. La Cloud API no ofrece clave de idempotencia: es un riesgo residual documentado. |

## 5. Concurrencia y doble reserva

1. **Serialización por conversación**: los jobs con la misma `concurrency_key` (`conv:<id>:in` / `conv:<id>:out`) se ejecutan de uno en uno y en orden de llegada, aunque haya varios workers. Los mensajes rápidos se agrupan en un solo turno (debounce configurable).
2. **Lock por profesional**: `pg_advisory_xact_lock(hash(staff))` para todos los candidatos, ordenados (sin deadlocks).
3. **Revalidación** de la disponibilidad dentro de la transacción, después de tomar los locks.
4. **Restricción `appointments_no_overlap`** (`EXCLUDE USING gist (staff_id WITH =, tstzrange(starts_at, occupied_until) WITH &&) WHERE status IN ('BOOKED','CONFIRMED')`): aunque todo lo anterior fallase, PostgreSQL rechaza el solape. Se captura con `SAVEPOINT` y se informa “ese hueco se acaba de ocupar” con nuevas opciones.
5. **Bloqueo optimista** de la conversación (`version`): si cambió mientras se interpretaba (p. ej. un humano la tomó), el turno se reintenta.

Probado: 8 reservas simultáneas del mismo hueco → exactamente 1 éxito (`test/integration/booking.test.ts`); dos clientes por HTTP eligiendo a la vez → 1 reserva y 1 aviso honesto (`test/e2e`).

## 6. Multi-tenancy

- Cada fila de negocio lleva `business_id`; las tablas hijas usan **claves foráneas compuestas** `(business_id, id)`, de modo que la BD rechaza mezclar tenants (probado con SQL directo).
- Tenant del webhook: `metadata.phone_number_id` → `whatsapp_channels` (único). Si no está mapeado, se ignora (200, sin adivinar).
- API admin: la API key *es* el tenant; ninguna ruta acepta un `business_id` del cliente; todo ID de la URL se comprueba contra el tenant (IDOR probado).
- Botones de recordatorio con `appointmentId`: se re-autorizan contra el cliente y el tenant del remitente.
- El prompt de la IA solo contiene el catálogo del tenant y la conversación actual.

## 7. Conversación con estado

`conversations.state` (JSONB) es una unión discriminada validada con Zod en cada lectura: `IDLE`, `COLLECTING` (servicio/día/franja), `OFFERING_SLOTS`, `CONFIRMING_BOOKING`, `CONFIRMING_CANCELLATION`, `CHOOSING_APPOINTMENT`, `OFFERING_HANDOFF`. Caduca (`CONVERSATION_STATE_TTL_MINUTES`, 30 por defecto): un “sí” o un “2” tras la caducidad nunca se aplica. Cada pregunta lleva un `offerId` que viaja en los botones; un botón de una oferta antigua no actúa sobre la nueva.

## 8. Confirmación y recordatorios

Al crear/reprogramar una cita, en la misma transacción se programan `appointment.notify`:
- `CONFIRMATION_REQUEST` (por defecto 24 h antes) con botones *Confirmar / Cancelar cita*.
- `REMINDER` (por defecto 2 h antes).
Al cancelar/reprogramar se cancela el grupo de jobs y los mensajes en cola. Al ejecutarse se revalida estado, versión y que la cita sea futura. Dentro de la ventana de 24 h se usan botones interactivos; fuera, **plantilla aprobada** (obligatorio por política de WhatsApp); sin plantilla → incidencia y no se envía.

## 9. Fiabilidad

| Mecanismo | Dónde |
|---|---|
| Reintentos con backoff y jitter | Cola de jobs (`RetryableJobError`) |
| Clasificación de errores de Meta | `classifyGraphError`: reintenta red/5xx/429/131000/131056…; no reintenta auth (190), destinatario (131026/131030), fuera de ventana (131047), plantilla (1320xx), 4xx |
| `Retry-After` | Respetado en 429 |
| Circuit breaker | WhatsApp y LLM (5 fallos/60 s → abierto 30 s → sonda) |
| Timeouts | LLM (`LLM_TIMEOUT_MS`), Graph (`WHATSAPP_HTTP_TIMEOUT_MS`), `statement_timeout` en BD |
| Caducidad de respuestas | `REPLY_MAX_AGE_MINUTES`: tras una caída no se envían respuestas zombis; se marca para humano |
| Anti-bucle | Más de `RUNAWAY_MAX_REPLIES_PER_10_MIN` respuestas → handoff + incidencia CRITICAL |
| Presupuesto IA | `LLM_MAX_CALLS_PER_CONVERSATION_PER_DAY` |
| Leases | Si un worker muere, sus jobs vuelven a la cola; el worker viejo no puede completarlos (fencing) |
| Apagado ordenado | SIGTERM → readiness 503 → cierra HTTP → termina jobs → cierra BD |
