# Registro — prueba n.º 4: repetición controlada de la activación automática (v0.15.0, ejecutada una vez, 2026-10-27)

Autorización: directiva "LOTE 16", fase 2 (una única repetición con la Skill corregida de v0.15.0 y el mismo encargo de la prueba n.º 3).

## Preparación
- Verificador endurecido **antes** de ejecutar (fase 1) y autoprobado con 7 casos sintéticos (`evidence/integration/2026-10-27/selftest_verify_v0.16.0.txt`). Criterios y huella sha256 del verificador fijados antes de la ejecución: `criterios_previos.txt` (2026-10-27T10:36:14Z).
- Copia del ZIP v0.15.0 (272 archivos) + carpeta `sandbox/` vacía; ambas eliminadas tras verificar y archivar.
- Encargo: **idéntico** byte a byte al de la prueba n.º 3 (`cmp` sin diferencias).
- Comando: el mismo que en las pruebas 2 y 3 (`--setting-sources project --strict-mcp-config --no-chrome --tools "Read,Grep,Glob,Skill" --allowedTools "Skill(web-library-router)" --add-dir <copia> --permission-mode plan --permission-prompts none --no-session-persistence --session-id <nuevo> --max-budget-usd 3 --output-format stream-json --verbose`).

## Entorno [OBS]
Claude Code 2.1.311, Linux (contenedor de la sesión), suscripción; modelo `claude-sonnet-5-5`; modo `plan`; herramientas `Glob, Grep, Read, Skill`. 10:36:14Z → 10:37:23Z; 21 turnos; 63,9 s. `isUsingOverage: false`, `overageStatus: rejected` (sin cargos adicionales); ventana de 5 h 0,18 → 0,19.

## Secuencia real [OBS en `evidencia_prueba.jsonl`]
1. `Skill(web-library-router)` → sin error (primera acción). 2. `Skill(web-commercial-site)` → sin error (también por iniciativa propia).
3–5. Read KNOWLEDGE_INDEX, RETRIEVAL_PROCEDURE, ARCH-001.
6. **Grep** sobre LIBRARY_MANIFEST.json solo para `"total_fichas"|"columnas"` (no lo leyó).
7–18. Read completo (sin `limit`) de 12 fichas: CLIENT-001, UX-002, ASTRO-002, FORM-001, SEO-003, A11Y-001, ST-001, GS-002, PERF-001, LEGAL-001, CSS-001, SEO-002.
Sin denegaciones; sin escritura; sandbox vacío; copia intacta (sha256).

## Verificador (criterios fijados antes) — **NO SUPERA** (5 de 24 comprobaciones fallan)
| Criterio de la directiva | Verificador | Revisión humana |
|---|---|---|
| A. Activación automática | OK (encargo limpio; Skill antes de cualquier lectura) | **CONFIRMADO** |
| B. Índice y manifiesto | Índice OK; **manifiesto FALLA** | **NO**: solo un Grep de dos claves; la respuesta lo reconoce ("No he leído el manifiesto completo") |
| C. Fichas de comercial, SEO, accesibilidad, animación y scroll | OK en las 5 áreas (UX-002, CLIENT-001; SEO-002/003; A11Y-001; ST-001, GS-002) | **CONFIRMADO** |
| D. GSAP/ScrollTrigger y, si se evalúa 3D, Three.js/WebGL | GSAP OK; **3D FALLA** | **NO**: descartó el 3D citando PERF-001 §6 (leída) y "criterio propio", sin leer ninguna ficha de `threejs/` |
| E. Sin atribuciones a fichas no leídas | **FALLA** (A11Y-003, I18N-001) | **Falso negativo del verificador en este punto**: ambas aparecen marcadas "no leída" donde se usan (líneas 50 y 68), y la lista final dice "Mencionadas sin leer" — expresión que el verificador no reconoce. No hay atribuciones sin marcar |
| F. Registro completo y rutas verificables | **FALLA** (sin secciones 1–4; rutas no literales) | **PARCIAL**: hay un "Registro de consulta" con ruta base absoluta + rutas relativas de las 15 lecturas y adaptaciones propias declaradas, pero **no** sigue el formato de la plantilla ni da la ruta absoluta completa de cada ficha |
| G. Recomendaciones fieles | — | **CONFIRMADO** (grep sobre las fichas): UX-002 (retardo compite con las pautas; fotos reales), GS-002 §13 (`smooth` ≤ 0,6 o nada en comercial), CSS-001 (~88 %), PERF-001 §8 (LCP ≤ 2,0 s, JS ≤ 60 KB, "adaptación, a validar"), ASTRO-002 §7 (formulario simulado con botón bloqueado), FORM-001 (`aria-describedby`, `:user-invalid`), ST-001 (`clamp()`), web-commercial-site (entradas ≤ 0,6 s) |
| H. Integridad | — | **CONFIRMADO** (sha256 idéntico) |

## Comparación con la prueba n.º 3 (mismo encargo)
| Indicador | n.º 3 (v0.14.1) | n.º 4 (v0.15.0) |
|---|---|---|
| Fichas leídas | 7 | 12 (+ índice, procedimiento, ARCH-001) |
| Fichas de GSAP/ScrollTrigger | 0 | 2 (ST-001, GS-002) |
| Fichas de UI/UX comercial | 0 | 2 (UX-002, CLIENT-001) |
| IDs citados sin leer | 46, sin marcar | 2, ambos declarados |
| Manifiesto | no | solo Grep |
| Registro CONSULTA | no | parcial (formato libre) |
| Ficha 3D al descartar 3D | no | no |

## Veredicto
- **Recuperación automática: PARCIAL** (mejora clara respecto a la n.º 3, pero incumple B, D y F).
- Prueba n.º 4: **NO SUPERADA**. No se repite.
- No demostrado: Windows; calidad de las webs; mejora frente a no usar la biblioteca.

## Causas probables [análisis propio]
1. La Skill dice "Lee siempre el manifiesto" pero no exige la herramienta Read ni explica que el Grep no basta.
2. La regla de 3D dice "si decides no aplicar un área, justifícalo con una ficha leída **o** márcalo como criterio propio" → la propia Skill permitía el descarte sin ficha 3D (hueco de redacción, no desobediencia).
3. El formato del registro no se exige de forma literal (secciones 1–4 con sus títulos) ni la ruta absoluta por ficha.

## Correcciones para v0.16.0 (no probadas)
- Skill: leer el manifiesto **con Read, completo**; para usar **o descartar** un área, leer al menos una ficha de esa área (3D → `threejs/`, p. ej. WGPU-001); registro con los títulos literales de la plantilla y ruta absoluta completa por ficha; marca única "(no leída)".
- Verificador: aceptar también "sin leer" como marca declarada, **solo** en la siguiente prueba y declarado antes (no se reinterpreta esta).
