---
name: web-cinematic-site
description: Guides building premium cinematic web experiences with GSAP, ScrollTrigger, Lenis, Three.js and WebGL, including pinned storytelling, horizontal scroll, scroll-driven 3D scenes and page transitions, with explicit performance and accessibility budgets. Use when the user wants an award-style, immersive, cinematic or 3D website.
---

# Web cinematográfica premium

Estado: PROPUESTO (no probado: registrada en la sesión de la prueba n.º 2 del 2026-10-27, pero no invocada). Revisada en el lote 14 (v0.14.1): rutas resueltas con `${CLAUDE_SKILL_DIR}` y comprobadas con `integration/tools/library_check.py`.

## Raíz de la biblioteca (LIB) — resolver antes de nada
- **LIB = `${CLAUDE_SKILL_DIR}/../../..`** cuando esta Skill se carga desde `<biblioteca>/.claude/skills/<skill>/` (modo recomendado: `claude --add-dir <ruta de la biblioteca>`; Claude Code sustituye `${CLAUDE_SKILL_DIR}` por la carpeta real de esta Skill).
- Si la Skill se instaló copiándola fuera de la biblioteca, LIB es la ruta absoluta literal que figure en la línea `WEB_LIBRARY_ROOT=` del `CLAUDE.md` del proyecto (con barras `/`, sin `~`).
- **Comprobación obligatoria:** lee `LIB/KNOWLEDGE_INDEX.md` y anota su línea "Versión …". Si no existe, **detente** e informa de la ruta probada; no improvises con conocimiento propio.
- Todas las rutas de esta Skill son relativas a LIB.

## Dirección de arte antes del código (lote 20, obligatorio)

1. Lee `architecture/CASE-003-referencia-enky-producto-heroe-cinematografico.md` y `ux/ART-001-direccion-de-arte-producto-heroe.md`: guion de **3 actos**, **un objeto protagonista** que se transforma, paleta monocroma por acto, tipografía display en capas y luz de estudio coherente.
2. Antes de programar, entrega un **storyboard** (fotograma clave por acto + tabla de movimiento: entrada, transformación y salida de cada elemento, en % del recorrido, con su *easing*). Modelo: `integration/BRIEFING_STORYBOARD_PROTOTIPO_2.md`.
3. Decide **de dónde salen los recursos fotorrealistas** (render, fotografía o 3D en tiempo real) con `integration/ESTRATEGIA_RECURSOS_VISUALES.md` y las licencias de `frontend/ASSET-001-origen-licencias-y-mascaras-de-recursos-visuales.md`; no descargues ni generes recursos con servicios externos sin autorización. Si no los hay, dilo: con ilustraciones genéricas la web **no** puede aprobarse como cinematográfica.
4. Técnicas: objeto continuo con secuencia en canvas o vídeo (`animations/SEQ-001-secuencia-de-fotogramas-objeto-continuo.md`; producción, formato y carga escalonada en `animations/SEQ-002-produccion-y-entrega-de-secuencias-prerenderizadas.md`); capas texto/objeto y órbitas (`animations/DEPTH-001-capas-sandwich-tipografia-objeto.md`).

5. **Orden de validación (lote 22): A → B → C.** (A) un **fotograma** del protagonista con calidad de anuncio, aprobado por una persona con C1/C3; (B) un **movimiento corto** (p. ej. una apertura de 36 fotogramas, PROD-001); (C) el **control con el scroll** con GSAP. No produzcas secuencias largas ni la página completa si el hito anterior no está aprobado. Para el Hito A usa el patrón de escena por script (`threejs/BLEND-002-escena-de-producto-por-script-reproducible.md`, ejemplo `integration/blender/hitoA_navaja.py`), verifica la API contra la versión exacta de Blender y **nunca simules ni describas un render que no se haya ejecutado**. Plan modelo: `integration/PLAN_LOTE22_HITOS_ABC.md`.
6. Clasifica cada referencia (CASE-004 §3): R1 demo funcional verificada, R2 caso documentado, R3 vídeo conceptual, R4 diseño generado con IA. Las R3/R4 **no** prueban que algo sea viable en una web.

