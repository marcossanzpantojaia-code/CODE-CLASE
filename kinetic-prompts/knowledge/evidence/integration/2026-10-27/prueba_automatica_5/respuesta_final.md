# Enfoque técnico: web premium para una barbería

Es un diseño, no hay código ni archivos creados. Lo baso en la biblioteca de conocimiento (v0.16.0). Todas las fichas que cito están en estado INVESTIGADO, ninguna está IMPLEMENTADA ni VALIDADA, y su código no se ha ejecutado. Por eso las pruebas de cada fase son parte del plan.

## 1. Decisión de fondo: perfil comercial con capa cinematográfica en 2D

La web existe para que alguien **reserve** y para que **te encuentre** en Google Maps. La espectacularidad solo sirve si no estorba a eso.

- **Perfil A (comercial) como base.** UX-002 pide que el lema, la ciudad y el CTA "Reservar" estén visibles en el primer pintado, sin esperar a animaciones. PERF-001 avisa de que los precargadores con temporizador y los heros que empiezan con opacidad 0 retrasan o anulan el LCP.
- **Cinematográfico en 2D, sin 3D/WebGL.** Lo descarto tras leer WGPU-001 y PERF-001. Un canvas 3D exige una escalera de degradación (sin JS, sin WebGL, WebGL 2, WebGPU), añade MB que compiten con el LCP y no aporta a la reserva ni al SEO local. El efecto "película" se consigue con fotografía y vídeo reales, `clip-path`, `transform`, capas, tipografía grande y un par de secciones con scroll narrativo.

## 2. Arquitectura y stack

- **Recomiendo Next.js (App Router).** Hay reservas con validación en servidor, y SEO-002 y NEXT-002 cubren justo ese caso. Los componentes de servidor generan el HTML y el JSON-LD, y la animación vive en componentes cliente pequeños.
- **Alternativa más ligera.** Si la barbería ya usa un SaaS de citas, bastaría un sitio de contenido (Astro) con enlace o embed a ese servicio. Esa decisión es la más importante y la planteo en las preguntas finales.
- **Contenido siempre en el HTML.** Ningún texto, precio ni dirección dentro de un canvas, imagen o contenido que solo JS hace visible.

## 3. Animación cinematográfica: capas con degradación

| Capa | Técnica | Por qué |
|---|---|---|
| 0 | HTML y CSS completos, legibles sin JS y con reduced motion | A11Y-001 advierte: si ocultas con `opacity:0` en CSS y dependes de JS, el contenido queda invisible cuando JS falla |
| 1 | Animaciones CSS ligadas al scroll (`animation-timeline: view()`, `animation-range`) para revelados y parallax sutil, dentro de `@supports` y `prefers-reduced-motion: no-preference` | CSS-001: sin JS, sin peso, robusto. Soporte ≈ 88 %, así que el estado final es la base y la animación solo mejora |
| 2 | GSAP + ScrollTrigger solo donde CSS no llega: 1–2 secciones fijadas (pin) con `scrub` (p. ej. hero → servicios), texto por líneas/palabras | ST-001: una timeline por sección, solo `transform` y `autoAlpha`, `ScrollTrigger.refresh()` tras cargar fuentes e imágenes, `markers` fuera en producción |
| 3 | Microinteracciones en CTA y tarjetas, solo con puntero fino y con alternativa de teclado | Criterio de ARCH-001 para este tipo de efectos |

Decisiones concretas:

- **Sin scroll suave (Lenis) en la v1.** LN-001 dice que en webs de negocio suele ser prescindible y hay que justificarlo. Añade riesgo con anclas, `scroll-snap` y Safari. Si en el prototipo el cliente lo echa en falta, se añade con `respectReducedMotion` activo y sincronizado con el ticker de GSAP.
- **Sin scroll horizontal ni vídeo scrub** en la v1. Son los efectos más caros en móvil y menos accesibles.
- **Hero.**
  - Foto o vídeo real del local (UX-002: nada de stock).
  - Si hay vídeo, silenciado, con póster y pausa disponible.
  - El póster o la foto es el candidato a LCP: `fetchpriority="high"`, nunca `loading="lazy"`.
  - La animación va por encima (`clip-path`/`transform`), no en lugar del contenido.
- **Peso del DOM.** SplitText multiplica nodos: solo en 2–3 titulares, no en párrafos.

## 4. Reservas

**Flujo de interfaz.**
1. CTA "Reservar" persistente, fijo en móvil.
2. Formulario corto: servicio, barbero, fecha/hora, nombre, teléfono, email.
3. Confirmación clara.

**Formulario (FORM-001).**
- Etiqueta visible encima del campo, una columna y `autocomplete`.
- Validación nativa más `:user-invalid`, con texto además del color.
- Ayuda enlazada con `aria-describedby`.
- Resumen de errores enfocable al enviar y conservación de lo escrito.
- Estado "Enviando…" y mensaje en `role="status"`.
- Sin animaciones en los errores.

