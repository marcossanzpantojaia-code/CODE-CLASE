## 1. Skill cargada

`web-library-router` se cargó correctamente. La carpeta real, resuelta como `CLAUDE_SKILL_DIR`, es:
`/tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest2/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/.claude/skills/web-library-router`

La Skill se cargó desde dentro de la biblioteca, así que **LIB** son tres niveles por encima:
`/tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest2/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY`

La comprobación obligatoria se cumple, porque `LIB/KNOWLEDGE_INDEX.md` existe.

## 2. Línea de versión (literal)

> Versión 0.14.0 · Lotes 0–13 · 2026-10-27 · **Presupuesto 0 €**: solo recursos gratuitos

El texto de la Skill dice "Revisada en el lote 12 (v0.13.0)", pero el índice está en 0.14.0. La Skill va un lote por detrás del índice.

## 3. Manifiesto

Leí `LIB/integration/LIBRARY_MANIFEST.json` completo y no se truncó. Declara `total_fichas: 125` y conté 125 entradas, además de la lista de 42 tutoriales.

Elegí estas 5 fichas:

- **Parte comercial:** LEGAL-001, SEO-002.
- **Parte cinematográfica:** GL-006, TJ-001.
- **Transversal obligatoria en ambos perfiles:** A11Y-001.

## 4. Fichas leídas con Read

Todas las rutas empiezan por `/tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest2/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/`, que abrevio como `LIB/`.

| ID | Ruta absoluta | Estado | ultima_revision |
|---|---|---|---|
| LEGAL-001 | `LIB/security/LEGAL-001-cookies-consentimiento-espana-ue.md` | INVESTIGADO | `ultima_revision: 2026-10-27` |
| SEO-002 | `LIB/seo/SEO-002-metadata-nextjs-y-datos-estructurados.md` | INVESTIGADO | `ultima_revision: 2026-10-26` |
| GL-006 | `LIB/threejs/GL-006-webgl-gsap-scroll-una-sola-timeline.md` | INVESTIGADO | `ultima_revision: 2026-10-27` |
| TJ-001 | `LIB/threejs/TJ-001-dispose-recursos-gpu.md` | INVESTIGADO | `ultima_revision: 2026-10-26` |
| A11Y-001 | `LIB/accessibility/A11Y-001-reduced-motion.md` | INVESTIGADO | `ultima_revision: 2026-10-27` |

Ninguna ficha es IMPLEMENTADO ni VALIDADO. Todas arrastran las pruebas de su campo 14 al plan.

## 5. Decisiones técnicas por ficha

**LEGAL-001** (comercial)
- **Banner con "Aceptar", "Rechazar" y "Configurar" al mismo nivel y con el mismo peso visual** (campos 6 y 12.2). Sin CTA dominante, y el consentimiento solo cuenta con acción afirmativa (campo 7).
  - *Documentado:* los requisitos de la guía de la AEPD de 2024, en los campos 5 a 8.
  - *No probado:* la ficha marca el campo 12 como "traducción propia, no probada".
- **Bloqueo previo de scripts no exentos** (campo 12.1), con elección guardada con fecha y versión y caducidad de 24 meses (campos 9 y 12.3). También un enlace permanente "Configurar cookies" en el pie (campos 8 y 12.4). El mapa iría como imagen más enlace "Cómo llegar" (campo 12.5).
  - *Documentado:* los 24 meses son "buena práctica" de la guía.
  - *No probado:* la implementación. La ficha avisa de que el texto de la guía se cortó al final del apartado 4.2 (campo 15) y de que no es asesoramiento jurídico, así que habría que revisarlo con el cliente.
  - *Prueba prevista:* Playwright con `page.on('request')` (campo 12.6).

**SEO-002** (comercial)
- **`metadata` y `title.template` en `app/layout.tsx`, `generateMetadata` por página, y `sitemap.ts` y `robots.ts`** (campos 3 y 5).
  - *Documentado:* la API de metadatos de Next.js, solo en Server Components (campo 3).
  - *No probado:* el procedimiento es una "propuesta" (campo 5). `title.template` se cita como práctica, no leído en detalle (campo 15).
- **JSON-LD LocalBusiness desde un componente servidor, con datos reales y coherentes con Google Business Profile** (campos 4, 5 y 10). Llevaría `name`, `address`, `telephone` con prefijo, `geo` con al menos 5 decimales y `openingHoursSpecification`. No pondría `aggregateRating` propio (campo 4).
  - *Documentado:* los campos obligatorios y recomendados de Google.
  - *No verificado:* el subtipo schema.org para barbería. La ficha lo dice expresamente en el campo 4 y lo repite en el 15, así que tendré que comprobarlo en schema.org antes de usarlo.

**GL-006** (cinematográfico)
- **Una sola timeline maestra como "cabezal"** (campo 3): ScrollTrigger con `scrub` sobre ella y los capítulos como etiquetas (campo 6.2). Los uniforms del héroe Three.js se animan con GSAP (campo 3). Habría un único bucle, con el ticker de GSAP llamando al render y sin segundo rAF (campo 3). El suavizado iría en un solo sitio, con `scrub` numérico o `damping`, no ambos.
  - *Documentado:* es una síntesis de fichas hermanas (R3F-001, LN-001) y un artículo del caso Immersive Garden.
  - *No probado:* "nada implementado" (campo 15). La prueba prevista es scroll rápido adelante y atrás, y 60 fps en móvil (campo 14).
- **Degradación y reduced motion** (campo 5): contenido narrativo en HTML, y con reduced motion se salta al estado final de cada capítulo. Desde el primer día probaría en el móvil objetivo (campo 6.4).
  - *Aviso:* Theatre.js (campo 4) lo descartaría. El editor es AGPL-3.0 y el repositorio público no cambia desde 2024-04-11, así que no lo necesito para un héroe de una barbería.

