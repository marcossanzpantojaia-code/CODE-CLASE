# AI_CINEMATIC_VIDEO_ENGINE

Motor de edición de vídeo automatizada (barberías, formato 9:16) orquestado por Claude Code:
FFmpeg para ingestión, color, audio y QA; Remotion para composición y motion graphics;
un sidecar Python (librosa) para el análisis rítmico. Un **manifiesto JSON de edición** es la
única fuente de verdad: cualquier render se regenera a partir de él.

> **Estado:** Fase 1 (auditoría) PARCIAL — falta auditar el PC Windows de producción.
> Fase 2 (infraestructura) — ver [`docs/FASE_2_INFRAESTRUCTURA.md`](docs/FASE_2_INFRAESTRUCTURA.md).

## Instalación

Todo queda dentro de esta carpeta (`node_modules/`, `.venv/`, `.cache/`); nada global.

### Linux (verificado en Ubuntu 24.04)

```bash
npm install                                   # .npmrc fija legacy-peer-deps (ver comentario allí)
python3 -m venv .venv
.venv/bin/pip install -r python/requirements.txt
bash scripts/fetch-browser-linux.sh           # solo si remotion.media no es accesible
```

### Windows (NO VERIFICADO todavía)

Requisitos: Node.js 22 LTS, FFmpeg con `zscale` (build "full"), Python 3.12+ y Git.
`scripts/audit-env.ps1` comprueba todo lo anterior sin instalar nada.

```powershell
npm install
py -m venv .venv
.venv\Scripts\pip install -r python\requirements.txt
# Remotion descarga Chrome Headless Shell solo en el primer render.
```

## Uso

```bash
npm run engine -- render edit-decisions/exp01.json            # preview 540×960 + QA técnico
npm run engine -- render edit-decisions/exp01.json --final    # final 1080×1920 + QA técnico
npm run engine -- qa previews/<video>.mp4 edit-decisions/exp01.json
npm run engine -- ingest edit-decisions/exp01.json            # solo intermedios y avisos
npm run engine -- beats assets/music/<pista>.wav              # tempo y beats
npm run exp01                                                 # experimento EXP-01 completo
npm test && npm run typecheck
npm run studio -- --props=cache/render/<render>/props.json    # previsualizar en Remotion Studio
```

Cada render deja junto al MP4:
- `<video>.render.json`: parámetros, versiones de herramientas, tiempos, hashes y notas de ingesta.
- `<video>.qa/`: `qa.md`/`qa.json` y contact sheets (fuera de git: contienen fotogramas del metraje).

Logs de ejecución en `logs/<runId>.jsonl` (comandos FFmpeg completos, duraciones, códigos de salida).

## Estructura

```
assets/          originales, música, logos, sfx — solo lectura, fuera de git
edit-decisions/  manifiestos (en git)
analysis/        ingesta y análisis (regenerable)
cache/           intermedios, mezclas de audio, bundles (regenerable)
previews/ exports/  renders (fuera de git)
reports/         informes de experimentos (en git, solo material sintético)
src/core/        manifiesto (zod), rutas protegidas, procesos, logs, ffprobe
src/ingest/      importación sin sobrescritura e intermedios normalizados
src/audio/       beats (librosa) y mezcla con loudnorm
src/remotion/    composición: planos, zoom/pan, zoom-through, títulos, cierre con logo
src/rendering/   orquestación del render y mux
src/qa/          validación técnica automática
experiments/exp01/  experimento con ground truth sintético
python/          sidecar de análisis rítmico
```

## Reglas del proyecto

- Los originales (`assets/`) nunca se modifican ni se suben a git; toda escritura pasa por `assertWritable`.
- Nada se instala sin autorización explícita.
- Implementado ≠ validado: cada fase declara qué se ha medido y qué no.
- Ningún render es apto para publicar sin revisión visual humana.
