# Integración con Claude Code — guía de preparación (estado: PROPUESTO, no probada)

> Nada de esta guía se ha ejecutado. No instala nada ni modifica proyectos por sí sola. La integración **no está VALIDADA**: primero la prueba mínima de solo lectura (`MINIMAL_INTEGRATION_TEST.md`) y después las tres pruebas de `RETRIEVAL_TESTS.md`, en un entorno aislado. Sustituye a `IMPORT_GUIDE.md` como referencia principal (se conserva como histórico).
>
> **Lote 24 (v0.24.0):** gramática de movimiento cinematográfico (MOT-001, CONT-001, TRN-001, CAM-003) y tres recetas con microdemos medidas (`recetas/`, `evidence/demos/2026-11-01-lote24/`); herramienta `tools/medir_escena_scroll.mjs`.
> **Lote 28 (v0.28.0):** primeros vídeos de YouTube estudiados (`YOUTUBE_ESTUDIOS.md`); variante `plantillas/rec003_recursos/index_flip.html` (Flip.fit + expoScale); evidencias en `evidence/youtube/2026-11-03-lote28/`.
> **Lote 27 (v0.27.0):** contrato de recursos de IA (`contratos/`), `tools/preparar_recursos.py`, integración por manifiesto `plantillas/rec003_recursos/` y AIIMG-001; evidencias en `evidence/demos/2026-11-02-lote27/`.
> **Lote 26 (v0.26.0):** GSAP 3.15.0 ejecutado en las 3 recetas; plantilla verificada `plantillas/escena_gsap/`; `tools/validar_gsap.mjs` y `tools/diferencias.py` (sustituyen a `comparar_nativo_gsap.mjs`); evidencias en `evidence/demos/2026-11-02-lote26/`.
> **Lote 25 (v0.25.0):** auditoría visual de escenas (`tools/auditoria_visual_escena.mjs`, `tools/cortes_video.py`; AUD-001), comparador nativo frente a GSAP preparado (`tools/comparar_nativo_gsap.mjs`; GS-005, **GSAP sin instalar**), SEQ-003, MASK-002, MOT-002, COMP-001 y apartado 7b de dirección artística en las recetas.
>
> **Lote 23 (v0.23.0):** Hito A preparado y **no ejecutado** (sin autorización R1/R1b): `INFORME_VIABILIDAD_HITO_A.md`, `blender/hitoA_navaja.py`, `blender/listar_dispositivos.py`, `blender/composicion_hitoA.html`.
>
> **Lote 22 (v0.22.0):** hitos A → B → C (`PLAN_LOTE22_HITOS_ABC.md`): especificación del fotograma de producto, prueba de movimiento (apertura de 36 fotogramas), integración con GSAP, presupuesto y autorizaciones; pruebas K7–K9 y limpieza en `PLAN_ASTRO_GSAP.md` §2d–2e.
>
> **Lote 21 (v0.21.0):** estrategia de recursos visuales (`ESTRATEGIA_RECURSOS_VISUALES.md`), plan de la prueba Actos I→II (`PLAN_PRUEBA_ACTO_I_II.md`), procedimiento de instalación de Astro + GSAP con un lockfile resuelto sin instalar (`PLAN_ASTRO_GSAP.md` §2b–2c), herramienta `curvas_scroll.mjs`.
>
> **Lote 20 (v0.20.0):** referencia Enky auditada (`evidence/visual/2026-10-27-lote20-enky/`); criterios obligatorios C1–C3 en `testing/EVAL-001`; briefing y storyboard del prototipo n.º 2 en `BRIEFING_STORYBOARD_PROTOTIPO_2.md` (no implementado); herramienta `composicion_captura.py`.
>
> **Lote 19 (v0.19.0):** control B1 sin biblioteca y comparación exploratoria con A1 (`evidence/integration/2026-10-27/comparacion_A1_B1/`); plan Astro + GSAP en `PLAN_ASTRO_GSAP.md` (nada instalado); herramientas `extra_generico.mjs` y `contraste_compuesto.mjs`.
>
> **Lote 18 (v0.18.0):** primera construcción real (prototipo n.º 1, HTML/CSS/JS) con activación automática y pruebas Playwright; comparación con/sin biblioteca diseñada en `COMPARACION_CON_SIN_BIBLIOTECA.md`; versiones vigentes en `VERSIONES_VIGENTES.md`.
>
> **Lote 17 (v0.17.0):** prueba n.º 5 superada — **recuperación automática demostrada en Linux aislado** con `--add-dir` (Claude Code 2.1.311). Pendiente: Windows, implementación real en un proyecto aislado, comparación con/sin biblioteca.
>
> **Lote 16 (v0.16.0):** prueba n.º 4 — activación automática otra vez confirmada; recuperación parcial (ver `MINIMAL_INTEGRATION_TEST.md`). Mantenimiento: `MANTENIMIENTO.md`.
>
> **Lote 15 (v0.15.0):** prueba n.º 3 — la Skill se **activó sola** ante un encargo natural (confirmado una vez), pero el uso de las fichas fue parcial; Skill corregida, sin probar.
>
> **Lote 14 (v0.14.1):** prueba n.º 2 superada — lectura e **invocación manual** de `web-library-router` PROBADAS EN ENTORNO AISLADO con `--add-dir` (Linux, Claude Code 2.1.311). Siguen sin demostrar: activación automática, Windows, calidad de las webs.
>
> **Revisión del lote 13 (v0.14.0):** prueba mínima ejecutada una vez (2026-10-27): lectura CONFIRMADA, carga de Skills con `--restricted` NO (ver §4 A y `MINIMAL_INTEGRATION_TEST.md`).
>
> **Revisión del lote 12 (v0.13.0):** convenciones de Skills contrastadas con la documentación vigente de Claude Code (2026-10-27); la ruta de la biblioteca ya no depende de una "variable" escrita en un documento; el script de copia deja de usar `robocopy /MIR` y por defecto solo simula.

