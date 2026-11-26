# Estudio de vídeos de YouTube (lote 28, 2026-11-03)

**Primer lote en el que se estudian vídeos de verdad.**

**Cómo se accedió:** los vídeos se reprodujeron en el navegador del ordenador del usuario, enlazado a la sesión, con anuncios incluidos. Sobre cada uno:
- se leyó el panel **"Mostrar transcripción"** de YouTube (subtítulos automáticos en inglés);
- se **pausó el vídeo en momentos concretos** para inspeccionar fotogramas (código en pantalla y resultado).

**Evidencias:** registro con URL, duración, estados y sha256 de cada transcripción en `evidence/youtube/2026-11-03-lote28/registro_videos.json`; fotogramas en `…/fotogramas/`; prueba de la fase 4 en `…/fase4/`.

| Estado | Vídeos |
|---|---|
| VIDEO_INSPECCIONADO + TRANSCRIPCION_ANALIZADA + CODIGO_INSPECCIONADO | 9Y2bjYQCWvE, DTTNSjyEtes (Codegrid), 3SJIPjlSjtM (Artiukh) |
| VIDEO_INSPECCIONADO + TRANSCRIPCION_ANALIZADA | 9eHEOAn2FOA (Larose) |
| TRANSCRIPCION_ANALIZADA + CODIGO_INSPECCIONADO | z1wZp4jV4cQ (Hyperplexed, CodePen) |
| TRANSCRIPCION_ANALIZADA (+ código del plugin en el paquete npm) | YftYHkS5Dao, rwdlO3uIlwk (GreenSock) |
| TRANSCRIPCION_ANALIZADA | 37wy90RnATM (Hyperplexed) |
| Pendientes prioritarios | Ver `registro_videos.json` → `pendientes_prioritarios` |

**Limitaciones del método:**
- La transcripción automática tiene errores ("gsop" = GSAP, "Lennis" = Lenis).
- Los fotogramas son pocos: cada salto en el vídeo dispara anuncios.
- No se ha reproducido ningún vídeo completo fotograma a fotograma.
- No se ha leído el código de pago de Codegrid (Gumroad).

---

