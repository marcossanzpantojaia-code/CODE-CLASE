# CONSULTA_BIBLIOTECA — Forma que se transforma (`object-transition-morph`)

## 1. Encargo

- Descripción breve: transición de objetos de nivel básico. Una forma grande pasa en bucle por cuatro figuras (círculo, flor, cuadrado redondeado y sol) sin retorcerse, con un contorno que la sigue. Al pulsar una opción de la lista, se transforma en ella.
- Perfil (A/B) y motivo: ambos. Sirve en webs sobrias (colecciones, servicios, planes) y en webs más expresivas.
- Versión de la biblioteca: 0.32.0 + fichas FONDO añadidas desde Kinetic Prompts.
- Stack y versiones: JavaScript sin dependencias y SVG. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Transformar una forma en otra | MORPH-001 | knowledge/transitions/MORPH-001-morphsvg.md | INVESTIGADO | MorphSVG 3.15 (docs) frente a JS nativo |
| Bucle de más de 5 s junto a otro contenido | A11Y-002 | knowledge/accessibility/A11Y-002-wcag-movimiento-y-contenido-animado.md | INVESTIGADO | WCAG 2.2 |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |
| Duración de la respuesta a un clic | UX-001 | knowledge/ux/UX-001-duracion-y-easing.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| MORPH-001 §5 y §15 | El morph necesita formas con el mismo número de puntos. En vez de igualarlos después (lo que hace MorphSVG), todas las figuras se generan con 120 radios en los mismos ángulos, y mezclarlas es mezclar los radios | preview/index.html (`SHAPES`, `mix`) | No | Sí: muestreo polar propio |
| MORPH-001 §7 (shapeIndex) | Al compartir ángulos, el punto i de una figura corresponde al i de la otra: no hace falta `shapeIndex` y el contorno no se retuerce. Lo mide `validar.mjs` (0 cruces en 401 fotogramas) | preview/index.html, validar.mjs | No | Sí |
| MORPH-001 §10 | Trazado pequeño (un `M`, 120 `C` y `Z`, dos decimales), sin filtros; se calcula cada fotograma y no hay precálculo costoso | preview/index.html (`pathFor`) | No | — |
| MORPH-001 §11 | SVG `aria-hidden`; el nombre de cada figura lo dicen los botones, con `aria-pressed` tras un clic | preview/index.html | No | — |
| MORPH-001 (variante GSAP) | El prompt recomienda MorphSVG solo si las figuras vienen de un programa de diseño y el proyecto ya usa GSAP | prompt.md §2 | No | — |
| A11Y-002 (2.2.2) | El bucle dura 6,4 s junto a otro contenido: botón visible «Pausar»/«Seguir»; elegir una forma también para el bucle | preview/index.html (`#pausa`) | No | — |
| A11Y-001 | Con movimiento reducido no hay morph: la figura cambia con un fundido de 200 ms y el botón de pausa se oculta | preview/index.html (`still`, `fadeTo`) | No | — |
| UX-001 §3 | El cambio que responde a un clic dura 0,45 s (más de ~500 ms ya se nota lento); el del bucle, 0,8 s por ser ambiente | preview/index.html (`CLICK_MS`) | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| TUT-003 (citada en MORPH-001, no leída) | Morph con la misma estructura de comandos en framer-motion: es el principio que se usa, sin la librería |
| Variante flubber del lote 8 de MORPH-001 | Repositorio sin licencia y librería sin mantenimiento reciente: no se usa ni se copia |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente consultada | Resultado |
|---|---|---|
| MorphSVG iguala el número de puntos y se corrige con `shapeIndex` | MORPH-001 (docs de GSAP 3.15 leídas por la biblioteca) | Citado de la ficha; no vuelto a leer |
| Un bucle de más de 5 s necesita pausa; pausar solo al pasar el ratón no cuenta | A11Y-002 (Understanding WCAG 2.2: Pause, Stop, Hide) | Citado de la ficha |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| El bucle cierra al fotograma exacto (0 = 6,4 s) | validar.mjs | ✓ | VALIDACION.md |
| Sin cruces ni saltos (paso máximo 3,4 de 200 unidades entre fotogramas de 16 ms) | validar.mjs | ✓ | VALIDACION.md |
| Clic en «Sol»: 12 puntas en 0,45 s y `aria-pressed` | validar.mjs | ✓ | VALIDACION.md |
| «Pausar» congela y «Seguir» reanuda | validar.mjs | ✓ | VALIDACION.md |
| Consola, anchos, cinco parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 24/24 | VALIDACION.md |
| Parar el bucle fuera de pantalla (`IntersectionObserver`) | — | Propuesto en el prompt; la demo vive en un iframe y no lo usa | Pendiente |
| Safari, Firefox y lector de pantalla real | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca

- MORPH-001 podría recoger la variante sin dependencias: figuras generadas como radio por ángulo con los mismos ángulos, que evita igualar puntos y `shapeIndex`. Queda probada aquí; no se ha tocado la ficha.
- Hallazgo del validador: el suavizado de un borde redondeado cae medio píxel fuera de la caja que Chrome repinta, y un mismo instante podía verse con un nivel de color de diferencia según lo que se hubiera repintado antes. Se resuelve con `outline: 1px solid transparent` en el elemento que cambia.
