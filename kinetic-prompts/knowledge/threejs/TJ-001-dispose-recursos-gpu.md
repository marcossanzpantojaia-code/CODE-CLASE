---
id: TJ-001
titulo: Liberación de recursos GPU en Three.js (dispose)
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA
versiones: manual vigente de threejs.org (revisión no indicada en la página)
perfil: cinematografico
ultima_revision: 2026-10-26
---

# TJ-001 · dispose() y memoria GPU

1. **Finalidad.** Evitar fugas de memoria GPU al cambiar de escena o de ruta.
2. **Fuente.** https://threejs.org/manual/pages/how-to-dispose-of-objects.html
3. **Ubicación.** Geometries, Materials, Textures, Render Targets, Skinned Mesh, FAQ.
4. **Resultado.** Memoria estable tras navegar repetidamente entre páginas 3D.
5. **Explicación técnica.** Three.js crea buffers, programas de shader y texturas WebGL que **no se liberan solos**: quitar un mesh de la escena no libera su geometría ni su material. Hay que llamar a `dispose()` en geometrías, materiales, texturas (el material no libera sus texturas), render targets y skeletons no compartidos. Controles y passes de postprocesado también tienen `dispose()`. Los `ImageBitmap` requieren `close()`. `renderer.info` permite auditar geometrías, texturas y programas en memoria.
6. **Dependencias.** three.
7. **Procedimiento.** Al desmontar: recorrer la escena y disponer recursos no compartidos; después controles, composer y renderer.
8. **Parámetros.** Política de recursos compartidos.
9. **Pseudocódigo (adaptación propia, no ejecutada):**
   ```js
   scene.traverse((o) => {
     if (!o.isMesh) return;
     o.geometry?.dispose();
     const mats = Array.isArray(o.material) ? o.material : [o.material];
     mats.forEach((m) => {
       Object.values(m).forEach((v) => v?.isTexture && v.dispose());
       m.dispose();
     });
   });
   controls?.dispose(); composer?.dispose(); renderer.dispose();
   ```
10. **Problemas.** Disponer algo aún en uso fuerza recompilación (bajón puntual, no error). Controles y renderer no son reutilizables tras `dispose()`. `renderer.info.memory` puede seguir mostrando recursos internos (envMap, background) sin que sea una fuga.
11. **Rendimiento.** Base del presupuesto GPU; complementar con compresión de texturas y LOD (pendiente).
12. **Compatibilidad.** WebGL moderno.
13. **Aplicaciones.** Configuradores de producto, landings 3D en SPA.
14. **Pruebas.** Navegar 20 veces entre rutas y comparar `renderer.info.memory` y la memoria en DevTools.
15. **Evidencia.** Manual oficial. Código no ejecutado. Gestión automática en React Three Fiber pendiente de verificar.
