# Verificación

Este documento separa estrictamente lo **demostrado** de lo **pendiente**. Ningún nivel superior se da por cumplido porque pasen los inferiores.

## 1. Estado actual

| Nivel | Estado | Evidencia |
|---|---|---|
| CÓDIGO / TYPECHECK / LINT / BUILD | **PASS** | `npm run typecheck`, `npm run lint`, `npm run build` sin errores |
| UNIT TESTED | **PASS** | `npm run test:unit` (sin red ni BD) |
| INTEGRATION TESTED | **PASS** | `npm run test:integration` contra **PostgreSQL 16 real**, servidor HTTP real (Fastify), cola real; Graph API de Meta y Messages API de Anthropic sustituidas por **servidores HTTP locales** de prueba |
| E2E (local) | **PASS** | `npm run test:e2e`: servicio escuchando en un puerto TCP, worker en bucle, webhooks firmados enviados por HTTP, adaptador real de Claude y cliente real de WhatsApp contra servidores HTTP de prueba |
| Imagen Docker | **PASS** (local) | `docker build` + contenedor: migración, `/health/ready` 200, usuario no-root, salida 0 tras SIGTERM |
| STAGING VERIFIED | **NO VERIFICADO** | No existe entorno de staging (ver §5) |
| PRODUCTION VERIFIED | **PRODUCTION VERIFICATION BLOCKED** | Ver §5 |

Los tests de integración y E2E **no** demuestran que Meta entregue mensajes a un móvil real ni que el modelo real interprete el español como en los guiones de prueba. Eso solo lo demuestran §2–§4.

## 2. Verificación en STAGING (procedimiento)

Requisitos: URL HTTPS pública de staging, PostgreSQL de staging, app de Meta con número de prueba (o WABA de staging), plantillas aprobadas, `ANTHROPIC_API_KEY` real, un móvil autorizado como destinatario de prueba.

1. Desplegar la imagen con `APP_ENV=staging`, ejecutar `migrate`, `tenant:apply` con un tenant de staging, `apikey:create`, `whatsapp:check` → `ok: true`.
2. Configurar el webhook de Meta hacia `https://<staging>/webhooks/whatsapp` (Meta hace el GET de verificación: debe devolver 200).
3. Calidad del LLM real: `node dist/cli/index.js llm:eval --tenant <slug> --file config/llm-eval-cases.json --confirm-cost` → guardar el JSON (precisión, p50/p95, coste). Criterio sugerido: ≥ 90 % de aciertos y **0 fallos** en las categorías de seguridad (prompt injection, fuera de dominio, handoff).
4. Ejecutar desde el móvil la conversación de §3 completa.
5. Inyección de errores (en staging):
   - **LLM timeout**: reiniciar con `LLM_TIMEOUT_MS=1` → el cliente recibe el mensaje de fallback y queda la incidencia `LLM_FAILURE`.
   - **WhatsApp error**: token inválido en `WHATSAPP_ACCESS_TOKEN` → incidencia `WHATSAPP_AUTH_FAILURE` CRITICAL, conversación marcada para humano, sin reintentos ciegos; restaurar el token y `jobs:requeue-failed`.
   - **Webhook duplicado**: reenviar un payload firmado capturado → respuesta `duplicates: 1`, ninguna respuesta extra.
   - **BD no disponible**: parar la BD de staging unos segundos → `/health/ready` 503 y el webhook responde 5xx (Meta reintenta); al volver, el mensaje se procesa una sola vez.
   - **Reinicio del worker** con un mensaje en cola (`SIGTERM` durante una conversación) → tras arrancar, la respuesta llega una sola vez y los recordatorios siguen programados (`jobs:stats`).
6. Recoger evidencia: `node dist/cli/index.js evidence --tenant <slug> --phone <E.164> --since <ISO>`.

## 3. PRUEBA DE HUMO EN PRODUCCIÓN (obligatoria)

Con: número de WhatsApp real autorizado, tenant productivo de prueba (o la peluquería piloto con la agenda real), webhook productivo, BD productiva, LLM productivo.

