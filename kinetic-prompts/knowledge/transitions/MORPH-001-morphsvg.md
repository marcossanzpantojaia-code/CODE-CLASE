---
id: MORPH-001
titulo: Morphing de formas SVG con MorphSVGPlugin
categoria: transitions
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (docs MorphSVG v3.15)
versiones: GSAP 3.15 (docs); opciones `smooth` y `curveMode` desde 3.14.0; plugin gratuito
perfil: ambos
ultima_revision: 2026-10-26
---

# MORPH-001 · MorphSVG

1. **Nombre y finalidad.** Transformar una forma SVG en otra (icono de menú → cruz, gota → logo, onda de fondo) aunque tengan distinto número de puntos. **Tema 8.**
2. **Fuente.** gsap.com/docs/v3/Plugins/MorphSVGPlugin/ (v3.15). Demos oficiales citadas en la doc (CodePen vEGpawb, MWMVKmp, WYWZab canvas; colección noQGjq) — no inspeccionadas.
3. **Ubicación.** Docs: *Config Object*, *Methods*, *Performance tips*.
4. **Resultado.** El atributo `d` del path se interpola entre dos formas con transición suave.
5. **Explicación técnica (docs).** Convierte ambos trazados a curvas Bézier cúbicas y añade anclas para igualar el número de puntos; interpola en modo lineal o rotacional.
6. **Dependencias.** `gsap` + `MorphSVGPlugin` (`gsap.registerPlugin(MorphSVGPlugin)`), paquete público `gsap`.
7. **Procedimiento.** (1) Convertir primitivas a `<path>` con `MorphSVGPlugin.convertToPath()`; (2) `gsap.to(path, { morphSVG: "#destino" })` o con objeto de configuración; (3) si la interpolación se "retuerce", ajustar `shapeIndex` (herramienta `findShapeIndex` o `shapeIndex: "log"`) o usar `type: "rotational"`.
8. **Parámetros (docs).** `shape` (destino: selector, elemento o datos de path), `type` (`"linear"` por defecto / `"rotational"`), `map` (`"size"` por defecto / `"position"` / `"complexity"`), `shapeIndex` (`"auto"`, número, array, `"log"`; solo trazados cerrados), `origin` (`"50% 50%"`, para rotacional; ayuda `findMorphOrigin()`), `precision` (2 decimales), `smooth` (3.14+: número, `"auto"` u objeto `{points, redraw, persist}`), `curveMode` (3.14+), `render` (dibujar en canvas), `updateTarget` (`true`; `false` si solo se pinta en canvas). Globales: `MorphSVGPlugin.defaultType`, `defaultRender`, `defaultUpdateTarget`. Utilidades: `rawPathToString`, `stringToRawPath`, `precompile: "log"`.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   gsap.registerPlugin(MorphSVGPlugin);
   MorphSVGPlugin.convertToPath("circle, rect");
   const tl = gsap.timeline({ paused: true }).to("#icon-menu", { morphSVG: { shape: "#icon-close", type: "rotational" }, duration: 0.4, ease: "power2.inOut" });
   button.addEventListener("click", () => tl.reversed() ? tl.play() : tl.reverse());
   ```
10. **Problemas habituales (docs).** Formas complejas: coste del primer cálculo → precompilar (`precompile: "log"`), recompilar si cambia el arte; si va a tirones todo el rato, el cuello de botella es el render del navegador → simplificar el SVG; segmentos que no casan → dividir en paths separados; `smooth` con `redraw` sacrifica fidelidad.
11. **Rendimiento / a11y.** SVG decorativo con `aria-hidden`; el botón conserva su `aria-label`/`aria-expanded` (el morph no comunica estado). Reduced motion: cambio instantáneo.
12. **Compatibilidad.** SVG en navegadores actuales; canvas vía `render`.
13. **Aplicaciones.** Botón de menú, iconos de estado, separadores de sección orgánicos, logo animado.
14. **Pruebas.** Formas con distinto nº de puntos; ida y vuelta repetida; rendimiento con paths complejos; lector de pantalla en el botón.
15. **Estado de evidencia.** Docs oficiales leídas. Demos no inspeccionadas. Nada ejecutado. Precedente sin plugin: morph de `d` con curva cuadrática en TUT-003 (framer-motion), útil solo para formas con la misma estructura de comandos.


## Lote 8 — variante sin GSAP: flubber + framer-motion (Olivier Larose, `olivierlarose/svg-morph`) — `CODIGO_INSPECCIONADO`
Repo sin licencia (commit 03bcc91, 2023-08-29; flubber ^0.4.2, framer-motion ^10.16.1). Sin vídeo/artículo consultado.
- [COD] Un `motion.path` por pieza (boca, ojo izq., ojo dcho.) con una lista de trazados `[normal, feliz, normal]`; un `useMotionValue` de progreso (0…n−1) y `useTransform(progress, índices, trazados, { mixer: (a, b) => interpolate(a, b, { maxSegmentLength: 1 }) })`: flubber genera la interpolación entre formas con distinto número de puntos (lo que MorphSVG hace en GSAP).
- [COD] Cada paso: `animate(progress, i, { duration: 0.4, ease: "easeInOut", delay: 0.5 })`; al llegar al último, `progress.set(0)` y vuelve a empezar → bucle "parpadeo/sonrisa".
- [CALC] `maxSegmentLength: 1` en un `viewBox` de 192 → trazados muy densos (más puntos = morph suave pero más CPU por frame); 2–4 suele bastar [EST].
- Problemas: bucle infinito sin pausa ni reduced motion (WCAG 2.2.2); flubber sin mantenimiento reciente [EST, no comprobado]. Elegir MorphSVG (gratuito) si el proyecto ya usa GSAP.
