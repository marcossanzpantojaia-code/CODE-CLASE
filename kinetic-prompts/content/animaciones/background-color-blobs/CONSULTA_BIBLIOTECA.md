# CONSULTA_BIBLIOTECA — Manchas de color en movimiento (`background-color-blobs`)

## 1. Encargo

- Descripción breve: fondo animado de nivel básico. Tres manchas de color difusas flotan detrás del contenido. Solo CSS.
- Perfil (A/B) y motivo: ambos; con colores apagados y ciclo largo sirve también en webs sobrias.
- Versión de la biblioteca: 0.32.0 + FONDO-001 (añadida desde Kinetic Prompts el 2026-11-28, con permiso del usuario).
- Stack y versiones: CSS (`radial-gradient`, `@keyframes`, `transform`). Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Fondo vivo ligero sin JS | FONDO-001 (nueva) | knowledge/fondos/FONDO-001-manchas-de-color-en-movimiento-css.md | IMPLEMENTADO | — |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |
| Duración y easing | UX-001 | knowledge/ux/UX-001-duracion-y-easing.md | INVESTIGADO | — |

La biblioteca no tenía ninguna ficha de fondos básicos (solo TSL-003, GL-004 e INST-002, en 3D). Por eso se investigó y se añadió FONDO-001, a partir de MDN (`radial-gradient`, `prefers-reduced-motion`) y web.dev («Animations guide»), leídos el 2026-11-28.

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| FONDO-001 §5 | Difuminado en el degradado (`transparent 70%`), sin `filter`; movimiento solo con `transform` | preview/index.html (CSS `.mancha`) | No | — |
| FONDO-001 §7 | Misma duración y retardos negativos distintos: no van al unísono y el bucle cierra | preview/index.html | No | — |
| A11Y-001 | Con movimiento reducido, quieto; «Reproducir» lo pone en marcha si la persona quiere | preview/index.html | No | Sí |
| UX-001 §5 | Ciclo lento (3,5 s por recorrido, 7 s el bucle); es ambiente, no interfaz | item.json | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| TSL-003, GL-004, INST-002 (no leídas) | Fondos en 3D: quedan para los niveles intermedio y avanzado |
| TEST-003 (no leída) | Contraste sobre fondos compuestos; citada en FONDO-001 como prueba recomendada |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente consultada | Resultado |
|---|---|---|
| Los degradados son imágenes y se usan como `background-image` | MDN radial-gradient | Confirmado |
| Paradas en % relativas al radio final del degradado | MDN radial-gradient | Confirmado |
| Limitar las animaciones a `opacity` y `transform`; `will-change` con moderación | web.dev «Animations guide» | Confirmado (en parte a través de un resumen) |
| Valores `reduce` y `no-preference` | MDN prefers-reduced-motion | Confirmado |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| El bucle cierra al fotograma exacto (0 s = 7 s) | Playwright | ✓ | VALIDACION.md |
| Sin filtros; no captura clics; `aria-hidden` | Playwright | ✓ | VALIDACION.md |
| Consola, anchos, seis parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 24/24 | VALIDACION.md |
| Contraste del texto en el peor punto (TEST-003) | — | No medido; revisado en capturas | Pendiente |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca

- FONDO-001 creada (estado IMPLEMENTADO por esta demo).
- `integration/tools/library_check.py` avisa de que `LIBRARY_MANIFEST.json` supera 35 KB: conviene dividirlo por categoría.
