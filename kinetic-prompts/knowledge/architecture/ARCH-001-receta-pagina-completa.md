---
id: ARCH-001
titulo: Receta de página web completa — orden de decisiones y fichas a consultar
categoria: architecture
estado: PROPUESTO
evidencia: SÍNTESIS de fichas existentes (cada paso remite a su fuente); no probada en un proyecto
versiones: ver cada ficha
perfil: ambos
ultima_revision: 2026-10-27 (reorganizada en el lote 10, ampliada en los lotes 11–13)
---

# ARCH-001 · De la idea a la página publicada

Guía para Claude Code: **qué decidir y en qué orden**, para que la biblioteca no enseñe solo efectos. Cada paso remite a las fichas que lo respaldan; donde no hay ficha, se dice. Ninguna ficha está IMPLEMENTADA ni VALIDADA.

| # | Paso | Decisión / entregable | Fichas |
|---|---|---|---|
| 0 | Encargo | Propósito (notoriedad / conversión / información), objetivos medibles, especificación y tareas con criterio de aceptación | CLIENT-001 |
| 1 | Perfil | A comercial (conversión) o B cinematográfico (experiencia). No mezclar espectacularidad con calidad | skills/web-library-router, UI-001 (cuándo no usar la estética SaaS) |
| 1b | Dirección de arte y storyboard (B, y héroe premium en A) | Guion en 3 actos con un objeto protagonista, paleta por acto, tipografía en capas, luz; storyboard con fotogramas clave y tabla de movimiento; origen de los recursos fotorrealistas | ART-001, CASE-003, DEPTH-001, `integration/BRIEFING_STORYBOARD_PROTOTIPO_2.md` |
| 2 | Contenido y estructura | Secciones de una home de negocio, un `h1`, CTA principal visible, textos escaneables y objetivos, prueba social verificable y externa | UX-002, COPY-001, UI-002, HERO-001, PERF-001 §6 |
| 3 | Stack | Web de contenido → Astro (islas, colecciones tipadas, imágenes `astro:assets`) · app con área privada/datos → Next.js App Router · criterios de stack y tipado | ASTRO-001/002/003/004, NEXT-001/002/003/004, REACT-001, T3-001, TS-001 |
| 4 | Sistema de diseño | Tokens semánticos, tema claro/oscuro sin parpadeo, escala tipográfica fluida, jerarquía visual (color, escala, agrupación; prueba de desenfoque) y CTA, contraste | DS-001, TYPE-001/002, UI-002, A11Y-003 |
| 5 | Maquetación responsive | Mobile-first, container queries, imágenes con `srcset/sizes`, objetivos táctiles ≥ 24 px, cabecera en una fila a 320 px (UX-004) | CSS-004, IMG-001, ASTRO-004, A11Y-003 |
| 6 | Componentes | Nativos primero (`<dialog>`, `<details>`), estados explícitos, carruseles con controles y pausa, revisar componentes copiados de tutoriales | A11Y-004, A11Y-007, CSS-007, UX-003, UX-004 |
| 7 | Formularios y seguridad | Usabilidad de formularios; validación en servidor con esquema; DAL `server-only` con DTO mínimos; autenticar y autorizar dentro de cada acción; cookies HttpOnly; cabeceras y CSP; variables de entorno validadas en build | FORM-001, SEC-001, SEC-002, SEC-003, NEXT-002, NEXT-003, T3-001 |
| 8 | SEO e idiomas | Metadatos y OG por página, sitemap/robots, JSON-LD (LocalBusiness / Person), SEO local y NAP coherente, rutas por idioma y `hreflang` | SEO-001, SEO-002, SEO-003, I18N-001, ASTRO-003 §4 |
| 8b | Cookies, consentimiento y analítica (España/UE) | Banner con rechazo al mismo nivel, bloqueo previo de terceros, analítica exenta solo si cumple las condiciones de la AEPD — orientación técnica, no asesoramiento legal | LEGAL-001, ANALYTICS-001 |
| 9 | Presupuestos de rendimiento | LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 (p75 móvil); peso de 3D; JS de animación; dispositivo objetivo y fps | PERF-001, PERF-002, TJ-002, R3F-002, INST-001, WGPU-001 |
| 10 | Sistema de movimiento | Tokens de duración/easing; feedback vs narrativa; física de muelles con criterio | UX-001, PHYS-001 |
| 11 | Accesibilidad del movimiento e interacción | `prefers-reduced-motion` global, pausa para lo automático > 5 s, sin destellos; alternativa a todo arrastre y foco no tapado (WCAG 2.2) | A11Y-001, A11Y-002, A11Y-006 |
| 12 | Capa base sin JS | Revelados CSS ligados al scroll (`@supports`), View Transitions, CSS nuevo con mejora progresiva | CSS-001, CSS-002, CSS-008, ASTRO-003 §6 |
| 13 | Capa GSAP (si aporta) | ScrollTrigger, pin, texto, Flip/MorphSVG/DrawSVG, MotionPath, Observer; en React con `useGSAP` | ST-001…006, TXT-001…006, FLIP-001/002, MORPH-001, SVG-001, GS-001/003/004, OBS-001/002, MP-001 |
| 14 | Scroll suave (solo B o justificado) | Lenis o ScrollSmoother según la tabla de GS-002 | LN-001, GS-002 |
| 15 | Navegación y transiciones de página | Menús accesibles; transiciones secuenciales, View Transitions (nativas o `<ClientRouter />` en Astro) o paralelas (solo B) | MENU-001, SVG-001 (B), CSS-002, ASTRO-004, NEXT-001, PT-001, PIX-001, SECT-001 |
| 16 | Microinteracciones | Botones magnéticos, cursores, tarjetas, botones con recompensa; solo con puntero fino y con alternativa de teclado | HOV-001…006, BTN-001, CSS-005, CSS-006 |
| 17 | Narrativa con scroll | **Método de estados (MOT-001)**; pins, tarjetas apiladas, zoom, parallax, vídeo, secuencia de fotogramas con objeto continuo (CONT-001), transformaciones (TRN-001), recetas A/B/C (REC-001…003), personaje en camino | ST-002, CARD-001, ZOOM-001, PX-001, VID-001, SEQ-001, DEPTH-001, MOT-001, CONT-001, TRN-001, CAM-003, VEL-001, FOOT-001, MP-001 |
| 18 | 3D / WebGL / WebGPU (solo B) | Renderer y degradación por niveles; una timeline maestra; escena guiada por scroll, cámara (por planos como datos), iluminación y sombras con presupuesto de pasadas, configurador, shaders y materiales procedurales (TSL), transiciones de escena, instancing/compute; arquitectura de proyecto grande; carga diferida tras LCP | WGPU-001, GL-006, TSL-001/002/003, GLTF-001, LIGHT-001/002, POST-001, PBR-001, R3F-001/002, CAM-001/002, CFG-001, SCN-001/002, GL-001…004, HOV-003, TXT3D-001, TJ-001/002, INST-001/002, ARCH-002, CASE-002 |
| 19 | QA | **B: criterios C1 fidelidad visual, C2 fidelidad de movimiento y C3 calidad creativa (EVAL-001) obligatorios**; lint a11y, Lighthouse, teclado, lectores, reduced motion, 3 anchos, Chromium/WebKit, E2E, regresión visual, revisión de errores de ScrollTrigger | A11Y-005, TEST-001, TEST-002, ST-004, skills/web-qa-validation, campo 14 de cada ficha |
| 20 | CI y despliegue | Pipeline lint → tipos → build → Playwright → Lighthouse CI con aserciones en cada PR; `next build/start` local, bundle analyzer, CWV de campo, variables de entorno, cabeceras en la URL final | CI-001, CI-002, DEPLOY-001, T3-001, SEC-001 |
| 21 | Registro | Actualizar el estado de las fichas usadas solo con evidencia (IMPLEMENTADO/VALIDADO) | INFORME_VALIDACION_v0.3.0 §5 |

