---
id: TUT-038
titulo: three.js — ejemplos oficiales WebGPU/TSL (r186)
creador: three.js authors (mrdoob y colaboradores)
identidad_verificada: SI (github.com/mrdoob/three.js)
repo: https://github.com/mrdoob/three.js (commit e06d724, 2026-10-26, versión 0.186.0; clon parcial sin historial)
licencia: MIT
video_url: no
narrado: n/a
transcript_status: n/a
code_route: B_CODIGO_PUBLICO + DOC_OFICIAL
evidencia: CODIGO_INSPECCIONADO (3 ejemplos completos) + inventario de files.json
ultima_revision: 2026-10-27
---

# TUT-038 · Ejemplos oficiales WebGPU

1. **Inventario.** 238 ejemplos WebGPU en `examples/files.json`; relevantes para la biblioteca: backdrop/water, compute particles (fluid, rain, snow), instance mesh/path/points/sprites/uniform, instancing morph, mesh batch, postprocessing bloom (selectivo/emisivo) y **transition**, procedural texture, y la serie `webgpu_tsl_*` (galaxy, raging sea, procedural terrain, earth, halftone, VFX flames/tornado/linked particles, angular slicing, occlusion dither, wood, editor, transpiler, interoperability).
2. **Leídos.** `webgpu_tsl_galaxy` → TSL-001 §6 e INST-002 §3; `webgpu_postprocessing_transition` → SCN-002; `webgpu_compute_particles` → INST-002 §4. Descargados pero no resumidos: `webgpu_procedural_texture`, `webgpu_instance_uniform`, `webgpu_mesh_batch`, `webgpu_tsl_raging_sea`.
3. **Pendiente.** Resumir procedural texture, raging sea (desplazamiento de vértices), mesh batch (BatchedMesh en uso), interoperability (GLSL/WGSL dentro de TSL), bloom selectivo.
