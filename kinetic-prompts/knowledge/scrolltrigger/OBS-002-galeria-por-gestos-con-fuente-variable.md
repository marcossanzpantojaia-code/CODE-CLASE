---
id: OBS-002
titulo: Galería horizontal por gestos con teclado, contador y titular de fuente variable que se estira (Cassie Evans, demo oficial de ScrollTrigger.observe)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (CodePen de Cassie Evans, MIT por defecto de CodePen)
versiones: GSAP 3 (ScrollTrigger.observe / Observer, TextPlugin)
perfil: cinematografico
ultima_revision: 2026-10-27
---

# OBS-002 · "scrollTrigger.observe() – swipe gallery"

1. **Finalidad.** Variante horizontal de OBS-001 con mejoras de producción: teclado, contador y un titular cuya **anchura tipográfica** (eje `wdth` de una fuente variable) se anima en la transición (temas 2, 7, 10).
2. **Fuente.** https://codepen.io/cassie-codes/pen/vYWvwXV (Cassie Evans, entonces en GreenSock; pen enlazado desde el pie a la doc de `ScrollTrigger.observe()`); JS/CSS/HTML leídos literal el 2026-10-27. Su sitio personal está retirado (SRC-007); sus pens públicos siguen accesibles.
3. **Mecánica [COD].**
   - Misma estructura de "telón" que OBS-001 pero en X: `slide__outer` a `xPercent: 100` y `slide__inner` a `-100`; al entrar, ambos a 0 a la vez con `100·dir` / `−100·dir`.
   - Timeline `defaults { duration: 1, ease: "expo.inOut" }`, `timeScale(0.8)` (≈1,25 s reales [CALC]).
   - **Titular de fuente variable:** `font-variation-settings: "wdth" var(--width)` en CSS y GSAP anima la variable: el saliente pasa a `--width: 800` y se desplaza `xPercent: 30·dir`; el entrante viene de 800 / `−30·dir` a 200 / 0 → las letras se estiran y recogen con el movimiento. `mix-blend-mode: difference` sobre la foto.
   - **Capa de imagen superpuesta** (fuera de las secciones) con 4 fotos: entrante desde `xPercent: 125·dir`, `scaleX 1.5`, `scaleY 1.3` a 1; saliente al revés (sensación de "estirón" por velocidad). Foto interior de la sección de `scale 2` a 1.
   - **Contador** con TextPlugin (`.set(count, { text: index + 1 }, 0.32)` — cambia a mitad del barrido).
   - z-index explícito por estado (saliente 1, entrante 2, resto 0 y `autoAlpha: 0`).
   - `Observer.create({ type: "wheel,touch,pointer", preventDefault: true, wheelSpeed: -1, tolerance: 10 })` + **teclado**: ↑/← anterior; ↓/→/Espacio/Enter siguiente; bandera `animating`.
4. **Mejoras respecto a OBS-001 [comparación].** Añade teclado y contador visible; mismo patrón de bloqueo. Sigue sin botones visibles, sin reduced motion y con `user-select: none` y barras de scroll ocultas.
5. **Procedimiento profesional (adaptación).** Botones anterior/siguiente reales; `aria-live` para "Imagen 2 de 4"; reduced motion → fundido sin estirar la tipografía; precargar la siguiente imagen; fuente variable autoalojada con `font-display` (el pen la carga desde Cloudinary en TTF → usar WOFF2 [TYPE-001]).
6. **Parámetros.** `--width` 200↔800; desplazamiento del titular 30 %; imagen 125 % y escala 1,5×1,3; `expo.inOut`; `timeScale 0.8`; tolerancia 10.
7. **Código (MIT, fragmento mínimo):**
   ```js
   tl.to(heading, { "--width": 800, xPercent: 30 * direction }, 0)
     .fromTo(nextHeading, { "--width": 800, xPercent: -30 * direction }, { "--width": 200, xPercent: 0 }, 0);
   ```
8. **Otras demos de Cassie revisadas.** "SVG text animation" (`GEaZVm`) usa **anime.js** (no GSAP): tres capas de trazo por letra desplazadas 2 px con colores distintos y `strokeDashoffset` con `easeOutElastic` escalonado 200 ms → efecto de trazo "neón" dibujado. Pens populares listados: Blobby background, "lil' me", swipe gallery, to-do, SVG text, chameleon.
9–13. **Aplicaciones.** Portfolio, colección de producto, presentación de servicios en modo "slides".
14. **Pruebas.** Teclado, trackpad (inercia), táctil, lector, reduced motion, carga de la fuente variable (FOUT).
15. **Estado.** Código leído; no ejecutado.
