# AI_CINEMATIC_VIDEO_ENGINE

Motor de edición de vídeo automatizada (barberías, formato 9:16) orquestado por Claude Code:
FFmpeg para ingestión, color, audio y QA; Remotion para composición y motion graphics;
un sidecar Python para análisis de ritmo y movimiento. Un manifiesto JSON de edición es la
única fuente de verdad y permite regenerar cualquier render.

> **Estado: Fase 1 (auditoría) PARCIAL.** Auditado el contenedor en la nube donde se ejecuta
> Claude Code; falta auditar el equipo Windows de producción. Todavía no hay código del motor.
> Detalle: [`docs/FASE_1_AUDITORIA.md`](docs/FASE_1_AUDITORIA.md).

## Auditoría de entorno (solo lectura)

```bash
# Linux / macOS
bash scripts/audit-env.sh --network > reports/env-audit.txt
```

```powershell
# Windows (NO VERIFICADO todavía)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\audit-env.ps1 > env-audit-windows.txt
```

Ninguno de los dos instala ni modifica nada. `-ExecutionPolicy Bypass` afecta solo a ese proceso.

## Reglas del proyecto

- Los originales (`assets/`) nunca se modifican ni se suben a git.
- Nada se instala sin autorización explícita.
- Implementado ≠ validado: cada fase declara qué se ha medido y qué no.
