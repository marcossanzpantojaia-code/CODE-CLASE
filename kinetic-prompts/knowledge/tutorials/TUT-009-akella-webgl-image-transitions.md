---
id: TUT-009
titulo: Creative WebGL Image Transitions (Codrops, 2019)
creador: Yuri Artiukh (akella)
identidad_verificada: SI (ver TUT-008)
repo: https://github.com/akella/webGLImageTransitions
commit: 498d8fb (2019-11-05)
licencia: licencia propia de Codrops en el README — uso libre en proyectos personales y comerciales; prohibido redistribuir o vender el recurso "tal cual" o como plugin → no copiar a la biblioteca
video_url: no enlazado
narrado: n/a
transcript_status: n/a (el texto del artículo está incluido en el repo como article.html)
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO + DEMO_INSPECCIONADA (lote 5)
ultima_revision: 2026-10-26
---

# TUT-009 · akella — Transiciones de imagen con shaders

1. **Identidad.** Misma cuenta que TUT-008; el README enlaza el artículo de Codrops (?p=44490) y la demo en tympanus.net.
2. **Qué construye.** Un "slider" a pantalla completa con 8 demos de transición entre imágenes (barridos con ruido, estiramientos, desplazamientos). Un clic lanza la transición a la siguiente imagen.
3. **Stack.** three.js r109 empaquetado en `js/three.js`; **GSAP 2.1.3** (`TimelineMax`, `Power2`) en `js/gsap.js`; dat.gui.
4. **Archivos leídos.** `js/sketch.js` (204 líneas, clase común), `js/demo1.js` (shader con ruido Perlin 4D), `article.html` (texto del tutorial, leído como fuente primaria del autor).
5. **Técnicas extraídas.** → [GL-002](../transitions/GL-002-transicion-imagen-shader.md): plano que llena la pantalla calculando el FOV; dos texturas + uniform `progress` 0→1 animado con GSAP; al terminar se intercambian texturas y se reinicia `progress`; la "creatividad" está en cómo se deforman las UV (fract para repetir, resta para estirar, máscaras con smoothstep + ruido). Material para el **tema 8/9** (transformaciones y revelados).
6. **Fallos y límites.** Bandera `isRunning` sin cola de clics; carga de todas las texturas antes de mostrar nada; `console.log` en producción; el contenedor es un `div` clicable sin teclado; `devicePixelRatio` sin límite (costoso en móviles 3x).
7. **APIs obsoletas.** GSAP 2 → en GSAP 3: `gsap.timeline()`, `ease: "power2.out"`, duración dentro de `vars`. three r109 → `PlaneGeometry`, `outputColorSpace`, uniforms sin `type`.
8. **Huecos visuales.** Aspecto de cada una de las 8 demos: inspección de la demo publicada o capturas.
9. **Valor por perfil.** B: alto (sliders de producto, transiciones de galería). A: medio con moderación.
10. **Evidencia.** Lectura de código y del texto del artículo incluido en el repo; demo 1 (de 8) inspeccionada en el lote 5.


**Lote 5:** demo pública del autor inspeccionada en el navegador integrado (`DEMO_INSPECCIONADA`); mediciones y capturas en GL-002 y evidence/visual/2026-10-26. El vídeo sigue sin verse.
