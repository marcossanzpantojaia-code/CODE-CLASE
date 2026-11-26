---
id: LIGHT-002
titulo: Iluminación horneada para la web — lightmaps y oclusión ambiental (AO) desde Blender a three.js por glTF, segundo juego de UV, espacios de color, y horneado en el navegador con LightMapper (rama dev)
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (three.js, rama dev, commit e06d724, package.json 0.186.0, MIT: MeshStandardMaterial.js, Texture.js, GLTFLoader.js, examples/webgpu_lightmap_baking.html, jsm/lighting/LightMapper.js, jsm/utils/unwrapUVs.js) + DOCUMENTACION_OFICIAL_ANALIZADA (Blender Manual, exportador glTF 2.0). La página de horneado del manual de Blender no se pudo extraer (solo llegó la navegación); en el lote 16 los pasos se verificaron en el **código fuente oficial** de Blender (espejo github.com/blender/blender, commit ba33d29, BLENDER_VERSION 504 = 5.4 alfa: panel de horneado de Cycles, propiedades RNA, operador Lightmap Pack, mensajes de error del horneado) y del exportador glTF (KhronosGroup/glTF-Blender-IO, commit e03d660, Apache-2.0)
versiones: three.js r186 / dev; Blender 4.4+ (manual del exportador), código de Blender 5.4 alfa (lote 16)
perfil: cinematografico
ultima_revision: 2026-10-27
---

# LIGHT-002 · Lightmaps y AO horneados

1. **Finalidad.** Conseguir luz "de render" (sombras suaves de contacto, rebotes, esquinas oscurecidas) con coste casi nulo en ejecución: la luz se calcula una vez y se guarda en texturas. Cubre el hueco *baking* de LIGHT-001 y ARCH-001 (temas 11, 13).
2. **Fuentes.** Código del repo three.js (MIT); Blender Manual, "glTF 2.0" (https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html).
3. **Ubicación.** Comentarios JSDoc de `lightMap`, `lightMapIntensity`, `aoMap`, `aoMapIntensity` (MeshStandardMaterial), `Texture.channel`; GLTFLoader (mapa `TEXCOORD_n` → `uv`, `uv1`…; `occlusionTexture` → `aoMap`); ejemplo "Light Baking" (Ben Houston); manual de Blender, secciones de materiales (oclusión) y opciones de exportación.
4. **Resultado.** Escena estática (interior de barbería, producto en estudio) con iluminación global precalculada y 0–1 luces dinámicas.
5. **Explicación técnica.**
   - **three.js [COD]:**
     - `lightMap`: "pre-baked illuminance data"; **necesita `colorSpace`** asignado, normalmente `LinearSRGBColorSpace` y formatos float (`.exr`, `.hdr`); `lightMapIntensity` 1 por defecto.
     - `aoMap`: usa el **canal rojo**; datos no-color → `colorSpace = NoColorSpace` (por defecto); `aoMapIntensity` 0–1 (0 desactiva; con 1 y rojo = 1 "ambient light is fully occluded"): atenúa la luz **ambiental**, no sustituye a las sombras de las luces directas.
     - Los JSDoc dicen "Requires a second set of UVs"; en el código actual el atributo lo elige `texture.channel` (0 = `uv`, 1 = `uv1`, 2 = `uv2`, 3 = `uv3`). GLTFLoader asigna `channel` desde el `texCoord` del glTF y traduce `TEXCOORD_1` → `uv1`; `occlusionTexture` → `aoMap` con `strength` → `aoMapIntensity`.
     - **Consecuencia práctica [síntesis]:** las texturas de color se repiten (UV0, *tiling*) y la luz necesita UV **únicos sin solapes** → segundo juego de UV (UV1) para lightmap/AO.
   - **Blender → glTF [doc]:**
     - **AO:** el exportador busca un grupo de nodos llamado **glTF Material Output** con una entrada **Occlusion** y exporta la Image Texture conectada (se añade desde *Add > Output > glTF Material Output* activando la preferencia del add-on).
     - **Lightmaps:** el manual del exportador **no los menciona** → no hay ruta estándar; opciones: (a) hornear la luz difusa y usarla como `emissive`/`map` en un material sin luz (`MeshBasicMaterial`, aspecto fijo), (b) exportar la textura aparte y asignarla como `lightMap` en código.
     - Solo materiales Metal/Rough PBR y Unlit; los nodos no reconocidos (procedurales) no se exportan → **hornear** a imagen; imágenes PNG/JPEG/WebP (opción *Images*, con *Image Quality*, *Create WebP*, *WebP fallback*).
     - "Not all glTF readers support multiple UV maps" (three.js sí, ver arriba).
     - Opciones web: *Compress meshes using Google Draco* (GLTF-001 para Meshopt/KTX2), *Apply Modifiers*, *Y Up*, *Punctual Lights* con *Lighting Mode* (Standard en unidades físicas cd/lx/nt, Unitless, Raw obsoleto), *Cameras*, modos de animación.
   - **Horneado en el navegador [COD, rama dev, experimental]:** `unwrapUVs(scene, { resolution, padding })` genera un atlas UV único en `uv1` (salta InstancedMesh/BatchedMesh); `LightMapper(renderer, size, irradiance)` hornea irradiancia **indirecta difusa** desde `LightProbeGrid` o `VXGIVolume`, de forma progresiva (`update()` por frame) o de golpe (`update(n)`), máximo 256 muestras (acumula en media precisión), ≥ 3 texels de margen, solo **WebGPURenderer**; **no** incluir AO del material, color base ni exposición en la fuente (se aplicarían dos veces). El ejemplo usa 16 muestras con sondas y 64 con VXGI, resolución 256–4096.
