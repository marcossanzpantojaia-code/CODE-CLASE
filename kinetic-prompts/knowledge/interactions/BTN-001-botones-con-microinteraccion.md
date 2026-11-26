---
id: BTN-001
titulo: Botones con microinteracciones memorables — confeti con física, "desliza para confirmar" y inclinación 3D (Aaron Iker)
categoria: interactions
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Frontend Horse, "Buttons that Spark Joy") + CODIGO_INSPECCIONADO (CodePen de Aaron Iker, MIT) (TUT-024)
versiones: GSAP 3 (Physics2DPlugin, Draggable, MorphSVGPlugin — gratuitos), variables CSS animadas
perfil: ambos (comercial: con moderación)
ultima_revision: 2026-10-26
---

# BTN-001 · Botones de Aaron Iker

1. **Finalidad.** Dar recompensa visual a una acción (confirmar compra, reserva, favorito) sin vídeo ni librerías pesadas (tema 10).
2. **Fuentes.** https://frontend.horse/articles/buttons-that-spark-joy (sin fecha/autor visibles). Pens leídos literal (MIT): https://codepen.io/aaroniker/pen/bGVGNrV (Confirm con confeti) y https://codepen.io/aaroniker/pen/JjGYobZ (Drag to confirm). Pen del marcador (LYGqgQe) solo descrito por el artículo.
3. **Patrón común [COD].** **El estado visual vive en variables CSS** (`--icon-x`, `--z-before`, `--success-opacity`, `--handle-blur`…) y GSAP anima esas variables (`gsap.to(button, { '--success-opacity': 1 })`); el CSS decide cómo se aplican (transform, opacity, blur). Separa coreografía (JS) de presentación (CSS) y permite varios temas (`.white`, `.grey`) solo cambiando variables.
4. **Botón "Confirm" con cañón de confeti [COD].**
   - Inclinación 3D al mover el ratón: `--rx = clamp(−(dy), −10, 10)`, `--ry = clamp(dx/10, −4, 4)` en grados, `perspective(440px)`; transición 0,4 s (0,16 s en hover).
   - Clic: el icono retrocede (`--icon-x −3, --icon-y 3`) y la capa trasera sube (`--z-before 0`) en 0,2 s → "pulsación" física; al terminar dispara `particles(emitter, 100, …, −80°, −50°)` y vuelve con `elastic.out(1, .5)` en 1 s.
   - Partícula: `div` 4×4 px de un color aleatorio de 4; `physics2D: { angle: random(−80, −50), velocity: random(70, 140), gravity: 120 }`, 1,8 s, giros `rotationX/Z` de 720–1440°, `scale 0.4–0.7`, aparece en 0,05 s y se desvanece 1 s desde t=0,8; se elimina del DOM al terminar.
5. **Botón "desliza para confirmar" [COD].**
   - Primer clic: muestra asa y zona de destino (`--handle-drop-opacity 1`), oculta "Buy now", muestra "Confirm" al 50 %.
   - `Draggable.create(handle, { type: 'x', bounds: button, onDrag, onRelease })`; en `onDrag` una función calcula el progreso según la distancia restante y deforma con MorphSVG el asa y el destino (tweens en pausa cuyo `progress()` se fija a mano).
   - Al soltar: si `this.hitTest(drop)` → `disable()`, el asa salta al destino con `elastic.out(1, .8)` y una secuencia de variables (blur 0, icono gira 87° y se convierte en ✓ vía `stroke-dashoffset`) muestra "Done" a los 0,8 s. Si no, vuelve con `elastic.out(1, .75)` en 0,6 s y un pequeño "rebote" morph.
6. **Dependencias.** gsap + Physics2DPlugin / Draggable / MorphSVGPlugin.
7. **Procedimiento profesional (adaptación).**
   1. El botón debe funcionar **sin** el gesto: "desliza para confirmar" necesita alternativa por teclado (Enter/Espacio confirma, o botón "Confirmar" visible) y por lectores (WCAG 2.5.1 gestos de puntero, 2.5.7 arrastre).
   2. Anunciar el resultado (`aria-live`/`role="status"`), no solo con la animación.
   3. Confeti: limitar partículas en móvil (100 → 30–40 [EST]) y omitir con reduced motion.
   4. La animación de éxito solo tras la respuesta real del servidor (UX-003).
   5. `--rx/--ry` con `@property` (CSS-007) si se quiere transicionarlas en CSS puro.
8. **Parámetros.** Ver §4–§5 (todos del código).
9. **Código (MIT, fragmento mínimo):**
   ```js
   gsap.to(dot, { duration: 1.8, physics2D: { angle: gsap.utils.random(-80, -50), velocity: gsap.utils.random(70, 140), gravity: 120 } });
   ```
10. **Problemas detectados [COD].** `getBoundingClientRect()` medido una vez al cargar (la inclinación falla tras scroll/resize); sin teclado en el arrastre; sin reduced motion; `outline: none` en el botón sin estilo de foco alternativo.
11. **Rendimiento.** 100 elementos DOM con transform 3D durante 1,8 s: aceptable en escritorio; vigilar en móvil.
12. **Compatibilidad.** Navegadores modernos (`backdrop-filter`, variables).
13. **Aplicaciones.** "Reserva confirmada" en una barbería/clínica (sin confeti exagerado), "añadir a favoritos", formularios de suscripción.
14. **Pruebas.** Teclado, lector, táctil (arrastre), doble clic rápido, reduced motion, scroll y luego hover (inclinación).
15. **Estado de evidencia.** Artículo + código literal; no ejecutado.
