# CONSULTA_BIBLIOTECA — Objeto que une dos secciones (`object-transition-pour`)

## 1. Encargo

- Descripción breve: transición de objeto de nivel avanzado. Al bajar, una jarra llega en arco, se inclina y vierte un chorro que cruza el cambio de sección hasta la taza; el fondo y el titular cambian.
- Perfil (A/B) y motivo: cinematográfico (y héroe de webs comerciales de restauración y producto).
- Versión de la biblioteca: 0.32.0 · Lotes 0–32 · 2026-11-04.
- Stack y versiones: JavaScript sin dependencias, escenario `sticky` y bucle `requestAnimationFrame`; objetos en SVG propios. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Receta del objeto que une dos secciones (estados, capas, conector) | REC-001 | knowledge/recetas/REC-001-objeto-que-conecta-dos-secciones.md | IMPLEMENTADO | JS nativo en la microdemo, igual que aquí |
| Continuidad del protagonista entre escenas | CONT-001 | knowledge/animations/CONT-001-continuidad-de-objeto-entre-escenas.md | IMPLEMENTADO | — |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| REC-001 §1 | Tabla de estados: llegada en arco, taza que entra, inclinación con meseta, panel, titulares, chorro y enderezado | preview/index.html (`aplica`) | No (la microdemo de la biblioteca no se ha copiado) | Sí: tiempos propios |
| REC-001 §2 | Capas y `isolation: isolate` en el escenario | preview/index.html (CSS) | No | No |
| REC-001 §7 | Conector calculado después de mover los objetos, en el mismo fotograma; corte desde el pico | preview/index.html (`aplica`) | No | No |
| REC-001 §7b | Meseta legible: el titular de salida no se apaga hasta que llega el panel; anticipación de 3° y arco | preview/index.html (`aplica`), prompt.md §4 | No | Sí |
| REC-001 §5 | Panel de la segunda sección con `transform` en vez de `clip-path` (solo compositor) | preview/index.html | No | Sí |
| CONT-001 | El objeto no sale nunca del encuadre; coordenadas compartidas con `getBoundingClientRect` | preview/index.html | No | No |
| A11Y-001 | Con movimiento reducido, las dos secciones fijas; «Reproducir» alterna con un fundido | preview/index.html | No | Sí |
| — | Para la tarjeta y el vídeo, el progreso sale de un «reloj» de Web Animations; con scroll real, manda el scroll | preview/index.html (`startClock`, `frame`) | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| SEQ-001 (no leída) | Secuencia de fotogramas para un líquido realista: hace falta con recursos reales, no con SVG |

## 5. Verificaciones en documentación oficial

| Afirmación de la ficha marcada "verificar" | Fuente consultada | Resultado |
|---|---|---|
| Variante GSAP (§4) DOCUMENTADA, sin ejecutar | — | No usada en la demo; el prompt la menciona como alternativa |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Reversibilidad: mismo p a la ida y a la vuelta (REC-001 §8) | Playwright + sharp | 0,000 % de píxeles distintos | VALIDACION.md |
| El chorro une el pico y la boca | Playwright | 0,00 px de error | VALIDACION.md |
| Con scroll real, el estado sigue al scroll | Playwright | giro −38,0° al 78 % | VALIDACION.md |
| Consola, anchos, parámetros, movimiento reducido | scripts/validar-animacion.mjs | 22/22 | VALIDACION.md |
| C1/C3 con recursos reales (REC-001 §8) | — | No aplicable: objetos SVG procedurales | — |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca (no aplicar desde el proyecto)

- Correcciones de fichas: REC-001 puede anotar que el SVG del conector necesita tamaño explícito (`width/height: 100%`): con solo `inset: 0` se queda en 300 × 150 y recorta el trazo.
- Fichas que podrían pasar a IMPLEMENTADO/VALIDADO: ninguna nueva.
