---
id: GLTF-001
titulo: Compresión y optimización de modelos glTF para la web — inspección, Draco vs Meshopt, texturas KTX2 (ETC1S/UASTC) y carga en three.js
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (glTF-Transform CLI; gltfpack/meshoptimizer README, MIT; Khronos KTX Artist Guide; three.js GLTFLoader)
versiones: three.js r186 (GLTFLoader); @gltf-transform/cli y gltfpack según sus docs vigentes (2026-10-27)
perfil: cinematografico (y cualquier web con 3D)
ultima_revision: 2026-10-27
---

# GLTF-001 · glTF ligero

1. **Finalidad.** Llevar modelos de varios MB (en la biblioteca: GLB de 4,6 MB en R3F-001; assets de 4–21 MB en tutoriales — ARCH-001) a tamaños y memoria de GPU razonables sin degradar la imagen (tema 12–13; WGPU-001 §6).
2. **Fuentes.** https://gltf-transform.dev/cli ; https://github.com/zeux/meshoptimizer/blob/master/gltf/README.md (gltfpack, MIT); https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md ; https://threejs.org/docs/pages/GLTFLoader.html .
3. **Paso 0 — inspeccionar [glTF-Transform].** `gltf-transform inspect input.glb` informa si la escena pesa por geometría, por texturas o por exceso de llamadas de dibujo → atacar lo que pesa. `gltf-transform optimize input.glb output.glb --compress draco --texture-compress webp` aplica las optimizaciones comunes en un paso; la doc advierte que los valores por defecto **no son ideales para todas las escenas** (`optimize -h`). Comandos sueltos: `draco`, `meshopt`, `resize`, `etc1s`, `uastc`, `webp`, `simplify`. Instalación global por npm (usa Sharp para imágenes) — **no instalar sin autorización**.
4. **gltfpack [README].** Reordena geometría para la caché de la GPU, **cuantiza** geometría y animación (`KHR_mesh_quantization`, por defecto), fusiona mallas (menos draw calls), poda nodos y puede simplificar. Opciones: `-c`/`-cc` compresión meshopt (`-cc` mejor y se comprime bien con gzip/deflate), `-tc` texturas a KTX2/Basis, `-tw` a WebP, `-si R` simplificar a la proporción R, `-mi` instancing (`EXT_mesh_gpu_instancing`), `-kn/-km/-ke` conservar nodos/materiales/extras con nombre (útil si el código busca objetos por nombre), `-cf` búferes de respaldo sin compresión para navegadores sin WebAssembly. **No admite Draco** y descarta extensiones propias de proveedores.
5. **Draco vs Meshopt [síntesis; las fuentes no publican una comparación numérica].** Draco: muy buena compresión de geometría estática; decodificador WASM/JS aparte. Meshopt: geometría **y animación**, compatible con cuantización, decodificador pequeño; requiere WebAssembly (o `-cf`). Elegir uno por proyecto y medir: tamaño transferido (con Brotli/gzip del servidor), tiempo de decodificación en móvil y calidad.
6. **Texturas KTX2 [Khronos].**
   - Por qué: PNG/JPEG se **descomprimen enteros en la GPU**; KTX2 sigue comprimido en memoria (ejemplo del documento: lámpara ≈ 96 MB → ≈ 21 MB de memoria de GPU; textura del pato ≈ 1,5 MB → ≈ 277 KB en ETC1S). Para un único modelo, WebP/JPEG pueden ganar en tamaño de descarga; KTX2 brilla en escenas con muchos recursos.
   - **ETC1S** (pequeño): color base y emisivos con zonas planas, UI, estilo *toon*; artefactos de bloque en texturas complejas.
   - **UASTC** (calidad): **normales**, mapas empaquetados (ORM) y texturas de extensiones (clearcoat); con supercompresión (`--zcmp 22`).
   - Ajustes del ejemplo (`toktx`): ETC1S `--t2 --encode etc1s --clevel 4 --qlevel 255`; UASTC `--t2 --encode uastc --uastc_quality 4 --uastc_rdo_l .5 --uastc_rdo_d 65536 --zcmp 22` (más calidad: `--uastc_rdo_l .25`); datos no de color (normal/ORM): `--assign_oetf linear --assign_primaries none`; mipmaps `--genmipmap`.
   - Reglas: potencias de dos casi siempre (2048, 1024, 512) y múltiplos de 4 para `KHR_texture_basisu`; ≤ 2048×2048 para la mayoría de destinos; ORM a ¼ de la resolución del color base; UV alineadas a la rejilla de 4×4 px; partir de PNG de 8 bits, no de JPEG; usar factores numéricos en lugar de texturas cuando baste un valor.
7. **Carga en three.js [docs].**
   ```js
   const loader = new GLTFLoader();
   const draco = new DRACOLoader(); draco.setDecoderPath('/draco/'); loader.setDRACOLoader(draco);
   const ktx2 = new KTX2Loader(); ktx2.setTranscoderPath('/basis/'); ktx2.detectSupport(renderer); loader.setKTX2Loader(ktx2);
   loader.setMeshoptDecoder(MeshoptDecoder);   // three/addons/libs/meshopt_decoder.module.js
   const gltf = await loader.loadAsync('/models/reloj.glb');
   ```
   - Alojar los decodificadores (Draco, Basis) en el propio dominio (CSP: `wasm-unsafe-eval` puede ser necesario para WASM [conocimiento general, verificar con SEC-001]).
   - Extensiones soportadas por GLTFLoader (doc): `KHR_draco_mesh_compression`, `KHR_mesh_quantization`, `EXT_meshopt_compression`/`KHR_meshopt_compression`, `EXT_mesh_gpu_instancing`, `KHR_texture_basisu`, `EXT_texture_webp`, `EXT_texture_avif`, materiales `KHR_materials_*` y luces `KHR_lights_punctual`.
   - Los `ImageBitmap` no se liberan solos: `dispose()` explícito (TJ-001).
8. **Procedimiento [síntesis propia].** (1) Exportar desde Blender con transformaciones aplicadas y nombres estables; (2) `inspect`; (3) texturas: redimensionar → KTX2 (UASTC normales/ORM, ETC1S color) o WebP si es un solo modelo; (4) geometría: meshopt o Draco + simplificar donde no se ve; (5) comparar visualmente antes/después en la escena real; (6) presupuesto: definir MB máximos de descarga y de memoria por dispositivo; (7) precargar tras el LCP.
9–13. **Aplicaciones.** Configuradores (CFG-001), escenas de scroll (R3F-001), producto 3D en landings.
14. **Pruebas.** Tamaño transferido (DevTools, con compresión del servidor); tiempo hasta el primer frame con el modelo en móvil medio; memoria de GPU (`renderer.info.memory`); comparación visual; navegador sin WebAssembly si se usa `-cf`.
15. **Estado.** Docs leídas; ninguna herramienta instalada ni ejecutada.
