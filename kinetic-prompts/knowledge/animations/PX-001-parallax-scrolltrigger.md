---
id: PX-001
titulo: Parallax de columnas con ScrollTrigger y scrub
categoria: animations
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (JSM GTA VI, Jason.jsx) + DOCUMENTACION_OFICIAL_ANALIZADA (ScrollTrigger)
versiones: gsap ^3.13.0 (repo); docs 3.15
perfil: ambos (sutil en comercial)
ultima_revision: 2026-10-26
---

# PX-001 · Parallax con ScrollTrigger

1. **Finalidad.** Profundidad por diferencia de velocidad entre texto y una columna de imágenes (tema 6).
2. **Fuente.** `adrianhajdin/jsm_gta_vi_landing`, `src/sections/Jason.jsx`. Contraste: ScrollTrigger docs (scrub).
3. **Ubicación.** Jason.jsx (50 líneas).
4. **Resultado.** La columna de imágenes sube más rápido que el texto mientras la sección cruza el viewport, y el vídeo anterior se desvanece al entrar.
5. **Explicación técnica (observada).** Dos ScrollTriggers independientes sobre la misma sección: uno funde el vídeo previo (`start: "top 90%"`, `end: "10% center"`, `scrub: 2`) y otro desplaza la columna (`y: -300`, `start: "top center"`, `end: "80% center"`, `scrub: 2`). La sección se solapa con la anterior con `marginTop: -80vh`.
6. **Dependencias.** gsap + ScrollTrigger.
7. **Procedimiento (adaptación).** Capas con desplazamientos distintos (`yPercent` mejor que píxeles fijos para responsive), cada una con `scrub` y el mismo trigger.
8. **Parámetros.** Distancia (`y`), ventana start/end, `scrub` (2 en la fuente).
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   gsap.utils.toArray("[data-speed]").forEach(el => {
     gsap.to(el, { yPercent: -20 * Number(el.dataset.speed), ease: "none",
       scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
   });
   ```
10. **Problemas detectados.** En la fuente, un `gsap.to()` independiente recibe `'<'` como tercer argumento: el position parameter solo tiene efecto en timelines (código sin efecto, análisis propio). `y: -300` en píxeles no escala con el viewport. Imágenes sin `alt`.
11. **Rendimiento / a11y.** Transformaciones = composición barata. Desactivar con reduced motion.
12. **Compatibilidad.** General.
13. **Aplicaciones.** Clínicas, barberías y despachos con parallax muy sutil en imágenes de ambiente; webs de marca con capas múltiples.
14. **Pruebas.** Sin solapamientos al redimensionar; scroll rápido; reduced motion.
15. **Evidencia.** Código leído; no ejecutado.
