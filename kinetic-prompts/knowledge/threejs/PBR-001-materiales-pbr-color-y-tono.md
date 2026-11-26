---
id: PBR-001
titulo: Materiales PBR en three.js — espacios de color de cada textura, salida y mapeo de tono (NoToneMapping por defecto), capas de MeshPhysicalMaterial y el coste oculto de animarlas desde 0
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (three.js rama dev, commit e06d724, package.json 0.186.0, MIT: src/materials/MeshStandardMaterial.js, MeshPhysicalMaterial.js, src/constants.js, src/renderers/WebGLRenderer.js)
versiones: three.js r186
perfil: cinematografico
ultima_revision: 2026-10-27
---

# PBR-001 · Materiales PBR, color y tono

1. **Nombre y finalidad.** Que un producto o un interior 3D se vea "como en el render" y no lavado, saturado o plástico: configurar bien espacios de color, mapeo de tono y capas físicas (temas 11, 13). Completa LIGHT-001/002 (luz) y GLTF-001 (texturas).
2. **Fuente.** Comentarios JSDoc y código del repositorio three.js (MIT).
3. **Ubicación.** Propiedades `map`, `emissiveMap`, `normalMap`, `roughnessMap`, `aoMap`, `lightMap` (MeshStandardMaterial); `ior`, `thickness`, `specularIntensity`, `transmission`, `clearcoat`, `sheen`, `iridescence`, `anisotropy`, `dispersion` (MeshPhysicalMaterial); constantes de tono; valores iniciales de WebGLRenderer.
4. **Resultado.** Lista de comprobación de color y materiales que evita los errores visuales más comunes.
5. **Explicación técnica [COD].**
   - **Espacio de color por textura:**
     | Textura | Datos | `colorSpace` |
     |---|---|---|
     | `map`, `emissiveMap` | color | normalmente `SRGBColorSpace` |
     | `normalMap`, `roughnessMap` (canal verde), `metalnessMap` (canal azul), `aoMap` (canal rojo) | no-color | `NoColorSpace` (por defecto) |
     | `lightMap` | iluminancia horneada | normalmente `LinearSRGBColorSpace`, formatos float (LIGHT-002) |
     GLTFLoader asigna `SRGBColorSpace` a `baseColorTexture` → `map` y los colores de factor en lineal [COD, GLTFLoader l. 842–849]; las texturas cargadas aparte hay que configurarlas a mano. `metalnessMap` usa el canal **azul** (y `roughnessMap` el verde: encaja con las texturas ORM de glTF).
   - **Salida:** `renderer.outputColorSpace` = `SRGBColorSpace` por defecto.
   - **Mapeo de tono:** `renderer.toneMapping` = **`NoToneMapping` por defecto**, `toneMappingExposure` = 1. Opciones: Linear, Reinhard, Cineon, ACESFilmic, AgX, **Neutral** ("based on the Khronos 3D Commerce Group standard tone mapping") y Custom. Sin mapeo de tono, un entorno HDR satura los brillos; los ejemplos oficiales usan ACESFilmic (LIGHT-001) o Neutral (POST-001).
   - **Normal maps:** si el mapa se creó con la convención "left handed", negar `normalScale.y`.
   - **MeshPhysicalMaterial:** `ior` 1,5 (rango 1,0–2,333); `thickness` 0 = pared fina, > 0 = volumen; `specularIntensity` 1 (0 = lambertiano; solo no metales); `transmission` 0–1 para vidrio/plástico transparente ("When transmission is non-zero, `opacity` should be set to `1`"); capas `clearcoat`, `sheen`, `iridescence` (grosor por defecto `[100, 400]`), `anisotropy`, `dispersion`, `diffuseRoughness`, `retroreflectivity` — **todas 0 por defecto**.
   - **Coste oculto [COD]:** los *setters* de esas capas incrementan `material.version` **cuando el valor cruza el 0** (`if (this._clearcoat > 0 !== value > 0) this.version++`) → el material **se recompila**. Animar `clearcoat` o `transmission` desde 0 con GSAP provoca un tirón en el primer fotograma [inferencia a partir del código, sin medir] → partir de un valor mínimo (p. ej. 0,001) o activar la capa antes de la animación.
6. **Dependencias.** three r186 (WebGL o WebGPU; en WebGPU los equivalentes `*NodeMaterial`).
7. **Procedimiento (adaptación; no ejecutada).**
   1. `renderer.toneMapping = THREE.NeutralToneMapping` (producto con colores de marca fieles) o `ACESFilmicToneMapping` (aspecto cinematográfico); ajustar `toneMappingExposure` en vez de subir luces.
   2. `scene.environment` HDR (LIGHT-001) antes de añadir luces.
   3. Revisar `colorSpace` de toda textura cargada a mano (tabla de §5).
   4. Usar `MeshStandardMaterial` por defecto; `MeshPhysicalMaterial` solo donde haga falta una capa (vidrio de la vitrina: `transmission`; tijeras cromadas lacadas: `clearcoat`; tela del sillón: `sheen`) — más capas, más coste de fragmento.
   5. Capas animadas: inicializarlas a un valor > 0 antes de empezar.
8. **Parámetros.** `toneMapping`, `toneMappingExposure`, `ior`, `thickness`, `transmission`, `clearcoat`, `sheen`.
9. **Código (adaptación; no ejecutada):**
   ```js
   renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
   colorTex.colorSpace = THREE.SRGBColorSpace;           // normalMap/roughnessMap: dejar NoColorSpace
   const vidrio = new THREE.MeshPhysicalMaterial({ transmission: 1, opacity: 1, roughness: 0.05, thickness: 0.5, ior: 1.5 });
   const laca = new THREE.MeshPhysicalMaterial({ clearcoat: 0.001 }); gsap.to(laca, { clearcoat: 1, duration: 1 }); // sin recompilar a mitad
   ```
10. **Errores habituales.** Texturas de color sin `SRGBColorSpace` (aspecto lavado) o mapas normales/rugosidad marcados como sRGB (sombreado erróneo); sin mapeo de tono con HDR; `transmission` con `opacity < 1`; abusar de MeshPhysicalMaterial; animar capas desde 0.
11. **Rendimiento / a11y.** Transmission añade una pasada: WebGLRenderer renderiza los objetos opacos a un `transmissionRenderTarget` por cámara antes de los transmisivos (`renderTransmissionPass`) [COD] → caro en móvil. Sin impacto directo en accesibilidad.
12. **Compatibilidad.** WebGL2 y WebGPURenderer.
13. **Aplicaciones.** Producto en el héroe (maquinilla, frasco de aceite de barba con vidrio), configuradores (CFG-001), interiores.
14. **Pruebas.** Comparar con el render de Blender en la misma cámara; `renderer.info.programs.length` antes y después de animar una capa (debe no crecer si se parte de > 0); fps con y sin transmission.
15. **Estado.** Código fuente leído; nada ejecutado.