## 1. Olivier Larose
- **Vídeo:** *My Top 5 Techniques for Web Animation* (9:58), [9eHEOAn2FOA](https://www.youtube.com/watch?v=9eHEOAn2FOA).
- **Técnica que enseña:** es un **repaso**, no un tutorial con código.
  - Las cinco técnicas: scroll tracking (progreso 0–1; ScrollTrigger o `useScroll`, con Lenis o Locomotive para suavizar la rueda), detección de viewport (IntersectionObserver por debajo), `position: sticky`, easing y división de texto.
  - Extras: `mapRange`, `lerp` en rAF y shaders.
- **Código, recursos y herramientas:** GSAP, Framer Motion, Lenis, SplitText o SplitType. El código está en sus repositorios, que ya inspeccionamos en lotes anteriores (VR-011…075).
- **Errores y limitaciones que revela:**
  - Sin smooth scroll, la rueda produce animaciones "a saltos".
  - SplitText puede romper la accesibilidad y fallar en el resize si no se gestiona.
  - `sticky` obliga a "pensar fuera de la caja" para que no se note.
- **Conocimiento nuevo:** poco. Confirma con una fuente de experto lo que ya tenían ST-001, LN-001, TXT-001 y A11Y-001. La aportación útil es el **criterio**: el easing es lo que separa una web amateur de una profesional, y `mapRange` es una herramienta transversal (progreso del scroll → escala, posición u opacidad; píxeles → coordenadas WebGL).
- **Cómo lo aplicará Claude Code:** como lista de comprobación de base. Ninguna escena cinematográfica sin smooth scroll, easing declarado por tramo (MOT-002) y texto dividido con accesibilidad (TXT-001).
- **Nivel Enky:** cimiento de D y E, pero no las diferencia.

## 2. Codegrid
**Vídeo A:** *This Scroll Animation Makes Every Image Reveal Feel Like Hacking* (11:00), [9Y2bjYQCWvE](https://www.youtube.com/watch?v=9Y2bjYQCWvE). Inspirado en kvs.services.
- **Técnica:** **disolución por una banda de celdas de caracteres** entre imágenes a pantalla completa apiladas, sin canvas ni WebGL.
  - Una rejilla de `div` absolutos con un carácter aleatorio cada uno, que se muestran u ocultan con `visibility`.
  - Cada imagen se recorta con un `clip-path: polygon` que va de arriba abajo.
  - Pin con `end = nTransiciones × innerHeight`, `scrub: true` y Lenis conectado al ticker (`lagSmoothing(0)`).
- **Código leído en los fotogramas 8:35 y 10:00:**
  - `transicion = floor(progress × N)` y progreso local `clamp(0, 1, raw − transicion)`;
  - centro de la banda = `−spreadAbove + local × (1 + spreadAbove + spreadBelow)`;
  - por celda: distancia normalizada a la banda + desplazamiento aleatorio (*hash* determinista seno, como en un shader), escalado por la distancia al núcleo;
  - densidad `(1 − d)²`, visible si densidad > umbral aleatorio × umbral global;
  - fuera de las transiciones se ocultan todas las celdas y solo se actualiza el recorte.
- **Recursos:** imágenes a pantalla completa (`object-fit: cover`) y una fuente monoespaciada.
- **Errores y limitaciones:**
  - El código fuente es de pago.
  - **Coste:** recorre **todas** las celdas en cada fotograma (con 1 440 × 900 y celdas de ~24 px son ~2 250 nodos). No se mide en el vídeo.
  - Estética "digital": no encaja con producto gastronómico salvo como acento.
- **Conocimiento nuevo → TRN-001:** patrón de **banda de transición con densidad cuadrática y umbral aleatorio determinista**, reutilizable en canvas (partículas de REC-002) o en máscaras.

**Vídeo B:** *ScrollTrigger Hijacked My Video Playback* (21:15), [DTTNSjyEtes](https://www.youtube.com/watch?v=DTTNSjyEtes). Inspirado en adaline.ai.
- **Técnica:** **vídeo controlado por scroll como secuencia de imágenes en canvas.**
  - Asegura que la mayoría de webs premiadas usan secuencia y no `<video>`.
  - Exporta más de 200 fotogramas TIFF desde DaVinci Resolve (versión gratuita), porque los conversores en línea "se saltan fotogramas", y los convierte a JPG con un bucle `sips`.
  - Precarga todos los fotogramas con contador y con `onerror` que también descuenta, para que un fotograma roto no bloquee.
  - Canvas a DPR con `ctx.scale`, dibujo tipo *cover*, pin `end: +=innerHeight × 7` y **`scrub: 1`** (fotograma 17:48; la narración dice "directo").
  - El índice del fotograma usa `progress / 0.9`: el 10 % final queda libre para el despin.
  - Cabecera con perspectiva que retrocede en Z y se desvanece en 20–25 %; imagen del panel que llega desde Z en 60–90 %; resize → recalcular el canvas, redibujar y `ScrollTrigger.refresh()`.
- **Errores y limitaciones:**
  - **No menciona la memoria.** 200 fotogramas de 1 920 × 1 080 decodificados ocupan ~1,6 GB (ancho × alto × 4; AIIMG-001). En móvil es inviable sin reducir resolución y número, que es lo que proponen SEQ-002 y SEQ-003.
  - El código es de pago.
- **Conocimiento nuevo → SEQ-001/002:**
  - receta de extracción sin perder fotogramas (editor de vídeo → TIFF → JPG);
  - precarga tolerante a fallos;
  - reserva del 10 % final para el despin;
  - coreografía Z de los textos sobre la secuencia.
- **Cómo lo aplicará Claude Code:** con un vídeo de IA del usuario (O1 de REC-003), extraer los fotogramas con ffmpeg (ya instalado), recortarlos con `preparar_recursos.py`, reducirlos según SEQ-002 y dibujarlos con el índice limitado al 90 %.
- **Nivel Enky:** **D** (secuencias por scroll), **E** y **G** (integrar vídeo generado por IA).

## 3. Yuri Artiukh
- **Vídeo:** *Video exploding to particles, m-trust.co.jp with Three.js and WebGL #44* (directo de 1:07:45, 2020), [3SJIPjlSjtM](https://www.youtube.com/watch?v=3SJIPjlSjtM). Es una decompilación de una web japonesa.
- **Técnica:** **un vídeo HTML que, al terminar, "explota" en partículas WebGL y se recompone.**
  - (a) `THREE.Points` sobre una geometría de plano con **tantos segmentos como píxeles del vídeo**: cada vértice es una partícula y la geometría ya trae las UV, así que el color sale de la textura sin cálculos.
  - (b) **Ruido curl** como desplazamiento (`posición + curl(posición, tiempo) × distorsión`), con un uniform `distortion` animado por GSAP.
  - (c) Se descartan las partículas negras.
  - (d) **Bloom** (`UnrealBloomPass`) cuya intensidad sube con la explosión.
  - (e) **Truco de alineación HTML ↔ WebGL:** el `<video>` y la escena dependen los dos de la **altura** del viewport, así que coinciden sin código de resize.
  - (f) Relevo: en el evento `ended` el vídeo pasa a `opacity 0` en **0,1 s** sobre el último fotograma, ya pintado en partículas detrás. Imperceptible porque coinciden.
  - (g) Mezcla de dos texturas por `progress` para volver al primer fotograma y repetir.
- **Código leído en el fotograma 55:35:** `gsap.to(video, { opacity: 0, duration: 0.1 })`, `distortion → 3` en 2 s, `bloomPass.strength → 10` y vuelta con `delay: 2`.
- **Errores que revela el propio directo:**
  - **autoplay** solo con `muted`;
  - sin un timeline, las animaciones encadenadas se pisan;
  - la salida sRGB con postprocesado cambia el color;
  - una variable sobrescrita rompió el progreso;
  - el autor cree que `VideoTexture` evitaría las capturas de inicio y fin, pero no lo prueba.
  - **Versión de three.js de 2020** (`PlaneBufferGeometry` ya no existe por separado).
- **Conocimiento nuevo → REC-002 y TRN-001:**
  - el **relevo sin salto entre un `<video>` real y una réplica WebGL** (misma geometría, mismo fotograma y cambio de opacidad muy corto);
  - partículas = vértices de un plano con UV;
  - explosión = uniform de distorsión con curl + bloom sincronizado.
- **Cómo lo aplicará Claude Code:**
  - Para el puente de partículas de REC-002 con recursos reales: la imagen o el vídeo de IA en HTML, y la réplica en partículas detrás, alineada por la misma regla de tamaño.
  - **Requiere three.js:** no está instalado y necesita autorización.
- **Nivel Enky:** **B** (gota → partículas → máquina en los reels R2/R6) y **G**.

## 4. Hyperplexed
**Vídeo A:** *The Turbulent Particle Effect With Zero JS Required* (7:00, 2023), [z1wZp4jV4cQ](https://www.youtube.com/watch?v=z1wZp4jV4cQ). CodePen público MWqNroM, leído.
- **Técnica:** **"desmaterialización" con filtro SVG.**
  - `feTurbulence` (`fractalNoise`, `baseFrequency 0.7 0.8`) cuya `seed` se anima de 0 a 100 da estática.
  - `feDisplacementMap` con `SourceGraphic` desplaza la imagen con esa estática; `scale` va 0 → 40 → 0.
  - Todo con `<animate>` de SMIL al pasar el ratón y un pulso de escala CSS sincronizado.
- **Errores y limitaciones:**
  - Sin `scale = 0` en reposo la imagen queda borrosa siempre (lo explica el vídeo).
  - El vídeo **no mide el coste**. **Medido en el lote 28** con scroll (GSAP anima `attr.scale` y `attr.seed`):
    - a pantalla completa (1 440 × 900): **15–21 fotogramas > 33 ms y p95 = 50 ms** (no viable sin GPU);
    - del tamaño de un producto (40vw × 60vh): **0 fotogramas > 33 ms**.
- **Conocimiento nuevo → TRN-001 y REC-003:** transformación "orgánica" barata **solo para capas del tamaño del objeto**; nunca a pantalla completa.

**Vídeo B:** *New browser update lets you set things on FIRE* (7:40, 2026), [37wy90RnATM](https://www.youtube.com/watch?v=37wy90RnATM).
- **Técnica:** la librería Canvas UI sobre la **API experimental HTML-in-canvas**.
  - **Idea reutilizable:** dos sistemas independientes (una losa 3D y el HTML) que **consumen la misma matriz de posición** y se superponen sin costuras. La misma idea que el truco de alineación de Artiukh.
- **Limitación:** la API es experimental. No sirve para producción hoy; se registra solo el principio.

## 5. GreenSock (GSAP Learning)
**Vídeo A:** *Introducing Flip Plugin for GSAP* (24:09), [YftYHkS5Dao](https://www.youtube.com/watch?v=YftYHkS5Dao). Leídos los tramos 7:20–10:00 y 12:20–17:20.
- **Técnica:**
  - **`Flip.fit(a, b, { fitChild })`** mueve y escala el contenedor `a` para que **uno de sus hijos** encaje en `b`, incluso con rotaciones y transformaciones anidadas. También puede ajustarse a un **estado registrado** antes.
  - **`data-flip-id`** iguales permiten animar un elemento distinto (la imagen grande) desde la posición de otro (la miniatura).
  - `fade: true` + `absolute: true` hacen un fundido cruzado real.
- **Código leído:** `Flip.js` 3.15.0 del paquete instalado.
  - `fitChild` alinea la posición del hijo y escala por la relación de ancho y alto: si las proporciones difieren, la escala no es uniforme.
- **Prueba del lote 28** (aterrizaje del héroe en el nido del plato de REC-003):
  - `Flip.fit(contenedor, nidoPlato, { fitChild: nidoHéroe, scale: true, getVars: true })` alinea con un error de **0,6–1,25 px**, frente a los 0,25–0,62 px del cálculo manual del lote 27. Equivalente, pero no más preciso.
  - Ventaja: no hay que mantener la geometría a mano.
  - Restricción: el hijo debe estar **dentro** del elemento que se transforma (un `<img>` no sirve: hay que envolverlo).

**Vídeo B:** *ExpoScaleEase for smooth scaling and zooming* (7:16), [rwdlO3uIlwk](https://www.youtube.com/watch?v=rwdlO3uIlwk).
- **Técnica:** una escala lineal **parece frenar**, porque el porcentaje de cambio disminuye: de ×1 a ×2 es +100 %, de ×9 a ×10 es +11 %. `ExpoScaleEase.config(inicio, fin, ease)` curva el ease para que el **tamaño percibido** siga la curva deseada. Necesita los valores inicial y final.
- **Encadenar imágenes recortadas al 50 %** con zoom expo produce un zoom "infinito" sin pulsos: transición de cámara entre escenas.
- **Prueba del lote 28:**
  - con `expoScale(1, s, power2.inOut)` el logaritmo del área sigue la curva objetivo con **RMS 0,0009 (1 440) / 0,0004 (375)**, frente a **0,024 / 0,013** con la escala normal: unas 25 veces mejor;
  - **limitación medida:** como el `ease` se configura al construir el timeline, tras un resize **sin** cruzar un punto de corte el ritmo queda desajustado (RMS 0,0123). Hay que reconstruir el timeline tras el resize (`callAfterResize`, GS-005).
- **Sintaxis:** el vídeo usa GSAP 2. En GSAP 3: `ease: "expoScale(1, 0.4, power2.inOut)"` con `EasePack` registrado.
- **Nivel Enky:** **A** (el objeto permanece y aterriza entre escenas) y **F** (zoom de cámara y dolly percibidos como continuos).

---

## Qué se incorporó a la biblioteca
| Ficha | Conocimiento | Fuente |
|---|---|---|
| CONT-001 | `Flip.fit` con `fitChild` y `getVars` para alinear un hijo (nido) con un destino, más la medida de precisión; `data-flip-id` + `fade` + `absolute` para relevos entre recursos distintos | GreenSock A + prueba |
| MOT-002 | ExpoScaleEase: el zoom percibido, cómo configurarlo, su medida y la limitación tras el resize | GreenSock B + prueba |
| SEQ-001/002 | Extracción sin pérdidas, precarga tolerante, índice al 90 %, coreografía Z y advertencia de memoria | Codegrid B |
| TRN-001 | Banda de disolución con densidad cuadrática y umbral determinista; filtro de turbulencia y desplazamiento solo en capas pequeñas (medido) | Codegrid A, Hyperplexed A |
| REC-002 | Relevo vídeo HTML ↔ réplica WebGL de partículas (alineación por la altura del viewport, opacidad en 0,1 s, curl + bloom) | Artiukh |
| DEPTH-001 | Sincronizar capas HTML y WebGL consumiendo la misma geometría o matriz | Artiukh, Hyperplexed B |

---

# Lote 29 (2026-11-04) · ENKY MOTION EDITING MASTERCLASS — Fase 1

**Incidencia:** durante todo el lote, el ordenador del usuario estuvo **desconectado del puente**. Era el único acceso verificado a YouTube (transcripción y fotogramas, lote 28). Por eso:
- **ningún vídeo de este lote se ha visto**;
- no hay timestamps;
- desde la nube, YouTube devolvió metadatos de una página y límites de peticiones en las demás.

Registro completo: `evidence/research/2026-11-04-lote29/registro_fuentes.json`.

| Fuente | Estado real | Aporte |
|---|---|---|
| Ben Marriott, *After Effects Smooth Transitions pt. 2* ([rWUZWMDsglc](https://www.youtube.com/watch?v=rWUZWMDsglc), 2019) | SOLO_METADATOS (descripción: flujo de trabajo, easing, anticipación, transiciones 2D; After Effects) | **Pendiente** |
| Sonduckfilm ([YcHH6_T9DTU](https://www.youtube.com/watch?v=YcHH6_T9DTU), [uX5J3dnQZao](https://www.youtube.com/watch?v=uX5J3dnQZao)) | INACCESIBLE (límite de peticiones; navegador desconectado) | **Pendiente**, incluida la distinción entre vectorial y fotorrealista |
| Runway, *Image to Video Prompting Guide* (Help Center, Gen-4.5) | DOCUMENTACION_OFICIAL_ANALIZADA. La URL de Academy dio error dos veces; se leyó la guía oficial equivalente | → **AIVID-001** |
| Curious Refuge, índice de tutoriales | SOLO_METADATOS: ninguno trata start/end frames ni la consistencia de producto | — |
| Curious Refuge, *How to Change Camera Angles With AI* | ARTICULO_AUTOR_ANALIZADO (Seedance 2.5) | → **AIVID-001** (cobertura y límites de continuidad) |
| Codrops / Yuri Artiukh, *Three.js Postprocessing Transition* (2022) | SOLO_METADATOS: la página solo anuncia el directo y no enlaza código ni demo | **Pendiente** (vídeo) |
| Codegrid [9Y2bjYQCWvE](https://www.youtube.com/watch?v=9Y2bjYQCWvE) | Ya estudiado (VR-233) | Sin duplicar |
| Olivier Larose, índice del blog | SOLO_METADATOS. Máscara, perspectiva, zoom y sección ya estaban (SECT-001, PIX-001, ZOOM-001, CLIP-001). `svg-mask-scroll` y `mask-entry` son INACCESIBLE_POR_COSTE | — |

## Receta provisional "conectar dos escenas sin que parezcan dos imágenes con un fundido"
**Es de la biblioteca, NO de Marriott:** se contrastará con su vídeo cuando se pueda ver. Cada pieza procede de algo ya probado o documentado:
1. **El mismo objeto atraviesa el corte.** El protagonista de A aterriza en su nido en B: `Flip.fit` + `fitChild`, probado en el lote 28 (error de 0,96–1,11 px).
2. **La velocidad no se detiene en la unión.** El tramo que entra y el que sale comparten velocidad (MOT-002: `blendEases` o tramos solapados); el zoom va con `expoScale` (medido).
3. **El cambio de fondo se esconde** tras el protagonista o tras un cambio de texto, como el cambio de profundidad en p = 0,72 de REC-003 (medido).
4. **Si hay transformación real** (forma o giro), no se hace con CSS: clips image-to-video **encadenados por el último fotograma**, sin el fotograma compartido, en **una sola secuencia** (AIVID-001 §6, documentado por Runway; el cosido web está sin ejecutar).
5. **Verificación:**
   - `cortes_video.py` = 0 cortes;
   - en la unión, sin meseta ni salto de velocidad (curvas de MOT-002);
   - C2 y C3 los revisa una persona.

**Prohibido como sustituto:** un `opacity` cruzado entre dos imágenes presentado como "transición" (regla del lote 29).

---

# Lote 30 (2026-11-04) · Análisis real de vídeos y transiciones Enky

**Acceso recuperado:**
- **Navegador del ordenador del usuario y YouTube: OK** (metadatos, panel de transcripción y fotogramas pausados).
- Chrome con extensión: no se necesitó.
- Herramientas de vídeo del contenedor (ffmpeg y Playwright): OK, sin instalar nada.

**Registro:** `evidence/youtube/2026-11-04-lote30/registro_videos.json`, con el sha256 de cada transcripción y 8 fotogramas.

**Vistos de verdad (transcripción + fotogramas):**
- Marriott rWUZWMDsglc, UVDpgP7sRbw y _cjEnGWN3Ug;
- Sonduck uX5J3dnQZao;
- Artiukh 12yVUxIkag0 (también el código en fotogramas).

**Solo transcripción:** Marriott ythBGTLjot8 y LcWJKYbYvi8; Sonduck YcHH6_T9DTU y xvCTlEIvC8U.

**Siguen bloqueados:** Runway Academy (sustituida por la guía del Help Center) y los tutoriales de pago de Larose.

**No repetidos:** los 8 del lote 28.

Leyenda de los 12 puntos: 1 ficha · 2 timestamps · 3 efecto · 4 pasos · 5 software · 6 capas y máscaras · 7 movimiento y easing · 8 transición · 9 errores · 10 adaptación a imágenes de IA · 11 web · 12 diferencia con Enky.

## Ben Marriott

### A · *After Effects Smooth Transitions pt. 2* — [rWUZWMDsglc](https://www.youtube.com/watch?v=rWUZWMDsglc) (5:25, 2019)
2. 0:32 null de rotación · 1:03–2:30 anillos de impacto y gráfico de valor · 2:49–3:47 rotación con anticipación (−14 → 200 → 250) · 4:02–4:25 **relevo en el momento más rápido** · 4:28–5:09 fotogramas de morph extra.
3. Dos círculos chocan, giran y se convierten en un yin-yang.
4. Pasos:
   - padres comunes a un null;
   - el choque en el punto más pequeño de los puntos interiores (~2 s);
   - anillos de trazo blanco con tamaño 800 y opacidad 0 en ~20 fotogramas, asas del gráfico vertical a la salida y horizontal a la llegada;
   - rotación con valle de anticipación;
   - las capas del yin-yang empiezan **en el fotograma de máxima velocidad**;
   - opcionalmente, un fotograma clave de trayectoria antes.
5. After Effects e Illustrator.
6. Null padre; anillos debajo de las tazas.
7. Curvas pulidas en el gráfico de **valor** hasta que "se sienta natural".
8. Choque + giro; el cambio de forma queda escondido por la velocidad.
9. Si el timing está "por todas partes", el cambio se ve.
10. El relevo I1 → I2 en el contacto, a máxima velocidad (receta ROSSO).
11. `tl.set(..., {opacity: 0}, tContacto)`; anillos con `expo.out`. Medido en la animática: **0 fotogramas de doble imagen**.
12. Enky usa objetos fotográficos, no formas planas: el relevo exige nidos equivalentes en luz y forma.

### B · *Smooth Transitions pt. 1* — [UVDpgP7sRbw](https://www.youtube.com/watch?v=UVDpgP7sRbw) (11:09, 2019)
2. 1:16 color global (escala de grises + CC Toner) · 3:00 elemento guía · 3:27 tamaño en lugar de escala (el trazo no se deforma) · 4:54 Ease Copy · 5:13 fotogramas extra para que los vértices no se crucen · 6:08–6:55 escala que sube despacio y cae rápido; **quitar elementos en el movimiento más rápido** · 8:43–9:38 la leche aclara el café de abajo arriba.
3. Taza en falso 3D que gira a vista cenital y se convierte en un círculo.
4. Pasos:
   - animar primero el borde (elipse cuyo eje Y va a 0) y fijar el tempo;
   - copiar el ease a la silueta y al asa;
   - líquido con alpha matte;
   - capa superior del café con paralaje;
   - escala final que revela el fondo.
5. AE, Illustrator y Ease Copy (gratis).
6. Mates de líquido, máscara restada y paralaje entre la superficie del café y el borde.
7. Salida fuerte y llegada más rápida; el mismo ease en todas las capas.
8. El giro en falso 3D lleva de la vista lateral a la cenital.
9. Trazo deformado al escalar; vértices que siguen caminos extraños.
10. "Elemento guía": la caída del héroe en ROSSO.
11. Un ease con nombre reutilizado en todas las pistas del tramo (GS-005).
12. Un giro de 90° de un objeto fotográfico **no** se puede falsear con una sola imagen → secuencia u O1 (MOT-002, AIVID-001).

### C · *Liquid Transition* — [_cjEnGWN3Ug](https://www.youtube.com/watch?v=_cjEnGWN3Ug) (5:26, 2019)
2. 0:13 encargo (lata → cerveza servida) · 0:28 animación en bruto · 0:50–1:08 espaciado: formas juntas = lento, separadas = rápido · 1:35–2:13 **solo ~3 fotogramas** para la lata que se deforma · 2:16 gotas secundarias que no arrancan ni paran a la vez · 2:49–3:09 limpieza con shape layers cada 2 fotogramas · 3:13–4:31 sombreado con set matte + roughen edges.
3. **Un producto se transforma en líquido** y revela el diseño siguiente.
4. Pasos:
   - fotogramas de estilo;
   - animación en bruto con papel cebolla (Rough Animator, 12,5 fps, 31 fotogramas: fotograma de 2:07);
   - extremos primero, intermedios después;
   - limpieza vectorial;
   - sombreado fotograma a fotograma;
   - logo deformado en Photoshop.
5. Illustrator, Photoshop, Rough Animator y AE.
6. Sombras y brillos como capas recortadas a la forma principal.
7. El espaciado define la aceleración (más separación = más velocidad).
8. Se esconde la forma imposible en los fotogramas más rápidos.
9. El tramo "imposible" se nota si es lento.
10. **Lo más cercano a CREMA y POUR de Enky.** Con imágenes de IA no se puede dibujar cada fotograma: se genera la transformación (O1, AIVID-001) y la web solo la reproduce.
11. Prerenderizado (secuencia en canvas, SEQ-001). **No** es tiempo real.
12. Enky es fotorrealista: hace falta vídeo generado o 3D, no shape layers.

### D · *This Animation Technique Works Every Time* (match cut) — [ythBGTLjot8](https://www.youtube.com/watch?v=ythBGTLjot8) (8:02, 2022) — solo transcripción
2. 0:25 definición · 1:26–1:58 escala 100 → 105 acelerando hacia el corte y saliendo de él · 2:02 "sé sutil" · 2:29 por posición o rotación · 3:32 el objeto cambia 1–2 fotogramas antes del corte · 4:11 secundarios que reaccionan al corte · 7:40 "el éxito depende de la anticipación".
3. Corte con continuidad de sujeto o de movimiento.
4. Pasos: escala en las dos composiciones y gráfico de valor muy acentuado.
5. AE.
6. —
7. Acelerar hacia el corte y salir acelerado.
8. Corte disfrazado.
9. Exceso (montaje "de TikTok").
10. Push-in del escenario de ≤ 3–5 % a través del relevo.
11. `scale` del contenedor de la escena con `power2.in` / `power2.out`.
12. Enky encadena secciones con el objeto continuo: es un match cut de sujeto.

### E · *The #1 Skill All Animators Need* (anticipación) — [LcWJKYbYvi8](https://www.youtube.com/watch?v=LcWJKYbYvi8) (12:41, 2021) — solo transcripción
2. 2:00 definición · 4:33–5:30 tres fotogramas fijos bastan si el central va **hacia atrás** · 6:00–7:20 la anticipación dirige la mirada · 8:07–9:20 copiar el primer fotograma clave antes y empujarlo en sentido contrario; gráfico de valor · 9:30–10:28 anticipación ×3 de la duración y asas inclinadas para que nunca esté quieto · 10:30–11:04 anticipación con solo las asas · 11:20–12:00 en otra propiedad (rotación o trayectoria).
10–11. Implementado en la animática: −134 px/s hacia arriba antes de la caída. Para un gesto corto existe `back.in` en GSAP (no es una curva a mano).

## SonduckFilm

### F · *How to Liquid Morph Motion Graphics* — [YcHH6_T9DTU](https://www.youtube.com/watch?v=YcHH6_T9DTU) (1:00, 2025) — solo transcripción
- **Técnica (0:13–0:52):**
  - capa de ajuste con desenfoque gaussiano 100 + Simple Choker hasta que el contorno vuelve a ser nítido → las formas se funden (*gooey*);
  - después: ruido al 12 %, glow, posterize y posterize time a la mitad (aspecto stop-motion).
- **Web:** SVG `feGaussianBlur` + `feColorMatrix` (umbral de alfa) en tiempo real, **solo con formas planas** y en capas pequeñas (TRN-001).
- **Vectorial frente a fotorrealista:** con una foto de producto desenfoca y recorta el **color**, no la forma → **no sirve** para la pasta de ROSSO. Sí para gotas planas de color o salpicaduras gráficas.

### G · *Create Liquid Transitions* — [uX5J3dnQZao](https://www.youtube.com/watch?v=uX5J3dnQZao) (0:50, 2023) — transcripción + fotograma 0:37
- **Técnica:**
  - rectángulo mayor que la composición con Turbulent Displace (Twist, cantidad 150) que sube;
  - duplicados de otro color desplazados en el tiempo;
  - el último duplicado es el **track matte** de la escena que se revela.
- **Web:** cortina líquida. Máscara SVG con `feTurbulence` + `feDisplacementMap` sobre rectángulos que suben, o `clip-path` con un borde ondulado precalculado.
  - A pantalla completa, el filtro es caro (p95 = 50 ms, lote 28) → **prerenderizar** como vídeo con alfa o como secuencia, o usar un borde ondulado calculado en JS sin filtro.
- **Enky:** P9 "panel que sube" → la cortina líquida es una variante.

### H · *Morph Logos & Objects Into Anything* — [xvCTlEIvC8U](https://www.youtube.com/watch?v=xvCTlEIvC8U) (4:08, 2025) — solo transcripción
- **Técnica:**
  - auto-trace para PNG (tolerancia 2–5);
  - empezar por el logo con más trayectorias;
  - una trayectoria sobrante se reduce a un punto en una esquina;
  - easy ease con velocidad máxima en el centro + **motion blur**.
- **Límite:** es un morph de **contorno**. Un producto fotográfico no se puede auto-trazar sin perder textura y luz → solo siluetas o máscaras. La alternativa fotorrealista es AIVID-001.

## Yuri Artiukh

### I · *Transition effect with #threejs postprocessing* — [12yVUxIkag0](https://www.youtube.com/watch?v=12yVUxIkag0) (1:12:35, 2022). Directo de la página de Codrops VR-246
2. Momentos clave:
   - 4:30 el *cover* a pantalla completa se hace con **CSS** (canvas fijo de 1 920 de ancho centrado);
   - 15:30–30:50 **la misma foto en 3 planos**: los delanteros llevan un **alphaMap con un agujero** y están más cerca de la cámara → profundidad 2,5D desde una sola imagen;
   - 31–35 rotación del grupo con inercia del ratón;
   - 39:53 EffectComposer + RenderPass + ShaderPass;
   - 48:21–51:52 **shader de cortina**: desplazamiento de `uv.x` por `uProgress` distinto en cada cuarto de pantalla (0; 0,25; ~0,35; más) para no ver el borde (fotograma 50:40);
   - 52–55 RGB shift (±0,1 · progreso);
   - 56:45–1:03:15 **timeline desfasada** (fotograma 1:01:30);
   - 1:05 oscilación en z de los planos mientras se mira la imagen (zoom lento);
   - 1:10 el texto, en HTML.
3. Galería de fotos con profundidad y transición de cámara + cortina + RGB shift.
4. Pasos:
   - planos del tamaño de la imagen;
   - máscaras invertidas (three.js necesita blanco y negro, no transparencia; JPEG de 50 KB);
   - grupo por imagen separado en x;
   - cámara x 0 → 2 500 en 1,5 s; z 900 → 700 → 900; efecto 0 → 1 → 0 en 2 s.
5. three.js (r145 aprox.), postprocessing de los ejemplos, GSAP, Parcel y una librería de eventos de ratón.
6. 3 capas de la misma foto con agujero central.
7. Eases `power*.inOut`; **duraciones distintas a propósito**.
8. Movimiento de cámara + distorsión en postprocesado que oculta "que solo es una cámara moviéndose".
9. Borde de la textura visible si se desplaza más de un cuarto; colores cambiados por la salida del composer (gamma/encoding).
10. **Las capas con agujero son la base de la profundidad de una foto de IA** sin modelo 3D: mismo recurso, máscara de agujero (generable con `preparar_recursos.py`: máscara del sujeto) y paralaje → DEPTH-001.
11. three.js **sin autorizar**.
    - Lo transferible sin él: capas DOM de la misma imagen con `mask-image` y paralaje, y desfase de duraciones en GSAP (EDIT-001 §2.8).
    - La cortina se podría aproximar con tiras de `clip-path` desplazadas (**no probado**).
12. Enky cambia de escena con paneles y objetos continuos; esta es una alternativa para galerías.

## Qué se aprendió de verdad (nuevo, no duplicado)
1. **Relevo a máxima velocidad**, medido (EDIT-001).
2. **El scroll lo rompe** si la velocidad la decide el usuario → disparar el tramo en tiempo u ocultarlo.
3. **Match cut de escala ≤ 5 %** a través del corte.
4. **Traspaso de peso** en el contacto (sin meseta).
5. **Animática con fixtures antes de los recursos.**
6. **Elemento guía + ease compartido.**
7. **Efectos desfasados de la cámara.**
8. **Foto en capas con agujero** para la profundidad.
9. **Límites del morph vectorial y del *gooey* con fotos.**
10. **Tabla de AE frente a GSAP y de prerenderizado frente a tiempo real.**

## Comparación con los movimientos de Enky (CASE-003)
| Rasgo de Enky | Técnica aprendida | Qué falta para igualarlo |
|---|---|---|
| P2 el objeto se transforma (tenedor → plato) | Relevo a máxima velocidad + match cut | Recursos reales con nidos equivalentes; desenfoque de movimiento (I1-smear) |
| P10 movimiento líquido continuo (POUR, CREMA) | Transformación prerenderizada (Marriott C); AIVID-001 | Clip de IA o 3D: no se puede hacer con shape layers ni con *gooey* sobre fotos |
| P9 panel que sube | Cortina líquida (Sonduck G) | Prerenderizar si es a pantalla completa |
| Ingredientes que orbitan y se posan | Secundarios escalonados | Comprobado en la animática |
| Cámara "viva" | Push-in desfasado (Marriott D, Artiukh) | Comprobado en la animática; C3 pendiente |
