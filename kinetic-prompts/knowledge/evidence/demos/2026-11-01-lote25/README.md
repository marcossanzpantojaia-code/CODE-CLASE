# Evidencia del lote 25 (2026-11-01)

Entorno: contenedor Linux sin GPU (2 CPU, 7 GB), Playwright 1.63.0 + Chromium 153, ffmpeg, Python con PIL/OpenCV. **GSAP no instalado.** Recursos procedurales (sin fotografía ni render real).

| Carpeta | Contenido | Ficha |
|---|---|---|
| `auditoria/{A,B,C}/{1440,375}/` | `auditoria.json` (protagonista, legibilidad por línea, cobertura y luminancia del lienzo, reversibilidad visual) y `cortes_*.json` | AUD-001 |
| `gsap_port/` | `motor_gsap.js`, `receta_{a,b,c}_gsap.html`, `comparar_nativo_gsap.mjs`, autoprueba nativo frente a nativo (diferencia 0 % en los 5 estados) | GS-005 — **PREPARADO, NO EJECUTADO con GSAP** |
| `pruebas/` | máscara de persianas y detector de costuras (16 combinaciones, `comparacion_costuras.png`); interpolación de secuencia (`interpolacion_secuencia.json`, `comparacion_interpolacion.png`) | MASK-002, SEQ-003 |

Reproducir: servir `evidence/demos/2026-11-01-lote24/` (microdemos) por HTTP y ejecutar `node integration/tools/auditoria_visual_escena.mjs <url> <dir> '<json>' 1440 41`; `python3 integration/tools/cortes_video.py <video.webm>`.

Limitaciones: umbrales provisionales; ninguna evaluación C1/C3 (requiere recursos reales y una persona); el corte de C a 0,8 s es un artefacto de la grabación (`scrollTo` inicial).
