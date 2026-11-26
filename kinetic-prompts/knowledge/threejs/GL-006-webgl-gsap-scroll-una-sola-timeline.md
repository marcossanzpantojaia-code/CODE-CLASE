---
id: GL-006
titulo: Integrar WebGL con GSAP y el scroll — una sola timeline como "cabezal", uniforms animables, herramientas de coreografía (Theatre.js) y licencias
categoria: threejs
estado: INVESTIGADO
evidencia: SÍNTESIS de fichas + ARTICULO (Awwwards, caso Immersive Garden) + CODIGO_INSPECCIONADO (repo theatre-js/theatre: licencias y README)
versiones: GSAP 3.15; three.js r186; Theatre.js 0.7.0 (repo público sin cambios desde 2024-04-11)
perfil: cinematografico
ultima_revision: 2026-10-27
---

# GL-006 · WebGL + GSAP + scroll

1. **Finalidad.** Patrón de arquitectura para experiencias donde el scroll mueve cámara, escena, textos, interfaz y sonido de forma sincronizada (temas 13, 14 y 15).
2. **Fuentes.** R3F-001 (timeline + `seek`), CAM-001/002 (cámara sobre curva), SCN-002, PT-001; caso Awwwards "GQ & Audemars Piguet: The Extraordinary Lab" (Immersive Garden) — CASE-002; repo https://github.com/theatre-js/theatre (commit 6ea82b9).
3. **Patrón "cabezal único" [síntesis].**
   - **Una timeline** (GSAP o Theatre.js) con todos los cambios en tiempos absolutos; el scroll solo fija su posición: `tl.progress(scrollProgress)` o ScrollTrigger con `scrub` sobre esa timeline. Ventaja: se puede ir adelante/atrás de forma determinista (como un reproductor), que es lo que describe el caso de Immersive Garden.
   - **Uniforms como propiedades animables:** en TSL `uniform(0)` y `gsap.to(u, { value: 1 })`; en GLSL `material.uniforms.uX` (objeto con `value`) → GSAP los interpola igual que propiedades DOM.
   - **Bucle único:** el `ticker` de GSAP llama al render (o `renderer.setAnimationLoop`, nunca dos rAF) y Lenis, si existe, se actualiza desde el mismo ticker (LN-001).
   - **Suavizado en un sitio:** `scrub` numérico o `damping` (ScrollControls), no ambos.
4. **Herramienta de coreografía: Theatre.js [COD: README y licencias].** Biblioteca de animación para movimiento de alta fidelidad, usable por código y **visualmente** (editor), con extensión para R3F (`@theatre/r3f`). Licencias: `@theatre/core` **Apache-2.0**; `@theatre/studio` (el editor) **AGPL-3.0-only** → usar el editor solo en desarrollo y no publicarlo en la web del cliente. El README avisa de que el desarrollo de la 1.0 se trasladó **temporalmente a un repositorio privado**; el repositorio público no cambia desde 2024-04-11 → riesgo de mantenimiento: valorar antes de basar un proyecto en él. (El caso de Awwwards lo escribe "Theater.js".)
5. **Degradación y accesibilidad.** Escalera de WGPU-001; contenido narrativo en HTML; con reduced motion, ir al estado final de cada capítulo; audio solo tras interacción y con control de silencio.
6. **Procedimiento.**
   1. Guion en tiempos (0–1 por capítulo) antes de escribir código.
   2. Una timeline maestra; ScrollTrigger con `scrub` sobre ella; etiquetas por capítulo.
   3. Cada efecto expone uniforms; nada de lógica de animación dentro del shader salvo `time`.
   4. Respaldo por niveles y prueba de rendimiento en el móvil objetivo desde el día 1 (lección del caso).
7–13. **Aplicaciones.** Lanzamiento de producto, historia de marca, portfolio inmersivo.
14. **Pruebas.** Scroll rápido adelante/atrás (determinismo); 60 fps en el dispositivo objetivo; reduced motion; sin WebGL.
15. **Estado.** Síntesis + fuentes leídas; nada implementado.

**Lote 17 — reloj del bucle [COD, three.js `src/core/Clock.js` y `Timer.js`, commit e06d724]:** `THREE.Clock` está **obsoleto desde r183** (aviso: "Please use THREE.Timer instead"). `THREE.Timer`: llamar a `timer.update(timestamp)` **una vez por fotograma** y después `getDelta()`/`getElapsed()` (devuelven lo mismo durante todo el paso); `timer.connect(document)` usa la Page Visibility API para evitar un `delta` enorme al volver a la pestaña; `setTimescale()`, `reset()`, `dispose()`. En el bucle único de este patrón: `gsap.ticker.add((t) => { timer.update(t * 1000); uniforms.uTime.value = timer.getElapsed(); renderer.render(scene, camera); })` [adaptación; unidades del ticker de GSAP en segundos → ms, **verificar**]. Corrige el antipatrón de ARCH-001 "animaciones dependientes de la tasa de refresco".
