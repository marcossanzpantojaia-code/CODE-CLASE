# Procedimiento de recuperación selectiva (estado: PROPUESTO)

Objetivo: que Claude Code use la biblioteca **sin cargarla entera**, sepa qué está verificado y qué no, y deje rastro de lo consultado.

## Paso 1 — Clasificar el encargo (≤ 1 pregunta al usuario)
- Perfil **A** (comercial: conversión, SEO, accesibilidad, rendimiento) o **B** (cinematográfico).
- Stack: ¿proyecto existente (versiones en `package.json`) o nuevo?
- Restricciones: país (cookies/RGPD → LEGAL-001), idiomas (I18N-001), dispositivo objetivo y fps (WGPU-001).

## Paso 2 — Necesidades → fichas
1. Leer **solo** `KNOWLEDGE_INDEX.md` § "Búsqueda por necesidad" y `architecture/ARCH-001-receta-pagina-completa.md`.
2. Escribir la lista de necesidades del encargo (p. ej. "cabecera fija", "formulario de cita", "transición de página").
3. Para cada necesidad, elegir 1–3 fichas. Filtro rápido con `integration/LIBRARY_MANIFEST.json` (desde v0.14.0, una ficha por línea según `columnas`; comprobar `total_fichas`): por `perfil` (incluir `ambos`), `categoria` y `estado`.
4. **Límite:** ≤ 12 fichas por fase (planificación, construcción, QA). Si hacen falta más, priorizar las del paso de ARCH-001 en curso.

## Paso 3 — Leer cada ficha con criterio
- Leer encabezado (estado, evidencia, versiones) y los campos **Procedimiento, Parámetros, Problemas, Pruebas (14)**.
- Estado: INVESTIGADO / PROPUESTO = conocimiento documentado, **no probado** → incluir sus pruebas en el plan. IMPLEMENTADO / VALIDADO = usar con la evidencia enlazada.
- Etiquetas de evidencia: [COD] código leído, [MED] medido, [CALC] calculado, [EST] estimación, [OBS] observado; "conocimiento general, verificar" → verificar en la doc oficial **antes** de usarlo.
- Licencias: si la ficha dice "sin licencia" o "CC BY-NC", **no copiar código** de la fuente; implementar a partir de la descripción.
- Versiones: si difieren de las del proyecto, consultar la documentación oficial vigente.

## Paso 4 — Aplicar y registrar
- Al aplicar una ficha, anotar en `CONSULTA_BIBLIOTECA.md` el archivo y la decisión.
- Adaptaciones propias → marcarlas como "adaptación" (no atribuirlas a la ficha).
- Si la ficha está desactualizada o es errónea → anotarlo como "propuesta de corrección" (no editar la biblioteca desde un proyecto).

## Paso 5 — QA
- `skills/web-qa-validation` + A11Y-005 + TEST-001 + DEPLOY-001 + campo 14 de cada ficha usada.
- Adjuntar artefactos (informe Playwright, Lighthouse, capturas a 375/768/1440 px).

## Atajos por perfil
- **A comercial:** CLIENT-001 → UX-002, COPY-001, UI-002, DS-001, TYPE-002 → ASTRO-002/003 o NEXT-002/003 → FORM-001, SEC-001/002, T3-001 → SEO-001/002/003, I18N-001 → LEGAL-001, ANALYTICS-001 → PERF-001/002 → A11Y-001…005 → TEST-001, CI-001, DEPLOY-001.
- **B cinematográfico:** CLIENT-001, CASE-002 → WGPU-001 → GL-006 → LN-001/GS-002 → ST-*, TXT-*, MP-001, OBS-001/002 → R3F-001, CAM-*, SCN-001/002, TSL-001/002, INST-001/002, GL-001…004 → PT-001 → PERF-001/002, A11Y-001/002 → TEST-001.
- **Revisión de un proyecto existente:** NEXT-002 (tabla de hallazgos), NEXT-003, SEC-001/002, T3-001, A11Y-003/004/005, UX-004, PERF-001/002, DEPLOY-001.