## Decidir la técnica por el RESULTADO buscado (lote 24)
**Regla: ninguna transición cinematográfica se diseña solo por su nombre.** Antes de escribir código debe existir una especificación con **estados** (0/25/50/75/100 %), **capas**, **movimiento** (tabla de pistas con mesetas), **recursos** (con licencia y calidad) y **validación** (C1/C2/C3), según `animations/MOT-001-gramatica-de-escena-por-scroll.md`. Guárdala en `CONSULTA_BIBLIOTECA.md` junto con las fichas leídas y las decisiones tomadas.

| Si el objetivo es… | Consulta primero | Decide |
|---|---|---|
| Mantener un objeto al cambiar de sección | `animations/CONT-001-continuidad-de-objeto-entre-escenas.md`, `transitions/FLIP-001-flip-transiciones-layout.md`, `scrolltrigger/ST-002-pinning.md`, `animations/SEQ-001-secuencia-de-fotogramas-objeto-continuo.md` | estrategia 1 (elemento fijado), 2 (Flip.fit) o 3 (canvas) según si cambia la forma, el layout o solo la posición |
| Pasar un producto delante (o a través) del texto | `animations/DEPTH-001-capas-sandwich-tipografia-objeto.md` (oclusión, contextos de apilamiento, alfa premultiplicado), `frontend/ASSET-001-origen-licencias-y-mascaras-de-recursos-visuales.md` | dos capas del producto (trasera y delantera) o *holdout*; solape ≤ 15 % |
| Transformar material o geometría | `transitions/TRN-001-matriz-transformaciones-de-producto.md`, `animations/SEQ-002-produccion-y-entrega-de-secuencias-prerenderizadas.md` | ¿hay una secuencia o vídeo? → úsalos; ¿solo dos imágenes compatibles? → puente (REC-002); ¿incompatibles? → máscara o fundido; **nunca** un morph inventado |
| Simular una cámara | `threejs/CAM-003-camara-virtual-cinematografica.md` | **evalúa el 2,5D antes de Three.js**; órbita → secuencia o 3D |
| Transición entre escenas | MOT-001, TRN-001, `recetas/REC-001-objeto-que-conecta-dos-secciones.md` | primero los estados y la continuidad; después el timeline |
| Producto fijo con entorno vivo | `recetas/REC-003-producto-fijo-entorno-cambiante.md` | planos de profundidad de los secundarios y legibilidad del titular |
| Tipografía cinematográfica | `animations/TXT-001-splittext.md` (apéndice del lote 24) | composición (escala, corte, relación con el objeto) antes que el revelado |

Recetas implementadas (mecánica probada, sin validación visual): REC-001, REC-002 y REC-003, con código y mediciones en `evidence/demos/2026-11-01-lote24/`. Antes de entregar, revisa el catálogo de fallos de EVAL-001 (apéndice del lote 24).

