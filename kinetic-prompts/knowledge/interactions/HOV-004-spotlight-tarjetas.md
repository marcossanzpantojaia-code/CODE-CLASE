---
id: HOV-004
titulo: Tarjetas con foco de luz que sigue al cursor y borde iluminado (estilo Linear)
categoria: interactions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (código literal, CodePen Hyperplexed/MWQeYLW, pen público MIT)
versiones: CSS + JS vanilla (2022)
perfil: ambos (muy apto para comercial)
ultima_revision: 2026-10-26
---

# HOV-004 · Spotlight cards

1. **Nombre y finalidad.** Rejilla de tarjetas oscuras donde un halo radial sigue al ratón **sobre todas las tarjetas a la vez** e ilumina sus bordes (tema 10). Recreación del efecto de linear.app/features.
2. **Fuente.** Hyperplexed, "Magical Hover Effect (w/ Tutorial)", https://codepen.io/Hyperplexed/pen/MWQeYLW (2022-05-10). Identidad: el perfil de CodePen enlaza youtube.com/@hyperplexed y hyperplexed.io. El vídeo tutorial asociado **no se ha visto**.
3. **Ubicación.** CSS `.card::before`, `.card::after`, `.card > .card-content`; JS: un único `onmousemove` en `#cards`.
4. **Resultado (descrito desde el código, no observado).** Al entrar el cursor en la rejilla, todas las tarjetas muestran un brillo tenue en el borde orientado hacia el cursor; la tarjeta bajo el cursor muestra además un halo suave en su interior.
5. **Explicación técnica [COD].**
   - Cada tarjeta tiene fondo `rgba(255,255,255,0.1)` y un hijo `.card-content` con `position: absolute; inset: 1px` y fondo opaco → **el "borde" de 1 px es el fondo de la tarjeta que asoma alrededor del contenido**.
   - `::after` (z-index 1, **debajo** del contenido): gradiente radial de 600 px centrado en `var(--mouse-x) var(--mouse-y)`, blanco 0,4 → transparente al 40 %. Solo se ve en el borde de 1 px → **borde iluminado**. Se activa con `#cards:hover > .card::after { opacity: 1 }` (todas las tarjetas).
   - `::before` (z-index 3, **encima** del contenido): gradiente de 800 px, blanco 0,06 → **halo interior**, solo en `.card:hover`.
   - JS: en cada `mousemove` sobre el contenedor, para **cada** tarjeta calcula la posición del cursor relativa a ella y la escribe en `--mouse-x/--mouse-y` → el foco se extiende de forma coherente a las tarjetas vecinas.
   - Transición de opacidad 500 ms.
6. **Dependencias.** Ninguna.
7. **Procedimiento para Claude Code.** Reproducir la estructura de 3 capas; agrupar las escrituras en `requestAnimationFrame` (un solo cálculo por frame); usar `pointermove`; activar solo con `(hover: hover)`; las tarjetas deben ser enlaces/botones reales con `:focus-visible` propio (el efecto no aporta nada con teclado).
8. **Parámetros.** Radio del borde (600 px), radio del halo (800 px), opacidades 0,4 y 0,06, extensión 40 %, borde 1 px (`inset`), transición 500 ms.
9. **Código (fragmento mínimo, MIT, © Hyperplexed):**
   ```js
   cards.onmousemove = e => { for (const card of cardEls) { const r = card.getBoundingClientRect();
     card.style.setProperty("--mouse-x", `${e.clientX - r.left}px`); card.style.setProperty("--mouse-y", `${e.clientY - r.top}px`); } };
   ```
10. **Limitaciones.** `getBoundingClientRect()` de todas las tarjetas en cada evento (coste lineal con el nº de tarjetas; para muchas, cachear rectángulos y recalcular en resize/scroll); depende de Font Awesome Pro (iconos `fa-duotone`) en la demo; sin efecto en táctil.
11. **Rendimiento / a11y.** Pintado de gradientes grandes: barato en pocas tarjetas; decorativo; contraste del texto no depende del efecto.
12. **Compatibilidad.** Custom properties y gradientes radiales: universal.
13. **Aplicaciones.** Rejillas de servicios, características de producto SaaS, precios.
14. **Pruebas.** 6–24 tarjetas (FPS), salida del cursor, teclado, táctil, modo claro (el efecto está pensado para fondo oscuro).
15. **Estado de evidencia.** Código literal leído; demo y vídeo no vistos.
