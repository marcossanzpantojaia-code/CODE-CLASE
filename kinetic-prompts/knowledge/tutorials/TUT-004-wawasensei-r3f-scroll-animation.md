---
id: TUT-004
titulo: React Three Fiber — Scroll Animations (oficina 3D por plantas)
creador: Wawa Sensei (Wassim Samad)
identidad_verificada: SI
repo: https://github.com/wass08/r3f-scrolling-animation-tutorial
commit: 7700018 (2023-02-03)
licencia: ninguna declarada → no reproducir código
video_url: https://youtu.be/pXpckHDDNYo (enlazado en el README del repo; NO visto)
narrado: DESCONOCIDO (canal habitualmente narrado; confirmar)
transcript_status: NO_SOLICITADA — candidato prioritario para método A
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-004 · Wawa Sensei — Scroll Animations con R3F + GSAP

1. **Identidad.** El README de perfil de `wass08` se presenta como "Wawa Sensei", enlaza youtube.com/c/WawaSensei y wawasensei.dev. La página wawasensei.dev/tuto/react-three-fiber-tutorial-scroll-animations enlaza este repo, la demo en CodeSandbox y una versión en texto en dev.to.
2. **Qué construye.** Un portfolio con un modelo 3D de una oficina de tres plantas. Al hacer scroll, el edificio baja, gira a un lado y luego al otro, y las plantas superiores (biblioteca, ático) entran deslizándose y rotando hasta encajar. A la vez, tres paneles HTML se funden según la sección.
3. **Stack.** three ^0.149.0, @react-three/fiber ^8.10.1, @react-three/drei ^9.56.11 (`ScrollControls`, `Scroll`, `useScroll`, `useGLTF`, `OrbitControls`), gsap ^3.11.4 (solo core, **sin ScrollTrigger**), Tailwind 3, Vite 4.
4. **Archivos leídos.** `src/App.jsx`, `components/Experience.jsx`, `Office.jsx`, `Overlay.jsx`, `main.jsx`. Recursos: `WawaOffice.glb` 4,6 MB y **`WawaOffice.blend` 2,5 MB dentro de `public/`** (se publicaría con la web).
5. **Técnicas extraídas.** → [R3F-001](../threejs/R3F-001-scrollcontrols-timeline-seek.md): timeline de GSAP construida una vez y "rebobinada" en cada frame al progreso de `ScrollControls` (`seek(offset × duración)`). Patrón clave del **tema 13** (escena 3D ligada al scroll).
6. **Fallos detectados.**
   - La timeline no se crea en pausa ni se destruye al desmontar: corre por su cuenta y además se fuerza con `seek` cada frame. En modo estricto se crean dos timelines; como usa tweens `from()`, la segunda puede tomar como destino valores ya alterados por la primera (riesgo a verificar en demo).
   - `Overlay`: tres `setState` por frame dentro de `useFrame` → hasta 180 renders de React por segundo. Mejor escribir la opacidad directamente en refs del DOM.
   - Atributo `class` en JSX en vez de `className`.
   - Modelo GLB de 4,6 MB sin compresión Draco/Meshopt; archivo `.blend` servido públicamente.
   - Textos de relleno humorísticos y teléfono ficticio (no apto como plantilla).
   - `OrbitControls` activo sobre un canvas que también captura el scroll: conflicto de gestos en móvil.
   - Sin reduced motion ni alternativa sin WebGL.
7. **APIs.** Versiones de 2023 (R3F 8, drei 9). R3F 9 / drei 10 requieren React 19: comprobar cambios de `ScrollControls` antes de reutilizar.
8. **Huecos visuales.** Cómo se ve el encaje de plantas y la sensación de `damping`: requiere demo o vídeo. **Buen candidato para la primera transcripción manual** (punto 1 del trabajo pendiente).
9. **Valor por perfil.** B: alto (patrón base de "escena que cuenta una historia con el scroll"). A: bajo.
10. **Evidencia.** Lectura de código. No ejecutado. Vídeo no visto.