## Flujo obligatorio: "transformar un producto al hacer scroll" (lote 25)
Ante encargos como «Quiero que un producto se transforme al hacer scroll como en Enky», sigue estos 10 pasos en orden y regístralos en `CONSULTA_BIBLIOTECA.md`:
1. **Identificar el efecto** visual buscado (continuidad, transformación de material, producto fijo con entorno vivo, cambio de escena) — sin suponer qué tecnología usó la referencia.
2. **Consultar** `transitions/TRN-001-*`, `animations/MOT-001-*`, la receta que corresponda (`recetas/REC-001…003`, apartado **7b. DIRECCIÓN ARTÍSTICA APLICADA**) y `animations/MOT-002-movimiento-de-producto-cinematografico.md`.
3. **Elegir la técnica según los recursos disponibles:** secuencia o vídeo → SEQ-002/SEQ-003; dos imágenes compatibles → REC-002; incompatibles → máscara (MASK-002) o fundido. Nunca un morph inventado.
4. **Definir estados y continuidad** (0/25/50/75/100 %, mesetas, quién es el protagonista en cada tramo; CONT-001).
5. **Definir composición, luz y profundidad** con `ux/COMP-001-composicion-e-iluminacion-de-producto-para-web.md`, ART-001 y DEPTH-001 (misma luz y cámara en todos los recursos, sombra de contacto, ≥ 3 planos).
6. **Implementar** partiendo de la plantilla **verificada con GSAP 3.15.0** `integration/plantillas/escena_gsap/` (lote 26): tabla de pistas → timeline con ScrollTrigger, valores en función, `onRefresh` → `actualizar`, medidas relativas al escenario, `gsap.set` para el estado inicial (nunca `tl.set(…, 0)`), sin animar elementos con la propiedad CSS `translate`, y restauración del progreso al cruzar puntos de corte (GS-005 §3, defectos D1–D8). Pide autorización antes de instalar GSAP en el proyecto.
7. **Probar en el navegador** a 1 440 y 375 px: `integration/tools/validar_gsap.mjs` + `diferencias.py` (carga y versión de GSAP, 5 estados, pin, scrub, reversibilidad, resize, reduced motion, desmontaje, rendimiento y grabaciones) y `integration/tools/auditoria_visual_escena.mjs` (con `ocluyentes` si hay capas sobre el texto). Revisa además la **hoja de estados**: en el lote 26 tres defectos solo se vieron ahí.
8. **Detectar defectos** con la tabla «funciona pero mediocre» de EVAL-001 (apéndice del lote 25) y `integration/tools/cortes_video.py` sobre el vídeo.
9. **Corregir** (relevo sin valle, meseta legible, cobertura de partículas ≥ 3 %, `crispEdges` en máscaras…) y volver a medir.
10. **Entregar evidencias C1/C2/C3:** capturas lado a lado, curvas y JSON de auditoría, vídeo; C3 como propuesta para que la puntúe una persona. Sin recursos reales, C1 y C3 quedan NO VERIFICADOS.

## Técnicas extraídas de vídeos de expertos (lote 28; detalle en `integration/YOUTUBE_ESTUDIOS.md`)
| Necesidad Enky | Técnica verificada | Ficha |
|---|---|---|
| A · objeto que aterriza o se encaja entre escenas | `Flip.fit(cont, destino, { fitChild, scale: true, getVars: true })`; marcadores cuadrados sin CSS `translate`; para relevos por evento, `data-flip-id` + `fade` + `absolute` | CONT-001 |
| F · zoom o dolly que no "frena" | `ease: "expoScale(inicio, fin, power2.inOut)"` (EasePack); reconstruir tras el resize | MOT-002 |
| D/G · vídeo de IA por scroll | Secuencia en canvas: extracción sin pérdidas (ffmpeg), precarga tolerante, índice `progress / 0.9`, DPR + *cover*; **presupuesto de memoria** | SEQ-001/002 |
| B · desmaterializar o "decodificar" una imagen | Banda de disolución con densidad cuadrática y umbral determinista; filtro SVG de turbulencia **solo en capas del tamaño del producto** (a pantalla completa, p95 = 50 ms) | TRN-001 |
| B/G · vídeo que explota en partículas | Relevo vídeo HTML ↔ réplica WebGL (alineación por la altura del viewport, opacidad en 0,1 s al `ended`, curl + bloom). **Necesita three.js: pide autorización** | REC-002 |
| C · HTML delante y detrás de un objeto WebGL | Ambas capas consumen la misma geometría o matriz | DEPTH-001 |

## Editar el cambio de escena (lote 30, obligatorio cuando el protagonista cambia de escena)
Procedimiento de `animations/EDIT-001-edicion-de-transiciones-de-motion-design-a-la-web.md` (Marriott, Sonduck y Artiukh estudiados en vídeo):
1. **Animática primero:** timeline con fixtures rotulados; capturas y vídeo antes de pedir o integrar recursos.
2. **Elemento guía:** el gesto principal fija el ease; las pistas que lo acompañan lo reutilizan.
3. **Anticipación** en sentido contrario (2–4 %, o rotación contraria) y una espera que nunca esté quieta.
4. **Relevo de objeto** (corregido en el lote 31, medido):
   - **por defecto, por composición:** el objeto se posa, se bloquea al destino (≤ 1 px) y se funde en ~0,3 s tras una capa delantera y con sombra de contacto. Invisible a cualquier velocidad de scroll;
   - el corte de 1 fotograma a máxima velocidad **solo** sirve en vídeo de tiempo fijo y con formas casi iguales.
   - **Prohibido** el fundido entre imágenes **desalineadas** (doble imagen).
   - Mide el relevo entre el **último fotograma visible** del objeto y el primero del nuevo (no en el fotograma invisible), y su diferencia de píxeles frente a la mediana: ≤ 3×. **Un detector de cortes no aprueba un relevo.**
   - Para cambiar de forma, el protagonista del tramo es **solo la parte común** de las dos escenas.
