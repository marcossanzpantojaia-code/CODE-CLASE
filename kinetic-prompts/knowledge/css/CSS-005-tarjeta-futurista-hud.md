---
id: CSS-005
titulo: Tarjeta "futurista" tipo HUD con capas CSS (scanlines, encuadres a saltos, tinte, texto que se descifra)
categoria: css
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (CodePen de Hyperplexed, MIT) (TUT-022)
versiones: CSS moderno (`translate`/`scale`/`rotate` individuales, `rgb(r g b / a)`), JS vanilla
perfil: cinematografico
ultima_revision: 2026-10-26
---

# CSS-005 · Futuristic Card Effect (Hyperplexed)

1. **Nombre y finalidad.** Tarjeta de perfil con estética de pantalla de ciencia ficción: líneas de barrido que se desplazan, foto teñida que cambia de encuadre a saltos, marcos y adornos con pseudo-elementos y un nombre que "se descifra" al pasar el ratón (temas 6 y 11).
2. **Fuente.** https://codepen.io/Hyperplexed/pen/vYzgeYE (MIT; leído literal 2026-10-26). Inspiración citada: sprite.com/zerolimits. Vídeos enlazados en el pen: tarjeta https://youtu.be/jMVhxBB3l0w, blob https://youtu.be/kySGqoU7X-s, texto https://youtu.be/W5oawMJaXbU (**ninguno visto**).
3. **Ubicación.** CSS (~250 líneas) + JS del efecto de texto (~25 líneas).
4. **Resultado (según código).** Tarjeta 500 px, proporción 10/16, borde azul, fondo azul al 15 %, "muescas" blancas arriba/abajo.
5. **Explicación técnica [COD].**
   - **Paleta en canales:** `--primary-rgb: 33 150 243` y uso `rgb(var(--primary-rgb) / 15%)` → una sola variable para todas las opacidades.
   - **Scanlines:** `linear-gradient(color 0 3px, transparent 3px 9px)` con `background-size: 100% 9px` (línea de 3 px cada 9 px) y `@keyframes` que mueve `background-position` de 0 a −100 % en 22 s lineal infinito.
   - **Encuadres a saltos (Ken Burns cortado):** keyframes con paradas duplicadas `20%` / `20.0001%`: dentro de cada tramo la imagen se desplaza despacio; en la parada siguiente cambia de golpe de posición y de `background-size` (200–500 %) → 5 "planos" en 15 s, como un montaje.
   - **Tinte monocromo:** `filter: sepia(100%) hue-rotate(160deg)` + `opacity: .6` (convierte cualquier foto al azul de la marca sin editarla).
   - **Decoración sin HTML extra:** `::before/::after` para muescas, barras luminosas (`box-shadow` con el color primario) y cuadraditos junto al nombre.
   - **Texto que se descifra:** al `mouseenter`, cada 30 ms se reemplaza cada letra por una aleatoria salvo las primeras `iteration` letras; `iteration += 1/3` → [CALC] cada letra se fija tras 3 ticks (~90 ms); "CODEPEN" (7 letras) termina en ~21 ticks ≈ 630 ms. Mismo algoritmo que TXT-003.
   - **Fondo ambiental:** capa `backdrop-filter: blur(12vmax)` sobre un "blob" en degradado (el blob está comentado en esta versión).
6. **Dependencias.** Ninguna (Font Awesome y Google Fonts para iconos/tipos).
7. **Procedimiento profesional (adaptación).**
   1. Animaciones infinitas → botón de pausa o detenerlas tras unos segundos (WCAG 2.2.2) y desactivarlas con reduced motion.
   2. `background-position` animado repinta cada frame: preferir un pseudo-elemento con las líneas y animar `transform: translateY` (compositor).
   3. Texto descifrado: guardar el texto real en `aria-label` del contenedor y animar un `span aria-hidden` (si no, el lector lee letras aleatorias).
   4. Sustituir el `scale: 0.6` de móvil por tamaños fluidos (`clamp`, container queries — CSS-004).
8. **Parámetros.** Líneas 3/9 px, 22 s; ciclo de encuadres 15 s, 5 planos; tinte hue-rotate 160°; descifrado 30 ms, 1/3 letra por tick.
9. **Código (MIT, fragmento mínimo):**
   ```css
   .screen-overlay { background: linear-gradient(rgb(var(--primary-rgb) / .15), rgb(var(--primary-rgb) / .15) 3px, transparent 3px, transparent 9px);
     background-size: 100% 9px; animation: pan-overlay 22s infinite linear; }
   ```
10. **Problemas detectados [COD].** `innerText` modificado en bucle (el lector anuncia basura); sin reduced motion; `overflow: hidden` en `body`; imagen de 2574 px para una tarjeta de 500 px (pedir el tamaño adecuado).
11. **Rendimiento / a11y.** `backdrop-filter` a pantalla completa con radio enorme es caro en GPUs modestas; limitar el área. Contraste del enlace blanco sobre azul translúcido: verificar con la foto real detrás.
12. **Compatibilidad.** `translate/scale/rotate` individuales y `rgb()` con barra: navegadores modernos.
13. **Aplicaciones.** Tarjeta de equipo en una web tecnológica, *gaming*, eventos; no encaja en clínica/despacho.
14. **Pruebas.** Lector de pantalla con el efecto de texto; GPU integrada (backdrop-filter); reduced motion.
15. **Estado de evidencia.** Código literal leído; no ejecutado ni medido.
