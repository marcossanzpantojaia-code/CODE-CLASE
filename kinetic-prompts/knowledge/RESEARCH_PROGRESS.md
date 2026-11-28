# RESEARCH_PROGRESS

## Lote 0 — 2026-10-26 (verificación inicial)

### Archivos de entrada

- `catalogo_fuentes_web_2026.json` y `fuentes_biblioteca_animacion_web.md` son coherentes: 41 fuentes únicas, sin duplicados ni discrepancias entre ambos (comprobado por script).
- Diferencia de nombre: el JSON usa `WEB_MOTION_KNOWLEDGE_LIBRARY`; se adopta `WEB_ENGINEERING_KNOWLEDGE_LIBRARY` (misión).

### Cobertura real de este lote

| Tipo de acceso | Recursos |
|---|---|
| Documentación oficial analizada | 5 (ScrollTrigger docs, README gsap-skills, README Lenis, manual Three.js dispose, docs de Agent Skills) |
| Metadatos verificados | 7 fuentes (GreenSock, Creative Coding Club, Osmo, Mastering Web Animation, Motion Tricks, Codrops, Awwwards) |
| Solo referencia | 34 fuentes |
| Vídeo inspeccionado / transcripción analizada | **0** |
| Código fuente de tutorial inspeccionado | **0** |
| Fichas creadas | 7 (todas INVESTIGADO) |
| Código ejecutado | **ninguno** |

### Limitación importante

Desde este entorno (Claude en el chat) no puedo reproducir vídeos de YouTube ni he podido obtener transcripciones. Por eso **no se ha completado el objetivo de "10 tutoriales en profundidad"**. Las fichas se han construido desde documentación oficial, que es más fiable para la API, pero no sustituye a los tutoriales en técnicas visuales concretas. Opciones para el siguiente lote:

1. Priorizar tutoriales **en texto con código** (Codrops, blog de GSAP, blogs de los autores, repositorios públicos), que sí puedo analizar.
2. Que el usuario aporte transcripciones o que Claude Code las obtenga con una herramienta autorizada.

### Hallazgos que cambian el plan

- **GSAP es 100 % gratuito**, incluidos SplitText y MorphSVG, tras la adquisición por Webflow.
- **Existen Skills oficiales de GSAP para Claude Code** (`greensock/gsap-skills`, MIT). La biblioteca no debe duplicar su contenido sobre la API, sino complementarlo (decisión de perfil, integración, accesibilidad, QA).
- `ScrollTrigger.matchMedia()` está deprecado: usar `gsap.matchMedia()`.
- Existen Skills y servidores MCP de terceros sobre Lenis/GSAP: **no usar sin auditoría**, siguiendo la recomendación de seguridad de Anthropic sobre Skills de origen desconocido.

## Plan priorizado — 20 recursos (siguiente lote)

Criterio: accesibles en texto/código primero, alineados con los 15 temas.

| # | Recurso | Tema | Acceso esperado |
|---|---|---|---|
| 1 | gsap.com/resources/st-mistakes | ScrollTrigger | Texto |
| 2 | gsap.com/resources/React | React | Texto |
| 3 | Docs SplitText (gsap.com) | Texto animado | Texto |
| 4 | Docs Flip | Transformaciones | Texto |
| 5 | Docs gsap.matchMedia() | Responsive / a11y | Texto |
| 6 | Docs Timeline y position parameter | Timelines | Texto |
| 7 | SKILL.md de gsap-scrolltrigger y gsap-performance | ScrollTrigger / rendimiento | Código/Texto |
| 8 | Codrops: scroll infinito con GSAP + Lenis | Lenis | Texto + código |
| 9 | Edoardo Lunardi: smooth scroll con Lenis (enlazado en README) | Lenis | Texto |
| 10 | Blog GSAP 3.8 containerAnimation + demo | Scroll horizontal | Texto + CodePen |
| 11 | MDN prefers-reduced-motion + WCAG | Accesibilidad | Texto |
| 12 | Docs React Three Fiber (ciclo de vida/dispose) | 3D | Texto |
| 13 | Three.js: cargadores GLTF y compresión | 3D producto | Texto |
| 14 | Kevin Powell: View Transitions (localizar artículo o vídeo) | Transiciones | Por verificar |
| 15 | Codegrid: un tutorial de pinning con repositorio | Pinning | Vídeo/código |
| 16 | Olivier Larose: tutorial de parallax con código | Parallax | Blog + código |
| 17 | Hyperplexed: efecto hover con CodePen | Hover | CodePen |
| 18 | Wael Yasmina: Three.js + GSAP cámara | 3D + scroll | Blog/vídeo |
| 19 | Wawa Sensei: ScrollControls en R3F | 3D + scroll | Vídeo/código |
| 20 | Landing completa de referencia (por seleccionar) | Integración | Por verificar |

Los 10 primeros son los candidatos a análisis en profundidad del próximo lote.

## Pendientes de capas no cubiertas

Sin fichas todavía: HTML/CSS, TypeScript, Next.js, Astro, UI/UX, SEO técnico, seguridad, testing, despliegue. Las fuentes de las capas A, B y C (34 en total) siguen en SOLO_REFERENCIA.

---

## Lote 1 — 2026-10-26

### Recursos procesados (5)

| Recurso | Resultado |
|---|---|
| GreenSock · ScrollTrigger tips & mistakes | Analizado íntegro → ST-004 |
| GreenSock · SplitText docs | Analizado íntegro → TXT-001 |
| JavaScript Mastery · repositorio GTA VI | Código inspeccionado (5/10 secciones) → MASK-001, VID-001, PX-001, CASE-001 |
| Codegrid · 3 vídeos | Solo metadatos; código de pago → inventario VR-001 a VR-003 |
| Codrops · GSAP + Lenis scroll infinito | INACCESIBLE (bloqueo anti-bots) |

### Cobertura acumulada

| Medida | Valor |
|---|---|
| Fichas | 13 (todas INVESTIGADO) |
| Vídeos vistos o transcripciones | 0 |
| Repositorios de tutoriales inspeccionados | 1 |
| Documentos oficiales analizados | 7 |
| Fuentes con identidad verificada | 8 de 41 (+ JavaScript Mastery con código) |
| Código ejecutado | ninguno |

### Lecciones del lote

- **El código de los tutoriales "premium" suele ser de pago** (Codegrid → Gumroad). Los repositorios públicos (JavaScript Mastery) son la vía de evidencia más sólida disponible aquí.
- **Los tutoriales populares no son plantillas de calidad.** El repositorio analizado funciona como referencia de narrativa, pero tiene selectores sin scope, una probable condición de carrera en el vídeo, sin reduced motion e imágenes sin `alt`. La biblioteca registra estos fallos para que Claude Code no los copie.

### Cómo desbloquear el análisis de vídeo (requiere tu decisión)

1. **Transcripciones aportadas por ti** (copiar desde YouTube → "Mostrar transcripción") → estado TRANSCRIPCION_ANALIZADA.
2. **Claude Code con una herramienta autorizada** (p. ej. un descargador de subtítulos) → mismo estado, previa auditoría de la herramienta.
3. **Inspección visual:** capturas o fotogramas que tú aportes → VIDEO_INSPECCIONADO parcial.
4. **Código de pago** (Codegrid Pro, Osmo, Creative Coding Club): solo con tu suscripción y respetando sus licencias.

## Técnicas prioritarias para webs profesionales (entregable 8)

**Perfil A — comercial:** ST-001 (revelados), TXT-001 (titulares accesibles), PX-001 sutil, A11Y-001, ST-004. Pendientes críticas: HTML semántico, responsive, SEO técnico, Core Web Vitals, formularios seguros.
**Perfil B — cinematográfico:** MASK-001, VID-001, ST-002, ST-003, LN-001, TJ-001, GS-001. Pendientes críticas: cámara Three.js ligada a scroll, GLTF optimizado, transiciones de página.

## Plan de validación (entregable 9)

Para pasar una ficha a **IMPLEMENTADO** y después a **VALIDADO**, en un entorno de pruebas aislado (nunca en tus proyectos) y con tu autorización para instalar herramientas:

1. Demo mínima por ficha (HTML + versión exacta de la ficha).
2. Pruebas automáticas: consola sin errores, capturas en 3 anchos, emulación de reduced motion, scroll programado adelante/atrás, resize.
3. Pruebas específicas del campo 14 de cada ficha (p. ej. condición de carrera de VID-001 recargando con caché).
4. Métricas: FPS en scroll, CLS y LCP; en 3D, `renderer.info` tras navegar.
5. Navegadores: Chromium y WebKit como mínimo.
6. Registrar evidencia (fecha, versiones, capturas) en la ficha.

Orden sugerido: ST-001 → TXT-001 → ST-002 → PX-001 → LN-001 → VID-001 → MASK-001.

## Siguiente lote (2)

1. Resto de secciones del repositorio GTA VI (carrusel, segundo vídeo, outro).
2. gsap.com/resources/a11y y /resources/React (a11y y React oficiales).
3. Docs de Flip (tema 8) y de ScrollSmoother (alternativa a Lenis).
4. Buscar repositorios públicos de: Olivier Larose, Wawa Sensei, Wael Yasmina (3D), Hyperplexed (CodePen).
5. MDN: prefers-reduced-motion y `mask-image`.

---

## Lote 2 — 2026-10-26 (Claude Cowork)

### Verificación de identidad (antes de leer código)

| Canal | Cuenta GitHub | Cómo se verificó | Resultado |
|---|---|---|---|
| Wawa Sensei | wass08 | README de perfil "Hi, I'm Wawa Sensei" → YouTube c/WawaSensei y wawasensei.dev; las páginas /tuto/ de wawasensei.dev enlazan los repos | VERIFICADO |
| Wael Yasmina | WaelYasmina | Perfil enlaza waelyasmina.net, YouTube @WaelYasmina y CodePen; la web enlaza el canal | VERIFICADO |
| Olivier Larose | olivierlarose | Perfil → olivierlarose.com → blog.olivierlarose.com; cada tutorial del blog enlaza repo + vídeo (@olivierlarose1) | VERIFICADO |
| Yuri Artiukh | akella | Perfil "Yuri Artiukh", Kyiv → riverco.de (Coderiver, fundado por Yuriy Artiukh) → YouTube user/flintyara; READMEs de Codrops enlazan github.com/akella | VERIFICADO |
| Kevin Powell | kevin-powell | Perfil enlaza youtube.com/kevinpowell (enlace solo en un sentido) | VERIFICADO (unidireccional) |

Limitación del entorno: la API de GitHub de esta sesión solo permite rutas de repositorios autorizados y las páginas de listados de github.com están bloqueadas por robots. Los repos se localizaron **a través de las webs/blogs de los propios creadores** (mejor procedencia) y se clonaron en superficial (`git clone --depth 1`) en una carpeta temporal aislada, sin ejecutar nada (hooks desactivados).

### Recursos procesados (10 tutoriales + 1 descartado)

| TUT | Recurso | Resultado |
|---|---|---|
| TUT-001 | olivierlarose/cards-parallax | Código → CARD-001 |
| TUT-002 | olivierlarose/smooth-scroll | Código → CLIP-001 |
| TUT-003 | olivierlarose/awwwards-landing-page | Código → HOV-001, HOV-002 |
| TUT-004 | wass08/r3f-scrolling-animation-tutorial | Código → R3F-001 |
| TUT-005 | wass08/table-configurator-…-final | Código → CFG-001 |
| TUT-006 | wass08/r3f-3d-text-effect | Código → TXT3D-001 |
| TUT-007 | WaelYasmina: 2 artículos + ThreeBoilerplate | Artículos + código → CAM-001 |
| TUT-008 | akella/webgl-mouseover-effects (MIT) | Código → GL-001, HOV-003 |
| TUT-009 | akella/webGLImageTransitions (lic. Codrops) | Código + texto del artículo → GL-002 |
| TUT-010 | adrianhajdin/jsm_gta_vi_landing (5 secciones pendientes) | Repo completo 10/10 → CASE-001, VID-001 actualizados |
| — | kevin-powell/reponsive-web-design-bootcamp | Solo ficheros de partida (2020) → descartado (VR-021) |

### Cobertura acumulada

| Medida | Valor |
|---|---|
| Fichas por técnica | 24 (todas INVESTIGADO) |
| Fichas por tutorial | 10 |
| Vídeos vistos o transcripciones | **0** |
| Repositorios de tutoriales inspeccionados | 11 |
| Fuentes con identidad verificada | 13 de 41 |
| Código ejecutado | **ninguno** |
| Temas de la captura sin ninguna ficha | 0 (el 8 sigue solo parcial) |

### Hallazgos del lote

- **El código de tutoriales populares arrastra fallos sistemáticos**: efectos sin limpieza (Lenis/Locomotive/ScrollTrigger sin destruir) en 5 de 10 repos; animación de propiedades de layout (`left`, `top`, `height`) en 2 (TUT-002, TUT-003); `alt` genéricos o ausentes en casi todos; ninguno trata `prefers-reduced-motion`. La biblioteca registra cada uno con ruta de archivo.
- **Error silencioso verificado en el código de GSAP 3.12.2**: un ease mal escrito (`"power3.Out"`) no lanza aviso y cae al ease por defecto (TUT-002). Útil para la skill de QA.
- **Olivier Larose usa sobre todo framer-motion** y Locomotive/Lenis, no GSAP: sus técnicas se traducen a GSAP como *adaptación propuesta*.
- **Repos de 2019-2020 (akella) usan APIs retiradas** de three.js (`PlaneBufferGeometry`, `outputEncoding`) y GSAP 2; se indican las equivalencias actuales (Migration Guide de three.js).
- **Licencias:** solo 1 repo con MIT (akella/webgl-mouseover-effects); 1 con licencia Codrops restrictiva; 1 con ISC en package.json; el resto sin licencia → solo paráfrasis.
- **Propiedad intelectual:** TUT-003 recrea el portfolio real de Dennis Snellenberg con sus datos; no reutilizar diseño ni datos.
- Peso de assets 3D sin optimizar: GLB 4,6 MB + .blend público (TUT-004); .gltf 8,3 MB con base64 (TUT-005).

