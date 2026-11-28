# {{title}}

Transición de objetos de nivel básico. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

En una sección de la web, junto a un titular y una lista de opciones (colecciones, servicios o planes), una forma grande de color {{color}} sobre un fondo {{background}} se transforma en bucle de una figura a otra: círculo, flor de seis pétalos, cuadrado de esquinas muy redondeadas y sol de doce puntas. Cada cambio dura {{duration}} s, gira {{rotate}}° y deja la figura quieta {{hold}} s antes del siguiente. Un contorno del mismo color, un poco más grande y semitransparente, sigue a la forma con un pequeño retraso. Al pulsar una opción de la lista, la forma se transforma en la suya. El cambio tiene que verse blando, como arcilla, sin que el contorno se retuerza ni se cruce.

## 2. Stack

- JavaScript sin dependencias y un `<svg>` con dos `<path>`. Cada fotograma se recalcula el atributo `d`.
- Si las figuras vienen de un programa de diseño (un logo, iconos) y no se pueden describir con una fórmula, usa MorphSVG de GSAP (gratuito): `gsap.to(path, { morphSVG: "#destino" })` iguala los puntos por ti. Si el proyecto no usa GSAP, no lo instales solo para formas que se pueden generar como aquí.

## 3. Estructura

Antes de escribir código, mira el proyecto y elige la sección (un hero o una sección de colecciones o servicios). Después:

1. Dos columnas en escritorio: a la izquierda el texto (antetítulo, titular y la lista de opciones como botones); a la derecha, la forma en un contenedor cuadrado (`aspect-ratio: 1`) con un `<svg viewBox="-100 -100 200 200" aria-hidden="true">`.
2. Dentro del SVG, primero el contorno (`fill: none`, trazo de {{color}} con opacidad 0,45) y después la forma rellena de {{color}}.
3. Junto a la lista, un botón «Pausar» que pasa a «Seguir».
4. Las figuras se describen como un radio por ángulo, de 0 a 1, todas con los mismos 120 ángulos:
   - Círculo: `r(θ) = 1`.
   - Flor: `r(θ) = 0,8 + 0,2 · cos(6θ)`.
   - Cuadrado redondeado: `r(θ) = (|cos θ|⁴ + |sin θ|⁴)^(−1/4)`, dividido entre su máximo (2^(1/4)).
   - Sol: `r(θ) = 0,86 + 0,14 · cos(12θ)`.
5. Una función convierte los 120 radios y un ángulo de giro en un trazado cerrado y suave: los puntos en coordenadas (con radio máximo 78 en el `viewBox`) y una curva Catmull-Rom pasada a Bézier cúbica. Así el trazado tiene siempre la misma estructura: un `M`, 120 `C` y `Z`.
<!-- solo: nextjs -->
6. **Next.js:** un componente de cliente (`"use client"`) con el SVG y la lógica en un `useEffect` que se limpia al desmontar (cancela el `requestAnimationFrame` y el observador). El texto y la lista pueden venir del componente de servidor que lo contiene.
<!-- fin -->
<!-- solo: astro -->
6. **Astro:** un componente `.astro` con el marcado y un `<script>` que busca el SVG y arranca la animación.
<!-- fin -->
<!-- solo: html -->
6. **HTML:** el marcado en su sección y un `<script type="module">` al final del `<body>`.
<!-- fin -->

## 4. Comportamiento paso a paso

1. Calcula una vez los 120 radios de cada figura. Mezclar dos figuras es mezclar sus radios punto a punto: como comparten los ángulos, el contorno no se retuerce.
2. Bucle: para cada figura k, quieta {{hold}} s y después cambio a la figura k + 1 durante {{duration}} s con una curva de entrada y salida (ease-in-out cúbica). El giro acumulado es `(k + p) · {{rotate}}°`, con p el progreso del cambio. El bucle completo dura 4 × ({{hold}} + {{duration}}) s y cierra en el círculo, donde el giro no se nota.
3. El contorno usa el mismo cálculo con un retraso del 14 % de la duración y un radio un 8 % mayor.
4. Un solo reloj (un `requestAnimationFrame` que lee el tiempo transcurrido) pinta la forma y el contorno en el mismo fotograma.
5. La opción de la figura que se ve queda resaltada; la siguiente se enciende en cuanto la forma sale hacia ella.
6. Al pulsar una opción: el bucle se para y la forma pasa desde lo que se ve en ese momento a la figura elegida en 0,45 s (es una respuesta a la persona: más de medio segundo ya se nota lento). Esa opción queda con `aria-pressed="true"` y el botón de pausa pasa a «Seguir», que retoma el bucle desde esa figura.
7. «Pausar» congela el bucle donde esté; «Seguir» lo reanuda.

## 5. Parámetros configurables

- Color de la forma: {{color}}.
- Color de fondo: {{background}}. El texto va en tinta oscura o en crema, el que más contraste tenga con el fondo.
- Duración de cada cambio en el bucle: {{duration}} s.
- Pausa en cada figura: {{hold}} s.
- Giro en cada cambio: {{rotate}}°.

Guárdalos en un objeto de configuración y los colores como variables CSS de la sección.

## 6. Responsive

- Por debajo de 700 px, una sola columna: la forma arriba (hasta el 46 % de la altura de la pantalla) y el texto con la lista debajo. La lista de opciones pasa a varias líneas si no cabe.
- La forma escala con su contenedor (el `viewBox` hace el resto); el grosor del trazo del contorno escala con ella.

## 7. Accesibilidad

- El SVG es decorativo (`aria-hidden="true"`): el nombre de cada figura lo dicen los botones de la lista.
- El bucle dura más de 5 s junto a otro contenido: necesita el botón «Pausar» visible (WCAG 2.2.2). Pausar solo con el ratón encima no cuenta.
- Al pulsar una opción, anuncia la elegida en una región `aria-live="polite"`. El bucle no anuncia nada ni mueve el foco.
- Con `prefers-reduced-motion: reduce`, sin bucle ni transformación: la figura cambia de golpe con un fundido de opacidad de 200 ms y el botón de pausa se oculta.
- Contraste del texto de al menos 4,5:1 sobre {{background}}.

## 8. Rendimiento

- Recalcular el atributo `d` repinta el SVG en cada fotograma: mantén una sola forma y su contorno, 120 puntos y dos decimales. No apliques filtros ni sombras al SVG.
- Para el bucle cuando la sección no se ve (`IntersectionObserver`) y cuando la pestaña está oculta.
- Calcula las figuras una sola vez y reutiliza los arrays en cada fotograma.

## 9. Criterios de validación

- La forma pasa por las cuatro figuras y el bucle cierra sin salto en el círculo.
- En ningún momento el contorno se retuerce, se cruza ni salta entre dos fotogramas seguidos.
- Al pulsar una opción, la forma llega a su figura en menos de medio segundo y la opción queda marcada; «Seguir» retoma el bucle.
- «Pausar» congela el bucle y, con movimiento reducido, no hay transformación.
- A 375 y a 1440 px no hay desbordes y la consola no muestra errores.
