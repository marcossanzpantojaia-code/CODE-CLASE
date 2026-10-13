# Manual de operación

Todos los comandos de CLI se ejecutan con las mismas variables de entorno que el servicio:
`node dist/cli/index.js <comando>` (o `npm run cli -- <comando>`). Imprimen JSON y nunca muestran secretos.

---

## 1. Desplegar

Requisitos: Node 22 (o la imagen Docker), PostgreSQL ≥ 13 con la extensión `btree_gist` disponible (incluida en PostgreSQL estándar y en los gestionados habituales), un dominio con **HTTPS** delante del servicio (Meta solo envía webhooks a HTTPS).

1. Construir la imagen: `docker build -t salon-receptionist:<versión> .` (la CI construye la imagen en cada push).
2. Configurar secretos y variables (ver `.env.example`). Imprescindibles: `DATABASE_URL`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `ANTHROPIC_API_KEY`, `APP_ENV`, `TRUST_PROXY` (= nº de proxies delante; 1 detrás de un balanceador).
3. Migraciones como paso de *release* (antes de arrancar la nueva versión): `node dist/cli/index.js migrate`. Son idempotentes y usan un lock, así que dos despliegues simultáneos no chocan.
4. Arrancar `node dist/main.js`:
   - una instancia `ROLE=all` (web + worker) basta para una o varias peluquerías;
   - para escalar: N instancias `ROLE=web` detrás del balanceador y M `ROLE=worker`. Los workers se coordinan por la BD (sin duplicar trabajo).
5. Health checks del orquestador: *liveness* `GET /health/live`, *readiness* `GET /health/ready`.
6. Arranque seguro: el servicio arranca con `AUTOMATED_RECEPTIONIST_ENABLED=false` salvo que se active explícitamente.

## 2. Configurar WhatsApp (Meta WhatsApp Business Platform – Cloud API)

1. **Portfolio de Meta Business** verificado (verificación del negocio) y **app de Meta** de tipo Business con el producto WhatsApp.
2. **Cuenta de WhatsApp Business (WABA)** y **número de teléfono** registrado en Cloud API, con *display name* aprobado. Anotar `phone_number_id` y `waba_id` (panel de la app → WhatsApp → configuración de la API).
3. **Usuario del sistema** en el portfolio con acceso a la app y a la WABA; generar un **token permanente** con permisos `whatsapp_business_messaging` y `whatsapp_business_management`. Guardarlo en el gestor de secretos como `WHATSAPP_ACCESS_TOKEN` (para varios números: `WHATSAPP_ACCESS_TOKEN_<SUFIJO>` y referenciarlo en el tenant con `accessTokenRef`).
4. **App secret** (configuración básica de la app) → `WHATSAPP_APP_SECRET`. Sirve para verificar la firma `X-Hub-Signature-256` de cada webhook.
5. **Webhook**: URL de callback `https://<dominio>/webhooks/whatsapp`, *verify token* = `WHATSAPP_VERIFY_TOKEN`. Suscribir el campo **`messages`** (incluye mensajes entrantes y estados de entrega). Comprobar que la app está suscrita a la WABA (`POST /<WABA_ID>/subscribed_apps`).
6. **App en modo Live**. En modo desarrollo Meta solo entrega a números de prueba de la lista permitida (si no, error `131030`).
7. **Plantillas** (WhatsApp Manager → plantillas de mensaje), categoría **Utilidad**, idioma `es`. Los parámetros los rellena el sistema en este orden: `{{1}}` nombre del cliente (o "cliente"), `{{2}}` negocio, `{{3}}` fecha ("jueves 15 de octubre"), `{{4}}` hora ("18:30"), `{{5}}` servicios.
   - `cita_confirmacion`
     - Cuerpo: `Hola {{1}}, te recordamos tu cita en {{2}} el {{3}} a las {{4}} ({{5}}). ¿Nos confirmas que vienes?`
     - Botones: *Respuesta rápida* `Confirmar` y *Respuesta rápida* `Cancelar cita` (en ese orden; el sistema envía el payload de cada botón).
   - `cita_recordatorio`
     - Cuerpo: `Hola {{1}}, te esperamos en {{2}} el {{3}} a las {{4}} para {{5}}. Si no puedes venir, respóndenos por aquí.`
     - Sin botones.

   Si una plantilla no está configurada o aprobada, el sistema **no** envía nada fuera de la ventana de 24 h y registra una incidencia `TEMPLATE_NOT_CONFIGURED`.
