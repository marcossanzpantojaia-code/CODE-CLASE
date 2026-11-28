# Validación de Olas de luz (background-light-waves)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, opacity, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color de fondo» | ✓ | base = "#00ff00" |
| kp:params cambia «Color del agua» | ✓ | color1 = "#00ff00" |
| kp:params cambia «Color de los brillos» | ✓ | color2 = "#00ff00" |
| kp:params cambia «Tamaño de las olas» | ✓ | scale = 2 |
| kp:params cambia «Intensidad de los brillos» | ✓ | intensity = 1 |
| Se pinta con WebGL (no con el respaldo) | ✓ | contexto WebGL activo |
| El bucle cierra: a los 7 s se ve igual que al principio (≤ 0,5 % de píxeles) | ✓ | 0.000 % de píxeles distintos |
| Búfer reducido: como mucho el 60 % del tamaño en pantalla y 400 000 píxeles (también en 4K) | ✓ | 1280 px → búfer 768×480 (369 mil px) · 3840 px → búfer 843×474 (400 mil px) |
| Sin WebGL queda el respaldo en CSS y no hay errores | ✓ | 0 errores; fondo CSS: true |
| Aguanta la pérdida del contexto y vuelve a pintar al recuperarlo | ✓ | recuperado: true; errores: 0 |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» pone el fondo en marcha (solo transform y opacity) | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 7.00 s |
| Vídeo WebM < 600 KB | ✓ | 246 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 565 KB |
| Póster WebP < 80 KB | ✓ | 21 KB |

Pesos: loop.webm 246 KB · loop.mp4 565 KB · poster.webp 21 KB
Calidad de compresión: CRF 38 (WebM) y 27 (MP4).

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).

Avisos apartados (no salen de la demo): 1440 px: 4 avisos de rendimiento del driver de SwiftShader (GPU por software del entorno de pruebas).
