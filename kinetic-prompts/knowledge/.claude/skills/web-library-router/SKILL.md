---
name: web-library-router
description: Selects and loads the right techniques from WEB_ENGINEERING_KNOWLEDGE_LIBRARY before building or changing any website. Use whenever the user asks to build, redesign or animate a web page, landing, portfolio or business site, or mentions GSAP, ScrollTrigger, Lenis, Three.js, WebGL, parallax, pinning, page transitions, smooth scroll, premium or cinematic web design, even if they do not mention the library.
allowed-tools: Read Grep Glob
---

# Web library router

Estado: PROPUESTO. Lectura e invocación manual PROBADAS EN ENTORNO AISLADO (prueba n.º 2, v0.14.0); recuperación automática DEMOSTRADA en entorno Linux aislado con un encargo (prueba n.º 5, v0.16.0: 13 fichas, manifiesto e índice, ficha 3D antes del descarte, registro completo; revisión humana con una reserva); n.º 3 y 4 parciales — todas el 2026-10-27, Claude Code 2.1.311 en Linux; Windows y calidad de las webs NO demostradas. Comparación exploratoria con/sin biblioteca (lote 19, n = 1): sin mejora medible en esa pareja (`evidence/integration/2026-10-27/comparacion_A1_B1/`). Revisada en el lote 19 (v0.19.0): rutas resueltas con `${CLAUDE_SKILL_DIR}` y comprobadas con `integration/tools/library_check.py`.

## Raíz de la biblioteca (LIB) — resolver antes de nada
- **LIB = `${CLAUDE_SKILL_DIR}/../../..`** cuando esta Skill se carga desde `<biblioteca>/.claude/skills/<skill>/` (modo recomendado: `claude --add-dir <ruta de la biblioteca>`; Claude Code sustituye `${CLAUDE_SKILL_DIR}` por la carpeta real de esta Skill).
- Si la Skill se instaló copiándola fuera de la biblioteca, LIB es la ruta absoluta literal que figure en la línea `WEB_LIBRARY_ROOT=` del `CLAUDE.md` del proyecto (con barras `/`, sin `~`).
- **Comprobación obligatoria:** lee `LIB/KNOWLEDGE_INDEX.md` y anota su línea "Versión …". Si no existe, **detente** e informa de la ruta probada; no improvises con conocimiento propio.
- Todas las rutas de esta Skill son relativas a LIB.

## Pasos

