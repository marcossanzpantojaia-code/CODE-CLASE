---
id: SCN-002
titulo: Transición entre dos escenas 3D con una textura de mezcla (TransitionNode, WebGPURenderer) — y cómo no renderizar ambas cuando no hace falta
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (ejemplo oficial `webgpu_postprocessing_transition.html`, three.js r186, MIT)
versiones: three.js 0.186.0
perfil: cinematografico
ultima_revision: 2026-10-27
---

# SCN-002 · Transición de escenas con TSL

1. **Finalidad.** Pasar de una escena 3D a otra con un barrido definido por una textura en escala de grises (ruido Perlin, cuadrados, celdas, distorsión, degradado, radial) — versión WebGPU/TSL de la transición de SCN-001 (tema 8).
2. **Fuente.** `examples/webgpu_postprocessing_transition.html` del repo de three.js (commit e06d724, 2026-10-26; MIT). Texturas de mezcla en `examples/textures/transition/transition1…6.png`.
3. **Montaje [COD].**
   - Dos objetos "FXScene", cada uno con su `Scene`, `PerspectiveCamera`, luces y un `InstancedMesh` de 500 piezas (cubos azules / icosaedros rojos) con `MeshPhongNodeMaterial`.
   - `const renderPipeline = new THREE.RenderPipeline(renderer)`.
   - `pass(sceneA, cameraA)` y `pass(sceneB, cameraB)` → `transition(passA, passB, new THREE.TextureNode(textura), uniformTransicion, uniformUmbral, uniformUsarTextura)` (import desde `three/addons/tsl/display/TransitionNode.js`) → `renderPipeline.outputNode = transitionPass`.
   - Cambiar la textura en caliente: `transitionPass.mixTextureNode.value = textura`.
   - Parámetros como `uniform()`: `transition` 0–1, `threshold` (0,1: suavidad del borde), `useTexture` (1 = barrido con textura, 0 = fundido).
4. **Optimización clave [COD].** En `render()`: si `transition === 0` → `renderer.render(sceneB, cameraB)`; si `=== 1` → `renderer.render(sceneA, cameraA)`; solo en valores intermedios `renderPipeline.render()` (dos escenas + mezcla). Evita pagar dos escenas todo el tiempo.
5. **Animación [COD].** El ejemplo usa TWEEN (1,5 s, `yoyo`, `repeat: Infinity`, `delay` 2 s) y cambia de textura en cada extremo; el `Timer` de three (`timer.connect(document)`, `getDelta()`) da el delta para rotar las escenas (independiente de los Hz).
6. **Traducción a GSAP + scroll [adaptación propia, no ejecutada].**
   ```js
   const t = uniform(0);
   gsap.to(t, { value: 1, ease: "none", scrollTrigger: { trigger: "#cap-2", start: "top bottom", end: "top top", scrub: true } });
   ```
   y en el bucle elegir qué renderizar según `t.value` (§4).
7. **Errores frecuentes.** Renderizar las dos escenas siempre; texturas de mezcla sin cargar al empezar (el ejemplo comprueba `textures[i]` antes de asignarla); olvidar actualizar ambas cámaras al redimensionar.
8. **Parámetros.** Duración 1,5 s; umbral 0,1; 6 texturas de mezcla.
9. **Código.** §3/§6.
10–13. **Aplicaciones.** Capítulos de una landing cinematográfica, cambio de producto/colección, transición día/noche.
14. **Pruebas.** Coste en fps durante la mezcla vs fuera de ella; resize; respaldo WebGL 2 (`forceWebGL`); reduced motion (cambio instantáneo).
15. **Estado.** Código oficial leído; no ejecutado.
