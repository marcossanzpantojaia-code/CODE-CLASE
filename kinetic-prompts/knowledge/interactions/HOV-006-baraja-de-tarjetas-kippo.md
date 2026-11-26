---
id: HOV-006
titulo: Grupo de tarjetas que se abre en abanico al pasar el ratón + carrusel por estados (Kippo Hover Card)
categoria: interactions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (CodePen de Hyperplexed, MIT) (TUT-022)
versiones: HTML + CSS + JS vanilla (sin librerías)
perfil: ambos
ultima_revision: 2026-10-26
---

# HOV-006 · Kippo Hover Card Effect (Hyperplexed)

1. **Nombre y finalidad.** Un montón de fotos apiladas que, al pasar el ratón, se despliegan en abanico mientras unas miniaturas salen volando a las esquinas; dos botones (✕ / ♥) cambian de grupo con una salida lateral y una entrada escalada (temas 2 y 10).
2. **Fuente.** https://codepen.io/Hyperplexed/pen/zYWdYoo (MIT; código leído literal el 2026-10-26). Inspiración citada por el autor: kippo.com/chill. Vídeo enlazado en el pen: https://youtu.be/6TYkDy54q4E (**no visto**).
3. **Ubicación.** CSS (estados por `data-status` y `:hover`) y ~35 líneas de JS.
4. **Resultado (según código).** 4 cartas grandes + 4 pequeñas por grupo, 30vmin de ancho, proporción 5/7.
5. **Explicación técnica [COD].**
   - **Abanico solo con CSS:** reposo con desplazamientos y giros mínimos (−1°, 2°, −3°, 5°) para que parezca un mazo real. En `.card-group:hover`, las grandes van a `translate(−75%,16%) rotate(−24deg)`, `(−25%,8%) −8°`, `(25%,8%) 8°`, `(75%,16%) 24°` (simétrico); las pequeñas a esquinas con ±15°. `transition: transform 800ms cubic-bezier(.05,.43,.25,.95)` (salida muy rápida y frenada larga) y sombra más profunda en hover.
   - **Carrusel como máquina de estados en `data-status`:** `active`, `before`, `after` (fuera con `translateX(±50%) scale(0)`), `unknown` (`scale(0)`, sin transición) y dos estados puente `becoming-active-from-before/after` con `transition: none`.
   - **Truco del estado puente:** al pulsar, el grupo actual pasa a `after` (sale animado) y el siguiente se **teletransporta** al lado contrario con `becoming-active-…` (sin transición); en un `setTimeout(…, 0)` pasa a `active` y anima desde ahí. `active` lleva `transition-delay: 300ms` para esperar a que el saliente desaparezca.
   - Contenedores con `aspect-ratio` y unidades `vmin` → todo escala con la ventana.
6. **Dependencias.** Ninguna (Font Awesome solo para iconos).
7. **Procedimiento profesional (adaptación).**
   1. Activar el abanico también con `:focus-within` y con un botón en táctil (en móvil no hay hover).
   2. Forzar el estilo antes de cambiar de estado: `el.offsetWidth` o doble `requestAnimationFrame` en lugar de `setTimeout(0)` (el navegador puede agrupar ambos cambios de estilo y saltarse la transición) [EST: no reproducido].
   3. Imágenes como `<img alt>` (o `background-image` solo si son decorativas).
   4. Botones de solo icono con `aria-label` ("Siguiente grupo").
   5. Reduced motion: sin abanico; cambio por fundido.
8. **Parámetros.** 800 ms, `cubic-bezier(.05,.43,.25,.95)`; grupos 400 ms `ease`; retardo 300 ms; ángulos ±8/±24°.
9. **Código (MIT, fragmento mínimo):**
   ```js
   currentGroup.dataset.status = "after";
   nextGroup.dataset.status = "becoming-active-from-before"; // sin transición
   setTimeout(() => { nextGroup.dataset.status = "active"; activeIndex = nextIndex; });
   ```
10. **Problemas detectados [COD].** `onclick` inline en el HTML; botones sin nombre accesible; hover-only; sin reduced motion; imágenes de Unsplash como fondos sin texto alternativo.
11. **Rendimiento / a11y.** Solo `transform` (compositor) + `box-shadow` animado vía cambio de estado (la sombra repinta; aceptable con 8 elementos).
12. **Compatibilidad.** Universal (`aspect-ratio` en todos los navegadores modernos).
13. **Aplicaciones.** Galería de cortes/peinados de una barbería ("antes/después"), equipo de una clínica, casos de un despacho; portfolio de fotografía.
14. **Pruebas.** Pulsar ✕/♥ muy rápido (estados que se pisan); teclado; táctil; reduced motion.
15. **Estado de evidencia.** Código literal leído; no ejecutado ni medido (panel oculto). Vídeo no visto.
