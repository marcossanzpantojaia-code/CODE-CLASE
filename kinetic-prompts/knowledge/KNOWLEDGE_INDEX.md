# KNOWLEDGE_INDEX — WEB_ENGINEERING_KNOWLEDGE_LIBRARY

Versión 0.32.0 · Lotes 0–32 · 2026-11-04 · **Presupuesto 0 €**: solo recursos gratuitos

> **Empieza por [00_CONTEXTO_CONVERSACION.md](00_CONTEXTO_CONVERSACION.md)**: contexto completo, reglas acordadas y trabajo pendiente. Material original y conversación literal en [_origen/](_origen/README.md).

> Ninguna ficha está VALIDADA. IMPLEMENTADAS: TEST-003 y TEST-004 (lote 19) y, desde el lote 24, MOT-001, CONT-001 y REC-001/002/003 y, desde el lote 25, AUD-001, SEQ-003 y MASK-002, y desde el lote 26 GS-005 (**GSAP 3.15.0 ejecutado de verdad** en las 3 recetas) y, desde el lote 27, AIIMG-001 (pipeline de imágenes de IA probado **con fixtures**, sin imágenes reales todavía) — **solo la mecánica**, probada en microdemos sin dependencias con recursos procedurales (reversibilidad, tiempos, reduced motion); **ninguna validada visualmente** (C1/C3). **Lote 32: +10 vídeos (Marriott ×4, SonduckFilm ×2, Artiukh ×4; 27 en total) → INTEG-001 y microprueba de acabado con coste medido.** **Lote 31: auditoría de ROSSO, relevo por composición, MBLUR-001 y estrategias de scroll medidas (fixtures, C2).** **Lote 30: +9 vídeos (Marriott, SonduckFilm, Artiukh) → 17 en total; EDIT-001 implementada con una animática medida.** **Lote 28: primeros 8 vídeos de YouTube estudiados de verdad** (transcripción de YouTube y fotogramas, en el navegador del usuario; [informe por creador](integration/YOUTUBE_ESTUDIOS.md)). Antes del lote 28 no se había visto ninguno. Lote 20: primer vídeo inspeccionado fotograma a fotograma (grabación de reels de @enkywebstudio aportada por el usuario, etiquetados por Instagram como "Contenido generado con IA") → CASE-003; nuevos criterios obligatorios C1–C3 en EVAL-001. Ningún código se ha ejecutado en terminal ni en proyectos del usuario; desde el lote 5, algunas **demos públicas** se ejecutaron en el navegador integrado para observarlas y medirlas (estado `DEMO_INSPECCIONADA`, con datos en `evidence/`). Leyenda de evidencia en las fichas: [OBS] observado en captura · [MED] medido en el DOM con datos guardados · [CALC] calculado · [EST] estimado · [COD] leído en el código.

> **Integración con Claude Code:** **recuperación automática DEMOSTRADA en entorno Linux aislado** (prueba n.º 5, 2026-10-27, v0.16.0: Skill activada sola, índice y manifiesto completos, 13 fichas de todas las áreas incluida una de `threejs/`, sin atribuciones a fichas no leídas, registro con rutas absolutas; verificador 24/24; revisión humana conforme con una reserva) — [registro](evidence/integration/2026-10-27/prueba_automatica_5/REGISTRO_PRUEBA_AUTOMATICA_5.md). **Prototipo n.º 1 (lote 18):** Claude Code construyó una landing real (HTML/CSS/JS; Astro y GSAP no disponibles) activando la biblioteca sola y leyendo 11 fichas antes de escribir; pruebas Playwright ejecutadas ([evaluación](evidence/integration/2026-10-27/prototipo_1/EVALUACION_PROTOTIPO_1.md)). **Control B1 sin biblioteca (lote 19):** misma batería sobre A1 y B1 anonimizados; en esa única pareja **no se observa mejora atribuible a la biblioteca** (exploratorio, n = 1; [comparación](evidence/integration/2026-10-27/comparacion_A1_B1/COMPARACION_PRELIMINAR.md)). Plan Astro + GSAP sin instalar: [PLAN_ASTRO_GSAP.md](integration/PLAN_ASTRO_GSAP.md). **No demostrados:** Windows, calidad profesional validada, mejora frente a no usar la biblioteca ([diseño de la comparación](integration/COMPARACION_CON_SIN_BIBLIOTECA.md)).

> **Empieza a construir por [ARCH-001](architecture/ARCH-001-receta-pagina-completa.md)**: orden de decisiones para una página completa y qué ficha consultar en cada paso.

## Fichas por técnica y conocimiento (164)

