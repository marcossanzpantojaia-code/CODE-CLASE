# Registro — prueba n.º 3: activación automática (v0.14.1, ejecutada una vez, 2026-10-27)

Autorización: directiva del orquestador "LOTE 15", fase 1 (una única prueba de solo lectura; encargo natural sin mencionar la Skill, las Skills ni la biblioteca).

## Entorno [OBS]
- Contenedor Linux de la sesión de Cowork. Claude Code 2.1.311, suscripción; modelo de la sesión hija `claude-sonnet-5-5`; modo `plan`; herramientas `Glob, Grep, Read, Skill`.
- Copia descomprimida del ZIP v0.14.1 (257 archivos) + carpeta `sandbox/` vacía; ambas eliminadas tras verificar y archivar.
- 2026-10-27T00:43:16Z → 00:44:24Z; 13 turnos; 62,4 s. Sin exceso (`isUsingOverage: false`, `overageStatus: rejected`); ventana de 5 h 0,74 → 0,75.

## Comando
Igual que la prueba n.º 2 (`--setting-sources project --strict-mcp-config --no-chrome --tools "Read,Grep,Glob,Skill" --allowedTools "Skill(web-library-router)" --add-dir <copia> --permission-mode plan --permission-prompts none --no-session-persistence --session-id <nuevo> --max-budget-usd 3 --output-format stream-json --verbose`). `--allowedTools` es configuración de la CLI, no forma parte del encargo que ve el modelo.

## Encargo (literal, `prompt.txt`)
"Diseña el enfoque técnico para una página web premium de una barbería, con animaciones cinematográficas, scroll interactivo, reservas, SEO local y buena accesibilidad. Explica qué técnicas aplicarías y por qué. No escribas código ni archivos todavía." — el verificador confirma que no contiene ninguno de los términos vetados.

## Secuencia real de herramientas [OBS en `evidencia_prueba.jsonl`]
Texto inicial del modelo: "Voy a consultar primero la biblioteca de conocimiento del proyecto…" →
1. `Skill(web-library-router)` → "Launching skill" (sin error) — **primera acción**, antes de cualquier lectura.
2. `Glob` sobre la raíz de la biblioteca.
3–5. `Read` KNOWLEDGE_INDEX.md, integration/RETRIEVAL_PROCEDURE.md, architecture/ARCH-001.
6–11. `Read` (con `limit: 70`; todas las fichas tienen ≤ 44 líneas → lectura completa) SEO-003, SEO-002, A11Y-001, LN-001, ASTRO-002, PERF-001.
Sin denegaciones, sin escritura, sandbox vacío al terminar, copia intacta (sha256).

## Resultados por pregunta de la directiva
| Pregunta | Resultado |
|---|---|
| ¿Estaba registrada? | **SÍ** (evento `init`, junto a las otras 3 Skills de la biblioteca) |
| ¿La invocó por iniciativa propia? | **SÍ — CONFIRMADO**: encargo limpio y la Skill fue la primera llamada (verificador: MODO AUTOMÁTICA) |
| ¿Qué fichas consultó realmente? | ARCH-001, SEO-002, SEO-003, A11Y-001, LN-001, ASTRO-002, PERF-001 (+ índice y procedimiento). **Ninguna ficha de GSAP/ScrollTrigger/Three.js** |
| ¿Las decisiones proceden de las fichas? | **PARCIAL.** Las que salen de las 7 fichas leídas son fieles (comprobado con grep: PERF-001 §6 "4–21 MB compite con el LCP"; LN-001 "prescindible: justificar su uso", `scroll-snap` incompatible, ticker único, `respectReducedMotion`; ASTRO-002 colecciones Zod con `max(65)`/`max(160)`; A11Y-001 interruptor de animaciones y riesgo de `opacity: 0`; SEO-002 subtipo no verificado y sin `aggregateRating` propio; SEO-003 NAP en texto). Pero la respuesta **cita 46 IDs que no leyó** (p. ej. TXT-001, ST-005, ST-006, CLIP-001, DRAG-001, CI-002): se apoyan en los títulos del índice/ARCH-001 y en conocimiento general → **atribución no respaldada por lectura** |
| ¿Respetó las restricciones de lectura? | **SÍ** |
| ¿Errores o bloqueos? | Ninguno técnico |

## Incumplimientos de la propia Skill (observados)
- No leyó `LIBRARY_MANIFEST.json` (la Skill lo menciona como una de tres vías de localización; usó índice y ARCH-001).
- No dio rutas absolutas de las fichas ni entregó el registro CONSULTA (la Skill lo pide en sesiones de solo lectura).
- Descartó Three.js con criterio propio declarado ("las partes marcadas adaptación… son criterio mío"), sin leer WGPU-001/GL-006 — decisión razonable para un negocio local, pero no basada en la biblioteca.

## Verificador (definido ANTES de la ejecución, `--modo automatico`)
**NO SUPERA**: fallan "LIBRARY_MANIFEST.json leído" y "Respuesta cita la ruta absoluta real de la biblioteca"; los 11 restantes pasan, incluidos "Encargo sin mencionar…" y "Skill invocada antes de la primera lectura". No se han relajado los criterios a posteriori. `verificador_v5_salida.txt` añade solo información (46 IDs citados sin leer).

## Veredicto
- **Activación automática: CONFIRMADA** en esta ejecución (1 encargo, Linux, Claude Code 2.1.311, `--add-dir`).
- **Prueba completa: NO SUPERADA** — el uso de la biblioteca fue real pero parcial y con atribuciones no leídas.
- Sigue sin demostrarse: Windows, calidad de las webs, mejora frente a no usar la biblioteca, estabilidad de la activación con otros encargos.

## Corrección derivada (v0.15.0, no probada)
`web-library-router`: citar solo IDs leídos en la sesión (o marcarlos "no leída"), leer siempre el manifiesto, leer al menos una ficha por cada área del encargo (p. ej. animación y 3D si se piden), rutas absolutas y registro CONSULTA obligatorios también en encargos normales.
