---
id: FLIP-002
titulo: Galería bento que se amplía con el scroll (Flip.to + ScrollTrigger scrub + pin + expoScale)
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (código literal, CodePen GreenSock/vYMzKZx, MIT por ser pen público) + DEMO_INSPECCIONADA parcial (estados medidos en el DOM con actualización forzada; animación no observada en tiempo real)
versiones: gsap 3.15.0 + ScrollTrigger + Flip + EasePack (unpkg gsap@3 en ejecución)
perfil: ambos
ultima_revision: 2026-10-26
---

# FLIP-002 · Bento gallery con scrub

1. **Nombre y finalidad.** Una cuadrícula tipo bento (8 piezas de tamaños distintos) que, al hacer scroll, crece hasta que la pieza central ocupa toda la pantalla: transición de "portada de galería" a "imagen protagonista" (temas 5, 8, 13).
2. **Fuente.** GreenSock, "Scrubbed Bento Gallery", https://codepen.io/GreenSock/pen/vYMzKZx (creado 2024-04-16, actualizado 2025-07-29). Demo Hub: https://demos.gsap.com/demo/scrubbed-bento-gallery.
3. **Ubicación.** JS: función `createTween()`; CSS: `.gallery--bento` y `.gallery--final`.
4. **Resultado.** [MED] p = 0: piezas de 243 px de ancho (3 columnas de 32,5vw); p = 0,5: la central mide 399×567; p = 1: la central (pieza 3) ocupa exactamente el viewport (747×894) y el resto queda fuera.
5. **Explicación técnica [COD].**
   - Dos layouts CSS Grid: inicial (columnas `repeat(3, 32.5vw)`, filas `repeat(4, 23vh)`, `gap: 1vh`) y final (`.gallery--final`: columnas `repeat(3, 100vw)`, filas `repeat(4, 49.5vh)`). La pieza 3 abarca columna 2 y filas 2–3 → en el layout final mide 100vw × (2·49,5vh + 1vh) = **pantalla completa**.
   - Truco clave: **se añade temporalmente la clase final, se captura `Flip.getState()` y se quita la clase**; después `Flip.to(state, { simple: true, ease: "expoScale(1, 5)" })` crea la animación hacia ese estado sin cambiar el DOM.
   - Esa animación se mete en una timeline con `scrollTrigger: { trigger: galería, start: "center center", end: "+=100%", scrub: true, pin: galleryElement.parentNode }`.
   - Todo dentro de `gsap.context()`; en `resize` se revierte el contexto (y su función de limpieza hace `clearProps: "all"`) y se reconstruye.
6. **Dependencias.** gsap, ScrollTrigger, Flip, EasePack (para `ExpoScaleEase`). Todos gratuitos.
7. **Procedimiento para Claude Code.** (1) Definir los dos layouts como clases CSS; (2) capturar el estado final con la clase puesta y quitarla; (3) `Flip.to` con `simple: true` (sin rotaciones/escalas en contenedores) y `ease: "expoScale(1, N)"` donde N ≈ factor de crecimiento; (4) timeline con pin + scrub; (5) reconstruir en resize con `gsap.context().revert()` (añadir *debounce*, que el pen no tiene); (6) `gsap.matchMedia()` para reduced motion.
8. **Parámetros comprobados.**
   - `expoScale(1, 5)` — [MED]+[CALC]: la anchura de la pieza central sigue exactamente 243 + 504·(5^p − 1)/4 → 305 / 399 / 538 px en p = 0,25 / 0,5 / 0,75 (predicho 305,4 / 398,7 / 538,3). **Por qué importa:** con un ease lineal, una ampliación ×3 parece acelerar al final; `expoScale` reparte el crecimiento en proporción constante y se percibe uniforme.
   - Recorrido: `end: "+=100%"` = un viewport (894 px medidos) con el contenedor fijado.
9. **Código (fragmento mínimo, pen público MIT, © GreenSock):**
   ```js
   gallery.classList.add("gallery--final");
   const state = Flip.getState(items);
   gallery.classList.remove("gallery--final");
   const flip = Flip.to(state, { simple: true, ease: "expoScale(1, 5)" });
   ```
10. **Limitaciones y errores.** `resize` sin debounce reconstruye en cada evento; imágenes con `alt=""` (aceptable si son decorativas); el elemento fijado tiene `overflow: hidden` en su contenedor; `console.log`/`console.clear` en el código.
11. **Rendimiento / a11y.** Flip con `simple: true` anima posición y tamaño (width/height, no transform) → coste de layout por frame en 8 elementos: aceptable, pero vigilar en móviles; imágenes grandes (la final ocupa la pantalla) → servir resolución adecuada (IMG-001). Reduced motion: mostrar directamente la imagen protagonista o la cuadrícula estática.
12. **Compatibilidad.** CSS Grid y Flip en navegadores actuales.
13. **Aplicaciones.** Portada de portfolio de un estudio, presentación de un producto con galería, apertura de un caso de estudio.
14. **Pruebas.** Scroll adelante/atrás; resize durante el pin; 3 anchos (el layout final usa vw/vh: comprobar barra de direcciones móvil); reduced motion; LCP de la imagen central.
15. **Estado de evidencia.** Código literal leído; estados medidos en el DOM con actualización forzada (panel oculto); **movimiento en tiempo real no observado**; captura final solo ilustrativa. Datos: evidence/visual/2026-10-26-lote6/data/FLIP-002_bento_estados.json.
