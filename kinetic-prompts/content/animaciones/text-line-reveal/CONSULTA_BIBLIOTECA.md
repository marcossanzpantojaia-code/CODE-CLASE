# CONSULTA_BIBLIOTECA — Titular que emerge por líneas (`text-line-reveal`)

## 1. Encargo

- Descripción breve: animación de texto de nivel intermedio. Cada línea real del titular sube desde su máscara, escalonada.
- Perfil (A/B) y motivo: ambos; editorial y sobrio.
- Versión de la biblioteca: 0.32.0 (+ fichas de fondos añadidas desde Kinetic Prompts).
- Stack y versiones: JavaScript y Web Animations API, sin dependencias. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Revelado de líneas desde una máscara | TXT-002 (variante B) | knowledge/animations/TXT-002-revelado-texto-scroll-y-mascara.md | INVESTIGADO | Fuente con framer-motion; propuesta con SplitText; aquí, división propia |
| División accesible y responsive | TXT-001 | knowledge/animations/TXT-001-splittext.md | INVESTIGADO | GSAP 3.13+ en la ficha (alternativa en el prompt) |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| TXT-002 §8 | 0,75 s, `cubic-bezier(0.33, 1, 0.68, 1)` (≈ power2.out) y 0,075 s entre líneas | item.json, preview/index.html | No | No |
| TXT-002 §10 | Líneas reales (agrupadas por `offsetTop`), no fijas en el código | preview/index.html (`split`) | No | Sí |
| TXT-001 §5 y §10 | Dividir tras `document.fonts.ready`, volver a dividir al cambiar el ancho, sin `text-wrap: balance` | preview/index.html | No | Sí |
| TXT-001 §11 | `aria-label` con el texto entero y `aria-hidden` en los trozos | preview/index.html | No | No |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| TXT-002 variante A | Opacidad letra a letra con scrub: efecto de scroll, no de entrada |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente | Resultado |
|---|---|---|
| — | — | Sin afirmaciones marcadas «verificar» en las partes usadas |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Líneas reales: 3 a 1279 px y 4 a 390 px sin ancho máximo; ninguna se parte | Playwright | ✓ | VALIDACION.md |
| Accesibilidad: aria-label entero y trozos ocultos; sin text-wrap: balance | Playwright | ✓ | VALIDACION.md |
| Consola, anchos, parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 21/21 | VALIDACION.md |
| Lector de pantalla real | — | No probado | Pendiente |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca

- TXT-002 podría pasar a IMPLEMENTADO (variante B) con esta demo.
