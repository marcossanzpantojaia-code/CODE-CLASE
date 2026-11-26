# Protocolo de mantenimiento de la biblioteca (desde v0.16.0)

Motivo: en el lote 15 se ejecutó por error un script antiguo que sobrescribió `SOURCE_CATALOG.json` y `CHANNEL_COVERAGE.md` con datos de la v0.8.0 (se restauraron desde el ZIP anterior). Este protocolo evita repetirlo.

## Antes de cualquier cambio
1. **Copia íntegra** de la carpeta de trabajo (p. ej. `tar czf WEL_pre_<lote>_<fecha>.tgz WEB_ENGINEERING_KNOWLEDGE_LIBRARY`) fuera de la biblioteca.
2. Tener a mano la **versión publicada anterior** descomprimida en otra carpeta (será la *baseline*).

## Durante
- Usar **solo** las herramientas de `integration/tools/` (versionadas con la biblioteca). **No ejecutar** scripts sueltos de sesiones anteriores: los de los lotes 4–12 se apartaron a una carpeta `obsoletos/` fuera de la biblioteca.
- Editar fichas con cambios localizados (sustituir un texto concreto o añadir un apéndice); no regenerar archivos de control completos salvo con las funciones de `library_check.py`.
- Las Skills se editan en `skills/` y se copian idénticas a `.claude/skills/`.

## Después (obligatorio antes de empaquetar)
```
python integration/tools/library_check.py <biblioteca> --write-manifest
python integration/tools/library_check.py <biblioteca> --baseline <versión anterior descomprimida>
python integration/tools/selftest_verify.py <biblioteca>
```
- `--baseline` falla si desaparece alguna ficha, TUT o registro VR de la versión anterior, y avisa si baja el número de estudiados de alguna fuente.
- `library_check.py` falla si los recuentos de `KNOWLEDGE_INDEX.md` no coinciden con los archivos (fichas, TUT, VR) o si el manifiesto no está al día.
- Guardar las salidas en `evidence/integration/<fecha>/`.

## Pruebas de integración con Claude Code
- Una sola ejecución por autorización; criterios y huella del verificador fijados **antes** (`criterios_previos.txt`); copia aislada de la versión publicada; nunca la carpeta de trabajo.
- Antes de borrar la carpeta temporal: `make_trace.py` → `traza.json`; conservar `lib_before.sha`/`lib_after.sha` y una copia del verificador usado. Re-verificación posterior con `--remap` (ver `MINIMAL_INTEGRATION_TEST.md`).