1. **Perfil.** Decide si el encargo es A (web comercial: conversión, SEO, accesibilidad, rendimiento) o B (experiencia cinematográfica). Si no está claro, pregunta una sola vez. Nunca confundas espectacularidad con calidad.
2. **Técnicas.** Sigue `LIB/integration/RETRIEVAL_PROCEDURE.md` (LIB resuelta según la sección anterior). Lista las necesidades y localízalas en `KNOWLEDGE_INDEX.md` § "Búsqueda por necesidad", en `architecture/ARCH-001-receta-pagina-completa.md` y en `integration/LIBRARY_MANIFEST.json` (filtra por `perfil`, `categoria`, `estado`). El manifiesto lista cada ficha en una línea según `columnas`; comprueba que has visto `total_fichas` entradas y, si la lectura se trunca, continúa con `offset` o busca con Grep (en la prueba del 2026-10-27 un manifiesto truncado ocultó fichas pertinentes). Da siempre la ruta absoluta completa de cada ficha leída.
2b. **Cobertura del encargo (lote 16).** Lee `integration/LIBRARY_MANIFEST.json` **con la herramienta Read, completo** (un Grep de `total_fichas` no cuenta como lectura). Para **cada área** que pida el encargo — diseño comercial (`ux/`), SEO (`seo/`), accesibilidad (`accessibility/`), animación y scroll (`scrolltrigger/`, `gsap/`), formularios (`frontend/`) y 3D (`threejs/`) — lee al menos una ficha de esa carpeta **tanto si vas a aplicar el área como si vas a descartarla** (p. ej., para descartar 3D lee WGPU-001 o PERF-001 **y** una ficha de `threejs/`). Un descarte sin ficha del área no se permite.
2c. **Mapa de lectura previo por elemento (lote 22, obligatorio si el encargo es premium o cinematográfico).** Antes de diseñar cada elemento, lee:
   - **Héroe:** `ux/ART-001-direccion-de-arte-producto-heroe.md` (receta y **lista contra lo genérico**), `animations/DEPTH-001-capas-sandwich-tipografia-objeto.md`, `ux/UX-002-*` y `accessibility/A11Y-003-*` (contraste sobre el arte).
   - **Recursos del protagonista:** `frontend/AIIMG-001-integracion-de-imagenes-generadas-por-ia-en-escenas-2-5d.md` (imágenes de IA: contrato, inspección, capas, formatos; lote 27), `frontend/AIVID-001-clips-image-to-video-encadenados-para-transiciones.md` (clips de IA encadenados sin fundido; lote 29), `frontend/ASSET-001-origen-licencias-y-mascaras-de-recursos-visuales.md`, `threejs/BLEND-001-blender-para-producto-web.md`, `threejs/BLEND-002-escena-de-producto-por-script-reproducible.md` (escena por script) e `integration/ESTRATEGIA_RECURSOS_VISUALES.md`.
   - **Secuencia cinematográfica:** `animations/SEQ-001-*`, `animations/SEQ-002-*`, `animations/PROD-001-movimiento-corto-de-producto-alternativas.md` y `architecture/CASE-004-*` (casos R1).
   - **Transiciones:** `animations/MOT-001-gramatica-de-escena-por-scroll.md` (método de estados), recetas con su apartado 7b de dirección artística, `animations/CONT-001-continuidad-de-objeto-entre-escenas.md`, `transitions/TRN-001-matriz-transformaciones-de-producto.md`, recetas `recetas/REC-001…003`, `architecture/CASE-003-*` (patrones P2/P9/P10), `scrolltrigger/CARD-001-*`, `transitions/CLIP-001-*`, `transitions/MASK-001-*`.
   - **Cámara:** `threejs/CAM-003-camara-virtual-cinematografica.md` (2,5D antes que 3D) y `animations/MOT-002-*` (ExpoScaleEase para zooms, lote 28).
   - **Integración y acabado (lote 32):** `frontend/INTEG-001-integracion-y-acabado-cinematografico-de-recursos-2d.md` (Marriott *Advanced Lighting*, SonduckFilm *Hollywood Cinematic*). Técnicas WebGL de Artiukh (teletransporte, triángulos, ajedrez, IBL) en TRN-001 §Lote 32 (PROPUESTAS). Informe: `evidence/demos/2026-11-04-lote32/INFORME_LOTE32.md`.
   - **Motion blur y relevos con scroll (lote 31):** `animations/MBLUR-001-motion-blur-por-acumulacion-analitica-en-canvas.md`, EDIT-001 §Lote 31 (correcciones medidas y estrategias A/B/C de scroll), `integration/plantillas/rosso_aterrizaje_l31/` y `evidence/demos/2026-11-04-lote31/INFORME_LOTE31.md`.
   - **Edición de transiciones (lote 30):** `animations/EDIT-001-edicion-de-transiciones-de-motion-design-a-la-web.md` (relevo a máxima velocidad, match cut, anticipación, efectos desfasados; tabla de After Effects frente a GSAP y de prerenderizado frente a tiempo real) y `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE.md`. Vídeos de Marriott, Sonduck y Artiukh en `evidence/youtube/2026-11-04-lote30/registro_videos.json`.
   - **Técnicas de vídeos de expertos (lote 28):** `integration/YOUTUBE_ESTUDIOS.md` (Larose, Codegrid, Artiukh, Hyperplexed, GreenSock: qué enseña cada vídeo, qué se probó y en qué ficha está). Cita un vídeo solo con el estado que tenga en `evidence/youtube/2026-11-03-lote28/registro_videos.json`.
   - **Composición de capas:** DEPTH-001 (incluidos el *holdout* de Blender, los contextos de apilamiento y el alfa premultiplicado), `animations/TXT-001-splittext.md`.
   - **Responsive:** `ux/UX-004-*` (cabecera), `scrolltrigger/ST-006-*` (pins en móvil), SEQ-002 (juegos por dispositivo y memoria).
   - **Validación visual:** `testing/EVAL-001-*` (C1, C2, C3), `testing/TEST-003-*`, `testing/TEST-004-*`.
   - **Transformación de producto por scroll (lote 25):** sigue el flujo de 10 pasos de `web-cinematic-site`; lee además `ux/COMP-001-*` (luz y composición), `animations/MOT-002-*` (movimiento), `animations/SEQ-003-*` (interpolación y relevos), `transitions/MASK-002-*` (persianas sin costuras), `gsap/GS-005-*` (GSAP 3.15.0 ejecutado: defectos D1–D8 y plantilla `integration/plantillas/escena_gsap/`) y `testing/AUD-001-*` (auditoría visual).
   Si después de leerlas el diseño sigue cumpliendo 2 o más puntos de la lista contra lo genérico de ART-001, **rehazlo antes de escribir código**. No basta con citar las fichas: indica en `CONSULTA_BIBLIOTECA.md` qué **decisión creativa** tomaste con cada una.
