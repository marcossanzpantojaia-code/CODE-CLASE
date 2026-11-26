---
name: kp-validar
description: Valida una web o una animación del catálogo de Kinetic Prompts con Playwright (consola, prefers-reduced-motion, rendimiento, Lighthouse en webs), graba el vídeo en bucle y el póster, y cambia su estado a VALIDADO o NO VERIFICADO con el motivo. Úsala siempre después de crear o cambiar un elemento de content/.
---

# kp-validar

Entrada: una carpeta `content/animaciones/<slug>/` o `content/webs/<slug>/` en estado
IMPLEMENTADO. Salida: `media/` generada, estado actualizado y una línea en
`knowledge/RESEARCH_PROGRESS.md`.

**Nunca marques VALIDADO algo que no hayas ejecutado y comprobado en esta sesión.**
Si una comprobación no se puede ejecutar, el estado es NO VERIFICADO y el motivo lo dice.

## Comprobaciones

Sirve `preview/` con un servidor estático local y ábrelo con Playwright (Chromium).

| #   | Comprobación                                                                         | Animación | Web                      |
| --- | ------------------------------------------------------------------------------------ | --------- | ------------------------ |
| 1   | Consola sin errores ni avisos y sin peticiones fallidas                              | Sí        | Sí, en todas las páginas |
| 2   | Funciona a 390 px y a 1440 px sin desbordes                                          | Sí        | Sí, también 768 y 1280   |
| 3   | `postMessage` `kp:params` cambia lo que dice `params`                                | Sí        | Sí                       |
| 4   | `kp:replay` reinicia la animación                                                    | Sí        | —                        |
| 5   | `kp:highlight` hace scroll y resalta la sección                                      | —         | Sí                       |
| 6   | Con `reducedMotion: 'reduce'`, la demo queda en pausa o en fundidos                  | Sí        | Sí                       |
| 7   | Solo se animan `transform` y `opacity` (revisa el código y una traza de rendimiento) | Sí        | Sí                       |
| 8   | Lighthouse móvil: Rendimiento ≥ 90 y Accesibilidad ≥ 95                              | —         | Sí                       |
| 9   | El prompt cumple la plantilla y todas sus `{{variables}}` existen en `params`        | Sí        | Sí, maestro y secciones  |
| 10  | Reseñas sin inventar y fotos con fuente indicada                                     | —         | Sí                       |

Para Lighthouse, usa el Chromium de Playwright (`--headless --no-sandbox`) y guarda el
informe JSON junto a las capturas de la fase.

## Vídeo y póster

|            | Animación                                   | Web                                                               |
| ---------- | ------------------------------------------- | ----------------------------------------------------------------- |
| Vídeo      | `media/loop.webm`, bucle de 4–8 s, < 600 KB | `media/scroll.webm`, 8–12 s haciendo scroll por la home, < 900 KB |
| Póster     | `media/poster.webp`, < 80 KB                | `media/poster.webp`, < 80 KB                                      |
| Proporción | 16:10                                       | 16:10                                                             |

- Graba con `recordVideo` de Playwright a 1280×800 (16:10), sin sonido.
- Si el vídeo pasa del límite, reduce la resolución o la duración y recorta con ffmpeg;
  no bajes la calidad hasta que se vean artefactos.
- Para el póster, haz una captura del fotograma más representativo y conviértela a WebP
  (por ejemplo, `canvas.toBlob(…, 'image/webp', 0.8)` dentro de Chromium, o una
  dependencia de desarrollo como `sharp`).
- Comprueba el peso real de cada archivo y anótalo.

## Estado

- Todo en verde → `status: "VALIDADO"` en `item.json`.
- Algo falla y no se puede corregir ahora → `status: "NO VERIFICADO"` y
  `statusReason` con qué falló y qué haría falta.
- Si algo falla y se puede corregir, corrígelo (con `kp-crear-animacion` o
  `kp-crear-web`) y vuelve a validar desde el principio.

## Registro

Añade una línea a `knowledge/RESEARCH_PROGRESS.md` (el único archivo de `knowledge/`
que se puede modificar) con: fecha, sección, slug, ficha de origen, estado, peso del
vídeo y del póster, puntuaciones de Lighthouse (webs) e incidencias.

## Informe

Devuelve una tabla con cada comprobación (✓ / ✗ y detalle), el peso de los archivos y
el estado final. Separa lo comprobado de lo que solo se ha revisado en el código.
