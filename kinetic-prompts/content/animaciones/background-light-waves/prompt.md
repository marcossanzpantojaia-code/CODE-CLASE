# {{title}}

Fondo animado de nivel avanzado. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Detrás del contenido, una superficie de color que ondula como agua o seda: olas suaves que se cruzan y se deforman entre {{base}} y {{color1}}, con brillos de {{color2}} que corren por las crestas. Se calcula entero en la tarjeta gráfica, sin vídeo ni imágenes. Una zona más tranquila deja leer el texto.

## 2. Stack

- WebGL 1.0 y un shader de fragmentos en GLSL ES 1.00, sin librerías (no hace falta three.js para esto).
- Respaldo en CSS para los navegadores sin WebGL.

## 3. Estructura

Antes de escribir código, mira el proyecto y decide si el fondo va detrás del hero o de toda la web. Después:

1. Un contenedor a pantalla completa detrás del contenido, con `pointer-events: none` y `aria-hidden="true"`. Lleva como respaldo un fondo CSS con los mismos colores (dos degradados radiales sobre {{base}}). Dentro, un `<canvas>` al 100 %.
2. `canvas.getContext("webgl", { antialias: false })`. Si devuelve `null`, no hagas nada más: se queda el respaldo. No uses `alpha: false`, que en WebGL es caro.
3. Un cuadrado a pantalla completa: un búfer con 4 vértices (−1,−1 · 1,−1 · −1,1 · 1,1) dibujado con `drawArrays(TRIANGLE_STRIP, 0, 4)`.
4. Compila los shaders y comprueba solo `LINK_STATUS` del programa; si falla, muestra el registro y quédate con el respaldo.
<!-- solo: nextjs -->
5. **Next.js:** un componente cliente (`"use client"`) con `useRef` para el canvas; el `useEffect` crea el contexto, arranca el bucle y, al desmontar, cancela el `requestAnimationFrame`, quita los listeners y libera el programa y el búfer.
<!-- fin -->
<!-- solo: astro -->
5. **Astro:** un componente con el marcado y un `<script>` que arranca todo; con las View Transitions de Astro, vuelve a arrancarlo en `astro:page-load`.
<!-- fin -->
<!-- solo: html -->
5. **HTML:** el marcado al principio del `<body>` y un script con `defer`.
<!-- fin -->

## 4. Comportamiento paso a paso

1. Precisión del fragment shader: `#ifdef GL_FRAGMENT_PRECISION_HIGH` → `precision highp float;`, si no → `mediump`.
2. Coordenadas: centra `gl_FragCoord` y divídelas por el alto, multiplicadas por 2,2 × {{scale}}.
3. Tiempo: una fase φ que va de 0 a 2π cada 7 s. Úsala solo multiplicada por enteros (φ y 2φ), y así el bucle cierra sin saltos.
4. Distorsión de dominio con senos encadenados: q.x += 0,6·sen(q.y·1,3 + φ); q.y += 0,5·sen(q.x·1,7 − 2φ + 1,3). Después, dos ondas w y v (senos de q que también llevan φ), entre 0 y 1.
5. Color: `mix({{base}}, {{color1}}, smoothstep(0,15, 0,95, 0,6·w + 0,4·v))`. Brillos: mezcla hacia {{color2}} con `pow(smoothstep(0,5, 1,0, w·v), 2) × {{intensity}}`.
6. Zona tranquila: cerca de donde va el texto, acerca el color a {{base}} (hasta un 70 %).
7. Pinta el búfer al 60 % del tamaño en pantalla y nunca a más de 400 000 píxeles: escala = mín(0,6; √(400 000 / (anchoCSS × altoCSS))), y `canvas.width = round(anchoCSS × escala)` (el tamaño CSS se queda al 100 %). Un patrón suave no pierde calidad y en una pantalla 4K evitas pintar 3 millones de píxeles por fotograma.
8. Para el bucle cuando el lienzo no se ve (IntersectionObserver). En el bucle, nada de llamadas bloqueantes como `getError`.
9. Pérdida de contexto: en `webglcontextlost`, `preventDefault()` y para; en `webglcontextrestored`, rehaz shaders, programa y búfer.

## 5. Parámetros configurables

- Color de fondo: {{base}}.
- Color del agua: {{color1}}.
- Color de los brillos: {{color2}}.
- Tamaño de las olas: {{scale}} ×.
- Intensidad de los brillos: {{intensity}} (de 0 a 1).

Pásalos al shader como uniformes, con los colores en RGB de 0 a 1.

## 6. Responsive

- Funciona en todos los anchos: las coordenadas van divididas por el alto, así que las olas no se estiran. En móvil, baja el búfer al 50 %.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, dibuja un fotograma quieto (φ = 0).
- El contraste del texto en la zona tranquila tiene que ser de al menos 4,5:1. El fondo es decorativo.

## 8. Rendimiento

- Todo el trabajo va en un fragment shader corto: nada de bucles largos ni texturas grandes.
- Búfer al 60 % con tope de 400 000 píxeles, pausa fuera de pantalla y una sola llamada de dibujo por fotograma.

## 9. Criterios de validación

- Las olas se mueven con suavidad, con brillos en las crestas, y el bucle cierra sin saltos cada 7 s.
- Sin WebGL (desactívalo en el navegador) se ve el respaldo en CSS, sin errores.
- Si se pierde el contexto (extensión `WEBGL_lose_context`), el fondo vuelve a pintarse al recuperarlo.
- El texto se lee bien en la zona tranquila, a 375 y a 1440 px.
- Con movimiento reducido queda quieto, y la consola no muestra errores ni avisos.
