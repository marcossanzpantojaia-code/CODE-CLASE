# Registro — prueba mínima de integración de solo lectura (ejecutada una vez, 2026-10-27)

Autorización: directiva del orquestador "FASE DE VALIDACIÓN" (una única prueba, solo lectura, v0.13.0).

## Entorno [OBS]
- Contenedor Linux en la nube de la sesión de Cowork (no el Windows del usuario).
- Claude Code **2.1.311** (`claude --version`); autenticación `oauth_token` (`claude auth status`); modelo de la sesión hija: `claude-sonnet-5-5` (evento `init`).
- Biblioteca: **copia** descomprimida de `WEB_ENGINEERING_KNOWLEDGE_LIBRARY_v0.13.0.zip` en una carpeta temporal; la biblioteca original no se usó. sha256 de los 229 archivos de la copia idéntico antes y después (`integridad_copia_biblioteca.txt`).
- Proyecto: carpeta `sandbox/` vacía, creada para la prueba; sigue vacía al terminar.
- Inicio 2026-10-27T00:09:47Z; fin 00:10:59Z; 15 turnos; 65,6 s.

## Paso previo: `--bare` [OBS]
`claude -p --bare --tools "" …` → `"Authentication error"`, `duration_api_ms: 0`, `total_cost_usd: 0` (`bare_check.json`).
La documentación de la CLI dice que en `--bare` la autenticación de Anthropic es solo `ANTHROPIC_API_KEY` o `apiKeyHelper`; con sesión OAuth (suscripción) **`--bare` queda BLOQUEADO**. Usar una clave de API supondría cargos → descartado.

## Comando ejecutado (sustituto de `--bare`)
```
claude -p --restricted --tools "Read,Grep,Glob,Skill" --add-dir <copia_biblioteca>
  --permission-mode plan --permission-prompts none --strict-mcp-config --no-chrome
  --no-session-persistence --session-id <uuid nuevo> --max-budget-usd 3
  --output-format stream-json --verbose "<prompt.txt>"  > evidencia_prueba.jsonl
```
Herramientas disponibles según `init`: `Glob, Grep, Read, Skill` (sin escritura ni ejecución). El prompt **no nombraba la Skill** (pedía comprobar qué Skills de webs había), para medir el descubrimiento.

## Consumo [OBS en `rate_limit_event`]
`isUsingOverage: false`, `overageStatus: rejected` (exceso desactivado a nivel de organización) → sin cargos adicionales posibles. Ventana de 5 h: utilización 0,49 → 0,50. `total_cost_usd: 0.378` es la estimación equivalente de API que imprime la CLI, no un cobro.

## Resultados por criterio
| # | Criterio de la directiva | Resultado | Evidencia |
|---|---|---|---|
| 1 | Carpeta aislada | **CONFIRMADO** | `cwd` = sandbox; un `Glob` fuera de las carpetas permitidas fue **denegado** (`permission_denials`) |
| 2 | Claude Code disponible y opciones admitidas | **CONFIRMADO** (2.1.311); `--bare` **BLOQUEADO** por autenticación OAuth | `claude --help`, `bare_check.json` |
| 3 | `--add-dir` expone la biblioteca | **CONFIRMADO** para archivos (`additional_directories` en `init`, 11 lecturas reales) | `evidencia_prueba.jsonl` |
| 4 | Descubre la Skill `web-library-router` | **NO — BLOQUEADO en esta configuración**: no figura en `skills` de `init`; `Skill(web-library-router)` → `Unknown skill`. Claude Code lo declaró y, como alternativa, leyó el SKILL.md con Read y siguió su procedimiento a mano | `init.skills`, tool_result con `is_error: true`, `respuesta_final.md` §1 |
| 4b | Causa | **REPORTADA por la documentación, NO VERIFICADA con otra ejecución**: las Skills de un `--add-dir` se cargan por la fuente de configuración `project`; `--restricted` carga solo la configuración gestionada y `--settings` → excluye esa fuente | code.claude.com/docs/en/permissions ("Additional directories grant file access, not configuration") y /cli-reference (`--restricted`) |
| 5 | Pide conocimientos para barbería con animaciones cinematográficas | **CONFIRMADO** | `prompt.txt` |
| 6 | Lee ≥ 5 fichas reales | **CONFIRMADO**: LEGAL-001, SEO-003, GL-006, ST-001, A11Y-001 (+ KNOWLEDGE_INDEX, manifiesto, plantilla, guía) | tool_use Read |
| 7 | Rutas exactas e IDs | **REPORTADO** con matiz: da la raíz absoluta una vez y cada ficha como `LIB/<ruta>`; IDs correctos | `respuesta_final.md` §3–4 |
| 8 | Recomendaciones fieles a las fichas | **CONFIRMADO por revisión humana (mía)**: contrasté cada decisión con el campo citado (p. ej. LEGAL-001 §6 "misma capa y al mismo nivel", §9 "24 meses"; SEO-003 §5 NAP; GL-006 §3 bucle único; ST-001 §9 `clamp(top 80%)`; A11Y-001 §10 `opacity: 0`). Distingue lo documentado de lo no probado y no presenta nada como VALIDADO | grep de las fichas, este registro |
| 9 | Evidencias + verificador | Verificador v1: "SUPERA" → **falso positivo** (contaba la llamada a Skill aunque devolviera error). Corregido (v2, lote 13): **NO SUPERA** (2 criterios de Skill fallan; los 6 de lectura pasan) | `verificador_v1_salida.txt`, `verificador_v2_salida.txt` |
| 10 | Problema adicional detectado | El manifiesto (55 KB, formato con sangría) **se truncó** en Read (930 de 1240 líneas): Claude Code no vio TJ-001 y lo dijo | `respuesta_final.md` §4 |

## Veredicto
- **Acceso de lectura a la biblioteca desde Claude Code: CONFIRMADO** en entorno aislado (lecturas reales, rutas existentes, versión citada, decisiones fieles a las fichas).
- **Descubrimiento automático de la Skill vía `--add-dir`: NO CONFIRMADO** — bloqueado por la combinación `--restricted` + `--add-dir`; causa según documentación, no verificada.
- **Integración: NO VALIDADA.** Esto no demuestra que Claude Code construya bien webs con la biblioteca.

## Correcciones aplicadas en v0.14.0 (no ejecutadas de nuevo)
1. `verify_test_evidence.py`: exige la Skill en `init` y un tool_result sin error.
2. `LIBRARY_MANIFEST.json`: formato de columnas, una ficha por línea (≈ 29 KB con 125 fichas, sin campo de evidencia); `library_check.py` avisa si supera 35 KB.
3. `MINIMAL_INTEGRATION_TEST.md`: comando corregido sin `--bare` ni `--restricted` (ver documento) — **pendiente de autorización para ejecutarlo**.
4. Skill `web-library-router`: instrucción para comprobar `total_fichas` del manifiesto y leer por tramos si se trunca.

**Reproducir la verificación:** el verificador compara rutas absolutas, así que debe recibir la misma copia de la biblioteca usada en la prueba (`…/itest/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY`, no conservada en el ZIP). Con otra ruta, los criterios de lectura salen como "lecturas fuera de la biblioteca".
