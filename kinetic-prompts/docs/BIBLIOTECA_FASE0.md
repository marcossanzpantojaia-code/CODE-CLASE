# Fase 0 · Resumen de la biblioteca y candidatas

Biblioteca: `WEB_ENGINEERING_KNOWLEDGE_LIBRARY` v0.32.0 (lotes 0–32, 2026-11-04), copiada desde Google Drive a
`knowledge/` el 2026-11-26. Se copiaron los 686 archivos de texto con su estructura de carpetas y tamaño comprobado
byte a byte; los 417 de imagen y vídeo de `evidence/` y `_origen/` (59,1 MB) se quedaron en Drive (lista en
[BIBLIOTECA_OMITIDOS.md](BIBLIOTECA_OMITIDOS.md)). No se ha modificado ningún archivo de la biblioteca.

Leídos: `00_CONTEXTO_CONVERSACION.md`, `KNOWLEDGE_INDEX.md` y `architecture/ARCH-001-receta-pagina-completa.md`. Los
estados del índice se han comparado con el `estado:` de cada una de las 162 fichas: coinciden todos.

## Estado global

162 fichas por técnica (más 43 fichas de tutorial `TUT-xxx`, que no llevan estado):

| Estado        | Fichas | Nota                                                                     |
| ------------- | -----: | ------------------------------------------------------------------------ |
| INVESTIGADO   |    142 | Incluye ASTRO-001 «(parcial)» y CSS-008 «(sin verificar)»                |
| PROPUESTO     |      5 | ARCH-001, CLIENT-001, EVAL-001, BLEND-002, AIVID-001                     |
| IMPLEMENTADO  |     15 | Solo la mecánica, en microdemos con recursos de prueba (_fixtures_)      |
| VALIDADO      |      0 | Ninguna validada visualmente (criterios C1 y C3 de EVAL-001 sin evaluar) |
| NO VERIFICADO |      0 |                                                                          |

«IMPLEMENTADO» en la biblioteca no equivale a «VALIDADO» en Kinetic Prompts: todo lo que entre en el catálogo pasa
por `kp-validar`.

## Bloque 1 · Fichas útiles para Animaciones (93)

| Categoría              | Fichas | INV | PROP | IMPL | Fichas destacadas                                                                                                                                  |
| ---------------------- | -----: | --: | ---: | ---: | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transiciones de página |     11 |   9 |    0 |    2 | **MASK-002**, **EDIT-001** (IMPL) · FLIP-001 (demo medida) · CSS-002 · MENU-001 · PIX-001 · PT-001 · SECT-001 · FLIP-002 · MORPH-001 · GL-002      |
| Scroll                 |     28 |  21 |    0 |    7 | **GS-005**, **MOT-001**, **CONT-001**, **REC-001/002/003**, **SEQ-003** (IMPL) · ZOOM-001 (demo vista) · CARD-001 · ST-001…006 · CLIP-001 · PX-001 |
| Heros                  |      7 |   7 |    0 |    0 | MASK-001 · TXT3D-001 (demo vista) · DEPTH-001 · HERO-001 · SEQ-001 · PROD-001 · MOT-002                                                            |
| Texto                  |      8 |   8 |    0 |    0 | TXT-001 · TXT-002 (demo vista, variante A) · TXT-003 · TXT-004 · TXT-005 · TXT-006 · SVG-001 · CSS-003                                             |
| Microinteracciones     |     11 |  11 |    0 |    0 | HOV-001 (demo medida) · HOV-002…006 · DRAG-001 · BTN-001 · CSS-005/006/007                                                                         |
| 3D / WebGL             |     28 |  27 |    1 |    0 | GL-001…006 · R3F-001/002 · CFG-001 · CAM-001…003 · TSL-001…003 · WGPU-001 · LIGHT-001/002 · PBR-001 · GLTF-001 · INST-001/002 · BLEND-002 (PROP)   |
| **Total**              | **93** |  83 |    1 |    9 |                                                                                                                                                    |

## Bloque 2 · Fichas útiles para Webs (32)

La biblioteca no tiene las carpetas `complete-projects/` ni `ui-ux/` que cita el plan. Sus equivalentes son
`architecture/` y `recetas/` (proyectos completos) y `ux/` (UI/UX).