8. Comprobar credenciales y número: `node dist/cli/index.js whatsapp:check --tenant <slug>` → `{"ok":true, "displayPhoneNumber": ..., "qualityRating": ...}`.

> El número usado con Cloud API no puede usarse a la vez en la app WhatsApp Business del móvil salvo que se haya dado de alta con la modalidad de coexistencia de Meta. Para que el equipo responda a mano usa la API admin (`POST /admin/v1/conversations/:id/reply`).

## 3. Configurar la IA

- `ANTHROPIC_API_KEY`: clave de la API de Anthropic, en el gestor de secretos.
- `LLM_MODEL` (por defecto `claude-opus-5-5`) y `LLM_EFFORT` (por defecto `low`: la tarea es de clasificación/extracción). Cambiar de modelo es una decisión de negocio (coste/calidad): validarlo antes con `docs/VERIFICACION.md` §4.
- `LLM_TIMEOUT_MS` (15 s), `LLM_MAX_RETRIES` (1), `LLM_SERVER_FALLBACKS` (true: si el modelo rechaza una petición por sus filtros de seguridad, la API la reintenta en el modelo de reserva recomendado).
- Precios para estimar coste: `LLM_PRICE_*` (USD por millón de tokens). Mantenerlos alineados con el modelo usado.
- Límite de coste: `LLM_MAX_CALLS_PER_CONVERSATION_PER_DAY` (60). Coste y latencia por llamada en la tabla `llm_calls` y en `GET /admin/v1/stats`.
- Si la IA falla (timeout, caída, rechazo, salida inválida): el cliente recibe “No he podido procesar tu solicitud ahora mismo. Puedo avisar al equipo…”, con botones; se registra la incidencia `LLM_FAILURE`.

## 4. Dar de alta (activar) una peluquería

1. Preparar el fichero del negocio (ver `config/tenant.example.json`): horario, servicios con precio y duración, profesionales y qué hace cada uno, canal WhatsApp y plantillas.
2. `node dist/cli/index.js tenant:apply --file salon.json` (idempotente; se puede repetir para actualizar). El negocio se crea con la recepcionista **apagada**.
3. Clave de la API admin para el equipo: `node dist/cli/index.js apikey:create --tenant <slug> --name recepcion` (se muestra una sola vez).
4. `node dist/cli/index.js whatsapp:check --tenant <slug>`.
5. **Todas las citas deben estar en el sistema**: las que lleguen por teléfono o en persona se registran con `POST /admin/v1/appointments`; las ausencias y festivos con `POST /admin/v1/time-off`. Si no, la disponibilidad que ofrece el bot no refleja la agenda real.
6. Activar: `node dist/cli/index.js tenant:flags --tenant <slug> --receptionist on` (y, la primera vez, `AUTOMATED_RECEPTIONIST_ENABLED=true` en el entorno global).
7. Seguir la prueba de humo de `docs/VERIFICACION.md` §3 con un número autorizado.

## 5. Desactivar una peluquería

| Necesidad | Acción | Efecto |
|---|---|---|
| Parar respuestas automáticas, seguir recibiendo y que el equipo atienda | `tenant:flags --tenant X --safe-mode on` o `PATCH /admin/v1/business/flags {"safeMode":true}` | Mensajes guardados, conversaciones marcadas `needs_human`, sin respuestas. Efecto inmediato, sin despliegue. |
| Apagar el bot de ese negocio | `tenant:flags --tenant X --receptionist off` | Mensajes guardados, sin respuestas. |
| Parar recordatorios | `tenant:flags --tenant X --reminders off` | No se programan ni se envían (se revalida al enviar). |
| Dejar de usar el número | Desactivar el canal (quitar `whatsapp` del fichero y volver a aplicar) | Los webhooks de ese número se ignoran. |

## 6. Ver errores

