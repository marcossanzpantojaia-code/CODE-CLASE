# Fase 1 — Auditoría del entorno, arquitectura y plan

Fecha: 2026-10-22 · Estado de la fase: **PARCIAL** (ver §0)

Convención de este documento:

- **MEDIDO** — comprobado ejecutando un comando en esta sesión; la evidencia está en `reports/env-audit-cloud-2026-10-22.txt` o en los comandos citados.
- **DOCUMENTADO** — leído de una fuente primaria (p. ej. el `LICENSE.md` del paquete npm).
- **NO VERIFICADO** — conocimiento previo o fuente secundaria; hay que confirmarlo antes de depender de ello.

---

## 0. Hallazgo principal: no he auditado tu ordenador Windows

Esta sesión de Claude Code se ejecuta en un **contenedor Linux en la nube** (Ubuntu 24.04), no en tu PC. Todo lo medido abajo describe ese contenedor. **No he tenido acceso a tu equipo Windows**, así que no sé qué CPU, GPU, disco o programas (DaVinci, CapCut, After Effects) tienes.

Para cerrar la Fase 1 en tu equipo he preparado `scripts/audit-env.ps1` (solo lectura, **NO VERIFICADO**: no hay PowerShell en el contenedor para probarlo). Su salida me da el diagnóstico real de tu Windows.

Esto condiciona una decisión que es tuya (§9): **¿dónde se ejecuta el motor?**

| | A. Claude Code local en tu Windows (**recomendado para producción**) | B. Este contenedor en la nube |
|---|---|---|
| Acceso a tus vídeos | Directo, sin subirlos a ningún sitio | Solo vía GitHub (§5); Drive/Dropbox/OneDrive bloqueados |
| Persistencia | Tu disco | **Efímero**: lo no subido a git se pierde al reciclarse |
| GPU | Desconocida (la auditoría lo dirá) | **Ninguna** (MEDIDO) |
| CPU / RAM / disco | Desconocido | 4 vCPU Xeon 2.8 GHz, 15 GB RAM, ~30 GB libres (MEDIDO) |
| DaVinci / CapCut | Posibles | No instalables con sentido |
| Herramientas base | Por auditar | FFmpeg 6.1.1, Node 22, Python 3.13, Chromium headless (MEDIDO) |

El motor que propongo (Node + FFmpeg + Python + Remotion) es **multiplataforma**: el mismo repositorio funciona en ambos. Modelo híbrido razonable: desarrollar y probar el motor aquí con material sintético y clips cortos, y producir los montajes reales en tu Windows.

---

## 1. Diagnóstico del contenedor (MEDIDO)

| Recurso | Resultado | Implicación |
|---|---|---|
| SO | Ubuntu 24.04.5 LTS, x86_64 | Compatible con todo el stack |
| CPU | 4 vCPU Intel Xeon @ 2.80 GHz | Render solo por CPU |
| RAM | 15 GB, sin swap | Suficiente para 1080×1920; vigilar Remotion con concurrencia alta |
| Disco | ~30 GB libres | Suficiente para proxies y mezzanine de proyectos cortos |
| GPU | No existe `/dev/dri` ni `nvidia-smi` | **Sin aceleración por hardware** |
| FFmpeg / FFprobe | 6.1.1 (build GPL de Ubuntu) | Válido |
| Encoders | `libx264` **funciona**; `h264_nvenc`, `h264_qsv`, `h264_vaapi` compilados pero **no utilizables** (prueba de 1 fotograma falla) | "Compilado" ≠ "disponible": el script lo distingue |
| Filtros clave | `zscale`, `tonemap`, `lut3d`, `scdet`, `blackdetect`, `freezedetect`, `silencedetect`, `ebur128`, `loudnorm`, `signalstats`, `xfade`, `drawtext`, `minterpolate`, `vidstab*`, `zoompan`, `tile` presentes | Cubre ingestión, análisis, QA y color |
| Node.js | v22.22.0, npm 10.9.4 | Compatible con Remotion 4 |
| Python | 3.13.16; `numpy` y `PIL` presentes; **faltan** `librosa`, `soundfile`, `cv2`, `scenedetect` | Instalación necesaria en Fase 3/5 |
| Navegador headless | Chromium headless shell **141** (Playwright) | Remotion 4.0.537 está probado con **157** (ver §4) |
| Otros | ImageMagick `convert` sí; `sox`, Blender, DaVinci Resolve no | No se necesitan |
| Fuentes | 119 fuentes, incluida **Inter** (SIL OFL) | Valen para pruebas; las de marca las aportas tú |
| Red | `registry.npmjs.org` y `pypi.org` 200; `storage.googleapis.com` responde; `github.com` / `media.githubusercontent.com` responden; **`remotion.media`, `remotion.dev`, Google Drive, Dropbox, OneDrive: bloqueados** | Ver §4 y §5 |

