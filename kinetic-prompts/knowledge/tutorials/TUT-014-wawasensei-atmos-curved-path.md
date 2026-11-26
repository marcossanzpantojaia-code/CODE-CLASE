---
id: TUT-014
titulo: Recreating Atmos 3D Website with React Three Fiber — Part 1 (Curved Path)
creador: Wawa Sensei
identidad_verificada: SI
repo: https://github.com/wass08/r3f-wawatmos-part-1 (starter: wass08/r3f-wawatmos-starter)
commit: 80fd8e7 (2023-03-23)
licencia: código sin licencia; modelos avión y nube "Poly by Google" CC-BY 3.0 (Poly Pizza) → atribución obligatoria
video_url: https://youtu.be/WL5zrKii5qc (README del repo; coincide con la miniatura de wawasensei.dev; NO visto)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-014 · Wawa Sensei — Cámara que recorre una curva con el scroll

1. **Identidad.** wawasensei.dev/tuto/recreating-atmos-… enlaza starter y repo; el README del repo enlaza el vídeo.
2. **Qué construye.** Un avión que vuela a lo largo de un camino curvo (línea blanca extruida) entre nubes; el scroll hace avanzar cámara y avión; el avión se inclina (alabeo) en las curvas y la cámara gira hacia el lado de la curva.
3. **Stack.** three ^0.150.1, @react-three/fiber ^8.11.5, @react-three/drei ^9.56.28 (`ScrollControls` pages 5, damping 0.3; `Float`; `PerspectiveCamera`), lamina ^1.1.23 (fondo degradado).
4. **Archivos leídos.** `src/App.jsx`, `components/Experience.jsx` (142 líneas), `Background.jsx`. Modelos: avión 0,43 MB; **nube 13,9 MB**.
5. **Técnicas extraídas.** → [CAM-002](../threejs/CAM-002-camara-sobre-curva-scroll.md). Observado: `CatmullRomCurve3` con 11 puntos (tipo "catmullrom", tensión 0,5), muestreada en 12 000 puntos; índice = `scroll.offset × nº de puntos`; la cámara (agrupada con el avión) se acerca al punto con `lerp`; el alabeo sale de la diferencia en x con el punto siguiente (× 80, limitado a π/3) y se aplica con `slerp` de cuaterniones (factor `delta × 2`).
6. **Fallos detectados.**
   - `getPoints()` muestrea por parámetro *t*, no por longitud de arco → la velocidad aparente cambia según la separación de los puntos de control. `getSpacedPoints()` o `getPointAt()` dan velocidad constante (análisis propio sobre la API de three.js; confirmar visualmente).
   - `ExtrudeGeometry` con 12 000 pasos para una cinta: geometría muy pesada para lo que muestra.
   - `Quaternion`/`Euler` nuevos en cada frame; factores `delta × 24` que superan 1 con frames lentos.
   - Modelo de nube de 13,9 MB repetido 6 veces (mismo recurso, pero descarga enorme).
   - Sin reduced motion ni alternativa sin WebGL.
7. **APIs.** lamina está archivado por pmndrs (verificar estado); alternativa: shader o textura de degradado.
8. **Huecos visuales.** Sensación del alabeo y de la velocidad: demo (CodeSandbox) o vídeo.
9. **Valor.** B: alto (storytelling de recorrido, tema 13). A: bajo.
10. **Evidencia.** Código leído. No ejecutado. Vídeo no visto.
