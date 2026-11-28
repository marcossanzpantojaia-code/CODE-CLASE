# CONSULTA_BIBLIOTECA — Constelación de partículas (`background-particles-constellation`)

## 1. Encargo

- Descripción breve: fondo animado de nivel intermedio. Puntos que derivan y se unen con líneas cuando están cerca; se apartan del cursor. Canvas 2D.
- Perfil (A/B) y motivo: ambos; muy apto para empresas de tecnología, datos o IA.
- Versión de la biblioteca: 0.32.0 + FONDO-001 y FONDO-002 (añadidas desde Kinetic Prompts, con permiso del usuario).
- Stack y versiones: Canvas 2D, JavaScript sin dependencias. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Fondo de partículas en canvas | FONDO-002 (nueva) | knowledge/fondos/FONDO-002-constelacion-de-particulas-canvas.md | IMPLEMENTADO | — |
| Reglas comunes de los fondos (decorativo, contraste, reducido) | FONDO-001 | knowledge/fondos/FONDO-001-manchas-de-color-en-movimiento-css.md | IMPLEMENTADO | — |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |

FONDO-002 se investigó a partir de MDN («Basic animations», «Optimizing canvas», «Window: devicePixelRatio»), leídos el 2026-11-28.

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| FONDO-002 §5 | Fotograma: rellenar, dibujar, `requestAnimationFrame` | preview/index.html (`draw`, `frame`) | No | No |
| FONDO-002 §5 | Puntos en un solo `path`; líneas por 4 niveles de opacidad, un `stroke()` por nivel | preview/index.html (`draw`) | No | Sí |
| FONDO-002 §5 | `getContext("2d", { alpha: false })` y lienzo a `devicePixelRatio` (máx. 2) | preview/index.html (`resize`) | No | No |
| FONDO-002 §5 | Movimiento periódico (frecuencias enteras): bucle exacto; tiempo desde un reloj de Web Animations | preview/index.html (`positions`, `startClock`) | No | Sí |
| FONDO-002 §7 | Pausa fuera de pantalla con IntersectionObserver | preview/index.html | No | No |
| A11Y-001 | Con movimiento reducido, quieto y sin reacción al cursor; «Reproducir» lo pone en marcha | preview/index.html | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| INST-001, INST-002 (no leídas) | Partículas por miles con WebGL: para un fondo avanzado, no para este nivel |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente consultada | Resultado |
|---|---|---|
| Pasos de un fotograma y `requestAnimationFrame` como opción preferente | MDN «Basic animations» | Confirmado |
| Agrupar llamadas, evitar `shadowBlur`, `alpha: false`, enteros | MDN «Optimizing canvas» | Confirmado |
| Escalado por `devicePixelRatio` con el tamaño CSS fijado aparte | MDN «Window: devicePixelRatio» | Confirmado |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Bucle cerrado al fotograma (0 s = 7 s) | Playwright | ✓ | VALIDACION.md |
| Nitidez: lienzo 1600 × 1000 para 800 × 500 px CSS con DPR 2 | Playwright | ✓ | VALIDACION.md |
| Reacción al cursor; no captura clics; `aria-hidden` | Playwright | ✓ | VALIDACION.md |
| Consola, anchos, cinco parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 24/24 | VALIDACION.md |
| Rendimiento con 150 puntos en un móvil real | — | No medido | Pendiente |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca

- FONDO-002 creada (IMPLEMENTADO por esta demo).
