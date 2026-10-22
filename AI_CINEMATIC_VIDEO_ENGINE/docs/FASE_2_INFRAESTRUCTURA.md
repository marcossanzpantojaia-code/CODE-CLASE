# Fase 2 — Infraestructura y primer render verificable (EXP-01)

Fecha: 2026-10-22 · Entorno: contenedor Linux en la nube (4 vCPU, sin GPU) · Estado: **COMPLETADA en Linux; Windows NO VERIFICADO**

Convención: **MEDIDO** (ejecutado en esta sesión, con evidencia en `reports/exp01/`), **NO VERIFICADO**
(razonado o documentado, sin ejecución que lo pruebe).

---

## 1. Qué se ha construido

| Módulo | Qué hace realmente |
|---|---|
| `src/core/manifest.ts` | Esquema Zod del manifiesto de edición (EDL). Valida assets referenciados, solapes, huecos negros, zoom ≥ 1 (nunca bordes), pan en [-1, 1], keyframes crecientes y longitud de transiciones. Es la única fuente de verdad del montaje. |
| `src/core/project.ts` | Rutas del proyecto y `assertWritable`: **toda escritura del pipeline bajo `assets/` se rechaza**. Los originales solo entran por `importOriginal` (copia sin sobrescribir + solo lectura). |
| `src/core/proc.ts`, `log.ts` | Lanza procesos sin shell (array de argumentos: sin problemas de escapado en Windows) y registra cada comando completo, duración, código de salida y final de stderr en `logs/<runId>.jsonl`. |
| `src/ingest/ingest.ts` | ffprobe de cada asset; sha256; intermedio normalizado por clip: rotación aplicada, HDR → SDR BT.709, VFR → CFR a la frecuencia estándar más cercana, SAR corregido, resolución limitada a 2× lo necesario, GOP corto. En caché por hash (original + receta). Comprueba que cada clip cabe en su original y avisa si una cámara lenta repetirá fotogramas. |
| `src/audio/beats.ts` + `python/beats.py` | librosa 1.0: tempo, beats, onsets y energía. Los beats se ajustan al onset más cercano (±40 ms). `snapToBeat`: el montador elige el instante; el beat solo afina, dentro de un margen. |
| `src/audio/mix.ts` | Mezcla FFmpeg desde el manifiesto (recorte, ganancia, fades, retardo exacto en muestras) y normalización EBU R128 en dos pasadas al objetivo del manifiesto (−14 LUFS por defecto), con margen de true peak para el AAC. |
| `src/remotion/*` | Composición genérica dirigida por el manifiesto: planos con encuadre "cover" (sin deformar), zoom/pan con keyframes y easing, transición personalizada **zoom-through**, título con jerarquía (texto espaciado, filete, subtítulo, degradado de legibilidad), cierre con logo. Fuentes incluidas (Inter, OFL). |
| `src/rendering/render.ts` | Orquesta ingesta → mezcla → directorio público mínimo (enlaces duros) → bundle → render Remotion (solo imagen) → mux con la mezcla. Preview 540×960 o final 1080×1920 H.264 + AAC. Deja `<video>.render.json` con parámetros, versiones, tiempos y hashes. |
| `src/qa/qa.ts` | QA técnico automático (§4) con gravedad Crítico/Alto/Medio/Bajo y contact sheets. Escribe junto al vídeo, fuera de git. |
| `src/cli.ts` | `render`, `qa`, `ingest`, `beats`. |
| `experiments/exp01/` | Generador de material sintético con verdad conocida, comprobaciones específicas y orquestación del experimento. |
| `tests/` | 29 tests unitarios de la lógica pura (esquema, geometría, constructores de comandos FFmpeg, parseos de QA, correlación, ajuste a beats). |

## 2. Decisiones técnicas tomadas con datos

| Decisión | Dato que la sostiene |
|---|---|
| Remotion renderiza solo imagen; el audio se mezcla y mide en FFmpeg | Sonoridad y true peak medibles y repetibles (§4) |
| Color en el intermedio, no en el navegador | Color original → intermedio: Δ0; intermedio → salida Remotion: Δ ≤ 2/255 en los cuatro planos (MEDIDO) |
| Tonemap HDR: `mobius` (param 0.8), blanco de referencia a 203 nits | Con HLG "como una cámara" (blanco al 75 %): fondo (126,78,27) frente a referencia (126,75,28) y blanco 245/255. La receta inicial (`hable`) daba (85,52,18) y blanco 158/255: todo el plano oscurecido (MEDIDO) |
| Beats: `hop` 64 sin backtrack | Error medio 3.3 ms frente a 8.4 ms (hop 256) y −70 ms con backtrack (MEDIDO en click track) |
| Cortes: el montador elige el instante y se ajusta al beat más cercano (±6 fotogramas) | Elegir "el beat número N" falló: el arranque del colchón en t=0 es un onset real y desplazó la cuenta (§5) |
| Staging con enlaces duros, no simbólicos | El servidor estático de Remotion devuelve 404 a ficheros enlazados simbólicamente (§5) |
| Chrome Headless Shell 157 descargado de `storage.googleapis.com` | Remotion lo buscaría en `remotion.media`, bloqueado en este entorno (Fase 1) |

