---
id: CAM-001
titulo: Recorrido de cámara en Three.js con GSAP (posición + lookAt + timeline)
categoria: threejs
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (TUT-007) + CODIGO_INSPECCIONADO (boilerplate; encuadre fitToBox en TUT-006)
versiones: boilerplate three ^0.176.0; GSAP 3 (versión no indicada en los artículos); docs vigentes 3.15
perfil: cinematografico
ultima_revision: 2026-10-27
---

# CAM-001 · Cámara animada con GSAP

1. **Nombre y finalidad.** Mover la cámara entre puntos de interés de una escena con easing y secuencia (temas 11, 13 y 14).
2. **Fuentes.** Wael Yasmina, artículos "Animating Camera Transitions in Three.js Using GSAP" (10-05-2025) y "How to Create an Immersive Experience with Three.js and GSAP" (TUT-007). Variante R3F: `CameraControls.fitToBox` en TUT-006.
3. **Ubicación.** Secciones de tween de posición, `onUpdate` + `lookAt`, y timeline con `defaults` de los artículos.
4. **Resultado.** Cámara que vuela por la escena y se mantiene apuntando al centro, por clics sucesivos.
5. **Explicación técnica.** Los tweens apuntan a `camera.position` (un `Vector3`, GSAP anima sus x/y/z). Para el encuadre, en `onUpdate` se llama a `camera.lookAt(objetivo)`. La secuencia se arma con `gsap.timeline({ defaults })` y position parameter (absoluto o relativo `'>-0.2'` para solapar). En la versión "immersive", posición y rotación se animan por separado con duraciones distintas y una máquina de estados (`switch`) decide la siguiente postura.
6. **Dependencias.** three, gsap.
7. **Procedimiento (adaptación).** Guardar las posturas como datos (posición + objetivo); animar también el **objetivo** (un `Vector3`) y llamar a `lookAt` con él; desactivar OrbitControls durante el vuelo o animar `controls.target` y llamar a `controls.update()`; para ligarlo al scroll, la misma timeline con `scrollTrigger: { scrub }` o `seek` (R3F-001).
8. **Parámetros.** Duración/ease por tramo, solapes, posturas.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   const target = new THREE.Vector3();
   const tl = gsap.timeline({ defaults: { duration: 2, ease: "power2.inOut" },
     onUpdate: () => camera.lookAt(target) });
   shots.forEach(s => tl.to(camera.position, { ...s.pos }).to(target, { ...s.look }, "<"));
   ```
10. **Problemas habituales.** OrbitControls pisando la cámara; rotaciones Euler que giran por el camino largo; relanzar la animación con clics repetidos (el artículo lo evita con una bandera); posturas medidas a ojo que no encajan en otros aspect ratios.
11. **Rendimiento / a11y.** Movimiento de cámara amplio = riesgo vestibular → reduced motion: cortes directos o fundidos. Ofrecer controles de "siguiente/anterior" accesibles.
12. **Compatibilidad.** WebGL; sin requisitos especiales.
13. **Aplicaciones.** Tour de un local, recorrido de un coche, visita virtual de clínica.
14. **Pruebas.** Clics repetidos, interrupción a mitad, resize durante el vuelo, reduced motion.
15. **Estado de evidencia.** Artículos leídos (paráfrasis) y boilerplate inspeccionado. CodePen, demos y vídeos no inspeccionados. Nada ejecutado.

## Lote 13 · Variante guiada por scroll: "plano a plano" con datos — `ARTICULO_AUTOR_ANALIZADO` + `CODIGO_INSPECCIONADO`
Fuentes: Joseph Santamaria, "How to Build Cinematic 3D Scroll Experiences with GSAP", Codrops, 19-11-2025 (https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/); repo https://github.com/JosephASG/codrops-cinematic-scroll-animations (commit 7a56d1f, 16-03-2026; el README declara MIT pero **no hay archivo LICENSE** → paráfrasis). Versiones del repo: gsap ^3.13, three ^0.180, @react-three/fiber ^9.4, drei ^10.7, React 19. Vídeos/demos no vistos.
- **Estructura [COD]:** canvas `fixed` a pantalla completa detrás; capa de textos `fixed` con `pointer-events: none`; contenedor alto (500vh / 900vh) que define la distancia de scroll; **sin pin**.
- **Plano como dato [COD]:** cada plano = `{ title, subtitle, position (zona del texto), camera {x,y,z}, target {x,y,z}, scrollProgress {start,end} (0–100), hideText? }`. Una timeline con `scrub: true` (`start: "top top"`, `end: "bottom bottom"`) y, por cada plano, `tl.to(cameraAnim, {...camera, ease: "none", duration: end−start}, start)` y lo mismo para el objetivo → la **posición en la timeline es el progreso** (0–1). En `useFrame`, la cámara copia `cameraAnim` y hace `lookAt(target)`.
- **Textos [COD]:** SplitText por caracteres con su propio ScrollTrigger (`start: "<start>% top"`, `scrub: 0.5`), entrada `x: −100 → 0`, pausa con `.to({}, {duration})` y salida a `x: 100`.
- **Otros [artículo]:** demo 1 con OGL y eases propios (`CustomEase`); ScrollSmoother `smooth: 4`; barra de progreso con `gsap.quickSetter`; `dpr` limitado a 2.
- **Análisis propio:**
  - [CALC] (suponiendo que el contenedor empieza en el scroll 0) La timeline maestra recorre `H − vh` de scroll y los textos usan `p % top` sobre la altura total `H` → desfase de `p·vh` (a mitad de recorrido, medio viewport) entre cámara y texto; usar el **mismo** sistema (posiciones en la timeline maestra o `start` calculado con `(H − vh)`).
  - Antipatrones (ST-004, ARCH-001): limpieza con `ScrollTrigger.getAll().forEach(kill)` (mata triggers ajenos), precargador con `setTimeout` de 1,5 s, sin `prefers-reduced-motion`, SplitText sin `autoSplit`/`onSplit` (TXT-001), `console.log` en producción, modelo `.glb` de 3 MB **sin Draco/Meshopt** y textura PNG (GLTF-001), render continuo aunque no haya scroll.
  - **Valor que se conserva:** la **lista de planos como datos** (posición + objetivo + tramo de scroll + texto) es la pieza reutilizable: el director ajusta números, no código; con reduced motion, cada plano se muestra como corte o fundido.