| Grupo                                 | Fichas | INV | PROP | IMPL | Fichas                                                                                                |
| ------------------------------------- | -----: | --: | ---: | ---: | ----------------------------------------------------------------------------------------------------- |
| Proyectos completos (`architecture/`) |     14 |  12 |    2 |    0 | ARCH-001 (PROP) · CLIENT-001 (PROP) · CASE-001…004 · NEXT-001…004 · ASTRO-001…004                     |
| UI/UX (`ux/` y parte de `frontend/`)  |     14 |  14 |    0 |    0 | UX-001…004 · UI-001/002 · COPY-001 · DS-001 · TYPE-001/002 · FORM-001 · ART-001 · COMP-001 · A11Y-007 |
| SEO (`seo/`)                          |      4 |   4 |    0 |    0 | SEO-001 · SEO-002 (LocalBusiness) · SEO-003 (SEO local) · I18N-001                                    |
| **Total**                             | **32** |  30 |    2 |    0 |                                                                                                       |

Evidencia directa para Webs: el prototipo n.º 1 de la biblioteca (lote 18) ya fue una landing de barbería construida
por Claude Code, con su evaluación y un control sin biblioteca (`evidence/integration/2026-10-27/`).

## Fichas transversales (37)

No se pedían, pero las usarán `kp-validar` y `kp-crear-web`: accesibilidad (6), rendimiento (3), pruebas y CI (9;
**TEST-003**, **TEST-004** y **AUD-001** IMPL, EVAL-001 PROP), seguridad y legal (6), base técnica (7) y producción de
recursos (6; **AIIMG-001**, **INTEG-001** y **MBLUR-001** IMPL, AIVID-001 PROP). En total: 29 INV, 2 PROP y 6 IMPL.

## Candidatas para la Fase 4 (15 fichas para 10 animaciones)

Reparto del plan: 3 transiciones, 2 de scroll, 2 de texto, 1 hero, 1 microinteracción y 1 de 3D/WebGL. Priorizadas
por estado IMPLEMENTADO y por tener código inspeccionado o demo medida.

| Hueco (plazas)   | Ficha     | Estado | Evidencia                                                     | Animación que daría                    | Riesgo / nota                                                         |
| ---------------- | --------- | ------ | ------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Transiciones (3) | MASK-002  | IMPL   | 16 combinaciones de máscara medidas, sin costuras             | Barrido de persianas o rejilla         | El tutorial original se leyó solo a través de resúmenes               |
|                  | FLIP-001  | INV    | Docs oficiales + pen MIT de GreenSock + demo medida           | Morph de tarjeta a página              | Sirve también para la transición firma de la app (Fase 3)             |
|                  | CSS-002   | INV    | MDN + Chrome (2025)                                           | Fundido entre páginas                  | Sin dependencias; degradación en navegadores sin soporte              |
|                  | MENU-001  | INV    | Código (framer-motion)                                        | Cortina con borde curvo SVG            | Hay que portarla a GSAP; la ficha no indica licencia → solo describir |
| Scroll (2)       | GS-005    | IMPL   | GSAP 3.15.0 real: 3 recetas × 3 viewports, pin, scrub, resize | Pin con progreso / storytelling        | Solo mecánica; plantilla en `integration/plantillas/escena_gsap/`     |
|                  | ZOOM-001  | INV    | Código + demo vista (lote 5)                                  | Zoom parallax de collage               | Fuente en framer-motion; la versión GSAP es adaptación                |
|                  | CARD-001  | INV    | Código (framer-motion)                                        | Pila de tarjetas con sticky            | Muy reutilizable en las webs (servicios)                              |
| Texto (2)        | TXT-002   | INV    | Código GSAP + demo vista (variante A)                         | Revelado por líneas / por scroll       | La variante B solo tiene estructura DOM                               |
|                  | TXT-001   | INV    | Docs oficiales de SplitText (3.13+)                           | Split text por letras o palabras       | Accesibilidad automática (aria) en la versión actual                  |
|                  | TXT-003   | INV    | Pen MIT literal (Hyperplexed)                                 | Scramble al hover                      | Ligera, sin dependencias                                              |
| Hero (1)         | MASK-001  | INV    | Código del repo GTA VI (10/10 secciones leídas)               | Imagen o vídeo enmascarado por logo    | Repo sin licencia → solo describir; fallos del original documentados  |
|                  | TXT3D-001 | INV    | Código R3F + demo vista                                       | Tipografía 3D                          | Pesada (three + R3F); repo sin licencia                               |
| Micro (1)        | HOV-001   | INV    | Pen de GreenSock + demo medida (quickTo)                      | Botón magnético                        | Discrepancia de duración (0,15 s / 0,5 s) registrada en la ficha      |
| 3D/WebGL (1)     | GL-003    | INV    | Código WebGL 1 + demo parcial                                 | Foto con volumen (mapa de profundidad) | Ligera; licencia de Codrops → solo describir                          |
|                  | GL-002    | INV    | Código + demo vista (1 de 8)                                  | Transición de imagen con shader        | Hay que portarla de three r109 + GSAP 2; licencia de Codrops          |

