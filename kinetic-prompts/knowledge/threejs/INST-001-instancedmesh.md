---
id: INST-001
titulo: Miles de objetos en una sola llamada de dibujo — InstancedMesh (y cuándo usar fusión de geometrías)
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (threejs.org/docs InstancedMesh) + CODIGO_INSPECCIONADO (fusión en folio-2019, ARCH-002)
versiones: three.js actual (docs 2026-10-26)
perfil: cinematografico
ultima_revision: 2026-10-26
---

# INST-001 · InstancedMesh

1. **Finalidad.** Partículas, bosques, campos de cubos, cuadrículas de tarjetas 3D o "nubes" de logos con miles de elementos sin hundir los FPS (temas 11 y 13; rendimiento R3F-002/TJ-002).
2. **Fuentes.** https://threejs.org/docs/pages/InstancedMesh.html. Contraste: Bruno Simon fusiona geometrías estáticas por material con `BufferGeometryUtils.mergeGeometries` (ARCH-002). El artículo de Wael Yasmina sobre instancing sigue pendiente (no localizado en este lote).
3. **API [doc].**
   - `new THREE.InstancedMesh(geometry, material, count)` — misma geometría y material(es), una transformación por instancia, **una llamada de dibujo**.
   - `setMatrixAt(i, matrix)` / `getMatrixAt(i, matrix)` → después `instanceMatrix.needsUpdate = true`.
   - `setColorAt(i, color)` → `instanceColor.needsUpdate = true` (`instanceColor` es `null` hasta el primer `setColorAt`).
   - `count` editable: dibujar menos instancias sin reasignar.
   - `computeBoundingBox()` no es automático; `computeBoundingSphere()` se calcula cuando hace falta (raycast, *frustum culling*) — **recalcular tras mover instancias**.
   - `setMorphAt` / `morphTexture` para morphs por instancia; `dispose()` al terminar.
4. **Notas [conocimiento general señalado por la propia consulta; verificar].** `intersectObject` devuelve `instanceId`; para datos que cambian cada frame, `instanceMatrix.setUsage(THREE.DynamicDrawUsage)`.
5. **Decisión [criterio propio].**
   | Caso | Técnica |
   |---|---|
   | Muchos objetos iguales que se mueven o cambian de color | InstancedMesh |
   | Muchos objetos distintos pero estáticos con el mismo material | Fusión (`mergeGeometries`) |
   | Distintas geometrías con el mismo material y movimiento | `BatchedMesh` (pendiente de investigar) |
   | Decenas de objetos | Mallas normales |
6. **Procedimiento.**
   1. Un `Object3D` "dummy": fijar posición/rotación/escala, `dummy.updateMatrix()`, `setMatrixAt(i, dummy.matrix)`.
   2. Animar en el bucle solo lo necesario y marcar `needsUpdate` una vez por frame.
   3. Tras cambiar posiciones, `computeBoundingSphere()` para que el *culling* no oculte instancias que han salido de la esfera original.
   4. Interacción: raycast → `instanceId` → `setColorAt`.
   5. En R3F: `<instancedMesh args={[geo, mat, count]}>` o `Instances`/`Instance` de drei (más cómodo, algo más caro) [conocimiento general].
7. **Parámetros.** `count`; tamaño de la geometría base (vértices × instancias = coste real).
8. **Código (adaptación de la doc; no ejecutada):**
   ```js
   const mesh = new THREE.InstancedMesh(geo, mat, 2000), dummy = new THREE.Object3D();
   for (let i = 0; i < 2000; i++) { dummy.position.set(Math.random()*100, 0, Math.random()*100); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }
   mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
   ```
9. **Errores frecuentes.** Olvidar `needsUpdate`; instancias que desaparecen al moverse (esfera envolvente desactualizada); geometría base con demasiados vértices; transparencia (las instancias no se ordenan entre sí → artefactos) [conocimiento general].
10–13. **Aplicaciones.** Fondo de partículas de una landing, "constelación" de proyectos, campo de elementos que reacciona al ratón o al scroll.
14. **Pruebas.** `renderer.info.render.calls` (debe ser 1 por InstancedMesh); FPS con 1k/10k/50k instancias en móvil medio; raycast correcto.
15. **Estado.** Documentación leída; no implementado ni medido.
