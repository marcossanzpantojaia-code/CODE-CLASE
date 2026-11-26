# Arquitectura de Skills — estado: PROPUESTO

Ninguna de estas Skills ha sido probada todavía con Claude Code. Son borradores para revisar.

## Principios

1. **CLAUDE.md mínimo.** Solo una línea que apunte a la biblioteca; nada de contenido técnico.
2. **Carga bajo demanda.** Cada Skill tiene un `SKILL.md` corto y lee fichas concretas de la biblioteca solo cuando las necesita (progressive disclosure: metadatos → SKILL.md → fichas).
3. **No duplicar fuentes oficiales.** Para la API de GSAP se recomienda instalar las Skills oficiales `greensock/gsap-skills` (MIT; gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-plugins, gsap-utils, gsap-react, gsap-performance, gsap-frameworks). Nuestra biblioteca aporta lo que ellas no cubren: decisión entre perfiles, integración con Lenis/Three.js, criterios de negocio, accesibilidad y validación.
4. **Estados honestos.** Una Skill solo puede afirmar que una técnica funciona si su ficha está en `VALIDADO`.

## Mapa

| Skill | Se activa cuando… | Lee |
|---|---|---|
| `web-library-router` | Se pide construir o modificar una web con diseño, animación o 3D | `KNOWLEDGE_INDEX.md` → fichas seleccionadas |
| `web-commercial-site` | Web para negocio (barbería, clínica, despacho…) | Fichas de perfil `comercial`/`ambos`, A11Y, rendimiento, SEO |
| `web-cinematic-site` | Experiencia premium con GSAP/Lenis/Three.js | Fichas `cinematografico`/`ambos`, TJ-*, LN-* |
| `web-qa-validation` | Antes de dar por terminada cualquier web, o para promover una ficha a VALIDADO | Criterios de prueba (campo 14 de cada ficha) |

## Flujo previsto en Claude Code

1. Router identifica perfil (A comercial / B cinematográfico) y técnicas necesarias.
2. Consulta el índice, carga solo las fichas relevantes y comprueba su estado.
3. Si una ficha no está VALIDADA, lo dice y añade su batería de pruebas al plan.
4. Implementa; la Skill QA ejecuta pruebas, inspecciona visualmente y corrige.
5. Si una técnica queda validada en un proyecto real, se actualiza la ficha (estado, versión, evidencia).

## Instalación

Ver `../IMPORT_GUIDE.md`. Ubicaciones admitidas por Claude Code: `~/.claude/skills/` (personal) o `.claude/skills/` (proyecto).


## Estado v0.4.0

Ajuste mínimo: `web-cinematic-site` remite al índice en lugar de listar fichas, y el router incorpora 4 incompatibilidades nuevas. Siguen sin probar. Los bloqueos de integración detectados en `INFORME_VALIDACION_v0.3.0` (ruta absoluta de la biblioteca, `~` en Windows) corresponden a la fase de integración en Claude Code y **no** se han resuelto aquí.

## Estado v0.12.0 (lote 11)

Revisión de las 4 Skills: eliminada la afirmación obsoleta de que no había fichas de SEO/seguridad/rendimiento/UI; las Skills remiten a `integration/RETRIEVAL_PROCEDURE.md`, `integration/LIBRARY_MANIFEST.json` y ARCH-001; las rutas se expresan relativas a `$WEB_LIBRARY_PATH` (los enlaces relativos `../../` dejaban de funcionar al copiar la Skill fuera de la biblioteca). IDs y rutas comprobados con `integration/tools/library_check.py` (0 errores). Guía de instalación y actualización en Windows: `integration/INTEGRATION_GUIDE.md`. **Siguen sin probar con Claude Code.**

## Estado v0.13.0 (lote 12)

