# Registro — prueba n.º 5: última repetición controlada de la recuperación automática (v0.16.0, ejecutada una vez, 2026-10-27)

Autorización: directiva "LOTE 17", fase 1 (una única prueba; mismo encargo natural; sin repetir si falla).

## Preparación [OBS]
- Copia descomprimida del **ZIP publicado** v0.16.0 (sha256 `c7e02cd5…a42a`, 287 archivos) + carpeta `sandbox/` vacía.
- Encargo idéntico al de las pruebas n.º 3 y 4 (`cmp` sin diferencias).
- Criterios, huella del verificador (`b3529fba…24c9`) y del ZIP fijados **antes** de ejecutar (`criterios_previos.txt`, 10:53:58Z). Cambios respecto a la n.º 4, todos anunciados antes: el verificador acepta "(no leída)" y "sin leer"; el área `3d` pasa a ser **obligatoria** (sin `?`), según el punto 5 de la directiva. Copia del verificador usado: `verificador_usado.py.txt`.
- Comando: el mismo de las pruebas 2–4 (`--setting-sources project --strict-mcp-config --no-chrome --tools "Read,Grep,Glob,Skill" --allowedTools "Skill(web-library-router)" --add-dir <copia> --permission-mode plan --permission-prompts none --no-session-persistence --session-id <nuevo> --max-budget-usd 3 --output-format stream-json --verbose`).

## Entorno [OBS]
Claude Code 2.1.311 · Linux (contenedor de la sesión) · suscripción · modelo `claude-sonnet-5-5` · modo `plan` · herramientas `Glob, Grep, Read, Skill`. 10:53:58Z → 10:56:10Z; 21 turnos; 125,5 s. `isUsingOverage: false`, `overageStatus: rejected`; ventana de 5 h 0,37 → 0,38.

## Secuencia real (19 llamadas; detalle con rutas relativas y sha256 en `traza.json`)
1. `Skill(web-library-router)` (primera acción, sin error) · 2. `Glob` de la raíz · 3–7. Read **KNOWLEDGE_INDEX.md**, RETRIEVAL_PROCEDURE.md, **LIBRARY_MANIFEST.json (completo)**, ARCH-001, plantilla CONSULTA · 8–19. Read completo de UX-002, SEO-002, SEO-003, A11Y-001, ST-001, LN-001, FORM-001, PERF-001, **WGPU-001 (`threejs/`)**, CSS-001, NEXT-002, SEC-002. Sin denegaciones ni errores.

## Resultado del verificador (automático) — **SUPERA** (24 de 24)
Leídas completas: A11Y-001, ARCH-001, CSS-001, FORM-001, LN-001, NEXT-002, PERF-001, SEC-002, SEO-002, SEO-003, ST-001, UX-002, WGPU-001. Mencionadas como pendientes "(no leída)": 15 (A11Y-003, A11Y-005, A11Y-007, CI-002, CLIENT-001, DS-001, GS-001, IMG-001, LEGAL-001, SEC-001, SEC-003, ST-004, ST-006, TEST-001, TYPE-001). Citadas sin marcar: 0.

## Revisión humana (independiente del verificador)
| Punto de la directiva | Resultado |
|---|---|
| 1. Activación automática | **CONFIRMADO** |
| 2. Índice | **CONFIRMADO** (Read completo) |
| 3. Manifiesto completo | **CONFIRMADO** (Read sin `limit`, 29 783 caracteres devueltos) |
| 4. Fichas por área | **CONFIRMADO**: comercial UX-002; SEO SEO-002/003; accesibilidad A11Y-001; animación/scroll ST-001, LN-001, CSS-001; reservas FORM-001, SEC-002, NEXT-002 |
| 5. Ficha Three.js antes de decidir | **CONFIRMADO**: WGPU-001 leída (orden 16) y citada en el descarte ("Lo descarto tras leer WGPU-001 y PERF-001") |
| 6. Sin atribuciones a fichas no leídas | **CONFIRMADO**: las 15 fichas "(no leída)" aparecen solo en la lista "Fichas que leería al construir" (líneas 127–135), no como fuente de ninguna decisión |
| 7. Registro con rutas absolutas | **CONFIRMADO**: secciones 1–4 con los títulos de la plantilla y ruta absoluta de las 13 fichas |
| 8. Recomendaciones fundamentadas | **CONFORME CON RESERVAS**. Contrastado con grep: UX-002 (CTA en el primer pintado, sin fotos de stock), PERF-001 (precargadores y opacidad 0 contra el LCP; SplitText multiplica nodos; umbrales y presupuesto "a validar"), A11Y-001 (`opacity: 0` sin JS; interruptor de animaciones), CSS-001 (~88 %), ST-001 (`autoAlpha`, `refresh()`, quitar `markers`), LN-001 (prescindible; `scroll-snap`; Safari), SEC-002 (lista de permitidos, *mass assignment*, antispam pendiente de fuente oficial), NEXT-002 (`Object.fromEntries`, orden validar → autenticar → autorizar → escribir → `revalidatePath`), WGPU-001 (escalera de degradación por niveles), ARCH-001 (microinteracciones solo con puntero fino y alternativa de teclado), SEO-002/003. **Reservas:** bajo el epígrafe "Formulario (FORM-001)" aparecen dos detalles que **no están en FORM-001** (`role="status"` y "sin animaciones en los errores") — conocimiento general mezclado bajo una ficha; las adaptaciones propias sí están declaradas como tales |
| 9. Integridad | **CONFIRMADO**: sha256 de los 287 archivos idéntico antes y después (`lib_before.sha`, `lib_after.sha`); sandbox vacío |

## Trazabilidad sin la carpeta temporal (fase 4)
Tras archivar y **borrar** la carpeta temporal se volvió a verificar desde una copia nueva del mismo ZIP: hash del ZIP coincidente, 17 archivos leídos con hash idéntico al de `traza.json`, y `verify_test_evidence.py --remap <raíz original>=<raíz nueva>` → **SUPERA (24/24)** (`reverificacion_sin_carpeta_original.txt`). Esto valida la **transcripción de herramientas**, no una implementación visual.

## Veredicto
- **Verificador: SUPERA. Revisión humana: CONFORME CON RESERVAS** (punto 8: dos detalles atribuidos por cercanía a FORM-001 sin estar en la ficha).
- Según la fase 2 de la directiva: **recuperación automática de conocimientos DEMOSTRADA en el entorno Linux aislado**, para este encargo, con Claude Code 2.1.311 y la Skill de v0.16.0.
- **No demostrado:** Windows; otros encargos (una sola ejecución); calidad de las webs generadas; mejora frente a trabajar sin la biblioteca; ninguna implementación se ha ejecutado.
- Siguiente hito (directiva): implementación real en un proyecto aislado (requiere autorización).