### Pruebas de viabilidad ejecutadas (scratchpad, fuera del repo)

| Prueba | Resultado | Lectura honesta |
|---|---|---|
| Codificar 10 s sintéticos 1080×1920@30, x264 `medium` CRF 18 + AAC | 9.5 s de reloj (≈1× tiempo real) | Contenido sintético simple; el metraje real tarda más |
| Preview 540×960, x264 `veryfast` CRF 28, 10 s | 1.2 s (≈8.5× tiempo real) | Las previsualizaciones serán rápidas |
| HLG 10-bit BT.2020 sintético → SDR BT.709 (`zscale` + `tonemap=hable`), 2 s 1080×1920 | Funciona, 3.2 s; salida etiquetada bt709 | Prueba que la cadena funciona, **no** su calidad visual con HDR real de iPhone |
| `scdet` sobre montaje sintético con cortes conocidos en fotogramas 45 y 105 | Detecta 1.500 s y 3.500 s exactos (score 20.9 y 24.0 frente a ≤1 en el resto) | Cortes secos y contenido muy distinto; fundidos y barridos reales serán más difíciles |

Comandos reproducibles: `bash scripts/audit-env.sh --network`.

---

## 2. Aplicaciones de edición de terceros

| Aplicación | ¿Automatizable desde Claude Code? | Decisión |
|---|---|---|
| **CapCut** | No conozco ninguna API pública de automatización para escritorio. Hay herramientas comunitarias que manipulan sus borradores, pero sin garantías y frágiles ante actualizaciones. | **No se usa.** |
| **After Effects** | Sí técnicamente (`aerender`, ExtendScript), pero requiere suscripción Adobe y Windows/macOS. | **No se usa.** Remotion cubre motion graphics sin licencia de Adobe. |
| **DaVinci Resolve** | Tiene API de scripting (Python/Lua). Según mi conocimiento, el scripting **externo** requiere la versión Studio (de pago); la gratuita solo permite la consola interna — **NO VERIFICADO**, se comprueba en tu equipo con la documentación de desarrollador que incluye Resolve. | **Opcional, no dependencia.** Uso propuesto sin automatización: el colorista crea un *look* en Resolve y exporta un LUT `.cube`, y el motor lo aplica con FFmpeg (`lut3d`). |

---

## 3. Arquitectura propuesta

### 3.1 Principio

**El manifiesto de edición (EDL en JSON) es la única fuente de verdad.** Claude lee instrucciones y análisis y escribe o modifica el manifiesto; todo lo demás (preprocesado, composición, mezcla y QA) es una función determinista de ese manifiesto más los originales. Nada de decisiones escondidas en código ad hoc.

```
 originales (solo lectura, sha256)          referencias / música / logos
        │                                            │
        ▼                                            ▼
 [1 INGEST]  ffprobe → informe de propiedades;  normalización a "mezzanine":
             CFR, 9:16, SDR BT.709 (tonemap si HDR), rotación aplicada,
             proxies 540×960                        (FFmpeg)
        │
        ▼
 [2 ANÁLISIS] escenas (scdet; PySceneDetect si hace falta), estadísticas de color
             (signalstats), contact sheets / tiras alrededor de cortes (FFmpeg),
             movimiento global (OpenCV), beats/onsets/energía (librosa)
             → analysis/*.json + imágenes que Claude inspecciona visualmente
        │
        ▼
 [3 DECISIÓN] Claude + plantilla de estilo → edit-decisions/<proyecto>.json
             (validado con un esquema Zod; versionado en git)
        │
        ├──► [4 PREPROCESO por clip] FFmpeg: recorte temporal, speed ramps (mapa de
        │     tiempos calculado en TS), grade (LUT + eq/curves), caché por hash
        │
        ├──► [5 COMPOSICIÓN] Remotion (React/TS) lee el manifiesto: capas, keyframes,
        │     zooms/pans digitales, transiciones, máscaras, textos, logo, before/after
        │
        ├──► [6 AUDIO] FFmpeg: música + SFX + ambiente con fades, ducking,
        │     loudnorm a −14 LUFS, true peak ≤ −1 dBTP
        │
        ▼
 [7 RENDER]  preview 540×960 rápida │ final 1080×1920 H.264 High + AAC, +faststart
        │
        ▼
 [8 QA]      técnica (ffprobe, blackdetect, freezedetect, silencedetect, ebur128,
             posición de cortes vs. manifiesto, sync A/V), visual (contact sheets
             revisadas por Claude), creativa (lista graduada Crítico/Alto/Medio/Bajo)
             → reports/<render>.md + revisión humana obligatoria
```