**Servidor (SEC-002, NEXT-002).**
- Server Action que valida contra un esquema con lista de permitidos.
- Límites de longitud y validación semántica: fecha futura, dentro de horario, hueco libre.
- Se construye el objeto campo a campo, nunca con `Object.fromEntries(formData)` (asignación masiva).
- Orden: validar → autenticar/autorizar → escribir → `revalidatePath`.
- Errores genéricos y logs sin datos personales.
- Antispam: SEC-002 lo deja pendiente de fuente oficial. Propongo campo trampa más límite de frecuencia, como adaptación mía.

**Adaptaciones propias, no salen de una ficha.**
- Evitar la doble reserva con una restricción única `(barbero, franja)` en base de datos, no solo con comprobación en código.
- Confirmación por email o WhatsApp.

## 5. SEO local

Según SEO-003, Google puntúa **relevancia, distancia y prominencia**, y la web apoya cada una:

- **Relevancia.**
  - Una página por servicio principal (corte, barba, afeitado clásico…) con texto propio.
  - `h1` y `title` con servicio + ciudad, sin relleno de palabras clave.
  - NAP (nombre, dirección, teléfono) idéntico al del Perfil de Empresa, en texto real y en el JSON-LD.
- **Distancia.** Dirección real, enlace "Cómo llegar" o mapa, y una página por sede si hay varias.
- **Prominencia.** Enlace para dejar reseñas y reseñas reales con su fuente. **Sin `aggregateRating` propio**: Google lo prohíbe para autovaloración (SEO-002).
- **Técnico (SEO-002).**
  - Metadata API en componentes de servidor, con `title.template` y `generateMetadata` por página.
  - `sitemap.ts` y `robots.ts`, e imagen Open Graph.
  - JSON-LD `LocalBusiness` con `geo`, `openingHoursSpecification` y `telephone` con prefijo.
  - El horario del JSON-LD debe coincidir con el real y con el del perfil.
  - El subtipo de schema.org más específico (¿`HairSalon`?) **no está verificado**: se comprueba en schema.org antes de usarlo.
- **Móvil.** `tel:` y botón de reserva siempre visibles.
- **Validación.** Rich Results Test y comparación del NAP entre web, perfil y directorios.

## 6. Accesibilidad

- **Reduced motion (obligatorio, A11Y-001).**
  - `gsap.matchMedia()` con rama completa y rama reducida: sin parallax ni pins largos, con fundidos o estado final.
  - Interruptor de animaciones en la propia página (GSAP lo recomienda, porque los ajustes del sistema no bastan).
  - Barridos grandes cambiados por fundidos.
- **Resto de criterios.**
  - Teclado completo, foco visible, enlace de salto y contraste AA.
  - Objetivos táctiles ≥ 24 px.
  - Vídeo o carrusel automático con pausa.
  - Texto dividido con `aria-label` en el padre.
  - Pins que no atrapen el foco ni oculten el campo enfocado.
- **Verificación.** Emular reduced motion en DevTools y recorrer toda la página.

## 7. Rendimiento

- **Umbrales oficiales (PERF-001), p75 móvil:** LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.
- **Presupuesto propuesto más estricto, a validar en el proyecto:** LCP ≤ 2,0 s en 4G simulado, CLS ≤ 0,05, JS de animación ≤ 60 KB gzip.
- **Imágenes y fuentes.** AVIF/WebP con tamaños correctos y `width/height`, `font-display` sin `block` y CSS crítico pequeño.
- **Hilo principal.** Sin `setState` ni trabajo pesado en `pointermove`.
- **Carga diferida.** Vídeo y GSAP se cargan tras el primer pintado.
- **Medición.** Lighthouse móvil, DevTools y `web-vitals` en producción.

## 8. Fases

1. **Brief y contenido:** objetivos medibles, servicios, precios, fotografía real y NAP canónico.
2. **Base:** stack, tokens de diseño, tipografía fluida y hero estático (capa 0) con CTA.
3. **Reservas:** formulario, Server Action, modelo de datos y confirmaciones.
4. **SEO local:** páginas de servicio, JSON-LD y metadatos.
5. **Movimiento:** capas 1 → 2 → 3, comprobando el presupuesto tras cada una.
6. **QA con la skill `web-qa-validation`:**
   - Anchos de 375, 768 y 1440 px, Chromium y WebKit, sin JS y con reduced motion.
   - Llamada a la acción sin sesión y envío de campos extra.
   - Lighthouse y Playwright.
   - Tabla de errores de ScrollTrigger si algo falla.

## Preguntas que condicionan la construcción

1. ¿Sistema de reservas propio o un SaaS ya existente? Esta decisión cambia el stack.
2. ¿Una o varias sedes, y qué idiomas?
3. ¿Hay fotografía y vídeo reales del local, y un Perfil de Empresa de Google verificado?
4. ¿Hay dirección de marca (paleta, tono) y dominio y hosting definidos?