## 3. EXP-01: diseño

Material sintético (solo FFmpeg, reproducible en Windows) con propiedades conocidas:

| Clip | Propiedad deliberada | Qué prueba |
|---|---|---|
| S1 | 1920×1080 horizontal, 25 fps, círculo amarillo | Reencuadre 9:16 sin deformar; 25 → 30 fps |
| S2 | 1080×1920, 60 fps, cuadrado que avanza 400 px/s | Cámara lenta 0.5× con fotogramas reales |
| S3 | Codificado 1920×1080 con rotación 270° en metadatos, 29.97 fps | Rotación aplicada; banda blanca arriba |
| S4 | HLG 10-bit BT.2020 HEVC, blanco de referencia al 75 % | Detección y conversión HDR → SDR |
| Música | Click track 120 BPM desde 0.3 s, acento cada 4, colchón grave | Beats conocidos al milisegundo |
| SFX | Whoosh de ruido rosa filtrado | Efecto sonoro en la mezcla |
| Logo | PNG con transparencia | Cierre de marca |

Montaje (`edit-decisions/exp01.json`, generado a partir de los beats **detectados**): cortes cerca de
1.8 / 3.8 / 5.8 / 7.8 s ajustados al beat; S1 con zoom 1→1.08 y pan; entrada de S2 con zoom-through de
8 fotogramas y whoosh; S2 a 0.5×; S3 con pan horizontal anclado arriba; S4 con zoom-out y título;
cierre con logo y lema.

## 4. EXP-01: resultados (ejecución `20261022T111450Z-exp01`)

**49 comprobaciones automáticas: 46 PASS, 0 FAIL, 3 WARN** (explicadas abajo). Informe completo, contact
sheets y `summary.json`: `reports/exp01/20261022T111450Z-exp01/`. Comando: `npm run exp01`.

| Qué se demuestra | Medida | Umbral | Estado |
|---|---|---|---|
| Beats detectados vs click track | 28/28 golpes; error medio 2.6 ms, máximo 4.0 ms; 120.19 BPM | ≤ 33.3 ms en ≥ 95 % | PASS |
| Cortes elegidos sobre beats detectados | 54, 114, 174, 234 = golpes reales | exacto | PASS |
| Formato (final) | H.264 yuv420p 1080×1920, 30/1 CFR; AAC 48 kHz estéreo; etiquetas BT.709 | exacto | PASS |
| Fotogramas | 294 de 294 | exacto | PASS |
| Cortes en la salida | Δ0 en los 4 (prominencia ×12 a ×205) | Δ0 | PASS |
| Desfase de audio de la salida vs mezcla | 0.00 ms, correlación 1.000 | ≤ 5 ms | PASS |
| Cortes sobre eventos musicales | 2 ms en los 3 cortes sincronizados | ≤ 33.3 ms | PASS |
| Sonoridad | −14.2 LUFS, true peak −1.9 dBTP (preview −1.7) | −14 ± 1, ≤ −1 | PASS |
| Negros / silencios / decodificación | ninguno fuera del cierre / ninguno / sin errores | — | PASS |
| Sin deformación (círculo de S1 en 16:9 → 9:16) | 546×548 px → 0.996 | 1 ± 0.03 | PASS |
| Rotación por metadatos (S3) | banda arriba (luma 255), abajo/laterales 44 | — | PASS |
| Cámara lenta real 0.5× desde 60 fps | avance 6.73 px/fotograma (esperado 6.67), mínimo 6.08: ningún fotograma repetido | — | PASS |
| Color original → intermedio | Δ0 en S1, S2, S3 | ≤ 3 | PASS |
| Color intermedio → salida Remotion | Δ1 en los cuatro planos | ≤ 6 | PASS |
| HDR HLG → SDR | Δ0 respecto a la referencia SDR (ignorar el HDR: Δ26) | ≤ 12 | PASS |
| Determinismo | 0 de 294 fotogramas distintos entre dos renders | 0 | PASS |
| Reexportación tras mover un corte | el corte pasa de 114 a 129 (Δ0); resto intacto; sincronía 2 ms | exacto | PASS |
| Originales intactos | 7 sha256 iguales antes y después | — | PASS |

