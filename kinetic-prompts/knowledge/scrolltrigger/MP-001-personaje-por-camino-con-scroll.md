---
id: MP-001
titulo: Personaje 3D hecho con CSS que recorre un camino con el scroll (MotionPath + ScrollTrigger + eventos por sección)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Frontend Horse) + CODIGO_INSPECCIONADO (CodePen de Michelle Barker, MIT) (TUT-024)
versiones: GSAP 3 (ScrollTrigger, MotionPathPlugin), CSS 3D (`preserve-3d`), `mask-image`
perfil: cinematografico
ultima_revision: 2026-10-26
---

# MP-001 · "Weird Fishes" (Michelle Barker, explicado por Frontend Horse)

1. **Finalidad.** Narrativa con scroll: un personaje (un pez de CSS 3D) nada por una trayectoria mientras aparecen frases por sección, burbujas, rayos de luz y un efecto de "rayos X" (temas 6, 13 y 15). Cierra la brecha de **cámara/objeto sobre curva** en el DOM (complementa GS-003 y CAM-002).
2. **Fuentes.** Artículo https://frontend.horse/articles/swimming-on-scroll-with-gsap (sin fecha ni autor visibles; preparado con la ayuda de la autora). Pen https://codepen.io/michellebarker/pen/dyMQYYz (MIT; JS/CSS/HTML leídos literal el 2026-10-26). Blog de la autora: css-irl.info. **El texto del pen contiene letra de una canción con derechos: no se reproduce.**
3. **Ubicación.** JS (~150 líneas), CSS (~9 KB), HTML con 11 `<section>`.
4. **Resultado (según código y artículo).** Pez semitransparente de tonos violetas sobre un degradado de océano; al bajar, recorre 5 tramos curvos, se aleja en profundidad, vuelve, se gira al subir y termina mostrando su "esqueleto".
5. **Explicación técnica.**
   - **Personaje en CSS 3D [COD]:** `.fish-wrapper` fijo a pantalla completa con `perspective: 100rem` y `preserve-3d`; cuerpo de 4 triángulos (`clip-path: polygon`) girados con `rotateY(90deg)` y `rotateX(±9.5deg)` formando una pirámide; cabeza análoga (±23.5°); luminosidad distinta por cara (`hsla(250 50% L / .95)` con L 50–95 %) = sombreado falso. Tamaño con variables (`--size`, `--bodyW`) que cambian a 1000 px.
   - **Esqueleto [COD]:** un solo `div` con tres degradados superpuestos (costillas con `repeating-linear-gradient`, cráneo y columna) recortado con `clip-path`; se hace parpadear (`opacity`, `repeat: 4`) al final.
   - **Camino [COD + artículo]:** array de 15 puntos `{x,y}` (5 grupos de 3) en lugar de un `<path>`: más fácil de leer y retocar. Se **escalan** por `innerWidth/1200` (si < 1000 px) e `innerHeight/1200` (si < 700 px).
   - **Tween [COD]:** `motionPath: { path, align: "self", alignOrigin: [0.5, 0.5], autoRotate: true }`, `duration: 10`, `immediateRender: true` dentro de una timeline con `scrollTrigger: { scrub: 1.5 }` (sin `trigger` → todo el documento). En la misma timeline: `rotateX 180°` en t=1, vuelta en 2,5; `z: −500` (2 s) para alejarse; `z: −50` después.
   - **Eventos por sección [COD]:** un `ScrollTrigger.create` por `<section>` con `start: "top top"`: `onEnter` muestra la frase y lanza burbujas en la posición actual del pez (`getBoundingClientRect`), `onLeave/onLeaveBack` la ocultan, `onUpdate` lee `self.direction` y gira el pez `rotationY 180°/0` en 0,4 s (nada hacia atrás al subir).
   - **Profundidad [COD]:** `mask-image: linear-gradient(180deg, #000, transparent)` en el contenedor → el pez se desvanece hacia abajo como si se hundiera.
   - **Ambiente [COD]:** rayos con `repeating-conic-gradient` enmascarado radialmente; luces con su propia timeline `scrub: 6` (muy retardada = sensación de agua); viñeta con `radial-gradient` en `body::after`.
6. **Dependencias.** gsap, ScrollTrigger, MotionPathPlugin. Sin canvas ni WebGL.
7. **Procedimiento profesional (adaptación).**
   1. Recalcular el camino al redimensionar (`ScrollTrigger.addEventListener("refreshInit", …)` o `matchMedia`) — el original solo escala al cargar (GS-003 §5).
   2. Frases en HTML real dentro de cada sección (legibles sin JS); reduced motion: pez estático y frases visibles.
   3. Personaje decorativo `aria-hidden`.
   4. Si la escena se complica (iluminación real, muchos objetos), pasar a Three.js con la misma lógica (curva + `getPointAt`, CAM-001).
8. **Parámetros.** 15 puntos; duración 10; scrub 1,5 (artículo: 1); escala 1/1200; rotateX ±180°; z −500; giro de dirección 0,4 s; luces scrub 6.
9. **Código (MIT, fragmento mínimo):**
   ```js
   tl.to(fish, { motionPath: { path: scaledPath, align: "self", alignOrigin: [0.5, 0.5], autoRotate: true },
                 duration: 10, immediateRender: true });
   ```
10. **Problemas / discrepancias.** [COD] El artículo da `scrub: 1`; el pen usa `1.5`. Camino no responsive; `tl.pause()` justo después de crear una timeline con ScrollTrigger (sin efecto práctico: la controla el scroll); `bubbles` reutiliza un solo grupo; sin reduced motion; usa la letra de una canción como contenido.
11. **Rendimiento / a11y.** Todo transforms/opacidad; `mask-image` y degradados grandes fijos se pintan una vez. `perspective` alto (100rem) = 3D suave.
12. **Compatibilidad.** `mask-image` sin prefijo en navegadores modernos (el pen añade `-webkit-`).
13. **Aplicaciones.** Historia de una marca, recorrido de un proceso (p. ej. "de la reserva al tratamiento" con un icono que avanza), portfolio narrativo.
14. **Pruebas.** Resize/rotación; subir y bajar (giro del personaje); teclado (Espacio/AvPág); reduced motion.
15. **Estado de evidencia.** Artículo + código literal; no ejecutado ni medido (panel oculto).
