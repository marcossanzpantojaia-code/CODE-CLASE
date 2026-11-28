# Validación de Constelación de partículas (background-particles-constellation)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, opacity, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color de puntos y líneas» | ✓ | color = "#00ff00" |
| kp:params cambia «Color de fondo» | ✓ | base = "#00ff00" |
| kp:params cambia «Número de partículas» | ✓ | count = 150 |
| kp:params cambia «Distancia de conexión» | ✓ | linkDistance = 200 |
| kp:params cambia «Tamaño de los puntos» | ✓ | dotSize = 4 |
| El bucle cierra: a los 7 s se ve igual que al principio | ✓ | fotograma 0 s = fotograma 7 s |
| Nítido en pantallas de alta densidad (lienzo a 2× con DPR 2) | ✓ | lienzo 1600×1000 para 800×500 px CSS |
| Las partículas se apartan del cursor | ✓ | el fotograma cambia al mover el ratón al centro |
| El lienzo no captura clics ni lo leen los lectores de pantalla | ✓ | pointer-events none, aria-hidden true |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» pone el fondo en marcha (solo transform y opacity) | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 7.03 s |
| Vídeo WebM < 600 KB | ✓ | 377 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 367 KB |
| Póster WebP < 80 KB | ✓ | 23 KB |

Pesos: loop.webm 377 KB · loop.mp4 367 KB · poster.webp 23 KB

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