| ID | Técnica | Archivo | Perfil | Estado | Evidencia |
|---|---|---|---|---|---|
| ST-001 | Fundamentos de ScrollTrigger | [scrolltrigger/ST-001](scrolltrigger/ST-001-fundamentos-scrolltrigger.md) | ambos | INVESTIGADO | Doc. oficial |
| ST-002 | Pinning | [scrolltrigger/ST-002](scrolltrigger/ST-002-pinning.md) | ambos | INVESTIGADO | Doc. oficial |
| ST-003 | Scroll horizontal | [scrolltrigger/ST-003](scrolltrigger/ST-003-scroll-horizontal.md) | cinematográfico | INVESTIGADO | Doc. oficial |
| ST-004 | Errores frecuentes / depuración | [scrolltrigger/ST-004](scrolltrigger/ST-004-errores-frecuentes.md) | ambos | INVESTIGADO | Doc. oficial |
| FOOT-001 | Footer que se revela bajo el contenido | [scrolltrigger/FOOT-001](scrolltrigger/FOOT-001-footer-revelado-sticky.md) | ambos | INVESTIGADO | Código + artículo (TUT-020) |
| CARD-001 | Pila de tarjetas con sticky | [scrolltrigger/CARD-001](scrolltrigger/CARD-001-pila-tarjetas-sticky.md) | ambos | INVESTIGADO | Código (TUT-001) |
| ZOOM-001 | Zoom parallax de collage | [scrolltrigger/ZOOM-001](scrolltrigger/ZOOM-001-zoom-parallax-sticky.md) | ambos | INVESTIGADO | Código (TUT-011) + **demo vista** |
| VEL-001 | Skew por velocidad del scroll | [scrolltrigger/VEL-001](scrolltrigger/VEL-001-skew-por-velocidad.md) | ambos | INVESTIGADO | Código literal (lote 6); movimiento no observado |
| TXT-001 | Texto animado con SplitText | [animations/TXT-001](animations/TXT-001-splittext.md) | ambos | INVESTIGADO | Doc. oficial |
| TXT-002 | Revelados de texto (opacidad por scroll / máscara de líneas) | [animations/TXT-002](animations/TXT-002-revelado-texto-scroll-y-mascara.md) | ambos | INVESTIGADO | Código (TUT-012/013) + doc. + demo vista **solo variante A**; B: estructura DOM |
| TXT-004 | Texto sobre trazado SVG con el scroll | [animations/TXT-004](animations/TXT-004-texto-sobre-trazado.md) | ambos | INVESTIGADO | Código + artículo (TUT-020) |
| TXT-003 | Texto scramble al hover | [animations/TXT-003](animations/TXT-003-texto-scramble.md) | ambos | INVESTIGADO | Código MIT (TUT-018) |
| PX-001 | Parallax | [animations/PX-001](animations/PX-001-parallax-scrolltrigger.md) | ambos | INVESTIGADO | Código + doc. |
| VID-001 | Vídeo controlado por scroll | [animations/VID-001](animations/VID-001-video-scrub-scroll.md) | cinematográfico | INVESTIGADO | Código |
| MASK-001 | Revelado con máscara de logotipo | [transitions/MASK-001](transitions/MASK-001-revelado-mascara-logo.md) | cinematográfico | INVESTIGADO | Código |
| CLIP-001 | Revelado con clip-path ligado al scroll | [transitions/CLIP-001](transitions/CLIP-001-revelado-clip-path-scroll.md) | ambos | INVESTIGADO | Código (TUT-002) |
| SECT-001 | Transición de sección con escala y giro | [transitions/SECT-001](transitions/SECT-001-transicion-seccion-perspectiva.md) | ambos | INVESTIGADO | Código + artículo (TUT-020) |
| PIX-001 | Transición pixelada | [transitions/PIX-001](transitions/PIX-001-transicion-pixelada.md) | ambos | INVESTIGADO | Código + artículo (TUT-020) |
| FLIP-002 | Galería bento con Flip + scrub + expoScale | [transitions/FLIP-002](transitions/FLIP-002-galeria-bento-flip-scrub.md) | ambos | INVESTIGADO | Código literal + estados DOM |
| FLIP-001 | Transiciones de layout con Flip | [transitions/FLIP-001](transitions/FLIP-001-flip-transiciones-layout.md) | ambos | INVESTIGADO | Doc. oficial + código literal + **demo medida** |
| MORPH-001 | Morphing SVG (MorphSVG) | [transitions/MORPH-001](transitions/MORPH-001-morphsvg.md) | ambos | INVESTIGADO | Doc. oficial |
| SCN-001 | Transición de escenas 3D con render targets | [transitions/SCN-001](transitions/SCN-001-transicion-escenas-render-targets.md) | cinematográfico | INVESTIGADO | Código (TUT-015) |
| GL-002 | Transición de imagen con shader | [transitions/GL-002](transitions/GL-002-transicion-imagen-shader.md) | cinematográfico | INVESTIGADO | Código (TUT-009) + demo vista **solo demo 1 de 8** |
| HOV-001 | Botón magnético (quickTo) | [interactions/HOV-001](interactions/HOV-001-boton-magnetico-quickto.md) | ambos | INVESTIGADO | Larose: código (no medido) · GSAP: código + **demo medida** |
| HOV-002 | Preview que sigue al cursor | [interactions/HOV-002](interactions/HOV-002-preview-que-sigue-cursor.md) | ambos | INVESTIGADO | Código (TUT-003) |
| HOV-004 | Tarjetas con foco de luz (spotlight) | [interactions/HOV-004](interactions/HOV-004-spotlight-tarjetas.md) | ambos | INVESTIGADO | Código MIT (TUT-018) |
| DRAG-001 | Pista de imágenes arrastrable | [interactions/DRAG-001](interactions/DRAG-001-pista-imagenes-arrastrable.md) | ambos | INVESTIGADO | Código MIT (TUT-018) |
| HOV-003 | Distorsión hover en WebGL | [interactions/HOV-003](interactions/HOV-003-distorsion-hover-shader.md) | cinematográfico | INVESTIGADO | Código MIT (TUT-008) |
| LN-001 | Lenis + ScrollTrigger | [lenis/LN-001](lenis/LN-001-lenis-scrolltrigger.md) | cinematográfico | INVESTIGADO | README oficial |
| GS-001 | GSAP en React: useGSAP y limpieza | [gsap/GS-001](gsap/GS-001-react-cleanup-usegsap.md) | ambos | INVESTIGADO | README oficial |
| TJ-001 | dispose() y memoria GPU | [threejs/TJ-001](threejs/TJ-001-dispose-recursos-gpu.md) | cinematográfico | INVESTIGADO | Manual oficial |
| R3F-001 | Escena 3D guiada por scroll (ScrollControls + seek) | [threejs/R3F-001](threejs/R3F-001-scrollcontrols-timeline-seek.md) | cinematográfico | INVESTIGADO | Código (TUT-004) |
| CFG-001 | Configurador de producto 3D | [threejs/CFG-001](threejs/CFG-001-configurador-producto-r3f.md) | cinematográfico | INVESTIGADO | Código (TUT-005) |
| TXT3D-001 | Texto 3D con RenderTexture | [threejs/TXT3D-001](threejs/TXT3D-001-texto-3d-rendertexture.md) | cinematográfico | INVESTIGADO | Código (TUT-006) + **demo vista** |
| CAM-001 | Cámara Three.js animada con GSAP | [threejs/CAM-001](threejs/CAM-001-camara-threejs-gsap.md) | cinematográfico | INVESTIGADO | Artículo autor (TUT-007) |
| CAM-002 | Cámara que recorre una curva con el scroll | [threejs/CAM-002](threejs/CAM-002-camara-sobre-curva-scroll.md) | cinematográfico | INVESTIGADO | Código (TUT-014); demo bloqueada (Cloudflare) |
| GL-003 | Falso 3D con mapa de profundidad | [threejs/GL-003](threejs/GL-003-falso-3d-mapa-profundidad.md) | ambos | INVESTIGADO | Código (TUT-016) + demo parcial (código desplegado) |
| GL-001 | Planos WebGL sincronizados con el DOM | [threejs/GL-001](threejs/GL-001-planos-webgl-sincronizados-dom.md) | cinematográfico | INVESTIGADO | Código MIT (TUT-008) |
| PERF-001 | Core Web Vitals y su relación con animación/3D | [performance/PERF-001](performance/PERF-001-core-web-vitals-y-animacion.md) | ambos | INVESTIGADO | Doc. oficial (web.dev) |
| NEXT-001 | Next.js App Router para webs animadas | [architecture/NEXT-001](architecture/NEXT-001-app-router-y-animacion.md) | ambos | INVESTIGADO | Doc. oficial |
| ARCH-001 | Receta de página completa | [architecture/ARCH-001](architecture/ARCH-001-receta-pagina-completa.md) | ambos | PROPUESTO | Síntesis |
| CSS-001 | Scroll-driven animations en CSS | [css/CSS-001](css/CSS-001-scroll-driven-animations.md) | ambos | INVESTIGADO | MDN + caniuse |
| CSS-003 | Marquesina infinita con mejora progresiva | [css/CSS-003](css/CSS-003-marquesina-mejora-progresiva.md) | ambos | INVESTIGADO | Código MIT (TUT-019) |
| CSS-004 | Container queries | [css/CSS-004](css/CSS-004-container-queries.md) | ambos | INVESTIGADO | MDN |
| IMG-001 | Imágenes responsive | [frontend/IMG-001](frontend/IMG-001-imagenes-responsive.md) | ambos | INVESTIGADO | web.dev |
| TYPE-001 | Tipografía web | [frontend/TYPE-001](frontend/TYPE-001-tipografia-web.md) | ambos | INVESTIGADO | web.dev |
| FORM-001 | Formularios y validación | [frontend/FORM-001](frontend/FORM-001-formularios-validacion.md) | comercial | INVESTIGADO | web.dev |
| SEO-001 | SEO técnico básico | [seo/SEO-001](seo/SEO-001-seo-tecnico-basico.md) | ambos | INVESTIGADO | Google Search Central |
| CSS-002 | View Transitions API | [css/CSS-002](css/CSS-002-view-transitions.md) | ambos | INVESTIGADO | MDN + Chrome |
| UX-001 | Duración y easing de animaciones | [ux/UX-001](ux/UX-001-duracion-y-easing.md) | ambos | INVESTIGADO | NN/g |
| A11Y-002 | WCAG 2.2 y movimiento | [accessibility/A11Y-002](accessibility/A11Y-002-wcag-movimiento-y-contenido-animado.md) | ambos | INVESTIGADO | W3C |
| R3F-002 | Rendimiento R3F | [threejs/R3F-002](threejs/R3F-002-rendimiento-r3f.md) | cinematográfico | INVESTIGADO | Doc. oficial |
| TJ-002 | Compresión glTF | [threejs/TJ-002](threejs/TJ-002-compresion-gltf.md) | cinematográfico | INVESTIGADO | Doc. oficial |
| A11Y-003 | Contraste y tamaño de objetivos | [accessibility/A11Y-003](accessibility/A11Y-003-contraste-y-tamano-de-objetivo.md) | ambos | INVESTIGADO | W3C |
| SEC-001 | Cabeceras de seguridad y CSP (Next.js) | [security/SEC-001](security/SEC-001-cabeceras-y-csp.md) | ambos | INVESTIGADO | OWASP + Next.js |
| SEC-002 | Validación de entradas en servidor | [security/SEC-002](security/SEC-002-validacion-entradas-servidor.md) | comercial | INVESTIGADO | OWASP |
| UX-002 | Página de inicio de un negocio | [ux/UX-002](ux/UX-002-pagina-de-inicio-de-negocio.md) | comercial | INVESTIGADO | NN/g (2002) |
| SEO-002 | Metadata Next.js + LocalBusiness | [seo/SEO-002](seo/SEO-002-metadata-nextjs-y-datos-estructurados.md) | comercial | INVESTIGADO | Next.js + Google |
| A11Y-001 | Reduced motion | [accessibility/A11Y-001](accessibility/A11Y-001-reduced-motion.md) | ambos | INVESTIGADO | Doc. oficial |
| HOV-005 | Cursor pegajoso que se imanta y estira | [interactions/HOV-005](interactions/HOV-005-cursor-pegajoso.md) | ambos | INVESTIGADO | Código + artículo (TUT-021) |
| HOV-006 | Baraja de tarjetas en abanico + carrusel por estados | [interactions/HOV-006](interactions/HOV-006-baraja-de-tarjetas-kippo.md) | ambos | INVESTIGADO | Código MIT (TUT-022) |
| MENU-001 | Menú lateral con curva SVG | [transitions/MENU-001](transitions/MENU-001-menu-curvo-svg.md) | ambos | INVESTIGADO | Código + artículo (TUT-021) |
| OBS-001 | Secciones a pantalla completa con Observer | [scrolltrigger/OBS-001](scrolltrigger/OBS-001-secciones-a-pantalla-completa-observer.md) | cinematográfico | INVESTIGADO | Pen oficial MIT + docs |
| GS-002 | ScrollSmoother y elección frente a Lenis | [gsap/GS-002](gsap/GS-002-scrollsmoother-vs-lenis.md) | cinematográfico | INVESTIGADO | Docs oficiales |
| GS-003 | MotionPath (también con scroll) | [gsap/GS-003](gsap/GS-003-motionpath.md) | ambos | INVESTIGADO | Docs oficiales |
| TXT-005 | Marquesina infinita reversible con el scroll | [animations/TXT-005](animations/TXT-005-marquesina-infinita-con-scroll.md) | ambos | INVESTIGADO | Código (TUT-021) |
| GL-004 | Imagen ondulada que se expande con el scroll | [threejs/GL-004](threejs/GL-004-imagen-ondulada-scroll.md) | cinematográfico | INVESTIGADO | Código + artículo (TUT-021) |
| CSS-005 | Tarjeta HUD por capas CSS | [css/CSS-005](css/CSS-005-tarjeta-futurista-hud.md) | cinematográfico | INVESTIGADO | Código MIT (TUT-022) |
| CSS-006 | Botón de neón solo CSS | [css/CSS-006](css/CSS-006-boton-neon.md) | ambos | INVESTIGADO | Código MIT (TUT-022) |
| CSS-007 | Animar height:auto y @property | [css/CSS-007](css/CSS-007-animar-height-auto-y-property.md) | ambos | INVESTIGADO | WDS + MDN |
| UX-003 | Interfaz guiada por estados finitos | [ux/UX-003](ux/UX-003-estados-de-interfaz-como-maquina-de-estados.md) | ambos | INVESTIGADO | Código MIT (TUT-022) |
| A11Y-004 | `<dialog>` nativo, cierre y foco | [accessibility/A11Y-004](accessibility/A11Y-004-dialog-nativo-y-foco.md) | ambos | INVESTIGADO | MDN + WDS |
| TS-001 | TypeScript: tsconfig, props y validación | [frontend/TS-001](frontend/TS-001-typescript-config-y-tipos-react.md) | ambos | INVESTIGADO | Matt Pocock |
| ASTRO-001 | Astro e islas (parcial) | [architecture/ASTRO-001](architecture/ASTRO-001-arquitectura-de-islas.md) | comercial | INVESTIGADO (parcial) | Docs Astro |
| ARCH-002 | Arquitectura de una experiencia Three.js (Bruno Simon) | [architecture/ARCH-002](architecture/ARCH-002-estructura-experiencia-threejs-bruno-simon.md) | cinematográfico | INVESTIGADO | Código MIT (TUT-023) |
| TEST-001 | Pruebas E2E con Playwright | [testing/TEST-001](testing/TEST-001-playwright-buenas-practicas.md) | ambos | INVESTIGADO | Docs Playwright |
| DEPLOY-001 | Checklist de producción Next.js | [testing/DEPLOY-001](testing/DEPLOY-001-checklist-produccion-nextjs.md) | ambos | INVESTIGADO | Docs Next.js |
| MP-001 | Personaje CSS 3D que recorre un camino con el scroll | [scrolltrigger/MP-001](scrolltrigger/MP-001-personaje-por-camino-con-scroll.md) | cinematográfico | INVESTIGADO | Artículo + pen MIT (TUT-024) |
| BTN-001 | Botones con confeti, deslizar para confirmar, inclinación 3D | [interactions/BTN-001](interactions/BTN-001-botones-con-microinteraccion.md) | ambos | INVESTIGADO | Artículo + pens MIT (TUT-024) |
| PHYS-001 | Física para animar: muelles, amortiguación, oscilación | [animations/PHYS-001](animations/PHYS-001-fisica-para-animacion.md) | ambos | INVESTIGADO | Nature of Code + Fireship |
| INST-001 | InstancedMesh (miles de objetos, 1 draw call) | [threejs/INST-001](threejs/INST-001-instancedmesh.md) | cinematográfico | INVESTIGADO | Docs three.js |
| UI-001 | Estética "Linear look" (SaaS oscura) | [ux/UI-001](ux/UI-001-estetica-linear-saas.md) | cinematográfico | INVESTIGADO | Frontend Horse |
| UI-002 | Jerarquía tipográfica, CTA y paleta tint/shade | [ux/UI-002](ux/UI-002-jerarquia-cta-y-color.md) | comercial | INVESTIGADO | DesignCourse |
| UX-004 | Componentes típicos: versión rápida vs profesional | [ux/UX-004](ux/UX-004-componentes-comunes-version-rapida-vs-profesional.md) | comercial | INVESTIGADO | Código MIT Traversy |
| DS-001 | Tokens de diseño y tema claro/oscuro sin parpadeo | [css/DS-001](css/DS-001-tokens-y-tema-claro-oscuro.md) | ambos | INVESTIGADO | Coding in Public + MDN |
| TYPE-002 | Escala tipográfica fluida (Utopia) con tokens | [frontend/TYPE-002](frontend/TYPE-002-escala-tipografica-fluida-utopia.md) | ambos | INVESTIGADO | Utopia + cálculo |
| NEXT-002 | App Router completo y errores de seguridad | [architecture/NEXT-002](architecture/NEXT-002-app-router-proyecto-completo-y-errores.md) | comercial | INVESTIGADO | Net Ninja + docs |
| NEXT-003 | Decisiones Next.js (Jack Herrington) vs OWASP | [architecture/NEXT-003](architecture/NEXT-003-decisiones-de-arquitectura-jack-herrington.md) | ambos | INVESTIGADO | pronextjs.dev + OWASP |
| ASTRO-002 | Sitio Astro 5 completo | [architecture/ASTRO-002](architecture/ASTRO-002-sitio-astro-5-completo.md) | comercial | INVESTIGADO | Coding in Public |
| SEO-003 | SEO local (Perfil de Empresa) | [seo/SEO-003](seo/SEO-003-seo-local-perfil-de-empresa.md) | comercial | INVESTIGADO | Ayuda de Google |
| CLIENT-001 | Proceso de una web para un cliente (propósito → spec → entrega) | [ux/CLIENT-001](ux/CLIENT-001-proceso-web-para-cliente.md) | comercial | PROPUESTO | Flux Academy + C. Azaustre |
| PT-001 | Transiciones de página paralelas (React Router + GSAP) | [transitions/PT-001](transitions/PT-001-transiciones-de-pagina-paralelas.md) | cinematográfico | INVESTIGADO | Codrops + código (TUT-031) |
| TXT-006 | Estelas tipográficas en Canvas 2D con el scroll | [animations/TXT-006](animations/TXT-006-estelas-tipograficas-canvas.md) | cinematográfico | INVESTIGADO | Codrops |
| SVG-001 | Caligrafía con máscaras DrawSVG + navegación elástica | [animations/SVG-001](animations/SVG-001-caligrafia-y-navegacion-elastica.md) | ambos | INVESTIGADO | Motion Tricks |
| HERO-001 | Hero de prueba social con datos del CMS | [interactions/HERO-001](interactions/HERO-001-hero-de-testimonios-con-datos-del-cms.md) | comercial | INVESTIGADO | Codrops |
| ASTRO-003 | Portfolio Astro bien acabado (midudev) | [architecture/ASTRO-003](architecture/ASTRO-003-portfolio-astro-midudev.md) | comercial | INVESTIGADO | Código CC BY-NC |
| CSS-008 | CSS 2026 (scroll-triggered, VT por elemento, corner-shape) | [css/CSS-008](css/CSS-008-css-2026-segun-carlos-azaustre.md) | ambos | INVESTIGADO (sin verificar) | C. Azaustre |
| T3-001 | Axiomas T3 y variables de entorno validadas | [architecture/T3-001](architecture/T3-001-axiomas-t3-y-variables-de-entorno.md) | ambos | INVESTIGADO | Docs create.t3.gg |
| A11Y-005 | Proceso de pruebas de accesibilidad | [accessibility/A11Y-005](accessibility/A11Y-005-proceso-de-pruebas-de-accesibilidad.md) | ambos | INVESTIGADO | freeCodeCamp |
| TSL-001 | TSL y WebGPURenderer: estable vs experimental | [threejs/TSL-001](threejs/TSL-001-tsl-y-webgpurenderer.md) | cinematográfico | INVESTIGADO | Docs + ejemplos oficiales MIT |
| TSL-002 | Vidrio procedural con SDF y refracción (TSL) | [threejs/TSL-002](threejs/TSL-002-materiales-procedurales-tsl.md) | cinematográfico | INVESTIGADO | Codrops |
| WGPU-001 | WebGPU vs WebGL y escalera de degradación | [threejs/WGPU-001](threejs/WGPU-001-webgpu-vs-webgl-y-degradacion.md) | cinematográfico | INVESTIGADO | Manual three.js + caniuse |
| INST-002 | Instancing en GPU, compute y BatchedMesh | [threejs/INST-002](threejs/INST-002-instancing-gpu-tsl-compute-y-batchedmesh.md) | cinematográfico | INVESTIGADO | Ejemplos oficiales MIT + docs |
| SCN-002 | Transición entre escenas con TransitionNode | [transitions/SCN-002](transitions/SCN-002-transicion-entre-escenas-transitionnode.md) | cinematográfico | INVESTIGADO | Ejemplo oficial MIT |
| GL-006 | WebGL + GSAP + scroll: una sola timeline | [threejs/GL-006](threejs/GL-006-webgl-gsap-scroll-una-sola-timeline.md) | cinematográfico | INVESTIGADO | Síntesis + caso + Theatre.js |
| OBS-002 | Galería por gestos con fuente variable (Cassie Evans) | [scrolltrigger/OBS-002](scrolltrigger/OBS-002-galeria-por-gestos-con-fuente-variable.md) | cinematográfico | INVESTIGADO | Pen MIT |
| CASE-002 | Producción premium: casos Awwwards | [architecture/CASE-002](architecture/CASE-002-casos-awwwards-produccion-premium.md) | ambos | INVESTIGADO | Awwwards |
| LEGAL-001 | Cookies y consentimiento (AEPD 2024) | [security/LEGAL-001](security/LEGAL-001-cookies-consentimiento-espana-ue.md) | comercial | INVESTIGADO | Guía oficial AEPD |
| ANALYTICS-001 | Analítica sin consentimiento: condiciones AEPD | [security/ANALYTICS-001](security/ANALYTICS-001-analitica-respetuosa-y-exencion-aepd.md) | comercial | INVESTIGADO | Guía oficial AEPD |
| I18N-001 | Internacionalización Next.js + hreflang | [seo/I18N-001](seo/I18N-001-internacionalizacion-nextjs-y-hreflang.md) | comercial | INVESTIGADO | Next.js + Google |
| CI-001 | CI con GitHub Actions y Playwright | [testing/CI-001](testing/CI-001-integracion-continua-github-actions.md) | ambos | INVESTIGADO | Docs Playwright |
| COPY-001 | Redacción que convierte y credibilidad | [ux/COPY-001](ux/COPY-001-redaccion-y-credibilidad-para-convertir.md) | comercial | INVESTIGADO | NN/g |
| PERF-002 | Optimizar INP | [performance/PERF-002](performance/PERF-002-optimizar-inp.md) | ambos | INVESTIGADO | web.dev |
| GLTF-001 | Compresión glTF: Draco/Meshopt, KTX2, carga | [threejs/GLTF-001](threejs/GLTF-001-compresion-y-optimizacion-gltf.md) | cinematográfico | INVESTIGADO | glTF-Transform + gltfpack + Khronos |
| TSL-003 | Superficie procedural: vértices, normales, emisivo | [threejs/TSL-003](threejs/TSL-003-desplazamiento-de-vertices-y-normales.md) | cinematográfico | INVESTIGADO | Ejemplo oficial MIT |
| ST-005 | Revelados en grupo con ScrollTrigger.batch | [scrolltrigger/ST-005](scrolltrigger/ST-005-scrolltrigger-batch.md) | ambos | INVESTIGADO | Docs GSAP |
| A11Y-006 | WCAG 2.2 aplicado a la biblioteca | [accessibility/A11Y-006](accessibility/A11Y-006-wcag-22-criterios-nuevos-aplicados.md) | ambos | INVESTIGADO | W3C WAI |
| SEC-003 | Seguridad de datos en Next.js (DAL, DTO, acciones) | [security/SEC-003](security/SEC-003-seguridad-de-datos-nextjs.md) | comercial | INVESTIGADO | Docs Next.js |
| ST-006 | ScrollTrigger en móvil: normalizeScroll e ignoreMobileResize | [scrolltrigger/ST-006](scrolltrigger/ST-006-normalizescroll-y-movil.md) | cinematográfico | INVESTIGADO | Docs GSAP |
| LIGHT-001 | Sombras e iluminación (r186): coste, contacto, CSM, HDR | [threejs/LIGHT-001](threejs/LIGHT-001-sombras-e-iluminacion-threejs.md) | cinematográfico | INVESTIGADO | Manual + código three.js MIT |
| ASTRO-004 | Astro: imágenes optimizadas y View Transitions | [architecture/ASTRO-004](architecture/ASTRO-004-imagenes-y-view-transitions-astro.md) | ambos | INVESTIGADO | Docs Astro |
| TEST-002 | Regresión visual con Playwright | [testing/TEST-002](testing/TEST-002-regresion-visual-playwright.md) | ambos | INVESTIGADO | Docs Playwright |
| CI-002 | Lighthouse CI con aserciones y presupuestos | [testing/CI-002](testing/CI-002-lighthouse-ci.md) | ambos | INVESTIGADO | Docs lighthouse-ci |
| A11Y-007 | Carrusel accesible (patrón APG) | [accessibility/A11Y-007](accessibility/A11Y-007-carrusel-accesible.md) | ambos | INVESTIGADO | W3C APG |
| GS-004 | Skills oficiales de GreenSock contrastadas (contradicciones y añadidos) | [gsap/GS-004](gsap/GS-004-contraste-skills-oficiales-greensock.md) | ambos | INVESTIGADO | gsap-skills MIT + docs |
| LIGHT-002 | Iluminación horneada: lightmaps, AO, glTF desde Blender | [threejs/LIGHT-002](threejs/LIGHT-002-iluminacion-horneada-lightmaps-ao.md) | cinematográfico | INVESTIGADO | Código three.js + manual Blender (pasos de horneado sin verificar) |
| POST-001 | Posprocesado WebGPU/TSL: bloom selectivo y AO | [threejs/POST-001](threejs/POST-001-posprocesado-webgpu-tsl-bloom-ao.md) | cinematográfico | INVESTIGADO | Código three.js MIT |
| PBR-001 | Materiales PBR: espacios de color, mapeo de tono, capas físicas | [threejs/PBR-001](threejs/PBR-001-materiales-pbr-color-y-tono.md) | cinematográfico | INVESTIGADO | Código three.js MIT |
| NEXT-004 | Next.js 16: Cache Components y prerenderizado parcial | [architecture/NEXT-004](architecture/NEXT-004-cache-components-y-prerenderizado-parcial.md) | comercial | INVESTIGADO | Docs Next.js |
| REACT-001 | React 19.2: Activity, useEffectEvent y animaciones | [frontend/REACT-001](frontend/REACT-001-react-19-2-activity-useeffectevent.md) | ambos | INVESTIGADO | Blog oficial de React |
| CASE-001 | Estudio de caso: landing GTA VI | [architecture/CASE-001](architecture/CASE-001-landing-cinematografica-gta-vi.md) | cinematográfico | INVESTIGADO | Código (10/10) |
| TEST-003 | Contraste sobre degradados, imágenes y arte (muestreo de píxeles) | [testing/TEST-003](testing/TEST-003-contraste-sobre-fondos-compuestos.md) | ambos | IMPLEMENTADO | Herramienta propia (lote 19) |
| TEST-004 | Batería genérica para comparar webs de agentes | [testing/TEST-004](testing/TEST-004-bateria-generica-comparativa.md) | ambos | IMPLEMENTADO | Herramienta propia (lote 19) |
| CASE-003 | Referencia Enky: producto héroe cinematográfico (reels; vídeo inspeccionado) | [architecture/CASE-003](architecture/CASE-003-referencia-enky-producto-heroe-cinematografico.md) | cinematográfico | INVESTIGADO | Vídeo del usuario |
| SEQ-001 | Objeto continuo con secuencia de fotogramas en canvas / vídeo con alfa | [animations/SEQ-001](animations/SEQ-001-secuencia-de-fotogramas-objeto-continuo.md) | cinematográfico | INVESTIGADO | Helper GSAP + J. Archibald |
| DEPTH-001 | Capas sándwich tipografía–objeto y satélites en órbita | [animations/DEPTH-001](animations/DEPTH-001-capas-sandwich-tipografia-objeto.md) | cinematográfico | INVESTIGADO | Observación + adaptación |
| ART-001 | Dirección de arte de producto héroe (3 actos, objeto, paleta, luz) | [ux/ART-001](ux/ART-001-direccion-de-arte-producto-heroe.md) | ambos | INVESTIGADO | Observación + A1/B1 |
| EVAL-001 | Criterios obligatorios: fidelidad visual, de movimiento y calidad creativa | [testing/EVAL-001](testing/EVAL-001-criterios-fidelidad-visual-movimiento-calidad-creativa.md) | cinematográfico | PROPUESTO | Propio (lote 20) |
| SEQ-002 | Producir y entregar animación prerenderizada (WebP, vídeo all-intra, vídeo con alfa) | [animations/SEQ-002](animations/SEQ-002-produccion-y-entrega-de-secuencias-prerenderizadas.md) | cinematográfico | INVESTIGADO | OPTIKKA, Apple, Blender (código) |
| ASSET-001 | Origen, licencias y máscaras de los recursos visuales | [frontend/ASSET-001](frontend/ASSET-001-origen-licencias-y-mascaras-de-recursos-visuales.md) | ambos | INVESTIGADO | Licencias oficiales |
| CASE-004 | Casos verificables (OPTIKKA, Apple) y clasificación R1–R4 de referencias | [architecture/CASE-004](architecture/CASE-004-casos-verificables-animacion-prerenderizada.md) | cinematográfico | INVESTIGADO | Inspección DOM/red + Awwwards |
| BLEND-001 | Blender para producto web: modelo, materiales, luz, render con alfa, *holdout*, medir el coste | [threejs/BLEND-001](threejs/BLEND-001-blender-para-producto-web.md) | cinematográfico | INVESTIGADO | Código de Blender + Poly Haven + Sketchfab |
| PROD-001 | Movimiento corto de producto: 7 alternativas y prueba elegida | [animations/PROD-001](animations/PROD-001-movimiento-corto-de-producto-alternativas.md) | cinematográfico | INVESTIGADO | Síntesis + casos R1 |
| BLEND-002 | Escena de producto reproducible por script (bpy): patrón, límites, registro, verificación de la API | [threejs/BLEND-002](threejs/BLEND-002-escena-de-producto-por-script-reproducible.md) | cinematográfico | PROPUESTO | Código de Blender v5.2.3 + script propio |
| MOT-001 | Gramática de escena por scroll: estados 0–100 %, timeline con labels, mesetas, snap, coreografía, movimiento secundario | [animations/MOT-001](animations/MOT-001-gramatica-de-escena-por-scroll.md) | cinematográfico | IMPLEMENTADO | Docs GSAP + microdemos del lote 24 |
| CONT-001 | Continuidad del protagonista: elemento fijado, Flip.fit o canvas | [animations/CONT-001](animations/CONT-001-continuidad-de-objeto-entre-escenas.md) | cinematográfico | IMPLEMENTADO | Docs Flip + microdemo A |
| TRN-001 | Matriz de transformaciones de producto y escena (A–I) | [transitions/TRN-001](transitions/TRN-001-matriz-transformaciones-de-producto.md) | cinematográfico | INVESTIGADO | Síntesis + microdemo B |
| CAM-003 | Cámara virtual: 3D real, 2,5D o zoom; vocabulario de planos | [threejs/CAM-003](threejs/CAM-003-camara-virtual-cinematografica.md) | cinematográfico | INVESTIGADO | Síntesis + microdemo C |
| REC-001 | Receta A: objeto que conecta dos secciones (POUR/PLAY) | [recetas/REC-001](recetas/REC-001-objeto-que-conecta-dos-secciones.md) | cinematográfico | IMPLEMENTADO | Microdemo A medida |
| REC-002 | Receta B: transformación por partículas como puente (CREMA) | [recetas/REC-002](recetas/REC-002-transformacion-por-particulas.md) | cinematográfico | IMPLEMENTADO | Microdemo B medida |
| REC-003 | Receta C: producto fijo, entorno cambiante (ROSSO) | [recetas/REC-003](recetas/REC-003-producto-fijo-entorno-cambiante.md) | cinematográfico | IMPLEMENTADO | Microdemo C medida |
| AIIMG-001 | Imágenes generadas por IA en escenas 2,5D: contrato, inspección, matting, descontaminación, capas, sombras horneadas, AVIF/WebP, memoria | [frontend/AIIMG-001](frontend/AIIMG-001-integracion-de-imagenes-generadas-por-ia-en-escenas-2-5d.md) | cinematográfico | IMPLEMENTADO | Pipeline e integración con fixtures (lote 27) |
| AIVID-001 | Clips image-to-video encadenados para transiciones: imagen como primer fotograma, prompt de movimiento, encadenar por el último fotograma sin el fotograma compartido, cosido en una sola secuencia sin fundido | [frontend/AIVID-001](frontend/AIVID-001-clips-image-to-video-encadenados-para-transiciones.md) | cinematográfico | PROPUESTO | Guía oficial de Runway + Curious Refuge (lote 29); sin clips reales |
| INTEG-001 | Integración y acabado cinematográfico de recursos 2D: match y grado horneados, sombra de la silueta, sombreado y luz rebotada, luz motivada, partículas con profundidad y bokeh, respiro de foco, grano, viñeta; coste medido | [frontend/INTEG-001](frontend/INTEG-001-integracion-y-acabado-cinematografico-de-recursos-2d.md) | cinematográfico | IMPLEMENTADO | Marriott *Advanced Lighting* + SonduckFilm; microprueba con fixtures (lote 32) |
| AUD-001 | Auditoría visual de escenas por scroll: reversible, continua, ritmo, composición (P1–P4) y hallazgos H1–H10 | [testing/AUD-001](testing/AUD-001-auditoria-visual-de-escenas-por-scroll.md) | cinematográfico | IMPLEMENTADO | Auditoría medida de las microdemos A/B/C (lote 25) |
| SEQ-003 | Interpolación entre fotogramas y relevos sin valle | [animations/SEQ-003](animations/SEQ-003-interpolacion-y-relevos-entre-fotogramas.md) | cinematográfico | IMPLEMENTADO | Prueba sintética 12/36 fotogramas |
| MASK-002 | Máscaras SVG de persianas y rejillas; costuras medidas y corregidas | [transitions/MASK-002](transitions/MASK-002-mascaras-svg-de-persianas-y-rejillas.md) | cinematográfico | IMPLEMENTADO | Caso H. Watanabe (Codrops, vía resúmenes) + 16 combinaciones medidas |
| GS-005 | Escenas por scroll con GSAP 3.15.0 real: pistas → timeline, pin/sticky, scrub medido, resize, matchMedia, desmontaje, 8 defectos corregidos | [gsap/GS-005](gsap/GS-005-de-motor-propio-a-gsap-real-en-escenas-por-scroll.md) | cinematográfico | IMPLEMENTADO | 3 recetas × 3 viewports ejecutadas con GSAP 3.15.0 (lote 26) |
| MOT-002 | Movimiento de producto: arco, continuidad de velocidad, anticipación, secundario, desenfoque, cámara frente a objeto | [animations/MOT-002](animations/MOT-002-movimiento-de-producto-cinematografico.md) | cinematográfico | INVESTIGADO | Helpers GSAP + CASE-003 |
| EDIT-001 | Edición de transiciones de motion design en la web: animática, elemento guía, anticipación, relevo a máxima velocidad, match cut, secundarios escalonados, efectos desfasados, AE frente a GSAP, prerenderizado frente a tiempo real, el problema del scroll | [animations/EDIT-001](animations/EDIT-001-edicion-de-transiciones-de-motion-design-a-la-web.md) | cinematográfico | IMPLEMENTADO | Vídeos de Marriott, Sonduck y Artiukh + animática ROSSO medida (lote 30) |
| MBLUR-001 | Motion blur en el navegador para recursos 2D: acumulación analítica en canvas (180° centrado, árbol 4×4 contra el sesgo de 8 bits, estela limitada); qué aproximación sirve para cada recurso | [animations/MBLUR-001](animations/MBLUR-001-motion-blur-por-acumulacion-analitica-en-canvas.md) | cinematográfico | IMPLEMENTADO | Medido frente a una referencia de 16 subfotogramas; scroll lento, rápido e inverso (lote 31) |
| COMP-001 | Composición e iluminación de producto para web (gradientes, negros, sombra de contacto, coherencia) | [ux/COMP-001](ux/COMP-001-composicion-e-iluminacion-de-producto-para-web.md) | cinematográfico | INVESTIGADO | Karl Taylor (Fstoppers), J. Lenton (PetaPixel) |
| FONDO-001 | Fondo de manchas de color en movimiento solo con CSS | [fondos/FONDO-001](fondos/FONDO-001-manchas-de-color-en-movimiento-css.md) | ambos | IMPLEMENTADO | MDN + web.dev + demo propia validada (Kinetic Prompts, 2026-11-28) |
| FONDO-002 | Fondo de constelación de partículas en canvas 2D (líneas entre vecinos, cursor) | [fondos/FONDO-002](fondos/FONDO-002-constelacion-de-particulas-canvas.md) | ambos | IMPLEMENTADO | MDN (canvas) + demo propia validada (Kinetic Prompts, 2026-11-28) |

