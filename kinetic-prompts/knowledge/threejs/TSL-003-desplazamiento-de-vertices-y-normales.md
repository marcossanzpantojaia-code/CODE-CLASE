---
id: TSL-003
titulo: Superficie procedural animada en TSL — olas por suma de senos y ruido, normales recalculadas por vecinos y color emisivo según la altura ("Raging Sea", ejemplo oficial)
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (examples/webgpu_tsl_raging_sea.html, three.js r186, MIT)
versiones: three.js 0.186.0
perfil: cinematografico
ultima_revision: 2026-10-27
---

# TSL-003 · Mar procedural (vértices + normales + emisivo)

1. **Finalidad.** Patrón reutilizable para cualquier superficie que se deforma en el shader (mar, tela, terreno, logo líquido): desplazar vértices, **recalcular la normal** para que la luz sea correcta y colorear por altura (temas 8, 11, 13). Complementa GL-004 (onda simple en GLSL) y TSL-002 (normales por diferencias en un plano 2D).
2. **Fuente.** `examples/webgpu_tsl_raging_sea.html` del repo three.js (commit e06d724, MIT).
3. **Material [COD].** `MeshStandardNodeMaterial({ color: '#271442', roughness: 0.15 })`, una luz direccional; geometría `PlaneGeometry(2, 2, 256, 256)` girada a horizontal (256×256 segmentos: la deformación necesita vértices).
4. **Altura de las olas [COD].** `wavesElevation = Fn(([position]) => …)`:
   - Olas grandes: `sin(x·fx + t·v) · sin(z·fz + t·v) · amplitud` con `uniform(vec2(3, 1))`, velocidad 1,25, amplitud 0,15.
   - Olas pequeñas: `Loop` de 1 a N (N = 3) restando `|mx_noise_float(vec3(xz·frecuencia·i, t·0,3))| · 0,18 / i` (ruido de gradiente MaterialX; cada octava con más frecuencia y menos peso → turbulencia).
   - `positionNode = positionLocal + (0, elevación, 0)`.
5. **Normales correctas [COD].** Evaluar la misma función en dos vecinos desplazados `normalComputeShift = 0.01` (en +x y −z), formar los vectores hacia ellos, `cross()` → normal; `material.normalNode = transformNormalToView(normal)`. Sin esto, la superficie se ilumina como si siguiera plana.
6. **Emisivo por altura [COD].** `elevation.remap(alto, bajo).pow(7)` × color `#ff0a81` → las crestas/valles brillan; todo como `uniform` ajustable en el panel `Inspector`.
7. **Adaptación a webs (propia, no ejecutada).**
   - Exponer amplitud/velocidad como `uniform` y animarlas con GSAP/scroll (GL-006): el mar se calma al llegar al CTA.
   - Reducir segmentos (128×128) y octavas (1–2) en móvil; con reduced motion, `time` congelado.
   - Respaldo WebGL estable: el mismo algoritmo en GLSL con `ShaderMaterial` (no mezclar con WebGPURenderer — TSL-001).
8. **Parámetros.** Frecuencias (3, 1), velocidad 1,25, amplitud 0,15; 3 iteraciones de ruido, frecuencia 2, velocidad 0,3, multiplicador 0,18; desplazamiento para normales 0,01; potencia emisiva 7.
9. **Código (MIT, fragmento mínimo):**
   ```js
   const normal = positionA.sub(position).normalize().cross(positionB.sub(position).normalize());
   material.normalNode = transformNormalToView(normal);
   ```
10. **Errores frecuentes.** Desplazar sin recalcular normales; pocos segmentos (picos poligonales); `normalComputeShift` demasiado grande (normales suavizadas en exceso) o demasiado pequeño (ruido numérico).
11. **Rendimiento.** 66 049 vértices × 3 evaluaciones de la función (posición + 2 vecinos) por frame: coste de vértice ×3 → ajustar segmentos por dispositivo.
12–13. **Aplicaciones.** Fondo de héroe para marca náutica/bebidas, transición "líquida", tela ondeando con logotipo.
14. **Pruebas.** Iluminación coherente al girar la cámara; fps en móvil con 256² vs 128²; `forceWebGL`.
15. **Estado.** Código oficial leído; no ejecutado.
