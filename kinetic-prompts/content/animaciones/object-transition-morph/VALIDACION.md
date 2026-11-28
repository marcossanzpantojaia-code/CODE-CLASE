# Validación de Forma que se transforma (object-transition-morph)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, opacity, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color de la forma» | ✓ | color = "#00ff00" |
| kp:params cambia «Color de fondo» | ✓ | background = "#00ff00" |
| kp:params cambia «Duración de cada cambio» | ✓ | duration = 1.6 |
| kp:params cambia «Pausa en cada forma» | ✓ | hold = 2 |
| kp:params cambia «Giro en cada cambio» | ✓ | rotate = 90 |
| El bucle cierra sin salto: el primer fotograma y el del final del ciclo son iguales | ✓ | fotograma 0 frente a fotograma 6 400 ms |
| Nunca se retuerce ni salta: contorno sin cruces y menos de 6 unidades entre fotogramas de 16 ms | ✓ | 401 fotogramas · paso máximo 3.40 unidades · cruces 0 · trazados sin 120 puntos 0 |
| Al pulsar «Sol», la forma llega al sol (12 puntas) en menos de medio segundo y la opción queda marcada | ✓ | 12 puntas · radio 0.72–1.00 · aria-pressed true · botón «Seguir» |
| «Pausar» congela el bucle y «Seguir» lo reanuda | ✓ | en pausa quieta · al seguir se mueve |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» usa un fundido | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 6.43 s |
| Vídeo WebM < 600 KB | ✓ | 142 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 197 KB |
| Póster WebP < 80 KB | ✓ | 19 KB |

Pesos: loop.webm 142 KB · loop.mp4 197 KB · poster.webp 19 KB
Calidad de compresión: CRF 38 (WebM) y 27 (MP4).

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
