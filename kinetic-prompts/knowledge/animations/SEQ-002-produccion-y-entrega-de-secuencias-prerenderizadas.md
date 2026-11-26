---
id: SEQ-002
titulo: Producción y entrega de animación prerenderizada controlada por scroll — secuencia de fotogramas WebP frente a vídeo "all-intra" frente a vídeo con alfa; carga escalonada y direccional, juegos por dispositivo y procesado desde Blender (casos reales OPTIKKA y Apple)
categoria: animations
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Awwwards, caso OPTIKKA/Zajno, 07-08-2025; hontran.dev sobre el tartamudeo del scrub de vídeo; CSS-Tricks, técnica de Apple con canvas) + DEMO_INSPECCIONADA (optikka.com y apple.com/airpods-pro inspeccionadas en el DOM y en la red el 2026-10-27) + CODIGO_INSPECCIONADO (opciones de render por línea de comandos en el código de Blender, creator_args.cc, rama main ba33d29)
versiones: GSAP 3.x ScrollTrigger; Blender 5.2.3 LTS (estable a 22-10-2026); ffmpeg del contenedor
perfil: cinematografico
ultima_revision: 2026-10-27
---

# SEQ-002 · Producir y entregar animación prerenderizada

1. **Finalidad.** Completar SEQ-001: decidir **formato y forma de entrega** de la animación de un objeto que se genera fuera del navegador (render 3D, rodaje o generación) y se controla con el scroll **sin tirones ni pesos desorbitados**.
2. **Fuentes.**
   - Awwwards, "Balancing Scale and Humanity: Behind the Scenes of OPTIKKA's Website" (Zajno);
   - hontran.dev, "Scroll-scrubbed video stutters — fix";
   - CSS-Tricks, "Let's Make One of Those Fancy Scrolling Animations Used on Apple Product Pages";
   - inspección propia de optikka.com y apple.com/airpods-pro;
   - código fuente de Blender (`source/creator/creator_args.cc`, `rna_scene.cc`, `cycles/addon/properties.py`).
3. **Ubicación.** Secciones de vídeo frente a secuencia y de precarga (OPTIKKA); comandos de codificación (hontran); cálculo del fotograma (CSS-Tricks).
4. **Resultado.** Una regla para elegir entre secuencia, vídeo y vídeo con alfa, y un procedimiento de producción y carga.
5. **Evidencias de casos reales.**
   - **OPTIKKA (Zajno) [ARTÍCULO].**
     - **Stack:** Astro, TypeScript, Lottie, Lenis, SVG y GSAP ScrollTrigger; FFmpeg y ParallelQueue de `@zajno/common`.
     - **Del vídeo a fotogramas:** empezaron con un **vídeo HTML5 controlado por scroll** y lo abandonaron por tirones (sobre todo en móvil), diferencias entre navegadores, restricciones de reproducción automática y pérdida de calidad. Pasaron a **fotogramas WebP sueltos dibujados en `<canvas>`** ("over 1000" fotogramas), con **juegos distintos por dispositivo**.
     - **Carga:** los 10 primeros fotogramas de inmediato, el 1.º se muestra al instante y el resto en paralelo en segundo plano. Se precargan 5 fotogramas por delante al bajar y 5 por detrás al subir.
     - **Coste declarado:** más de 1 000 peticiones y desarrollo más complejo. El artículo no da métricas.
   - **optikka.com [MED, 2026-10-27, navegador del usuario].**
     - Hay un `canvas.sequence-canvas` en un contenedor `position: fixed`.
     - Tras recorrer la página se pidieron **224 fotogramas `/mobile/frame_001.webp…` ≈ 3 350 KB (≈ 15 KB por fotograma)**.
     - El panel del navegador estaba oculto (ventana de 0 × 0), por eso eligió el juego **móvil**: **no se vio la animación**, solo el DOM y la red.
   - **apple.com/airpods-pro (AirPods Pro 3) [MED, DOM].**
     - No hay ningún `<canvas>`. Hay 16 `<video muted playsinline>` cargados a demanda (el atributo `src` estaba vacío porque el panel estaba oculto).
     - Uno de ellos es un componente `VideoScrub`: `data-alpha="true"` (vídeo con transparencia), `data-video-basepath`, sustitución por punto de corte `{"xlarge":"large","xsmall":"small"}` y **tramos de progreso por punto de corte** (p. ej. `start: "a0t - 100vh"`, `end: "a0b - 168vh"`, con anclaje en `.sticky-container`).
     - Accesibilidad: contenedor con `role="img"` y `aria-label="AirPods Pro 3 … animation"`, y el vídeo con `aria-hidden="true"`.
     - Conclusión: Apple usa hoy, en esta página, **vídeo con alfa controlado por scroll**, no la secuencia de 148 imágenes del artículo de CSS-Tricks (técnica de una página anterior de AirPods Pro, según ese artículo).