## Siguiente lote (3) — propuesto

1. **Prueba manual de transcripción** (sigue pendiente; requiere al usuario): candidato TUT-004 (Wawa Sensei, https://youtu.be/pXpckHDDNYo). El usuario copia "Mostrar transcripción" y la pega.
2. Docs oficiales: GSAP Flip y MorphSVG (cerrar tema 8), gsap.com/resources/React y /resources/a11y, ScrollSmoother, drei ScrollControls (versión actual), MDN `prefers-reduced-motion` y `clip-path`.
3. Inspección visual de demos publicadas (método C) de TUT-001, TUT-002, TUT-006, TUT-007, TUT-008 → requiere autorización para usar el navegador.
4. Wael Yasmina: leer sus 6 CodePen del artículo de cámara y buscar un tutorial Three.js + ScrollTrigger sin React.
5. Kevin Powell: localizar en CodePen demos de View Transitions / scroll-driven animations.
6. Hyperplexed (CodePen) y GreenSock (demos oficiales) para tema 10 y 14.

---

## Lote 3 — 2026-10-26 (Cowork) · v0.4.0

Prioridad del usuario: Codegrid, Olivier Larose, GreenSock, Creative Coding Club, Wawa Sensei, Wael Yasmina, Yuri Artiukh.

### Qué se pudo examinar y qué no, por canal

| Canal | Examinado | No accesible / pendiente |
|---|---|---|
| **GreenSock** | Docs Flip, MorphSVG, resources/React, resources/a11y (texto oficial completo). Demo Hub: metadatos de 7 demos; código de 3 CodePen (magnetic overwrite, velocity skew, card stack) **leído como resumen automático** | 3 CodePen con error del sitio (cursor preview, bento gallery, reduced motion); vídeo Flip en Vimeo no visto |
| **Olivier Larose** | 3 repos nuevos (zoom-parallax, text-gradient-opacity, text-mask-animation) + sus artículos del blog | 2 tutoriales del blog son **de pago** (Web Animation Course): mask-section-transition, svg-mask-scroll → solo demos públicas |
| **Wawa Sensei** | 3 repos nuevos (atmos part 1, scene-transition starter y final) | Vídeos no vistos; demo de atmos solo en CodeSandbox |
| **Yuri Artiukh** | Repo fake3d (Codrops) | Artículo de Codrops inaccesible (bloqueo anti-bots) |
| **Wael Yasmina** | Índice de artículos: no tiene artículos de ScrollTrigger; sí de cámara (zoom, movimiento dinámico), LOD, instancing, BatchedMesh, carga de modelos, bloom selectivo | Lectura de esos artículos → lote 4 |
| **Codegrid** | Confirmado: código en Gumroad "Codegrid Pro" (suscripción; precio visto solo en título del buscador) | Sin repos públicos ni narración aparente → requiere suscripción del usuario o inspección visual |
| **Creative Coding Club** | Identidad verificada (Carl Schooff, ex-GreenSock; YouTube snorkltv). GSAP 3 Express gratuito **con inscripción**; fuentes de vídeos para miembros | Requiere cuenta → decisión del usuario. CodePen snorkltv no accesible |

Limitaciones técnicas nuevas: `codepen.io` está bloqueado para la terminal en esta sesión; el lector web sí abre algunas páginas de CodePen pero devuelve un **resumen**, no el código literal → nuevo estado `CODIGO_RESUMIDO_POR_LECTOR`.

### Producción del lote

| Medida | Valor |
|---|---|
| Fichas TUT nuevas | 7 (TUT-011…TUT-017) → 17 en total |
| Fichas por técnica nuevas | 8 (FLIP-001, MORPH-001, VEL-001, ZOOM-001, TXT-002, CAM-002, SCN-001, GL-003) → 32 en total |
| Fichas actualizadas | HOV-001 (contraste con demo oficial), GS-001 y A11Y-001 (guías oficiales), CLIP-001, CARD-001 |
| Defectos del informe de validación corregidos | P4 (CLIP-001), P5 (HOV-001), P6 (CARD-001), P7 (estados de evidencia); P2 parcial (Skills remiten al índice) |
| Repos inspeccionados (acumulado) | 18 |
| Vídeos vistos / transcripciones | **0** |
| Código ejecutado | **ninguno** |
| Tema 8 (Flip/MorphSVG) | Cubierto con documentación oficial |

### Hallazgos

- **El demo oficial de botón magnético de GSAP enseña conflictos de tweens** (`overwrite`), y usa parámetros distintos a los de Olivier Larose (0,4/0,24, `power2.out` 0,4 s, `elastic.out(1,0.4)` 0,7 s). Útil como segunda referencia para la demo experimental de HOV-001.
- **Discrepancia artículo ↔ repo** en Olivier Larose (text-mask-animation): el artículo y el código usan librerías distintas para detectar la visibilidad. Regla adoptada: manda el código del commit.
- **Pesos de assets 3D muy altos** en los repos de Wawa Sensei: nube 13,9 MB (TUT-014), cocina 21,5 MB (TUT-015). La biblioteca necesita una ficha de compresión GLTF (Draco/Meshopt/KTX2).
- `getPoints()` vs `getPointAt()` en curvas de three.js: velocidad irregular vs constante (CAM-002, análisis propio pendiente de prueba).
- Dependencia de red en tiempo de ejecución por `resolve-lygia` (verificar).

## Siguiente lote (4) — propuesto

1. **Prueba de transcripción manual** (sigue bloqueada sin el usuario): TUT-004 o TUT-015 de Wawa Sensei.
2. Wael Yasmina: artículos de cámara (zoom, movimiento dinámico), LOD, carga de modelos, bloom selectivo → fichas de rendimiento 3D.
3. Ficha de compresión GLTF (docs oficiales three.js/glTF-Transform/Draco).
4. GreenSock: ScrollSmoother, Observer, DrawSVG, MotionPath (docs) y reintentar CodePen bento/cursor/reduced-motion.
5. akella: repos más recientes (shaders de scroll, transiciones de página).
6. Resto del catálogo (34 fuentes en SOLO_REFERENCIA): Hyperplexed (CodePen), Kevin Powell (CodePen View Transitions), Codrops (repos GitHub de la cuenta `codrops`, accesibles aunque la web no lo sea).
7. **Decisiones del usuario necesarias:** ¿suscripción Codegrid Pro / cuenta Creative Coding Club / Web Animation Course de Olivier Larose? ¿Permitir inspección visual de demos públicas con navegador (método C)?

---

## Lote 4 — 2026-10-26 (Cowork) · v0.5.0 · presupuesto 0 €

### A. Tres técnicas visuales con inspección de demos — resultado

| Técnica | Demo del autor | Inspección visual | Qué se hizo en su lugar |
|---|---|---|---|
| Olivier Larose — ZOOM-001 + TXT-002 | blog.olivierlarose.com/demos/zoom-parallax, /text-gradient-opacity-on-scroll, /text-mask-animation | **Bloqueada** | Estados inicial/intermedio/final calculados desde el CSS y las escalas del repo; ritmo de líneas y "anchura del degradado" (≈5 caracteres, 3,4 px de scroll por carácter) |
| Wawa Sensei — CAM-002 | CodeSandbox r3f-wawatmos-part-1 | **Bloqueada** | Reimplementación en Python de la curva Catmull-Rom: velocidad varía un 12 % (corrige la valoración de "velocidad irregular" de v0.4.0); alabeo máx. 23° (el límite de 60° nunca actúa) |
| GreenSock — FLIP-001 | demos.gsap.com/demo/card-stack (CodePen Yzdzxem) | **Bloqueada** | Se mantiene el resumen del código; ritmo sin verificar |
| (extra) Yuri Artiukh — HOV-003 | tympanus.net/Tutorials/webgl-mouseover-effects | **Bloqueada** | Lectura cuantitativa del código MIT (radio de lupa ≤ 0,2 UV, convergencia del ratón ~0,5 s) |

Causa del bloqueo: (1) Chromium preinstalado en la nube → `ERR_TUNNEL_CONNECTION_FAILED` para todos los dominios de demos (la salida de red de la sesión solo permite ciertos dominios; el usuario puede ampliarlos gratis en Configuración > Capacidades); (2) extensión Claude in Chrome no conectada. Se intentó una vez cada vía y no se repitió.

### B. Conocimiento de web completa (no solo efectos)

| Ficha | Tema | Fuente gratuita |
|---|---|---|
| PERF-001 | Core Web Vitals + receta LCP + impacto de animación/3D | web.dev |
| NEXT-001 | App Router: Server/Client Components, `'use client'`, `template.js` | nextjs.org |
| CSS-001 | Scroll-driven animations nativas (Chrome 115, Firefox 159, Safari 26 según caniuse) | MDN, caniuse |
| CSS-002 | View Transitions (Baseline mismo documento desde Firefox 144) | MDN, Chrome for Developers |
| A11Y-002 | WCAG 2.2: 2.2.2, 2.3.1, 2.3.3 | W3C WAI |
| UX-001 | Duraciones 100–400 ms, ease-out/ease-in, equivalencias GSAP (verificadas en el código de gsap) | NN/g |
| R3F-002 | Errores de rendimiento y escalado en R3F | docs pmndrs |
| TJ-002 | Compresión glTF y presupuestos (con pesos reales medidos) | gltf-transform.dev |
| ARCH-001 | Receta de página completa (orden de decisiones → fichas) | síntesis |

### C. Correcciones
- TXT-002: el ease equivalente de la curva [0.33, 1, 0.68, 1] es `power2.out` (antes decía `power3.out`); verificado en `gsap-core.js` que Power2 = cúbica.
- CAM-002: velocidad no uniforme moderada (12 %), no grave.
- Fuente de terceros descartada por contradecir datos oficiales de compatibilidad (VR-049).
- Estado `PAGO_NO_ACCEDIDO` renombrado a `INACCESIBLE_POR_COSTE`; alternativas gratuitas registradas.

### D. Interrupción
La herramienta de lectura web alcanzó el **límite de gasto mensual de la cuenta** durante el lote (al intentar leer web.dev imágenes responsive, MDN container queries y Google SEO Starter Guide). No se reintentó. Esas tres fichas quedan como primeras del lote 5.

### Acumulado
41 fichas (técnicas + conocimiento), 17 TUT, 49 entradas de inventario. Vídeos vistos: 0. Código ejecutado: ninguno de terceros (solo scripts propios de cálculo). Fichas validadas: 0.

## Siguiente lote (5) — propuesto, todo gratuito
1. Imágenes responsive (web.dev), container queries y `clamp()` (MDN), SEO técnico (Google Search Central), formularios y seguridad (OWASP/MDN), tipografía y sistema de diseño.
2. Reintentar inspección visual **solo si** el usuario conecta la extensión del navegador o permite los dominios de demos.
3. Artículos gratuitos de Wael Yasmina (cámara, LOD, carga de modelos) y docs de GSAP ScrollSmoother/Observer/MotionPath.
4. Repos públicos de la cuenta `codrops` en GitHub (alternativa gratuita a artículos bloqueados).

---

## Lote 5 — 2026-10-26 · v0.6.0 · primera evidencia visual real

### Comprobación de navegadores
| Vía | Resultado |
|---|---|
| Claude in Chrome (extensión) | No conectada (0 navegadores) |
| Chromium de la nube | 403 del proxy para los dominios de demos (sin cambios) |
| **Navegador integrado de Cowork** (pane Claude Browser, equipo del usuario) | **Disponible.** Se pidió permiso por sitio para blog.olivierlarose.com, codepen.io, cdpn.io, r3f-3d-text-effect.vercel.app y tympanus.net; concedido |

### Demos inspeccionadas (capturas + mediciones; sin iniciar sesión, sin instalar)
| Autor | Demo | Hallazgo verificado |
|---|---|---|
| Olivier Larose | zoom-parallax | Escalas por capa medidas = código (lineales); estados inicio/mitad/final = cálculo del lote 4; inercia de Lenis medida (≈10 %/frame, 95 % en ~480 ms) |
| Olivier Larose | text-gradient-opacity-on-scroll | 178 letras, 3,3 px de scroll por letra, **5 letras en transición** (predicción confirmada) |
| GreenSock | Flip Cards (CodePen Yzdzxem) | Código literal leído; gsap/Flip 3.15.0; tiempos medidos: salida 0,3 s, entrada 0,3 s, recolocación ≈0,5 s |
| GreenSock | Overwrite / Dynamic Tweens (azmKBBJ) | Código literal leído; gsap 3.15.1; imán con zona de 200 px; desplazamiento 0,4 × distancia y etiqueta 0,24 **medidos con puntero real**; sobrepaso elástico −23 % a ~85 ms |
| Wawa Sensei | r3f-3d-text-effect | Estados home → transición → store capturados; botón invisible sigue enfocable (verificado) |
| Yuri Artiukh | webGLImageTransitions demo 1 | Barrido con borde de ruido desde la derecha; curva de `progress` medida = cúbica ease-out (GSAP 2 Power2) |

### Correcciones / precisiones derivadas
- HOV-001: el demo oficial escucha una **zona** alrededor del botón y mapea con `mapRange`; la semántica de `overwrite` queda demostrada con código literal.
- GL-002 y UX-001: `Power2` = cúbica, verificado también en ejecución.
- TXT3D-001: accesibilidad del botón oculto pasa de "análisis estático" a **verificada**.

### Pendiente
- Variante B de TXT-002 (text-mask-animation), fake3d (GL-003), CAM-002 (CodeSandbox), velocity skew (VEL-001) y bento gallery: inspeccionar en el siguiente lote con el mismo método.
- Vídeos de YouTube: **siguen sin verse** (regla de no automatizar YouTube). Las demos sustituyen parcialmente el estudio visual, no la explicación narrada.
- Capas de web completa pendientes (imágenes responsive, container queries, SEO, formularios/seguridad, tipografía): el lector web volvió a estar disponible solo vía navegador; retomar en el lote 6.

---

## v0.6.1 — correcciones de trazabilidad (auditoría independiente, "aprobada con reservas")

| Reserva | Corrección |
|---|---|
| 49 entradas en el inventario vs 40 en el índice | KNOWLEDGE_INDEX corregido a 49 (VR-001…VR-049) |
| Observado vs calculado vs estimado | Etiquetas [OBS]/[MED]/[CALC]/[EST]/[COD] añadidas a ZOOM-001, TXT-002, FLIP-001, HOV-001, TXT3D-001, GL-002, LN-001 |
| Mediciones sin datos | 7 JSON con las series en bruto en `evidence/visual/2026-10-26/data/`; las cifras sin JSON se rebajan a [CALC]/[EST] (p. ej. tiempos de TXT3D-001, `lerp 0.1` de Lenis como inferencia) |
| 0,15 s vs 0,5 s en el botón de GreenSock | 0,15 s es el **texto de ejemplo del modal**; el **código ejecutado** usa 0,5 s en modo `false`. Ese modo no se midió |
| Botón oficial vs Olivier Larose | HOV-001 abre con un aviso: campos 1–15 = Larose (no medido); secciones lote 3/5 = GreenSock (medido) |
| Variantes de TXT-002 y GL-002 | TXT-002: solo variante A inspeccionada; GL-002: solo demo 1 de 8 |
| Estados antiguos contradictorios | Frontmatter `evidencia` y campo 15 actualizados en 6 fichas y 5 TUT; secciones "BLOQUEADA" del lote 4 marcadas como superadas |
| Tamaño/recorte de capturas | README de evidencia: marco 800×957, capturas 400×478 a escala 0,5, dos recortes con su región |
| "Código ejecutado: ninguno" | Precisado: las demos públicas se ejecutaron en el navegador; código propio de medición en consola; nada en terminal |

---

## Lote 6 — 2026-10-26 · v0.7.0

### A. Lote audiovisual pendiente (5 demos)
Condición: el panel del navegador integrado estuvo **oculto** todo el lote (la página recibía ~1 frame/s). Se avisó al usuario; no se pudo medir ninguna animación en tiempo real.

| Demo | Resultado | Evidencia |
|---|---|---|
| Texto con máscara de líneas (Olivier Larose) | Parcial: estructura DOM medida (16 líneas de 45 px, overflow hidden); tiempos no medidos (script agotó el tiempo) | data/TXT-002B_textmask_dom.json |
| Falso 3D (Yuri Artiukh / Codrops) | Parcial: atributos y `app.js` desplegado verificados (umbrales 35/15, maxTilt 15, **sin requestPermission**) | data/GL-003_fake3d_desplegado.json |
| Cámara sobre curva (Wawa Sensei, CodeSandbox) | **Bloqueada** por verificación anti-bots de Cloudflare; no se eludió | data/CAM-002_codesandbox_bloqueo.json |
| Inclinación por velocidad (GreenSock) | Código literal leído (MIT); movimiento no observado | VEL-001 |
| Galería bento (GreenSock) | Código literal + 5 estados medidos en el DOM (actualización forzada); `expoScale(1,5)` verificado con los datos | data/FLIP-002_bento_estados.json · nueva ficha FLIP-002 |

Hallazgo de método: con el panel oculto, las **capturas pueden no coincidir con el DOM** (comprobado en la galería bento) → solo se guardan como ilustración.

### B. Nuevos creadores
- **Hyperplexed** (identidad verificada vía CodePen → YouTube/web): 3 pens leídos (MIT) → HOV-004 spotlight cards, TXT-003 scramble text, DRAG-001 image track.
- **Kevin Powell**: pen de marquesina con mejora progresiva (MIT) → CSS-003, primer ejemplo de la biblioteca que respeta reduced motion, funciona sin JS y evita duplicados para lectores.
- Licencia verificada: los pens públicos de CodePen son **MIT por defecto** (documentación de CodePen) → se pueden citar fragmentos con atribución.

### C. Desarrollo web completo
IMG-001 (imágenes responsive), CSS-004 (container queries), TYPE-001 (tipografía), SEO-001 (Google Search Central), FORM-001 (validación). Contraste con la biblioteca: los tutoriales usan tipografía en `vw` puro (incumple el zoom), `alt` genéricos y metadatos por defecto.

### Recuento
51 fichas técnicas/de conocimiento, 19 TUT, 59 entradas de inventario, 11 JSON de datos de evidencia (7 del lote 5 + 4 del lote 6). Vídeos vistos: 0. Fichas validadas: 0.

### Pendiente (lote 7)
- Repetir con el **panel visible**: tiempos de TXT-002 B, respuesta al ratón de GL-003, movimiento de VEL-001, demos de Hyperplexed y Kevin Powell.
- Codegrid y Creative Coding Club: siguen INACCESIBLES POR COSTE; alternativa gratuita aplicada (GreenSock oficial).
- JavaScript Mastery: otros repos públicos; Wael Yasmina: artículos de cámara/LOD; resto del catálogo.
- Web completa: seguridad de formularios (OWASP), color/contraste y sistema de diseño, patrones UI/UX de webs de negocio, metadata de Next.js, datos estructurados LocalBusiness.

## Lote 7 (2026-10-26) — v0.8.0
### Comprobación previa del navegador (PRIMERO)
- 4 comprobaciones (inicio, mitad, final): `document.hasFocus()` = false, rAF ≈ 0,5/s, la herramienta informa "The Browser pane is currently hidden". Datos: [browser_checks.json](evidence/visual/2026-10-26-lote7/data/browser_checks.json).
- Regla aplicada: con rAF < 50/s o panel oculto **no se hacen mediciones temporales**. Resultado: **0 mediciones temporales** en este lote; demos pendientes (TXT-002 B, GL-003, VEL-001, Hyperplexed, Kevin Powell) siguen pendientes.
### Investigación (DESPUÉS)
- Olivier Larose: 4 tutoriales gratuitos (código + artículo) → FOOT-001, SECT-001, TXT-004, PIX-001 (TUT-020). "Horizontal Scroll" es de pago → INACCESIBLE_POR_COSTE (VR-064).
- Wawa Sensei: versión escrita del autor del tutorial de scroll R3F (dev.to) → ampliación de R3F-001 (VR-065). El vídeo no se ha visto.
- Web completa: OWASP (cabeceras, validación) → SEC-001/002; Next.js CSP y Metadata + Google LocalBusiness → SEO-002; W3C contraste/objetivos → A11Y-003; NN/g home → UX-002.
- Nuevo registro de cobertura por canal: [CHANNEL_COVERAGE.md](CHANNEL_COVERAGE.md) (campo `coverage` en SOURCE_CATALOG.json). **Vídeos de YouTube estudiados: 0**; las transcripciones solo se usarán si el usuario las copia manualmente.
- Totales: 60 fichas, 20 TUT, 70 entradas en VIDEO_RESEARCH_INDEX.
### Pendiente (lote 8)
- Con el **panel visible**: todas las mediciones temporales anteriores.
- Olivier (resto de tutoriales gratuitos), Wael Yasmina (LOD, instancing, carga de modelos), Wawa (serie portfolio), JavaScript Mastery, GSAP docs (ScrollSmoother, Observer, MotionPath, ScrambleText), 33 fuentes con 0 estudiadas.
- Web completa: sistema de diseño (tokens), testing, despliegue, Astro/TypeScript.

## Lote 8 (2026-10-26) — v0.9.0
### Comprobación del navegador
- Inicio (18:50Z) y final (19:02Z): **0 fotogramas en 5 s**, sin foco, la herramienta indica "Browser pane is currently hidden" → **0 mediciones temporales**. Datos: [browser_checks.json](evidence/visual/2026-10-26-lote8/data/browser_checks.json). El navegador se usó solo para leer código de CodePen y listados públicos (sin sesión).
- Demos pendientes de medir (sin cambios): texto con máscara, falso 3D, velocity skew, Hyperplexed, Kevin Powell, cámara sobre curva.
### Canales (vídeos: 0 vistos; vídeos identificados = enlaces del propio autor junto a su código)
- **Olivier Larose:** +5 tutoriales (sticky-cursor, curved-menu, 3d-wave-on-scroll, infinite-text, svg-morph) → HOV-005, MENU-001, GL-004, TXT-005, anexo de MORPH-001. Vídeos identificados: MJ_cRRqBfU8, NOJCt7qyh9c. Patrones y fallos recurrentes resumidos en TUT-021.
- **Hyperplexed:** 6/6 pens populares estudiados (+3) → HOV-006, CSS-005, UX-003. 4 vídeos identificados desde los pens.
- **Kevin Powell:** +1 pen (neon) → CSS-006 (contraste calculado 4,42:1).
- **GreenSock:** pen oficial de Observer + docs Observer/ScrollSmoother/MotionPath → OBS-001, GS-002, GS-003.
- **Bruno Simon (SRC-023):** primera cobertura: repo MIT folio-2019 → ARCH-002 (Three.js Journey sigue INACCESIBLE_POR_COSTE).
- **Web Dev Simplified (SRC-025):** primera cobertura: 4 artículos → CSS-007, A11Y-004.
- **Matt Pocock (SRC-032):** primera cobertura: 3 artículos gratuitos → TS-001.
- **Cassie Evans (SRC-007):** sitio personal retirado (solo mensaje de despedida) → METADATOS_VERIFICADOS; buscar su material en gsap.com/CodePen.
- **midudev (SRC-036):** blog con 7 entradas sin contenido de CSS/rendimiento → METADATOS_VERIFICADOS.
### Web profesional
- Docs oficiales: Astro (islas) → ASTRO-001 (parcial); Playwright → TEST-001; Next.js production checklist → DEPLOY-001; MDN `interpolate-size` y `<dialog>` → CSS-007, A11Y-004.
### Totales
- 78 fichas (+18), 23 TUT (+3), 86 entradas en VIDEO_RESEARCH_INDEX (+16). Cobertura: 402 identificados, 57 estudiados, 30 de 41 fuentes con 0 estudiados ([CHANNEL_COVERAGE.md](CHANNEL_COVERAGE.md)).
- Correcciones menores: KNOWLEDGE_INDEX decía 61 fichas en v0.8.0 en un paso intermedio (corregido a 60 antes de publicar); versión de ScrollSmoother marcada como dato de memoria a verificar.
### Pendiente (lote 9)
- Con el panel visible: todas las mediciones temporales.
- Olivier (48 tutoriales), Wael Yasmina (LOD, instancing, modelos), Wawa (portfolio 3D), JavaScript Mastery, Codrops (repos MIT de github.com/codrops), Frontend Horse, The Coding Train, DesignCourse, Fireship, Traversy, Net Ninja, Jack Herrington, ByteGrad, Theo, canales en español.
- Astro: directivas `client:media/only`, View Transitions, imágenes. Sistema de diseño (tokens), CI (GitHub Actions), RGPD/cookies.

## Lote 9 (2026-10-26) — v0.10.0
### Navegador
- Una comprobación (19:13Z): panel oculto, 0 fotogramas en 5 s → bloqueo registrado una sola vez ([browser_checks.json](evidence/visual/2026-10-26-lote9/data/browser_checks.json)); 0 mediciones. El navegador solo se usó para leer código de pens públicos.
### Nuevos expertos (vídeos de YouTube estudiados: 0)
- **DesignCourse (SRC-006):** 3 artículos gratuitos → UI-002. Vídeo incrustado identificado (rUTuvDyFHwo), no visto.
- **Frontend Horse (SRC-017):** 3 artículos + 3 pens (Michelle Barker, Aaron Iker) → MP-001, BTN-001, UI-001.
- **The Coding Train (SRC-018):** Nature of Code, capítulo Oscillation → PHYS-001.
- **Fireship (SRC-024):** 1 lección (modal) → anexo en PHYS-001 (sin accesibilidad).
- **The Net Ninja (SRC-028):** repo del Master Class, rama final → NEXT-002 (tabla de 7 errores de seguridad/HTML).
- **Traversy Media (SRC-029):** 3 de 50 mini-proyectos (MIT) → UX-004.
- **Jack Herrington (SRC-030):** 4 artículos gratuitos → NEXT-003 (incluye discrepancia con OWASP sobre JWT en localStorage; la biblioteca sigue a OWASP).
- **Coding in Public (SRC-033):** curso Astro 5 (rama final) y light-dark → ASTRO-002, DS-001.
### Web profesional y verificación
- Verificado en docs oficiales: ubicación del archivo `proxy`/`middleware` (raíz o `src/`) y renombrado en Next.js 16; las Server Functions no son rutas separadas para el `matcher`.
- MDN `light-dark()` (Baseline 2024); Google Business Profile (ranking local); three.js InstancedMesh; OWASP HTML5 (localStorage); Utopia (escala fluida, tokens calculados con script).
### Totales
- 91 fichas (+13), 30 TUT (+7), 99 entradas de inventario (+13). Cobertura: 524 identificados, 75 estudiados, 22 de 41 fuentes con 0 estudiados.
### Pendiente (lote 10)
- Mediciones con panel visible (sin cambios).
- Fuentes con 0: Codrops (repos MIT), Osmo, Awwwards, freeCodeCamp, Theo, ByteGrad, ThePrimeagen, Flux Academy, MoureDev, Soy Dalto, Fazt, FalconMasters, Carlos Azaustre, Motion Tricks, Rajacharles, Ihatetomatoes, The Code Creative, Mastering Web Animation, Creative Coding Club, Codegrid (de pago), Cassie Evans, midudev.
- Ampliar: Frontend Horse (máscaras SVG, shaders), Nature of Code (fuerzas, partículas), Jack Herrington (caché, streaming), BatchedMesh, CI/CD, RGPD/cookies.

## Lote 10 (2026-10-26) — v0.11.0
### Navegador
- Una comprobación (19:32Z): panel oculto, 0 fotogramas → registrado una vez ([browser_checks.json](evidence/visual/2026-10-26-lote10/data/browser_checks.json)); 0 mediciones.
### Fuentes prioritarias (vídeos de YouTube estudiados: 0)
- **Codrops (SRC-019):** inventario de 18 tutoriales 2026 (predominio TSL/WebGPU); 3 estudiados → PT-001 (con código de amber + motor MIT hyperkinetic), TXT-006, HERO-001. La landing Astro + GSAP no se pudo leer (error del sitio) → VR-103 INACCESIBLE.
- **midudev (SRC-036):** porfolio.dev (CC BY-NC) → ASTRO-003.
- **Motion Tricks (SRC-014):** 2 de 8 artículos → SVG-001.
- **Carlos Azaustre (SRC-041):** 2 artículos → CSS-008 (sin verificar), CLIENT-001.
- **freeCodeCamp (SRC-026):** 2 artículos → A11Y-005.
- **Theo (SRC-027):** docs create-t3-app → T3-001.
- **Flux Academy (SRC-035):** 1 artículo → CLIENT-001.
- **Sin contenido aprovechable:** ByteGrad (blog básico de Flexbox, cursos de pago), MoureDev (curso de iniciación a JS), The Code Creative (no localizada fuente verificable → pedir enlace al usuario).
### Coherencia
- **ARCH-001 reorganizada** (22 pasos): encargo, sistema de diseño, responsive, componentes, formularios y seguridad, SEO, despliegue; historial de huecos condensado.
- **Trazabilidad de seguridad:** NEXT-002 aclara que sus hallazgos proceden de lectura de código de curso y no son vulnerabilidades demostradas; NEXT-003 aclara que la discrepancia con OWASP es documental.
- **Referencias obsoletas corregidas:** nombre del hook (`useFormState` → `useActionState`) verificado en la guía oficial de formularios de Next.js; FORM-001 enlaza al patrón vigente.
### Totales
- 100 fichas (+9), 37 TUT (+7), 112 entradas de inventario (+13). Cobertura: 638 identificados, 88 estudiados, 15 de 41 fuentes con 0 estudiados.
### Pendiente (lote 11)
- Mediciones con panel visible.
- Fuentes con 0: Creative Coding Club y Codegrid (de pago), Cassie Evans (sitio retirado), The Code Creative (identidad), Ihatetomatoes, Rajacharles, Osmo, Mastering Web Animation, Awwwards, ByteGrad, ThePrimeagen, MoureDev, Soy Dalto, Fazt, FalconMasters.
- Huecos: TSL/WebGPU, BatchedMesh, cookies/RGPD, CI/CD (Husky, Conventional Commits, GitHub Actions), copy de conversión, i18n.

## Lote 11 (2026-10-27) — v0.12.0
### Navegador / YouTube
- Por decisión del usuario, no se repiten pruebas de rendimiento del panel (sigue oculto). Vídeos de YouTube estudiados: 0 (objetivo pendiente).
### P1 — Ingeniería creativa avanzada
- three.js r186 (MIT): wiki TSL, manual WebGPURenderer, BatchedMesh, 3 ejemplos oficiales leídos (galaxia TSL, transición de escenas, partículas compute) → TSL-001, WGPU-001, INST-002, SCN-002. caniuse WebGPU (2026-10-27) en WGPU-001 con discrepancia de Firefox anotada.
- Codrops: cristal líquido TSL → TSL-002 (artículo; sin repo ni licencia). Clúster 3D TSL: error del sitio (VR-117).
- Integración WebGL + GSAP + scroll → GL-006 (incluye licencias de Theatre.js: core Apache-2.0, studio AGPL; repo público inactivo desde 2024-04).
### P2 — Fuentes pendientes
- Cassie Evans: 2 pens → OBS-002. Awwwards: 2 casos → CASE-002.
- Sin material aprovechable: Osmo (recursos gratis tras registro + pago), Ihatetomatoes (blog de 2015), Rajacharles y Mastering Web Animation (identidad no verificable), ThePrimeagen (cursos de algoritmos/productividad, no frontend).
### P3 — Webs comerciales
- AEPD (guía de cookies mayo 2024; guía de medición de audiencia enero 2024) → LEGAL-001, ANALYTICS-001 (con aviso de que no es asesoramiento legal).
- Next.js i18n + Google hreflang → I18N-001; Playwright CI → CI-001; NN/g → COPY-001; web.dev INP → PERF-002.
### P4 — Aprovechamiento por Claude Code (PROPUESTO, no validado)
- Revisadas las 4 Skills: eliminada la afirmación obsoleta de web-commercial-site; rutas relativas a `$WEB_LIBRARY_PATH`; remiten a procedimiento y manifiesto.
- Nueva carpeta `integration/`: INTEGRATION_GUIDE (rutas Windows, 3 opciones de instalación/actualización), RETRIEVAL_PROCEDURE, RETRIEVAL_TESTS (barbería, landing GSAP+Three.js, revisión Next.js), CONSULTA_BIBLIOTECA_TEMPLATE, LIBRARY_MANIFEST.json, tools/library_check.py (validador sin dependencias; resultado: 0 errores) y tools/sync_skills.ps1 (no ejecutado).
### P5 — Calidad documental
- Discrepancia Olivier Larose corregida (texto "10" → 15 con desglose por lote).
- CSS-008 verificado con MDN y Chrome for Developers; `corner-shape` corregido (no es "solo vista previa": experimental con disponibilidad limitada).
### Totales
- 114 fichas (+14), 40 TUT (+3), 127 entradas (+15). Cobertura: 670 identificados, 93 estudiados, 13 de 41 fuentes con 0 estudiados (varias por pago, cuenta o identidad no verificable).
### Pendiente (lote 12)
- Ejecutar (cuando se autorice) las pruebas de `integration/RETRIEVAL_TESTS.md` en entorno aislado.
- three.js: procedural texture, raging sea, interoperability, bloom selectivo; compresión glTF (Draco/Meshopt/KTX2).
- Codrops: clúster TSL y landing Astro (reintentar); Astro: imágenes y View Transitions.
- Fuentes con 0 que dependen del usuario: enlaces de The Code Creative, Rajacharles, Mastering Web Animation; autorización para cuentas (Osmo).

## Lote 12 (2026-10-27) — v0.13.0
### 1. Correcciones de integración (todo PROPUESTO; nada ejecutado)
- Convenciones de Skills contrastadas con la documentación vigente de Claude Code (skills y CLI, 2026-10-27): ubicaciones (personal, proyecto, `--add-dir` de sesión, plugin), frontmatter en la primera línea, `name` = carpeta, `description` (+`when_to_use`) ≤ 1 536 caracteres, `SKILL.md` < 500 líneas, sustituciones `${CLAUDE_SKILL_DIR}`/`${CLAUDE_PROJECT_DIR}`, `allowed-tools`, `/skills`, `claude plugin validate`.
- **Ruta real de la biblioteca:** las Skills calculan `LIB = ${CLAUDE_SKILL_DIR}/../../..` (sustitución oficial) y exigen leer `LIB/KNOWLEDGE_INDEX.md`; se retira `$WEB_LIBRARY_PATH` (era solo texto). Respaldo: línea literal `WEB_LIBRARY_ROOT=` en el `CLAUDE.md` del proyecto si se copian.
- Nuevo espejo `.claude/skills/` idéntico a `skills/` (requisito para cargar las Skills con `claude --add-dir <biblioteca>` sin instalar nada). `library_check.py` ahora valida convenciones y que el espejo sea idéntico.
- `sync_skills.ps1` reescrito: sin `robocopy /MIR`, simulación por defecto (`-Apply` para copiar), solo destino de proyecto, rechaza la carpeta personal, uniones/enlaces y carpetas ajenas sin marca `.web-library-skill`, control de errores. **No ejecutado.**
### 2. Prueba mínima de solo lectura (DISEÑADA, NO EJECUTADA)
- `integration/MINIMAL_INTEGRATION_TEST.md`: carpeta temporal, `claude -p --bare --add-dir <biblioteca> --permission-mode plan --disallowedTools … --output-format stream-json --verbose`; 5 fichas para barbería + landing cinematográfica; rutas exactas, decisiones y registro.
- `integration/tools/verify_test_evidence.py`: verifica en la salida `stream-json` la invocación de la Skill, lecturas reales con Read, ≥ 5 fichas del manifiesto, rutas existentes, ausencia de escritura, versión e IDs citados. Probado solo con dos ficheros sintéticos en el espacio de trabajo de la sesión (no son evidencia de integración y no se incluyen).
### 3. Investigación
- GLTF-001 (glTF-Transform, gltfpack, guía KTX de Khronos, GLTFLoader); TSL-003 (ejemplo oficial raging sea); ST-005 (ScrollTrigger.batch); A11Y-006 (WCAG 2.2); SEC-003 (seguridad de datos Next.js); FORM-001 y UX-002 ampliadas con NN/g.
### Totales
- 119 fichas (+5), 41 TUT (+1), 134 entradas (+7). Vídeos de YouTube estudiados: 0.
### Pendiente
- Ejecutar la prueba mínima cuando el usuario lo autorice; después, RETRIEVAL_TESTS.
- Iluminación (HDRI, sombras, baking), Draggable/Inertia, Astro imágenes/View Transitions, Lighthouse CI.


## Lote 13 (2026-10-27) — v0.14.0
### Fase 1 — Prueba mínima de integración (autorizada; ejecutada UNA vez con una copia de v0.13.0)
- Entorno: contenedor Linux de la sesión, Claude Code 2.1.311, autenticación OAuth (suscripción). Registro y evidencias: `evidence/integration/2026-10-27/prueba_minima/`.
- `--bare` → BLOQUEADO (solo admite clave de API; se comprobó con coste 0). Sustituto usado: `--restricted --tools "Read,Grep,Glob,Skill" --permission-mode plan --permission-prompts none --strict-mcp-config`.
- **CONFIRMADO:** carpeta aislada (un Glob fuera de ella fue denegado), lecturas reales de KNOWLEDGE_INDEX, manifiesto, plantilla y 5 fichas (LEGAL-001, SEO-003, GL-006, ST-001, A11Y-001), versión 0.13.0 citada literalmente, decisiones fieles a los campos citados (revisión humana), sin escritura, copia de la biblioteca intacta (sha256), sin consumo de exceso (`isUsingOverage: false`).
- **NO CONFIRMADO / BLOQUEADO:** descubrimiento de la Skill — no figuraba en el evento `init` y `Skill(web-library-router)` devolvió `Unknown skill`; Claude Code lo declaró y siguió el SKILL.md leyéndolo con Read. Causa según la documentación (no verificada con otra ejecución): las Skills de `--add-dir` llegan por la fuente `project`, que `--restricted` no carga.
- **Fallos propios detectados:** el verificador dio un falso positivo (corregido: exige Skill en `init` y resultado sin error → veredicto real NO SUPERA); el manifiesto (55 KB) se truncó al leerlo (930 de 1240 líneas) → formato compacto de ≈ 29 KB y aviso en `library_check.py` a partir de 35 KB.
- Comando corregido para la próxima ejecución (pendiente de autorización): `--setting-sources project --strict-mcp-config --tools "Read,Grep,Glob,Skill" --add-dir … --permission-mode plan --permission-prompts none`.
### Fase 2–3 — Investigación
- GreenSock: `normalizeScroll()`/`ignoreMobileResize` → ST-006; Draggable → apéndice de DRAG-001; st-mistakes releído (ya estaba en ST-004 desde el lote 1: **se detectó y eliminó una ficha duplicada creada en este lote** antes de entregar; el "pendiente de análisis" de ST-001 era una referencia obsoleta, corregida).
- three.js r186: manual de sombras + código fuente (PCFSoftShadowMap obsoleto desde r186, se sustituye por PCF con aviso), sombra de contacto, CSM, entorno UltraHDR → LIGHT-001.
- Astro: imágenes y View Transitions → ASTRO-004. Playwright: regresión visual → TEST-002. Lighthouse CI → CI-002. W3C APG: carrusel → A11Y-007. NN/g: jerarquía visual → UI-002 ampliada.
- Codrops (Joseph Santamaria, 2025-11-19) + repo (MIT declarado sin archivo LICENSE) → apéndice de CAM-001 y TUT-042. Artículo de cámara de Blender (07-2026): error del sitio (VR-145).
- Fuentes en español: Fazt (org. FaztWeb, CRUD) y FalconMasters (cursos de pago) → METADATOS_VERIFICADOS; Soy Dalto sin sitio oficial localizado.
### Totales
- 125 fichas (+6), 42 TUT (+1), 148 entradas (+14). Cobertura: 689 identificados, 98 estudiados (corregido en el lote 15: **97**, el 98 se calculó antes de retirar la ficha duplicada), 13 de 41 fuentes con 0 estudiados. Vídeos de YouTube estudiados: 0.
### Pendiente (lote 14)
- Ejecutar la prueba corregida (solo con autorización) y, si la Skill carga, las 3 pruebas de RETRIEVAL_TESTS.
- *Baking*/lightmaps; foco y anuncios con `<ClientRouter />`; InertiaPlugin (licencia en la página de instalación); Codrops: cámara de Blender, clúster TSL, landing Astro (reintentar); Soy Dalto: enlace del usuario.

## Lote 14 (2026-10-27) — v0.14.1
### Prueba de integración n.º 2 (autorizada; ejecutada UNA vez con una copia de v0.14.0)
- Comando sin `--bare` ni `--restricted`: `--setting-sources project --strict-mcp-config --tools "Read,Grep,Glob,Skill" --allowedTools "Skill(web-library-router)" --add-dir … --permission-mode plan --permission-prompts none`.
- **SUPERA** todas las comprobaciones: Skill en `init`, invocación sin error, `${CLAUDE_SKILL_DIR}` sustituido por la ruta real, índice y manifiesto completo leídos, 5 fichas (LEGAL-001, SEO-002, GL-006, TJ-001, A11Y-001), ruta absoluta de LIB citada, sin escritura, verificador SUPERA (también la versión ampliada), revisión humana conforme, copia intacta, sin exceso de consumo.
- Estado: **PROBADA EN ENTORNO AISLADO** la lectura e invocación manual. No demostrados: activación automática, Windows, calidad de las webs, mejora frente a no usar la biblioteca.
- Cambios derivados: verificador con 2 comprobaciones más (manifiesto leído, ruta absoluta citada); cabeceras de las 4 Skills actualizadas (Claude Code señaló que decían "lote 12"); DRAG-001: licencia de InertiaPlugin resuelta con la Skill oficial `gsap-plugins` de GreenSock (todos los plugins gratuitos, también comerciales).
### Conocimientos de alto valor identificados para próximos lotes (NO estudiados todavía)
| Prioridad | Tema | Fuente candidata (verificar antes de usar) | Por qué |
|---|---|---|---|
| 1 | Activación automática de la Skill (sin nombrarla) y prueba en Windows | Prueba propia (requiere autorización) | Último eslabón de la integración de lectura |
| 1 | Skills oficiales de GreenSock (gsap-core, timeline, scrolltrigger, plugins, frameworks, performance) | github.com/greensock/gsap-skills (MIT, ya clonado, commit aed9cfd) | Contrastar nuestras fichas GSAP con la guía oficial pensada para agentes; detectar contradicciones |
| 1 | *Baking* de luz y lightmaps (Blender → glTF → `lightMap`/`aoMap`) | Manual/documentación de three.js y de Blender; foro discourse.threejs.org solo como pista | Hueco de LIGHT-001 y ARCH-001; gran salto de calidad visual con coste casi nulo en ejecución |
| 2 | Skill de WebGPU/TSL de Dan Greenheck | cdn.jsdelivr.net/gh/dgreenheck/webgpu-claude-skill (README; identidad y licencia por verificar) | Conocimiento TSL orientado a agentes; posible fuente para TSL-001/002/003 |
| 2 | Postprocesado con WebGPU/TSL (bloom selectivo, transiciones) | Ejemplos oficiales three.js r186 | Acabado "premium" de escenas; rendimiento |
| 2 | Codrops: cámara de Blender para galería con scroll (07-2026), clúster TSL, landing Astro | tympanus.net (reintentar; dieron error del sitio) | Técnicas cinematográficas recientes con código |
| 2 | Foco y anuncios de cambio de página con `<ClientRouter />` | Documentación de Astro | Accesibilidad de transiciones SPA (ASTRO-004 §11) |
| 3 | Tipografía variable y carga de fuentes (subsetting, `font-display`, métricas de respaldo) | MDN / web.dev | CLS y calidad tipográfica en webs comerciales |
| 3 | Composición y color (OKLCH, contraste APCA vs WCAG 2) | MDN, W3C | Diseño profesional con sistema de color predecible |
### Pendiente (lote 15)
- Solo con autorización: prueba de activación automática; después, las 3 pruebas de RETRIEVAL_TESTS.
- Estudiar las candidatas de prioridad 1 sin duplicar fichas existentes (comprobar primero KNOWLEDGE_INDEX y el manifiesto).

## Lote 15 (2026-10-27) — v0.15.0
### Fase 1 — Prueba n.º 3: activación automática (autorizada; ejecutada UNA vez con una copia de v0.14.1)
- Encargo natural (sin mencionar la Skill, las Skills ni la biblioteca). Registro: `evidence/integration/2026-10-27/prueba_automatica_3/`.
- **Activación automática CONFIRMADA:** la primera acción de Claude Code fue `Skill(web-library-router)`, sin error, antes de cualquier lectura.
- Leyó KNOWLEDGE_INDEX, RETRIEVAL_PROCEDURE, ARCH-001 y 6 fichas (SEO-002, SEO-003, A11Y-001, LN-001, ASTRO-002, PERF-001); ninguna de GSAP/Three.js; decisiones de esas fichas fieles (revisión humana).
- **Uso parcial:** citó 46 IDs sin leerlos; no leyó el manifiesto; no dio rutas absolutas ni el registro CONSULTA. Verificador (criterios fijados antes): **NO SUPERA** (2 de 13). Restricciones respetadas; copia intacta; sin exceso de consumo.
- Cambios: verificador con clasificación manual/automática (`--prompt`, `--modo automatico`), contención real de rutas (`commonpath`, detecta prefijos engañosos), información de IDs citados sin leer; `web-library-router` con reglas de cobertura por área, citar solo lo leído y registro obligatorio (sin probar); `library_check.py` comprueba los recuentos del índice (fichas, TUT, entradas VR) contra los archivos.
### Fase 2 — Investigación
- **A. Skills oficiales de GreenSock** (gsap-skills, MIT, aed9cfd) → GS-004: contradicción en `refreshPriority` (la Skill dice "menor primero"; la documentación, "mayor primero" → se sigue la documentación), ejemplo de scroll horizontal con `Max.max`, matices sobre `will-change` y limpieza; patrones nuevos (matchMedia con condiciones, `matchMediaRefresh`, ScrollToPlugin con `offsetY`, `scrollerProxy`, `gsap.utils`, Vue/Nuxt/Svelte, consejos de SplitText). Apéndices en ST-004, A11Y-001, TXT-001. TUT-043.
- **B. Iluminación** → LIGHT-002: `lightMap` (lineal, float), `aoMap` (canal rojo, NoColorSpace), `Texture.channel`/`uv1`, GLTFLoader (`occlusionTexture` → `aoMap`), exportador glTF de Blender (nodo *glTF Material Output* → Occlusion; lightmaps no documentados), horneado en el navegador con `LightMapper`/`unwrapUVs` (rama dev, solo WebGPU). **Manual de horneado de Blender INACCESIBLE** para la herramienta (VR-154) → pasos marcados [memoria].
- **C. WebGPU/TSL** → POST-001: `PostProcessing` obsoleta desde r183 → `RenderPipeline`; bloom (`strength`, `radius`, `threshold`), selectivo por MRT y por emisivo; GTAO + TRAA vs SSAO.
- **D. Web profesional:** TYPE-001 (carga de fuentes, web.dev) y UI-002 (OKLCH y color relativo, MDN).
- **Incidente propio:** se ejecutó por error un script antiguo (lote 4) que sobrescribió `SOURCE_CATALOG.json` y `CHANNEL_COVERAGE.md` con datos de la v0.8.0; se restauraron desde el ZIP v0.14.1 y se reaplicaron los cambios del lote 15. Los scripts antiguos se apartaron.
- **Inventario:** el ZIP v0.14.1 contenía 149 registros VR (índice correcto); se corrige el total de estudiados del lote 13 (97, no 98).
### Totales
- 128 fichas (+3), 43 TUT (+1), 157 entradas (+8). Cobertura: 689 identificados, 98 estudiados, 13 de 41 fuentes con 0 estudiados. Vídeos de YouTube estudiados: 0.
### Pendiente (lote 16)
- Con autorización: repetir la prueba automática con la Skill corregida (mismo encargo) para medir si mejora la cobertura y la citación; prueba en Windows.
- Verificar los pasos de horneado de Blender por otra vía oficial; `matchMediaRefresh` con interruptor propio; gama P3 en OKLCH; foco y anuncios con `<ClientRouter />`.

## Lote 16 (2026-10-27) — v0.16.0
### Fase 1 — Verificador endurecido (antes de la prueba)
- Falla si se cita una ficha no leída sin "(no leída)" en la misma línea; distingue fichas leídas / mencionadas como pendientes / citadas sin marcar; solo cuentan lecturas **completas y sin error** (`limit`/`offset` que no cubren el archivo o `is_error` → no cuentan); áreas con `--areas` (por carpeta; `3d?` exigida si la respuesta trata 3D); manifiesto leído con Read; registro CONSULTA (títulos 1–4) y ruta absoluta de cada ficha. Criterios anteriores intactos.
- Autoprueba `selftest_verify.py`: 7 casos sintéticos (1 correcto, 6 incorrectos) → resultado esperado en todos.
### Fase 2 — Prueba n.º 4 (una sola ejecución, copia de v0.15.0, mismo encargo que la n.º 3)
- Activación automática **confirmada** (invocó `web-library-router` y `web-commercial-site` por iniciativa propia).
- 12 fichas leídas completas de 5 áreas (UX-002, CLIENT-001, SEO-002/003, A11Y-001, ST-001, GS-002, FORM-001, LEGAL-001, PERF-001, CSS-001, ASTRO-002); decisiones fieles (revisión humana); 2 fichas citadas sin leer, ambas declaradas.
- **Recuperación PARCIAL**: manifiesto solo consultado con Grep; descarte del 3D sin ficha de `threejs/` (la Skill lo permitía con "criterio propio"); registro sin el formato de la plantilla ni rutas absolutas por ficha. Verificador: NO SUPERA (5 de 24); una de las 5 (atribución) es un falso negativo — la respuesta usó "sin leer" en vez de "(no leída)".
- Correcciones v0.16.0 (sin probar): Skill exige leer el manifiesto con Read, ficha por área también para descartar, títulos literales del registro y ruta absoluta por ficha; el verificador acepta "sin leer" (declarado antes de la siguiente prueba).
### Fase 3 — Investigación
- **GSAP (docs oficiales):** `matchMedia` (condiciones, *scope*, contexto interno), `matchMediaRefresh()` confirmado para el interruptor de movimiento reducido, ScrollToPlugin (`offsetY`, `autoKill`, conflicto con `scroll-behavior: smooth`), ScrollSmoother desde 3.10.0 → GS-004, A11Y-001, GS-002. Versiones npm: gsap 3.15.0, @gsap/react 2.1.2, lenis 1.3.27.
- **Blender:** el manual sigue sin poder leerse (4 intentos; cuerpo ausente) → pasos de horneado **verificados en el código fuente** de Blender 5.4 alfa (espejo GitHub) y del exportador glTF (Khronos) → LIGHT-002 sin marcas [memoria].
- **three.js:** `LightMapper`/`unwrapUVs` **no** están en el paquete publicado 0.186.1 (solo en dev); BloomNode/GTAO/TRAA/RenderPipeline sí → LIGHT-002, POST-001. Nueva **PBR-001** (espacios de color por textura, `NoToneMapping` por defecto, capas físicas que recompilan al cruzar 0, `renderTransmissionPass`).
- **Web profesional:** Astro ClientRouter con anunciador de rutas (`aria-live="assertive"`, `<title>` → `<h1>` → ruta); foco no documentado → ASTRO-004. P3 con `@media (color-gamut: p3)` y respaldo sRGB → UI-002. Verificadas afirmaciones antes marcadas de memoria: TS 5.4 `module: preserve`, Firefox 141 WebGPU (fuentes secundarias), PostProcessing→RenderPipeline.
### Fase 4 — Protección
- Copia íntegra previa (`WEL_pre_lote16_*.tgz`, fuera de la biblioteca); `library_check.py --baseline` (falla si desaparece una ficha, TUT o VR; avisa si bajan los estudiados); `integration/MANTENIMIENTO.md`. Comprobado contra v0.15.0: 0 pérdidas.
### Totales
- 129 fichas (+1), 43 TUT, 167 entradas (+10). Cobertura: 689 identificados, 98 estudiados, 13 de 41 fuentes con 0 estudiados. Vídeos de YouTube estudiados: 0.
### Pendiente (lote 17)
- Con autorización: prueba n.º 5 con la Skill de v0.16.0 (mismo encargo, mismos criterios + "sin leer").
- Foco tras la navegación con ClientRouter (probar); gama fuera de pantalla en OKLCH/P3; Blender: comprobar en una instalación real (requiere autorización y un equipo con Blender).

## Lote 17 (2026-10-27) — v0.17.0
### Fase 1–2 — Prueba n.º 5 (última repetición autorizada; copia del ZIP v0.16.0; mismo encargo)
- Criterios fijados antes (verificador acepta "(no leída)" y "sin leer"; área 3D obligatoria). Verificador: **SUPERA (24/24)**.
- Revisión humana: Skill activada sola; índice y **manifiesto completos**; 13 fichas leídas completas de todas las áreas, incluida **WGPU-001** antes de descartar el 3D; 15 fichas mencionadas solo como lecturas futuras "(no leída)"; registro con las 4 secciones y rutas absolutas; decisiones contrastadas con grep. **Reserva:** `role="status"` y "sin animaciones en errores" aparecen bajo "Formulario (FORM-001)" sin estar en esa ficha → corrección documental en la Skill (marcar "[conocimiento general]").
- Conclusión según la directiva: **recuperación automática DEMOSTRADA en entorno Linux aislado** (un encargo, Claude Code 2.1.311). No se repite. Siguiente hito: implementación real en un proyecto aislado (con autorización).
### Fase 4 — Trazabilidad
- `make_trace.py` (traza.json con rutas relativas, sha256 de cada archivo leído, versión, sha256 de ZIP, manifiesto y evidencia) y `--remap` en el verificador. Demostrado: pruebas n.º 4 (traza retroactiva) y n.º 5 re-verificadas **después de borrar** sus carpetas temporales, desde una copia nueva del mismo ZIP.
### Fase 3 — Investigación
- **Next.js 16 Cache Components** → NEXT-004 (`use cache` + `cacheLife` + `cacheTag`, Suspense para datos de petición, `use cache: private/remote`, `connection()`, carcasa estática, bots).
- **React 19.2** → REACT-001 (`<Activity>` oculto desmonta efectos y conserva estado; `useEffectEvent`; `cacheSignal`; pistas de rendimiento; implicaciones para GSAP, inferidas).
- **three.js:** `THREE.Clock` obsoleto desde r183 → `THREE.Timer` (GL-006).
- **GSAP:** contraste de Flip y MotionPath con las Skills oficiales: nuestras fichas ya cubrían más; añadido MotionPathHelper solo para desarrollo (GS-003).
### Totales
- 131 fichas (+2), 43 TUT, 171 entradas (+4). Cobertura: 689 identificados, 98 estudiados, 13 de 41 fuentes con 0 estudiados. Vídeos de YouTube estudiados: 0.
### Pendiente (lote 18)
- Con autorización: **implementación real en un proyecto aislado** (p. ej. landing de barbería en Astro con GSAP), con pruebas técnicas y visuales ejecutadas (Playwright, Lighthouse) y comparación con/sin biblioteca.
- Integración en Windows (equipo del usuario).

## Lote 18 (2026-10-27) — v0.18.0
### Fase 1 — Prototipo n.º 1 (una ejecución, carpeta temporal aislada)
- **Bloqueo previo documentado:** Astro, GSAP y Lighthouse no disponibles; no se instalaron (sin autorización) → HTML/CSS/JS nativos; GSAP **no probado**.
- Claude Code 2.1.311 (Read, Grep, Glob, Skill, Write, Edit; sin Bash ni red; `acceptEdits` con *deny* sobre la biblioteca) construyó `index.html`, `styles.css` y `main.js` (1 026 líneas) en 319 s, sin cargos adicionales; copia de la biblioteca intacta.
### Fase 2 — Uso de la biblioteca
- Activación **automática** (también `web-commercial-site` y `web-qa-validation`); índice, manifiesto y 11 fichas leídos **antes** de escribir; recomendaciones aplicadas en el código (CSS-001, A11Y-001, FORM-001, UX-002, PERF-001; A11Y-007, ST-001 y WGPU-001 para descartar); fichas no leídas marcadas; adaptaciones declaradas.
- Verificador de construcción (nuevo, `verify_build_evidence.py`, fijado antes): **NO SUPERA 13/16** — no creó `CONSULTA_BIBLIOTECA.md` (registro solo en la respuesta, con rutas abreviadas).
### Fase 3–4 — Pruebas y evaluación (Playwright 1.63.0 + Chromium 153)
- 0 errores de consola, 0 recursos fallidos, sin desbordamiento horizontal en 1440/768/375/320, foco visible en 24/25 paradas, reduced motion correcto (0 ocultos, 0 animaciones), formulario sin red, LCP de laboratorio 132 ms y CLS 0 (local, sin limitación), 24 pares de contraste correctos y 8 sin medir.
- **Fallos:** cabecera móvil en dos filas a 375/320 px; foco sin indicador en el selector de calendario de Chromium; registro no guardado; contraste elegido "a ojo".
- Evaluación visual (capturas): profesional en escritorio; galería con ilustraciones genéricas; "cinematográfico" discreto; **ritmo de animación NO VERIFICADO**. Calidad profesional **no validada**.
### Fase 5 — Comparación con/sin biblioteca
- Diseño en `integration/COMPARACION_CON_SIN_BIBLIOTECA.md` (≥ 3 ejecuciones por brazo, modelo fijado, métricas T1–T11, rúbrica visual a ciegas, regla de decisión previa). Herramienta genérica `integration/tools/prueba_web_playwright.mjs`. **No ejecutada.**
### Fase 6 — Investigación derivada de los fallos
- UX-004: presupuesto de anchura de la cabecera móvil; A11Y-003: contraste sobre degradados (W3C 1.4.3, F83); FORM-001: foco de `input type=date`; Skills: registro obligatorio como archivo, medir contraste, comprobación de cabecera a 320/375.
- `integration/VERSIONES_VIGENTES.md`: Astro 7.4.2 y TypeScript 7.0.2 publicados frente a fichas de Astro 4–5 y TS 5 (riesgo alto); licencia de GSAP (Standard "No Charge", uso comercial permitido, excepción de editores visuales competidores).
### Totales
- 131 fichas, 43 TUT, 175 entradas (+4). Cobertura: 689 identificados, 98 estudiados. Vídeos de YouTube estudiados: 0.
### Pendiente (lote 19)
- Autorizaciones: `npm install` de `gsap` (y `astro`, `lighthouse`) en la carpeta temporal para un prototipo con el stack preferido; brazo B de la comparación (y repeticiones).
- Actualizar las fichas de Astro a la versión 7 (documentación oficial).


## Lote 19 (2026-10-27) — v0.19.0
### Fase 1 — Control B1 sin biblioteca (una ejecución)
- Registro previo (`evidence/integration/2026-10-27/control_B1/registro_previo.md`) antes de lanzar: mismo Claude Code 2.1.311, mismo modelo (`claude-sonnet-5-5`, fijado con `--model`), mismo prompt byte a byte (sha256 6ec0d8dd…), mismas herramientas y banderas **salvo `--add-dir`**; *deny* de Read/Glob/Grep sobre la biblioteca, A1 y `/mnt/user-data`. `init` de B1: 0 Skills `web-*`.
- B1: 6 turnos, 114 s, 0 lecturas, 0 denegaciones, sin cargos (`isUsingOverage: false`); 634 líneas (A1: 26 turnos, 319 s, 1 026 líneas; coste nominal 3,4×).
### Fase 2 — Batería idéntica sobre A1 y B1 anonimizados (W-4FF0 / W-8508)
- A1 sin modificar (sha256 igual antes y después). Empate en T1, T2, T3, T5, T6, T7 y T8; B1 mejor en T4 (cabecera en una fila) y en peso (32,5 KB frente a 48,8 KB; 281 frente a 362 nodos); ambos con 2 textos del héroe por debajo de AA en móvil (nueva medición compuesta).
- Visual (opinión del orquestador, **no ciega**: reconoció A1): 3,75 (B1) frente a 4,00 (A1); A1 mejor en utilidad comercial; estética casi idéntica.
- **Resultado exploratorio (n = 1): sin mejora atribuible a la biblioteca en esta pareja** según la regla fijada. No generalizable.
### Fase 3 — Plan Astro + GSAP (sin instalar)
- `integration/PLAN_ASTRO_GSAP.md`: versiones exactas (astro 7.4.2, gsap 3.15.0, **typescript 6.0.3**), carpeta temporal, `--ignore-scripts`, pruebas de compatibilidad K1–K6 contra las fichas, 8 técnicas GSAP reales, validación y comparación sobre el mismo stack.
### Fase 4 — Investigación derivada
- Nuevas: **TEST-003** (contraste sobre fondos compuestos, IMPLEMENTADO) y **TEST-004** (batería genérica comparativa, IMPLEMENTADO; falsos positivos de la métrica de ocultos corregidos con `ocultos_con_contenido`).
- ASTRO-004 (+ avisos en ASTRO-001/002/003): cambios de Astro 6 y 7 desde las guías oficiales. TS-001: TS 7 sin API estable; `@astrojs/check@0.9.12` solo admite TS ^5 || ^6 [MED]. UX-004: solución de cabecera de B1 medida. A11Y-003: enlace a TEST-003. Skills actualizadas (router, comercial, cinematográfica, QA).
### Totales
- 133 fichas (+2), 43 TUT, 180 entradas (+5). Cobertura: 689 identificados, 98 estudiados (sin cambios: las fuentes nuevas son documentación oficial). Vídeos de YouTube estudiados: 0.
### Pendiente (lote 20)
- Autorizaciones: instalación de Astro + GSAP según el plan; repeticiones A2, B2, A3, B3 (sobre el mismo stack); evaluación visual ciega por una persona con las capturas anonimizadas; revisión humana de los vídeos.

## Lote 20 (2026-10-27) — v0.20.0
### Fase 1 — Auditoría audiovisual de la referencia Enky
- Archivo aportado por el usuario (`ENKY_referencia_para_Cowork.mp4`, 51 s, 360 × 780, 24 fps, sha256 ce630506…): **grabación de pantalla de Instagram** con 6 reels de @enkywebstudio y su perfil. **Primer vídeo inspeccionado** fotograma a fotograma (hojas a 2 fps, detalles a 3–16 fps, cortes con ffmpeg, desplazamientos con OpenCV).
- Hallazgo principal: Instagram marca todos los reels como **"Contenido generado con IA"**; la "página" tiene erratas y pseudotexto → **no se puede confirmar una web real**; se trata como referencia de dirección de arte y movimiento. La cámara del reel está quieta (< 0,15 px/f); los bucles y los títulos de la pared son montaje.
- 11 patrones repetidos (objeto único que se transforma, texto en sándwich, palabra fantasma, 3 actos rotulados, paleta monocroma, satélites en órbita, paneles, disolución de ~0,5 s, líquido continuo, interfaz mínima) e impulsos de scroll que deceleran en ~1–1,5 s [MED].
### Fase 2 — Conocimiento
- Nuevas: CASE-003, SEQ-001 (helper oficial `imageSequence` + vídeo con alfa), DEPTH-001, ART-001, EVAL-001. Herramienta `integration/tools/composicion_captura.py` (paleta, monocromía, espacio negativo, foco) ejecutada sobre 7 fotogramas de la referencia y sobre A1/B1: el foco de la referencia es 0,32–0,76 frente a 0,25 (A1) y 0,18 (B1).
- Ampliadas: ARCH-001 (pasos 1b, 17, 19), VID-001, COMPARACION_CON_SIN_BIBLIOTECA. Pruebas del plan Astro+GSAP renombradas a K1–K6.
### Fase 3 — Criterios obligatorios
- C1 fidelidad visual, C2 fidelidad de movimiento y C3 calidad creativa (EVAL-001) incorporados a `web-cinematic-site`, `web-qa-validation`, `web-library-router` y `web-commercial-site` (héroe premium). Ninguna web se aprueba como cinematográfica solo por compilar, pasar pruebas o usar GSAP.
### Fase 4 — Prototipo n.º 2 preparado (no implementado)
- `integration/BRIEFING_STORYBOARD_PROTOTIPO_2.md`: "El ritual" (navaja → espuma → vapor) en 3 actos, storyboard F0–F8, criterios de aceptación y decisiones pendientes (D1: origen de los recursos fotorrealistas).
### Totales
- 138 fichas (+5), 43 TUT, 185 entradas (+5). Vídeos inspeccionados: 1 (no YouTube). Vídeos de YouTube estudiados: 0.
### Pendiente (lote 21)
- Decisiones D1–D3 del briefing; autorización de Astro + GSAP; herramientas de C2.2 y C2.3 (curvas valor/progreso y continuidad de la secuencia); calibrar los umbrales de C1 con más referencias a resolución completa; leer el caso OPTIKKA de Codrops cuando esté accesible.

## Lote 21 (2026-10-27) — v0.21.0
### 1 · Criterios creativos consolidados
- C1, C2 y C3 siguen siendo obligatorios en lo cinematográfico; `web-commercial-site` corregida: un **héroe premium animado** también debe superar C2. Umbrales de C1 conservados como **provisionales**. Nueva herramienta `integration/tools/curvas_scroll.mjs` (C2.2/C2.3), probada sobre A1.
### 2 · Estrategia de recursos visuales
- `integration/ESTRATEGIA_RECURSOS_VISUALES.md`: comparación de A (fotografía o vídeo propio o libre), B (Blender) y C (sintéticos o composición) en 7 criterios. Recomendación: **B para el protagonista y A como complemento**; C solo para bocetos y con autorización.
- Restricciones medidas: sin GPU, 2 CPU, 7 GB; download.blender.org y huggingface.co bloqueados desde el contenedor; ffmpeg con WebP y alfa verificado.
- Licencias verificadas (ASSET-001): Unsplash, Pexels, Pixabay, Poly Haven (CC0), Blender (renders propiedad del autor); rembg y BiRefNet MIT; **RMBG-2.0 NC (excluido)**; FLUX.1-schnell, Wan2.1-T2V-1.3B y Depth-Anything-V2-Small con Apache-2.0.
### 3 · Prueba Actos I → II planificada (no implementada)
- `integration/PLAN_PRUEBA_ACTO_I_II.md`: 8 requisitos, cada uno con su implementación y su medida; recursos especificados (70 fotogramas con alfa); mapa de scroll; dependencias; orden de trabajo con autorizaciones R1/D2; criterios de aceptación.
### 4 · Astro + GSAP
- Versiones confirmadas (astro 7.4.2, gsap 3.15.0, typescript 6.0.3, @astrojs/check 0.9.12). Árbol resuelto **sin instalar** (lockfile de 336 paquetes; solo fsevents tiene script de instalación; libvips LGPL). Procedimiento `npm ci --ignore-scripts` con `.npmrc` local, sin nada global.
### 5 · Investigación
- Nuevas: **SEQ-002** (producción y entrega; casos OPTIKKA y Apple; opciones de render de Blender leídas en su código), **ASSET-001**, **CASE-004** (casos verificables y clasificación R1–R4). Ampliadas: SEQ-001, VID-001 (all-intra), EVAL-001, ART-001, CASE-003 (clase R3/R4).
- Webs inspeccionadas en el navegador del usuario (DOM y red, con el panel oculto, sin observación visual): optikka.com (224 fotogramas WebP móviles ≈ 3,35 MB) y apple.com/airpods-pro (VideoScrub con alfa).
### Totales
- 141 fichas (+3), 43 TUT, 195 entradas (+10). Vídeos de YouTube estudiados: 0.
### Pendiente (lote 22)
- Decisiones R1–R3 (recursos) y D2 (instalación); repetir la inspección de OPTIKKA y Apple con el panel visible y grabar vídeo; recalibrar los umbrales de C1 con referencias R1.

## Lote 22 (2026-10-27) — v0.22.0
### 1 · Prueba replanteada en hitos A → B → C (`integration/PLAN_LOTE22_HITOS_ABC.md`)
- **A:** fotograma de la navaja con calidad de anuncio: especificación de geometría, materiales, luz, cámara, composición con la tipografía y criterios de aceptación. **B:** B0 con máscara y disolución sin coste de render, y B1 con la apertura en 36 fotogramas (elegida entre 7 alternativas, PROD-001). **C:** integración con GSAP (pin + scrub, dos canvas con el titular entre ambos, matchMedia, reduced motion, medición).
- Presupuesto previsto: secuencia ≤ 3 MB en escritorio y ≤ 1,2 MB en móvil; memoria decodificada ≤ 90 MB (cálculo); LCP ≤ 150 KB.
### 2 · Recursos (sin descargar)
- Modelos de navaja en Sketchfab con CC BY (atribución; la descarga requiere cuenta → la haría el usuario); Free3D/TurboSquid *royalty free* (no redistribuir); Poly Haven sin navajas, con 89 HDRI de estudio CC0. Recomendación: **modelado propio** (pivote para abrirla).
- Blender leído en el código: entradas del Principled BSDF, muestreo, `time_limit`, eliminador de ruido, dispositivos de GPU, `film_transparent`, `holdout`, `indirect_only`, `is_shadow_catcher` y la línea de comandos. El contenedor no tiene GPU; la GPU del ordenador del usuario es desconocida.
### 3 · Astro + GSAP
- Nuevas pruebas K7 (pin y scrub reversible), K8 (SplitText con máscara de líneas y autoSplit) y K9 (limpieza), y procedimiento de limpieza del entorno. Aviso: el árbol resuelto es un análisis, no una instalación validada.
### 4 · Aprovechamiento por Claude Code
- `web-library-router` 2c: mapa de lectura obligatorio por elemento y registro de la decisión creativa tomada con cada ficha. ART-001: criterios de selección de recursos y **lista contra lo genérico** (2 o más puntos → se rehace el diseño). `web-cinematic-site`: orden A → B → C.
### 5 · Investigación
- Nuevas: **BLEND-001** y **PROD-001**. Ampliadas: CAM-002 (Codrops: trayectoria de cámara de Blender → JSON → CatmullRom + Observer/quickTo; pendiente de Codrops resuelto), DEPTH-001 (*holdout*), SEQ-002 (memoria decodificada).
### Totales
- 143 fichas (+2), 43 TUT, 200 entradas (+5). Cobertura: 689 identificados, 99 estudiados. Vídeos de YouTube estudiados: 0.
### Pendiente (lote 23)
- R1/R1b (Blender y presupuesto de render), D2 (stack), GPU del ordenador del usuario; ejecutar el Hito A y que el usuario lo puntúe con C1/C3.

## Lote 23 (2026-10-27) — v0.23.0
- **Hito A preparado, NO ejecutado:** R1/R1b sin autorizar → **no hay render ni imagen**.
- **Entorno:** el contenedor (2 núcleos, 7 GB, sin GPU) **no cumple los mínimos oficiales** de Blender (4 núcleos y 8 GB). El ordenador del usuario es Windows x64 con la GPU por confirmar (la VM del puente no la ve). Paquete previsto: el .zip portable de 5.2.3 LTS (387 MB).
- **5.2.3 frente a 5.4 alpha** (código de la etiqueta v5.2.3): API del Hito A idéntica; 5.4 solo añade la dispersión de la transmisión y 2 propiedades de eliminación de ruido.
- **Modelo:** el modelado propio por script sustituye a la adaptación de un CC BY (sin descarga, pivote para abrirla, sin luz horneada). Las miniaturas de Sketchfab no son accesibles desde el contenedor.
- **Preparado:** `integration/blender/hitoA_navaja.py` (escena completa, dos estados, GPU/CPU, límites, JSON; sintaxis comprobada), `listar_dispositivos.py` y `composicion_hitoA.html` (titular detrás y objeto delante; probada sin render, en estado "pendiente").
- **B0 corregido:** el Hito A entrega dos estados (cerrada y abierta).
- **Biblioteca:** BLEND-002 nueva; BLEND-001, EVAL-001 (tabla de aceptación del Hito A) y PROD-001 ampliadas; Skills actualizadas.
- **Totales:** 144 fichas, 43 TUT, 203 entradas. Vídeos de YouTube estudiados: 0.
- **Pendiente:** autorización de R1 y R1b, GPU del usuario, ejecución del Hito A y revisión humana del render.

## Lote 24 (2026-11-01) — v0.24.0 · Especialización en movimiento web cinematográfico
> Numeración: la directiva se tituló "LOTE 23", pero la biblioteca ya estaba en v0.23.0 (lote 23 = Hito A preparado). Se registra como **lote 24 / v0.24.0**; no se ha cambiado ninguna versión histórica.
- **Fase 0:** revisadas CASE-003/004, ART-001, EVAL-001, SEQ-001/002, DEPTH-001, CAM-002, PROD-001 y las fichas de GSAP, ScrollTrigger, Flip, SplitText, máscaras y transiciones (FLIP-001/002, ST-001/002, GS-002, TXT-001/002, MASK-001, CLIP-001, GL-002/003, SECT-001, PHYS-001, PX-001). Faltaban: un método para diseñar escenas por estados, criterios de continuidad entre estrategias, una matriz de transformaciones, el vocabulario de cámara 2,5D/3D, la oclusión con legibilidad y el alfa premultiplicado, y recetas completas.
- **Nuevas (7):** MOT-001, CONT-001, TRN-001, CAM-003, REC-001, REC-002, REC-003 (carpeta nueva `recetas/`).
- **Ampliadas:** DEPTH-001 (contextos de apilamiento según MDN, oclusión con dos capas, métrica de solape ≤ 15 %, alfa premultiplicado), TXT-001 (tipografía cinematográfica), ART-001 (color script, continuidad de luz, ritmo, publicidad frente a plantilla), EVAL-001 (catálogo de 11 fallos con su detección), y enlaces en PROD-001, CAM-002, SEQ-001 y CASE-003.
- **Microdemos ejecutadas** (sin dependencias ni instalaciones; motor `escena.js` equivalente a un timeline con scrub): A continuidad, B partículas y C producto fijo, a 1 440 y 375 px. **Reversibilidad 0** en 41 posiciones (bajando y subiendo), 0 errores, reduced motion activo. Coste de script por fotograma: A p95 1,3 ms; C p95 0,4 ms; B p95 6,2 ms con 2 318 partículas y 19,1 ms con 9 278. Comparación del halo de alfa. Vídeos y mosaicos guardados. **Recursos procedurales: sin evaluación C1/C3.**
- **Herramienta:** `integration/tools/medir_escena_scroll.mjs` (reversibilidad, 5 estados, tiempos de fotograma, reduced motion, vídeo).
- **Skills:** elección de técnica por el resultado buscado y regla de especificación obligatoria (estados, capas, movimiento, recursos y validación).
- **Fuentes:** docs de GSAP (Flip.fit, ScrollTrigger, ScrollSmoother), MDN (contextos de apilamiento), realtimerendering.com (premultiplicación), foro de three.js (morph de partículas).
- **No demostrado:** que el código **GSAP** de las recetas funcione (GSAP no instalado); calidad visual con recursos reales; Flip.fit con scrub; partículas en WebGL; cámara 3D; rendimiento en móviles reales; tecnología de Enky (desconocida).
- **Totales:** 151 fichas (+7), 43 TUT, 209 entradas (+6). Cobertura: 689 identificados, 101 estudiados. Vídeos de YouTube estudiados: 0 (Hyperplexed y los directos de akella siguen pendientes).

## Lote 25 (2026-11-01) — v0.25.0 · De mecánicas a resultados cinematográficos
- **Auditoría de las microdemos A/B/C** (AUD-001, nueva herramienta `auditoria_visual_escena.mjs` + `cortes_video.py`): las tres son **reversibles** (P1; visual ≤ 0,21 %) y **continuas**, pero **mediocres** en ritmo y composición: B con partículas casi invisibles (cobertura 1,22–1,42 %) y apagones (luminancia 25 y 29); A sin ninguna línea legible el 50 % del acto; C con ingredientes vectoriales y sin sombra de contacto. 10 hallazgos clasificados y enlazados a fichas; 7 reglas provisionales.
- **Pruebas nuevas:** costuras de máscaras de persianas (14 filas a 1 366 × 768, 12–14 en móvil @3x; 0 con `crispEdges` o solape) → MASK-002; interpolación de secuencias (escalonado, fundido recto que oscurece, fundido premultiplicado con fantasma) → SEQ-003.
- **GSAP real:** NO instalado. Preparados `motor_gsap.js`, 3 páginas `*_gsap.html` y `comparar_nativo_gsap.mjs` (autoprueba nativo frente a nativo: 0 %). Pendiente de autorización (D2) → GS-005 (PROPUESTO).
- **Calidad visual:** COMP-001 (iluminación y composición de producto: Karl Taylor vía Fstoppers, Joe Lenton en PetaPixel) y MOT-002 (movimiento de producto).
- **Recetas:** apartado 7b "DIRECCIÓN ARTÍSTICA APLICADA" en REC-001/002/003 con las correcciones de la auditoría. EVAL-001: apéndice "funciona pero mediocre".
- **Skills:** flujo de 10 pasos para "transformar un producto al hacer scroll" (`web-cinematic-site`), mapa de lectura ampliado (router) y herramientas de auditoría (QA). Manifiesto: títulos a 60 caracteres para alejarlo del límite de 35 KB (mismo nombre y columnas; no hace falta dividirlo).
- **Casos de experto:** H. Watanabe (Codrops, vía resúmenes; original inaccesible), GreenSock (helpers), Karl Taylor / Joe Lenton (iluminación, solo texto). Inaccesibles: Codrops (3 artículos), GitHub de akella, CodePen de Hyperplexed.
- **Totales:** 157 fichas (+6), 43 TUT, 222 entradas (+13). Cobertura: 689 identificados, 105 estudiados (+4 docs GreenSock). Vídeos de YouTube estudiados: 0.
- **Pendiente:** autorización de GSAP (D2), R1/R1b, recursos reales para C1/C3.

## Lote 26 (2026-11-02) — v0.26.0 · Validación real con GSAP
- **GSAP 3.15.0 instalado** con autorización (npm, carpeta temporal aislada, `npm ci`, sin globales). Integridad y sha256 registrados.
- **Las 3 recetas ejecutadas con GSAP real** (nativo, GSAP sticky y GSAP con pin) a 1 440 × 900, 375 × 812 y 375 × 800:
  - 5 estados capturados;
  - comparación de píxeles sin tolerancias ocultas;
  - pin, scrub 0,8 medido en el tiempo, reversibilidad, resize cruzando el punto de corte, reduced motion (al cargar y en caliente) y desmontaje;
  - rendimiento separado en script, render y fluidez;
  - 27 grabaciones, 0 cortes y 0 errores de consola.
- **Puerto corregido:** opción `suavizado` eliminada (opciones unificadas `scrub`/`pin`), pin probado, limpieza del ticker, ciclo de matchMedia comprobado, rutas reales de carga verificadas por red y sha256, y comparador sustituido por `validar_gsap.mjs` + `diferencias.py`. La autoprueba nativo frente a nativo ya no se usa como prueba.
- **8 defectos reales encontrados y corregidos** (GS-005 §3), entre ellos:
  - D1: `tl.set(…, 0)` se revierte;
  - D2: falta de `onUpdate` tras `refresh`;
  - D3: medidas con pin;
  - D5: absorción de la propiedad CSS `translate`;
  - D6: **scrollY = 0 al cruzar un punto de corte de matchMedia** (con código fuente inspeccionado).
- **Correcciones visuales medidas:**
  - A: pasos sin texto legible 11 → 2 de 21; rótulos solapados.
  - B: cobertura 1,2 → 6,5 %; luminancia mínima 25 → 111; cuña y mosaico.
  - C: plato con volumen, sombra de contacto, sombras de ingredientes y oclusión del titular ≤ 4,2 %.
  - Recursos procedurales: no son fotorrealismo.
- **Biblioteca** (sin fichas nuevas):
  - GS-005 → IMPLEMENTADO;
  - REC-001/002/003 §10; SEQ-003, AUD-001, EVAL-001, MOT-002 y COMP-001 §15 (recursos publicitarios necesarios) ampliadas;
  - plantilla `integration/plantillas/escena_gsap/`; herramientas `validar_gsap.mjs`, `diferencias.py` y oclusión en `auditoria_visual_escena.mjs`;
  - Skills con los pasos 6 y 7 basados en la plantilla verificada.
- **Totales:** 157 fichas, 43 TUT, 223 entradas. Cobertura: 689 identificados, 106 estudiados. Vídeos de YouTube estudiados: 0.
- **Pendiente:**
  - recursos reales (C1/C3);
  - WebKit y Firefox;
  - un móvil real con GPU;
  - B en móvil (p95 de 8,5 ms);
  - C a 1 440 px (30 fotogramas > 33 ms por filtros CSS);
  - `blendEases` y la continuidad de velocidad sin medir.

## Lote 27 (2026-11-02) — v0.27.0 · Reconstrucción cinematográfica con recursos generados por IA (preparación)
- **Contrato de recursos REC-003** (`integration/contratos/`):
  - biblia visual común y prompts listos para I1 (héroe tenedor), I2 (plato) e I3 (ingredientes), más los opcionales O1–O4;
  - fondos elegidos por el contraste con el borde (medido), formatos e imprescindibles;
  - `contrato_rec003.json` legible por máquina;
  - tabla de fidelidad de cinco estados frente a R4 (observación, sin atribuir tecnologías).
- **Pipeline** `integration/tools/preparar_recursos.py` (sin instalar nada):
  - inspección: tamaño, alfa, halo, luz, elevación de cámara y color;
  - llave de diferencia y descontaminación del borde: halo −51,8 → −7,7;
  - capa delantera por elipse, sombras horneadas, AVIF/WebP, manifiesto y hoja.
  - Probado con fixtures rotulados.
- **Integración preparada** `integration/plantillas/rec003_recursos/`: manifiesto, `decode()`, héroe que aterriza en el nido del plato con relevo sin valle, y ningún sustituto si faltan recursos.
  - Validada con GSAP 3.15.0 en 1 440, 375 × 812 y 375 × 800: 0 errores; 0 % visible nativo↔GSAP (px enteros); reversible; pin, resize, reduced motion y desmontaje correctos; 0 cortes.
- **Correcciones con evidencia:**
  - **Rendimiento a 1 440 px:** la causa era `mix-blend-mode: multiply`, no los filtros. De 26–38 a 0 fotogramas > 33 ms.
  - **Validador sin ruta fija:** ejecutado desde otra carpeta.
  - **Oclusión en móvil:** 71 % → 2,3 %.
  - **Titular sobre el panel granate:** contraste 1,82:1, solape 6,6 % → 0 %.
  - **Auditoría:** oclusión por alfa real con orden de profundidad.
- **Fuentes:** Xue et al. 2012, Deep Image Matting, Archibald 2024, MDN `decode()`, Midjourney `--sref`, libcom y dos fuentes secundarias.
- **Totales:** 158 fichas (+1, AIIMG-001), 43 TUT, 231 entradas. Vídeos de YouTube estudiados: 0.
- **Pendiente:** imágenes reales del usuario (C1/C3), secuencia O1 para el cambio de forma, botón final, etiquetas de ingredientes.

## Lote 28 (2026-11-03) — v0.28.0 · Investigación de YouTube
- **Acceso real:** reproducción en el navegador del ordenador del usuario (enlazado a la sesión) con el panel de transcripción de YouTube y fotogramas pausados. Sin descargas. Las transcripciones no se copian; se registra su sha256.
- **8 vídeos estudiados**, en 3 grupos:
  - **Transcripción, fotogramas y código:**
    - Codegrid 9Y2bjYQCWvE (banda de disolución);
    - Codegrid DTTNSjyEtes (vídeo por scroll en canvas);
    - Artiukh 3SJIPjlSjtM (vídeo → partículas WebGL).
  - **Transcripción y fotogramas:** Larose 9eHEOAn2FOA (técnicas base).
  - **Transcripción y código:**
    - Hyperplexed z1wZp4jV4cQ (filtro de turbulencia; CodePen);
    - GreenSock YftYHkS5Dao (Flip.fit) y rwdlO3uIlwk (ExpoScale), con el código de los plugins.
  - **Solo transcripción:** Hyperplexed 37wy90RnATM (HTML-in-canvas, experimental).
- **Fase 4, probado con GSAP 3.15.0 y fixtures:**
  - `Flip.fit` fitChild alinea los nidos de REC-003 con un error de 0,96–1,11 px, equivalente al cálculo manual;
  - `expoScale` hace el zoom ~25 veces más fiel a la curva (RMS 0,0009 frente a 0,024), aunque se desajusta tras un resize sin cruzar un punto de corte;
  - filtro SVG de turbulencia con scroll: p95 = 50 ms a pantalla completa, 0 fotogramas > 33 ms del tamaño de un producto;
  - validación completa sin regresiones de la página base y de la variante Flip.
- **Biblioteca** (sin fichas nuevas):
  - ampliadas CONT-001, MOT-002, SEQ-001, TRN-001, REC-002, DEPTH-001 y GS-005;
  - `integration/YOUTUBE_ESTUDIOS.md` (informe por creador);
  - variante `index_flip.html` en la plantilla de REC-003;
  - las 4 Skills actualizadas.
- **Totales:** 158 fichas, 43 TUT, 239 entradas. **Vídeos de YouTube estudiados: 8.**
- **Pendiente:** los vídeos del registro (`pendientes_prioritarios`), three.js para la técnica de Artiukh (requiere autorización) y la reconstrucción del timeline de expoScale tras un resize.

## Lote 29 (2026-11-04) — v0.29.0 · ENKY MOTION EDITING MASTERCLASS (fase 1; directiva truncada)
- **Acceso:** el ordenador del usuario estuvo desconectado → **ningún vídeo visto**. YouTube desde la nube: metadatos de 1 página y límites de peticiones en el resto.
- **Leído de verdad:**
  - guía oficial de Runway *Image to Video Prompting Guide* (Gen-4.5);
  - artículo de Curious Refuge sobre cambios de ángulo con IA.
- **Nueva ficha:** AIVID-001 (PROPUESTO) — producción de clips image-to-video encadenables y su cosido web sin fundido.
- **Receta provisional** "conectar dos escenas sin fundido" en `integration/YOUTUBE_ESTUDIOS.md`. Es de la biblioteca, **no** atribuida a Marriott.
- **Pendiente:** Marriott, Sonduckfilm ×2, directo de Artiukh y Runway Academy, en cuanto vuelva el acceso al navegador.
- **Totales:** 159 fichas, 43 TUT, 247 entradas. **Vídeos de YouTube estudiados: 8** (sin cambios).

## Lote 30 (2026-11-04) — v0.30.0 · Análisis real de vídeos y transiciones Enky
- **Acceso:** el navegador del usuario y YouTube vuelven a funcionar. **9 vídeos estudiados:**
  - Marriott ×5;
  - SonduckFilm ×3;
  - Artiukh ×1 (el directo de Codrops).
  - 8 fotogramas guardados; transcripciones registradas por sha256.
- **Nueva ficha:** EDIT-001 (IMPLEMENTADO): procedimientos de edición de transiciones llevados a la web. Tabla de AE frente a GSAP y de prerenderizado frente a tiempo real. **Hallazgo:** con `scrub`, el relevo a máxima velocidad deja de estar oculto si el usuario desplaza despacio.
- **Fase 4:**
  - receta de producción de ROSSO "aterrizaje en el plato" (`integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE.md`);
  - animática medida con fixtures (vídeo A/B): 11 → 0 fotogramas de doble imagen, relevo en el pico de velocidad, 0,0 px de desajuste, 0 cortes.
- **Ampliadas:** MOT-002, TRN-001, DEPTH-001, AIVID-001, REC-003 §12 y CASE-003. Las 4 Skills, actualizadas.
- **Totales:** 160 fichas, 43 TUT, 253 entradas. **Vídeos de YouTube estudiados: 17.**
- **Pendiente:**
  - recursos reales (C1/C3);
  - disparo en tiempo del aterrizaje dentro de `index_flip.html`, medido con scroll lento;
  - capas con agujero sin three.js;
  - three.js (autorización);
  - Runway Academy.

## Lote 31 (2026-11-04) — v0.31.0 · Cinematic motion engineering (ROSSO)
- **Auditoría del lote 30:**
  - 3 afirmaciones confirmadas;
  - **1 corregida:** el "0,0 px" medía un fotograma invisible; el salto visible era de 53,6 px y 20,7× la mediana de diferencia de píxeles;
  - 9 defectos clasificados.
- **B del lote 31** (mismos fixtures, encuadre, 2,5 s y 1 280 × 720): salto en el relevo de 53,6 → 0,7 px; espaciado máximo de 53,6 → 16,2 px; motion blur con un error de borde 4× menor que sin blur.
- **Scroll real** (A/B/C en 1 280 y 375): **C elegida** (relevo invisible con scroll lento: 0,3 px y Δopacidad ≤ 0,054; 0 parpadeos en el zigzag; reversible). Resize, reduced motion, recursos retrasados y desmontaje correctos; 0 errores.
- **Nueva ficha:** MBLUR-001 (IMPLEMENTADO). EDIT-001 corregida. Receta ROSSO v2 con contrato (I1-nido; I1-smear eliminado).
- **Fuentes:** +3 escritas sobre motion blur.
- **Pendiente:**
  - recursos reales (C1/C3);
  - blur del plato;
  - integración en `index_flip.html`;
  - coste en un móvil real.
- **Totales:** 161 fichas, 43 TUT, 253 entradas.

## Lote 32 (2026-11-04) — v0.32.0 · 10 tutoriales para el nivel Enky
- **10 vídeos estudiados:** 2 con fotogramas; 4 directos de Artiukh con lectura parcial; ninguno repetido.
- **Nueva ficha:** INTEG-001 (IMPLEMENTADO).
- **Ampliadas:** MBLUR-001 (rendimiento: JS p95 de 28,6 → 5,3 ms), EDIT-001, TRN-001 (técnicas WebGL de Artiukh, PROPUESTAS) y AIIMG-001.
- **Microprueba ROSSO/CREMA:** mecánica conservada; sombra coherente; profundidad medida; coste con CPU × 1 ≤ 2 fotogramas > 33 ms. Con CPU × 4 no cabe (degradación pendiente). 3 defectos corregidos.
- **Totales:** 162 fichas, 43 TUT, 263 entradas. **Vídeos de YouTube estudiados: 27.**

## Integración en Kinetic Prompts (2026-11-26) — sin cambio de versión (v0.32.0)
- **Copia:** la biblioteca v0.32.0 se copió desde Google Drive a `kinetic-prompts/knowledge/` con su estructura de carpetas: 686 archivos de texto, tamaño comprobado archivo a archivo. Las 417 imágenes y vídeos de `evidence/` y `_origen/` (59,1 MB) siguen en Drive; lista en `kinetic-prompts/docs/BIBLIOTECA_OMITIDOS.md`. Ninguna ficha modificada.
- **Skills:** el espejo `.claude/skills/` se movió a `_skills_propuestas/` (mismo contenido, idéntico a `skills/`) para que Claude Code no las descubra ni las active solas dentro del proyecto. Las copias canónicas de `skills/` no cambian. Siguen en estado PROPUESTO.
- **Efecto conocido:** `integration/tools/library_check.py` comprueba el espejo en `.claude/skills/` y lo dará por ausente; `INTEGRATION_GUIDE.md`, `MANTENIMIENTO.md` y `MINIMAL_INTEGRATION_TEST.md` siguen citando esa ruta. No se han tocado (biblioteca de solo lectura).
- **Aprovechamiento:** el orden de consulta de `web-library-router` (índice → ARCH-001 → `LIBRARY_MANIFEST.json` → fichas), la cobertura por áreas, el mapa por elemento, las incompatibilidades conocidas y las reglas de licencias se incorporaron a las Skills del proyecto `kp-crear-animacion` y `kp-crear-web` a través de `kinetic-prompts/docs/BIBLIOTECA_CONSULTA.md`.
- **Regla del proyecto:** las demos de `preview/` se implementan desde cero a partir del procedimiento de cada ficha, sin copiar código de las fuentes aunque tengan licencia MIT.
- **Estados:** sin cambios (142 INVESTIGADO, 5 PROPUESTO, 15 IMPLEMENTADO, 0 VALIDADO).

### Kinetic Prompts · validaciones (kp-validar)

| Fecha | Sección | Slug | Ficha de origen | Estado | Vídeo | Póster | Incidencias |
|---|---|---|---|---|---|---|---|
| 2026-11-26 | animaciones | page-transition-blinds | MASK-002 (+ PT-001, A11Y-001, UX-001) | VALIDADO (Chromium) | WebM 336 KB · MP4 251 KB | 18 KB | Safari y Firefox sin probar; adaptación con `transform` en vez de máscara SVG |
| 2026-11-26 | animaciones | page-transition-fade | CSS-002 (+ A11Y-001, UX-001) | VALIDADO (Chromium) | WebM 252 KB · MP4 224 KB | 11 KB | Safari y Firefox sin probar |
| 2026-11-26 | animaciones | page-transition-curtain | MENU-001 (+ PT-001, A11Y-001, UX-001) | VALIDADO (Chromium) | WebM 85 KB · MP4 92 KB | 6 KB | Safari y Firefox sin probar; lóbulo escalado en vez de animar `d` |
| 2026-11-26 | animaciones | page-transition-card-expand | FLIP-001 (+ CSS-002, A11Y-001, UX-001) | VALIDADO (Chromium) | WebM 74 KB · MP4 81 KB | 3 KB | Variantes de Next.js, Astro y GSAP del prompt sin ejecutar; Safari y Firefox sin probar |
| 2026-11-26 | animaciones | page-transition-fade | CSS-002 (revalidación: color del fundido) | VALIDADO (Chromium) | WebM 156 KB · MP4 144 KB | 7 KB | Funde a través de un color (`::view-transition` con fondo) |
| 2026-11-26 | animaciones | page-transition-card-expand | FLIP-001 (revalidación: color del detalle) | VALIDADO (Chromium) | WebM 89 KB · MP4 92 KB | 3 KB | Texto blanco o negro según el contraste |
| 2026-11-26 | animaciones | object-transition-pour | REC-001 (+ CONT-001, A11Y-001) | VALIDADO (Chromium) | WebM 146 KB · MP4 127 KB | 13 KB | Reversibilidad 0,000 %; objetos SVG procedurales (sin C1/C3); Safari y Firefox sin probar |
| 2026-11-28 | animaciones | object-transition-pour | REC-001 + AIIMG-001 (revalidación con imágenes reales de IA) | VALIDADO (Chromium) | WebM 179 KB · MP4 296 KB | 37 KB | Recorte sin halo; C3 humano pendiente; Safari y Firefox sin probar |
| 2026-11-28 | animaciones | background-color-blobs | FONDO-001 (nueva) (+ A11Y-001, UX-001) | VALIDADO (Chromium) | WebM 159 KB · MP4 458 KB | 20 KB | Bucle cerrado al fotograma; contraste en el peor punto sin medir; Safari y Firefox sin probar |

### Fichas nuevas añadidas desde Kinetic Prompts (permiso del usuario, 2026-11-26)

- **2026-11-28 · FONDO-001** (`fondos/`, nueva categoría) — Fondo de manchas de color en movimiento solo con CSS. Fuentes: MDN radial-gradient, MDN prefers-reduced-motion, web.dev «Animations guide» (leídos el 2026-11-28). Estado IMPLEMENTADO por la demo `background-color-blobs`. Índice y manifiesto actualizados (163 fichas; `library_check.py --write-manifest`).
| 2026-11-28 | animaciones | background-particles-constellation | FONDO-002 (nueva) (+ FONDO-001, A11Y-001) | VALIDADO (Chromium) | WebM 377 KB · MP4 367 KB | 23 KB | Bucle cerrado; nítido a DPR 2; rendimiento en móvil real sin medir |
- **2026-11-28 · FONDO-002** (`fondos/`) — Constelación de partículas en canvas 2D. Fuentes: MDN «Basic animations», «Optimizing canvas», «Window: devicePixelRatio» (leídos el 2026-11-28). IMPLEMENTADO por la demo `background-particles-constellation`. Índice y manifiesto: 164 fichas.
