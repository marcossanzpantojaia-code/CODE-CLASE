# {{title}}

Fondo animado de nivel básico. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Detrás del contenido (un hero o la web entera), tres manchas de color grandes y difusas, en {{color1}}, {{color2}} y {{color3}}, flotan despacio sobre un fondo {{base}} y se mezclan entre sí. Parece luz de colores difuminada que respira. Es sutil: el texto se tiene que seguir leyendo sin esfuerzo.

## 2. Stack

- Solo CSS: `radial-gradient`, `@keyframes` y `transform`. Sin JavaScript ni dependencias.

## 3. Estructura

Antes de escribir código, mira el proyecto y decide si el fondo va solo detrás del hero o detrás de toda la web. Después:

1. Un contenedor del fondo con `position: absolute; inset: 0` dentro del hero (o `position: fixed; inset: 0` para toda la web), `overflow: hidden`, `z-index` por debajo del contenido, `pointer-events: none` y `aria-hidden="true"`. Su fondo es {{base}}.
2. Dentro, tres manchas: bloques cuadrados de {{size}} % del lado mayor de la pantalla (`vmax`), redondos y con `background: radial-gradient(circle at center, <color> 0%, transparent 70%)`. El difuminado ya está en el degradado.
3. Coloca cada mancha en una esquina distinta y parcialmente fuera de la pantalla.
<!-- solo: nextjs -->
4. **Next.js:** un componente de servidor con el marcado y los estilos en un CSS Module o en los estilos globales. No necesita `"use client"`.
<!-- fin -->
<!-- solo: astro -->
4. **Astro:** un componente `.astro` con el marcado y un `<style>` dentro.
<!-- fin -->
<!-- solo: html -->
4. **HTML:** el marcado al principio del `<body>` y los estilos en tu CSS.
<!-- fin -->

## 4. Comportamiento paso a paso

1. Cada mancha tiene su propio `@keyframes` (o uno común con variables CSS) que la lleva de su posición a otra con `translate` (entre el 20 y el 40 % de la pantalla) y una escala entre 0,9 y 1,2.
2. `animation: {{duration}}s ease-in-out infinite alternate`: va y vuelve, y el bucle completo dura el doble.
3. La misma duración para las tres, con retardos negativos distintos (0, −50 % y −100 % de la duración). Así no se mueven a la vez y el bucle sigue cerrando sin saltos.
4. Opacidad de las manchas alrededor de 0,75 para que se mezclen con el fondo.

## 5. Parámetros configurables

- Colores de las manchas: {{color1}}, {{color2}} y {{color3}}.
- Color de fondo: {{base}}.
- Duración de cada recorrido: {{duration}} s.
- Tamaño de las manchas: {{size}} % del lado mayor de la pantalla.

Guárdalos como variables CSS (`--fondo-color-1`, …) en el contenedor.

## 6. Responsive

- Al usar `vmax`, las manchas escalan solas con la pantalla. En móvil, si tapan demasiado, baja el tamaño un 20 % con una media query `(max-width: 600px)`.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, sin animación: las manchas quietas en su posición de partida.
- Contraste del texto de al menos 4,5:1 también cuando la mancha más clara pasa por detrás. Si no llega, oscurece los colores o pon un velo debajo del texto.
- El fondo es decorativo: no transmite información.

## 8. Rendimiento

- Anima solo `transform` y `opacity`. Nada de `filter: blur()`, de animar el degradado ni de animar `background-position`.
- `will-change: transform` en las tres manchas y en nada más.

## 9. Criterios de validación

- Las tres manchas se mueven despacio y se mezclan, y el bucle cierra sin saltos cada {{duration}} s × 2.
- En las herramientas de rendimiento del navegador no aparece pintura en cada fotograma (solo composición).
- El texto se lee en todo momento, a 375 y a 1440 px.
- Con movimiento reducido el fondo queda quieto, y la consola no muestra errores.
