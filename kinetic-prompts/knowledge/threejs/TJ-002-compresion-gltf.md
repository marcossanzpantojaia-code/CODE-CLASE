---
id: TJ-002
titulo: Presupuesto y compresión de modelos glTF/GLB (glTF Transform, Draco, Meshopt, texturas)
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (gltf-transform.dev/cli) + CODIGO_INSPECCIONADO (pesos medidos en TUT-004/005/014/015)
versiones: CLI @gltf-transform/cli (versión no anotada); instalación requiere autorización
perfil: cinematografico
ultima_revision: 2026-10-26
---

# TJ-002 · Compresión glTF

1. **Finalidad.** Llevar los modelos de los tutoriales (4,6 MB, 8,3 MB, 13,9 MB, 21,5 MB) a pesos compatibles con PERF-001.
2. **Fuente.** gltf-transform.dev/cli (documentación oficial de glTF Transform). Pesos: medidos en los repos clonados (lotes 2–3).
3. **Pesos observados.** `WawaOffice.glb` 4,6 MB (+ `.blend` público 2,5 MB); `Table.gltf` 8,3 MB con buffer en base64 (~33 % extra frente a GLB); nube de atmos 13,9 MB; `modern_kitchen.glb` 21,5 MB.
4. **Resultado esperado.** GLB con geometría comprimida (Draco o Meshopt) y texturas WebP/AVIF/KTX2 redimensionadas.
5. **Herramienta (docs).** `gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp` aplica "todas las optimizaciones disponibles" en un paso. Comandos individuales: `inspect` (diagnóstico previo), `dedup`, `instance`, `flatten`, `join`, `palette`, `weld`, `simplify`, `resample`, `prune`, `sparse`, `draco`, `meshopt`, `quantize`, texturas `webp`/`avif`/`png`/`jpeg`/`etc1s`/`uastc`, `resize`. Instalación: `npm install --global @gltf-transform/cli` (Sharp para imágenes). *(No instalado: requiere autorización.)*
6. **Dependencias en el visor.** Draco → `DRACOLoader` (decodificador WASM); Meshopt → `MeshoptDecoder`; KTX2 → `KTX2Loader` (transcoder Basis). En drei, `useGLTF` admite Draco y Meshopt (verificar parámetros en la versión usada).
7. **Procedimiento.** (1) `inspect` para ver qué pesa (texturas suelen ser > 70 %, análisis propio a confirmar por modelo); (2) quitar lo invisible (`prune`), fusionar (`join`, `instance`); (3) texturas al tamaño de pantalla real (p. ej. ≤ 2048 px); (4) compresión de geometría; (5) comparar visualmente antes/después; (6) nunca servir `.blend` ni fuentes en `public/`.
8. **Parámetros de presupuesto propuestos (adaptación).** Hero 3D ≤ 2–3 MB transferidos en total; configurador ≤ 5 MB con carga progresiva; mostrar póster/imagen hasta que el modelo esté listo.
9. **Código.** Comando de la doc (arriba). No ejecutado.
10. **Problemas habituales.** Decodificadores no servidos (404 del WASM); compresión con pérdida visible en normales; `.gltf` + base64; texturas 4K innecesarias.
11. **Accesibilidad.** Indicador de carga con texto; contenido esencial fuera del canvas.
12. **Compatibilidad.** KTX2/Basis requiere transcoder; Draco y Meshopt soportados por three.js oficiales.
13. **Aplicaciones.** Todo proyecto con modelos.
14. **Pruebas.** Peso transferido (DevTools Network), tiempo hasta primer frame, comparación visual, memoria GPU (`renderer.info`).
15. **Estado de evidencia.** Docs leídas; herramienta no instalada ni ejecutada. Licencia de la herramienta no indicada en la página consultada (verificar en su repositorio).
