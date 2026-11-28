# Validación de Persianas desde el centro (page-transition-blinds)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, transform, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Número de tiras» | ✓ | strips = 40 |
| kp:params cambia «Duración de cada fase» | ✓ | duration = 1.2 |
| kp:params cambia «Escalonado entre tiras» | ✓ | stagger = 0.05 |
| kp:params cambia «Color de las tiras» | ✓ | color = "#00ff00" |
| kp:params cambia «Dirección» | ✓ | direction = "verticales" |
| Sin costuras con las tiras cerradas (1366×768, 390×844 @3x, 1280×800) | ✓ | 1366×768@1x: 0 px · 390×844@3x: 0 px · 1280×800@1x: 0 px |
| Las tiras cubren desde el centro (la central antes que la del borde) | ✓ | centro 0.59 · borde 0.06 |
| Un clic en un enlace cambia de página y deja el foco en su título | ✓ | foco en #t-proyectos; tiras recogidas: true |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» usa un fundido | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 5.33 s |
| Vídeo WebM < 600 KB | ✓ | 349 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 253 KB |
| Póster WebP < 80 KB | ✓ | 18 KB |

Pesos: loop.webm 349 KB · loop.mp4 253 KB · poster.webp 18 KB
Calidad de compresión: CRF 38 (WebM) y 27 (MP4).

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