5. **Match cut de cámara** ≤ 3–5 %: acelera hacia el corte y frena después, **con otra duración** que el objeto (desfase).
6. **Traspaso de peso:** lo que recibe el objeto se mueve en la misma dirección (25–50 % de la velocidad).
7. **Secundarios** con arranques y paradas distintos.
8. **Con `scrub`**, el usuario decide la velocidad. Comparadas en el lote 31: **elige el relevo oculto por composición con scrub reversible (estrategia C)**. Una microtransición en tiempo (B) solo si la transición debe verse completa; se salta con scroll rápido y sigue animando cuando el usuario se detiene.
9. **Fotos frente a vectores:** el *gooey*, el morph de trayectorias y el auto-trace solo valen para formas planas. Una transformación fotorrealista se prerenderiza (AIVID-001) o se hace en 3D.
10. **Motion blur:** para un protagonista 2D movido por transformaciones, usa `animations/MBLUR-001-motion-blur-por-acumulacion-analitica-en-canvas.md`. Es acumulación analítica en canvas: 180° centrado, árbol 4×4, estela limitada; validada contra una referencia de 16 subfotogramas. Nunca `filter: blur()`. Para deformaciones o giros, una secuencia renderizada con blur.
11. **Trayectorias con velocidad controlada** (Hermite C1 con claves [t, valor, velocidad]) cuando haya contacto entre objetos: en el instante del encuentro, el receptor se mueve con la misma dirección y velocidad.

12. **Acabado e integración (lote 32):** `frontend/INTEG-001-integracion-y-acabado-cinematografico-de-recursos-2d.md`:
    - grado y match **horneados** en todos los recursos;
    - sombra derivada de la silueta, en contra de la luz;
    - sombreado inferior + luz rebotada;
    - luz motivada y viñeta en CSS fijo;
    - partículas con profundidad y bokeh solo en fondos oscuros;
    - respiro de foco solo fuera del plano;
    - grano al ~4 %.
    - **Mide el coste con CPU × 1 y × 4.** Plantilla: `integration/plantillas/rosso_acabado_l32/`.

Plantilla aislada probada: `integration/plantillas/rosso_aterrizaje_l31/`. Receta: `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE_v2.md`.
Receta completa de ejemplo: `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE.md`.

## Flujo con imágenes del usuario o generadas por IA (lote 27, obligatorio)
Cuando los protagonistas sean imágenes (generadas por IA o fotografías), sigue `frontend/AIIMG-001-integracion-de-imagenes-generadas-por-ia-en-escenas-2-5d.md` §14:
1. **Recibir.**
   - Si el usuario aún no tiene imágenes, entrégale el contrato (modelo: `integration/contratos/CONTRATO_RECURSOS_REC003.md`).
   - **No inventes recursos** ni pongas vectores como sustitutos finales.
2. **Inspeccionar** con `integration/tools/preparar_recursos.py inspeccionar`: tamaño, alfa, halo, luz, elevación y color.
3. **Decidir el movimiento viable:** una imagen fija permite traslación, escala, profundidad y oclusión; un cambio de forma o un giro exige una secuencia o 3D.
   - Si la secuencia sale de clips image-to-video, sigue `frontend/AIVID-001-clips-image-to-video-encadenados-para-transiciones.md`: B parte del último fotograma de A, se elimina el fotograma compartido, todo va en **una sola secuencia** y **nunca** se usa un fundido de opacidad entre dos imágenes como transición.