3. **Carga selectiva.** Lee solo las fichas necesarias (≤ 12 por fase). No cargues carpetas completas. Usa `integration/CONSULTA_BIBLIOTECA_TEMPLATE.md` como formato del registro: si puedes escribir en el proyecto, guárdalo como `CONSULTA_BIBLIOTECA.md`; si la sesión es de solo lectura, entrégalo completo en la respuesta.
4. **Estado.** Para cada ficha, informa de su estado (INVESTIGADO / PROPUESTO / IMPLEMENTADO / VALIDADO / NO VERIFICADO). Si no es VALIDADO, añade sus pruebas (campo 14) al plan.
5. **Versiones.** Contrasta la versión de la ficha con la instalada en el proyecto y con `LIB/integration/VERSIONES_VIGENTES.md` (a 2026-10-27: Astro 7 y TypeScript 7 frente a fichas de Astro 5 y TS 5). Si difiere de forma mayor, consulta la documentación oficial antes de escribir código.
6. **Incompatibilidades conocidas** (comprobar siempre):
   - Lenis no admite CSS `scroll-snap` → `lenis/snap` (LN-001).
   - `containerAnimation` exige `ease: "none"` y no admite pin ni snap (ST-003).
   - Ancestros con `transform`/`will-change` rompen pins (ST-002).
   - Three.js no libera GPU automáticamente (TJ-001).
   - Reduced motion es obligatorio en ambos perfiles (A11Y-001).
   - `scroll-behavior: smooth` en `html` descoloca ScrollTrigger (ST-004).
   - SplitText: animar dentro de `onSplit()` con `autoSplit`; no combinar con `text-wrap: balance` (TXT-001).
   - Vídeo con scrub: esperar metadatos sin condición de carrera (VID-001).
   - Ease mal escrito (`"power3.Out"`) no avisa y cae al ease por defecto (TUT-002).
   - `gsap.to()` en cada `mousemove` sin `overwrite` acumula tweens: usar `quickTo` (HOV-001).
   - Efectos React sin limpieza (Lenis, ScrollTrigger, timelines): usar `useGSAP` (GS-001).
   - Animar `left/top/height` en vez de transforms.
   - `refreshPriority`: número **mayor** = se calcula antes (docs); la Skill oficial `gsap-scrolltrigger` dice lo contrario y su ejemplo de scroll horizontal tiene errores (GS-004).
   - three.js: `THREE.PostProcessing` y `THREE.Clock` obsoletos desde r183 → `RenderPipeline` (POST-001) y `THREE.Timer` (GL-006); `PCFSoftShadowMap` retirado en r186 (LIGHT-001); `LightMapper` aún no publicado (LIGHT-002).
   - Astro 6/7: `<ViewTransitions />` y las constantes `TRANSITION_*` eliminados (usar `<ClientRouter />` y `event.type`); colecciones *legacy* eliminadas; **TypeScript 7 no es compatible con `@astrojs/check`** → `typescript@6` (ASTRO-004, TS-001, lote 19).
   - Next.js 16 con Cache Components: datos de sesión o de petición dentro de `<Suspense>`, nunca en `'use cache'` normal (NEXT-004).
6b. **Depuración.** Ante cualquier fallo de scroll, recorre la tabla de ST-004 antes de cambiar código.
6e. **Perfil B (cinematográfico):** la calidad se juzga con los tres criterios de EVAL-001 (fidelidad visual, fidelidad de movimiento, calidad creativa); lee CASE-003 y ART-001 antes de elegir técnicas (lote 20).
7. **Delegación.** Para la API de GSAP usa las Skills oficiales `gsap-*` si están instaladas, con las correcciones de GS-004 (ante discrepancia decide la documentación de gsap.com). Después pasa a `web-commercial-site` o `web-cinematic-site`, y termina siempre con `web-qa-validation`.

6c. **Licencias.** Si una ficha indica "sin licencia" o "CC BY-NC", no copies código de la fuente: implementa a partir de la descripción.
6d. **Afirmaciones marcadas "verificar" o "[memoria]".** Compruébalas en la documentación oficial antes de usarlas y anótalo en `CONSULTA_BIBLIOTECA.md` §5.

## Reglas

- No inventes procedimientos que no estén en una ficha o en documentación oficial; si propones algo nuevo, márcalo como adaptación.
- **Cita solo IDs de fichas que hayas leído en esta sesión** con Read. Si mencionas otra ficha solo por su título en el índice, escribe exactamente "(no leída)" en la **misma línea** que el ID, también en las listas finales. (Prueba n.º 3: 46 IDs citados sin leer; n.º 4: 2, declarados.)
- **Si puedes escribir archivos, crea `CONSULTA_BIBLIOTECA.md` en el proyecto antes de terminar** (obligatorio; no basta con ponerlo en la respuesta) y usa rutas absolutas completas en todas las filas (prototipo n.º 1: no lo creó y abrevió rutas con `.../`).
- Si eliges colores, lee A11Y-003 y **mide** el contraste (no "a ojo"); si no puedes renderizar, entrega la lista de pruebas pendientes y el comando de `integration/tools/prueba_web_playwright.mjs`.
- No coloques detalles de conocimiento general bajo el nombre de una ficha: si un detalle no está en la ficha leída, márcalo "[conocimiento general]" o "adaptación propia" (prueba n.º 5: `role="status"` atribuido por cercanía a FORM-001).
- Entrega siempre, también en encargos normales, el registro con los **títulos literales** de la plantilla (`## 1. Encargo`, `## 2. Necesidades → fichas`, `## 3. Aplicación`, `## 4. Fichas consultadas y descartadas`) y, en la sección 2, la **ruta absoluta completa** de cada ficha leída (no una ruta base + relativas), al final de la respuesta o en `CONSULTA_BIBLIOTECA.md` si puedes escribir.
- No instales dependencias sin autorización del usuario.
