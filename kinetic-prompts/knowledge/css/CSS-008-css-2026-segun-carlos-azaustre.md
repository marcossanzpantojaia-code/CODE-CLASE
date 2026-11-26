---
id: CSS-008
titulo: CSS de 2026 que sustituye JavaScript — animaciones disparadas por scroll, View Transitions por elemento y corner-shape (según Carlos Azaustre)
categoria: css
estado: INVESTIGADO (contrastado con MDN y Chrome for Developers el 2026-10-27; sin probar en navegador)
evidencia: ARTICULO_AUTOR_ANALIZADO (carlosazaustre.es, 27-02-2026) + DOCUMENTACION_OFICIAL_ANALIZADA (MDN, Chrome for Developers — lote 11)
versiones: según el artículo — Chrome 146 (scroll-triggered), Chrome 147 (element-scoped view transitions), corner-shape/border-shape en *feature preview*
perfil: ambos
ultima_revision: 2026-10-27
---

# CSS-008 · CSS 2026

1. **Finalidad.** Estar al día de tres capacidades nuevas que reducen JS en revelados y transiciones; saber cuáles usar ya (con mejora progresiva) y cuáles no.
2. **Fuente.** Carlos Azaustre, "CSS en 2026: las tres features de Chrome que eliminan JavaScript que llevas años escribiendo": https://carlosazaustre.es/blog/css-2026-elimina-javascript-chrome-146-147 . **Mi conocimiento llega a junio de 2026 y no he contrastado estas propiedades con MDN/caniuse en este lote → tratarlas como pendientes de verificación.**
3. **Animaciones disparadas por scroll ("scroll-triggered") [artículo].**
   - Sustituyen al patrón `IntersectionObserver` + clase. Distintas de las *scroll-driven* (CSS-001, Chrome 115): no avanzan con el scroll, se **disparan** al cruzar un punto.
   - Propiedades citadas: `timeline-trigger` (cuándo: p. ej. `view()` con `entry 100%` / `exit 0%`), `animation-trigger` (qué hace: `play-forwards` al entrar, `play-backwards` al salir) y `trigger-scope` (aísla el nombre del disparador por componente).
   - Soporte según el autor: Chrome/Edge 146+, Firefox tras bandera, Safari "en desarrollo".
4. **View Transitions por elemento [artículo].** En vez de `document.startViewTransition()`, se invoca sobre un elemento que pasa a ser la raíz de su transición; varias pueden ejecutarse a la vez (listas, paneles). Sigue necesitando JS; pseudo-elementos `::view-transition-old/new(nombre)` aplicados a ese elemento. Chrome/Edge 147+.
5. **corner-shape / border-shape [artículo].** Formas de esquina (`squircle`, `notch`, `bevel`…) y bordes con punta (flecha de tooltip) sin `::after` ni `clip-path`. Solo en vista previa experimental: **no usar en producción**. (Web Dev Simplified también tiene un artículo sobre `corner-shape`, mayo 2026, no leído.)
6. **Procedimiento.**
   1. Usar siempre `@supports` y diseñar el estado sin animación como estado correcto.
   2. Para revelados en webs comerciales hoy: CSS-001 (scroll-driven con `@supports`) o `IntersectionObserver` mínimo; las *scroll-triggered* como mejora en Chromium.
   3. Verificar nombres y sintaxis en MDN/especificación antes de escribirlas (las propuestas recientes cambian).
7–13. **Aplicaciones.** Revelados de secciones, transiciones en listas filtrables (servicios, equipo), tooltips.
14. **Pruebas.** Chrome estable, Firefox y Safari (deben mostrar el contenido sin animación); reduced motion.
15. **Estado.** Artículo leído y contrastado con documentación oficial en el lote 11 (ver tabla); nada probado en navegador.

## Verificación oficial (lote 11, 2026-10-27) — `DOCUMENTACION_OFICIAL_ANALIZADA`
| Afirmación del artículo | Fuente oficial | Resultado |
|---|---|---|
| Existen `timeline-trigger`, `animation-trigger` y `trigger-scope` | MDN, guía "CSS animation triggers" (https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animation_triggers) | **Confirmado.** MDN documenta `timeline-trigger` (abreviada) con `timeline-trigger-name`, `timeline-trigger-source`, `timeline-trigger-activation-range(-start/-end)` y `timeline-trigger-active-range(-start/-end)`; `animation-trigger` con acciones (`play-forwards`, `play-backwards` en el ejemplo); `trigger-scope` aparece en la referencia sin descripción. Los *event triggers* (`event-trigger…`) no los soporta ningún navegador. |
| Diferencia con scroll-driven | MDN | **Confirmado:** scroll-driven liga el progreso a la línea de tiempo; triggered mantiene una animación temporal normal que se reproduce/invierte al cruzar umbrales. |
| Ejemplo de sintaxis | MDN | `animation-trigger: --t play-forwards play-backwards;` en el elemento animado y `timeline-trigger-name: --t; timeline-trigger-source: view();` en el disparador; MDN incluye un `@supports not (timeline-trigger-source: view())` de respaldo. |
| Soporte Chrome 146 | MDN no da estado Baseline en la guía; enlaza un artículo de Chrome de 2025 | **Parcialmente verificado:** soporte limitado; comprobar la tabla de compatibilidad de cada propiedad antes de usar. |
| View Transitions por elemento en Chrome 147 | Chrome for Developers, "Chrome 147 enables concurrent and nested view transitions with element-scoped view transitions" | **Confirmado:** `Element.startViewTransition()` en Chrome 147 estable; transiciones concurrentes y anidadas; el resto de la página sigue interactivo; durante la transición la raíz recibe `contain: layout` y `view-transition-scope: all`; `::view-transition-group-children()` recorta si la raíz recorta su desbordamiento; estuvo en pruebas desde Chrome 140. La página no trata detección ni otros navegadores. |
| `corner-shape` "solo en vista previa, no en estable" | MDN `corner-shape` | **Corregido:** MDN lo documenta como **experimental, no Baseline, "Limited availability"** (funciona en algunos navegadores, no en todos). Valores: `round`, `square`, `bevel`, `scoop`, `notch`, `squircle`, `superellipse(n)` (equivalencias: square=∞, squircle=2, round=1, bevel=0, scoop=−1, notch=−∞); 1–4 valores como `margin`; **requiere `border-radius`** (sin él no tiene efecto); se interpola al animar. Con `border-shape` activo se ignora `border-radius` y `corner-shape` no tiene efecto. |

**Advertencias que se mantienen:** las tres capacidades necesitan `@supports` y un estado sin animación correcto; ninguna es Baseline; no se han probado en navegador en esta biblioteca.

