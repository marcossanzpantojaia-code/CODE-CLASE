---
id: INST-002
titulo: Muchos objetos a escala — datos por instancia en GPU (TSL `range`/`instanceIndex`), partículas con compute (`instancedArray`) y BatchedMesh para geometrías distintas
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (ejemplos oficiales three.js r186, MIT: `webgpu_tsl_galaxy`, `webgpu_compute_particles`) + DOCUMENTACION_OFICIAL_ANALIZADA (BatchedMesh)
versiones: three.js 0.186.0
perfil: cinematografico
ultima_revision: 2026-10-27
---

# INST-002 · Instancing avanzado

1. **Finalidad.** Pasar de miles (INST-001, matrices en CPU) a cientos de miles de elementos animados en GPU, y agrupar geometrías distintas en pocas llamadas de dibujo (temas 11 y 13).
2. **Fuentes.** Ejemplos `webgpu_tsl_galaxy.html` (20 000 instancias) y `webgpu_compute_particles.html` (200 000 partículas) — repo three.js e06d724, MIT. Docs https://threejs.org/docs/pages/BatchedMesh.html .
3. **Nivel 1 — aleatoriedad por instancia sin CPU [COD].** En TSL, `range(min, max)` devuelve un valor distinto por instancia y `hash(instanceIndex)` un pseudoaleatorio estable → posición, tamaño y color se calculan en el shader; la CPU no rellena 20 000 matrices (TSL-001 §6).
4. **Nivel 2 — simulación en GPU con compute [COD].**
   - Búferes: `instancedArray(n, 'vec3')` para posiciones, velocidades y colores.
   - Inicialización: `Fn(() => { const p = positions.element(instanceIndex); … })().compute(n)` → rejilla de √n × √n con separación 0,2; color con `hash`.
   - Actualización por frame: gravedad (`uniform(-0.00098)`), `position.addAssign(velocity)`, fricción 0,99; `If(position.y.lessThan(0), …)` rebote 0,8 y rozamiento del suelo 0,9.
   - Interacción: raycast contra un plano invisible → `clickPosition` (uniform) → compute "hit" que empuja las partículas dentro de un radio 3 con fuerza proporcional a la distancia y aleatorizada con `hash`.
   - Dibujo: **un único `Sprite`** con `SpriteNodeMaterial`, `positionNode = positions.toAttribute()`, `opacityNode = shapeCircle()`, `alphaToCoverage`, `particles.count = n`, `frustumCulled = false`.
   - `await renderer.init()` antes del primer `renderer.compute(init)`.
   - [Observación] La gravedad y la fricción se aplican **por frame** (sin delta) → velocidad dependiente de los Hz; en producción multiplicar por `deltaTime` (PHYS-001 §5).
5. **Nivel 3 — geometrías distintas con un material: BatchedMesh [docs].** `new BatchedMesh(maxInstancias, maxVértices, maxÍndices, material)`; `addGeometry(geo)` → id; `addInstance(idGeo)` → id; `setMatrixAt`, `setColorAt` (Vector4 con alfa), `setVisibleAt`; `perObjectFrustumCulled` y `sortObjects` (por defecto true); `optimize()` reempaqueta tras borrar; capacidades fijadas al crear (`setGeometrySize`/`setInstanceCount` para cambiarlas); no admite matrices con escala negativa; cajas/esferas envolventes `null` hasta calcularlas; `dispose()`.
6. **Elección [síntesis].** Mismo objeto ×N y animación sencilla → InstancedMesh (INST-001); ×N con lógica por elemento → TSL `range/hash` (nivel 1); física/partículas masivas → compute (nivel 2, requiere WebGPU real para rendir — WGPU-001); objetos diferentes con un material (mobiliario, ciudad) → BatchedMesh; estáticos → `mergeGeometries` (ARCH-002).
7. **Procedimiento.** Empezar con el nivel más bajo que resuelva el caso; medir `renderer.info` (llamadas de dibujo) y fps; preparar el nivel inferior como respaldo.
8. **Parámetros.** Ver §4 (200 000 partículas, gravedad −0,00098, rebote 0,8, fricción 0,99, tamaño 0,12, radio de impacto 3).
9. **Código (MIT, fragmento mínimo):**
   ```js
   const positions = instancedArray(particleCount, 'vec3');
   material.positionNode = positions.toAttribute();
   ```
10. **Errores frecuentes.** `frustumCulled` activo con posiciones calculadas en GPU (el objeto desaparece); olvidar `await renderer.init()`; usar compute esperando el mismo rendimiento en el respaldo WebGL 2.
11–13. **Aplicaciones.** Fondos de partículas que reaccionan al ratón, "explosión" de logo, ciudad o tienda 3D con muchos objetos.
14. **Pruebas.** fps con 20k/100k/200k; móvil; respaldo; `renderer.info`.
15. **Estado.** Código oficial y docs leídos; nada ejecutado.
