---
id: VID-001
titulo: Vídeo controlado por el scroll (scrub de currentTime) con transición entre secciones fijadas
categoria: animations
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (repositorio público; vídeo NO visto)
versiones: gsap ^3.13.0, React 19 (repo JSM GTA VI, commit 56b6e63)
perfil: cinematografico
ultima_revision: 2026-10-26
---

# VID-001 · Vídeo sincronizado con el scroll

1. **Finalidad.** Que un vídeo avance y retroceda fotograma a fotograma con el scroll (storytelling de producto, tema 13 en versión sin 3D).
2. **Fuente.** `adrianhajdin/jsm_gta_vi_landing`, `src/sections/FirstVideo.jsx` (y `SecondVideo.jsx`, no revisado en detalle). Sin licencia: no se reproduce.
3. **Ubicación.** FirstVideo.jsx completo (44 líneas).
4. **Resultado.** La sección anterior se desvanece, el vídeo aparece fijado y su reproducción sigue la rueda del ratón.
5. **Explicación técnica (observada).**
   - `<video muted playsInline preload="auto">` (atributos necesarios para autoplay y control en iOS).
   - Timeline con ScrollTrigger `pin: true`, `scrub: true`, `end: "+=200% top"`.
   - Solapamiento entre secciones con `marginTop` negativo (`-150vh`) aplicado con `gsap.set`, para fundir el hero con el vídeo mientras ambos están fijados.
   - Cuando llega `loadedmetadata`, se añade a la timeline un tween de `currentTime` de 0 a `duration`, en paralelo (`"<"`) con el fundido.
6. **Dependencias.** gsap, ScrollTrigger, @gsap/react; vídeo MP4.
7. **Procedimiento (adaptación propia).** Esperar metadatos de forma robusta (comprobar `readyState` además del evento) → crear la timeline después → `ScrollTrigger.refresh()`.
8. **Parámetros.** Longitud del pin; `scrub` (true = sin suavizado); proporción de duración del tween de vídeo frente al fundido.
9. **Pseudocódigo (adaptación propuesta; no ejecutada):**
   ```js
   const ready = v => v.readyState >= 1 ? Promise.resolve() :
     new Promise(r => v.addEventListener("loadedmetadata", r, { once: true }));
   await ready(video);
   gsap.timeline({ scrollTrigger: { trigger: ".vd", pin: true, start: "top top", end: "+=200%", scrub: true } })
     .to(video, { currentTime: video.duration, ease: "none" });
   ```
10. **Problemas detectados (análisis propio, a confirmar):**
    - **Condición de carrera:** el manejador `onloadedmetadata` se asigna después de crear el vídeo; si los metadatos ya están en caché, el evento puede haberse disparado y el tween del vídeo no se añadiría nunca.
    - Añadir un tween a una timeline con scrub ya creada cambia su duración total y, con ello, las proporciones del recorrido.
    - Usa `ease: "power1.inOut"` en `currentTime`: el vídeo no avanza de forma lineal con el scroll (puede ser intencional).
    - **No documentado en la fuente (conocimiento general, a verificar):** el scrub fluido depende de la codificación del vídeo; vídeos con pocos fotogramas clave saltan al retroceder.
11. **Rendimiento / a11y.** Vídeos pesados afectan a LCP y datos móviles: definir presupuesto de peso y póster. Ofrecer controles o versión estática con reduced motion; el vídeo decorativo no debe contener información esencial sin alternativa textual.
12. **Compatibilidad.** iOS requiere `muted` + `playsInline`. Pendiente probar seek rápido en Safari.
13. **Aplicaciones.** Presentaciones de producto (coches, relojes, auriculares de tu captura), lanzamientos.
14. **Pruebas.** Recarga con caché (condición de carrera); scroll atrás rápido; red lenta; Safari iOS; peso total de la página.
15. **Evidencia.** Código leído. Vídeo del tutorial no visto. Nada ejecutado.

**Actualización lote 2 (2026-10-26).** El mismo patrón (y la misma condición de carrera) aparece en otras 3 secciones del repo: SecondVideo, PostCard y Final (TUT-010). PostCard añade un segundo fallo: `autoPlay` activo mientras el scroll controla `currentTime`. Corrección propuesta (no ejecutada): comprobar `video.readyState >= 1` antes de esperar el evento y no combinar reproducción automática con scrub.

**Lote 20:** alternativa con secuencia de fotogramas en canvas (helper oficial `imageSequence` de GSAP) y vídeo con alfa por navegador (VP9 con alfa / HEVC con alfa / *stacked alpha*) → SEQ-001. Efecto observado en la referencia Enky (CASE-003), sin tecnología confirmada.

**Lote 21 — por qué tartamudea el scrub [ARTÍCULO, hontran.dev]:** `currentTime` salta al fotograma clave más cercano (cada 2–10 s por defecto). Solución: codificar en *all-intra* (`-g 1`, `-crf 23` en libx264 / `-crf 32` en libvpx-vp9, `-pix_fmt yuv420p`, `-an`, `-movflags faststart`), nunca por encima del tamaño en pantalla (~8 MB en MP4 y ~13 MB en WebM a 1 280 px, frente a 1–2 MB normal). Esperar a `loadedmetadata`, `preload="auto"` y no llamar a `play()`. OPTIKKA abandonó el vídeo por fotogramas WebP (SEQ-002).
