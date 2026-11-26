---
id: GL-002
titulo: Transiciones entre imágenes con shader (dos texturas + progress)
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-009; licencia Codrops: no redistribuir tal cual) + DEMO_INSPECCIONADA **solo demo 1 de 8** (lote 5)
versiones: fuente — three r109, GSAP 2.1.3; equivalencias GSAP 3 / three actual indicadas
perfil: cinematografico
ultima_revision: 2026-10-26
---

# GL-002 · Transición de imagen en GLSL

1. **Nombre y finalidad.** Pasar de una imagen a otra con barridos, estiramientos o disoluciones con ruido, imposibles en CSS (temas 8 y 9).
2. **Fuente.** akella/webGLImageTransitions (`js/sketch.js`, `js/demo1.js`, `article.html`) — TUT-009.
3. **Ubicación.** `next()` en sketch.js; `main()` del fragment shader de cada demo.
4. **Resultado.** 8 transiciones distintas sobre un slider a pantalla completa.
5. **Explicación técnica (observada).** Uniforms `texture1`, `texture2` y `progress`. GSAP anima `progress` de 0 a 1; al completar se copia la textura 2 en la 1 y `progress` vuelve a 0. El shader mezcla ambas con `mix(color1, color2, máscara)`; la máscara se construye con `smoothstep` sobre `vUv.x` desplazado por `progress`, más ruido Perlin para el borde. El artículo explica la gramática base: multiplicar UV = escalar/repetir (con `fract`), sumar = desplazar, restar en un eje × progress = estirar.
6. **Dependencias.** three, gsap.
7. **Procedimiento (adaptación).** `gsap.to(uniforms.progress, { value: 1, duration, ease: "power2.out", onComplete })`; cola o bloqueo de clics; precargar solo la siguiente textura; reutilizar el "cover" de GL-001.
8. **Parámetros.** Duración (1–1,5 s), ease, escala del ruido (`scaleX/scaleY` 40), anchura del borde (`width` 0,5).
9. **Código (adaptación propuesta; no ejecutada; GSAP 3):**
   ```js
   gsap.to(mat.uniforms.progress, { value: 1, duration: 1.5, ease: "power2.out",
     onComplete: () => { mat.uniforms.texture1.value = next; mat.uniforms.progress.value = 0; } });
   ```
10. **Problemas habituales.** API GSAP 2 (`TimelineMax`, `Power2.easeOut`) en la fuente; `devicePixelRatio` sin límite; slider sin controles accesibles.
11. **Rendimiento / a11y.** Shader de pantalla completa con ruido 4D: coste por píxel notable en móviles; reduced motion → fundido simple o corte; botones reales "anterior/siguiente".
12. **Compatibilidad.** WebGL 1/2.
13. **Aplicaciones.** Slider de hero, galería de producto, transición entre proyectos.
14. **Pruebas.** Clics rápidos, FPS en móvil, carga de texturas lentas, teclado.
15. **Estado de evidencia.** Código y texto del artículo (incluido en el repo) leídos. No ejecutado.


## Inspección visual REAL (lote 5, 2026-10-26) — `DEMO_INSPECCIONADA`
Navegador integrado de Cowork; viewport 747×894, DPR 1,5, 60 fps. Evidencia: [evidence/visual/2026-10-26](../evidence/visual/2026-10-26/README.md). **No es el vídeo del tutorial.**

- **Demo:** https://tympanus.net/Development/webGLImageTransitions/ (demo 1). El panel dat.gui de la demo muestra **width 0,5, scaleX 40, scaleY 40** = valores de `demo1.js`.
- **Estados observados:** inicio — foto 1 a pantalla completa (`GL-002_demo1_inicio.jpg`); intermedio — la foto 2 entra **desde la derecha** con un borde orgánico de ruido que avanza hacia la izquierda (`GL-002_demo1_intermedio.jpg`); final — foto 2 completa (`GL-002_demo1_final.jpg`).
- **Curva medida** (uniform `progress` por frame tras `sketch.next()`): 150 ms → 0,269; 300 → 0,487; 450 → 0,656; 600 → 0,783; 900 → 0,936; 1 500 → 1, y vuelve a 0 al intercambiar texturas. **Coincide con 1 − (1 − t)³** (p. ej. t = 0,1 → 0,271): el `Power2.easeOut` de GSAP 2 es una cúbica, igual que `power2.out` en GSAP 3 (UX-001). Duración 1,5 s; `pixelRatio` 1,5.


### Trazabilidad v0.6.1 (corrección tras auditoría)
Etiquetas: **[OBS]** visto en captura · **[MED]** medido en el DOM con datos guardados · **[CALC]** calculado a partir del código o de los datos · **[EST]** estimación (latencia de herramienta, ojo humano) · **[COD]** leído en el código.
- **Inspeccionada solo la demo 1** (barrido horizontal con borde de ruido Perlin). Las demos 2–8 **no se han visto**; sus descripciones siguen siendo [COD].
- [OBS] 3 capturas (inicio/intermedio/final); [MED] curva de `progress` ([GL-002_demo1_progress.json](../evidence/visual/2026-10-26/data/GL-002_demo1_progress.json)), obtenida llamando a `sketch.next()` desde la consola (no con un clic: el clic real produjo la captura intermedia, cuyo instante exacto **no se conoce [EST]**); [CALC] ajuste a 1 − (1 − t)³.
- La afirmación "entra desde la derecha" es **[OBS]** en la captura intermedia; la explicación por la máscara `vUv.x + progress` es **[COD]**.
