# CONSULTA_BIBLIOTECA — Texto que se descifra (`text-scramble`)

## 1. Encargo

- Descripción breve: animación de texto de nivel básico. Las letras cambian como un código y se fijan una a una al pasar el ratón o con el foco.
- Perfil (A/B) y motivo: ambos, en titulares cortos de marca.
- Versión de la biblioteca: 0.32.0 (+ fichas de fondos añadidas desde Kinetic Prompts).
- Stack y versiones: JavaScript sin dependencias. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Texto que se descifra | TXT-003 | knowledge/animations/TXT-003-texto-scramble.md | INVESTIGADO | JS vanilla (2023) |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| TXT-003 §4–5 | Tic de 30 ms; letras fijadas de izquierda a derecha según el progreso | preview/index.html (`render`) | No (la fuente es MIT, pero no se copia: regla del proyecto) | Sí: progreso por duración en vez de 1/3 de letra por tic |
| TXT-003 §7 | Fuente monoespaciada; `aria-label` con el texto real y letras en un hijo `aria-hidden`; también con el foco | preview/index.html | No | No |
| TXT-003 §10 | `requestAnimationFrame` en vez de `setInterval` (se para con la pestaña oculta); nada de región viva | preview/index.html | No | Sí |
| — | Letras «al azar» con un hash de posición y tic: el mismo instante se ve igual (validación y vídeo) | preview/index.html (`pick`) | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| — | — |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente | Resultado |
|---|---|---|
| ScrambleText de GSAP gratuito | VERSIONES_VIGENTES.md (licencia de GSAP: plugins antiguos de pago incluidos) | Coherente; se menciona solo como alternativa |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Ancho constante (726 px en 5 instantes) | Playwright | ✓ | VALIDACION.md |
| Se dispara al pasar el ratón y termina en el texto real | Playwright | ✓ | VALIDACION.md |
| Accesible (aria-label y aria-hidden) | Playwright | ✓ | VALIDACION.md |
| Consola, anchos, parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 23/23 | VALIDACION.md |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca

- TXT-003 podría pasar a IMPLEMENTADO con esta demo (implementación propia, no la del CodePen).