| # | Paso | Cómo se comprueba (evidencia) |
|---|---|---|
| 1 | Enviar desde el móvil: “Hola, quiero reservar un corte” | — |
| 2 | El webhook recibe el mensaje | log `whatsapp.message.received`; `evidence.messages[]` con `direction: INBOUND` y `provider_message_id` (wamid) |
| 3 | El cliente aparece en el CRM | `evidence.customer` (`source: WHATSAPP`) y `crmEvents` `CUSTOMER_CREATED`, `MESSAGE_RECEIVED` |
| 4 | El bot responde de verdad | la respuesta llega al móvil; `evidence.messages[]` `OUTBOUND` con `status` `ACCEPTED` → `SENT` → `DELIVERED` (→ `READ`) y sus marcas de tiempo, procedentes de los webhooks de estado de Meta |
| 5 | Preguntar disponibilidad (“¿tenéis mañana por la tarde?”) | `crmEvents` `INTENT_DETECTED`, `AVAILABILITY_OFFERED`; `llmCalls[]` con `outcome: OK`, latencia y coste |
| 6 | Devuelve horarios reales | comparar los horarios recibidos con `GET /admin/v1/availability?date=…&serviceIds=…` (misma función determinista) |
| 7 | Seleccionar un horario | pulsar el botón |
| 8 | Se crea la cita real | mensaje “Perfecto ✅ Tu cita queda reservada…” en el móvil |
| 9 | La cita está en la BD | `evidence.appointments[]`: `id`, `status: BOOKED`, `source: WHATSAPP`, hora, profesional y servicio correctos, tenant correcto |
| 10 | CRM actualizado | `crmEvents` `APPOINTMENT_CREATED` con el `appointment_id` |
| 11 | Automatización de confirmación | `notificationJobs` con `kind: CONFIRMATION_REQUEST` programado a la hora prevista (o enviado si ya llegó la hora) |
| 12 | Recordatorios programados | `notificationJobs` con `kind: REMINDER`, `status: PENDING` |
| 13 | Limpieza | escribir “No puedo ir mañana” → “Sí” (o `POST /admin/v1/appointments/:id/cancel`); comprobar `status: CANCELLED` y `notificationJobs` `CANCELLED` |

Comando de evidencia (salida JSON redactada: teléfono enmascarado, sin textos, sin secretos):

```bash
node dist/cli/index.js evidence --tenant <slug> --phone +34XXXXXXXXX --since 2026-10-13T00:00:00Z > evidencia-produccion.json
```

Solo cuando los 13 pasos tienen evidencia en `APP_ENV=production` se puede declarar **PRODUCTION VERIFIED**.

## 4. Calidad del LLM

Los tests automáticos fijan *qué hace el sistema con cada interpretación* (determinista). La calidad de la *interpretación* del modelo real se mide con `llm:eval` (34 casos en `config/llm-eval-cases.json`: intenciones, servicios, fechas relativas, selección de opciones, sí/no, cancelación, reprogramación, handoff, fuera de dominio, prompt injection, mensajes dudosos). Cada caso es una llamada real de pago; por eso exige `--confirm-cost`.

## 5. Por qué la verificación de STAGING/PRODUCCIÓN está bloqueada ahora

**PRODUCTION VERIFICATION BLOCKED**. Falta:

| Falta | Por qué bloquea | Acción concreta que lo desbloquea |
|---|---|---|
| Cuenta de WhatsApp Business Platform (portfolio verificado, app de Meta, WABA, número registrado, token de usuario del sistema, app secret) | Sin ella no existe webhook real ni envío real | Crear/compartir esos activos y cargar `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN` en el gestor de secretos del entorno |
| Plantillas `cita_confirmacion` y `cita_recordatorio` aprobadas | Fuera de la ventana de 24 h no se puede enviar confirmación/recordatorio | Crearlas en WhatsApp Manager con el texto de `docs/OPERACION.md` §2.7 |
| Entorno desplegado con HTTPS (staging y producción) | Meta solo llama a webhooks HTTPS públicos | Elegir plataforma (Render, Railway, Fly.io, Cloud Run, K8s…), desplegar la imagen, configurar dominio TLS y `DEPLOY_HOOK_URL`/`DEPLOY_ENABLED` en GitHub |
| PostgreSQL gestionado de staging y de producción (con copias PITR) | Fuente de verdad de citas | Crear las instancias y poner `DATABASE_URL` |
| `ANTHROPIC_API_KEY` de la aplicación | Sin ella no hay interpretación real (el sistema responde con el fallback) | Crear la clave en la consola de Anthropic y cargarla como secreto; ejecutar `llm:eval` |
| Un número de móvil real autorizado para la prueba de humo | Paso 1 de §3 | Designar el número (en modo desarrollo de Meta, añadirlo a la lista de destinatarios permitidos) |
| Acceso de red | Desde el entorno donde se construyó este sistema `graph.facebook.com` no es alcanzable | Ejecutar la verificación desde el entorno desplegado |

Nada de lo anterior puede crearse desde el repositorio: requiere cuentas, verificación de negocio en Meta e infraestructura del propietario.