**TJ-001** (cinematográfico)
- **`dispose()` al desmontar el héroe** (campos 5, 7 y 9): geometrías, materiales, texturas (el material no libera las suyas), controles, composer y renderer, con `traverse` sobre la escena.
  - *Documentado:* el manual oficial de three.js.
  - *No probado:* el pseudocódigo es "adaptación propia, no ejecutada" (campo 9). La gestión automática en R3F está "pendiente de verificar" (campo 15).
- **Auditar con `renderer.info.memory`**, navegando 20 veces entre rutas (campos 5 y 14). No tomo como fuga lo que muestre el entorno o el fondo (campo 10).
  - *No probado:* la prueba de los 20 ciclos.

**A11Y-001** (ambos perfiles)
- **`gsap.matchMedia()` con dos ramas, `no-preference` y `reduce`** (campos 5, 7 y 9). En la rama reducida, parallax, pins y escena guiada por scroll pasan a estados finales o fundidos. Tampoco habría rotación automática de cámara en Three.js (campo 7).
  - *Documentado:* `matchMedia` y la guía oficial de GSAP. Lenis respeta la preferencia por defecto (campo 5).
  - *No probado:* el código es una "adaptación propuesta, no ejecutada" (campo 9). El criterio WCAG exacto quedó pendiente en esta ficha y se resolvió en A11Y-002 y A11Y-006, que no he leído.
- **El contenido no se oculta con `opacity: 0` en CSS** si depende de JS (campo 10), usando `autoAlpha` desde JS. La ficha recomienda además un interruptor de animaciones en la propia página.
  - *No inspeccionado:* la demo de ese interruptor.
  - *Prueba prevista:* emular la preferencia en DevTools (campo 14).

## 6. Registro (formato de `CONSULTA_BIBLIOTECA_TEMPLATE.md`)

No he escrito ningún archivo, como pediste, así que el registro va aquí.

### 1. Encargo
- **Descripción breve:** web profesional para una barbería de Madrid, con reservas, SEO local, cookies conformes en España y animaciones cinematográficas (GSAP, ScrollTrigger y una escena Three.js en el héroe). Solo se prepara el conocimiento, sin construir nada.
- **Perfil (A/B) y motivo:** A (comercial) como base, porque el negocio necesita conversión, SEO local y cumplimiento legal. B (cinematográfico) acotado al héroe y a las secciones con animación. Es un perfil mixto, con la espectacularidad al servicio del negocio.
- **Versión de la biblioteca:** Versión 0.14.0 · Lotes 0–13 · 2026-10-27 · **Presupuesto 0 €**: solo recursos gratuitos
- **Stack y versiones instaladas:** ninguno instalado. Las fichas citan Next.js App Router (oct-2026), GSAP 3.15, three.js r186 y lenis 1.3.27. Esos números hay que contrastarlos con el proyecto real.

### 2. Necesidades → fichas
| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Cookies conformes en España | LEGAL-001 | `LIB/security/LEGAL-001-cookies-consentimiento-espana-ue.md` | INVESTIGADO | Guía AEPD de mayo de 2024. Proyecto sin definir. |
| SEO local y metadatos | SEO-002 | `LIB/seo/SEO-002-metadata-nextjs-y-datos-estructurados.md` | INVESTIGADO | Next.js App Router. Proyecto sin definir. |
| Escena Three.js del héroe ligada al scroll | GL-006 | `LIB/threejs/GL-006-webgl-gsap-scroll-una-sola-timeline.md` | INVESTIGADO | GSAP 3.15 y three.js r186. Proyecto sin definir. |
| Memoria GPU del héroe | TJ-001 | `LIB/threejs/TJ-001-dispose-recursos-gpu.md` | INVESTIGADO | Manual vigente, sin revisión indicada. Proyecto sin definir. |
| Reduced motion | A11Y-001 | `LIB/accessibility/A11Y-001-reduced-motion.md` | INVESTIGADO | lenis 1.3.27 y GSAP 3.15. Proyecto sin definir. |

### 3. Aplicación
| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| LEGAL-001 | Banner con tres botones iguales y bloqueo previo de scripts | pendiente, no se ha construido nada | No | Sí |
| SEO-002 | `metadata`, `sitemap.ts`, `robots.ts` y JSON-LD LocalBusiness | pendiente | No | Sí |
| GL-006 | Timeline maestra, ScrollTrigger con `scrub` y uniforms animados con GSAP | pendiente | No | Sí |
| TJ-001 | `dispose()` al desmontar el héroe | pendiente | No | Sí |
| A11Y-001 | `gsap.matchMedia()` con rama reducida | pendiente | No | Sí |

### 4. Fichas consultadas y descartadas
| Ficha | Motivo |
|---|---|
| Theatre.js (sección de GL-006) | Licencia AGPL del editor y riesgo de mantenimiento. No hace falta para este héroe. |
| Las otras 120 fichas del manifiesto | No se leyeron en esta prueba. Quedan pendientes SEO-003, FORM-001, ANALYTICS-001, A11Y-002, ST-001, LN-001, WGPU-001 y PERF-001. |

Como el Read se hizo en modo de solo lectura, las secciones 5 a 7 de la plantilla quedan sin rellenar. Sí quedan anotadas las verificaciones pendientes:
- el subtipo schema.org para barbería (SEO-002);
- la gestión automática de dispose en R3F (TJ-001);
- el criterio WCAG exacto de reduced motion (A11Y-002 y A11Y-006).