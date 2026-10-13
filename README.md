# Recepcionista automática por WhatsApp para peluquerías y barberías

Servicio Node.js/TypeScript que atiende el WhatsApp de una peluquería. Hace lo siguiente:

- Identifica al negocio y al cliente y actualiza el CRM.
- Entiende lo que pide el cliente con Claude, que solo interpreta.
- Consulta la **disponibilidad real** de la agenda.
- Ofrece horarios reales y crea, reprograma o cancela citas sin dobles reservas.
- Activa la confirmación y los recordatorios.
- Pasa la conversación a una persona cuando hace falta.

> **Estado: PRODUCTION VERIFICATION BLOCKED.** Código, tests unitarios, de integración (PostgreSQL real) y E2E locales en verde. Staging y producción **no** están verificados porque faltan las cuentas e infraestructura reales (Meta WhatsApp Business Platform, despliegue HTTPS, BD gestionada, clave de Anthropic). Detalle y procedimiento: [`docs/VERIFICACION.md`](docs/VERIFICACION.md).

## Cómo funciona

```
WhatsApp → Meta Cloud API → POST /webhooks/whatsapp (firma HMAC)
  → tenant por phone_number_id → cliente (teléfono E.164) → mensaje (wamid único) → CRM → job
  → worker (FIFO por conversación)
      → fast-path determinista (botones, "2", "18:30", "sí")  ó  Claude (JSON validado con Zod)
      → diálogo determinista → disponibilidad real → reserva transaccional (lock + EXCLUDE)
      → CRM + confirmación (24 h) + recordatorio (2 h) en la misma transacción
  → envío por Graph API (orden, reintentos clasificados, ventana 24 h, circuit breaker)
```

- La IA **interpreta**, el backend **decide** y PostgreSQL es la **fuente de verdad**.
- Ningún horario, precio o nombre sale del modelo.
- Más detalle en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Puesta en marcha (desarrollo)

```bash
npm ci
cp .env.example .env                        # rellenar valores
docker compose up -d postgres               # o scripts/test-db.sh start
npm run build
node dist/cli/index.js migrate
node dist/cli/index.js tenant:apply --file config/tenant.example.json
node dist/cli/index.js apikey:create --tenant barberia-ejemplo --name recepcion
node dist/cli/index.js tenant:flags --tenant barberia-ejemplo --receptionist on
npm start
```

## Calidad

```bash
npm run lint && npm run typecheck && npm run build
npm run test:unit
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres npm run test:integration   # PostgreSQL real
TEST_DATABASE_URL=... npm run test:e2e
```

`scripts/test-db.sh start` levanta un PostgreSQL local desechable si no hay Docker. La CI (`.github/workflows/ci.yml`) ejecuta todo lo anterior con un PostgreSQL 16 de servicio y construye la imagen Docker. El job de despliegue solo corre si todo pasa.

> Para añadir o actualizar dependencias usa npm ≥ 11 (`npx npm@11 install …`): npm 10.9 falla al resolver los *peers* de Vitest 4.1. `npm ci` funciona con npm 10.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Diagrama, módulos, decisiones, idempotencia, concurrencia, multi-tenancy, fiabilidad |
| [`docs/OPERACION.md`](docs/OPERACION.md) | Despliegue, WhatsApp (Meta), plantillas, IA, alta y baja de negocios, errores, worker, salud, rollback |
| [`docs/VERIFICACION.md`](docs/VERIFICACION.md) | Qué está verificado, qué falta y cómo verificar staging y producción con evidencia |
| [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md) | Revisión de seguridad y riesgos residuales |

## Estructura

```
src/
  app.ts, main.ts          composición y arranque/apagado ordenado
  config/                  variables de entorno (Zod)
  db/                      Kysely, migraciones SQL
  tenancy/ catalog/ crm/   negocios, catálogo, clientes y eventos CRM
  scheduling/              motor de disponibilidad (puro) y reservas
  messaging/               webhook, Cloud API, envíos, estados
  receptionist/            intérprete (Claude), estado, diálogo, textos
  reminders/               confirmación y recordatorios
  jobs/                    cola/outbox/scheduler en PostgreSQL + worker
  http/                    servidor, health, métricas, API admin
  cli/                     herramientas de operación
test/unit | integration | e2e
```
