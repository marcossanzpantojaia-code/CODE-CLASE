---
id: ST-005
titulo: Revelados en grupo con ScrollTrigger.batch() — tarjetas y listas que entran escalonadas sin un ScrollTrigger por tween
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (gsap.com, ScrollTrigger.batch())
versiones: GSAP 3 (ScrollTrigger)
perfil: ambos
ultima_revision: 2026-10-27
---

# ST-005 · ScrollTrigger.batch()

1. **Finalidad.** Rejillas de servicios, tarjetas de equipo o galerías: los elementos que llegan a la vez entran juntos con escalonado, sin crear y gestionar una animación por elemento (temas 1, 4). Alternativa de GSAP a `IntersectionObserver`.
2. **Fuente.** https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.batch() .
3. **API [doc].** `ScrollTrigger.batch(targets, vars)` crea un ScrollTrigger por elemento y **agrupa** los callbacks que se disparan dentro de un intervalo corto; devuelve el array de instancias.
   - `interval` (s): tiempo máximo para reunir un lote (por defecto ≈ 1 frame).
   - `batchMax` (número o función, reevaluada en cada refresco → responsive): máximo por lote; un lote lleno se dispara ya.
   - Callbacks (`onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack`…) reciben **`(targets, scrollTriggers)`** (arrays); cada tipo se agrupa por separado. `onRefreshInit` **no** se agrupa.
   - No permitidos en `vars`: `trigger`, `animation`, `invalidateOnRefresh`, `onSnapComplete`, `onScrubComplete`, `scrub`, `snap`, `toggleActions`.
4. **Patrón [doc, adaptado].**
   ```js
   gsap.set(".card", { opacity: 0, y: 100 });
   ScrollTrigger.batch(".card", {
     interval: 0.1, batchMax: 3, start: "top 85%",
     onEnter: b => gsap.to(b, { opacity: 1, y: 0, stagger: 0.15, overwrite: true }),
     onLeaveBack: b => gsap.set(b, { opacity: 0, y: 100, overwrite: true }),
   });
   ```
5. **Trampas [doc].** Los transforms cuentan en el cálculo de posiciones: con un `y` inicial, el refresco puede medir mal → `ScrollTrigger.addEventListener("refreshInit", () => gsap.set(".card", { y: 0 }))` (GSAP lo revierte tras el refresco); ajustar `start/end` al layout real; `overwrite: true` cuando entrada y salida pueden pisarse; usar el array `scrollTriggers` si se necesita progreso/dirección por elemento.
6. **Procedimiento profesional (adaptación).**
   1. Estado inicial oculto **solo con JS activo** (clase en `<html>` o `gsap.set` en el script) → sin JS el contenido se ve.
   2. Reduced motion: `gsap.matchMedia()` → sin `y`, solo opacidad o nada (A11Y-001).
   3. Duraciones/escalonados desde los tokens de movimiento (UX-001): 0,4–0,6 s, stagger 0,05–0,15 s [EST].
   4. Alternativa sin JS para webs comerciales: CSS scroll-driven con `@supports` (CSS-001) o CSS-008.
7–13. **Aplicaciones.** "Nuestros servicios", rejilla de cortes de una barbería, casos de éxito.
14. **Pruebas.** Scroll rápido (lotes de varios), subir y bajar, resize (`batchMax` en función), sin JS, reduced motion.
15. **Estado.** Doc leída; no implementado.