### 3.2 Por qué este reparto (y qué se descartó)

| Decisión | Motivo |
|---|---|
| **FFmpeg para todo lo que es píxel pesado o medible** (normalizar, tonemap, grade, speed ramps, audio, QA) | Determinista, rápido en CPU, filtros de medición nativos y procesamiento en 10 bits/float antes de bajar a 8 bits. |
| **Remotion para composición y motion graphics** | Keyframes (`interpolate`, `spring`), capas, máscaras y textos como componentes React reutilizables y testeables, con control al fotograma. Con *filtergraphs* de FFmpeg sería inmantenible (regla 6). |
| **Color antes de Remotion, no dentro** | Los filtros CSS del navegador trabajan en 8 bits y son limitados; el grade se hace por clip en FFmpeg y Remotion recibe material ya igualado. El grano (si se usa) va al final, sobre la composición entera. |
| **Audio en FFmpeg, no en Remotion** | `loudnorm` y `ebur128` dan niveles medibles y repetibles; Remotion renderiza solo imagen (en Studio se puede escuchar para monitorizar). A confirmar en Fase 2. |
| **Python solo como "sidecar" de análisis** | librosa no tiene equivalente en FFmpeg para beats/tempo; OpenCV para movimiento de cámara. Se invoca por CLI con JSON de salida; el resto es TypeScript. |
| *Descartado:* solo FFmpeg | Viable para cortes y fundidos (y se mantiene como **línea base** en la Fase 2), pero las máscaras animadas, el texto con jerarquía y los before/after con keyframes serían frágiles. |
| *Descartado:* MoviePy | Más lento y con peores herramientas para motion graphics. |
| *Alternativa si la licencia de Remotion no encaja:* Revideo / Motion Canvas (MIT) | NO VERIFICADO su estado actual de mantenimiento; se evaluaría solo si hiciera falta. |

### 3.3 Decisiones técnicas clave del pipeline

- **Frecuencia de fotogramas.** Todo se conforma a CFR (los móviles graban en VFR). Salida a 30 fps por defecto. Fuentes a 60 fps reducidas a 30 → movimiento natural; fuentes a 60/120 fps → cámara lenta real (0.5×/0.25×) **sin interpolar**. Fuentes a 25 fps → 30 por duplicación (introduce *judder*, que QA marca) o con reconformado de velocidad, decidido por clip en el manifiesto. `minterpolate` solo como último recurso: genera artefactos.
- **HDR.** Los iPhone graban HLG/Dolby Vision por defecto. Si no se convierte a SDR en la ingesta, los colores saldrán lavados o quemados en el navegador y en redes. Se detecta por `color_transfer` y se aplica tonemap.
- **Mezzanine.** Intermedio H.264 de alta calidad con GOP corto (o ProRes 422) para que Remotion busque fotogramas rápido. Se elige con benchmark en la Fase 2.
- **Zoom digital.** Un zoom del 120 % sobre una fuente 1080×1920 es un reescalado y se nota. **Recomendación de rodaje: 4K vertical**, que permite zooms y reencuadres de hasta ~2× sin perder nitidez.
- **Rutas en Windows.** Escapar rutas dentro de *filtergraphs* (`drawtext`, `lut3d`) es fuente clásica de errores en Windows: los procesos se lanzan con array de argumentos (sin shell) y las rutas de filtros se escriben relativas o escapadas por una función única y testeada.
- **Protección de originales.** `assets/originals` es de solo lectura (permisos), con un `sha256` registrado en la ingesta y re-verificado en cada QA; toda escritura pasa por una función que rechaza rutas bajo `assets/`. Los medios nunca entran en git (`.gitignore`).
- **Trazabilidad.** Cada ejecución escribe un log JSONL con versiones de herramientas, comandos FFmpeg completos, duraciones, códigos de salida, hash del manifiesto y hashes de entradas/salidas.