En reserva: REC-001/002/003 (IMPL, variantes de GS-005), PIX-001, PT-001, DEPTH-001, HOV-004, TXT-005 y CFG-001.
Huecos sin ficha: «contador» (texto) y «shader de fondo» (solo TSL-003 se acerca).

## Candidatas para la Fase 5 (4 webs)

**Base común:** ARCH-001 (orden de trabajo), A11Y-001, A11Y-003, PERF-001, IMG-001, SEO-001, SEO-002 y TEST-001,
y las herramientas `integration/tools/prueba_web_playwright.mjs` y `contraste_compuesto.mjs` (TEST-003).

| Web                               | Fichas                                                                                                                                       | Animaciones del catálogo    | Nota                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Barbería (comercial)              | UX-002, COPY-001, UI-002, DS-001, TYPE-002, FORM-001, UX-003 (cita con estados), SEO-003, LEGAL-001, UX-004                                  | HOV-001, TXT-002, CARD-001  | El prototipo n.º 1 (barbería) falló en la cabecera móvil: UX-004 documenta la corrección              |
| Clínica (comercial)               | Las de la barbería + SEC-002, SEC-003, A11Y-004, A11Y-006, A11Y-007, ANALYTICS-001                                                           | TXT-001, CSS-002, ST-005    | Sector sensible: formularios validados en servidor y nada de analítica de terceros sin consentimiento |
| Landing de producto 3D (cinemat.) | CASE-003, ART-001, EVAL-001, MOT-001, MOT-002, CONT-001, REC-003, GS-005, CFG-001, LIGHT-001, PBR-001, GLTF-001, WGPU-001, GL-006, AIIMG-001 | GS-005, GL-003, FLIP-001    | Falta lo más difícil: recursos fotorrealistas propios; C1 y C3 nunca se han evaluado en la biblioteca |
| Estudio creativo (cinemat.)       | CASE-002, CASE-001, UI-001, HOV-002, HOV-005, FOOT-001, ZOOM-001, MENU-001, TUT-003                                                          | ZOOM-001, MENU-001, TXT-002 | TUT-003 (landing tipo Awwwards de Olivier Larose) da la estructura de partida                         |

## Para revisar antes de la Fase 1

1. **Carpetas del plan que no existen.** `docs/PLAN.md` y `kp-crear-web` citan `complete-projects/` y `ui-ux/`. Propongo
   cambiarlas por `architecture/` + `recetas/` y `ux/`. No lo he cambiado.
2. **Skills de la biblioteca.** `knowledge/.claude/skills/` trae 4 Skills propias (`web-library-router`,
   `web-commercial-site`, `web-cinematic-site`, `web-qa-validation`; estado PROPUESTAS). Claude Code las detecta y
   pueden activarse al trabajar con archivos de `knowledge/`. Se pueden dejar o mover fuera de `.claude/`.
3. **Reglas de la biblioteca compatibles con el plan** (`00_CONTEXTO_CONVERSACION.md` §3): no copiar código sin licencia,
   presupuesto 0 €, no automatizar YouTube, estados honestos. Varias candidatas proceden de repos sin licencia: los
   prompts las describen, no copian su código.
