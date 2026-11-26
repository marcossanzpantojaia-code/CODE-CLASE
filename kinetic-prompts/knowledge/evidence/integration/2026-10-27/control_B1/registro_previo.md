# Registro previo a la ejecución B1 (control SIN biblioteca) — 2026-10-27T11:47:58Z

## Condiciones replicadas de A1
| Elemento | A1 (con biblioteca) | B1 (sin biblioteca) |
|---|---|---|
| Claude Code | 2.1.311 | 2.1.311 |
| Modelo | claude-sonnet-5-5 (por defecto, según `init`) | `--model claude-sonnet-5-5` (fijado explícitamente: mismo identificador) |
| Prompt | prompt.txt sha256 6ec0d8dd…f8e0b | mismo archivo, sha256 6ec0d8ddee6c7a91b9df7863b564b4552f86ce0d4c391647fd2affb313ef8e0b |
| Herramientas | Read, Grep, Glob, Skill, Write, Edit | iguales |
| Modo de permisos | acceptEdits, --permission-prompts none, --setting-sources project, --strict-mcp-config, --no-chrome, --no-session-persistence, --max-budget-usd 6, --allowedTools "Skill(web-library-router)" | iguales |
| Biblioteca | --add-dir copia v0.17.0 + deny Edit/Write sobre ella | **sin --add-dir**; deny de Read/Glob/Grep sobre /home/claude (biblioteca y A1), /mnt/user-data y copias en el espacio temporal |
| Carpeta | build1/proyecto (borrada tras archivar) | b1/proyecto (nueva, vacía) |
| Restricciones del entorno | sin npm, sin red, sin CDN, sin terminal | iguales |

## Diferencias conocidas (no eliminables)
- A1 usó el modelo por defecto; B1 lo fija con --model (mismo id). Variabilidad propia del modelo entre ejecuciones: una sola ejecución por brazo → comparación **exploratoria**.
- B1 se ejecuta ~1 h después que A1 (posibles cambios de servicio no observables).
- En B1 la herramienta Skill solo ve Skills integradas (comprobación en `init`: no debe aparecer ninguna web-*).

## Criterios de comparación (fijados antes)
Batería idéntica para A1 y B1 (herramienta genérica `integration/tools/prueba_web_playwright.mjs` + `extra_generico.mjs`): T1 errores de consola/JS; T2 recursos fallidos; T3 desbordamiento 320/375/768/1440; T4 cabecera en una fila a 320/375; T5 foco visible (25 tabulaciones) y enlace de salto; T6 reduced motion (ocultos y animaciones); T7 contenido visible sin JS; T8 formulario (errores con texto, foco, 0 peticiones); T9 contraste (fallos AA y no medidos); T10 laboratorio (LCP, CLS, KB, nodos). Evaluación visual con rúbrica 1–5 (jerarquía, tipografía, color/composición, héroe, móvil, utilidad comercial, accesibilidad percibida, coherencia de marca) sobre capturas con identificadores anónimos. Animaciones: fotogramas extraídos de grabaciones; si no son fiables, NO VERIFICADO.
