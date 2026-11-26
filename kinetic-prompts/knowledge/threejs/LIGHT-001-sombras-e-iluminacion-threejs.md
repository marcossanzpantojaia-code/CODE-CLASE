---
id: LIGHT-001
titulo: Sombras e iluminación en three.js r186 — coste por luz, cámara de sombra, PCFSoftShadowMap retirado, sombras falsas y de contacto, cascadas (CSM) y entorno HDR
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (threejs.org/manual "Shadows") + CODIGO_INSPECCIONADO (repo three.js commit e06d724, MIT: src/constants.js, src/lights/LightShadow.js, src/renderers/webgl/WebGLShadowMap.js, examples webgl_shadow_contact, webgl_shadowmap_csm, webgl_loader_gltf)
versiones: three.js r186 (0.186.0)
perfil: cinematografico
ultima_revision: 2026-10-27
---

# LIGHT-001 · Sombras e iluminación

1. **Nombre y finalidad.** Elegir la técnica de sombra/luz más barata que dé el resultado (temas 11, 13). Hueco de ARCH-001 ("iluminación avanzada").
2. **Fuentes.** Manual oficial https://threejs.org/manual/en/shadows.html ; código del repo three.js (MIT, commit e06d724).
3. **Ubicación.** Manual completo; constantes de sombra (`src/constants.js` l. 50–84); propiedades de `LightShadow`; `WebGLShadowMap.render`; ejemplos citados.
4. **Resultado.** Sombras creíbles con un presupuesto de pasadas conocido.
5. **Explicación técnica.**
   - **Coste [manual].** Por cada luz con `castShadow`, la escena se renderiza otra vez desde la luz: 5 luces con sombra = 6 renderizados. Una `PointLight` con sombra cuesta **6 pasadas** (una por cara del cubo). Recomendación del manual: muchas luces para iluminar, **una sola direccional con sombra**; mapas de luz/AO precalculados son más rápidos pero estáticos.
   - **Cámara de sombra [manual].** Direccional → `OrthographicCamera` (`left/right/top/bottom/near/far`); el área mínima que cubra la escena (en el ejemplo ~30 unidades bien, 100 ya pixelado). Ver con `CameraHelper(light.shadow.camera)` y llamar a `updateProjectionMatrix()` tras cambiarla. Spot: sigue a `angle`/`penumbra`. Point: solo `near/far`.
   - **Resolución [manual + código].** `shadow.mapSize` por defecto 512×512; potencias de dos; límite `renderer.capabilities.maxTextureSize`.
   - **Tipos [código r186].** `BasicShadowMap` (más rápido, sin filtrar), `PCFShadowMap` (**por defecto** en `WebGLShadowMap.type`), `VSMShadowMap` (con VSM todos los receptores también proyectan). **`PCFSoftShadowMap` está obsoleto desde r186**: `WebGLShadowMap` avisa *"PCFSoftShadowMap has been removed. Using PCFShadowMap instead."* y cambia el tipo → muchos tutoriales antiguos lo usan.
   - **Ajustes [código].** `shadow.bias` (0; ajustes del orden de 0,0001), `shadow.normalBias` (0; reduce el *acné* con luz rasante a costa de distorsión), `shadow.radius` (1; > 1 difumina, valores altos dan bandas), `shadow.blurSamples` (8, solo VSM), `shadow.intensity` (1), `biasNode` solo con WebGPURenderer.
   - **Sombras estáticas [código].** `renderer.shadowMap.autoUpdate = false` + `needsUpdate = true` cuando algo cambia (por luz: `shadow.autoUpdate`/`needsUpdate`): si la escena no se mueve, la sombra no se recalcula cada frame.
   - **Sombra falsa [manual].** Plano con textura de sombra redonda, `transparent: true`, `depthWrite: false`, 0,001 por encima del suelo (evita *z-fighting*), opacidad que baja al subir el objeto. Sin pasadas extra: la opción para móvil.
   - **Sombra de contacto [ejemplo `webgl_shadow_contact`].** Cámara ortográfica cenital renderiza la escena con `overrideMaterial = MeshDepthMaterial` modificado (negro con alfa según profundidad × `darkness`) a un render target de 512², desenfoque horizontal + vertical (`HorizontalBlurShader`/`VerticalBlurShader`) y se aplica como textura a un plano bajo el objeto. Parámetros del ejemplo: `blur 3.5`, `darkness 1`, `opacity 1`, plano 2,5×2,5. Ideal para producto flotante (configurador, CFG-001). Usa `onBeforeCompile` → **no portable tal cual a WebGPURenderer** (TSL-001).
   - **Cascadas [ejemplo `webgl_shadowmap_csm`].** Addon `CSM` (`three/addons/csm/CSM.js`) para escenas grandes: `cascades: 4`, `maxFar`, `mode: 'practical' | 'uniform' | 'logarithmic'`, `shadowMapSize: 1024`, `lightDirection`; cada material pasa por `csm.setupMaterial()`; `fade` suaviza las transiciones. Coste = una pasada por cascada.
   - **Entorno HDR [ejemplo `webgl_loader_gltf`].** `UltraHDRLoader` (archivo `royal_esplanade_2k.hdr.jpg`; comparar su peso con el `.hdr` equivalente antes de elegir [pendiente de medir]) → `texture.mapping = EquirectangularReflectionMapping` → `scene.environment` (ilumina PBR) y opcionalmente `scene.background` con `backgroundBlurriness`; `renderer.toneMapping = ACESFilmicToneMapping`. El ejemplo no crea ninguna luz: toda la iluminación del modelo viene del entorno [COD]; añadir una direccional solo si hace falta sombra.