## Fichas por tutorial

43 fichas TUT-001…TUT-043 → [tutorials/README.md](tutorials/README.md).

## Búsqueda por necesidad

| Necesito… | Ficha |
|---|---|
| Animar al hacer scroll | ST-001 |
| Mi animación de scroll falla | ST-004 |
| Fijar una sección | ST-002 |
| Tarjetas que se apilan | CARD-001 |
| Galería lateral | ST-003 |
| Titulares que se revelan | TXT-001, TXT-002 |
| Párrafo que se ilumina al leer | TXT-002 |
| Animar un cambio de layout (filtros, ampliar tarjeta) | FLIP-001 |
| Icono o forma que se transforma | MORPH-001 |
| Entrar en una imagen / collage al hacer scroll | ZOOM-001 |
| Inercia al hacer scroll rápido | VEL-001 |
| Profundidad / capas | PX-001 |
| Imagen que se abre al hacer scroll | CLIP-001 |
| Producto que "se mueve" con el scroll sin 3D | VID-001 |
| Hero de impacto con logotipo | MASK-001 |
| Microinteracción en botones / CTA | HOV-001 |
| Lista de proyectos con miniatura al hover | HOV-002 |
| Efecto hover/distorsión en imágenes (WebGL) | GL-001 + HOV-003 |
| Slider con transiciones creativas | GL-002 |
| Scroll suave | LN-001 |
| React/Next.js sin fugas | GS-001 |
| Escena 3D que cuenta una historia con el scroll | R3F-001, CAM-001, CAM-002 |
| Cambiar de ambiente en una escena 3D | SCN-001 |
| Foto con volumen sin modelo 3D | GL-003 |
| Configurador de producto 3D | CFG-001 |
| Titular 3D espectacular | TXT3D-001 |
| 3D sin fugas de memoria | TJ-001 |
| Accesibilidad del movimiento | A11Y-001, A11Y-002, TXT-001 |
| Construir una página completa (orden de trabajo) | ARCH-001 |
| Página rápida (LCP/INP/CLS) | PERF-001, IMG-001 |
| Imágenes del tamaño justo | IMG-001 |
| Componente que se adapta a su columna | CSS-004 |
| Escala tipográfica fluida y legible | TYPE-001 |
| Formulario de reserva/contacto | FORM-001 |
| Posicionamiento en Google | SEO-001, SEO-002 |
| Footer grande que se descubre al final | FOOT-001 |
| Cambio de sección con efecto de profundidad | SECT-001 |
| Texto que recorre una curva | TXT-004 |
| Transición de menú/página pixelada | PIX-001 |
| Seguridad básica de la web | SEC-001, SEC-002 |
| Contraste y botones táctiles | A11Y-003 |
| Qué debe tener la home de un negocio | UX-002 |
| Cobertura de cada canal investigado | [CHANNEL_COVERAGE.md](CHANNEL_COVERAGE.md) |
| Cursor personalizado / botón magnético | HOV-005, HOV-001 |
| Menú a pantalla completa | MENU-001, A11Y-004 |
| Web tipo diapositivas (una sección por gesto) | OBS-001 |
| Scroll suave: ¿Lenis o ScrollSmoother? | GS-002, LN-001 |
| Objeto que recorre un camino | GS-003, CAM-001/002 |
| Galería de fotos en abanico | HOV-006 |
| Formulario de cita con estados (enviando, error, éxito) | UX-003, TS-001, SEC-002 |
| Modal accesible | A11Y-004 |
| Acordeón / FAQ animado | CSS-007 |
| Botón llamativo de neón | CSS-006 |
| ¿Next.js o Astro? | ASTRO-001, NEXT-001 |
| Tests antes de publicar | TEST-001, DEPLOY-001 |
| Organizar un proyecto Three.js grande | ARCH-002 |
| Colores, tipos y espacios coherentes (sistema de diseño) | DS-001, TYPE-002, UI-002 |
| Modo oscuro | DS-001 |
| Jerarquía visual y botones principales | UI-002 |
| Estilo SaaS/tecnológico oscuro | UI-001 |
| Botón con recompensa visual | BTN-001, CSS-006 |
| Valores de muelle / rebote | PHYS-001 |
| Personaje u objeto que avanza con el scroll | MP-001, GS-003 |
| Muchas partículas/objetos 3D | INST-001 |
| Área privada / reservas en Next.js | NEXT-002, NEXT-003 |
| ¿Server Actions o API? | NEXT-003 |
| Web Astro con blog y servicios | ASTRO-002, ASTRO-001 |
| Aparecer en Google Maps | SEO-003, SEO-002 |
| Revisar un componente copiado de un tutorial | UX-004 |
| Empezar un proyecto para un cliente | CLIENT-001, ARCH-001 |
| Transición entre páginas sin pantallazo | PT-001, CSS-002 |
| Firma o rótulo que se escribe solo | SVG-001 |
| Mostrar clientes/cifras con movimiento | HERO-001 |
| Variables de entorno y secretos | T3-001 |
| Revisar accesibilidad antes de entregar | A11Y-005 |
| CSS nuevo de 2026 | CSS-008 |
| Web personal/one-page en Astro | ASTRO-003 |
| ¿WebGPU o WebGL? Plan B del 3D | WGPU-001, TSL-001 |
| Shaders/materiales procedurales con TSL | TSL-001, TSL-002 |
| Transición entre escenas 3D | SCN-002, SCN-001 |
| Cientos de miles de partículas | INST-002, INST-001 |
| Scroll que controla toda la escena 3D | GL-006, R3F-001 |
| Banner de cookies legal en España | LEGAL-001 |
| Analítica sin banner (condiciones) | ANALYTICS-001 |
| Web en varios idiomas | I18N-001 |
| Textos que convierten | COPY-001, UI-002 |
| CI y pruebas automáticas | CI-001, TEST-001, TEST-002, CI-002, TEST-004 |
| La web tarda en responder al tocar | PERF-002 |
| Modelo 3D muy pesado | GLTF-001 |
| Fondo de color vivo y ligero para un hero, sin JS | FONDO-001 |
| Fondo de red o constelación de partículas, que reacciona al cursor | FONDO-002 |
| Mar, tela o terreno animado en shader | TSL-003, GL-004 |
| Tarjetas que aparecen en grupo al hacer scroll | ST-005 |
| Cumplir WCAG 2.2 (foco, arrastre, formularios) | A11Y-006 |
| Proteger datos en Next.js | SEC-003, NEXT-002 |
| Pins que tiemblan o barra de direcciones en móvil | ST-006 |
| Sombras realistas sin hundir los fps | LIGHT-001 |
| Producto 3D flotando con sombra suave | LIGHT-001 (sombra de contacto), CFG-001 |
| Imágenes optimizadas en Astro | ASTRO-004, IMG-001 |
| Transiciones entre páginas en Astro sin romper GSAP | ASTRO-004, CSS-002 |
| Detectar cambios visuales en cada PR | TEST-002 |
| Que un PR no empeore el rendimiento | CI-002, PERF-001 |
| Carrusel de opiniones o galería accesible | A11Y-007, DRAG-001 |
| Recorrido de cámara por planos con el scroll | CAM-001 (lote 13), CAM-002 |
| Jerarquía visual (color, escala, agrupación) | UI-002 |
| Usar las Skills oficiales de GSAP sin caer en sus errores | GS-004 |
| Contraste de texto sobre degradado, foto o ilustración | TEST-003, A11Y-003 |
| Comparar dos webs con las mismas pruebas (con/sin biblioteca) | TEST-004 |
| Actualizar un proyecto Astro 5 a Astro 6/7 (TypeScript 6) | ASTRO-004, TS-001 |
| Cabecera móvil que se parte en dos filas | UX-004 |
| Web de nivel "anuncio" con un producto protagonista | ART-001, CASE-003, SEQ-001, DEPTH-001 |
| Objeto que se transforma de una sección a otra con el scroll | SEQ-001, VID-001 |
| Texto detrás y delante del objeto; etiquetas que orbitan | DEPTH-001 |
| Aprobar (o no) una web como cinematográfica | EVAL-001 |
| Storyboard antes de programar | ART-001, `integration/BRIEFING_STORYBOARD_PROTOTIPO_2.md` |
| ¿Secuencia de imágenes o vídeo para el scroll? | SEQ-002, SEQ-001, VID-001 |
| De dónde saco fotos, renders o vídeos y con qué licencia | ASSET-001, `integration/ESTRATEGIA_RECURSOS_VISUALES.md` |
| ¿Esta referencia es una web real o un vídeo/IA? | CASE-004 |
| Medir cómo entra y sale cada elemento con el scroll | EVAL-001 (C2), `integration/tools/curvas_scroll.mjs` |
| Fotograma de producto con calidad de anuncio (Blender) | BLEND-001, BLEND-002, ART-001, `integration/INFORME_VIABILIDAD_HITO_A.md` |
| Generar una escena de Blender por script (sin interfaz) | BLEND-002, `integration/blender/` |
| Requisitos de Blender y GPU para renderizar | BLEND-001 (lote 23), BLEND-002 §12 |
| Qué movimiento corto probar antes de una secuencia larga | PROD-001 |
| Objeto delante y detrás del titular a partir de un render | DEPTH-001 (*holdout*), BLEND-001 §8 |
| Evitar una landing genérica | ART-001 (lista contra lo genérico), skill `web-library-router` paso 2c |
| Cámara siguiendo una curva dibujada en Blender | CAM-002 (lote 22) |
| Diseñar una escena por scroll (estados, mesetas, labels, snap) | MOT-001 |
| El producto no debe cortarse al cambiar de sección | CONT-001, REC-001 |
| Un producto se disuelve y se convierte en otro | TRN-001, REC-002 |
| Producto quieto mientras el entorno cambia en capas | REC-003, DEPTH-001 |
| Titular que pasa por dentro o por detrás del producto sin perder legibilidad | DEPTH-001 (lote 24), REC-003 |
| Halos oscuros en los bordes de un PNG | DEPTH-001 (alfa premultiplicado) |
| Dolly, truck, órbita: ¿2,5D o Three.js? | CAM-003 |
| Revisar fallos típicos antes de entregar una web cinematográfica | EVAL-001 (catálogo del lote 24) |
| Detectar transiciones que funcionan pero son mediocres (sin protagonista, partículas invisibles, apagones, texto ilegible, cortes) | AUD-001, EVAL-001 (apéndice del lote 25) |
| Secuencia con pocos fotogramas fluida; relevos entre capas sin oscurecer | SEQ-003 |
| Transición de persianas o rejilla con máscara SVG sin costuras | MASK-002 |
| Pasar una escena por scroll a GSAP real y comprobar que es igual | GS-005 (plantilla verificada `integration/plantillas/escena_gsap/`, `tools/validar_gsap.mjs`) |
| Que el producto se mueva con peso (arco, anticipación, sin tirones) | MOT-002 |
| Cambiar de escena sin que se note el corte (relevo, match cut, desfases) | EDIT-001 (§Lote 31), `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE_v2.md` |
| Que un objeto rápido no parezca ir a saltos (motion blur) | MBLUR-001 |
| Que un protagonista generado parezca rodado en la escena (sombra, sombreado, grado, grano, atmósfera) | INTEG-001 |
| Iluminar e integrar un producto (metal, vidrio) en la página | COMP-001, ART-001, DEPTH-001 |
| Técnicas reales de vídeos de expertos (Flip.fit fitChild, ExpoScale, vídeo por scroll, banda de disolución, vídeo → partículas) | `integration/YOUTUBE_ESTUDIOS.md`, CONT-001, MOT-002, SEQ-001, TRN-001, REC-002 |
| Integrar imágenes generadas por IA (contrato, recorte, capas, sombras, formatos) | AIIMG-001, `integration/contratos/CONTRATO_RECURSOS_REC003.md` |
| Transformar o girar un producto generado entre dos escenas sin fundido (clips image-to-video encadenados) | AIVID-001, SEQ-001, `integration/YOUTUBE_ESTUDIOS.md` (receta provisional, lote 29) |
| Transformar un producto al hacer scroll "como en Enky" (flujo de 10 pasos) | Skill `web-cinematic-site`, TRN-001, REC-001…003 §7b |
| Medir reversibilidad, estados y tiempos de una escena | `integration/tools/medir_escena_scroll.mjs` |
| Luz realista en una escena 3D estática (lightmaps, AO) | LIGHT-002, LIGHT-001 |
| Neón o letrero que brilla (bloom) | POST-001 |
| Esquinas y contactos más realistas (AO) | LIGHT-002 (horneada), POST-001 (en pantalla) |
| Cargar fuentes sin saltos ni texto invisible | TYPE-001 (lote 15) |
| Paleta de marca desde un solo color (OKLCH relativo) | UI-002 (lote 15), DS-001 |
| Colores más vivos en pantallas P3 con respaldo | UI-002 (lote 16) |
| El 3D se ve lavado o saturado (color y tono) | PBR-001 |
| Vidrio, laca o tela realistas | PBR-001 |
| Hornear la luz en Blender paso a paso | LIGHT-002 (lote 16, verificado en el código de Blender) |
| Interruptor de animaciones con GSAP | GS-004 (lote 16), A11Y-001 |
| Ir a una sección sin que la tape la cabecera | GS-004 (ScrollToPlugin `offsetY`), A11Y-006 |
| Mantenimiento seguro de la biblioteca | [integration/MANTENIMIENTO.md](integration/MANTENIMIENTO.md) |
| Página Next.js rápida con partes estáticas y partes por usuario | NEXT-004 |
| Caché de servicios y precios en Next.js 16 | NEXT-004 |
| Pestañas o pasos que conservan estado (React 19.2) | REACT-001 |
| Animación que no se reinicia al cambiar el tema | REACT-001 |
| Reloj del bucle 3D sin saltos al volver a la pestaña | GL-006 (lote 17, `THREE.Timer`) |
| Cabecera móvil que se parte en dos filas | UX-004 (lote 18) |
| Texto sobre degradado o imagen: ¿cumple el contraste? | A11Y-003 (lote 18) |
| ¿Qué versión de Astro/Next/TS hay hoy y cuál usan las fichas? | [integration/VERSIONES_VIGENTES.md](integration/VERSIONES_VIGENTES.md) |
| ¿La licencia de GSAP permite usarlo en una web de cliente? | [integration/VERSIONES_VIGENTES.md](integration/VERSIONES_VIGENTES.md), GS-004 |
| Probar automáticamente una landing (Playwright) | `integration/tools/prueba_web_playwright.mjs`, TEST-001 |
| Comparar con y sin biblioteca | [integration/COMPARACION_CON_SIN_BIBLIOTECA.md](integration/COMPARACION_CON_SIN_BIBLIOTECA.md) |
| Probar la biblioteca con Claude Code (solo lectura) | [integration/MINIMAL_INTEGRATION_TEST.md](integration/MINIMAL_INTEGRATION_TEST.md) |
| Usar la biblioteca desde Claude Code | [integration/INTEGRATION_GUIDE.md](integration/INTEGRATION_GUIDE.md) |
| Rejilla de servicios con brillo al pasar el ratón | HOV-004 |
| Logos de clientes en cinta infinita accesible | CSS-003 |
| Titular que se "descifra" | TXT-003 |
| Galería que se arrastra | DRAG-001 |
| Galería que se convierte en imagen protagonista | FLIP-002 |
| Estructura Next.js con animaciones | NEXT-001 |
| Revelados sin JavaScript | CSS-001 |
| Transición entre páginas | CSS-002, NEXT-001 (template) |
| Cuánto debe durar una animación | UX-001 |
| Mi escena 3D va lenta | R3F-002, TJ-002 |
| Estructurar una landing cinematográfica | CASE-001, TUT-003 |