## 1. Qué hay que instalar y qué no

| Pieza | Dónde vive | ¿Se instala? |
|---|---|---|
| Fichas, índice, manifiesto, evidencias | Carpeta de la biblioteca (ruta fija) | **No** — Claude Code las lee desde su ruta |
| 4 Skills | `skills/` (fuente) y `.claude/skills/` (espejo idéntico, comprobado por `library_check.py`) | **No en el modo recomendado** (§4-A) |
| Línea en `CLAUDE.md` | Solo si se copian las Skills fuera de la biblioteca (§4-B/C) | Solo en un proyecto de prueba |

Las Skills son **finas**: contienen el procedimiento y remiten a las fichas. Actualizar fichas no exige tocar las Skills.

## 2. Cómo se resuelve la ruta real de la biblioteca

Problema detectado: escribir `WEB_LIBRARY_PATH=…` en un documento no garantiza nada; Claude Code no "define" esa variable, solo lee texto.

Solución (por orden de preferencia):
1. **`${CLAUDE_SKILL_DIR}`** — sustitución oficial de Claude Code: se reemplaza por la carpeta real que contiene el `SKILL.md`. Si las Skills se cargan desde `<biblioteca>/.claude/skills/<skill>/`, la raíz es `${CLAUDE_SKILL_DIR}/../../..`. Así la ruta la calcula Claude Code, no un documento. Cada `SKILL.md` empieza por esta resolución y **exige** leer `LIB/KNOWLEDGE_INDEX.md` (y detenerse si no existe).
2. **Ruta literal en `CLAUDE.md`** (solo si la Skill se copia fuera de la biblioteca): una línea `WEB_LIBRARY_ROOT=C:/knowledge/WEB_ENGINEERING_KNOWLEDGE_LIBRARY` — absoluta, con `/`, sin `~`, sin espacios, fuera de OneDrive. La Skill la usa y comprueba igualmente que el índice existe.
3. La variable antigua `WEB_LIBRARY_PATH` queda **retirada** de las Skills.

## 3. Archivos de recuperación

- `KNOWLEDGE_INDEX.md` — índice humano y "Búsqueda por necesidad".
- `integration/LIBRARY_MANIFEST.json` — índice para máquina (generado por `integration/tools/library_check.py --write-manifest`).
- `architecture/ARCH-001-receta-pagina-completa.md` — orden de decisiones.
- `integration/RETRIEVAL_PROCEDURE.md` — cómo leer poco y bien.
- `integration/CONSULTA_BIBLIOTECA_TEMPLATE.md` — formato de evidencias.
- `integration/MINIMAL_INTEGRATION_TEST.md` + `integration/tools/verify_test_evidence.py` — prueba mínima de solo lectura y su verificador.
- `integration/RETRIEVAL_TESTS.md` — tres pruebas completas.

## 4. Modos de uso (A probado en entorno aislado el 2026-10-27 para lectura e invocación manual; el resto sin probar)

- **A. Sin instalar nada — recomendado.** Abrir Claude Code en la carpeta del proyecto y añadir la biblioteca a la sesión: `claude --add-dir C:/knowledge/WEB_ENGINEERING_KNOWLEDGE_LIBRARY`. Según la documentación, las Skills de `.claude/skills/` de un directorio añadido con `--add-dir` se cargan **solo durante esa sesión** (también en `--bare`). No se toca `%USERPROFILE%\.claude`, ni se copia nada. Actualizar = sustituir la carpeta de la biblioteca.
  - **Observado (prueba mínima 2026-10-27):** con `--add-dir` Claude Code leyó la biblioteca sin problemas, pero en combinación con `--restricted` **las Skills no se cargaron** (esas Skills llegan por la fuente de configuración `project`, que `--restricted` no lee; tampoco cargan con `--setting-sources` que excluya `project`). `--bare` no autentica con suscripción (solo clave de API). Para sesiones normales no hace falta ningún indicador extra; para pruebas aisladas, el comando de `MINIMAL_INTEGRATION_TEST.md`.
  - Si la Skill no aparece en `/skills`, el respaldo es pedir a Claude Code que lea `LIB/.claude/skills/web-library-router/SKILL.md` y lo siga (lo hizo por sí solo en la prueba), indicando la raíz real de la biblioteca.
