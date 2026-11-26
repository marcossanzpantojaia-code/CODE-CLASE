# Validación de Tarjeta que se convierte en página (page-transition-card-expand)

Fecha: 2026-11-26 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, transform, computedOffset, opacity |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Duración del viaje» | ✓ | duration = 1.4 |
| kp:params cambia «Escalonado del texto» | ✓ | stagger = 0.15 |
| kp:params cambia «Easing» | ✓ | ease = "ease-in-out" |
| kp:params cambia «Color de la página de detalle» | ✓ | background = "#00ff00" |
| La imagen sale de la tarjeta y termina como portada (FLIP) | ✓ | inicio 287×358 en (649, 188) = tarjeta; final 1280×464 |
| Clic en una tarjeta abre su página con el foco en el título; «← Proyectos» vuelve | ✓ | abierto «Ático Sur», foco #t-detalle; al volver, foco #t-proyectos |
| Clics rápidos no rompen el viaje (se ignoran mientras dura) | ✓ | página abierta: Casa Lirio |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» usa un fundido | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 4.33 s |
| Vídeo WebM < 600 KB | ✓ | 89 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 92 KB |
| Póster WebP < 80 KB | ✓ | 3 KB |

Pesos: loop.webm 89 KB · loop.mp4 92 KB · poster.webp 3 KB

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
