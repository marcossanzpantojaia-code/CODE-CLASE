---
id: TUT-006
titulo: Step-by-Step Guide to Mesmerizing 3D Text with React Three Fiber
creador: Wawa Sensei (Wassim Samad)
identidad_verificada: SI
repo: https://github.com/wass08/r3f-3d-text-effect (starter: wass08/r3f-vite-starter)
commit: 2103574 (2023-12-15)
licencia: código sin licencia declarada; modelo "Camping Asset Collection" de Alex Safayan bajo CC-BY 3.0 (Poly Pizza) — exige atribución
video_url: https://youtu.be/jIkn9dLBfNc (README del repo y wawasensei.dev; NO visto)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO + DEMO_INSPECCIONADA (lote 5)
ultima_revision: 2026-10-26
---

# TUT-006 · Wawa Sensei — Texto 3D con escena dentro de las letras

1. **Identidad.** wawasensei.dev/tuto/how-to-create-a-3D-text-effect-with-react-three-fiber enlaza el starter, el repo final, la demo (r3f-3d-text-effect.vercel.app) y el vídeo. El README del repo enlaza un starter `r3f-vite-final` distinto del que cita la web (discrepancia menor).
2. **Qué construye.** Titular 3D ("MY LITTLE CAMPING") cuyas letras muestran como textura una escena 3D animada (el modelo flotando). Suelo reflectante, niebla, bloom. Intro con dolly de cámara; botón "ENTER" que encuadra la cámara sobre una "tienda" con tarjetas HTML en 3D.
3. **Stack.** three 0.153.0, @react-three/fiber 8.13.3, @react-three/drei 9.75.0 (`Text`, `RenderTexture`, `CameraControls`, `Float`, `MeshReflectorMaterial`, `Environment`, `Html`), @react-three/postprocessing ^2.15.11 (Bloom), jotai 2 (estado de página), Tailwind 3.
4. **Archivos leídos.** `App.jsx`, `components/Experience.jsx`, `UI.jsx`, inicio de `Camping.jsx` (47 KB generado por gltfjsx). Fuente Poppins Black TTF 151 KB; GLB 520 KB.
5. **Técnicas extraídas.** → [TXT3D-001](../threejs/TXT3D-001-texto-3d-rendertexture.md) (texto SDF con `RenderTexture` como mapa); encuadre de cámara con `CameraControls.fitToBox` sobre cajas invisibles (complementa CAM-001). **Tema 11** (3D + texto).
6. **Fallos detectados.**
   - El fundido del texto anima `opacity` del material, pero el material **no declara `transparent`**: en three.js la opacidad no tiene efecto sin `transparent: true` (análisis estático; confirmar en demo).
   - Importa utilidades desde la ruta interna `three/src/math/MathUtils` en vez de `THREE.MathUtils` (frágil ante actualizaciones).
   - `intro()` con `setTimeout` sin limpieza; en modo estricto se ejecuta dos veces.
   - Coste GPU alto: `RenderTexture` (una escena extra por frame) + `MeshReflectorMaterial` a 2048 px con blur + bloom. Sin degradado para móvil.
   - El titular solo existe en WebGL: invisible para lectores de pantalla y buscadores. Hace falta un `h1` real en el DOM.
   - Botón dentro de capa `pointer-events: none` que solo se oculta con opacidad (sigue siendo enfocable).
7. **APIs.** Ver TUT-004 §7.
8. **Huecos visuales.** Calidad del efecto de texto y bloom: demo o capturas.
9. **Valor por perfil.** B: alto para heros de producto. A: bajo (coste y accesibilidad).
10. **Evidencia.** Lectura de código; demo pública inspeccionada en el lote 5. Vídeo no visto.


**Lote 5:** demo pública del autor inspeccionada en el navegador integrado (`DEMO_INSPECCIONADA`); mediciones y capturas en TXT3D-001 y evidence/visual/2026-10-26. El vídeo sigue sin verse.