4. **Preparar las capas** con `preparar_recursos.py preparar`: descontaminación, capa delantera, sombras horneadas y variantes AVIF/WebP. Calibra los nidos con la hoja.
5. **Construir el timeline** con la plantilla `integration/plantillas/rec003_recursos/`, que extiende la de GS-005.
6. **Componer** delante y detrás del titular: oclusión ≤ 15 % para la capa delantera y ≤ 5 % para el resto; cambios de profundidad solo en momentos ocultos; el titular nunca sobre un color de contraste < 4,5:1.
7. **Validar** en los dos sentidos con `validar_gsap.mjs` (1 440, 375 y 375 × 800).
8. **Optimizar:** `decode()`, memoria ≤ 60 MB y **nada de `mix-blend-mode` ni filtros en capas animadas** (causa medida de 26–38 fotogramas > 33 ms).
9. **Entregar** la hoja de estados y el vídeo.
10. **Evaluar** C1 y C2 frente a la tabla de fidelidad de cinco estados y **pedir C3 al usuario**.

## Arquitectura recomendada (a validar)

1. Un único bucle: Lenis dirigido por el ticker de GSAP y ScrollTrigger actualizado desde Lenis (LN-001).
2. Narrativa por secciones: cada una con una timeline y un ScrollTrigger (ST-001), pins solo donde la historia lo requiera (ST-002), carriles horizontales con `containerAnimation` (ST-003).
3. 3D: una sola escena/renderer reutilizado; liberar recursos al salir (TJ-001). Para escenas guiadas por scroll, cámara, configuradores, texto 3D, transiciones de escena y efectos WebGL, buscar en la sección "Búsqueda por necesidad" de `KNOWLEDGE_INDEX.md` (no listar IDs aquí: el índice es la fuente de verdad). Decisión de renderer y degradación por niveles: WGPU-001 (obligatorio leer); TSL/WebGPURenderer: TSL-001/002 (experimental según three.js); arquitectura scroll→timeline→uniforms: GL-006; casos reales: CASE-002. Compresión de modelos: GLTF-001; sombras, sombra de contacto y entorno HDR: LIGHT-001; iluminación horneada (lightmaps/AO): LIGHT-002; bloom y AO en pantalla: POST-001; materiales, color y mapeo de tono: PBR-001; GSAP frente a las Skills oficiales: GS-004. Móvil con pins largos: ST-006. Revisar el código de scroll con la tabla de ST-004.
4. En React/Next.js: `useGSAP` con scope y limpieza (GS-001).
5. Recursos de narrativa disponibles: revelado con máscara de logo (MASK-001), vídeo controlado por scroll como alternativa barata al 3D (VID-001), parallax (PX-001), titulares con SplitText (TXT-001). Referencia de estructura: CASE-001 (no es plantilla de calidad).

## Presupuestos

- Definir antes de construir: FPS objetivo, peso máximo de modelos y texturas, dispositivos soportados (si es solo escritorio, decláralo).
- Plan B sin WebGL (escalera de WGPU-001) y modo reduced motion completo (A11Y-001).
- Licencias de herramientas: p. ej. Theatre.js studio es AGPL (solo en desarrollo) — GL-006.

## Salida

Antes de terminar, invoca `web-qa-validation` y aplica los **tres criterios obligatorios** de `testing/EVAL-001-criterios-fidelidad-visual-movimiento-calidad-creativa.md`: **C1 fidelidad visual** (capturas frente al storyboard o la referencia), **C2 fidelidad de movimiento** (curvas medidas, continuidad del objeto y vídeo revisado por una persona) y **C3 calidad creativa** (rúbrica ≥ 4,0 sin dimensiones < 3, puntuada por una persona). **Nunca declares una web "cinematográfica" porque compile, pase las pruebas funcionales o use GSAP/Three.js**; si falta C2 o C3, el resultado es NO VERIFICADO.

- **Astro + GSAP (lote 19):** antes de construir, ejecutar las pruebas de compatibilidad K1–K6 de `integration/PLAN_ASTRO_GSAP.md` (versiones fijadas; TypeScript 6 con Astro).
