# Validación de Titular que emerge por líneas (text-line-reveal)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, transform, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color del texto» | ✓ | color = "#00ff00" |
| kp:params cambia «Color de fondo» | ✓ | background = "#00ff00" |
| kp:params cambia «Duración de cada línea» | ✓ | duration = 1.2 |
| kp:params cambia «Retraso entre líneas» | ✓ | stagger = 0.2 |
| Las líneas son las reales (ninguna se parte en dos) y se rehacen al cambiar el ancho | ✓ | sin ancho máximo: 1279 px → 3 líneas · 390 px → 4; cada línea de una sola altura: true |
| Accesible: el titular se lee entero (aria-label) y los trozos están ocultos | ✓ | aria-label «Construimos espacios que se recuerdan durante años»; trozos ocultos: true; text-wrap: wrap |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» pone el fondo en marcha (solo transform y opacity) | ✓ | offset, easing, composite, transform, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 4.03 s |
| Vídeo WebM < 600 KB | ✓ | 72 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 74 KB |
| Póster WebP < 80 KB | ✓ | 19 KB |

Pesos: loop.webm 72 KB · loop.mp4 74 KB · poster.webp 19 KB
Calidad de compresión: CRF 38 (WebM) y 27 (MP4).

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
