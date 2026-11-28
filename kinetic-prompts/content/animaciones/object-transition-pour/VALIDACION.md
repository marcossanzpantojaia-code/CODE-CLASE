# Validación de Objeto que une dos secciones (object-transition-pour)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, opacity, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color del chorro» | ✓ | streamColor = "#00ff00" |
| kp:params cambia «Color de la segunda sección» | ✓ | panelColor = "#00ff00" |
| kp:params cambia «Inclinación al verter» | ✓ | tilt = -20 |
| kp:params cambia «Recorrido de scroll» | ✓ | distance = 500 |
| Es reversible: al volver, el mismo punto del recorrido se ve igual (≤ 0,5 % de píxeles) | ✓ | 0.000 % de píxeles distintos entre ida y vuelta |
| El chorro une el pico de la jarra con la taza (±1 px) | ✓ | pico 0.00 px · taza 0.00 px · visible true |
| Con scroll real, el estado sigue al scroll (al 78 % la jarra está inclinada) | ✓ | giro -38.0° |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» usa un fundido | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 5.57 s |
| Vídeo WebM < 600 KB | ✓ | 179 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 296 KB |
| Póster WebP < 80 KB | ✓ | 37 KB |

Pesos: loop.webm 179 KB · loop.mp4 296 KB · poster.webp 37 KB

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