## Cobertura de los 15 temas de la captura

| # | Tema | Cobertura |
|---|---|---|
| 1 | Animación de entrada | Parcial (ST-001) |
| 2 | Texto por letra/palabra | TXT-001, **TXT-002** |
| 3 | Scroll suave | LN-001, GS-002 |
| 4 | ScrollTrigger básico | ST-001, ST-004 |
| 5 | Pinning | ST-002, CARD-001 |
| 6 | Parallax | PX-001, ZOOM-001, VEL-001, MP-001 |
| 7 | Scroll horizontal | ST-003 |
| 8 | Transformaciones (Flip, MorphSVG) | **FLIP-001, MORPH-001** (docs oficiales), GL-002, SCN-001 |
| 9 | Revelados con máscaras | MASK-001, **CLIP-001** |
| 10 | Hover y microinteracciones | HOV-001…HOV-006, CSS-006 |
| 11 | 3D + texto | TXT3D-001, CAM-001, GL-003 |
| 12 | Producto 3D interactivo | **CFG-001** |
| 13 | Escena 3D ligada al scroll | R3F-001, CAM-002, GL-004, OBS-001 (secciones), VID-001 (versión vídeo) |
| 14 | Timelines | Parcial (CAM-001, R3F-001) |
| 15 | Landing completa | Parcial (CASE-001, TUT-003) |

