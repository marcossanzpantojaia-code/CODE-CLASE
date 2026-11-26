---
id: TUT-015
titulo: How to Create Scene Transitions with React Three Fiber (partes 1 y 2)
creador: Wawa Sensei
identidad_verificada: SI
repo: https://github.com/wass08/r3f-scene-transition-starter (enlazado por wawasensei.dev) y https://github.com/wass08/r3f-scene-transition-final (localizado por nombre; su README enlaza el vídeo de la parte 2 que también enlaza wawasensei.dev → procedencia confirmada)
commit: starter b789939 (2023-12-01) · final d3b0f57 (2023-12-08)
licencia: ninguna declarada → no reproducir código
video_url: parte 1 https://www.youtube.com/watch?v=DiKV1qkVZmw · parte 2 https://youtu.be/aFkU3AcwyKE (NO vistos)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-015 · Wawa Sensei — Transiciones entre escenas 3D con render targets

1. **Identidad.** Ver campo `repo`.
2. **Qué construye.** Una cocina 3D con 3 "modos" (materiales y grupos de objetos distintos). Al cambiar de modo, la escena antigua y la nueva se mezclan con un barrido o un patrón de ruido.
3. **Stack.** three 0.153.0, R3F 8.13.3, drei 9.75.0 (`useFBO`, `shaderMaterial`, `CameraControls`), leva (panel de depuración), jotai, **resolve-lygia ^1.0.4** (final).
4. **Archivos leídos.** `Experience.jsx` y `TransitionMaterial.jsx` de starter y final (diff del shader). Modelo `modern_kitchen.glb` **21,5 MB**.
5. **Técnicas extraídas.** → [SCN-001](../transitions/SCN-001-transicion-escenas-render-targets.md). Observado: dos `useFBO` (render targets); en cada frame se renderiza la escena con el modo anterior al primero y con el modo nuevo al segundo, se vuelve al lienzo y un plano a pantalla completa con un shader mezcla ambas texturas según `uProgression` (0→1 por `lerp` hacia un objetivo, velocidad configurable). En la versión final la máscara `pct` puede ser barrido horizontal/vertical repetido (`mod(uv × uRepeat)`), ruido fbm, Perlin, Worley o curl (funciones de **Lygia**), con borde suave: progreso remapeado a `[−s/2, 1+s/2]` y `smoothstep` de anchura `s` (`uSmoothness` 0,5).
6. **Fallos y riesgos.**
   - **Coste:** la escena completa se renderiza 2 veces por frame **siempre**, incluso sin transición en curso.
   - `resolveLygia` resuelve los `#include` de Lygia en tiempo de ejecución; según su documentación lo hace descargando de lygia.xyz (**verificar**): dependencia de red en producción → incluir los GLSL localmente.
   - `#include <encodings_fragment>`: chunk renombrado en versiones posteriores de three (→ `colorspace_fragment`; verificar revisión exacta en el Migration Guide).
   - Importa `DEG2RAD` desde `three/src/...` (ruta interna).
   - Modelo de 21,5 MB sin compresión.
7. **Huecos visuales.** Aspecto de cada patrón de transición: vídeo/demo.
8. **Valor.** B: alto (configuradores con cambio de ambiente, tema 12/13). A: bajo.
9. **Relación.** Generaliza GL-002 (transición de imágenes) a escenas 3D completas.
10. **Evidencia.** Código leído. No ejecutado. Vídeos no vistos.
