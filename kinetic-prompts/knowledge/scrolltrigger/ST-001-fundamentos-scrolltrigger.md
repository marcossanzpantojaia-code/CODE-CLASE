---
id: ST-001
titulo: Fundamentos de ScrollTrigger (trigger, start/end, scrub, toggleActions)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA
versiones: GSAP 3.15 (docs a 2026-10-26); ScrollTrigger requiere >= 3.3.0
perfil: ambos
ultima_revision: 2026-10-27
---

# ST-001 · Fundamentos de ScrollTrigger

1. **Finalidad.** Vincular animaciones a la posición de scroll: dispararlas al entrar un elemento o sincronizar su progreso con la barra (scrub).
2. **Fuente.** https://gsap.com/docs/v3/Plugins/ScrollTrigger/ · Errores frecuentes: https://gsap.com/resources/st-mistakes (analizado en ST-004).
3. **Ubicación.** "Config Object" (start, end, scrub, toggleActions, once, markers) y FAQ "How does duration work with scrub".
4. **Resultado.** Elementos que se animan al entrar en el viewport, o animaciones que avanzan/retroceden con el scroll.
5. **Explicación técnica.** ScrollTrigger no vigila elementos en cada frame: precalcula inicio y fin en el flujo normal del documento y solo observa la posición de scroll, actualizando en el siguiente `requestAnimationFrame`. Recalcula al redimensionar (tras ~200 ms sin eventos de resize). Si el layout cambia después (imágenes, fuentes, contenido dinámico), hay que llamar a `ScrollTrigger.refresh()`. Con `scrub`, las duraciones de una timeline solo cuentan como **proporciones** del recorrido; la distancia la fijan `start`/`end`.
6. **Dependencias.** `gsap` (npm público; todos los plugins gratuitos tras la adquisición por Webflow) y `ScrollTrigger` registrado con `gsap.registerPlugin(ScrollTrigger)`.
7. **Procedimiento.** (1) Registrar el plugin una vez (también evita que el tree-shaking lo elimine en producción). (2) Agrupar animaciones relacionadas en una timeline con un único ScrollTrigger. (3) Crear triggers en el orden en que aparecen en la página. (4) Desarrollar con `markers: true` y quitarlos en producción. (5) `ScrollTrigger.refresh()` tras cambios de layout.
8. **Parámetros.** `trigger`, `start` (defecto `"top bottom"`, o `"top top"` con pin), `end` (defecto `"bottom top"`), `scrub` (`true` o segundos de retardo), `toggleActions` (defecto `"play none none none"`), `once`, `snap`, `markers`, `fastScrollEnd`, `preventOverlaps`, `invalidateOnRefresh`. Desde 3.12, `clamp()` en start/end evita que elementos visibles al cargar empiecen parcialmente animados.
9. **Código (adaptación propuesta, no ejecutada):**
   ```js
   gsap.registerPlugin(ScrollTrigger);
   const tl = gsap.timeline({
     scrollTrigger: { trigger: ".feature", start: "clamp(top 80%)", end: "bottom 40%", scrub: 0.6 }
   });
   tl.from(".feature__title", { yPercent: 40, autoAlpha: 0 })
     .from(".feature__img", { scale: 1.1, autoAlpha: 0 }, "<0.1");
   ```
10. **Problemas habituales.** ScrollTriggers anidados en tweens hijos de una timeline (conflicto de control); triggers creados fuera de orden con pins por encima; `content-visibility: auto/hidden` impide medir; plugin sin registrar (falla solo en build de producción).
11. **Rendimiento y accesibilidad.** Animar `transform` y `opacity`/`autoAlpha`, no propiedades de layout. Respetar reduced motion (A11Y-001). Contenido legible sin JS.
12. **Compatibilidad.** Navegadores modernos. Verificar Safari iOS por la barra de direcciones dinámica (`ScrollTrigger.normalizeScroll()`, ficha pendiente).
13. **Aplicaciones comerciales.** Revelado de secciones en landings, contadores, storytelling de producto.
14. **Pruebas.** Scroll rápido y lento; resize y rotación; recarga a mitad de página; reduced motion; build de producción.
15. **Evidencia.** Solo documentación oficial. Código **no ejecutado**. Ningún vídeo analizado.

**Lote 13:** errores frecuentes (antes "pendiente de análisis") → [ST-004](ST-004-errores-frecuentes.md); `normalizeScroll()` y móvil (antes "ficha pendiente") → [ST-006](ST-006-normalizescroll-y-movil.md).
