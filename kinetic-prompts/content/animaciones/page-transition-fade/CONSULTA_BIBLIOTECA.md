# CONSULTA_BIBLIOTECA — Fundido nativo entre páginas (`page-transition-fade`)

## 1. Encargo

- Descripción breve: transición de página de nivel básico. La vieja se funde, la nueva aparece subiendo un poco; la hace el navegador (View Transitions API).
- Perfil (A/B) y motivo: ambos, preferente en comercial: mínimo código y mejora progresiva.
- Versión de la biblioteca: 0.32.0 · Lotes 0–32 · 2026-11-04.
- Stack y versiones: CSS + View Transitions API; en Next.js 16.4 / React 19.3, `<ViewTransition>`. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Transición de página nativa | CSS-002 | knowledge/css/CSS-002-view-transitions.md | INVESTIGADO | Docs de oct-2025; Next 16.4 añade `<ViewTransition>` de React 19.3 (ver §5) |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |
| Duración y easing | UX-001 | knowledge/ux/UX-001-duracion-y-easing.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| CSS-002 §3 y §7 | `document.startViewTransition` en la demo; `@view-transition` para varias páginas en el prompt; comprobación de soporte con caída al cambio directo | preview/index.html (`go`), prompt.md §3 | No | No |
| CSS-002 §10 | Aviso en el prompt: nombres `view-transition-name` repetidos cancelan la transición | prompt.md §4.5 | No | No |
| CSS-002 §7.5 y A11Y-001 | Con movimiento reducido, solo opacidad 150 ms (no se quita del todo: el fundido no es desencadenante) | preview/index.html (CSS), prompt.md §7 | No | Sí |
| UX-001 §3 | 0,35 s con `ease-out` por defecto (cambio grande, 200–400 ms) | item.json | No | No |
| — | `::view-transition-group(root)` sin animación: la raíz no cambia de tamaño y así solo se animan `opacity` y `transform` | preview/index.html | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| PT-001 | Transición paralela con timeline; demasiado para el nivel básico (queda para una avanzada) |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente consultada | Resultado |
|---|---|---|
| Next.js integra View Transitions en el App Router | `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (Next 16.4.6) | Confirmado: `<ViewTransition>` de React 19.3 sin configuración; envolver cada `page.tsx`, no el layout; `Link` admite `transitionTypes` |
| Soporte de navegadores (CSS-002 §4) | Misma guía | Chromium 125+ y Safari y Firefox recientes para tipos y `view-transition-class`; sin soporte, la app funciona sin animar |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Consola, anchos, parámetros, repetición, movimiento reducido, propiedades | scripts/validar-animacion.mjs | 20/20 | VALIDACION.md |
| Navegador sin View Transitions (API eliminada antes de cargar) | Playwright | Cambia de página y el foco va al título | VALIDACION.md |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca (no aplicar desde el proyecto)

- Correcciones de fichas: CSS-002 puede añadir la integración de Next 16 (`<ViewTransition>` de React 19.3, por página y no en el layout) y quitar la nota de «React en canary».
- Fichas que podrían pasar a IMPLEMENTADO/VALIDADO: CSS-002 → IMPLEMENTADO (demo propia ejecutada en Chromium).
