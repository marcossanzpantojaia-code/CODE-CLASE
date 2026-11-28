---
id: FONDO-001
titulo: Fondo de manchas de color en movimiento solo con CSS — degradados radiales que se desplazan con transform (compositor), sin filtros ni JavaScript
categoria: fondos
estado: IMPLEMENTADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (MDN radial-gradient y prefers-reduced-motion; web.dev «Animations guide», leídos el 2026-11-28) + DEMO_INSPECCIONADA propia (Kinetic Prompts, content/animaciones/background-color-blobs: validada con Playwright en Chromium)
versiones: CSS (radial-gradient, @keyframes, transform); Chromium 153 en la prueba
perfil: ambos
ultima_revision: 2026-11-28
---

# FONDO-001 · Manchas de color en movimiento (solo CSS)

*Ficha añadida desde Kinetic Prompts con permiso del usuario (2026-11-26).*

1. **Nombre y finalidad.** Fondo vivo para un hero o una web entera: tres o cuatro manchas de color grandes y difusas que se desplazan despacio y se mezclan entre sí. Da movimiento y color de marca sin vídeo, sin imágenes y sin JavaScript.
2. **Fuente original y URL.**
   - MDN, `radial-gradient()`: https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/radial-gradient
   - MDN, `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
   - web.dev, «Animations guide»: https://web.dev/articles/animations-guide
3. **Ubicación.** MDN radial-gradient, secciones Syntax y Description. MDN prefers-reduced-motion, sección Syntax. web.dev: recomendación de limitar las animaciones a `opacity` y `transform`.
4. **Resultado visual.** Manchas de color suaves que flotan detrás del contenido, como luz de colores difuminada. Cada una sigue su propio recorrido, así que la mezcla de colores cambia sin repetirse a simple vista.
5. **Explicación técnica.**
   - Cada mancha es un bloque grande (unos 60–70 vmax) con `background-image: radial-gradient(circle at center, <color> 0%, transparent 70%)`. El degradado es una imagen (MDN: `<gradient>` es de tipo `<image>`) y se pinta una sola vez.
   - Las posiciones de las paradas en porcentaje se miden sobre el radio final del degradado (MDN): con `transparent 70%` la mancha se funde antes del borde del bloque y no se ve ningún corte.
   - El movimiento es solo `transform` (translate y scale) con `@keyframes` y `animation-direction: alternate`, para que el compositor lo resuelva sin layout ni pintura (web.dev: «restrict animations to opacity and transform»).
   - **No hace falta `filter: blur()`.** El difuminado ya está en el degradado. Un filtro sobre una capa que se mueve obliga a repintar en cada fotograma.
6. **Tecnologías y dependencias.** CSS. Ninguna dependencia.
7. **Procedimiento de implementación.**
   1. Contenedor `position: absolute; inset: 0; overflow: hidden; z-index: -1` (o `fixed` para toda la web), con `pointer-events: none` y `aria-hidden="true"`, y el color base de fondo.
   2. Tres o cuatro manchas, cada una con su color y su posición de partida.
   3. Un `@keyframes` por mancha (o uno compartido con variables) que la lleve a 2–3 puntos con `translate` y una escala de 0,9–1,2. Usa duraciones distintas o retardos negativos para que no se muevan al unísono.
   4. Con `prefers-reduced-motion: reduce`, sin animación: las manchas quietas en su posición de partida.
   5. Comprueba el contraste del texto sobre el punto más claro y el más oscuro del fondo (ver TEST-003).
8. **Parámetros configurables.** Colores de las manchas, color base, duración del ciclo (8–30 s), tamaño de las manchas, recorrido máximo.
9. **Código (adaptación propuesta, ejecutada en la demo de Kinetic Prompts):**
   ```css
   .mancha { position: absolute; width: 65vmax; aspect-ratio: 1; border-radius: 50%;
     background: radial-gradient(circle at center, var(--c) 0%, transparent 70%);
     animation: deriva var(--ciclo) ease-in-out infinite alternate; will-change: transform; }
   @keyframes deriva { to { transform: translate(var(--dx), var(--dy)) scale(var(--s)); } }
   @media (prefers-reduced-motion: reduce) { .mancha { animation: none; } }
   ```
10. **Problemas habituales.**
    - Bandas visibles en degradados largos y oscuros: usa colores con luminosidad parecida o añade un grano muy suave estático.
    - Con `filter: blur()` animado, el rendimiento cae: el difuminado tiene que estar en el degradado.
    - Texto ilegible cuando una mancha clara pasa por detrás: elige colores con contraste suficiente o pon un velo.
    - `will-change` en muchas capas consume memoria. web.dev pide usarlo con moderación, solo si hay un problema de rendimiento. Con 3–4 manchas es aceptable.
11. **Rendimiento y accesibilidad.** Solo compositor; coste muy bajo con 3–4 capas. Es decorativo: `aria-hidden` y nada de información solo en el fondo. Con movimiento reducido queda quieto. Un movimiento lento y suave no es un destello (WCAG 2.3.1), pero un fondo en movimiento permanente puede distraer: ciclos largos.
12. **Compatibilidad.** `radial-gradient`, `@keyframes`, `transform` y `prefers-reduced-motion` funcionan en todos los navegadores actuales.
13. **Aplicaciones comerciales.** Hero de una startup, producto digital, estudio creativo, landing de campaña; también clínica o despacho con colores apagados y ciclo largo.
14. **Pruebas necesarias.** Consola sin errores; solo `transform` y `opacity` animados (`document.getAnimations()`); reposo con movimiento reducido; contraste del texto en el peor punto; 375 y 1440 px sin desbordes; vídeo del bucle.
15. **Estado de evidencia.** Las tres fuentes se leyeron el 2026-11-28 a través de un agente de lectura (web.dev, en parte como resumen). La técnica está implementada y validada en Chromium en la demo de Kinetic Prompts. Safari y Firefox, sin probar.