6. **Dependencias.** three r186; addons `CSM`, `UltraHDRLoader`, shaders de blur.
7. **Procedimiento (adaptación).** (1) Entorno HDR para el aspecto PBR; (2) una direccional con sombra y cámara ajustada, `mapSize` 1024 en escritorio / 512 en móvil; (3) objeto aislado → sombra de contacto o falsa en lugar de mapa de sombra; (4) escena estática → `autoUpdate = false`; (5) escenas grandes → CSM solo si hace falta; (6) escena fija → hornear luz en Blender (*baking*, pendiente de ficha).
8. **Parámetros.** Ver §5; presupuesto orientativo [EST]: ≤ 1 luz con sombra en móvil, ≤ 2 en escritorio.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   renderer.shadowMap.enabled = true;            // tipo por defecto: PCFShadowMap (r186)
   sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
   Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
   sun.shadow.camera.updateProjectionMatrix(); sun.shadow.normalBias = 0.02;
   renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; // escena estática
   ```
10. **Problemas habituales.** `PCFSoftShadowMap` copiado de tutoriales (r186 lo ignora con aviso); cámara de sombra enorme (sombras pixeladas); acné (subir `normalBias`) o *peter-panning* (bias excesivo); todo con `receiveShadow`/`castShadow`; `PointLight` con sombra en móvil; olvidar `updateProjectionMatrix`.
11. **Rendimiento / a11y.** Cada luz con sombra multiplica las pasadas → medir fps (PERF-002, R3F-002). Sin impacto directo en accesibilidad.
12. **Compatibilidad.** WebGL2; con WebGPURenderer cambian algunos detalles (`biasNode`) y los ejemplos con `onBeforeCompile` no sirven.
13. **Aplicaciones.** Producto en héroe (barbería: maquinilla/tijeras flotando con sombra de contacto), configuradores, escenas arquitectónicas.
14. **Pruebas.** Comparar fps con/sin sombra; consola sin el aviso de PCFSoft; `CameraHelper` en desarrollo; móvil de gama media.
15. **Estado.** Manual y código fuente leídos; nada ejecutado. *Baking* y *lightmaps* pendientes.

**Lote 15:** iluminación horneada (lightmaps, AO, exportación glTF desde Blender, horneado en el navegador) → [LIGHT-002](LIGHT-002-iluminacion-horneada-lightmaps-ao.md); AO en pantalla y bloom → [POST-001](POST-001-posprocesado-webgpu-tsl-bloom-ao.md).
