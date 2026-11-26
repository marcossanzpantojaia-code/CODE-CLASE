---
id: GL-001
titulo: Planos WebGL sincronizados con imágenes del DOM (1 unidad = 1 píxel)
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-008, MIT; TUT-009)
versiones: fuente — three ">=0.102" (2020) y r109 (2019); APIs a actualizar
perfil: cinematografico
ultima_revision: 2026-10-26
---

# GL-001 · Imágenes del DOM convertidas en planos WebGL

1. **Nombre y finalidad.** Base de casi todos los efectos de imagen en WebGL (hover, distorsión por scroll, transiciones): cada `<img>` tiene un plano 3D que ocupa exactamente su rectángulo.
2. **Fuente.** akella/webgl-mouseover-effects (`js/app.js`, `js/scene.js`; MIT © Codrops) — TUT-008. Variante a pantalla completa: akella/webGLImageTransitions (`js/sketch.js`) — TUT-009.
3. **Ubicación.** `resize()` (cálculo de FOV), `createMesh()` (cover), clase `Item` (posición por scroll), `IntersectionObserver`.
4. **Resultado.** El canvas fijo detrás del contenido dibuja las imágenes en el mismo sitio que el HTML, lo que permite aplicarles shaders.
5. **Explicación técnica (observada).**
   - **Cámara a escala de píxeles:** con la cámara a distancia *d*, se fija `fov = 2·atan(alto_viewport / (2·d))` (en grados) → un plano de 1×1 escalado a `ancho×alto` px mide exactamente eso en pantalla. (Fórmula geométrica general; la fuente la expresa en función del aspect ratio.)
   - **Cover:** un uniform `vec4 resolution` lleva el tamaño del plano y dos factores (a1, a2) calculados comparando aspect ratio de imagen y del contenedor; el shader escala las UV desde el centro.
   - **Posición:** cada frame, `y = scroll + alto/2 − top_absoluto − alto_img/2` y `x = −ancho/2 + left + ancho_img/2`.
   - **Visibilidad:** `IntersectionObserver` oculta los planos fuera de pantalla.
   - **Render bajo demanda:** bandera `shouldRender` activada por scroll/ratón.
6. **Dependencias.** three (+ addons). Hoy: combinar con Lenis para el scroll en lugar de un scroll suave propio.
7. **Procedimiento (adaptación).** Mantener el `<img>` real en el DOM (accesible) y ocultarlo visualmente solo cuando el plano esté listo; recalcular rectángulos en `resize` y al cargar fuentes; `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`; `PlaneGeometry`, `outputColorSpace = SRGBColorSpace`, texturas con `colorSpace` sRGB.
8. **Parámetros.** Distancia de cámara (400 en TUT-008, 2 en TUT-009), segmentos del plano (80×80 si hay deformación de vértices; 2×2 si solo fragment shader).
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   camera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(innerHeight / 2 / camera.position.z));
   camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
   ```
10. **Problemas habituales.** Desalineación tras resize o carga tardía de fuentes; scroll suave que fija `<main>` (rompe accesibilidad); texturas sin `colorSpace` (colores lavados en three moderno).
11. **Rendimiento / a11y.** Una sola escena para todas las imágenes; no renderizar si nada cambia; reduced motion → no crear el canvas.
12. **Compatibilidad.** WebGL 1/2.
13. **Aplicaciones.** Portfolios, editoriales, galerías de producto.
14. **Pruebas.** Alineación píxel a píxel en 3 anchos y zoom del navegador; resize; scroll rápido; memoria (TJ-001).
15. **Estado de evidencia.** Código leído, no ejecutado.
