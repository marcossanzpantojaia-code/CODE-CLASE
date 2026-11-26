---
id: GS-002
titulo: ScrollSmoother (GSAP) — scroll suavizado con parallax por atributos, y cuándo elegirlo frente a Lenis
categoria: gsap
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA
versiones: GSAP 3.10+ (ScrollSmoother "added in v3.10.0" según su página de documentación — **verificado** en el lote 16; `effectsPrefix` 3.10.5, `effectsPadding` y `speed` 3.11.4; gratuito desde la compra por Webflow), `clamp()` en data-speed desde 3.12
perfil: cinematografico
ultima_revision: 2026-10-27
---

# GS-002 · ScrollSmoother

1. **Finalidad.** Suavizar el scroll y añadir parallax/lag declarativo (`data-speed`, `data-lag`) integrado con ScrollTrigger (tema 1).
2. **Fuente.** https://gsap.com/docs/v3/Plugins/ScrollSmoother/ (leída el 2026-10-26).
3. **Estructura obligatoria.** `#smooth-wrapper > #smooth-content` con todo el contenido. Los elementos `position: fixed` (cabecera, cursor, modales) **fuera** del wrapper: el contenido recibe transforms `matrix3d()` y pasa a ser bloque contenedor de los fixed internos.
4. **Cómo funciona.** El scroll nativo sigue existiendo (barra en `body`); ScrollTrigger lee la posición nativa y ScrollSmoother desplaza el contenido para "alcanzarla" en `smooth` segundos (0,8 por defecto, ease "expo").
5. **Opciones clave.** `smooth`, `effects` (true/selector; no anidar efectos), `smoothTouch` (desactivado en táctil por defecto), `normalizeScroll` (scroll en el hilo de JS; reduce saltos de la barra de direcciones), `ignoreMobileResize`, `speed`, `onUpdate/onStop/onFocusIn`.
6. **Atributos.** `data-speed="0.5"` (mitad), `"auto"` (calcula el recorrido dentro de un padre `overflow: hidden` → parallax de imagen), `"clamp(0.5)"` (evita desplazar elementos visibles al inicio); `data-lag="0.3"` (retardo individual).
7. **Métodos.** `scrollTo(target, smooth, position)`, `scrollTop()`, `offset(el, "top center")`, `paused(true)` (bloquea también la barra; útil con menús/modales), `effects()`, `getVelocity()`, `kill()`; una sola instancia (`ScrollSmoother.get()`).
8. **Elección frente a Lenis (LN-001) [conclusión propia a partir de ambas docs].**
   | Criterio | ScrollSmoother | Lenis |
   |---|---|---|
   | Estructura | wrapper + content obligatorios | ninguna (suaviza `window`) |
   | `position: fixed` | fuera del wrapper | funciona normal |
   | Parallax declarativo | sí (`data-speed/lag`) | no (hacerlo con ScrollTrigger) |
   | Integración | nativa con ScrollTrigger | `lenis.on('scroll', ScrollTrigger.update)` + ticker |
   | Ecosistema | GSAP | independiente (React/Vue) |
   Regla práctica: proyecto ya 100 % GSAP con mucho parallax → ScrollSmoother. Next.js con cabecera fija, modales y librerías de terceros → Lenis.
9. **Código (adaptación; no ejecutada):**
   ```js
   gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
   const smoother = ScrollSmoother.create({ smooth: 1, effects: true, smoothTouch: 0.1 });
   ```
10. **Problemas habituales.** Fixed dentro del wrapper; efectos anidados; elementos con `data-speed` visibles al cargar que "saltan" (usar `clamp()`); crear la instancia antes que los ScrollTriggers; iOS vertical: la barra de direcciones sigue cambiando el alto (usar `ignoreMobileResize`).
11. **A11y.** Mantiene scroll nativo, teclado y lector; aun así respetar `prefers-reduced-motion` (`smooth: 0`, sin efectos).
12. **Compatibilidad.** Navegadores modernos.
13. **Aplicaciones.** Portfolio y webs de marca; en comercial, `smooth` bajo (≤ 0,6) o nada.
14. **Pruebas.** Anclas internas (`scrollTo`), foco con Tab (que el elemento enfocado quede visible: `onFocusIn`), modales con `paused`, resize/rotación móvil.
15. **Estado.** Documentación leída; no implementado.
