# Evidencia del lote 27 (2026-11-02) — recursos generados por IA: contrato, pipeline e integración preparada

**IMPORTANTE:** todas las imágenes de esta carpeta son **FIXTURES DE PRUEBA**:
- el plato procedural del lote 26;
- una esfera;
- un rectángulo rotulado "FIXTURE I1".

Sirven para probar el código. **No son recursos ni sustitutos finales y no cuentan para C1 ni C3.** Entorno: Chromium 153 sin GPU, GSAP 3.15.0 (`npm ci`) y Pillow 12.3 (AVIF/WebP). No se ha instalado nada nuevo.

| Archivo / carpeta | Contenido |
|---|---|
| `RESUMEN_VALIDACION.txt` | Resultado de `validar_gsap.mjs` en 1 440, 375 × 812 y 375 × 800 sobre `integration/plantillas/rec003_recursos/` |
| `validacion/<viewport>/` | `resultados.json`, `diferencias.json`, `mapa_diferencias.png`, estados WebP (nativo, GSAP y pin), cortes y vídeos |
| `auditoria/` | AUD-001 con `ocluyentes` y `ocluyentes_img` (alfa real y orden de profundidad) |
| `rendimiento/perf_antes.json` | **Diagnóstico** de REC-003 (lote 26) a 1 440 px desactivando capas: `mix-blend-mode` es la causa |
| `rendimiento/perf_despues*.json` | La integración con sombras horneadas: 0 fotogramas > 33 ms |
| `pipeline/` | Inspecciones (halo −112 en el fixture con halo; plato claro sobre gris claro: halo claro de +71,5), contratos de fixture, informe, manifiesto y hojas de inspección de `preparar_recursos.py` |
| `hoja_integracion_{1440,375}.png` | 8 estados (0 … 1) de la integración con fixtures |
| `solape_titular_panel.json` | Solape del titular con el panel de color tras la corrección (0 %) |
| `scripts/` | `perf_variantes.mjs`, `solape_panel.mjs`, `estados27.mjs` y `smoke27.mjs` |

Reproducir:
1. Copiar `integration/plantillas/rec003_recursos/` y ejecutar `npm ci`.
2. `python3 integration/tools/preparar_recursos.py preparar <contrato> <imagenes> recursos`.
3. Servir la carpeta y ejecutar `node integration/tools/validar_gsap.mjs http://…/index.html <salida> 1440`.
