# Experimento: el mismo encargo con y sin biblioteca (estado: PRIMERA PAREJA A1/B1 EJECUTADA — exploratoria, n = 1)

> **Lote 19:** B1 ejecutado una vez; resultados en `evidence/integration/2026-10-27/comparacion_A1_B1/COMPARACION_PRELIMINAR.md`. En esa pareja no se observa mejora atribuible a la biblioteca. Herramientas de la batería: TEST-004 y TEST-003. Faltan A2/B2/A3/B3 y la evaluación ciega humana.

Objetivo: medir si WEB_ENGINEERING_KNOWLEDGE_LIBRARY mejora las webs que construye Claude Code. **No se concluye nada hasta ejecutarlo.** Requiere autorización específica (consume cuota del plan).

## 1. Brazos
| | Brazo A — con biblioteca | Brazo B — sin biblioteca (control) |
|---|---|---|
| Biblioteca | copia del ZIP publicado con `--add-dir <copia>` | **ninguna** (sin `--add-dir`; ninguna carpeta `.claude/` en el proyecto) |
| Encargo | `evidence/integration/2026-10-27/prototipo_1/prompt.txt`, byte a byte | el mismo archivo |
| Comando | el de `prototipo_1/REPRODUCIR.md` | idéntico **salvo** `--add-dir` y la regla *deny* sobre la biblioteca |
| Modelo | fijado con `--model <id>` (el mismo en ambos; en la prueba n.º 1 la sesión usó `claude-sonnet-5-5` por defecto) | el mismo |
| Herramientas | `Read, Grep, Glob, Skill, Write, Edit`; sin Bash ni red | las mismas |
| Versiones | Claude Code, Node, Playwright y Chromium registrados antes | las mismas (misma máquina y misma sesión del orquestador) |
| Carpetas / sesiones | carpeta y `--session-id` propios; `--no-session-persistence` | carpeta y sesión distintas; **nunca** se le muestra el resultado de A |
| Recursos | sin imágenes externas, sin CDN, sin npm | iguales |

- **Repeticiones:** al menos **3 ejecuciones por brazo** (los modelos varían entre ejecuciones); orden alterno A, B, A, B, A, B. El prototipo n.º 1 puede contarse como A₁ **solo** si el modelo y la versión de Claude Code coinciden con las del resto.
- Para comprobar que el brazo B no recibe conocimiento de la biblioteca: el evento `init` de B no debe listar `web-library-router` ni las otras Skills de la biblioteca.

## 2. Métricas técnicas (automáticas, mismas herramientas para todos)
Herramienta: `integration/tools/prueba_web_playwright.mjs` (genérica) + `prototipo_1/herramientas_prueba/extra.mjs` adaptado.
| # | Métrica | Mejor si |
|---|---|---|
| T1 | Errores de consola y excepciones JS | 0 |
| T2 | Peticiones fallidas | 0 |
| T3 | Desbordamiento horizontal a 320, 375, 768 y 1440 px | ninguno |
| T4 | Cabecera en una fila a 320 y 375 px (altura y posición de sus elementos) | sí |
| T5 | Paradas de foco con indicador visible (% de 25 tabulaciones) y enlace de salto | 100 %, sí |
| T6 | Con `prefers-reduced-motion: reduce`: elementos ocultos al cargar y animaciones activas | 0 y 0 |
| T7 | Contenido visible sin JS (JS desactivado: elementos de `main` con opacidad < 0,99) | 0 |
| T8 | Formulario: errores con texto, foco al primer error, 0 peticiones de red | sí |
| T9 | Contraste: pares que no cumplen AA (medibles) y pares no medibles | 0 y pocos |
| T10 | Laboratorio: LCP, CLS, KB transferidos, nodos DOM (misma máquina, sin limitación) | menor; CLS ≤ 0,1 |
| T11 | Lighthouse (solo si se autoriza instalarlo): rendimiento, accesibilidad, buenas prácticas, SEO | mayor |

## 3. Evaluación visual (a ciegas)
> **Lote 20:** en encargos cinematográficos, esta rúbrica se sustituye por los criterios C1–C3 de `testing/EVAL-001-criterios-fidelidad-visual-movimiento-calidad-creativa.md` (fidelidad visual, fidelidad de movimiento y calidad creativa), con referencia o storyboard previo.
- Capturas de 1440, 768 y 375 px (inicio y página completa) de cada ejecución, renombradas con un código aleatorio por una persona o proceso distinto del que puntúa; la tabla de correspondencias se guarda aparte hasta terminar.
- Rúbrica 1–5 por criterio: jerarquía visual · tipografía · color y composición · calidad del héroe · comportamiento móvil · utilidad comercial (CTA, precios, horario, contacto) · accesibilidad percibida · coherencia de marca.
- **Animaciones:** solo puntuables con grabación de vídeo (`recordVideo` de Playwright) revisada por una persona; si no, **NO VERIFICADO** (no se puntúa).
- Puntuación por dos evaluadores si es posible; se informa la media y la discrepancia.

## 4. Métricas de proceso (solo informativas)
Fichas leídas, IDs citados sin leer, registro CONSULTA creado, adaptaciones declaradas (A); turnos, duración y cuota consumida (A y B).

## 5. Regla de decisión (fijada antes)
- "La biblioteca mejora" solo si, de media sobre las ejecuciones, A **no empeora ninguna** métrica crítica (T1, T3, T6, T7, T8) y mejora el total técnico **o** la media visual en ≥ 0,5 puntos, con la misma tendencia en la mayoría de pares A/B.
- Con 3 ejecuciones por brazo el resultado es **indicativo**, no estadísticamente concluyente; se informará así.
- Cualquier resultado (mejor, igual o peor) se publica.

## 6. Pendiente de autorización
1. ~~B₁~~ (hecho en el lote 19). Ejecutar las 4 construcciones restantes, preferiblemente sobre el stack de `PLAN_ASTRO_GSAP.md`.
2. Instalar Astro + GSAP (+ Lighthouse) en las carpetas temporales si se quiere comparar con el stack preferido; en ese caso ambos brazos deben tener las mismas dependencias.
