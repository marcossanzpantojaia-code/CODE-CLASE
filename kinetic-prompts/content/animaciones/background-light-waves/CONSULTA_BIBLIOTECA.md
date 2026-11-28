# CONSULTA_BIBLIOTECA — Olas de luz (`background-light-waves`)

## 1. Encargo

- Descripción breve: fondo animado de nivel avanzado. Una superficie de color que ondula como agua o seda, con brillos en las crestas. Shader de WebGL sin librerías.
- Perfil (A/B) y motivo: cinematográfico, y hero de webs comerciales premium (hotel, bienestar, producto).
- Versión de la biblioteca: 0.32.0 + FONDO-001, FONDO-002 y FONDO-003 (añadidas desde Kinetic Prompts, con permiso del usuario).
- Stack y versiones: WebGL 1.0 y GLSL ES 1.00. Comprobado en Chromium con GPU por software (ANGLE + SwiftShader, Playwright 1.63.0).
- Decisión del usuario: «lo dejo en tus manos». Se eligió WebGL a mano frente a three.js: unos pocos KB frente a unos 150 KB.

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Fondo de shader sin librerías | FONDO-003 (nueva) | knowledge/fondos/FONDO-003-olas-de-luz-shader-webgl.md | IMPLEMENTADO | — |
| Reglas comunes de los fondos | FONDO-001 | knowledge/fondos/FONDO-001-manchas-de-color-en-movimiento-css.md | IMPLEMENTADO | — |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |

FONDO-003 se investigó a partir de MDN («WebGL best practices» y «Adding 2D content to a WebGL context»), leídos el 2026-11-28.

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| FONDO-003 §5 | Cuadrado a pantalla completa con `TRIANGLE_STRIP` de 4 vértices; todo en el fragment shader | preview/index.html (`init`, `draw`) | No | No |
| FONDO-003 §5 | Precisión condicional con `GL_FRAGMENT_PRECISION_HIGH`; solo se comprueba `LINK_STATUS` | preview/index.html (`FS`, `init`) | No | No |
| FONDO-003 §5 | Búfer al 60 % con tope de 400 000 píxeles | preview/index.html (`draw`) | No | Sí: el tope sale de la prueba en 4K |
| FONDO-003 §5 | Pérdida y recuperación del contexto; sin `alpha: false` | preview/index.html | No | No |
| FONDO-003 §5 | Fase con multiplicadores enteros: el bucle cierra exacto | preview/index.html (`FS`) | No | Sí |
| FONDO-003 §5 | Respaldo CSS con los mismos colores | preview/index.html (`.fondo`) | No | Sí |
| A11Y-001 | Con movimiento reducido, quieto; «Reproducir» lo pone en marcha | preview/index.html | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| TSL-003, GL-004 (no leídas) | Superficies animadas con three.js: se prefirió WebGL sin librerías por peso |

## 5. Verificaciones en documentación oficial

| Afirmación | Fuente consultada | Resultado |
|---|---|---|
| Reducir `canvas.width` y `height` manteniendo el tamaño CSS | MDN «WebGL best practices» | Confirmado (texto literal) |
| `highp` solo con `GL_FRAGMENT_PRECISION_HIGH` | MDN «WebGL best practices» | Confirmado |
| Comprobar la compilación solo si falla el enlazado | MDN «WebGL best practices» | Confirmado |
| Atender `webglcontextlost` | MDN «WebGL best practices» | Confirmado; `webglcontextrestored` no aparece en el texto leído (se usa igualmente, es el evento estándar de recuperación) |
| `alpha: false` es caro en WebGL | MDN «WebGL best practices» | Confirmado (en la parte resumida) |
| Pasos: shaders, programa, búfer y `drawArrays(TRIANGLE_STRIP, 0, 4)` | MDN «Adding 2D content…» | Confirmado |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Se pinta con WebGL; bucle cerrado (0,000 % de píxeles distintos entre 0 y 7 s) | Playwright | ✓ | VALIDACION.md |
| Búfer con tope: 1280 px → 768 × 480; 4K → 843 × 474 (400 mil px) | Playwright | ✓ | VALIDACION.md |
| Respaldo CSS sin WebGL, sin errores | Playwright (getContext anulado) | ✓ | VALIDACION.md |
| Pérdida y recuperación del contexto (`WEBGL_lose_context`) | Playwright | ✓ | VALIDACION.md |
| Consola, anchos, cinco parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 25/25 | VALIDACION.md |
| Avisos «GPU stall due to ReadPixels» a 1440 px | Diagnóstico | Solo con SwiftShader y búferes de unos 400 000 px o más; vienen del proceso gráfico de Chromium, no de la demo. Se apartan en el validador y se anotan en VALIDACION.md | VALIDACION.md |
| GPU real, móvil, Safari y Firefox | — | No probado | Pendiente |

## 7. Propuestas para la biblioteca

- FONDO-003 creada (IMPLEMENTADO por esta demo).
- Para TEST-001/TEST-004: en entornos con SwiftShader, separar los avisos del driver de los de la página al revisar la consola de demos WebGL.