### 3.4 Ejemplo del manifiesto (esquema provisional)

```json
{
  "version": 1,
  "output": { "width": 1080, "height": 1920, "fps": 30, "durationInFrames": 600 },
  "style": "cinematic-barbershop",
  "look": { "lut": "assets/luts/warm-cinema.cube", "lutStrength": 0.6, "grain": 0.04 },
  "video": [
    { "id": "c1", "source": "orig/fade_close.mp4", "in": 3.20, "out": 5.40,
      "at": 0, "speed": 1, "transform": { "zoom": [[0, 1.0], [66, 1.08]] },
      "transitionOut": { "type": "zoom-through", "frames": 8 } }
  ],
  "overlays": [
    { "type": "title", "text": "BARBERÍA X", "at": 450, "frames": 90, "preset": "serif-reveal" }
  ],
  "audio": [
    { "source": "music/track.wav", "at": 0, "gainDb": -2, "fadeOut": 30 },
    { "source": "sfx/whoosh.wav", "at": 64, "gainDb": -8 }
  ],
  "beats": "analysis/track.beats.json",
  "provenance": { "createdBy": "claude", "instruction": "…", "basedOn": ["analysis/ref_A.json"] }
}
```

### 3.5 Estructura del proyecto (adaptada de la tuya)

```
AI_CINEMATIC_VIDEO_ENGINE/
├─ assets/{originals,references,music,logos,sound-effects,fonts,luts}/   (fuera de git, solo lectura)
├─ analysis/            JSON de análisis + contact sheets (regenerables)
├─ edit-decisions/      manifiestos (en git: son texto y son la fuente de verdad)
├─ cache/               mezzanine y proxies (regenerables, fuera de git)
├─ previews/  exports/  (fuera de git)
├─ reports/             informes de QA y de auditoría (en git)
├─ logs/                JSONL de ejecución (fuera de git)
├─ templates/           presets de estilo en JSON (A, B, C)
├─ python/              sidecar de análisis + requirements.txt fijado
├─ src/
│  ├─ core/             esquema del manifiesto (Zod), guardas de rutas, runner de procesos, logs
│  ├─ ingest/  analysis/  audio/  planning/  rendering/  qa/
│  ├─ remotion/         Root, composiciones, components/, effects/, transitions/
│  └─ cli.ts
├─ tests/  docs/  scripts/
```

Cambios respecto a tu propuesta: `templates` pasa a ser datos (JSON) más componentes; se añaden `cache/`, `logs/`, `python/` y `src/qa/`.

---

## 4. Dependencias estrictamente necesarias

Ninguna instalada todavía. Todas serían **locales al proyecto** (`node_modules`, `venv`), sin tocar la configuración global; se eliminan borrando la carpeta.

| Dependencia | Versión | Para qué | Licencia | Fase | Estado aquí |
|---|---|---|---|---|---|
| FFmpeg / FFprobe | ≥ 6.1 | Todo el pipeline | GPL (build con x264); uso interno sin problema | 2 | Instalado |
| Node.js | 22 LTS | Orquestación, Remotion | MIT | 2 | Instalado |
| `remotion`, `@remotion/cli`, `@remotion/renderer`, `@remotion/bundler` | 4.0.537 (última en npm hoy) | Composición | **Remotion License** (ver abajo) | 2 | No |
| `react`, `react-dom` | 19.x (Remotion pide ≥ 16.8) | Componentes | MIT | 2 | No |
| `zod` | 4.x (4.6.7 en npm hoy) | Validación del manifiesto | MIT | 2 | No |
| `typescript`, `vitest`, `tsx` | actuales | Tipado y tests | Apache-2.0 / MIT | 2 | TS global presente; el resto no |
| Chrome Headless Shell | 157 (la que prueba Remotion) | Render de Remotion | BSD (Chromium) | 2 | Solo hay la 141 |
| `librosa` + `soundfile` | 1.0.0 / actual | Tempo, beats, onsets, energía | ISC / BSD-3 | 3 | No |
| `opencv-python-headless` | 5.0.x | Movimiento de cámara (flujo óptico), métricas de nitidez | Apache-2.0 | 3 | No |
| `scenedetect` | 0.7.x | **Condicional**: solo si `scdet` falla con fundidos reales | BSD-3 | 3 | No |