- La raíz de la biblioteca se resuelve con `${CLAUDE_SKILL_DIR}/../../..` (sustitución oficial de Claude Code) cuando las Skills se cargan desde `.claude/skills/` de la biblioteca (modo `claude --add-dir <biblioteca>`), o con una línea literal `WEB_LIBRARY_ROOT=` en el `CLAUDE.md` si se copian fuera. La mención anterior a `$WEB_LIBRARY_PATH` queda retirada (era solo texto, no una variable real).
- Nuevo espejo `.claude/skills/` idéntico a `skills/` (editar siempre en `skills/` y copiar; `library_check.py` falla si difieren).
- Frontmatter comprobado frente a las convenciones vigentes (ver `integration/INTEGRATION_GUIDE.md` §5). `web-library-router` declara `allowed-tools: Read Grep Glob`.
- Siguen **PROPUESTAS**: sin probar con Claude Code.

## Estado v0.14.0 (lote 13)

- Prueba mínima del 2026-10-27 (v0.13.0, Claude Code 2.1.311): con `--restricted` + `--add-dir` las Skills **no se cargaron** (`Unknown skill`); Claude Code siguió `web-library-router` leyendo su SKILL.md. Las Skills siguen **PROPUESTAS**.
- `web-library-router`: nueva instrucción para comprobar `total_fichas` del manifiesto (formato compacto por columnas) y leer por tramos si se trunca; dar siempre rutas absolutas completas.
- `web-cinematic-site`, `web-commercial-site`, `web-qa-validation`: referencias a GLTF-001, LIGHT-001, ST-006, ST-004, ASTRO-004, A11Y-007, UI-002, CI-002 y TEST-002 (se retiró la frase obsoleta "compresión GLTF: aún sin ficha").

## Estado v0.14.1 (lote 14)

- Prueba n.º 2 (2026-10-27, v0.14.0): `web-library-router` registrada en la sesión e **invocada sin error** con `--add-dir`; `${CLAUDE_SKILL_DIR}` resuelto a la ruta real. Lectura e invocación manual **PROBADAS EN ENTORNO AISLADO** (Linux). Activación automática, Windows y calidad de las webs: no demostradas.
- Cabeceras de estado de las 4 Skills actualizadas (antes decían "lote 12").

## Estado v0.15.0 (lote 15)

- Prueba n.º 3 (encargo natural, v0.14.1): Claude Code **activó `web-library-router` por iniciativa propia**, pero leyó solo 7 fichas, ninguna de animación/3D, y citó 46 IDs sin leerlos.
- `web-library-router`: nuevas reglas — leer el manifiesto y al menos una ficha por área del encargo; citar solo IDs leídos (o marcar "no leída"); rutas absolutas y registro CONSULTA también en encargos normales; incompatibilidades nuevas (refreshPriority, PostProcessing). **Sin probar.**
- `web-cinematic-site`: referencias a LIGHT-002, POST-001 y GS-004.

## Estado v0.16.0 (lote 16)

- Prueba n.º 4 (v0.15.0, mismo encargo natural): activación automática confirmada; 12 fichas de 5 áreas; sin manifiesto (solo Grep), sin ficha 3D al descartar el 3D y registro incompleto → NO SUPERADA.
- `web-library-router`: manifiesto con Read completo; una ficha por área **también para descartarla**; títulos literales del registro y ruta absoluta por ficha; marca "(no leída)" en la misma línea. **Sin probar.**
- `web-cinematic-site`: referencia a PBR-001.

## Estado v0.17.0 (lote 17)

- Prueba n.º 5 (v0.16.0): `web-library-router` activada automáticamente con un encargo natural; recuperación completa y trazable → **recuperación automática DEMOSTRADA en Linux aislado**. Las Skills siguen sin probarse en Windows ni en una construcción real.
- `web-library-router`: nueva regla (no colocar conocimiento general bajo el nombre de una ficha) e incompatibilidades (`THREE.Clock`→`Timer`; Cache Components). `web-commercial-site`: NEXT-004, REACT-001, ASTRO-004.

