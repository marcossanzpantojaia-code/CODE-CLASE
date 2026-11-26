---
id: SCN-001
titulo: Transición entre dos estados de una escena 3D con render targets y shader de mezcla
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-015)
versiones: fuente — three 0.153.0, @react-three/fiber 8.13.3, @react-three/drei 9.75.0, resolve-lygia ^1.0.4
perfil: cinematografico
ultima_revision: 2026-10-26
---

# SCN-001 · Transiciones de escena con FBO

1. **Nombre y finalidad.** Cambiar de ambiente/variante en una escena 3D (día/noche, acabados de un configurador) con un barrido o disolución creativa en lugar de un corte (temas 8, 12, 13).
2. **Fuente.** Wawa Sensei, `wass08/r3f-scene-transition-starter` y `-final` (TUT-015).
3. **Ubicación.** `Experience.jsx` (`useFrame` con dos render targets), `TransitionMaterial.jsx` (shader).
4. **Resultado.** La escena anterior se disuelve en la nueva siguiendo un patrón (barras, ruido fbm/Perlin/Worley/curl) con borde suave.
5. **Explicación técnica (observada).** Dos `useFBO()`. Cada frame: aplicar estado anterior → `gl.setRenderTarget(rt1)` → render; aplicar estado nuevo → `setRenderTarget(rt2)` → render; `setRenderTarget(null)`. Un plano del tamaño del viewport con `shaderMaterial` muestrea ambas texturas y mezcla con `pct`. `pct` viene de un patrón; el progreso se remapea a `[−s/2, 1 + s/2]` y se aplica `smoothstep(p, p + s/2, pct)` para que el borde tenga anchura `s` y la transición empiece y termine limpia. Progreso animado con `lerp` hacia 1.
6. **Dependencias.** R3F + drei (`useFBO`, `shaderMaterial`); Lygia (funciones de ruido) opcional.
7. **Procedimiento (adaptación).** Renderizar a los dos targets **solo durante la transición** (fuera de ella, renderizar la escena directamente); animar `uProgression` con GSAP (`duration`, `ease`) en vez de `lerp` por frame; empaquetar los GLSL de Lygia localmente; redimensionar los FBO en resize y limitar su resolución en móvil.
8. **Parámetros.** Tipo de patrón (`uTransition` 0–6), repeticiones (`uRepeat`), suavidad del borde (`uSmoothness` 0,5), velocidad.
9. **Código.** Sin fragmento (sin licencia). La fórmula de remapeo + smoothstep de §5 es matemática general.
10. **Problemas detectados.** Doble render permanente; dependencia de red de `resolveLygia` (verificar); chunk `encodings_fragment` renombrado en three posteriores (verificar); modelo de 21,5 MB; importaciones de rutas internas de three.
11. **Rendimiento / a11y.** Coste ×2 durante la transición; reduced motion → fundido corto o corte.
12. **Compatibilidad.** WebGL 2.
13. **Aplicaciones.** Configurador (cambio de acabado de cocina, color de coche), cambio día/noche en una landing inmobiliaria.
14. **Pruebas.** FPS durante y fuera de la transición, cambios rápidos encadenados, resize, `renderer.info` (texturas de FBO liberadas, TJ-001).
15. **Estado de evidencia.** Código leído. No ejecutado.