## Archivos de control

- [SOURCE_CATALOG.json](SOURCE_CATALOG.json) — 41 fuentes + 10 referencias oficiales (14 con identidad verificada).
- [VIDEO_RESEARCH_INDEX.json](VIDEO_RESEARCH_INDEX.json) — 263 entradas (VR-001…VR-263) con campos `narrated`, `transcript_status`, `code_route`, `visual_gaps`, `evidence`, `tut`.
- [RESEARCH_PROGRESS.md](RESEARCH_PROGRESS.md) — cobertura, plan de validación y pendientes.
- [skills/](skills/README.md) · [IMPORT_GUIDE.md](IMPORT_GUIDE.md) · [_templates/](_templates/FICHA_TECNICA.md) · [_origen/](_origen/README.md)

## Inspección visual de demos

**Lote 5 (v0.6.0): CONSEGUIDA** con el navegador integrado de Cowork para 6 técnicas — ZOOM-001, TXT-002 (variante A), FLIP-001, HOV-001, TXT3D-001 y GL-002 — con capturas y mediciones en [evidence/visual/2026-10-26](evidence/visual/2026-10-26/README.md) (estado `DEMO_INSPECCIONADA`; no equivale a ver los vídeos).

Lote 4: bloqueada: el navegador de la nube no puede salir a los dominios de las demos y la extensión del navegador del usuario no estaba conectada. Las fichas ZOOM-001, TXT-002, CAM-002, FLIP-001 y HOV-003 registran el bloqueo y añaden **estados calculados a partir del código** (no observados).

## Política de presupuesto 0 €

Fuentes de pago → `INACCESIBLE_POR_COSTE` con alternativa gratuita en `SOURCE_CATALOG.json` (`free_alternative`): Codegrid, Creative Coding Club, Osmo, Mastering Web Animation, Three.js Journey, Web Animation Course (Olivier Larose), R3F Ultimate Guide (Wawa Sensei).