**Antipatrones transversales detectados en los tutoriales revisados (checklist de revisión):** efectos sin limpieza (rAF, listeners, tweens); animaciones dependientes de la tasa de refresco (`+= constante` por frame); animar `left/top/height`; `window` leído en el render; `alt` genéricos; reduced motion ausente en casi todos; precargadores con temporizador; assets 3D de 4–21 MB; `setState` por frame; `div`/`span` clicables en lugar de `button`/`a`; `aria-label` que sustituye el texto visible; etiquetas de formulario sin asociar; eases mal escritos que fallan en silencio; selectores globales sin scope; en código de cursos, Server Actions sin validación ni autorización (hallazgos de lectura de código, no vulnerabilidades probadas — NEXT-002).

**Huecos conocidos (sin ficha todavía):** prueba real de un lightmap exportado desde Blender (LIGHT-002 tiene los pasos verificados en el código de Blender 5.4, sin ejecutar); política de privacidad y aviso legal (textos legales, fuera del alcance técnico); foco y anuncios en navegación SPA con `<ClientRouter />`.

## Historial de huecos cubiertos
- **Lote 6 (v0.7.0):** IMG-001, CSS-004, TYPE-001, SEO-001, FORM-001.
- **Lote 7 (v0.8.0):** SEC-001, SEC-002, A11Y-003, UX-002, SEO-002.
- **Lote 8 (v0.9.0):** TS-001, ASTRO-001, TEST-001, DEPLOY-001, A11Y-004, CSS-007, UX-003, GS-002.
- **Lote 9 (v0.10.0):** DS-001, TYPE-002, UI-002, SEO-003, NEXT-002, NEXT-003, ASTRO-002, UX-004.
- **Lote 24 (v0.24.0):** MOT-001, CONT-001, TRN-001, CAM-003, REC-001/002/003; ampliadas DEPTH-001, TXT-001, ART-001 y EVAL-001.
- **Lote 28 (v0.28.0):** técnicas de vídeos de expertos → `integration/YOUTUBE_ESTUDIOS.md` (Flip.fit fitChild, ExpoScale, vídeo por scroll, banda de disolución, vídeo → partículas).
- **Lote 27 (v0.27.0):** protagonistas con imágenes de IA → AIIMG-001, contrato en `integration/contratos/` e integración `integration/plantillas/rec003_recursos/`.
- **Lote 26 (v0.26.0):** GS-005 IMPLEMENTADO con GSAP 3.15.0 real; para escenas por scroll, partir de `integration/plantillas/escena_gsap/`.
- **Lote 25 (v0.25.0):** AUD-001, SEQ-003, MASK-002, GS-005, MOT-002, COMP-001; recetas con apartado 7b; EVAL-001 con la tabla "funciona pero mediocre". Para transformar un producto por scroll, seguir el flujo de 10 pasos de `web-cinematic-site`.
- **Lote 23 (v0.23.0):** BLEND-002; ampliadas BLEND-001, EVAL-001 (aceptación del Hito A) y PROD-001 (corrección de B0).
- **Lote 22 (v0.22.0):** BLEND-001, PROD-001; ampliadas CAM-002, DEPTH-001, SEQ-002 y ART-001 (lista contra lo genérico).
- **Lote 21 (v0.21.0):** SEQ-002, ASSET-001, CASE-004; ampliadas SEQ-001, VID-001, EVAL-001, ART-001 y CASE-003.
- **Lote 20 (v0.20.0):** CASE-003 (referencia Enky), SEQ-001, DEPTH-001, ART-001, EVAL-001; pasos 1b, 17 y 19 ampliados.
- **Lote 19 (v0.19.0):** TEST-003, TEST-004; ampliadas ASTRO-001…004 (Astro 6/7), TS-001 (TS 7 y Astro), UX-004, A11Y-003.
- **Lote 18 (v0.18.0):** primer prototipo real; ampliadas UX-004 (cabecera móvil), A11Y-003 (contraste sobre degradados), FORM-001 (campos de fecha), GS-004 (licencia), ASTRO-001/004 y TS-001 (aviso de versión).
- **Lote 17 (v0.17.0):** NEXT-004, REACT-001; ampliadas GL-006 (Timer), GS-003.
- **Lote 16 (v0.16.0):** PBR-001; LIGHT-002 verificada en el código de Blender; ampliadas GS-004, A11Y-001, ASTRO-004, UI-002, GS-001, GS-002, LN-001, TS-001, WGPU-001, TSL-001, POST-001.
- **Lote 15 (v0.15.0):** GS-004, LIGHT-002, POST-001; ampliadas ST-004, A11Y-001, TXT-001, TYPE-001, UI-002, LIGHT-001, TSL-001.
- **Lote 13 (v0.14.0):** ST-006, LIGHT-001, ASTRO-004, TEST-002, CI-002, A11Y-007; ampliadas UI-002 (NN/g jerarquía visual), DRAG-001 (Draggable), CAM-001 (planos guiados por scroll, Codrops), ST-004 (relectura y revisión estática), CI-001.
- **Lote 12 (v0.13.0):** GLTF-001, TSL-003, ST-005, A11Y-006, SEC-003; FORM-001 y UX-002 ampliadas (NN/g 2016 y 2024).
- **Lote 11 (v0.12.0):** COPY-001, LEGAL-001, ANALYTICS-001, I18N-001, CI-001, PERF-002, WGPU-001, TSL-001/002, SCN-002, INST-002, GL-006, CASE-002, OBS-002.
- **Lote 10 (v0.11.0):** CLIENT-001 (proceso con cliente), T3-001 (variables de entorno), A11Y-005 (proceso de pruebas), ASTRO-003 (patrones de acabado), PT-001 (transiciones paralelas), CSS-008 (CSS 2026, pendiente de verificar). Tabla reorganizada para integrar Astro, SEO, seguridad, formularios y sistema de diseño en el orden de trabajo.
