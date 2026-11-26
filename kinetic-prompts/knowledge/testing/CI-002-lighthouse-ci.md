---
id: CI-002
titulo: Lighthouse CI — auditoría automática por commit con aserciones (presets, minScore, maxNumericValue, presupuestos de recursos) y sus límites de variabilidad
categoria: testing
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (GoogleChrome/lighthouse-ci: docs/getting-started.md y docs/configuration.md)
versiones: @lhci/cli 0.15.x (según la guía)
perfil: ambos
ultima_revision: 2026-10-27
---

# CI-002 · Lighthouse CI

1. **Nombre y finalidad.** Impedir que un PR empeore rendimiento, accesibilidad básica o SEO técnico sin que nadie lo vea. Hueco de ARCH-001 ("Lighthouse CI"); se añade al pipeline de CI-001.
2. **Fuentes.** https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md · https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md .
3. **Ubicación.** Configuración `lighthouserc`, aserciones, presets, presupuestos, ejemplo de GitHub Actions.
4. **Resultado.** El build falla si una métrica supera su umbral; informes enlazados en el PR.
5. **Explicación técnica [doc].**
   - `lighthouserc.js|json` con `ci.collect`, `ci.assert`, `ci.upload`.
   - **collect:** `staticDistDir` (HTML estático) o `url` + `startServerCommand`; `numberOfRuns` por defecto **3**; `settings.preset: "desktop"` para escritorio (por defecto, móvil emulado).
   - **assert:** niveles `off` / `warn` (no falla) / `error` (falla); propiedades `minScore`, `maxNumericValue`, `maxLength`; agregación entre ejecuciones `median`, `optimistic`, `pessimistic`, `median-run` (si no se indica nada: `optimistic`, `minScore: 1`). Presets: `lighthouse:all` (todo perfecto, poco realista), `lighthouse:recommended` (no-rendimiento debe pasar; avisa si rendimiento < 90), `lighthouse:no-pwa`.
   - **Presupuestos:** `resource-summary:<tipo>:(size|count)` en línea (bytes) o `budgetsFile` (KB; **incompatible** con otras opciones de `assert`).
   - **upload:** `temporary-public-storage` (enlaces **públicos** temporales, sin historial) o servidor propio `lhci` (`serverBaseUrl`, `LHCI_TOKEN`).
   - **GitHub Actions (guía):** build y luego `npm install -g @lhci/cli@0.15.x && lhci autorun`; `LHCI_GITHUB_APP_TOKEN` para estados de PR; ejecutar `autorun` una vez por build en matrices.
   - **Variabilidad:** los resultados varían; máquinas mayores = más estables; empezar sin aserciones si las puntuaciones son bajas.
6. **Dependencias.** Node, `@lhci/cli`, Chrome en el runner.
7. **Procedimiento (adaptación).**
   1. Empezar con `warn` y 5 ejecuciones; pasar a `error` cuando los valores sean estables.
   2. Aserciones por métrica de laboratorio alineadas con PERF-001: `largest-contentful-paint` ≤ 2500 ms, `cumulative-layout-shift` ≤ 0,1, `total-blocking-time` como indicador de laboratorio relacionado con INP (una auditoría de navegación no tiene interacciones reales; INP se mide en campo, DEPLOY-001) [criterio propio]. Corrige la nota de CI-001, que hablaba de "INP de laboratorio".
   3. Presupuesto de JS (`resource-summary:script:size`) y de imágenes; para perfil B, presupuesto separado para la página 3D.
   4. Clientes privados → no usar `temporary-public-storage` (los informes contienen URLs y capturas).
   5. Lighthouse en CI **no sustituye** los datos de campo (CWV de usuarios reales, DEPLOY-001).
8. **Parámetros.** Umbrales, `numberOfRuns`, `aggregationMethod`, preset.
9. **Código (adaptación del ejemplo de la doc; no ejecutada):**
   ```json
   { "ci": {
     "collect": { "staticDistDir": "./dist", "numberOfRuns": 5 },
     "assert": { "preset": "lighthouse:recommended", "assertions": {
       "largest-contentful-paint": ["error", { "maxNumericValue": 2500, "aggregationMethod": "median-run" }],
       "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
       "resource-summary:script:size": ["warn", { "maxNumericValue": 200000 }] } },
     "upload": { "target": "temporary-public-storage" } } }
   ```
10. **Problemas habituales.** Umbrales estrictos con una sola ejecución (falsos fallos); auditar `localhost` sin compresión ni caché; páginas 3D que en el runner sin GPU dan cifras irreales; informes públicos de clientes; confundir puntuación de laboratorio con experiencia real.
11. **Rendimiento / a11y.** La categoría de accesibilidad de Lighthouse cubre solo comprobaciones automáticas (A11Y-005 exige pruebas manuales).
12. **Compatibilidad.** Cualquier CI con Chrome.
13. **Aplicaciones.** Mantenimiento de webs de clientes (barbería, clínica) con cambios frecuentes de contenido.
14. **Pruebas.** Introducir una imagen de 3 MB en un PR de prueba y comprobar que falla; repetir el pipeline sin cambios para medir la varianza.
15. **Estado.** Documentación leída; nada ejecutado.