**WARN explicados:**
1. `exp-beat-extra`: librosa detecta un beat en t=0 — es real: el colchón grave del click track arranca ahí. No afecta (el ajuste a beats ignora lo que no está cerca del instante deseado).
2. `preview:freeze` y `final:freeze` (1.9–3.5 s): es la cámara lenta de S2, donde solo se mueve un cuadrado de 80 px sobre fondo plano. La prueba de cámara lenta confirma que hay movimiento en todos los fotogramas. Es una limitación del detector heurístico (§6).

**Tiempos medidos (4 vCPU, sin GPU, 294 fotogramas = 9.8 s):**

| Etapa | Preview 540×960 | Final 1080×1920 |
|---|---|---|
| Render Remotion | 23.5 s (12.5 fps) | 33.7 s (8.7 fps) |
| Bundle + selección | 2.8 s | 2.5 s |
| Ingesta (intermedios nuevos / en caché) | 7.2 s | 1.0 s |
| Mezcla + mux | 1.8 s | 0.8 s |

Línea base solo-FFmpeg del mismo montaje (preview, sin zoom, transición ni texto animado): **2.5 s**.
Remotion es ~10× más lento en este montaje; a cambio da keyframes, transiciones, máscaras y tipografía
mantenibles. Para un reel de 30 s se estiman ~1.5 min de preview y ~2 min de final en este equipo
(extrapolación lineal, NO VERIFICADA con contenido real).

**Revisión visual (hecha por mí sobre contact sheets y fotogramas del final, no sobre la reproducción):**
encuadres sin bordes ni deformación; zoom-through oculta el corte (53→54); pan de S3 suave y anclado
arriba; S4 con color cálido correcto tras el arreglo del HDR; título legible con jerarquía; cierre limpio.
Lo que una revisión de fotogramas no puede juzgar —fluidez del movimiento, sensación de ritmo, si la
transición "se siente" bien— queda **PENDIENTE de tu revisión en reproducción real**.

## 5. Problemas encontrados y cómo se resolvieron

Todos aparecieron ejecutando, no leyendo código. El primer informe con fallos se conserva en
`reports/exp01/20261022T110551Z-exp01/` como evidencia.

| # | Problema (síntoma real) | Causa raíz | Solución | Verificado |
|---|---|---|---|---|
| P1 | `npm install` abortaba: `Cannot read properties of null (reading 'edgesOut')` | Bug de npm 10 con el ciclo de peers opcionales vitest → vite → `@vitejs/devtools` → vitest | `.npmrc` del proyecto con `legacy-peer-deps=true`; los peers reales (react, react-dom, vite) son dependencias directas | Instalación limpia, 297 paquetes |
| P2 | Render abortado: 404 en `/public/fonts/*.otf` | El servidor estático de Remotion no sirve ficheros enlazados simbólicamente | Staging con enlaces duros (copia si están en otro volumen) | Fuentes y vídeos servidos |
| P3 | QA no encontraba el corte verde oscuro → azul oscuro (fotograma 99) | `scdet` mide sobre todo luminancia; esos dos fondos tienen casi la misma | QA verifica cada corte esperado por el pico de diferencia RGB en ese fotograma exacto (prominencia ≥ 2); `scdet` queda solo para cambios no previstos | Corte visible en `cuts.png`; ahora Δ0 |
| P4 | Cortes en 39/99/159/219 en vez de 54/114/174/234 | Elegir "el beat número N": el arranque del colchón grave en t=0 es un onset real y desplazó la cuenta | El montador elige el instante y `snapToBeat` lo ajusta al beat más cercano (±6 fotogramas) | Cortes en los golpes reales |
| P5 | Sincronía con el beat: −246 ms en el corte con whoosh | Se medía con onsets de la mezcla final: el whoosh tapa el golpe y el onset más cercano era el del whoosh | Dos medidas separadas: cortes contra los beats de la pista de música, y desfase audio de la salida contra la mezcla por correlación | Ver §4 |
| P6 | True peak −0.7 dBTP (objetivo ≤ −1) | La mezcla salía a −1.00 dBTP y la codificación AAC la subía 0.3 dB | Normalizar 1 dB por debajo del objetivo antes del AAC | Ver §4 |
| P7 | HDR: S4 notablemente más oscuro y apagado que su referencia SDR (fallaba incluso frente a ignorar el HDR) | Dos causas: `hable` comprime los medios (blanco → 158/255) y el S4 sintético ponía el blanco en el pico HLG, no al 75 % como una cámara | Tonemap `mobius` (param 0.8, pico 1000/203) y S4 regenerado según BT.2408 con otro nombre (el original anterior no se sobrescribe) | Ver §4 |
| P8 | La generación del nuevo S4 fallaba: `zscale ... no path between colorspaces` | Los fotogramas de `lavfi` no llevan primarias; zscale no hereda `pin` como primarias de salida | `p=bt709` explícito | S4 con blanco al 75 % (YAVG 721/1023) |
| P9 | Un test unitario fallaba | El test estaba mal (46 está a 7 fotogramas, fuera del margen de 6) | Corregido el test, no el código | 29/29 |



