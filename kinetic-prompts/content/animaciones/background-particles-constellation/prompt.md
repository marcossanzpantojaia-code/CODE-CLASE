# {{title}}

Fondo animado de nivel intermedio. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Detrás del contenido, {{count}} puntos de color {{color}} sobre un fondo {{base}} derivan despacio y se unen con líneas finas cuando están a menos de {{linkDistance}} px. Las líneas se desvanecen con la distancia. Al pasar el cursor, los puntos cercanos se apartan un poco. Parece una red viva o una constelación.

## 2. Stack

- Canvas 2D y JavaScript, sin dependencias, con `requestAnimationFrame`.

## 3. Estructura

Antes de escribir código, mira el proyecto y decide si el fondo va detrás del hero o de toda la web. Después:

1. Un `<canvas>` a pantalla completa detrás del contenido (`position: fixed` o `absolute`, `inset: 0`, `width` y `height` al 100 %), con `pointer-events: none` y `aria-hidden="true"`.
2. Ajusta el lienzo a la densidad de la pantalla: `canvas.width = Math.floor(anchoCSS × devicePixelRatio)` (igual con el alto), y `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. Rehazlo al redimensionar. Usa `getContext("2d", { alpha: false })`, porque el fondo se pinta en el propio lienzo.
3. Genera las partículas una vez, con una semilla fija: posición base, amplitud de oscilación (del 2 al 8 % de la pantalla), una frecuencia entera (1 o 2) y una fase para cada eje.
<!-- solo: nextjs -->
4. **Next.js:** un componente cliente (`"use client"`) con `useRef` para el canvas y un `useEffect` que arranca el bucle y lo limpia al desmontar (`cancelAnimationFrame`, quitar los listeners, desconectar el IntersectionObserver).
<!-- fin -->
<!-- solo: astro -->
4. **Astro:** un componente con el `<canvas>` y un `<script>` que arranca el bucle; si usas las View Transitions de Astro, vuelve a arrancarlo en `astro:page-load`.
<!-- fin -->
<!-- solo: html -->
4. **HTML:** el `<canvas>` al principio del `<body>` y un script con `defer`.
<!-- fin -->

## 4. Comportamiento paso a paso

En cada fotograma, con t en milisegundos:

1. Rellena el lienzo con {{base}}.
2. Posición de cada punto: base + amplitud × sen(2π × frecuencia × t / 7000 + fase), en x y en y. Así el movimiento es periódico y el bucle cierra exacto cada 7 s.
3. Repulsión del cursor: si un punto está a menos de 140 px del ratón, apártalo hasta 28 px en la dirección contraria, proporcional a lo cerca que esté. Solo con ratón (`pointerType === "mouse"`).
4. Líneas: para cada pareja a menos de {{linkDistance}} px, una línea de 1 px en {{color}} con opacidad 0,55 × (1 − distancia / {{linkDistance}}). Agrúpalas en 4 niveles de opacidad y haz un solo `stroke()` por nivel.
5. Puntos: todos en un solo `path` de círculos de {{dotSize}} px de radio y un único `fill()`.
6. Para el bucle cuando el lienzo no se ve (IntersectionObserver).

## 5. Parámetros configurables

- Color de puntos y líneas: {{color}}.
- Color de fondo: {{base}}.
- Número de partículas: {{count}}.
- Distancia de conexión: {{linkDistance}} px.
- Tamaño de los puntos: {{dotSize}} px.

## 6. Responsive

- Por debajo de 600 px de ancho, usa la mitad de partículas y el 80 % de la distancia de conexión: el coste de las líneas crece con el cuadrado del número de puntos.
- Al redimensionar, rehaz el tamaño del lienzo sin regenerar las partículas (sus posiciones van en proporción a la pantalla).

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, dibuja un solo fotograma quieto y no reacciones al cursor.
- El fondo es decorativo; el contraste del texto con {{base}} tiene que ser de al menos 4,5:1, y las líneas no deben pasar por detrás del texto con más opacidad de la necesaria.

## 8. Rendimiento

- Nada de `shadowBlur` ni de un `stroke()` por línea.
- Un solo bucle `requestAnimationFrame`, que se para cuando el lienzo no se ve.
- Limita el `devicePixelRatio` a 2 para no pintar más píxeles de los que se ven.

## 9. Criterios de validación

- Los puntos derivan, las líneas aparecen y se desvanecen con la distancia, y el bucle cierra sin saltos cada 7 s.
- Se ve nítido en una pantalla retina.
- Los puntos se apartan del cursor y no tapan ni bloquean el contenido.
- En móvil va fluido con la mitad de puntos.
- Con movimiento reducido queda quieto, y la consola no muestra errores.
