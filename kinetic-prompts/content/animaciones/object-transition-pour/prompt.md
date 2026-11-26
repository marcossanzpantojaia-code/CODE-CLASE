# {{title}}

Transición de objeto de nivel avanzado. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Al bajar por la página, un objeto (en el ejemplo, una jarra) llega en arco a su sitio, se inclina {{tilt}}° y vierte un chorro de color {{streamColor}} que cruza el cambio de sección hasta otro objeto (una taza). Mientras tanto sube la segunda sección, de color {{panelColor}}, y el titular cambia línea a línea. El objeto no sale nunca del encuadre: es el hilo que une las dos secciones.

## 2. Stack

- JavaScript sin dependencias: un escenario `position: sticky` y una función que pinta cada estado según el progreso del scroll, en `requestAnimationFrame`.
- Si el proyecto ya usa GSAP, una timeline con ScrollTrigger (`pin`, `scrub`) hace lo mismo; no lo instales solo para esto.
- Los objetos pueden ser SVG o imágenes con fondo transparente.

## 3. Estructura

Antes de escribir código, mira el proyecto y elige dónde va la escena (normalmente entre la portada y la siguiente sección). Después:

1. Una sección de {{distance}} % de la altura de la pantalla más una pantalla. Dentro, un escenario `sticky` de 100 vh con `overflow: hidden` e `isolation: isolate`.
2. Capas del escenario, de atrás adelante: el fondo de la primera sección; el panel de la segunda sección, de color {{panelColor}}, fuera por abajo con `transform: translateY(100%)`; los dos titulares, cada línea dentro de una máscara con `overflow: hidden`; los dos objetos; y un SVG a pantalla completa con el trazo del chorro.
3. Marca dos puntos: el pico del objeto que vierte y la boca del que recibe (dos elementos pequeños dentro de sus SVG). El chorro se calcula entre ellos.
<!-- solo: nextjs -->
4. **Next.js:** un componente cliente (`"use client"`) con `useRef` para cada capa y un `useEffect` que arranca el bucle y lo limpia al desmontar (`cancelAnimationFrame` y quitar los listeners). Si usas GSAP, `useGSAP`.
<!-- fin -->
<!-- solo: astro -->
4. **Astro:** un componente con el marcado y un `<script>` que arranca el bucle; con View Transitions de Astro, vuelve a arrancarlo en `astro:page-load`.
<!-- fin -->
<!-- solo: html -->
4. **HTML:** el marcado en la página y un script con `defer` que arranca el bucle.
<!-- fin -->

## 4. Comportamiento paso a paso

El progreso p va de 0 a 1 a lo largo del recorrido de scroll. Cada tramo usa un suavizado de entrada y salida:

1. **p 0 → 0,5:** el objeto llega en arco desde la derecha hasta su posición de vertido. Nada de línea recta a velocidad constante.
2. **p 0,3 → 0,55:** el objeto que recibe entra por abajo hasta su sitio.
3. **p 0,5 → 0,6:** anticipación de 3° y después inclinación hasta {{tilt}}°. **Meseta** inclinado hasta p 0,85.
4. **p 0,6 → 0,66:** el chorro se dibuja desde el pico hacia abajo (`stroke-dasharray` y `stroke-dashoffset` con la longitud del trazo).
5. **p 0,6 → 0,8:** sube el panel de la segunda sección. El primer titular sale línea a línea entre p 0,6 y 0,7 y el segundo entra entre p 0,7 y 0,8, con 0,02 de escalonado entre líneas.
6. **p 0,85 → 1:** el objeto se endereza a un tercio de la inclinación y el chorro se corta **desde el pico hacia abajo** (cortarlo desde abajo parece rebobinar).
7. En cada fotograma, mueve primero los objetos y después calcula el chorro entre el pico y la boca, para que no se despegue.
8. Al subir, todo vuelve exactamente igual (es reversible).

## 5. Parámetros configurables

- Color del chorro: {{streamColor}}.
- Color de la segunda sección: {{panelColor}}.
- Inclinación al verter: {{tilt}}°.
- Recorrido de scroll: {{distance}} % de la altura de la pantalla.

## 6. Responsive

- Por debajo de 600 px, los objetos ocupan más ancho (alrededor del 42 %), van más abajo y a los lados del titular, para no taparlo.
- El tamaño de los objetos sale del menor entre el ancho y el alto disponibles; recalcula al redimensionar.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, sin viaje ni chorro animado: las dos secciones se muestran fijas y completas, una detrás de otra.
- Los titulares son texto real. El segundo, mientras está oculto, lleva `aria-hidden`, y los objetos son decorativos (`aria-hidden="true"`).
- La escena no captura el scroll: se baja con normalidad y se puede saltar con el teclado.

## 8. Rendimiento

- Mueve los objetos, el panel y las líneas solo con `transform`. El chorro es un trazo SVG que se redibuja en cada fotograma: mantenlo en un solo `path`.
- Un solo bucle `requestAnimationFrame` y nada de cálculos de layout fuera de él. Lee las posiciones del pico y la boca una vez por fotograma.

## 9. Criterios de validación

- Al bajar, el objeto llega, se inclina {{tilt}}°, vierte y se endereza; el chorro sale siempre del pico y llega a la boca.
- Es reversible: al subir, cada punto del recorrido se ve igual que al bajar.
- Los titulares se leen en sus mesetas y nunca hay dos a medias en el mismo sitio.
- A 375 px los objetos no tapan el titular.
- Con movimiento reducido se ven las dos secciones fijas, y la consola no muestra errores.
