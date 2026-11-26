---
id: WGPU-001
titulo: WebGPU frente a WebGL — soporte real, cuándo elegir cada uno y escalera de degradación progresiva para experiencias 3D
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (manual WebGPURenderer) + DATOS_DE_SOPORTE (caniuse, consultado 2026-10-27) + síntesis
versiones: three.js r186; datos de navegador a 2026-10-27
perfil: cinematografico
ultima_revision: 2026-10-27
---

# WGPU-001 · WebGPU vs WebGL

1. **Finalidad.** Decidir el renderer y el plan B de una experiencia 3D sin dejar fuera a usuarios ni arruinar el rendimiento.
2. **Fuentes.** https://threejs.org/manual/en/webgpurenderer ; https://caniuse.com/webgpu (consultado 2026-10-27).
3. **Soporte de WebGPU [caniuse, 2026-10-27].**
   | Navegador | Estado según caniuse |
   |---|---|
   | Chrome / Edge escritorio | sí desde 113 |
   | Chrome Android | sí (versión actual listada) |
   | Safari iOS | sí desde 26.0 |
   | Safari macOS | parcial (26.x) |
   | Firefox escritorio | desactivado por defecto en todas las versiones listadas |
   | Uso global con soporte | ≈ 87,8 % (85,8 % + 2,0 % parcial) |
   Nota: caniuse no detalla qué cubre el "parcial" de Safari; Mozilla anunció "Shipping WebGPU on Windows in Firefox 141" (julio de 2025) — **confirmado en el lote 16 por varias fuentes secundarias** que citan ese anuncio (p. ej. simonwillison.net, 16-07-2025; el artículo original de Mozilla no se leyó); Linux y macOS llegarían después. Esto no coincide con la tabla de caniuse leída en el lote 11 → comprobar la tabla vigente y las notas de versión de cada navegador antes de decidir.
4. **Criterios de elección [síntesis con el manual].**
   | Necesidad | Elección |
   |---|---|
   | Web de cliente con 3D moderado, máxima compatibilidad | `WebGLRenderer` (estable) |
   | Muchas partículas/simulación en GPU (compute), posproceso de nodos, TSL | `WebGPURenderer` (experimental) **con respaldo WebGL 2 automático** |
   | Equipo con shaders GLSL existentes (`ShaderMaterial`) | `WebGLRenderer` (no se pueden usar en WebGPURenderer) |
   | Proyecto que vivirá años | TSL facilita la migración; fijar versión |
   Ojo: los cálculos `compute` en el backend WebGL 2 tienen limitaciones (WebGL 2 no tiene compute shaders nativos) [conocimiento general, verificar en la doc de la versión]; los casos con simulación pesada necesitan un plan B propio.
5. **Escalera de degradación progresiva [propuesta propia].**
   1. **Nivel 0 — sin JS / reduced motion:** HTML completo (titulares, textos, CTA) + imagen o vídeo póster estático; nada esencial en el canvas.
   2. **Nivel 1 — sin WebGL o GPU pobre:** vídeo pregrabado controlado por scroll (VID-001) o secuencia de imágenes.
   3. **Nivel 2 — WebGL 2:** escena reducida (DPR ≤ 1,5, menos instancias, sin posproceso).
   4. **Nivel 3 — WebGPU:** escena completa (compute, más partículas, posproceso).
   - Detección: `navigator.gpu` + `requestAdapter()` para WebGPU; contexto `webgl2` para WebGL; calidad por `devicePixelRatio`, ancho, `navigator.hardwareConcurrency`, y una medición de fps durante los primeros segundos (bajar de nivel si cae).
   - Los casos de Codrops 2026 (cristal líquido, TSL-002) presentan WebGPU como base y **no** describen respaldo: no copiar esa suposición a webs de cliente.
6. **Presupuestos de referencia [casos reales].** Immersive Garden apuntó a 60 fps estables en clase iPhone 11/12 (CASE-002); A Drift limita su planificador a 40 fps y el DPR de lienzos a 1,25 (TXT-006).
7–13. **Aplicaciones.** Toda experiencia del perfil B.
14. **Pruebas.** Forzar WebGL (`forceWebGL`), desactivar WebGL en el navegador, Firefox, Safari iOS, reduced motion, móvil de gama media; comprobar que cada nivel conserva contenido y CTA.
15. **Estado.** Fuentes leídas; escalera = propuesta no probada.
