# Validación de Cortina con borde curvo (page-transition-curtain)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, transform, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color de la cortina» | ✓ | color = "#00ff00" |
| kp:params cambia «Duración de cada fase» | ✓ | duration = 1.4 |
| kp:params cambia «Altura de la curva» | ✓ | curve = 30 |
| kp:params cambia «Texto en la cortina» | ✓ | label = "alba prueba" |
| Al terminar de cubrir no asoma la página (1366×768, 390×844 @3x, 1280×800) | ✓ | 1366×768@1x: 0 px de la página · 390×844@3x: 0 px de la página · 1280×800@1x: 0 px de la página |
| El borde llega curvo y se endereza al tapar | ✓ | curva a mitad 0.50 · al llegar 0.00 |
| El texto de la cortina cambia a negro sobre un color claro | ✓ | claro → #111111 · oscuro → #ffffff |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» usa un fundido | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 5.73 s |
| Vídeo WebM < 600 KB | ✓ | 85 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 92 KB |
| Póster WebP < 80 KB | ✓ | 6 KB |

Pesos: loop.webm 85 KB · loop.mp4 92 KB · poster.webp 6 KB
Calidad de compresión: CRF 38 (WebM) y 27 (MP4).

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