## Estado v0.32.0 (lote 32)
- `web-cinematic-site`: regla 12 (INTEG-001: integración y acabado).
- `web-library-router`: INTEG-001, las técnicas WebGL de Artiukh y el informe.
- `web-qa-validation`: coste con CPU × 1 / × 4 y la coherencia de foco por plano.
- `web-commercial-site`: integración barata (grado horneado + sombra de contacto).
- Copia idéntica en `.claude/skills/`. **Sin probar con Claude Code.**

## Estado v0.31.0 (lote 31)
- `web-cinematic-site`: regla 4 corregida (relevo por composición por defecto), regla 8 (estrategia C de scroll), regla 10 (MBLUR-001) y nueva regla 11 (Hermite C1 en contactos).
- `web-library-router`: MBLUR-001, la plantilla y el informe del lote 31.
- `web-qa-validation`: medición del relevo en el último fotograma visible, blur frente a la referencia y scroll por fotograma renderizado.
- `web-commercial-site`: solo fundidos entre imágenes alineadas.
- Copia idéntica en `.claude/skills/`. **Sin probar con Claude Code.**

## Estado v0.30.0 (lote 30)
- `web-cinematic-site`: sección "Editar el cambio de escena" (EDIT-001, 10 reglas).
- `web-library-router`: EDIT-001 y la receta ROSSO en el mapa.
- `web-qa-validation`: métricas de cambio de escena (doble imagen, relevo frente a pico, nidos, meseta, scroll lento).
- `web-commercial-site`: transiciones sobrias (match cut sutil; nunca fundido entre fotos solapadas).
- Copia idéntica en `.claude/skills/`. **Sin probar con Claude Code.**

## Estado v0.29.0 (lote 29)
- `web-cinematic-site`: paso 3 del flujo con imágenes → si hay transformación o giro real, AIVID-001 (clips encadenados por el último fotograma, sin fotograma compartido, una sola secuencia, sin fundido).
- `web-library-router`: AIVID-001 en el mapa de recursos del protagonista.
- Copia idéntica en `.claude/skills/`. **Sin probar con Claude Code.**

## Estado v0.28.0 (lote 28)
- `web-cinematic-site`: tabla "técnicas extraídas de vídeos de expertos" (A–G → técnica verificada → ficha).
- `web-library-router`: mapa con `integration/YOUTUBE_ESTUDIOS.md` y regla de citar los vídeos con su estado real.
- `web-qa-validation`: pruebas de expoScale (también tras un resize), Flip.fit (≤ 2 px) y filtros SVG a pantalla completa.
- `web-commercial-site`: técnicas base de Larose (viewport, sticky, easing, SplitText accesible).
- Copia idéntica en `.claude/skills/`. **Sin probar con Claude Code.**

## Estado v0.27.0 (lote 27)
- `web-cinematic-site`: flujo obligatorio de 10 pasos con imágenes del usuario o de IA (AIIMG-001); no se inventan recursos ni hay sustitutos vectoriales; sin blend ni filtros en las capas animadas.
- `web-qa-validation`: `preparar_recursos.py` antes de C1, oclusión por alfa real y contraste del titular sobre los paneles.
- `web-library-router`: AIIMG-001 en el mapa de recursos del protagonista.
- Copia idéntica en `.claude/skills/`. **Sin probar con Claude Code.**

## Estado v0.26.0 (lote 26)
- `web-cinematic-site`: pasos 6 y 7 del flujo de 10 basados en la plantilla verificada con GSAP 3.15.0 (`integration/plantillas/escena_gsap/`) y en `validar_gsap.mjs`; revisión obligatoria de la hoja de estados.
- `web-qa-validation`: `validar_gsap.mjs` + `diferencias.py` (sustituyen a `comparar_nativo_gsap.mjs`) y rendimiento separado en script, render y fluidez.
- `web-library-router`: GS-005 con los defectos D1–D8.
- Copia idéntica en `.claude/skills/`. **Sin probar con Claude Code.**

