# EXP-01 — informe de ejecución 20261022T110551Z-exp01

Log: `logs/20261022T110551Z-exp01.jsonl` · Manifiestos: `edit-decisions/exp01.json`, `edit-decisions/exp01-b.json`

## Comprobaciones

| Estado | Gravedad | Id | Esperado | Medido |
|---|---|---|---|---|
| PASS | Alto | exp-beats | ≥ 95 % de 28 golpes a ≤ 1 fotograma (33.3 ms) | 28/28; error medio 2.6 ms, máx 4.0 ms; tempo 120.19 BPM; 28/29 beats ajustados a onset |
| FAIL | Alto | exp-beat-frames | 9,24,39,54,69,84,99,114,129,144,159,174,189,204,219,234 | 0,9,24,39,54,69,84,99,114,129,144,159,174,189,204,219 |
| PASS | Crítico | preview:video-format | h264 yuv420p 540x960 30/1 CFR | h264 yuv420p 540x960 30/1 (media 30.000) |
| PASS | Alto | preview:color-tags | bt709 / bt709 / bt709 | bt709 / bt709 / bt709 |
| PASS | Alto | preview:audio-format | aac 48000 Hz estéreo | aac 48000 Hz 2 canales |
| PASS | Crítico | preview:frame-count | 279 | 279 |
| PASS | Alto | preview:av-duration | \|Δ\| ≤ 55 ms | vídeo 9.300 s, audio 9.300 s |
| PASS | Crítico | preview:decode | sin errores | sin errores |
| PASS | Alto | preview:black | ninguno fuera de los cierres | ninguno (1 previstos) |
| WARN | Medio | preview:freeze | ninguna fuera de los cierres | [[1.43333,1.83333],[1.83333,2.23333],[2.23333,2.63333],[2.63333,3.03333]] |
| PASS | Medio | preview:silence | ninguno | ninguno |
| FAIL | Alto | preview:loudness | -14 ± 1 LUFS, true peak ≤ -1 dBTP | -14.3 LUFS, true peak -0.7 dBTP |
| FAIL | Crítico | preview:cuts | 39, 99, 159, 219 | 39(Δ0), 99:NO, 159(Δ0), 219(Δ0) |
| PASS | Bajo | preview:unexpected-scene-changes | ninguno | ninguno |
| FAIL | Alto | preview:beat-sync | \|Δ\| ≤ 33.3 ms (1 fotograma) | c2 -246 ms, c3 3 ms, c4 3 ms |
| PASS | Crítico | preview:originals | 7 hashes iguales a la ingesta | todos iguales |
| PASS | Crítico | final:video-format | h264 yuv420p 1080x1920 30/1 CFR | h264 yuv420p 1080x1920 30/1 (media 30.000) |
| PASS | Alto | final:color-tags | bt709 / bt709 / bt709 | bt709 / bt709 / bt709 |
| PASS | Alto | final:audio-format | aac 48000 Hz estéreo | aac 48000 Hz 2 canales |
| PASS | Crítico | final:frame-count | 279 | 279 |
| PASS | Alto | final:av-duration | \|Δ\| ≤ 55 ms | vídeo 9.300 s, audio 9.300 s |
| PASS | Crítico | final:decode | sin errores | sin errores |
| PASS | Alto | final:black | ninguno fuera de los cierres | ninguno (1 previstos) |
| WARN | Medio | final:freeze | ninguna fuera de los cierres | [[1.43333,1.83333],[1.83333,2.23333],[2.23333,2.63333],[2.63333,3.03333]] |
| PASS | Medio | final:silence | ninguno | ninguno |
| PASS | Alto | final:loudness | -14 ± 1 LUFS, true peak ≤ -1 dBTP | -14.2 LUFS, true peak -0.9 dBTP |
| FAIL | Crítico | final:cuts | 39, 99, 159, 219 | 39(Δ0), 99:NO, 159(Δ0), 219(Δ0) |
| PASS | Bajo | final:unexpected-scene-changes | ninguno | ninguno |
| FAIL | Alto | final:beat-sync | \|Δ\| ≤ 33.3 ms (1 fotograma) | c2 -246 ms, c3 3 ms, c4 3 ms |
| PASS | Crítico | final:originals | 7 hashes iguales a la ingesta | todos iguales |
| PASS | Crítico | exp-aspect | ancho/alto = 1.00 ± 0.03 | 546×546 px → 1.000 |
| PASS | Crítico | exp-rotation | luma arriba > 180; abajo, izquierda y derecha < 120 | arriba 255, abajo 44, izq 44, der 44 |
| PASS | Alto | exp-slowmo | avance ≈ 6.67 px/fotograma, nunca ≈ 0 | media 6.73, mínimo 6.08 (52 pasos) |
| PASS | Alto | exp-color-ingest-s1 | diferencia máx. por canal ≤ 3 | (95,30,18) vs (95,30,18) → 0.0 |
| PASS | Alto | exp-color-ingest-s2 | diferencia máx. por canal ≤ 3 | (17,57,41) vs (17,57,41) → 0.0 |
| PASS | Alto | exp-color-ingest-s3 | diferencia máx. por canal ≤ 3 | (23,46,93) vs (23,46,93) → 0.0 |
| PASS | Alto | exp-color-render-c1 | diferencia máx. por canal ≤ 6 | (95,30,18) vs (94,29,17) → 1.0 |
| PASS | Alto | exp-color-render-c2 | diferencia máx. por canal ≤ 6 | (17,57,41) vs (16,56,40) → 1.0 |
| PASS | Alto | exp-color-render-c3 | diferencia máx. por canal ≤ 6 | (23,46,93) vs (22,45,92) → 1.0 |
| PASS | Alto | exp-color-render-c4 | diferencia máx. por canal ≤ 6 | (62,36,13) vs (60,34,11) → 2.0 |
| FAIL | Alto | exp-hdr | diferencia(tonemap, ref) < diferencia(ignorar HDR, ref) | ref (126,75,28); tonemap (62,36,13) (Δ64.0); ignorando HDR (74,54,27) (Δ52.0) |
| PASS | Medio | exp-determinism | 0 fotogramas distintos (framemd5) | 0 de 279 distintos |
| PASS | Crítico | reexport-b:frame-count | 279 | 279 |
| FAIL | Crítico | reexport-b:cuts | 39, 114, 159, 219 | 39(Δ0), 114:NO, 159(Δ0), 219(Δ0) |
| FAIL | Alto | reexport-b:beat-sync | \|Δ\| ≤ 33.3 ms (1 fotograma) | c2 -246 ms, c3 2 ms, c4 3 ms |

## Tiempos (4 vCPU, sin GPU)

- Preview 540×960 (279 fotogramas): ingesta 0.8 s · mezcla de audio 0.0 s · bundle 2.4 s · selección de composición 0.5 s · render Remotion 24.4 s · mux 0.7 s → render Remotion 11.4 fps
- Final 1080×1920: ingesta 0.8 s · mezcla de audio 0.0 s · bundle 1.7 s · selección de composición 0.4 s · render Remotion 30.9 s · mux 0.6 s → render Remotion 9.0 fps
- Línea base solo-FFmpeg (preview, sin zoom/transición/texto animado): 2.1 s

## Versiones

```json
{
  "node": "v22.22.0",
  "ffmpeg": "ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023 the FFmpeg developers",
  "remotion": "4.0.537",
  "react": "19.3.1",
  "platform": "linux-x64"
}
```

Contact sheets en esta carpeta (material sintético). Revisión visual: ver docs/FASE_2_INFRAESTRUCTURA.md.
