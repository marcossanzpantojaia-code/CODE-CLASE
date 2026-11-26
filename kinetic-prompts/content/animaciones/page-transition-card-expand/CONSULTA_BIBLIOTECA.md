# CONSULTA_BIBLIOTECA — Tarjeta que se convierte en página (`page-transition-card-expand`)

## 1. Encargo

- Descripción breve: transición de nivel avanzado. La imagen de una tarjeta viaja y crece hasta ser la portada de su página; el texto entra después; al volver, se encoge hasta su tarjeta.
- Perfil (A/B) y motivo: ambos. Portfolios, catálogos y blogs: listado → detalle.
- Versión de la biblioteca: 0.32.0 · Lotes 0–32 · 2026-11-04.
- Stack y versiones: técnica FLIP con Web Animations API en la demo. En el prompt: `<ViewTransition>` (Next.js 16.4 / React 19.3), `view-transition-name` (Astro y HTML), GSAP Flip 3.15 si el proyecto ya usa GSAP. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Viaje de un elemento entre dos posiciones (FLIP) | FLIP-001 | knowledge/transitions/FLIP-001-flip-transiciones-layout.md | INVESTIGADO | GSAP 3.15 en la ficha; la demo implementa FLIP sin GSAP |
| Elemento compartido entre páginas | CSS-002 | knowledge/css/CSS-002-view-transitions.md | INVESTIGADO | Next 16.4: `<ViewTransition share="morph">` (ver §5) |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |
| Duración y easing | UX-001 | knowledge/ux/UX-001-duracion-y-easing.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| FLIP-001 §5 y §7 | First → cambio de DOM → Last → Invert → Play, con `getBoundingClientRect` y `element.animate`; `transform-origin: 0 0` | preview/index.html (`invert`, `expand`, `collapse`) | No | Sí: sin GSAP |
| FLIP-001 §10 | Viaja un bloque sin texto (la escala distinta en X e Y deformaría el texto); el texto entra aparte | preview/index.html, prompt.md §6 | No | No |
| FLIP-001 §14 | Clics rápidos ignorados mientras dura el viaje | preview/index.html (`running`) | No | No |
| FLIP-001 §11 | Orden del DOM = orden visual; con movimiento reducido, fundido | prompt.md §7 | No | No |
| CSS-002 §3 y §10 | Entre páginas: `view-transition-name` único por pareja; nombres repetidos cancelan la transición | prompt.md §3 | No | No |
| UX-001 §3 | 0,7 s para un viaje largo en pantalla grande (expresivo) | item.json | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| FLIP-002 (no leída) | Galería bento con scroll: es un efecto de scroll, no de navegación |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente consultada | Resultado |
|---|---|---|
| En Next.js, miniatura y portada se emparejan con `<ViewTransition name share="morph" default="none">` | `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (Next 16.4.6), paso 1 | Confirmado; sin `share` y con `default="none"`, la pareja deja de transformarse |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| La imagen empieza exactamente en la tarjeta (±2 px) y acaba como portada | Playwright | ✓ | VALIDACION.md |
| Foco al título al abrir y al volver; clics rápidos | Playwright | ✓ | VALIDACION.md |
| Consola, anchos, parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 21/21 | VALIDACION.md |
| Variantes de Next.js, Astro y GSAP Flip del prompt | — | No ejecutadas (descritas desde la documentación) | — |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca (no aplicar desde el proyecto)

- Correcciones de fichas: FLIP-001 puede enlazar con CSS-002 para el caso entre páginas (`share="morph"` en Next 16).
- Fichas que podrían pasar a IMPLEMENTADO/VALIDADO: FLIP-001 → IMPLEMENTADO (técnica FLIP ejecutada sin GSAP; Flip de GSAP sin ejecutar).