- **Logs** (JSON en stdout, sin teléfonos completos ni textos): buscar por `event`. Los más útiles: `whatsapp.message.received`, `conversation.turn.processed`, `appointment.created`, `appointment.failed`, `human_handoff.requested`, `provider.error`, `llm.error`, `incident.recorded`, `whatsapp.webhook.invalid_signature`, `jobs.failed`, `circuit.state_changed`. Todos llevan `businessId`, `conversationId`, `messageId` o `appointmentId` cuando aplica.
- **Incidencias**: `GET /admin/v1/incidents?open=true` (por tenant). Tipos: `LLM_FAILURE`, `WHATSAPP_SEND_FAILURE`, `WHATSAPP_AUTH_FAILURE` (CRITICAL), `TEMPLATE_NOT_CONFIGURED`, `OUTSIDE_SERVICE_WINDOW`, `RUNAWAY_GUARD` (CRITICAL), `LLM_BUDGET_EXCEEDED`, `STALE_REPLY_DROPPED`.
- **Métricas Prometheus**: `GET /metrics` con `Authorization: Bearer $METRICS_TOKEN`. Alertas recomendadas: `incidents_total{severity="CRITICAL"}` > 0; `rate(whatsapp_failures_total[5m])`; `rate(llm_failures_total[5m])`; `circuit_breaker_open` = 1; `job_queue_depth{status="PENDING"}` creciendo; `histogram_quantile(0.95, rate(reply_latency_seconds_bucket[5m]))` > 30 s; `webhook_invalid_signature_total` creciendo.
- **KPIs del negocio**: `GET /admin/v1/stats?from=…&to=…` → reservas generadas automáticamente, conversión, handoffs, latencia p50/p95/p99 de respuesta, coste de IA.
- **Conversaciones que esperan a una persona**: `GET /admin/v1/conversations?needsHuman=true`; devolverlas al bot con `POST /admin/v1/conversations/:id/resume-bot`.

## 7. Recuperar el worker

- Si un worker muere, sus jobs vuelven a la cola cuando caduca el *lease* (`JOB_LEASE_SECONDS`) y los toma otro worker; el worker caído no puede completarlos después (*fencing*).
- Estado de la cola: `node dist/cli/index.js jobs:stats`. `/health/ready` informa `worker: stalled` si el bucle del worker deja de avanzar.
- Envíos fallidos por una causa ya corregida (p. ej. token renovado): `node dist/cli/index.js jobs:requeue-failed --type outbound.send --since <ISO>`. No resucita respuestas conversacionales caducadas.
- Kill switch de envíos (sin perder nada): `OUTBOUND_MESSAGING_ENABLED=false` retiene todos los envíos; al volver a `true` salen en orden.

## 8. Comprobar la salud

- `GET /health/live` → 200 mientras el proceso vive.
- `GET /health/ready` → 200 solo si: BD responde, no hay migraciones pendientes, el worker avanza (si el rol lo incluye) y el webhook tiene secretos. Informa del estado de los circuit breakers de WhatsApp y del LLM, de los flags y del retraso de la cola. **No** llama al LLM (costaría dinero en cada sondeo; su caída degrada al fallback, no impide recibir mensajes). Durante el apagado devuelve 503 `draining`.

## 9. Rollback

Orden recomendado ante un problema grave, de menor a mayor impacto:

1. **Parar respuestas de un negocio al instante (sin despliegue)**: `tenant:flags --tenant X --safe-mode on`. Se siguen recibiendo y guardando mensajes; el equipo los ve como `needs_human`.
2. **Parar todo el bot (reinicio con variable)**: `SAFE_MODE=true` (o `AUTOMATED_RECEPTIONIST_ENABLED=false`).
3. **Parar todos los mensajes salientes, incluidos recordatorios**: `OUTBOUND_MESSAGING_ENABLED=false` (quedan retenidos, no se pierden).
4. **Volver a la versión anterior**: redesplegar la imagen anterior (`ghcr.io/<owner>/salon-receptionist:<sha anterior>`). Las migraciones son solo aditivas (expand/contract): la versión anterior sigue funcionando con el esquema nuevo. Nunca se ejecuta una migración destructiva sin copia de seguridad.
5. **Proteger las citas existentes**: las citas viven en PostgreSQL y un rollback de código no las toca. Mantener copias de seguridad con recuperación a un punto en el tiempo (PITR) del PostgreSQL gestionado. Antes de cualquier intervención manual: `pg_dump` del tenant afectado.
6. **No desconectar el webhook de Meta** salvo como último recurso: si se desconecta, los mensajes de los clientes no llegan a ningún sitio (Meta reintenta durante un tiempo limitado). Es preferible el modo seguro, que mantiene la recepción.

## 10. Mantenimiento y privacidad

- `node dist/cli/index.js maintenance:purge --days 30 --text-days 180`: borra jobs terminados y eventos de estado de más de 30 días, y **borra el texto** de los mensajes de más de 180 días (se conservan metadatos para auditoría y estadísticas). Programarlo a diario.
- Evidencia de un cliente concreto (soporte o verificación), redactada: `node dist/cli/index.js evidence --tenant <slug> --phone <E.164> --since <ISO>`.
