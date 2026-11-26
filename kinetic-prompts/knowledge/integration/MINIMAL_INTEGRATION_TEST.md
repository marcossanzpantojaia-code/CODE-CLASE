# Pruebas de integración con Claude Code (estado: recuperación automática DEMOSTRADA en entorno Linux aislado — prueba n.º 5, 2026-10-27; integración en Windows, calidad de las webs y mejora frente a no usar la biblioteca: PENDIENTES)

Objetivo: comprobar que Claude Code **detecta** `web-library-router`, **localiza** la biblioteca, **recupera** 5 fichas pertinentes, **muestra** sus rutas exactas, **explica** las decisiones que extrae y deja **evidencias verificables** — sin instalar nada, sin tocar proyectos reales y sin cambiar la configuración global.

> Versión: la primera ejecución usó **v0.13.0**; la siguiente debe usar **v0.14.0** (manifiesto compacto y verificador corregido). Desde v0.13.0 la biblioteca incluye `.claude/skills/` (espejo idéntico de `skills/`, verificado por `library_check.py`). Con v0.12.0 el paso 1 fallaría por diseño: v0.12.0 no tenía esa carpeta y Claude Code no habría encontrado las Skills con `--add-dir`.

## Prueba n.º 5 — última repetición controlada (2026-10-27, v0.16.0)
Registro: [`evidence/integration/2026-10-27/prueba_automatica_5/REGISTRO_PRUEBA_AUTOMATICA_5.md`](../evidence/integration/2026-10-27/prueba_automatica_5/REGISTRO_PRUEBA_AUTOMATICA_5.md). Mismo encargo y comando; área `3d` obligatoria; verificador **SUPERA (24/24)**; revisión humana **conforme con una reserva** (dos detalles de conocimiento general colocados bajo FORM-001). Re-verificada sin la carpeta temporal original (traza + `--remap`): SUPERA.

### Trazabilidad para futuras pruebas (lote 17)
1. Antes de ejecutar: `criterios_previos.txt` con sha256 del ZIP y del verificador; copia del verificador usado.
2. Después, **antes de borrar la carpeta temporal**: `make_trace.py <copia> evidencia_prueba.jsonl <zip> traza.json` (rutas relativas a LIB, sha256 de cada archivo leído, versión, sha256 del manifiesto, del ZIP y de la evidencia) y `lib_before.sha`/`lib_after.sha`.
3. Re-verificar más tarde: descomprimir el mismo ZIP (comprobar su sha256 contra `traza.json`) y `verify_test_evidence.py <nueva_copia> evidencia_prueba.jsonl … --remap <raiz_original>=<nueva_copia>`.
4. Esto valida la **transcripción de las herramientas**; no demuestra ninguna implementación visual.

## Prueba n.º 4 — repetición controlada (2026-10-27, v0.15.0)
Registro: [`evidence/integration/2026-10-27/prueba_automatica_4/REGISTRO_PRUEBA_AUTOMATICA_4.md`](../evidence/integration/2026-10-27/prueba_automatica_4/REGISTRO_PRUEBA_AUTOMATICA_4.md). Mismo encargo y comando que la n.º 3; verificador endurecido (lote 16) con criterios fijados antes. Activación automática **CONFIRMADA**; recuperación **PARCIAL** (12 fichas de 5 áreas; sin manifiesto, sin ficha 3D, registro incompleto) → **NO SUPERADA**.
Verificación: `verify_test_evidence.py <copia> evidencia_prueba.jsonl --prompt prompt.txt --modo automatico --areas comercial,seo,accesibilidad,animacion,scroll,gsap,3d?` · Autoprueba del verificador: `selftest_verify.py <biblioteca>`.

## Prueba n.º 3 — activación automática (2026-10-27, v0.14.1)
Registro: [`evidence/integration/2026-10-27/prueba_automatica_3/REGISTRO_PRUEBA_AUTOMATICA_3.md`](../evidence/integration/2026-10-27/prueba_automatica_3/REGISTRO_PRUEBA_AUTOMATICA_3.md). Mismo comando, encargo natural sin mencionar la Skill. Activación automática **CONFIRMADA**; prueba **NO SUPERADA** (uso parcial: manifiesto no leído, sin rutas absolutas, 46 IDs citados sin leer). Verificar con `verify_test_evidence.py <copia> evidencia_prueba.jsonl --prompt prompt.txt --modo automatico`.