- **B. Skills de proyecto copiadas.** `integration/tools/sync_skills.ps1` (revisado en el lote 12): **simulación por defecto**, `-Apply` para copiar; escribe solo en `<Proyecto>\.claude\skills`; **rechaza** la carpeta personal `%USERPROFILE%\.claude\skills`, cualquier destino que sea una unión o enlace, y cualquier carpeta existente con el mismo nombre que no lleve la marca `.web-library-skill`; ya **no usa `robocopy /MIR`** (borraba en el destino lo que no estuviera en el origen) y se detiene ante el primer error. Requiere la línea `WEB_LIBRARY_ROOT=` en el `CLAUDE.md` del proyecto (§2.2). Actualizar = volver a ejecutar el script.
- **C. Enlaces simbólicos.** La documentación indica que una entrada de `.claude/skills/<skill>` puede ser un enlace simbólico a otra carpeta (Claude Code lee el `SKILL.md` del destino). En Windows, crear enlaces simbólicos puede requerir el modo desarrollador o permisos; las uniones de directorio (*junction*) **no** están mencionadas en la documentación → no recomendadas hasta probarlas. Si se usa, `${CLAUDE_SKILL_DIR}` podría apuntar al enlace y no al destino: **verificar** en la prueba mínima.
- **D. Plugin.** La documentación permite distribuir Skills como plugin (`<plugin>/skills/`, invocadas como `/plugin:skill`); no se ha preparado: requiere estudiar la doc de plugins.
- **Nunca** en esta fase: escribir en la carpeta personal de Skills ni en la configuración global.

## 5. Convenciones de Skills verificadas (docs de Claude Code, 2026-10-27)

| Convención | Estado en las 4 Skills |
|---|---|
| Frontmatter YAML en la primera línea, entre `---` | ✔ (lo comprueba `library_check.py`) |
| `name` = nombre de la carpeta, sin `<` `>` ni caracteres de control | ✔ |
| `description` presente; `description` + `when_to_use` ≤ 1 536 caracteres en el listado | ✔ (314–407 caracteres) |
| `SKILL.md` < 500 líneas; material extenso en archivos aparte | ✔ (las fichas están en la biblioteca) |
| Ubicaciones válidas: personal `~/.claude/skills`, proyecto `.claude/skills`, `--add-dir`, plugin | ✔ espejo `.claude/skills/` añadido |
| Sustituciones `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}` | usadas para resolver LIB |
| `allowed-tools` | `web-library-router`: `Read Grep Glob` (solo lectura sin preguntar) |
| Comprobar Skills cargadas: `/skills`; validar frontmatter: `claude plugin validate .claude/skills` (v2.1.233+) | indicado en la prueba mínima |

## 6. Flujo esperado y evidencias

1. `web-library-router` → perfil A/B, necesidades, ≤ 12 fichas por fase, registro con la plantilla.
2. `web-commercial-site` o `web-cinematic-site` → construcción siguiendo ARCH-001.
3. `web-qa-validation` → pruebas.
4. Evidencias: `CONSULTA_BIBLIOTECA.md` (o en la respuesta si la sesión es de solo lectura) + salida `stream-json` verificable con `verify_test_evidence.py`.

## 7. Orden de pruebas

1. `MINIMAL_INTEGRATION_TEST.md` (solo lectura, carpeta temporal, sin instalar).
2. `RETRIEVAL_TESTS.md` (barbería, landing GSAP+Three.js, revisión Next.js) en carpeta aislada.
3. Solo con ambas superadas y revisadas: estado "VALIDADO" de la integración.

## 8. Mantenimiento de la biblioteca

- Editar las Skills **en `skills/`** y copiar a `.claude/skills/` (el comprobador falla si difieren).
- Nueva ficha: plantilla `_templates/FICHA_TECNICA.md`, ID único, fila en `KNOWLEDGE_INDEX.md`, registro en `SOURCE_CATALOG.json`/`VIDEO_RESEARCH_INDEX.json`, regenerar el manifiesto.
- Estados IMPLEMENTADO/VALIDADO solo con evidencia enlazada.
- Ejecutar `library_check.py` antes de publicar cada versión (0 errores).
