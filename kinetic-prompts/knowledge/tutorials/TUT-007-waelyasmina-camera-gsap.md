---
id: TUT-007
titulo: Animating Camera Transitions in Three.js Using GSAP + How to Create an Immersive Experience with Three.js and GSAP
creador: Wael Yasmina
identidad_verificada: SI
repo: https://github.com/WaelYasmina/ThreeBoilerplate (boilerplate común de sus tutoriales)
commit: ff5ae91 (2025-05-06)
licencia: boilerplate — campo "license": "ISC" en package.json (sin archivo LICENSE); artículos — "© 2025 Wael Yasmina", sin licencia → solo paráfrasis
video_url: https://youtu.be/O2ouLOL6C4c (cámara) y https://youtu.be/U-ZiSLwicK8 (immersive), enlazados desde sus artículos; NO vistos
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO (artículo en texto + 6 CodePen + demos en Netlify)
evidencia: ARTICULO_AUTOR_ANALIZADO (artículos del autor) + CODIGO_INSPECCIONADO (boilerplate)
ultima_revision: 2026-10-26
---

# TUT-007 · Wael Yasmina — Cámara de Three.js animada con GSAP

1. **Identidad.** El perfil GitHub `WaelYasmina` enlaza waelyasmina.net, YouTube `@WaelYasmina`, CodePen y CodeSandbox; waelyasmina.net enlaza el mismo canal. Los artículos enlazan el boilerplate de esta cuenta.
2. **Qué construye.**
   - *Artículo de cámara (10 may 2025):* mover la cámara entre puntos con tweens sobre `camera.position`, mantener el encuadre llamando a `camera.lookAt()` en `onUpdate`, y encadenar movimientos en una timeline con `defaults` y position parameter (absoluto y relativo `'>-0.2'`). Inicio por clic con una bandera que impide relanzarlo. Demo: threejs-camera-gsap.netlify.app. 6 CodePen del autor.
   - *Artículo "immersive":* recorrido por cinco "posturas" de cámara dentro de un modelo glTF (sala de un castillo), avanzando con cada clic; posición y rotación se animan con tweens separados de duración distinta; los valores se capturaron moviendo la cámara con `FirstPersonControls` y registrándolos. Demo: immersive-ux-threejs-gsap.netlify.app. Sin scroll.
3. **Stack.** Boilerplate: three ^0.176.0, Vite ^5.3.2, `OrbitControls` desde `three/examples/jsm`. Artículos: GSAP por npm (versión no indicada), `GLTFLoader`.
4. **Archivos leídos.** Boilerplate completo (`index.html`, `main.js`, `package.json`). Artículos leídos en texto (paráfrasis).
5. **Técnicas extraídas.** → [CAM-001](../threejs/CAM-001-camara-threejs-gsap.md) (recorrido de cámara por puntos con GSAP; base para ligarlo a ScrollTrigger). Tema 11/13.
6. **Fallos y límites.**
   - Boilerplate sin `setPixelRatio` (borroso en pantallas HiDPI) y con helpers de rejilla/ejes (eliminar en producción).
   - El artículo de cámara no trata la convivencia con `OrbitControls` (si están activos, pisan la cámara; hay que desactivarlos o animar su `target`).
   - Animar rotación por separado de la posición (artículo immersive) puede producir giros por el camino largo; `lookAt` o cuaterniones (`slerp`) son más robustos.
   - Ninguno de los dos trata reduced motion ni navegación por teclado.
7. **APIs.** `three/examples/jsm/...` sigue funcionando; la ruta recomendada desde r151 es `three/addons/...` (Migration Guide de three.js).
8. **Huecos visuales.** Ritmo y easing de las demos: inspección de la demo publicada (método C) o capturas.
9. **Valor por perfil.** B: alto (tours de producto, recorridos inmersivos). A: bajo-medio.
10. **Evidencia.** Artículos y boilerplate leídos. CodePen y demos no inspeccionados. Vídeos no vistos.
