---
id: POST-001
titulo: Posprocesado con WebGPURenderer y TSL — RenderPipeline (antes PostProcessing), bloom global y selectivo por MRT o emisivo, AO en pantalla (GTAO vs SSAO + TRAA) y su coste
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (three.js rama dev, commit e06d724, package.json 0.186.0, MIT: src/renderers/common/PostProcessing.js y RenderPipeline.js, examples/jsm/tsl/display/BloomNode.js, examples webgpu_postprocessing_bloom, _bloom_selective, _bloom_emissive, _ao)
versiones: three.js r183+ (RenderPipeline); r186/dev
perfil: cinematografico
ultima_revision: 2026-10-27
---

# POST-001 · Posprocesado WebGPU/TSL

1. **Finalidad.** El acabado "premium" de una escena 3D (resplandor de neones o letreros, profundidad en esquinas) con un presupuesto conocido; complementa SCN-002 (transiciones con `TransitionNode`), TSL-001 y WGPU-001.
2. **Fuente.** Repositorio three.js (MIT), archivos citados en la cabecera.
3. **Ubicación.** `PostProcessing.js` (aviso de obsolescencia), JSDoc del constructor de `BloomNode`, bloques de configuración de los ejemplos.
4. **Resultado.** Bloom solo en lo que debe brillar y AO en pantalla opcional, con la escena renderizada una vez a un `pass()`.
5. **Explicación técnica [COD].**
   - **Nombre de la clase:** `THREE.PostProcessing` está **obsoleta desde r183** ("renamed to RenderPipeline"; solo un envoltorio con aviso) → usar `new THREE.RenderPipeline(renderer)` y `renderPipeline.outputNode = …`. Los tutoriales anteriores a r183 usan el nombre antiguo.
   - **Flujo:** `const scenePass = pass(scene, camera)` → nodos de efecto → `renderPipeline.outputNode` → en el bucle `renderPipeline.render()` en lugar de `renderer.render()`.
   - **Bloom:** `bloom(inputNode, strength = 1, radius = 0, threshold = 0)` (addon `three/addons/tsl/display/BloomNode.js`); los tres son `uniform` (animables, p. ej. con GSAP: `bloomPass.strength.value`); `smoothWidth` 0,01; cadena de desenfoques a varias resoluciones con `resolutionScale` ajustable.
   - **Bloom selectivo por MRT:** cada material declara `material.mrtNode = mrt({ bloomIntensity: uniform(0|1) })`; el pase escribe `mrt({ output, bloomIntensity: float(0) })`; `bloom(output.mul(bloomIntensity))`; salida `outputPass.add(bloomPass)` con `renderPipeline.outputColorTransform = false` + `.renderOutput()`; `toneMapping = NeutralToneMapping` en el ejemplo.
   - **Bloom por emisivo:** `mrt({ output, emissive: vec4(emissive, output.a) })` con `setBlendMode('emissive', NormalBlending)`, textura emisiva en `UnsignedByteType` (ahorra memoria) y `bloom(emissivePass, 2.5, 0.5)` → **brilla lo que tiene `emissive`**: la forma más natural de controlarlo desde el material.
   - **AO en pantalla:** prepase con normales empaquetadas (`packNormalToRGB(normalView)`, textura `UnsignedByteType`) + profundidad; `ao(depth, normal, camera)` (**GTAO**, más fiel, necesita denoise temporal con `traa()` y `samples: 0` en el pase) o `ssao(…)` (más barato, se autodesenfoca, admite MSAA 4×); el ejemplo usa `resolutionScale: 0.5` y 16 muestras.
6. **Dependencias.** `three/webgpu`, `three/tsl`, addons `BloomNode`, `GTAONode`, `SSAONode`, `TRAANode` — **[MED, lote 16]** `BloomNode`, `GTAONode`, `TRAANode`, `RenderPipeline` y el envoltorio obsoleto `PostProcessing` están en el paquete publicado `three@0.186.1`.
7. **Procedimiento (adaptación; no ejecutada).**
   1. Empezar sin posprocesado; añadir bloom solo si hay emisivos (letrero de neón de la barbería, poste giratorio).
   2. Preferir el bloom **por emisivo** (control desde el material) o por MRT antes que el global con `threshold` (deja brillar cualquier blanco).
   3. AO en pantalla solo si no hay AO horneada (LIGHT-002); en móvil, SSAO a media resolución o nada.
   4. Exponer `strength`/`radius` como parte de la timeline maestra (GL-006) y llevarlos a 0 con reduced motion si el brillo pulsa.
   5. Respaldo WebGL: el ejemplo WebGL equivalente usa `EffectComposer` + `UnrealBloomPass` (no inspeccionado en esta ficha) → no mezclar APIs de los dos renderers (TSL-001).
8. **Parámetros.** Ejemplo global: `threshold 0`, `strength 1`, `radius 0`; ejemplo emisivo: `strength 2.5`, `radius 0.5`; AO: 16 muestras, `resolutionScale 0.5`.
9. **Código (adaptación del ejemplo emisivo; no ejecutada):**
   ```js
   const scenePass = pass(scene, camera);
   const m = mrt({ output, emissive: vec4(emissive, output.a) });
   m.setBlendMode('emissive', new THREE.BlendMode(THREE.NormalBlending));
   scenePass.setMRT(m);
   const brillo = bloom(scenePass.getTextureNode('emissive'), 2.5, 0.5);
   const pipeline = new THREE.RenderPipeline(renderer);
   pipeline.outputNode = scenePass.getTextureNode().add(brillo);
   renderer.setAnimationLoop(() => pipeline.render());
   ```
10. **Errores habituales.** Usar `THREE.PostProcessing` (aviso en consola); bloom global que hace brillar fondos blancos; GTAO sin TRAA (ruido); tone mapping aplicado dos veces (ver `outputColorTransform` en el ejemplo selectivo); efectos a resolución completa en móvil.
11. **Rendimiento / a11y.** Cada efecto añade pases a pantalla completa (bloom: varios desenfoques; GTAO: prepase + AO + TRAA) → medir en el dispositivo objetivo (PERF-002, R3F-002); bajar `resolutionScale`. Brillos que parpadean: cuidado con WCAG 2.3.1 (A11Y-002).
12. **Compatibilidad.** WebGPURenderer (con su respaldo WebGL2 interno); APIs en evolución entre versiones (TSL-001).
13. **Aplicaciones.** Neón de marca, letreros, producto con luces, escenas nocturnas.
14. **Pruebas.** fps con/sin cada efecto; `forceWebGL: true`; consola sin avisos de obsolescencia; reduced motion.
15. **Estado.** Código fuente y ejemplos oficiales leídos; nada ejecutado.