**No necesarias:** GPU, DaVinci Resolve, CapCut, After Effects, PyTorch o modelos de IA adicionales. El análisis visual combina métricas numéricas con mi propia inspección de fotogramas (puedo ver imágenes); no hace falta un modelo extra. Si más adelante quisieras segmentación (p. ej. aislar el pelo para máscaras automáticas), eso sí exigiría modelos, y te presentaría coste y licencia antes.

### Licencia de Remotion (DOCUMENTADO: `LICENSE.md` de `remotion@4.0.537`)

- **Gratis, incluido uso comercial**, para: personas físicas, empresas con ánimo de lucro de **hasta 3 empleados**, entidades sin ánimo de lucro, y evaluación.
- Por encima de eso hace falta **Company License**.
- Prohibido revender un derivado de Remotion.
- El propio fichero avisa de cambios de licencia en Remotion 5.0.
- Precios (NO VERIFICADO: fuente secundaria, `remotion.dev` no es accesible desde aquí): plan por puesto para creadores y plan "Automators" por render (con mínimo mensual) **para quien construye sistemas de creación automática de vídeo para terceros**. Si piensas ofrecer este motor como servicio a otras barberías, ese es probablemente el plan que aplica. Confírmalo en remotion.dev/license.

### Bloqueo de red concreto para Remotion en este contenedor (MEDIDO)

En Linux con glibc reciente, Remotion 4.0.537 descarga el navegador de `remotion.media`, que la política de red de este entorno **bloquea**. Alternativas: (a) usar `browserExecutable` con el Chrome for Testing 157 de `storage.googleapis.com` (accesible, HTTP 200 en la URL exacta); (b) usar el headless shell 141 ya instalado (desfase de versión, riesgo de incompatibilidades); (c) añadir `remotion.media` a los dominios permitidos del entorno. En Windows la descarga va a `storage.googleapis.com` y no debería tener este problema.

---

## 5. Cómo incorporar los tres vídeos de referencia

**Si trabajamos en tu Windows (opción A, recomendada):** copia los ficheros, sin recomprimir, a:

```
AI_CINEMATIC_VIDEO_ENGINE\assets\references\ref_A_cinematic.mp4
AI_CINEMATIC_VIDEO_ENGINE\assets\references\ref_B_before_after.mp4
AI_CINEMATIC_VIDEO_ENGINE\assets\references\ref_C_dynamic_music.mp4
```

**Si trabajamos en este contenedor (opción B):** el único canal que funciona hoy es GitHub. Opciones:

1. **Repositorio privado con Git LFS** (git-lfs 3.4.1 está instalado). GitHub rechaza ficheros de más de 100 MB sin LFS, y LFS tiene cuota de almacenamiento y transferencia. **Nunca en un repositorio público**: son obras de terceros.
2. **Cambiar la red del entorno** para permitir, por ejemplo, `drive.usercontent.google.com`, y pasarme un enlace de descarga directa. Se hace en la configuración del entorno (menú del entorno en la barra de título de la sesión → Edit → Network access → Allowed domains). Pasos: https://code.claude.com/docs/en/cloud-environments#network-access
3. El conector de Google Drive de esta sesión **no sirve para vídeo**: devuelve el fichero en base64 dentro de mi contexto, solo viable para ficheros muy pequeños.

**Para cada referencia, dime en 2–3 líneas** qué quieres reproducir y con timestamps si puedes (p. ej. "0:04–0:06, la transición con zoom; el color cálido de todo el vídeo"). Eso orienta el análisis mucho más que el fichero solo.

**Limitaciones a asumir:**

- Si las referencias vienen de TikTok/Instagram ya están recomprimidas: el color medido es aproximado, el grano y la nitidez no son fiables, y puede haber marcas de agua o interfaz superpuesta.
- Su música es de terceros: se analiza el ritmo, no se reutiliza.

---

## 6. Riesgos y limitaciones

