---
id: R3F-002
titulo: Rendimiento en React Three Fiber — errores frecuentes y escalado (docs oficiales)
categoria: threejs
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (r3f.docs.pmnd.rs: Performance pitfalls, Scaling performance; docs v9.8.2)
versiones: @react-three/fiber v9 (docs); concurrente por defecto desde v8
perfil: cinematografico
ultima_revision: 2026-10-26
---

# R3F-002 · Rendimiento R3F

1. **Finalidad.** Convertir las escenas de los tutoriales (TUT-004…006, 014, 015) en experiencias que mantengan 60 fps en hardware medio.
2. **Fuente.** r3f.docs.pmnd.rs/advanced/pitfalls y /advanced/scaling-performance.
3. **Errores frecuentes (docs) → corrección.**
   - Crear materiales/geometrías/luces a menudo → compartir con `useMemo` o a nivel de módulo; instancing.
   - Montar/desmontar con `&&` (re-inicializa buffers) → mantener montado y alternar `visible`. *(TUT-005 cambia patas con `&&`.)*
   - `setState` en `setInterval`, en `useFrame` o en eventos rápidos (`onPointerMove`) → mutar refs. *(TUT-004 Overlay.)*
   - Movimiento dependiente de los fps → escalar por `delta`.
   - Suscribirse a un store para valores que cambian cada frame → leer imperativamente dentro de `useFrame` (p. ej. `getState()` de Zustand).
   - Trabajo pesado bloqueando la UI → `startTransition`/`useTransition`.
   - Crear `Vector3`/`Quaternion` en cada frame → reutilizar y usar `.set()`. *(TUT-005, TUT-014.)*
   - `TextureLoader` en `useEffect` (re-descarga) → `useLoader` (caché por URL); modelos → gltfjsx para reutilizar partes.
4. **Escalado (docs).**
   - `frameloop="demand"`: renderiza solo cuando cambian props; `invalidate()` para cambios que React no ve (los controles de drei lo hacen solos; para animaciones sincronizadas, invalidar y arrancar en `requestAnimationFrame`).
   - **Draw calls:** objetivo < 1 000, idealmente unos cientos; `instancedMesh` (`setMatrixAt` + `instanceMatrix.needsUpdate`).
   - LOD con `<Detailed distances={[0, 10, 20]}>`; `Suspense` anidados (baja calidad primero).
   - `PerformanceMonitor` (drei): `onIncline`/`onDecline`, `onChange` con factor 0–1 (empieza en 0,5), `flipflops` → `onFallback`.
   - **DPR adaptativo:** ejemplo oficial 1,5 → 1 al bajar, 2 al subir; o `0.5 + 1.5 × factor`.
   - **Regresión por movimiento:** `performance = { current: 1, min: 0.1, max: 1, debounce: 200 }`; `regress()` no hace nada solo: la app debe leer `current` y bajar calidad.
   - `THREE.ColorManagement.enabled = true` (r150+) al crear colores fuera del Canvas.
5. **Explicación.** Cada objeto 3D es trabajo de CPU (React + three) y de GPU (draw call); el bucle por frame debe ser "solo mutaciones".
6. **Dependencias.** @react-three/fiber, @react-three/drei.
7. **Procedimiento (checklist para Claude Code).** (1) `frameloop="demand"` si la escena es estática salvo scroll/interacción; (2) cero `setState` y cero `new` dentro de `useFrame`; (3) `visible` en vez de desmontar; (4) `PerformanceMonitor` + DPR adaptativo con tope 2; (5) instancing si hay > 50 objetos iguales; (6) assets comprimidos (TJ-002); (7) liberar al salir (TJ-001).
8. **Parámetros.** DPR [1, 2], draw calls < 1 000, distancias LOD.
9. **Código (adaptación propuesta; no ejecutada):**
   ```jsx
   <Canvas frameloop="demand" dpr={dpr}>
     <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} flipflops={3} onFallback={() => setDpr(1)} />
     ...
   </Canvas>
   ```
10. **Problemas habituales.** Con `frameloop="demand"`, animaciones de `useFrame` que no se ven (hay que invalidar); `regress()` sin efecto si no se lee `current`.
11. **Accesibilidad.** Ofrecer versión estática (reduced motion o fallback de rendimiento).
12. **Compatibilidad.** R3F 9 requiere React 19 (según su guía de migración enlazada; verificar).
13. **Aplicaciones.** Configuradores, heros 3D, escenas de scroll.
14. **Pruebas.** FPS en portátil integrado y móvil medio; `gl.info.render.calls`; memoria tras 5 minutos.
15. **Estado de evidencia.** Docs oficiales leídas (resumen de la herramienta de lectura). No ejecutado.
