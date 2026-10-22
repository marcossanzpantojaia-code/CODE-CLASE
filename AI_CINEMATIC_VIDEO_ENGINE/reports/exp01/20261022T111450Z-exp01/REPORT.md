# EXP-01 — informe de ejecución 20261022T111450Z-exp01

Log: `logs/20261022T111450Z-exp01.jsonl` · Manifiestos: `edit-decisions/exp01.json`, `edit-decisions/exp01-b.json`

## Comprobaciones

| Estado | Gravedad | Id | Esperado | Medido |
|---|---|---|---|---|
| PASS | Alto | exp-beats | ≥ 95 % de 28 golpes a ≤ 1 fotograma (33.3 ms) | 28/28; error medio 2.6 ms, máx 4.0 ms; tempo 120.19 BPM; 28/29 beats ajustados a onset |
| WARN | Bajo | exp-beat-extra | ninguno | 0.000 s (inicio del colchón grave en t=0) |
| PASS | Alto | exp-beat-frames | 54, 114, 174, 234 (golpes reales) | 54, 114, 174, 234 |
| PASS | Crítico | preview:video-format | h264 yuv420p 540x960 30/1 CFR | h264 yuv420p 540x960 30/1 (media 30.000) |
| PASS | Alto | preview:color-tags | bt709 / bt709 / bt709 | bt709 / bt709 / bt709 |
| PASS | Alto | preview:audio-format | aac 48000 Hz estéreo | aac 48000 Hz 2 canales |
| PASS | Crítico | preview:frame-count | 294 | 294 |
| PASS | Alto | preview:av-duration | \|Δ\| ≤ 55 ms | vídeo 9.800 s, audio 9.800 s |
| PASS | Crítico | preview:decode | sin errores | sin errores |
| PASS | Alto | preview:black | ninguno fuera de los cierres | ninguno (1 previstos) |
| WARN | Medio | preview:freeze | ninguna fuera de los cierres | [[1.93333,2.33333],[2.33333,2.73333],[2.73333,3.13333],[3.13333,3.53333]] |
| PASS | Medio | preview:silence | ninguno | ninguno |
| PASS | Alto | preview:loudness | -14 ± 1 LUFS, true peak ≤ -1 dBTP | -14.2 LUFS, true peak -1.7 dBTP |
| PASS | Crítico | preview:cuts | 54, 114, 174, 234 (pico de diferencia, prominencia ≥ 2) | 54(Δ0, ×11.8), 114(Δ0, ×83.7), 174(Δ0, ×193.3), 234(Δ0, ×53.7) |
| PASS | Bajo | preview:unexpected-scene-changes | ninguno | ninguno |
| PASS | Alto | preview:av-offset | \|desfase\| ≤ 5 ms, correlación > 0.9 | 0.00 ms (correlación 1.000) |
| PASS | Alto | preview:beat-sync | \|Δ\| ≤ 33.3 ms (1 fotograma) | c2 2 ms, c3 2 ms, c4 2 ms |
| PASS | Crítico | preview:originals | 7 hashes iguales a la ingesta | todos iguales |
| PASS | Crítico | final:video-format | h264 yuv420p 1080x1920 30/1 CFR | h264 yuv420p 1080x1920 30/1 (media 30.000) |
| PASS | Alto | final:color-tags | bt709 / bt709 / bt709 | bt709 / bt709 / bt709 |
| PASS | Alto | final:audio-format | aac 48000 Hz estéreo | aac 48000 Hz 2 canales |
| PASS | Crítico | final:frame-count | 294 | 294 |
| PASS | Alto | final:av-duration | \|Δ\| ≤ 55 ms | vídeo 9.800 s, audio 9.800 s |
| PASS | Crítico | final:decode | sin errores | sin errores |
| PASS | Alto | final:black | ninguno fuera de los cierres | ninguno (1 previstos) |
| WARN | Medio | final:freeze | ninguna fuera de los cierres | [[1.93333,2.33333],[2.33333,2.73333],[2.73333,3.13333],[3.13333,3.53333]] |
| PASS | Medio | final:silence | ninguno | ninguno |
| PASS | Alto | final:loudness | -14 ± 1 LUFS, true peak ≤ -1 dBTP | -14.2 LUFS, true peak -1.9 dBTP |
| PASS | Crítico | final:cuts | 54, 114, 174, 234 (pico de diferencia, prominencia ≥ 2) | 54(Δ0, ×12.0), 114(Δ0, ×84.1), 174(Δ0, ×204.9), 234(Δ0, ×51.5) |
| PASS | Bajo | final:unexpected-scene-changes | ninguno | ninguno |
| PASS | Alto | final:av-offset | \|desfase\| ≤ 5 ms, correlación > 0.9 | 0.00 ms (correlación 1.000) |
| PASS | Alto | final:beat-sync | \|Δ\| ≤ 33.3 ms (1 fotograma) | c2 2 ms, c3 2 ms, c4 2 ms |
| PASS | Crítico | final:originals | 7 hashes iguales a la ingesta | todos iguales |
| PASS | Crítico | exp-aspect | ancho/alto = 1.00 ± 0.03 | 546×548 px → 0.996 |
| PASS | Crítico | exp-rotation | luma arriba > 180; abajo, izquierda y derecha < 120 | arriba 255, abajo 44, izq 44, der 44 |
| PASS | Alto | exp-slowmo | avance ≈ 6.67 px/fotograma, nunca ≈ 0 | media 6.73, mínimo 6.08 (52 pasos) |
| PASS | Alto | exp-color-ingest-s1 | diferencia máx. por canal ≤ 3 | (95,30,18) vs (95,30,18) → 0.0 |
| PASS | Alto | exp-color-ingest-s2 | diferencia máx. por canal ≤ 3 | (17,57,41) vs (17,57,41) → 0.0 |
| PASS | Alto | exp-color-ingest-s3 | diferencia máx. por canal ≤ 3 | (23,46,93) vs (23,46,93) → 0.0 |
| PASS | Alto | exp-color-render-c1 | diferencia máx. por canal ≤ 6 | (95,30,18) vs (94,29,17) → 1.0 |
| PASS | Alto | exp-color-render-c2 | diferencia máx. por canal ≤ 6 | (17,57,41) vs (16,56,40) → 1.0 |
| PASS | Alto | exp-color-render-c3 | diferencia máx. por canal ≤ 6 | (23,46,93) vs (22,45,92) → 1.0 |
| PASS | Alto | exp-color-render-c4 | diferencia máx. por canal ≤ 6 | (126,75,28) vs (125,74,27) → 1.0 |
| PASS | Alto | exp-hdr | diferencia(tonemap, ref) ≤ 12 y menor que ignorando el HDR | ref (126,75,28); tonemap (126,75,28) (Δ0.0); ignorando HDR (100,74,36) (Δ26.0) |
| PASS | Medio | exp-determinism | 0 fotogramas distintos (framemd5) | 0 de 294 distintos |
| PASS | Crítico | reexport-b:frame-count | 294 | 294 |
| PASS | Crítico | reexport-b:cuts | 54, 129, 174, 234 (pico de diferencia, prominencia ≥ 2) | 54(Δ0, ×11.8), 129(Δ0, ×75.7), 174(Δ0, ×170.1), 234(Δ0, ×53.7) |
| PASS | Alto | reexport-b:av-offset | \|desfase\| ≤ 5 ms, correlación > 0.9 | 0.00 ms (correlación 1.000) |
| PASS | Alto | reexport-b:beat-sync | \|Δ\| ≤ 33.3 ms (1 fotograma) | c2 2 ms, c3 2 ms, c4 2 ms |

## Tiempos (4 vCPU, sin GPU)

- Preview 540×960 (294 fotogramas): ingesta 7.2 s · mezcla de audio 1.2 s · bundle 2.3 s · selección de composición 0.5 s · render Remotion 23.5 s · mux 0.6 s → render Remotion 12.5 fps
- Final 1080×1920: ingesta 1.0 s · mezcla de audio 0.0 s · bundle 2.0 s · selección de composición 0.5 s · render Remotion 33.7 s · mux 0.8 s → render Remotion 8.7 fps
- Línea base solo-FFmpeg (preview, sin zoom/transición/texto animado): 2.5 s

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