## 6. Limitaciones y lo que NO está verificado

| Tema | Estado | Detalle |
|---|---|---|
| Windows | **NO VERIFICADO** | Todo se ha ejecutado en Linux. Diferencias previstas: Remotion copia el directorio público (no hay symlinks en Windows), los enlaces duros funcionan en NTFS en el mismo volumen, Remotion descarga su navegador desde `storage.googleapis.com`. Hay que repetir EXP-01 en tu PC. |
| Metraje real | **NO VERIFICADO** | EXP-01 usa material sintético con fondos planos. Ruido, movimiento real, compresión de móvil y audio ambiente llegan en la Fase 4. |
| HDR real de iPhone | **NO VERIFICADO** | El tonemap se ha validado con HLG sintético según BT.2408. Los iPhone suelen grabar Dolby Vision (perfil 8.4) sobre HLG: la capa Dolby Vision se ignora y se usa la base HLG. Hay que comprobarlo con clips reales; alternativa más simple: grabar con HDR desactivado. |
| Desenfoque del zoom-through | Limitación estética | Es un desenfoque gaussiano uniforme (CSS `blur`), no radial ni direccional como un desenfoque de movimiento real. Funciona y oculta el corte, pero es candidato a mejora en la Fase 5. |
| Detector de imagen congelada | Heurístico | En EXP-01 avisa (WARN) en la cámara lenta de S2: solo se mueve un cuadrado pequeño sobre fondo plano y la diferencia queda por debajo del umbral. No es un fallo del render (la prueba de cámara lenta lo confirma), pero en metraje real un plano fijo de trípode también avisará. |
| Velocidad | Medida | §4. En CPU, sin GPU. Un vídeo de 30 s tardaría del orden de minutos; en tu PC dependerá de su CPU. |
| Márgenes de seguridad de TikTok/Reels | **NO VERIFICADO** | Los márgenes (`SAFE_AREA`) son una estimación conservadora, no medidos sobre la interfaz actual. |
| Licencia de Remotion | Pendiente de tu respuesta | Gratis hasta 3 empleados; plan de pago si se vende como servicio (Fase 1). |
| Calidad profesional | **NO DEMOSTRABLE con métricas** | El QA automático prueba que el vídeo es técnicamente correcto y fiel al manifiesto, no que sea bueno. La revisión humana en reproducción real es obligatoria. |

## 7. Estado de los criterios de aceptación del proyecto

| Criterio | Estado | Evidencia |
|---|---|---|
| Recibe vídeos reales | **PENDIENTE** | Solo sintéticos (Fase 4) |
| Puede inspeccionarlos | Completado con sintéticos | ingesta + ffprobe + avisos (HDR, VFR, rotación, resolución) |
| Genera una propuesta de montaje | Parcial | Manifiestos generados por código desde beats; la generación desde lenguaje natural es la Fase 6 |
| Construye una composición | Completado | Remotion dirigido por manifiesto |
| Renderiza un MP4 reproducible | Completado (Linux) | Determinismo 0/294; Windows NO VERIFICADO |
| Al menos una transición personalizada | Completado | zoom-through |
| Sincroniza cortes con eventos musicales detectados | Completado con click track | 2 ms; con música real PENDIENTE |
| Genera previsualizaciones | Completado | 540×960 |
| Ejecuta validaciones técnicas | Completado | 15 comprobaciones genéricas por render |
| Registra los parámetros usados | Completado | `.render.json` + `logs/*.jsonl` |
| Permite cambios y reexportar | Completado | variante B |
| Conserva los originales intactos | Completado | sha256 + `assertWritable` + solo lectura |
| Revisión visual humana | **PENDIENTE** | Obligatoria antes de publicar |

## 8. Cómo reproducir

```bash
cd AI_CINEMATIC_VIDEO_ENGINE
npm install && python3 -m venv .venv && .venv/bin/pip install -r python/requirements.txt
bash scripts/fetch-browser-linux.sh      # solo si remotion.media está bloqueado
npm test && npm run typecheck            # 29 tests
npm run exp01                            # ~3 min en 4 vCPU
```
