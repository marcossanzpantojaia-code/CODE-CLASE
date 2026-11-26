# Plantilla aislada · ROSSO / CREMA con acabado cinematográfico (lote 32)

**Probada con fixtures: mecánica y coste; no calidad visual.**

## Archivos
- `escena32.js`: núcleo del aterrizaje (lote 31) + integración (`comp: true`), con el motion blur optimizado (recorte + rectángulo sucio).
- `atmosfera32.js`: partículas con profundidad y bokeh, grano.
- `rosso32.html?v=32`:
  - `&tema=crema`: fondo oscuro;
  - `&sin=part,grano,vineta,fondo,comp,blur`: aislar capas;
  - `&foco=plato`: variante DESCARTADA, solo para reproducirla.
- `grado32.py <recursos_origen> <recursos_destino>`: hornea el grado común y el match del protagonista; genera el plato desenfocado (solo si se desenfocan TODAS las capas del plano).

## Requisitos
- `node_modules/gsap` 3.15.0.
- `recursos/` (graduados) y `recursos_src/` (originales) junto al HTML.

## Pruebas
En `evidence/demos/2026-11-04-lote32/` y `2026-11-04-lote31/`:
- `capturar31.mjs`;
- `auditar31.py`;
- `medir32.mjs` (coste con CPU × 1 / × 4).

Los criterios están en INTEG-001 §9.
