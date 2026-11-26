---
id: TSL-001
titulo: Three.js Shading Language (TSL) y WebGPURenderer — qué es, cómo se escribe, qué es estable y qué no
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (wiki TSL, manual WebGPURenderer) + CODIGO_INSPECCIONADO (ejemplos oficiales de three.js r186, MIT)
versiones: three.js 0.186.0 (repo e06d724, 2026-10-26)
perfil: cinematografico
ultima_revision: 2026-10-27
---

# TSL-001 · TSL + WebGPURenderer

1. **Finalidad.** Escribir shaders y materiales procedurales en JavaScript que funcionan **con WebGPU y con WebGL 2** sin mantener dos versiones (temas 8, 11, 13). Base de TSL-002, SCN-002, INST-002.
2. **Fuentes.** Wiki https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language (especificación viva, en revisión); manual https://threejs.org/manual/en/webgpurenderer ; ejemplos oficiales `examples/webgpu_*.html` del repo (MIT, Copyright three.js authors) — 238 ejemplos WebGPU listados en `files.json`; leídos: `webgpu_tsl_galaxy`, `webgpu_postprocessing_transition`, `webgpu_compute_particles`.
3. **Qué es [docs].** Lenguaje de shaders **basado en nodos** escrito en JS: se conectan nodos en vez de escribir cadenas GLSL/WGSL. Un paso de construcción genera **WGSL** (backend WebGPU) o **GLSL** (backend WebGL 2). Elimina el parcheo frágil de cadenas (`onBeforeCompile`), permite módulos reutilizables y *tree shaking*.
4. **Piezas [docs + COD].**
   - Imports: `import * as THREE from 'three/webgpu'` y nodos desde `'three/tsl'` (`uniform`, `Fn`, `If`, `Loop`, `vec3`, `color`, `mix`, `sin`, `time`, `uv`, `positionLocal`, `normalWorld`, `hash`, `range`, `instanceIndex`, `instancedArray`…).
   - Operadores encadenados: `a.add(b).mul(c)`, `.pow()`, `.oneMinus()`, `.length()`, *swizzle* (`.xyz`, `.rgb`); `.toVar()` para variables.
   - `uniform(valor)` → se cambia `u.value` en JS sin recompilar.
   - Materiales de nodos (`MeshStandardNodeMaterial`, `MeshBasicNodeMaterial`, `SpriteNodeMaterial`, `MeshPhongNodeMaterial`…) con ranuras: `colorNode`, `positionNode` (desplazamiento de vértices), `normalNode`, `opacityNode`, `scaleNode`, `fragmentNode`.
   - `Fn(() => { … })` para lógica reutilizable con control de flujo (`If/Else/Loop`).
   - Compute: `Fn(...)().compute(n)` + `renderer.compute(nodo)` (INST-002).
   - Posproceso con nodos: `pass(scene, camera)` y composición en `renderPipeline.outputNode` (SCN-002).
5. **WebGPURenderer [manual].**
   - Inicialización **asíncrona**: con `renderer.setAnimationLoop(fn)` queda garantizada antes del primer frame; con rAF propio o uso en `init`, `await renderer.init()`.
   - **Respaldo automático a WebGL 2** si no hay WebGPU; `forceWebGL: true` para forzarlo (pruebas).
   - **No soporta** `ShaderMaterial`, `RawShaderMaterial` ni `onBeforeCompile` (hay que portar a TSL) ni `EffectComposer` y sus pasadas (nuevo sistema de posproceso por nodos).
   - **Estado: experimental** según el propio manual (más maduro, pero pueden faltar funciones y `WebGLRenderer` puede rendir mejor en algunas escenas). `WebGLRenderer` sigue mantenido y es la opción recomendada para proyectos solo WebGL 2; no recibirá grandes funciones nuevas.
6. **Ejemplo oficial resumido — galaxia de 20 000 partículas sin matrices en CPU [COD, MIT].** `SpriteNodeMaterial` aditivo; `range(0, 1)` da un valor aleatorio **por instancia**; radio = `range^1.5 · 5`; 3 brazos (`range(0,3).floor() · 2π/3`) que giran con `time` más rápido en el centro; desplazamiento aleatorio `range(vec3(-1), vec3(1)).pow3()`; color = `mix(interior, exterior, …)`; alfa = `0.1 / distancia(uv, centro) − 0.2` (disco suave sin textura); todo en un `InstancedMesh(PlaneGeometry, material, 20000)`.
   ```js
   const radiusRatio = range(0, 1);
   material.positionNode = vec3(cos(angle), 0, sin(angle)).mul(radiusRatio.pow(1.5).mul(5)).add(randomOffset);
   ```
7. **Estable vs experimental [síntesis].**
   | Pieza | Estado | Uso recomendado |
   |---|---|---|
   | `WebGLRenderer` + `ShaderMaterial` (GL-001…004) | estable | webs de cliente en producción |
   | TSL con `WebGPURenderer` en backend WebGL 2 | experimental (manual) | proyectos B con margen de pruebas |
   | WebGPU real (compute, almacenamiento) | depende del navegador (WGPU-001) | B con respaldo obligatorio |
   | API concreta (`RenderPipeline`, `Inspector`) | cambia entre versiones (en r186 el ejemplo usa `THREE.RenderPipeline`; hasta r182 la clase se llamaba `PostProcessing` — **verificado** en el lote 15: obsoleta desde r183, solo envuelve a `RenderPipeline` con un aviso) | fijar versión exacta de three |
8. **Procedimiento.**
   1. Fijar `three` a una versión exacta (sin `^`) y leer los ejemplos de **esa** versión.
   2. Empezar con `WebGPURenderer` + `forceWebGL: true` en pruebas para asegurar que el respaldo funciona.
   3. Exponer parámetros como `uniform()` y animarlos desde GSAP (`gsap.to(u, { value: 1 })`) — GL-006.
   4. Nada de `ShaderMaterial` en el mismo proyecto (no funciona en WebGPURenderer).
9. **Código.** §6 (fragmento MIT).
10. **Errores frecuentes.** Mezclar `three` y `three/webgpu` en el mismo bundle (dos copias de la librería) [conocimiento general, verificar]; olvidar `await renderer.init()` con bucle propio; usar addons de `EffectComposer`.
11. **Rendimiento.** `range()` y `hash(instanceIndex)` sustituyen datos por instancia en CPU; DPR a `devicePixelRatio` en los ejemplos → limitar a ≤ 2 en producción.
12. **Compatibilidad.** Ver WGPU-001.
13. **Aplicaciones.** Fondos de partículas, materiales de producto, galerías con efectos.
14. **Pruebas.** Mismo resultado visual con y sin `forceWebGL`; FPS en GPU integrada; consola sin errores de compilación de nodos.
15. **Estado.** Docs y ejemplos leídos; nada ejecutado.

**Lote 15:** confirmado en el código (`src/renderers/common/PostProcessing.js`): `THREE.PostProcessing` está **obsoleta desde r183** y solo envuelve a `RenderPipeline` con un aviso. Posprocesado: [POST-001](POST-001-posprocesado-webgpu-tsl-bloom-ao.md).