## Fichas que leería al construir

Las cito solo por título del índice, no las he leído. Cada línea lleva su marca:

- A11Y-003 (no leída) · A11Y-005 (no leída) · A11Y-007 (no leída)
- GS-001 (no leída) · ST-004 (no leída) · ST-006 (no leída)
- SEC-001 (no leída) · SEC-003 (no leída) · LEGAL-001 (no leída)
- IMG-001 (no leída) · TYPE-001 (no leída) · DS-001 (no leída)
- TEST-001 (no leída) · CI-002 (no leída) · CLIENT-001 (no leída)

---

## Registro de consulta de la biblioteca

## 1. Encargo
- **Descripción breve:** diseñar el enfoque técnico de una web premium de barbería, con animaciones cinematográficas, scroll interactivo, reservas, SEO local y accesibilidad. Sin código.
- **Perfil:** A (comercial) con capa cinematográfica 2D acotada. Motivo: el objetivo es reservar y aparecer en búsquedas locales.
- **Versión de la biblioteca:** 0.16.0 (`KNOWLEDGE_INDEX.md`).
- **Stack y versiones instaladas:** proyecto nuevo asumido. No he inspeccionado el directorio de trabajo ni hay `package.json` consultado.

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Orden de decisiones | ARCH-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/architecture/ARCH-001-receta-pagina-completa.md | PROPUESTO | n/a |
| Home de negocio | UX-002 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/ux/UX-002-pagina-de-inicio-de-negocio.md | INVESTIGADO | n/a |
| Metadatos y LocalBusiness | SEO-002 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/seo/SEO-002-metadata-nextjs-y-datos-estructurados.md | INVESTIGADO | Next.js oct-2026; proyecto sin definir |
| SEO local | SEO-003 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/seo/SEO-003-seo-local-perfil-de-empresa.md | INVESTIGADO | n/a |
| Reduced motion | A11Y-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | lenis 1.3.27, GSAP 3.15; proyecto sin definir |
| Scroll con GSAP | ST-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/scrolltrigger/ST-001-fundamentos-scrolltrigger.md | INVESTIGADO | GSAP 3.15; proyecto sin definir |
| Scroll suave (decisión) | LN-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/lenis/LN-001-lenis-scrolltrigger.md | INVESTIGADO | lenis 1.3.27; proyecto sin definir |
| Revelados sin JS | CSS-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/css/CSS-001-scroll-driven-animations.md | INVESTIGADO | n/a |
| Formulario de reserva | FORM-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/frontend/FORM-001-formularios-validacion.md | INVESTIGADO | n/a |
| Validación en servidor | SEC-002 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/security/SEC-002-validacion-entradas-servidor.md | INVESTIGADO | n/a |
| Reservas en Next.js | NEXT-002 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/architecture/NEXT-002-app-router-proyecto-completo-y-errores.md | INVESTIGADO | fuente en Next 13.4; la doc oficial manda en Next 16 |
| Rendimiento | PERF-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/performance/PERF-001-core-web-vitals-y-animacion.md | INVESTIGADO | n/a |
| 3D (descarte) | WGPU-001 | /tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest5/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/threejs/WGPU-001-webgpu-vs-webgl-y-degradacion.md | INVESTIGADO | three.js r186; datos a 2026-10-27 |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? | Adaptación propia |
|---|---|---|---|---|
| UX-002, PERF-001 | Hero con contenido real en el HTML y animación encima | — (aún sin código) | No | No |
| CSS-001, ST-001 | Capas: CSS primero, GSAP solo para pins y scrub | — | No | No |
| A11Y-001 | Dos ramas con `matchMedia` e interruptor en la página | — | No | No |
| FORM-001, SEC-002, NEXT-002 | Formulario nativo más Server Action con esquema | — | No | Sí: restricción única en BD, antispam, confirmaciones |
| SEO-002, SEO-003 | Páginas por servicio, NAP único y JSON-LD | — | No | Sí: subtipo de schema.org por verificar |
| LN-001 | Lenis fuera de la v1 | — | No | Sí (criterio de producto) |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| WGPU-001 | Descarte del 3D/WebGL: coste en LCP, necesidad de escalera de degradación y ninguna aportación a reserva ni SEO |
| LN-001 | Scroll suave diferido: prescindible en perfil A y con riesgos de compatibilidad |

Para el descarte del 3D leí WGPU-001 (carpeta `threejs/`) y PERF-001. Además de las 13 fichas de la tabla de la sección 2, leí `KNOWLEDGE_INDEX.md`, `RETRIEVAL_PROCEDURE.md`, `LIBRARY_MANIFEST.json` y la plantilla de consulta.

No he escrito `CONSULTA_BIBLIOTECA.md` ni ningún otro archivo: en este modo solo puedo leer. Tampoco he podido crear el archivo de plan que indicaba el entorno, así que el plan está en esta respuesta.