6. **Dependencias.** three r186 (lightMap/aoMap). **[MED, lote 16]** en el paquete publicado `three@0.186.1` (npm, última versión el 2026-10-27) **sí** están `LightProbeGrid` y `VXGIVolume`, pero **no** `LightMapper` ni `unwrapUVs` → el horneado en el navegador solo existe hoy en la rama dev (llegaría con r187, sin confirmar); no usarlo en producción.
7. **Procedimiento (adaptación; no ejecutado).**
   1. **Decidir:** escena fija o casi fija → hornear; objetos que se mueven → luz dinámica + sombra de contacto (LIGHT-001).
   2. En Blender: segundo mapa UV sin solapes. **Verificado [COD Blender]:** operador *UV > Lightmap Pack* (`uv.lightmap_pack`, "Pack each face's UVs into the UV bounds"), opciones *Selection* (Selected/All Faces), *Share Texture Space* (varios objetos en un solo mapa, activada por defecto), *New UV Map*, *Pack Quality* (1–48, por defecto 12), *Margin* (fracción del UV, por defecto 0,1). Para la exportación, conectar un nodo **UV Map** con ese segundo mapa a la entrada *Vector* de la textura de luz/AO: el exportador usa ese nodo para fijar `texCoord`; sin él usa el mapa UV de render [COD glTF-Blender-IO, `texture_info.py`].
   3. Hornear con Cycles. **Verificado [COD Blender, panel `CYCLES_RENDER_PT_bake`]:**
      - *Bake Type*: Combined, Ambient Occlusion, Shadow, Position, Normal, UV, Roughness, Emission, Environment, Diffuse, Glossy, Transmission.
      - *Influence*: en **Combined**, *Lighting* (Direct, Indirect) y *Contributions* (Diffuse, Glossy, Transmission, Emit); en **Diffuse/Glossy/Transmission**, *Contributions* Direct, Indirect y **Color** → para un lightmap difuso sin el color de la superficie: Diffuse con Direct + Indirect y **sin Color** [síntesis].
      - *Selected to Active* ("Bake shading on the surface of selected objects to the active object"), con *Cage*, *Extrusion* y *Max Ray Distance* ("If zero, there is no limit").
      - *Output > Target*: **Image Textures** ("Bake to image data-blocks associated with **active image texture nodes** in materials") o Color Attributes; *Clear Image*.
      - *Margin*: *Type* (Adjacent Faces: píxeles de caras vecinas a través de las costuras; Extend: extiende los bordes) y *Size* en píxeles (interfaz 0–64).
      - Errores del propio Blender si falta algo: "No active UV layer found in the object…" y "No active image found, add a material or bake to an external file" → cada material necesita un nodo Image Texture **activo** con la imagen destino, y el objeto un UV activo.
   4. AO → nodo *glTF Material Output* (Occlusion); luz → textura aparte (`.hdr`/`.exr` o PNG si se acepta 8 bits) o horneada en el color.
   5. Exportar glTF con Draco/Meshopt y texturas WebP/KTX2 (GLTF-001); comprobar en código: `uv1` presente, `aoMap.channel === 1`, `lightMap.colorSpace` correcto.
   6. Runtime: `scene.environment` (LIGHT-001) para reflejos + lightmap para el difuso; no añadir luz ambiental que repita la horneada.
8. **Parámetros.** Resolución del atlas (1024–2048 en web [EST]), margen ≥ 3 px, `lightMapIntensity`, `aoMapIntensity`.
9. **Código (adaptación; no ejecutada):**
   ```js
   const lm = await new HDRLoader().loadAsync('/luz/barberia_lightmap.hdr'); // cargador según versión instalada
   lm.colorSpace = THREE.LinearSRGBColorSpace; lm.channel = 1; lm.flipY = false;
   modelo.traverse(o => { if (o.isMesh && o.geometry.attributes.uv1) { o.material.lightMap = lm; o.material.lightMapIntensity = 1; } });
   ```
   (`flipY = false`: verificado — GLTFLoader lo fija en todas las texturas que carga [COD, `GLTFLoader.js` l. 3366]; una textura cargada aparte para un modelo glTF debe igualarlo.)
10. **Errores habituales.** Lightmap sobre UV0 con *tiling* (luz repetida); `colorSpace` sRGB en datos lineales (luz lavada) o en el AO; luz horneada **más** luces dinámicas equivalentes (doble iluminación); costuras por margen insuficiente; mover objetos con luz horneada.
11. **Rendimiento / a11y.** Una textura más por material en memoria de GPU (KTX2 ayuda, GLTF-001) a cambio de quitar luces y sombras en tiempo real (LIGHT-001 §5); ideal para móvil.
12. **Compatibilidad.** `lightMap`/`aoMap`: WebGL y WebGPU; LightMapper: solo WebGPURenderer.
13. **Aplicaciones.** Recorrido por el local de una barbería o clínica, producto en estudio, escaparate 3D.
14. **Pruebas.** Comparar fps y memoria (`renderer.info`) con luces dinámicas vs horneado; revisar costuras y repetición; comprobar `uv1` tras la exportación.
15. **Estado.** Código de three.js, código de Blender (5.4 alfa) y del exportador glTF leídos; manual del exportador leído; nada ejecutado. Las etiquetas pueden variar entre versiones de Blender: comprobar en la instalada.
