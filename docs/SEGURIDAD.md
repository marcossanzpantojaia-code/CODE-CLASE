# Revisión de seguridad

Revisión hecha sobre el código de este repositorio antes de cualquier despliegue. Cada punto indica cómo está resuelto y dónde está probado.

| Área | Resultado | Detalle / prueba |
|---|---|---|
| Autenticidad del webhook | OK | HMAC-SHA256 con el *app secret* sobre el **cuerpo crudo**, comparación en tiempo constante; sin firma o firma inválida → 401; si falta el secreto → 503 (nunca se aceptan webhooks sin firmar). GET de verificación con comparación en tiempo constante. `test/unit/whatsapp-protocol.test.ts`, `test/integration/webhook.test.ts` |
| Repetición de webhooks (replay) | OK | Idempotencia por wamid: repetir un payload firmado no tiene efecto. |
| Almacenamiento de secretos | OK | Solo variables de entorno / gestor de secretos; nada en código ni en BD. Los canales referencian el token (`env:WHATSAPP_ACCESS_TOKEN[_SUFIJO]`), restringido a ese prefijo para que una configuración errónea no pueda enviar otro secreto (p. ej. `DATABASE_URL`) a Meta (CHECK en BD + validación + runtime). Las API keys se guardan como SHA-256 (32 bytes aleatorios) y se muestran una sola vez. |
| Secretos en logs | OK | Los logs de petición registran solo método y ruta (sin query string: el `hub.verify_token` viajaba en la query; sin cabeceras). Red de seguridad de redacción para `token`, `apiKey`, `accessToken`, `text`, `body`, `phone`… `test/unit/logging.test.ts` |
| PII | OK con matices | Teléfonos enmascarados en logs (`+34******678`), sin textos de mensajes en logs. Al LLM solo van nombres de servicios/profesionales, el resumen del estado y unos pocos mensajes de la propia conversación; nunca teléfonos, IDs, otros clientes ni la BD. Texto de mensajes antiguos borrable con `maintenance:purge --text-days`. **Pendiente del responsable**: base legal/aviso de privacidad, contrato de encargado con los proveedores (Meta, Anthropic, hosting) y periodo de retención acordado. |
| Autorización y aislamiento de tenants | OK | Claves foráneas compuestas `(business_id, id)` (la BD rechaza mezclar tenants), toda consulta filtrada por `business_id`, la API key determina el tenant, IDs de la URL comprobados contra el tenant (404). `test/integration/admin-api.test.ts`, `booking.test.ts` |
| IDOR por botones | OK | Los botones de recordatorio llevan `appointmentId`; se re-autoriza contra el cliente y el tenant del remitente. Los botones de opciones van ligados al `offerId` del estado de *esa* conversación. `test/integration/reminders.test.ts` |
| Validación de entrada | OK | Zod en: entorno, payload del webhook, salida del LLM, cuerpos/queries de la API admin (`strict`), fichero de tenant, estado conversacional (se valida al leer). |
| Inyección SQL | OK | Consultas parametrizadas (Kysely / plantillas `sql`); `sql.raw` solo para ficheros de migración del repositorio. |
| Asignación masiva | OK | Esquemas `strict` (campos desconocidos → 400) y actualización de flags por lista blanca. Probado. |
| Prompt injection | OK | El texto del cliente va delimitado y se neutralizan las etiquetas delimitadoras; el modelo no tiene herramientas ni acceso a datos; su salida es un esquema cerrado revalidado; los códigos se mapean al catálogo del tenant y lo desconocido se descarta; las respuestas al cliente se generan con plantillas deterministas; toda acción exige confirmación explícita. Probado con mensajes de inyección. |
| Rate limiting | OK con matices | Autenticación fallida de la API admin limitada por IP (en memoria, por instancia); IP real calculada con un número de *proxies* de confianza (`TRUST_PROXY`), no falsificable con `X-Forwarded-For` (probado). Presupuesto de llamadas al LLM por conversación y protección anti-bucle. **Recomendado**: límite de tasa en el borde (WAF/balanceador) para `/webhooks/whatsapp` y `/admin`. |
| Dependencias | OK | `npm audit --omit=dev`: 0 vulnerabilidades (también en CI). Herramientas de desarrollo: 0. |
| Contenedor | OK | Usuario no root (`node`), solo dependencias de producción, healthcheck de *liveness*. |
| Superficie HTTP | OK | Sin CORS (no se puede llamar desde navegadores de otros orígenes), errores 5xx sin detalles internos, `/metrics` requiere `METRICS_TOKEN` en staging/producción. TLS lo termina el balanceador (obligatorio para Meta). |
| Doble reserva / integridad | OK | Restricción `EXCLUDE` + locks + revalidación (ver ARQUITECTURA §5). |

## Riesgos residuales de seguridad

1. El limitador de autenticación es por instancia (en memoria): con varias instancias el límite efectivo se multiplica. Complementar con límite en el borde.
2. Envío al-menos-una-vez: si el proceso muere justo después de que Meta acepte un mensaje y antes de guardarlo, se reenviará (Meta no admite claves de idempotencia).
3. Las claves de la API admin no caducan solas: rotarlas (`apikey:create` + `apikey:revoke`) cuando cambie el personal.
4. La seguridad del token de Meta depende del gestor de secretos de la plataforma elegida.