| # | Riesgo | Gravedad | Mitigación |
|---|---|---|---|
| R1 | Fase 1 auditada en la nube, no en tu Windows | **Crítico** para cerrar la fase | Ejecutar `audit-env.ps1` y enviarme la salida |
| R2 | Contenedor efímero: los medios y los renders no subidos se pierden | Alto | Producción en local; aquí solo sintético y clips cortos; resultados a git/LFS |
| R3 | Transporte de medios a la nube limitado a GitHub | Alto | §5 |
| R4 | Material HDR/VFR de móvil mal tratado → colores y sincronía rotos | Alto | Detección y conversión en la ingesta; QA lo comprueba |
| R5 | Derechos de música en cuentas de empresa de TikTok/Instagram: las cuentas de negocio tienen la música restringida y un tema comercial incrustado puede silenciarse o retirarse | Alto | Música con licencia que cubra el uso publicitario; el sistema registra la procedencia en el manifiesto |
| R6 | Mi análisis visual se basa en fotogramas, no en ver la reproducción: velocidades, desenfoques de movimiento y curvas de easing se **estiman** | Medio | Muestreo denso alrededor de cada evento, métricas de flujo óptico, nivel de confianza explícito, y revisión humana en reproducción real |
| R7 | Remotion en CPU sin GPU: velocidad desconocida | Medio | Benchmark en Fase 2; previews a 540×960; concurrencia ajustada |
| R8 | Licencia de Remotion si la empresa supera 3 empleados o si se vende como servicio | Medio | Confirmar tu caso (§9) |
| R9 | Navegador para Remotion bloqueado aquí (versión 157 vs 141) | Medio | §4: Chrome for Testing 157 desde `storage.googleapis.com` |
| R10 | Proyecto metido en el repo del recepcionista WhatsApp: `npm run lint` hace `eslint .` y fallaría con los `.ts/.tsx` del motor; el contexto de Docker incluiría vídeos | Medio | Repositorio propio (§9) |
| R11 | Beats detectados en música con poca percusión (ambiental, cinematográfica) son poco fiables | Medio | Los beats **proponen** puntos de corte; el manifiesto decide y se puede corregir a mano |
| R12 | `audit-env.ps1` no probado | Bajo | Solo lectura; si falla, me pegas el error |

---

## 7. Plan técnico por fases

| Fase | Entregables | Criterio de salida (verificable) |
|---|---|---|
| **2 Infraestructura** | `package.json` propio, esquema Zod del manifiesto, runner de procesos con logs, guardas de rutas, composición Remotion mínima, CLI `render` | **EXP-01** (§8) pasa todas sus comprobaciones automáticas |
| **3 Análisis de referencias** | `analyze` → JSON + contact sheets + tiras por corte + informe Markdown con tabla de timestamps; venv Python | Informe de las 3 referencias con medidas separadas de hipótesis; cortes revisados por mí sobre las tiras |
| **4 Primer montaje real** | Manifiesto + render de tu material de barbería en estilo A; lista de planos que faltan | MP4 que pasa QA técnica; tu revisión visual |
| **5 Motor de efectos** | Zoom/pan, match cut, máscaras, speed ramp, before/after, textos, grano, LUT; cada uno con test y ejemplo | Tests automáticos + render de muestra por efecto |
| **6 Automatización** | Flujo "instrucción → análisis → manifiesto → render → QA" invocable en una orden | Un montaje completo desde una frase tuya |
| **7 Validación integral** | Pruebas E2E con material real; registro de errores y soluciones | Mismo manifiesto → mismo resultado; originales intactos (hash) |
| **8 Plantillas** | Presets A, B y C con ritmo, duración y efectos parametrizables | Cambiar un parámetro y reexportar sin tocar código |

Mapa de los criterios de aceptación del proyecto (estado actual: todos **PENDIENTE**):

| Criterio | Se demuestra en |
|---|---|
| Recibe vídeos reales / los inspecciona | Fase 4 (pipeline probado en Fase 2 con sintéticos) |
| Genera propuesta de montaje (manifiesto) | Fase 2 (sintético), Fase 4 (real) |
| Construye composición / renderiza MP4 reproducible | Fase 2 |
| Al menos una transición personalizada | Fase 2 |
| Cortes sincronizados con eventos musicales detectados | Fase 2 (con ground truth), Fase 4 (real) |
| Previsualizaciones / validaciones técnicas / registro de parámetros | Fase 2 |
| Cambios y reexportación | Fase 2 |
| Originales intactos | Fase 2 (hash antes/después), Fase 7 |
| Revisión visual humana | Fase 4 en adelante — **siempre tuya** |

---

## 8. Primer experimento de render — EXP-01 "ground truth"

**Idea:** generar material sintético cuyas propiedades **se conocen por construcción**, para que cada comprobación compare contra la verdad y no contra una impresión.