## Resultado de la segunda ejecución (2026-10-27, v0.14.0, Claude Code 2.1.311, contenedor Linux)
Registro: [`evidence/integration/2026-10-27/prueba_minima_2/REGISTRO_PRUEBA_MINIMA_2.md`](../evidence/integration/2026-10-27/prueba_minima_2/REGISTRO_PRUEBA_MINIMA_2.md).
- Con el comando corregido (sin `--bare` ni `--restricted`) la Skill **apareció en `init`**, la herramienta Skill la **invocó sin error**, `${CLAUDE_SKILL_DIR}` se sustituyó por la ruta real, el manifiesto se leyó **completo** y se leyeron 5 fichas; verificador: SUPERA; revisión humana: decisiones fieles a las fichas; copia intacta.
- Se añadió por precaución `--allowedTools "Skill(web-library-router)"` (aprueba solo esa Skill; con `--permission-prompts none` lo que pediría permiso se deniega). No se comprobó si sin ella la Skill habría sido denegada (incluido abajo).
- **No demostrado:** activación automática sin nombrar la Skill, Windows, calidad de las webs, mejora frente a no usar la biblioteca.

## Resultado de la primera ejecución (2026-10-27, v0.13.0, Claude Code 2.1.311, contenedor Linux)
Registro completo y evidencias: [`evidence/integration/2026-10-27/prueba_minima/REGISTRO_PRUEBA_MINIMA.md`](../evidence/integration/2026-10-27/prueba_minima/REGISTRO_PRUEBA_MINIMA.md).
- `--bare` **no autentica con una sesión OAuth** (suscripción): solo admite `ANTHROPIC_API_KEY`/`apiKeyHelper` → descartado (tendría coste).
- Se usó `--restricted` como sustituto → **las Skills del `--add-dir` no se cargaron** (`Unknown skill`). Según la documentación, esas Skills llegan por la fuente `project`, que `--restricted` no carga. Claude Code leyó el SKILL.md a mano y recuperó bien 5 fichas.
- El manifiesto se truncó al leerlo → formato compacto en v0.14.0.
- El verificador dio un falso positivo → corregido.

## Por qué así (convenciones vigentes de Claude Code, consultadas el 2026-10-27; revisado tras la ejecución)
- Las Skills de un directorio pasado con `--add-dir` se cargan **solo durante esa sesión** (`.claude/skills/` de ese directorio), incluso en modo `--bare` — documentación de Skills y referencia de la CLI de Claude Code.
- ~~`--bare`~~ **no sirve con suscripción** (ver resultado). En su lugar: `--setting-sources project` (no carga la configuración de usuario ni local; las Skills del `--add-dir` sí, porque van por `project`), `--strict-mcp-config` (sin servidores MCP) y `--tools` con solo herramientas de lectura.
- **No combinar `--add-dir` con `--restricted`**: excluye la fuente `project` y las Skills no se cargan (observado).
- `${CLAUDE_SKILL_DIR}` se sustituye por la carpeta real de la Skill → la Skill calcula la raíz real de la biblioteca (`${CLAUDE_SKILL_DIR}/../../..`); no depende de una variable escrita en un documento.
- `--tools "Read,Grep,Glob,Skill"` deja **solo** esas herramientas (las de escritura y ejecución no existen en la sesión); `--permission-mode plan` y `--permission-prompts none` (todo lo que pediría permiso se deniega) son capas adicionales.
- `--no-session-persistence` evita guardar la sesión.
Comprueba estos nombres con `claude --help` en la versión instalada antes de ejecutar; si alguno ha cambiado, anótalo en el registro.

## Preparación (Windows, PowerShell)
1. Descomprimir la biblioteca en `C:\knowledge\WEB_ENGINEERING_KNOWLEDGE_LIBRARY` (si ya existe una versión anterior, en otra carpeta, p. ej. `C:\knowledge\WEL_v0.14.0`).
2. (Opcional) Comprobar la biblioteca: `python C:\knowledge\WEB_ENGINEERING_KNOWLEDGE_LIBRARY\integration\tools\library_check.py C:\knowledge\WEB_ENGINEERING_KNOWLEDGE_LIBRARY` → debe decir `errores: 0`.
3. Crear una carpeta vacía de prueba: `New-Item -ItemType Directory C:\sandbox\wel-test` y entrar en ella (`Set-Location C:\sandbox\wel-test`). No usar una carpeta de proyecto real.

