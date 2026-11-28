# Validación de Manchas de color en movimiento (background-color-blobs)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, transform, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color 1» | ✓ | color1 = "#00ff00" |
| kp:params cambia «Color 2» | ✓ | color2 = "#00ff00" |
| kp:params cambia «Color 3» | ✓ | color3 = "#00ff00" |
| kp:params cambia «Color de fondo» | ✓ | base = "#00ff00" |
| kp:params cambia «Duración de cada recorrido» | ✓ | duration = 15 |
| kp:params cambia «Tamaño de las manchas» | ✓ | size = 90 |
| Sin filtros: el difuminado está en el degradado (FONDO-001) | ✓ | ninguna mancha con filter |
| El fondo no captura clics ni lo leen los lectores de pantalla | ✓ | pointer-events none, aria-hidden true |
| El bucle cierra: a los 7 s se ve igual que al principio | ✓ | fotograma 0 s = fotograma 7 s |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» pone el fondo en marcha (solo transform y opacity) | ✓ | offset, easing, composite, transform, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 7.03 s |
| Vídeo WebM < 600 KB | ✓ | 184 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 493 KB |
| Póster WebP < 80 KB | ✓ | 20 KB |

Pesos: loop.webm 184 KB · loop.mp4 493 KB · poster.webp 20 KB
Calidad de compresión: CRF 38 (WebM) y 27 (MP4).

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