**Entradas sintéticas (FFmpeg, sin recursos externos):**

| Clip | Propiedades deliberadamente distintas | Qué prueba |
|---|---|---|
| S1 | 1920×1080 horizontal, 25 fps | Reencuadre a 9:16 sin deformar; conformado 25→30 |
| S2 | 1080×1920, 60 fps | Conformado 60→30 y cámara lenta 0.5× real |
| S3 | 1080×1920, 29.97 fps, con metadato de rotación | Rotación aplicada; 29.97→30 |
| S4 | HLG 10-bit BT.2020 | Detección HDR + tonemap |
| Música | Click track a 120 BPM (un golpe cada 0.5 s, acento cada 4) | Beats conocidos exactamente |
| Logo | PNG con transparencia generado localmente | Capa con alfa y animación de cierre |

Cada clip lleva en una esquina un **color sólido identificador** y un **destello blanco** sincronizado con un **clic de audio**, para poder medir cortes y sincronía.

**Montaje (manifiesto escrito a mano, ~10 s):** S1 con zoom lento, corte en el beat 4 con **transición personalizada** (zoom-through de 8 fotogramas), S2 a 0.5×, S3 con pan digital, S4 tonemapeado, título animado y logo final.

**Comprobaciones automáticas:**

| Comprobación | Umbral de éxito |
|---|---|
| ffprobe: H.264 High, yuv420p, 1080×1920, 30/1 CFR, AAC 48 kHz estéreo, etiquetas BT.709 | Exacto |
| Duración vs. manifiesto | ± 1 fotograma |
| Beats detectados por librosa vs. 120 BPM conocido | ≤ 1 fotograma (33 ms) de error en ≥ 95 % de los golpes |
| Posición de cada corte (cambio de color identificador) vs. manifiesto | Fotograma exacto |
| Sync A/V (destello vs. clic) | ≤ 1 fotograma |
| `blackdetect` / `freezedetect` | Sin negros ni congelados no previstos |
| `ebur128` | −14 LUFS ± 1, true peak ≤ −1 dBTP |
| Relación de aspecto: círculo de prueba en S1 sigue siendo círculo | Medido por máscara en un fotograma |
| Determinismo: render ×2 → `framemd5` | Idéntico (si no, documentar por qué) |
| Reexportación: mover un corte en el manifiesto y volver a renderizar | El corte se mueve exactamente lo indicado |
| Originales: sha256 antes y después | Idénticos |
| Contact sheet de la salida | La reviso visualmente y documento lo que veo |
| Benchmark | Tiempo por etapa; fps de Remotion en 4 vCPU |

Además se renderiza la **línea base solo-FFmpeg** del mismo manifiesto (cortes + fundido), para comparar coste y calidad y justificar con datos el uso de Remotion.

---

## 9. Qué necesito de ti para empezar

1. **¿Dónde ejecutamos?** Windows local (recomendado) o este contenedor. Si es Windows, ejecuta:
   `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\audit-env.ps1 > env-audit-windows.txt`
   y pégame el resultado.
2. **¿Dónde vive el código?** Recomiendo un **repositorio privado propio** (`AI_CINEMATIC_VIDEO_ENGINE`) en vez de una subcarpeta del recepcionista de WhatsApp (riesgo R10). Puedes crearlo tú y añadirlo a la sesión, o autorizarme a crearlo. Mientras tanto, la Fase 1 queda en esta subcarpeta.
3. **Autorización de instalación para la Fase 2**, todo local al proyecto: paquetes npm de §4 (Remotion 4.0.537, React, Zod, TypeScript, Vitest, tsx) y Chrome Headless Shell 157. Para la Fase 3: venv con `librosa`, `soundfile`, `opencv-python-headless`.
4. **Licencia de Remotion:** ¿cuántas personas tiene la empresa que usará esto? ¿Lo usarás solo para tu barbería o lo ofrecerás como servicio a otras?
5. **Los 3 vídeos de referencia**, por el canal de §5, con 2–3 líneas de qué te interesa de cada uno y su procedencia.
6. **Para la Fase 4** (no hace falta ahora): metraje original sin editar (mejor 4K vertical, 60 fps, HDR desactivado o lo tratamos), música con licencia para uso publicitario, logo en SVG o PNG transparente, fuentes y colores de marca, nombre del negocio y llamada a la acción.
