---
id: FONDO-002
titulo: Fondo de constelación de partículas en canvas 2D — puntos que derivan, líneas entre vecinos cercanos y repulsión suave del cursor; movimiento periódico (bucle exacto), escalado por devicePixelRatio y llamadas agrupadas
categoria: fondos
estado: IMPLEMENTADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (MDN «Basic animations», «Optimizing canvas» y «Window: devicePixelRatio», leídos el 2026-11-28) + DEMO_INSPECCIONADA propia (Kinetic Prompts, background-particles-constellation: validada con Playwright en Chromium)
versiones: Canvas 2D API; Chromium 153 en la prueba
perfil: ambos
ultima_revision: 2026-11-28
---

# FONDO-002 · Constelación de partículas (canvas 2D)

*Ficha añadida desde Kinetic Prompts con permiso del usuario (2026-11-26).*

1. **Nombre y finalidad.** Fondo vivo de nivel intermedio: decenas de puntos que derivan despacio y se unen con líneas finas cuando están cerca, como una red o una constelación. Al pasar el cursor, los puntos cercanos se apartan un poco. Sugiere tecnología, datos y conexión sin vídeo ni librerías.
2. **Fuente original y URL.**
   - MDN, «Basic animations»: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
   - MDN, «Optimizing canvas»: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
   - MDN, «Window: devicePixelRatio»: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
3. **Ubicación.** Basic animations: pasos de cada fotograma y uso de `requestAnimationFrame`. Optimizing canvas: lista de consejos. devicePixelRatio: ejemplo de canvas nítido en pantallas de alta densidad.
4. **Resultado visual.** Puntos de un color sobre un fondo liso; líneas que aparecen y se desvanecen según la distancia; una zona de calma alrededor del cursor.
5. **Explicación técnica.**
   - **Por fotograma** (MDN Basic animations): limpiar o rellenar el lienzo, dibujar y pedir el siguiente con `requestAnimationFrame`, que MDN describe como «a smoother and more efficient way for animating».
   - **Movimiento periódico (adaptación propia):** cada partícula tiene una posición base y una oscilación `sin(2π·k·t/P + φ)` con k entero. Así la posición depende solo de t, el bucle de periodo P cierra exacto y se puede pausar, rebobinar o grabar.
   - **Líneas:** para cada pareja a menos de L px, una línea con opacidad 1 − d/L. Coste O(n²): con 150 puntos, unas 11 000 comprobaciones por fotograma.
   - **Agrupar llamadas** (MDN Optimizing canvas: «Batch canvas calls together»): todos los puntos en un solo `path`; las líneas agrupadas en 4 niveles de opacidad, un `stroke()` por nivel.
   - **Sin transparencia** (MDN: `getContext("2d", { alpha: false })`) cuando el fondo es liso y se pinta en el propio lienzo. **Sin `shadowBlur`** (MDN: «Avoid the shadowBlur property»).
   - **Alta densidad** (MDN devicePixelRatio): `canvas.width = Math.floor(anchoCSS × dpr)` con el tamaño CSS fijado aparte y `ctx.scale(dpr, dpr)`.
6. **Tecnologías y dependencias.** Canvas 2D y JavaScript. Ninguna dependencia.
7. **Procedimiento de implementación.**
   1. Un `<canvas>` a pantalla completa detrás del contenido, con `pointer-events: none` y `aria-hidden="true"`. El cursor se escucha en `window`.
   2. Ajusta su tamaño al contenedor y a `devicePixelRatio`; rehazlo al redimensionar.
   3. Genera las partículas con una semilla fija (mismas posiciones en cada carga).
   4. En cada fotograma: rellena el fondo, calcula las posiciones para t, aplica la repulsión del cursor, dibuja líneas y puntos agrupados.
   5. Para el bucle cuando el lienzo no se ve (IntersectionObserver) y con la pestaña oculta (rAF ya se pausa).
   6. Con `prefers-reduced-motion: reduce`: un fotograma quieto, sin repulsión.
8. **Parámetros configurables.** Color de los puntos y las líneas, color de fondo, número de partículas (20–150), distancia de conexión (60–200 px), tamaño de los puntos (1–4 px), periodo del bucle.
9. **Código.** Ver la demo de Kinetic Prompts `content/animaciones/background-particles-constellation/preview/index.html` (adaptación propia, sin código de terceros).
10. **Problemas habituales.**
    - Lienzo borroso en pantallas retina si no se escala con `devicePixelRatio`.
    - Caída de fotogramas con muchas partículas: el coste de las líneas crece con n²; baja el número en móvil.
    - Un `stroke()` por línea, en vez de agrupar, multiplica las llamadas.
    - El bucle sigue corriendo fuera de pantalla si no se pausa.
11. **Rendimiento y accesibilidad.** Repintado del lienzo en cada fotograma: barato con ≤ 150 puntos, pero no es solo compositor como FONDO-001. Decorativo: `aria-hidden` y nada de información solo en el fondo. Movimiento reducido: quieto.
12. **Compatibilidad.** Canvas 2D, `requestAnimationFrame` e IntersectionObserver en todos los navegadores actuales.
13. **Aplicaciones comerciales.** Startups, empresas de datos o IA, consultoras tecnológicas, eventos.
14. **Pruebas necesarias.** Bucle cerrado al fotograma (t = 0 y t = P); nitidez a DPR 2; reacción al cursor; movimiento reducido quieto; rendimiento a 150 puntos en móvil.
15. **Estado de evidencia.** Las tres páginas de MDN se leyeron el 2026-11-28 a través de un agente de lectura. El movimiento periódico y el agrupado por niveles de opacidad son adaptación propia, implementada y validada en Chromium en la demo de Kinetic Prompts (bucle cerrado al fotograma, nitidez a DPR 2, reacción al cursor). Safari, Firefox y el rendimiento en un móvil real, sin probar.
