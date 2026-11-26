# Plantilla aislada · aterrizaje ROSSO (lote 31)

**Probada con fixtures (solo movimiento).**

## Archivos
- `escena31.js`: núcleo.
  - Modos `l31` (aterrizaje suave + relevo alineado + motion blur MBLUR-001) y `l30` (historial).
  - `crear({ modo, blur, gsap })` devuelve `{ tl, render, estado, destruir }`.
- `rosso31.html`: animática por tiempo (`window.ir(t)`) para capturar fotogramas.
- `prueba_scroll.html?e=A|B|C`: las tres estrategias de scroll (C es la elegida).

## Requisitos
- `node_modules/gsap` 3.15.0 (gsap, ScrollTrigger, EasePack) y `recursos/` (manifiesto de `preparar_recursos.py`) junto a los HTML.
- GSAP solo con autorización (lote 26).

## Pruebas
Los scripts están en `evidence/demos/2026-11-04-lote31/`:
- `capturar31.mjs` + `auditar31.py`: relevo, espaciado y diferencia de píxeles;
- `ref_blur.mjs` + `err_blur.py`: blur frente a la referencia;
- `test_scroll31.mjs`: scroll lento, rápido, zigzag, saltos, resize, reduced motion, recursos retrasados y desmontaje.

## Con recursos reales
Sigue `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE_v2.md` §3. Hay que ajustar en `escena31.js`:
- máscara elíptica → recurso I1-nido;
- `AY`;
- `HSY` final.
