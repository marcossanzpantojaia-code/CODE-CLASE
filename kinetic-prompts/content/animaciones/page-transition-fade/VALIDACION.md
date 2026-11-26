# Validación de Fundido nativo entre páginas (page-transition-fade)

Fecha: 2026-11-26 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, transform, opacity, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Duración» | ✓ | duration = 0.8 |
| kp:params cambia «Desplazamiento de la página nueva» | ✓ | shift = 48 |
| kp:params cambia «Easing» | ✓ | ease = "ease-in-out" |
| kp:params cambia «Color del fundido» | ✓ | tint = "#00ff00" |
| Usa la View Transitions API (document.startViewTransition) | ✓ | transición nativa y página cambiada |
| Sin soporte del navegador, el cambio de página ocurre igual | ✓ | página cambiada: true; foco en #t-proyectos |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» usa un fundido | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 5.60 s |
| Vídeo WebM < 600 KB | ✓ | 156 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 144 KB |
| Póster WebP < 80 KB | ✓ | 7 KB |

Pesos: loop.webm 156 KB · loop.mp4 144 KB · poster.webp 7 KB

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
