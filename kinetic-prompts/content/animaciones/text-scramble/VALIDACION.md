# Validación de Texto que se descifra (text-scramble)

Fecha: 2026-11-28 · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **VALIDADO**

| Comprobación | Resultado | Detalle |
|---|---|---|
| Consola sin errores ni avisos a 1440 px | ✓ |  |
| Sin desborde horizontal a 1440 px | ✓ | 0 px |
| Consola sin errores ni avisos a 390 px | ✓ |  |
| Sin desborde horizontal a 390 px | ✓ | 0 px |
| Solo se animan transform y opacity | ✓ | propiedades: offset, easing, composite, opacity, computedOffset |
| kp:replay reinicia la animación | ✓ | mismo fotograma tras reiniciar |
| kp:params cambia «Color del texto» | ✓ | color = "#00ff00" |
| kp:params cambia «Color de las letras cifradas» | ✓ | accent = "#00ff00" |
| kp:params cambia «Color de fondo» | ✓ | background = "#00ff00" |
| kp:params cambia «Duración del descifrado» | ✓ | duration = 2.5 |
| kp:params cambia «Caracteres del cifrado» | ✓ | alphabet = "números y símbolos" |
| Accesible: se lee el texto real (aria-label) y las letras que cambian están ocultas | ✓ | aria-label «DATOS SEGUROS», letras aria-hidden true |
| El ancho no salta mientras cambian las letras (fuente monoespaciada) | ✓ | anchos: 726, 726, 726, 726, 726 px |
| En una web, se descifra al pasar el ratón y termina en el texto real | ✓ | antes «DATOS SEGUROS» · durante «DQHGT JEMATAY» · después «DATOS SEGUROS» |
| Con movimiento reducido queda en pausa | ✓ | 0 animaciones en marcha tras 3 s |
| Con movimiento reducido ofrece «Reproducir» | ✓ |  |
| Con movimiento reducido, «Reproducir» pone el fondo en marcha (solo transform y opacity) | ✓ | offset, easing, composite, opacity, computedOffset |
| El prompt tiene las 9 secciones de la plantilla en orden | ✓ |  |
| Cada {{variable}} existe en params y cada parámetro sale en el prompt | ✓ |  |
| Vídeo WebM de 4–8 s | ✓ | 4.03 s |
| Vídeo WebM < 600 KB | ✓ | 60 KB |
| Vídeo MP4 (Safari) < 600 KB | ✓ | 54 KB |
| Póster WebP < 80 KB | ✓ | 14 KB |

Pesos: loop.webm 60 KB · loop.mp4 54 KB · poster.webp 14 KB
Calidad de compresión: CRF 38 (WebM) y 27 (MP4).

Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).