## Ejecución (un solo comando; no modifica nada fuera de la carpeta de prueba)
```powershell
$LIB = "C:/knowledge/WEB_ENGINEERING_KNOWLEDGE_LIBRARY"
$PROMPT = @"
/web-library-router
PRUEBA DE RECUPERACIÓN DE SOLO LECTURA. No escribas ni modifiques archivos.
1. Indica si has cargado la skill web-library-router y la carpeta real desde la que se cargó (valor resuelto de CLAUDE_SKILL_DIR).
2. Resuelve LIB, lee LIB/KNOWLEDGE_INDEX.md y copia literalmente su línea "Versión ...".
3. Encargos: (A) web comercial de una barbería en Madrid con reservas y cookies conformes en España; (B) landing cinematográfica con GSAP, scroll y Three.js. Usando LIB/integration/LIBRARY_MANIFEST.json, elige EXACTAMENTE 5 fichas en total (al menos 2 por encargo).
4. Lee cada ficha con la herramienta Read y muestra: ID, ruta absoluta exacta, estado y la línea ultima_revision.
5. Para cada ficha, explica 1–2 decisiones técnicas que aplicarías, citando el número de campo de la ficha del que salen, y distingue lo documentado de lo no probado.
6. Termina con un registro en el formato de LIB/integration/CONSULTA_BIBLIOTECA_TEMPLATE.md (secciones 1–4).
"@
claude -p --setting-sources project --strict-mcp-config --no-chrome `
  --tools "Read,Grep,Glob,Skill" --allowedTools "Skill(web-library-router)" --add-dir $LIB `
  --permission-mode plan --permission-prompts none `
  --no-session-persistence --output-format stream-json --verbose `
  $PROMPT > evidencia_prueba.jsonl
```
Notas:
- Comprobar antes con `claude --help` que existen `--setting-sources`, `--tools` y `--permission-prompts` (presentes en 2.1.311).
- Primera línea del prompt: en la ejecución del 2026-10-27 se pidió descubrir la Skill **sin nombrarla**; si se quiere forzarla, empezar por `/web-library-router`.
- Las Skills de `--add-dir` aparecen en el campo `skills` del evento `init` del JSONL: es la primera comprobación.
- La única escritura es la redirección `> evidencia_prueba.jsonl` de PowerShell dentro de la carpeta de prueba.

## Verificación de las evidencias
```powershell
python "$LIB/integration/tools/verify_test_evidence.py" $LIB .\evidencia_prueba.jsonl
```
Criterios automáticos (todos deben dar OK):
1. Skill `web-library-router` registrada (evento `init`) e invocada **sin error** (corrección del lote 13: antes bastaba la llamada).
2. `KNOWLEDGE_INDEX.md` leído con la herramienta Read.
3. ≥ 5 fichas del manifiesto leídas.
4. Todas las rutas leídas existen dentro de la biblioteca.
5. Ninguna herramienta de escritura/ejecución usada.
6. La respuesta cita la versión real del índice.
7. La respuesta cita los IDs leídos.

Revisión humana (además): las 5 fichas son pertinentes (p. ej. A: LEGAL-001, SEO-003, COPY-001; B: GL-006, WGPU-001); cada decisión cita un campo real de la ficha; no presenta como VALIDADO nada que la ficha marque como INVESTIGADO/PROPUESTO.

## Resultado esperado y registro
- Si todo pasa: la integración de **lectura** queda "PROBADA EN ENTORNO AISLADO" (no VALIDADA para construir webs; eso exige las tres pruebas de `RETRIEVAL_TESTS.md`).
- Guardar `evidencia_prueba.jsonl` y la salida del verificador en `evidence/integration/<fecha>/` de la biblioteca.

| Fecha | Versión de Claude Code | Versión de la biblioteca | ¿`--bare`? | Veredicto automático | Revisión humana |
|---|---|---|---|---|---|
| 2026-10-27 | 2.1.311 (Linux, OAuth) | v0.13.0 (copia) | No (bloqueado) → `--restricted` | v1: SUPERA (falso positivo) · v2: **NO SUPERA** (Skill no cargada) | Lectura y fidelidad CONFIRMADAS; Skill NO descubierta |
| 2026-10-27 | 2.1.311 (Linux, suscripción) | v0.14.0 (copia) | No → `--setting-sources project` | **SUPERA** (8/8; 10/10 con el verificador ampliado) | Decisiones fieles; Skill invocada a mano; copia intacta |
| 2026-10-27 | 2.1.311 (Linux, suscripción) | v0.14.1 (copia) | No | Prueba automática: **NO SUPERA** (11/13; activación automática OK) | Uso parcial; 46 IDs citados sin leer |
| 2026-10-27 | 2.1.311 (Linux, suscripción) | v0.15.0 (copia) | No | Automática endurecida: **NO SUPERA** (19/24) | 12 fichas, 5 áreas; sin manifiesto ni ficha 3D; registro incompleto |
| 2026-10-27 | 2.1.311 (Linux, suscripción) | v0.16.0 (copia del ZIP) | No | Automática: **SUPERA (24/24)** | Conforme con una reserva; recuperación automática demostrada (Linux aislado) |

## Limpieza
Borrar `C:\sandbox\wel-test`. No queda nada instalado: las Skills solo existieron durante la sesión.
