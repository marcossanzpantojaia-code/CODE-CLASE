---
id: TXT-006
titulo: Tipografía con estelas "fantasma" ligadas al scroll, dibujada en Canvas 2D (A Drift)
categoria: animations
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Codrops, Robert Aperios, 13-10-2026)
versiones: Canvas 2D + GSAP (tweens) + Three.js (solo planos de imagen/vídeo)
perfil: cinematografico
ultima_revision: 2026-10-26
---

# TXT-006 · Scroll-driven ghost trails

1. **Finalidad.** Titulares en los que cada letra sólida arrastra varias copias en contorno que se desvanecen, ondulan y crecen con el scroll (temas 2 y 6).
2. **Fuente.** https://tympanus.net/codrops/2026/10/13/scroll-driven-ghost-trails/ ; demo tympanus.net/Demos/ADrift/ (no abierta); código github.com/zen-aperios/a-drift (no clonado; el artículo no indica licencia).
3. **Decisiones clave [artículo].**
   - **Sin historial de frames:** las copias no son capturas de fotogramas anteriores; se dibujan en **posiciones calculadas** a partir de glifos cacheados (imágenes de cada letra) y deformados con la misma fórmula de onda que la letra sólida.
   - **Reparto de motores:** Canvas 2D para toda la tipografía (caché de glifos, onda por franjas horizontales, contornos); Three.js solo para planos de imagen/vídeo con un shader de revelado por ruido.
   - **Decaimiento:** 5 contornos en el héroe; opacidad = `(1 − edad/5)^1.35` [fórmula del artículo]; cuando la fase cíclica se reinicia, la copia más vieja es casi transparente → el salto no se ve.
   - **Scroll sin ScrollTrigger:** la posición del documento se mapea a su propio estado de maquetación; el número de copias de las estelas largas depende de la posición (al volver atrás disminuyen). La salida del héroe sí usa tweens GSAP de ~2,1–2,15 s con `power2.out`/`power4.out`.
4. **Parámetros [artículo].** `heroWarpSpeed` 0,0012; amplitud/frecuencia/fase de la onda; grosor de línea y tamaño de fuente de los contornos; `maxTrail` (presupuesto total de copias); `rowGapVh`; límite de **40 fps** del planificador; DPR de los lienzos de glifos limitado a **1,25**.
5. **Rendimiento [artículo].** Cachés reconstruidas solo al cambiar el layout; copias indexadas por posición vertical y filtradas a un viewport con margen; secciones fuera de pantalla no se dibujan; pestaña oculta no renderiza; maquetación propia para móvil (no escalar la de escritorio). Aun así cada copia se dibuja en muchas franjas → coste que crece rápido.
6. **Problemas [artículo].** Costuras entre franjas (solapar 2 px); en React el montaje doble de desarrollo exige retirar el callback del ticker al desmontar; volver atrás antes de terminar un revelado obliga a parar el tween activo; Firefox usa un respaldo DOM en lugar de WebGL. **No trata reduced motion.**
7. **Procedimiento profesional (adaptación).**
   1. Texto real en HTML (`h1`/`h2`) y el canvas como capa `aria-hidden`.
   2. Reduced motion: 0 copias, sin onda.
   3. Presupuesto: `maxTrail` según `navigator.hardwareConcurrency`/ancho y límite de fps como en la fuente.
   4. Medir con DevTools Performance antes de añadir más copias.
8–9. **Código.** No incluido (licencia no indicada).
10–13. **Aplicaciones.** Portfolio editorial, web de estudio creativo, campaña.
14. **Pruebas.** FPS en móvil medio; scroll rápido y atrás; cambio de tamaño (reconstrucción de caché); lector de pantalla (lee el HTML, no el canvas).
15. **Estado.** Solo artículo leído; código y demo pendientes.
