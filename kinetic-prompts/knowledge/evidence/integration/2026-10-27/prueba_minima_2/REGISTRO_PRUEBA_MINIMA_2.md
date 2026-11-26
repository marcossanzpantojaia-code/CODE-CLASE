# Registro — prueba mínima de integración n.º 2 (v0.14.0, ejecutada una vez, 2026-10-27)

Autorización: directiva "VALIDACIÓN DE INTEGRACIÓN v0.14.0" (repetir UNA sola vez; sin `--bare` ni `--restricted`; herramientas Read, Grep, Glob, Skill; modo plan; solo la suscripción).

## Entorno [OBS]
- Contenedor Linux de la sesión de Cowork (no Windows). Claude Code **2.1.311**; autenticación de la suscripción (`apiKeySource: none` en `init`); modelo de la sesión hija `claude-sonnet-5-5`.
- Opciones comprobadas antes con `claude --help`: `--setting-sources`, `--tools`, `--allowedTools`, `--permission-mode`, `--permission-prompts`, `--add-dir`, `--strict-mcp-config`, `--no-session-persistence`, `--session-id`, `--output-format`, `--max-budget-usd`, `--no-chrome` (todas presentes).
- Biblioteca: **copia** descomprimida del ZIP v0.14.0 en una carpeta temporal (246 archivos); proyecto: carpeta `sandbox/` vacía creada para la prueba. Ambas carpetas temporales se **eliminaron** tras ejecutar el verificador y archivar las evidencias aquí.
- Inicio 2026-10-27T00:30:51Z, fin 00:31:47Z; 11 turnos; 51,3 s.

## Comando
```
claude -p --setting-sources project --strict-mcp-config --no-chrome
  --tools "Read,Grep,Glob,Skill" --allowedTools "Skill(web-library-router)"
  --add-dir <copia_v0.14.0> --permission-mode plan --permission-prompts none
  --no-session-persistence --session-id <uuid nuevo> --max-budget-usd 3
  --output-format stream-json --verbose "<prompt.txt>" < /dev/null > evidencia_prueba.jsonl
```
Diferencias con el comando documentado: `--allowedTools "Skill(web-library-router)"` (aprobación previa solo de esa Skill, añadida por precaución: no se comprobó si sin ella habría sido denegada; no añade herramientas) y `--session-id`/`--max-budget-usd` (aislamiento y tope). El prompt **nombra la Skill** (invocación manual), según la directiva.

## Consumo [OBS en `rate_limit_event`]
`isUsingOverage: false`, `overageStatus: rejected` → sin cargos adicionales posibles. Ventana de 5 h: 0,67 → 0,68. `total_cost_usd: 0.283` = estimación equivalente de API impresa por la CLI, no un cobro.

## Resultados
| Comprobación de la directiva | Resultado | Evidencia |
|---|---|---|
| Skill registrada en la sesión | **CONFIRMADO**: `web-library-router` (y las otras 3 Skills de la biblioteca) en `init.skills` | `evidencia_prueba.jsonl`, evento `init` |
| Invocación sin errores | **CONFIRMADO**: `Skill({"skill":"web-library-router"})` → `Launching skill: web-library-router`, sin `is_error` | tool_result |
| Raíz resuelta | **CONFIRMADO**: Claude Code inyectó "Base directory for this skill: …/.claude/skills/web-library-router" y sustituyó `${CLAUDE_SKILL_DIR}` en el texto de la Skill por la ruta real; LIB resuelta a la raíz de la copia | contenido de la Skill en el evento `user` |
| Lee índice y manifiesto | **CONFIRMADO**: KNOWLEDGE_INDEX.md y LIBRARY_MANIFEST.json leídos; el manifiesto llegó **completo** (137 líneas, sin truncar) y la respuesta comprobó `total_fichas: 125` | tool_use Read + tool_result |
| ≥ 5 fichas reales | **CONFIRMADO**: LEGAL-001, SEO-002 (comercial), GL-006, TJ-001 (cinematográfico), A11Y-001 (transversal) | tool_use Read |
| IDs y rutas absolutas | **CONFIRMADO** con matiz: ruta absoluta completa de LIB y de la Skill; cada ficha como `LIB/<ruta>` tras declarar el prefijo absoluto | `respuesta_final.md` §1, §4 |
| Recomendaciones fieles | **CONFIRMADO por revisión humana**: contrastado con grep sobre las fichas (SEO-002 §4: `geo` ≥ 5 decimales, sin `aggregateRating` propio, subtipo de schema pendiente; TJ-001: `renderer.info.memory`, 20 navegaciones, el material no libera texturas; GL-006 §3–§6: cabezal único, etiquetas por capítulo, móvil objetivo desde el día 1, Theatre.js 2024-04-11 y AGPL; A11Y-001: `autoAlpha`, Lenis respeta la preferencia; LEGAL-001 §6, §9, §12). Distingue documentado/no probado y no declara nada VALIDADO | este registro |
| Sin escritura ni ejecución | **CONFIRMADO**: herramientas disponibles `Glob, Grep, Read, Skill`; 0 denegaciones; sandbox vacío al terminar | `init.tools`, `permission_denials: []` |
| Verificador sobre evidencias originales | **SUPERA** (8/8 con la versión del lote 13; 10/10 con la versión ampliada en este lote: manifiesto leído y ruta absoluta citada) — ejecutado antes de borrar la carpeta temporal | `verificador_salida.txt`, `verificador_v3_salida.txt` |
| Integridad de la copia | **CONFIRMADO**: sha256 de los 246 archivos idéntico antes y después | `integridad_copia_biblioteca.txt` |
| Biblioteca original | Sin cambios: la copia coincidía con la biblioteca de trabajo (fuera de `evidence/`) | diff de sha256 |

## Observación aportada por Claude Code
La cabecera de la Skill decía "Revisada en el lote 12 (v0.13.0)" mientras el índice está en 0.14.0 → corregido en v0.14.1.

## Veredicto
**PROBADA EN ENTORNO AISLADO** la integración de **lectura e invocación manual** de la Skill `web-library-router` (Claude Code 2.1.311, Linux, `--add-dir`, v0.14.0).

**No demostrado todavía:** activación automática sin nombrar la Skill (aunque la Skill sí quedó registrada sin nombrarla, en esta prueba se pidió explícitamente); integración en Windows; calidad de las páginas generadas; mejora frente a trabajar sin la biblioteca. **Integración NO VALIDADA.**
