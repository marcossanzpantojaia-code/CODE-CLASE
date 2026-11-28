---
id: FONDO-003
titulo: Fondo de olas de luz con un shader de fragmentos en WebGL puro — distorsión de dominio periódica (bucle exacto), resolución reducida, precisión condicional, pérdida de contexto y respaldo en CSS
categoria: fondos
estado: IMPLEMENTADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (MDN «WebGL best practices» —parte final leída como resumen— y «Adding 2D content to a WebGL context», leídos el 2026-11-28) + DEMO_INSPECCIONADA propia (Kinetic Prompts, background-light-waves: validada con Playwright en Chromium con SwiftShader)
versiones: WebGL 1.0 (GLSL ES 1.00); Chromium 153 en la prueba
perfil: cinematografico (y hero de webs comerciales premium)
ultima_revision: 2026-11-28
---

# FONDO-003 · Olas de luz (shader WebGL)

*Ficha añadida desde Kinetic Prompts con permiso del usuario (2026-11-26). Relacionadas, no leídas en esta sesión: TSL-003 (superficie procedural en TSL) y GL-004 (imagen ondulada con el scroll), las dos con three.js.*

1. **Nombre y finalidad.** Fondo de nivel avanzado: una superficie de color que ondula como agua o seda, con brillos que corren por las crestas. Se calcula entero en la GPU, sin vídeo ni imágenes, y sin librerías (unos pocos KB frente a three.js).
2. **Fuente original y URL.**
   - MDN, «WebGL best practices»: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
   - MDN, «Adding 2D content to a WebGL context»: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
3. **Ubicación.** Best practices: pérdida de contexto, tamaño del búfer, precisión, compilación y enlazado, llamadas bloqueantes y `alpha: false`. Tutorial: shaders, programa, búfer de posiciones y `drawArrays(gl.TRIANGLE_STRIP, 0, 4)`.
4. **Resultado visual.** Ondas suaves que se cruzan y se deforman entre el color base y el del agua, con brillos del tercer color en las crestas. Tiene una zona más tranquila para que el texto se lea.
5. **Explicación técnica.**
   - **Un cuadrado a pantalla completa** (4 vértices, `TRIANGLE_STRIP`). Todo el trabajo va en el fragment shader.
   - **Patrón:** distorsión de dominio con senos encadenados (q.x += sen(q.y·a + φ), q.y += sen(q.x·b − 2φ), …). Una mezcla con `smoothstep` decide entre color base y color del agua, y una potencia de w·v da los brillos.
   - **Bucle exacto (adaptación propia):** el tiempo entra como una fase φ ∈ [0, 2π) multiplicada solo por enteros (φ, 2φ). El fotograma de φ = 2π es el de φ = 0.
   - **Resolución reducida** (MDN: «Consider reducing canvas.width and height and keeping canvas.style.width and height at a constant size»): el búfer se pinta al 60 % del tamaño CSS **y nunca a más de 400 000 píxeles** (en una pantalla 4K, el 60 % serían unos 3 millones por fotograma). Un patrón suave no pierde calidad y el coste por píxel cae mucho. *Hallazgo de la prueba:* en el Chromium de las pruebas, que pinta por software (SwiftShader), un búfer de unos 470 000 píxeles provocaba avisos del driver («GPU stall due to ReadPixels»); con el tope desaparecen.
   - **Precisión** (MDN): `#ifdef GL_FRAGMENT_PRECISION_HIGH` → `highp`; si no, `mediump`. `highp` sin condición falla en móviles antiguos.
   - **Compilación** (MDN: «Don't check shader compile status unless linking fails»): solo se mira `LINK_STATUS`. En el bucle no hay llamadas bloqueantes como `getError`.
   - **Pérdida de contexto** (MDN: «Handle webglcontextlost events»): `preventDefault()` en `webglcontextlost`, parar el bucle, y rehacer shaders y búfer en `webglcontextrestored`.
   - **Sin `alpha: false`** (MDN: «Avoid alpha:false, which can be expensive»). Ojo: es al revés que en canvas 2D (FONDO-002).
   - **Respaldo:** sin WebGL, el contenedor tiene un fondo CSS estático con los mismos colores.
6. **Tecnologías y dependencias.** WebGL 1.0 y GLSL ES 1.00. Ninguna dependencia.
7. **Procedimiento de implementación.**
   1. `<canvas>` a pantalla completa detrás del contenido, con `pointer-events: none` y `aria-hidden="true"`. Su contenedor lleva el respaldo CSS.
   2. `getContext("webgl")`. Si devuelve `null`, se queda el respaldo.
   3. Compila los dos shaders, enlaza y comprueba `LINK_STATUS`. Crea el búfer del cuadrado.
   4. En cada fotograma: tamaño del búfer al 60 % del CSS, `viewport`, uniformes (resolución, fase, colores, escala, intensidad) y `drawArrays`.
   5. Pausa fuera de pantalla (IntersectionObserver). Pérdida y recuperación de contexto atendidas.
   6. Con `prefers-reduced-motion: reduce`: un fotograma quieto.
8. **Parámetros configurables.** Color base, color del agua, color de los brillos, escala de las olas (0,6–2), intensidad de los brillos (0–1), periodo del bucle.
9. **Código.** Ver la demo de Kinetic Prompts `content/animaciones/background-light-waves/preview/index.html` (adaptación propia).
10. **Problemas habituales.**
    - Pantalla negra en móviles antiguos por `highp` sin comprobar.
    - Coste alto a pantalla completa en 4K si se pinta a la resolución nativa: reduce el búfer.
    - El bucle «salta» si el tiempo entra en el shader con multiplicadores no enteros.
    - Contexto perdido (GPU sin memoria, pestañas en segundo plano) sin atender: el fondo se queda congelado o en blanco.
11. **Rendimiento y accesibilidad.** El coste es por píxel: con el búfer al 60 %, un fragment shader corto va holgado en portátiles. En móviles de gama baja, vigila la batería. Es decorativo: `aria-hidden`; reserva una zona tranquila para el texto. Movimiento reducido: quieto.
12. **Compatibilidad.** WebGL 1.0 en todos los navegadores actuales; el respaldo CSS cubre el resto.
13. **Aplicaciones comerciales.** Hero de producto premium, marca de bienestar o de viajes, lanzamientos, portfolios.
14. **Pruebas necesarias.** Bucle cerrado; búfer al 60 %; respaldo sin WebGL; pérdida y recuperación de contexto (`WEBGL_lose_context`); movimiento reducido; rendimiento en móvil.
15. **Estado de evidencia.** MDN leída el 2026-11-28 (la parte final de «best practices», como resumen de un agente de lectura). Patrón y bucle periódico: adaptación propia, implementada y validada en Chromium con GPU por software (SwiftShader): bucle cerrado, búfer con tope, respaldo sin WebGL y recuperación del contexto. Sin probar en GPU real, Safari ni Firefox.
