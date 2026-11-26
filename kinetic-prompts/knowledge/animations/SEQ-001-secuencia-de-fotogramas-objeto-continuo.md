---
id: SEQ-001
titulo: Objeto protagonista continuo entre secciones con una secuencia de fotogramas en canvas controlada por el scroll (helper oficial de GSAP), con alfa para colocar texto detrás y delante, y alternativas con vídeo
categoria: animations
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (gsap.com/docs/v3/HelperFunctions/helpers/imageSequenceScrub) + ARTICULO_AUTOR_ANALIZADO (Jake Archibald, "Video with alpha transparency on the web", 2024) + VIDEO_INSPECCIONADO (efecto observado en CASE-003, sin tecnología confirmada)
versiones: GSAP 3.x con ScrollTrigger (helper sin versión indicada); docs 3.15
perfil: cinematografico
ultima_revision: 2026-11-03
---

# SEQ-001 · Secuencia de fotogramas con el scroll

1. **Nombre y finalidad.** Que un objeto fotorrealista se **transforme de forma continua** (granos → gotero → taza; navaja → espuma → toalla) mientras el usuario hace scroll, sin cortes entre secciones. Es el patrón P2/P10 de CASE-003.
2. **Fuentes.**
   - Helper oficial de GSAP `imageSequence` (en la página "imageSequenceScrub").
   - Jake Archibald, *Video with alpha transparency on the web* (jakearchibald.com/2024/video-with-transparency/).
   - VID-001, para el scrub de `currentTime` de un `<video>`.
   - Codrops "From HTML5 Video to Frame Sequences" (OPTIKKA): **INACCESIBLE** (error del sitio el 2026-10-27).
3. **Ubicación.** Código completo del helper en la doc; tabla de formatos y comandos de ffmpeg en el artículo.
4. **Resultado.** Una capa `<canvas>` fijada (`position: sticky` o pin de ScrollTrigger) dibuja el fotograma `i = round(progreso × (N−1))`. Los textos HTML de cada acto entran y salen por encima o por debajo.
5. **Explicación técnica.**
   - **Helper oficial [DOC]:** crea un `Image` por URL; solo el primero tiene `onload` (dibuja en cuanto carga). Interpola `playhead.frame` de 0 a N−1 con `ease: "none"` y dibuja con `ctx.drawImage(images[Math.round(frame)], 0, 0)`. El ejemplo usa `scrollTrigger: { start: 0, end: "max", scrub: true }`, marcado como "important!".
   - **Lo que la doc NO resuelve [DOC → hay que añadirlo]:**
     - el tamaño del canvas (no lo fija);
     - esperar a que carguen todos los fotogramas;
     - los errores de carga;
     - limpiar el canvas entre fotogramas: con alfa hace falta `clearRect`, porque si no los fotogramas se acumulan [inferencia de la API de canvas].
   - **Vídeo con alfa [DOC, Archibald]:**
     - VP9 con alfa (WebM): Chrome y Firefox.
     - HEVC con alfa: Safari (va **primero** en los `<source>`).
     - AV1 no tiene alfa.
     - El AVIF animado se comporta mal.
     - Recomendación del autor: **"stacked alpha"** (color arriba y alfa en gris abajo, en un solo vídeo, recompuesto en WebGL). Su ejemplo pesa 460 kB (AV1 apilado) frente a 1,1 MB (VP9 con alfa) y 3,4 MB (HEVC con alfa).
     - Problemas: Chrome Android interpreta mal el alfa (corregido en Canary entonces) y Firefox Android se atasca.
6. **Dependencias.** `gsap` + ScrollTrigger (PLAN_ASTRO_GSAP, gsap@3.15.0). Recursos: N imágenes WebP o AVIF con alfa, o un vídeo. **Producirlos es el paso caro** (CASE-003 §10).
7. **Procedimiento [adaptación propia].**
   1. Producir 1 secuencia por historia (no por sección), con el objeto **centrado y con alfa** y la misma luz en todo el recorrido.
   2. Exportar a dos resoluciones: escritorio ~1 600 px y móvil ~900 px de lado mayor [EST]. Recuento orientativo: 90–150 fotogramas para 3 actos [EST].
   3. Crear el canvas con `width/height = tamaño CSS × devicePixelRatio`, limitado a 2.
   4. Precargar con `img.decode()` (o `createImageBitmap`) en lotes. Mostrar el fotograma 0 de inmediato y el resto progresivamente; mientras faltan fotogramas, dibujar el más cercano ya cargado.
   5. ScrollTrigger con `pin` en la sección contenedora y `scrub: 0.5–1` para suavizar. Los textos de cada acto van en un *timeline* con etiquetas (`"acto2"`) sobre el mismo trigger.
   6. **Reduced motion:** sin secuencia. Se muestra el fotograma clave de cada acto como `<img>` estático (A11Y-001).
