---
id: CI-001
titulo: Integración continua mínima para webs de clientes — GitHub Actions con lint, tipos, build y Playwright, más convenciones de commits
categoria: testing
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (playwright.dev/docs/ci-intro) + síntesis de TEST-001, TS-001, T3-001, DEPLOY-001
versiones: actions/checkout@v6, actions/setup-node@v6, actions/upload-artifact@v4 (según la doc de Playwright consultada)
perfil: ambos
ultima_revision: 2026-10-27
---

# CI-001 · CI con GitHub Actions

1. **Finalidad.** Que cada cambio se compruebe solo antes de publicarse: si algo se rompe, el *pull request* lo muestra.
2. **Fuentes.** https://playwright.dev/docs/ci-intro ; TEST-001 (buenas prácticas), TS-001/T3-001 (tipos y variables), DEPLOY-001 (checklist). Carlos Azaustre tiene artículos sobre Husky/lint-staged y Conventional Commits (TUT-034, **no leídos**).
3. **Flujo oficial de Playwright [docs].** Archivo `.github/workflows/playwright.yml`; se ejecuta en `push` y `pull_request` a `main`/`master`; `ubuntu-latest`; pasos: checkout → setup-node (`lts/*`) → `npm ci` → `npx playwright install --with-deps` → `npx playwright test` → subir `playwright-report/` como artefacto (`if: ${{ !cancelled() }}`, `retention-days: 30`). Sin `timeout-minutes` en el job: usar `globalTimeout` en `playwright.config.ts` (60 min en el ejemplo). Informe: descargar el zip y `npx playwright show-report <carpeta>` (abrir el HTML directamente no funciona); trazas desde el informe.
4. **Pipeline recomendado [síntesis propia, no probado].**
   ```yaml
   # pasos adicionales antes de Playwright
   - run: npm run lint        # incl. eslint-plugin-jsx-a11y (DEPLOY-001)
   - run: npx tsc --noEmit    # tipos (TS-001)
   - run: npm run build       # falla si faltan variables validadas (T3-001)
   ```
   - Variables de entorno de prueba en *secrets* del repositorio; nunca valores reales de producción en CI.
   - Instalar solo Chromium en CI si el presupuesto de tiempo es justo (`npx playwright install chromium --with-deps`, TEST-001); WebKit al menos antes de cada entrega (skills/web-qa-validation).
   - Opcional: Lighthouse CI con presupuestos de LCP/CLS (y TBT; INP no existe en una auditoría de laboratorio de navegación) → investigado en el lote 13: [CI-002](CI-002-lighthouse-ci.md).
5. **Convenciones [criterio propio].** Rama `main` protegida; PR obligatorio con CI verde; mensajes de commit con un prefijo de tipo (`feat:`, `fix:`, `docs:`) para generar historial de cambios para el cliente.
6. **Restricción vigente.** No instalar nada en proyectos del usuario sin autorización; esta ficha describe la configuración para cuando se autorice.
7–13. **Aplicaciones.** Todas las webs con repositorio.
14. **Pruebas.** Un PR con un error de tipos debe fallar; un PR que rompe el formulario de cita debe fallar en Playwright; el artefacto del informe aparece en la ejecución.
15. **Estado.** Doc oficial leída; pipeline ampliado = propuesta no ejecutada.
