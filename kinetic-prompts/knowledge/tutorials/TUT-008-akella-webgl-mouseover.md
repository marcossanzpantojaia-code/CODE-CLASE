---
id: TUT-008
titulo: Interactive Hover Effects with Three.js (Codrops, 2020)
creador: Yuri Artiukh (akella)
identidad_verificada: SI
repo: https://github.com/akella/webgl-mouseover-effects
commit: 00606ac (2020-04-20)
licencia: MIT (archivo LICENSE, © Codrops) → se permiten fragmentos con atribución
video_url: no enlazado en el repo
narrado: n/a
transcript_status: n/a (tutorial en texto en Codrops, INACCESIBLE desde aquí)
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-008 · akella — Efectos hover WebGL sobre imágenes

1. **Identidad.** Perfil GitHub `akella` = "Yuri Artiukh", Kyiv, web riverco.de (estudio Coderiver, fundado por Yuriy Artiukh), que enlaza su canal de YouTube `user/flintyara`. El README del repo enlaza github.com/akella y el artículo de Codrops.
2. **Qué construye.** Página editorial con imágenes HTML que se sustituyen por planos WebGL alineados píxel a píxel. Al mover el ratón, un pase de postprocesado deforma la imagen alrededor del cursor según la velocidad del movimiento: desplazamiento RGB ("colorful"), lupa ("zoom") o ruido ("random").
3. **Stack.** three ">=0.102.0" (2019-20), `@johh/three-effectcomposer`, `three-orbit-controls`, imagesLoaded, FontFaceObserver, dat.gui, Parcel 1, glslify.
4. **Archivos leídos.** `js/app.js` (298 líneas: scroll suave propio + sincronización DOM↔WebGL), `js/scene.js` (255: escena, cámara, composer), shaders de `js/shader/` y `js/post/`, `step3.html`.
5. **Técnicas extraídas.** → [GL-001](../threejs/GL-001-planos-webgl-sincronizados-dom.md) (cámara con FOV calculado para que 1 unidad = 1 px; "cover" de la imagen por uniform; render bajo demanda) y [HOV-003](../interactions/HOV-003-distorsion-hover-shader.md) (distorsión por velocidad del ratón en pase de postprocesado). **Tema 10** (hover) en versión WebGL.
6. **Fallos y límites.**
   - Scroll suave propio fijando `<main>` y moviéndolo con `translate3d`: rompe búsqueda en página, anclas y parte de la accesibilidad (hoy se resuelve con Lenis, que respeta el scroll nativo).
   - `setPixelRatio(1)` fijo (borroso en HiDPI); `console.log` en el observer; dat.gui en la página final.
   - `alt="Some image"`; sin reduced motion; el efecto depende solo del ratón (nada en táctil/teclado, aceptable si es decorativo).
7. **APIs obsoletas** (Migration Guide de three.js): `PlaneBufferGeometry` (alias deprecado desde r145 → `PlaneGeometry`); `renderer.outputEncoding`/`sRGBEncoding` (sustituidos en r152 por `outputColorSpace`/`SRGBColorSpace`); el campo `type` en uniforms ya no se usa; `three-orbit-controls` y `@johh/three-effectcomposer` → usar `three/addons` (`OrbitControls`, `EffectComposer`, `ShaderPass`). Parcel 1 sin mantenimiento.
8. **Huecos visuales.** Intensidad real de cada modo de distorsión: demo de Codrops (tympanus.net/Tutorials/webgl-mouseover-effects/step3.html, no inspeccionada).
9. **Valor por perfil.** B: alto (portfolios, editoriales). A: bajo-medio, solo como detalle decorativo y con fallback.
10. **Evidencia.** Lectura de código. No ejecutado.