8. **Parámetros.** N fotogramas, formato, resolución por dispositivo, `scrub`, duración del pin (`end: "+=300%"`), puntos clave de cada acto.
9. **Código (adaptación del helper oficial; no ejecutada):**
   ```js
   function secuencia({ canvas, urls, trigger }) {
     const ctx = canvas.getContext("2d"), imgs = urls.map(u => { const i = new Image(); i.src = u; return i; });
     const play = { f: 0 }, dpr = Math.min(devicePixelRatio, 2);
     const ajustar = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * dpr; canvas.height = r.height * dpr; pintar(); };
     function pintar() {
       let k = Math.round(play.f); while (k > 0 && !(imgs[k].complete && imgs[k].naturalWidth)) k--; // el más cercano ya cargado
       const im = imgs[k]; if (!im.naturalWidth) return;
       const s = Math.min(canvas.width / im.naturalWidth, canvas.height / im.naturalHeight);
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       ctx.drawImage(im, (canvas.width - im.naturalWidth * s) / 2, (canvas.height - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
     }
     imgs[0].onload = ajustar; addEventListener("resize", ajustar);
     return gsap.to(play, { f: urls.length - 1, ease: "none", onUpdate: pintar,
       scrollTrigger: { trigger, start: "top top", end: "+=300%", pin: true, scrub: 0.6 } });
   }
   ```
10. **Problemas habituales.**
    - Peso: 120 fotogramas × 80–150 kB = **10–18 MB** [CALC con tamaños estimados]. Hacen falta lotes, una resolución para móvil y no bloquear el LCP (el fotograma 0 va como `<img>` con prioridad).
    - Saltos en dispositivos lentos si se decodifica al dibujar → decodificar antes.
    - Canvas borroso si no se aplica `devicePixelRatio`.
    - Sin `clearRect` los fotogramas con alfa se acumulan.
    - Un ancestro con `transform` rompe el pin (ST-002).
    - Con un `<video>`, el scrub hacia atrás salta si hay pocos fotogramas clave (VID-001).
11. **Rendimiento / a11y.**
    - Presupuesto de peso por historia (EVAL-001 §técnico).
    - El texto **nunca** va dentro de las imágenes: debe ser HTML seleccionable, traducible y con buen SEO, al contrario que en los reels.
    - `aria-hidden="true"` en el canvas decorativo y un `alt` en el fotograma clave estático.
12. **Compatibilidad.** El canvas 2D funciona en todos los navegadores. Vídeo con alfa: ver §5 (requiere HEVC para Safari).
13. **Aplicaciones.** Barbería (navaja → espuma → toalla caliente → resultado), cafetería, cosmética, relojería.
14. **Pruebas.**
    - Muestrear el fotograma dibujado frente a `progress()` en 20 puntos: debe ser monótono y sin saltos de más de 2 fotogramas.
    - Peso transferido; LCP con el fotograma 0.
    - Uso de memoria en móvil.
    - Reduced motion: imágenes estáticas visibles.
    - Vídeo de la grabación revisado frente a la referencia (EVAL-001, fidelidad de movimiento).
15. **Estado.** Helper oficial y formatos documentados; **efecto de la referencia observado, pero no se sabe cómo se hizo**; nada implementado.

**Lote 21:** producción (Blender → WebP con alfa, verificado con ffmpeg), elección entre secuencia, vídeo all-intra y vídeo con alfa, carga escalonada y direccional, y casos reales (OPTIKKA: WebP en canvas; Apple: vídeo con alfa por scroll) → SEQ-002 y CASE-004. Medición de continuidad: exponer `window.__secuencia = { frame }` en desarrollo y medir con `integration/tools/curvas_scroll.mjs`.

**Lote 24:** cuándo usar una secuencia frente a un elemento fijado o Flip → CONT-001; secuencia frente a otras técnicas de transformación → TRN-001.

## Lote 28 · Vídeo por scroll como secuencia en canvas (Codegrid, DTTNSjyEtes; fotograma de código 17:48)
- **Extracción:**
  - exportar la secuencia desde un editor de vídeo (DaVinci Resolve gratuito → TIFF), porque los conversores en línea se saltan fotogramas, y convertir a JPG por lotes;
  - **en este entorno:** `ffmpeg -i video.mp4 -vsync 0 f_%04d.png`, que conserva todos los fotogramas, y después `preparar_recursos.py` o WebP/AVIF (SEQ-002).
- **Precarga tolerante:** contador de pendientes que también descuenta en `onerror` (un fotograma roto no bloquea la escena). Primer render y creación del ScrollTrigger cuando el contador llega a 0.
- **Dibujo:** canvas a `devicePixelRatio` con `ctx.scale` y ajuste tipo *cover* según la relación de aspecto. En resize: recalcular el canvas, redibujar y `ScrollTrigger.refresh()`.
- **Timeline:**
  - pin con `end: "+=" + innerHeight * 7` y `scrub: 1` (el fotograma muestra `1`; la narración dice "directo");
  - **índice = `floor(min(progress / 0.9, 1) × (N − 1))`**: el 10 % final queda para el despin sin que la secuencia siga avanzando.
- **Coreografía sobre la secuencia:** cabecera en `perspective` que retrocede en Z durante el 0–25 % y se desvanece en el 20–25 %; imagen que llega desde +Z con opacidad en el 60–80 % y Z hasta el 90 %.
- **Lo que el vídeo NO dice:**
  - **memoria:** 200 fotogramas de 1 920 × 1 080 ocupan ≈ 1,6 GB decodificados (ancho × alto × 4; AIIMG-001). Reducir resolución y número por dispositivo (SEQ-002);
  - interpolación entre fotogramas (SEQ-003). Fuente: `integration/YOUTUBE_ESTUDIOS.md` y `evidence/youtube/2026-11-03-lote28/`.