6. **Regla de elección [criterio propio a partir de las fuentes].**
   | Formato | Cuándo usarlo | Peso orientativo | Problemas |
   |---|---|---|---|
   | **Secuencia WebP/AVIF en canvas** | scrub hacia delante y atrás perfecto, objeto con alfa, móvil | ~15 KB por fotograma en móvil (OPTIKKA) [MED]; 60–150 KB en escritorio con alfa [EST] | muchas peticiones; memoria; hace falta precarga |
   | **Vídeo "all-intra" (`-g 1`)** | escenas a pantalla completa sin alfa | ~8 MB (MP4) o ~13 MB (WebM) frente a 1–2 MB normal, a 1 280 px (hontran) | Safari no reproduce bien VP9 → MP4 como respaldo; no pasarse del tamaño en pantalla |
   | **Vídeo con alfa** | objeto sobre fondo HTML, como Apple | VP9 alfa 1,1 MB / HEVC alfa 3,4 MB / AV1 apilado 0,46 MB en el ejemplo de Archibald (SEQ-001) | dos codificaciones (HEVC para Safari); scrub limitado por los fotogramas clave salvo all-intra |
   | Vídeo normal | **no** para scrub | — | `currentTime` salta al fotograma clave más cercano (cada 2–10 s) |
7. **Procedimiento de producción (Blender → web) [código de Blender + adaptación propia].**
   1. En Blender: `Film > Transparent` ("World background is transparent, for compositing the render over another background", `rna_scene.cc`); para vidrio, `Transparent Glass` ("Render transmissive surfaces as transparent…", Cycles).
   2. Render sin interfaz [código, `creator_args.cc`]:
      ```
      blender -b escena.blend -o //render/navaja_#### -F PNG -s 1 -e 140 -t 0 -a
      ```
      - `-b` modo sin interfaz;
      - `-o` ruta, donde las `#` son el número de fotograma con ceros;
      - `-F` formato (PNG; WEBP si está compilado);
      - `-s` y `-e` intervalo, `-a` animación completa;
      - `-t 0` todos los hilos;
      - `-f 20` un solo fotograma;
      - `-- --cycles-device <dispositivo>` dispositivo de Cycles.
   3. Conversión con ffmpeg [adaptación; no ejecutada]:
      ```
      ffmpeg -i render/navaja_%04d.png -vf scale=1600:-1 -c:v libwebp -quality 80 -lossless 0 escritorio/f_%03d.webp
      ```
      Repetir para el móvil (900 px).
      - **[MED, 2026-10-27]** El ffmpeg del contenedor tiene `libwebp`, `libvpx-vp9`, `libaom-av1` y `libx265`. Un PNG RGBA de prueba convertido con `libwebp -quality 80` conservó el alfa: píxel transparente `(0,0,0,0)` y opaco `(180,141,90,255)`. Falta verificar la calidad de los bordes semitransparentes con un render real.
      - `hevc_videotoolbox` (HEVC con alfa nativo) no está; solo existe en macOS. Para Safari: *stacked alpha* con `libx265` (SEQ-001).
   4. Vídeo con alfa (alternativa): comandos de SEQ-001 §5 (Archibald).
8. **Procedimiento de entrega [OPTIKKA + adaptación].**
   - Fotograma 0 como `<img>` con prioridad (LCP).
   - Carga escalonada: primeros 10, luego el resto en paralelo con límite de concurrencia; precarga direccional de ±5 según el sentido del scroll.
   - Juego por dispositivo, elegido por el ancho real **en el momento de cargar** (en optikka.com una ventana de 0 px eligió "mobile").
   - Decodificar antes de dibujar (`img.decode()`).
   - Reduced motion: solo los fotogramas clave.
9. **Parámetros.** Número de fotogramas (≈ 1 fotograma por cada 8–15 px de scroll da suavidad [EST]), resoluciones, calidad WebP, concurrencia, tamaño de la ventana de precarga.
10. **Problemas habituales.**
    - Asignar `img.src` dentro del bucle de dibujo provoca peticiones nuevas: hay que guardar el array precargado (comentarios de CSS-Tricks).
    - `NaN` en `duration` antes de `loadedmetadata` (hontran).
    - Elegir el juego por un ancho incorrecto.
    - 1 000 peticiones en HTTP/1.1.
    - Bordes del alfa con halo si el render no está premultiplicado como espera el navegador [verificar].
11. **Rendimiento / a11y.**
    - Presupuesto de peso por acto (EVAL-001).
    - `aria-hidden` en el medio decorativo y descripción accesible en el contenedor (patrón observado en Apple).
    - Sin secuestrar el scroll nativo (aviso de CSS-Tricks).
12. **Compatibilidad.** El canvas funciona en todos los navegadores. VP9 alfa: Chrome y Firefox; HEVC alfa: Safari.
13. **Aplicaciones.** El objeto protagonista de "El ritual" (navaja → espuma → vapor) y las transiciones de producto.
14. **Pruebas.**
    - Peso y número de peticiones por juego; tiempo hasta el fotograma 0.
    - Saltos (Δ fotogramas por paso de scroll, C2.3).
    - Memoria en móvil.
    - Comprobar en un navegador visible (no oculto) qué juego carga a 375 y 1 440 px.
15. **Estado.** Casos reales leídos y dos webs inspeccionadas en el DOM y la red (no visualmente); nada producido ni implementado.

**Lote 22 — memoria decodificada [CALC]:** cada fotograma ocupa ancho × alto × 4 B en memoria al decodificarse (1 600 × 1 000 = 6,4 MB; 36 fotogramas ≈ 230 MB). **Recortar al rectángulo del objeto** (1 200 × 500 → ≈ 86 MB) y limitar N. Ver PROD-001 §6.