## Estado v0.25.0 (lote 25)
- `web-cinematic-site`: flujo obligatorio de 10 pasos para "transformar un producto al hacer scroll" (identificar → consultar → elegir por recursos → estados → composición → implementar → navegador → defectos → corregir → evidencias C1/C2/C3).
- `web-library-router`: mapa 2c con COMP-001, MOT-002, SEQ-003, MASK-002, GS-005, AUD-001 y el §7b de las recetas.
- `web-qa-validation`: `auditoria_visual_escena.mjs`, `cortes_video.py`, `comparar_nativo_gsap.mjs` y la tabla "funciona pero mediocre" de EVAL-001.
- Copia idéntica en `.claude/skills/` (no se ha ejecutado `sync_skills.ps1`). **Sin probar con Claude Code.**

## Estado v0.24.0 (lote 24)

- `web-cinematic-site`: **elección de técnica por el resultado buscado** (tabla) y regla: ninguna transición se diseña solo por su nombre (estados, capas, movimiento, recursos y validación). `web-library-router` 2c: MOT-001, CONT-001, TRN-001, CAM-003 y REC-001…003. `web-qa-validation`: `medir_escena_scroll.mjs` y catálogo de fallos. **Sin probar con Claude Code.**

## Estado v0.23.0 (lote 23)

- `web-cinematic-site`: Hito A con escena por script (BLEND-002), API verificada contra la versión exacta y prohibición de simular renders. `web-qa-validation`: tabla de aceptación del Hito A. `web-library-router` 2c: BLEND-002 en los recursos del protagonista. **Sin probar con Claude Code.**

## Estado v0.22.0 (lote 22)

- `web-library-router` 2c: **mapa de lectura previo por elemento** (héroe, recursos, secuencia, transiciones, capas, responsive, validación) y obligación de registrar la decisión creativa tomada con cada ficha. `web-cinematic-site`: orden de validación A → B → C. `web-qa-validation`: C1/C2 con registros reproducibles en los hitos. **Sin probar con Claude Code.**

## Estado v0.21.0 (lote 21)

- `web-commercial-site`: un héroe premium **animado** también debe superar C2. `web-qa-validation`: herramienta `curvas_scroll.mjs`, umbrales de C1 provisionales. `web-cinematic-site`: estrategia de recursos (ASSET-001), producción y entrega (SEQ-002) y clasificación R1–R4 de referencias (CASE-004). **Sin probar con Claude Code.**

## Estado v0.20.0 (lote 20)

- `web-cinematic-site`: dirección de arte y storyboard antes del código (CASE-003, ART-001, SEQ-001, DEPTH-001) y criterios C1–C3 de EVAL-001 a la salida. `web-qa-validation`: criterios creativos obligatorios; C3 lo puntúa una persona. `web-library-router` (6e) y `web-commercial-site` (héroe premium): remiten a EVAL-001. **Sin probar con Claude Code.**

## Estado v0.19.0 (lote 19)

- Control B1 sin biblioteca: `init` sin Skills `web-*`; comparación exploratoria sin mejora medible en esa pareja.
- `web-library-router`: incompatibilidades de Astro 6/7 y TS 7. `web-commercial-site`: fallos medidos (cabecera móvil, texto sobre arte, información comercial en el héroe, foco del selector de fecha). `web-qa-validation`: `extra_generico.mjs` y `contraste_compuesto.mjs` (TEST-003/004). `web-cinematic-site`: pruebas K1–K6 del plan Astro + GSAP. **Cambios sin probar con Claude Code.**

## Estado v0.18.0 (lote 18)

- Prototipo n.º 1: `web-library-router`, `web-commercial-site` y `web-qa-validation` se activaron solas durante una construcción real; lectura de fichas antes de escribir; no creó `CONSULTA_BIBLIOTECA.md`.
- `web-library-router`: registro como archivo obligatorio, medir contraste, consultar `integration/VERSIONES_VIGENTES.md`. `web-qa-validation`: herramienta `prueba_web_playwright.mjs` y cabecera a 320/375 px. **Sin probar.**
