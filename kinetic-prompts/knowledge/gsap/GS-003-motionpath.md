---
id: GS-003
titulo: MotionPathPlugin — mover elementos a lo largo de un trazado (también con scroll)
categoria: gsap
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA
versiones: GSAP 3
perfil: ambos
ultima_revision: 2026-10-27
---

# GS-003 · MotionPath

1. **Finalidad.** Animar un elemento (icono, avión, punto) siguiendo un `<path>` SVG o una lista de puntos; combinado con `scrollTrigger.scrub`, el elemento recorre el camino con el scroll (temas 6 y 13). Equivalente DOM de CAM-001/002 (cámara sobre curva en 3D).
2. **Fuente.** https://gsap.com/docs/v3/Plugins/MotionPathPlugin/ (2026-10-26).
3. **Opciones.**
   - `path`: elemento/selector `<path>`, cadena `d`, array de `{x,y}` o de cualquier propiedad (`{scale, rotation}`).
   - `align`: coloca el objetivo sobre el trazado aunque estén en contenedores distintos/transformados; `"self"` = trazado relativo a la posición actual.
   - `alignOrigin: [0.5, 0.5]`: punto del objetivo que va pegado al trazado (también fija `transformOrigin`).
   - `autoRotate`: `true` o grados de compensación (p. ej. 90 si el dibujo apunta hacia arriba).
   - `start`/`end` (0–1; fuera de rango da vueltas; `end < start` invierte).
   - Solo arrays: `curviness` (0 rectas, 1 por defecto), `type: "cubic"`, `fromCurrent`, `relative`, `resolution` (12; reparto uniforme de velocidad).
4. **Utilidades.** `MotionPathPlugin.convertToPath("circle, rect")` (convierte formas básicas a `<path>`), `getRelativePosition(a, b, [0.5,0.5], [0.5,0.5])`.
5. **Advertencia oficial.** La alineación se calcula **una vez** al empezar: no es responsive. Al redimensionar: guardar `progress()`, matar el tween, recrearlo y restaurar el progreso (con ScrollTrigger: recrearlo en `matchMedia`/`invalidateOnRefresh` o en `ScrollTrigger.addEventListener("refreshInit")`).
6. **Dependencias.** gsap + MotionPathPlugin (+ ScrollTrigger para scroll).
7. **Procedimiento (adaptación).**
   1. Dibujar el camino en el mismo `<svg>` que el objeto, con `viewBox` y `preserveAspectRatio` controlados.
   2. `transformOrigin: "50% 50%"` o `alignOrigin` antes de `autoRotate`.
   3. Con scroll: `ease: "none"` en el tween (si no, el objeto acelera/frena respecto al scroll).
   4. Mostrar el trazado recorrido con DrawSVG o `stroke-dashoffset` sincronizado.
8. **Parámetros.** `curviness`, `autoRotate`, `start/end`, `scrub`.
9. **Código (adaptación; no ejecutada):**
   ```js
   gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);
   gsap.to("#punto", { ease: "none",
     motionPath: { path: "#ruta", align: "#ruta", alignOrigin: [0.5, 0.5], autoRotate: true },
     scrollTrigger: { trigger: "#mapa", start: "top center", end: "bottom center", scrub: true } });
   ```
10. **Problemas habituales.** Trazado y objeto en sistemas de coordenadas distintos (usar `align`); no recalcular al redimensionar; primer punto inesperado con arrays (`fromCurrent: false`).
11. **A11y.** Decorativo: `aria-hidden` en el SVG; información (p. ej. "cómo llegar") también en texto.
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** "Cómo llegar a la clínica" con un punto que recorre el mapa; línea de tiempo de una empresa; recorrido de un proceso (comercial A).
14. **Pruebas.** Resize/rotación móvil; scroll rápido; reduced motion (mostrar el estado final).
15. **Estado.** Documentación leída; no implementado. Cámara sobre curva en 3D sigue pendiente de medición (CAM-002).

**Lote 17 (Skill oficial `gsap-plugins`, GS-004):** `MotionPathHelper.create(target, path, { end })` es un **editor visual de desarrollo** (ajustar alineación y desplazamiento y luego copiar `helper.path`/`getProgress()`); como GSDevTools, **no publicarlo**. La configuración oficial coincide con esta ficha (`path`, `align`, `alignOrigin` [0,5, 0,5] por defecto, `autoRotate`, `curviness` 0–2).
