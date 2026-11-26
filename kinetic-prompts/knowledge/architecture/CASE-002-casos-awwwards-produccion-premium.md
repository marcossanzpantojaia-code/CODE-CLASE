---
id: CASE-002
titulo: Cómo producen los estudios premium — dos casos de Awwwards (Immersive Garden para GQ × Audemars Piguet; Exo Ape para Fluid Glass)
categoria: architecture
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (casos publicados en awwwards.com, 03-06-2026 y 06-05-2026)
versiones: —
perfil: ambos
ultima_revision: 2026-10-27
---

# CASE-002 · Producción premium (casos Awwwards)

1. **Finalidad.** Aprender decisiones de **proceso** de estudios con premios: cómo organizan la experiencia, qué priorizan y qué no publican. Complementa CASE-001 (estructura de código).
2. **Fuentes.** https://www.awwwards.com/gq-audemars-piguet-the-extraordinary-lab.html ; https://www.awwwards.com/fluid-glass-case-study.html . Awwwards Academy (cursos, "Creative Pass") es de pago → INACCESIBLE_POR_COSTE.
3. **Caso A — Immersive Garden, "The Extraordinary Lab" (perfil B) [artículo].**
   - Equipo ~10 personas (dirección creativa, interacción, WebGL, dirección técnica, 3D, render, shaders, motion, sonido); ~3,5 meses.
   - Stack: HTML/CSS/JS, WebGL, Three.js, Theatre.js, GSAP; Blender con PBR e iluminación HDR. Sin WebGPU.
   - Técnicas: shaders propios con flujos de motor de videojuego, reflejos de *billboard* y planares, *parallax mapping*, optimización de luz en tiempo real; combinar técnicas existentes antes que inventar.
   - **Una sola timeline continua** controla cámara, escena, diálogos, interfaz, ambiente, estados de interacción y audio; el usuario la recorre adelante/atrás con scroll o arrastre (GL-006).
   - Coreografía ajustada en vivo con Theatre.js sobre la escena renderizada.
   - **Audio como capa de navegación:** al hacer scrub rápido no se acelera; se gestionan fundidos, pausas y sincronía según el comportamiento.
   - Objetivo **60 fps** también en clase iPhone 11/12; las limitaciones móviles se fijaron **desde el inicio** y afectaron a casi todo.
   - Lecciones: la herramienta en vivo acorta iteraciones; el pulido invisible (sincronía, continuidad) es lo que más pesa; coherencia antes que espectáculo; la IA generativa no alcanzó la fidelidad de marca en este proyecto.
   - **No publican:** presupuestos numéricos (draw calls, memoria, peso), formatos de compresión, modo de respaldo ni accesibilidad.
4. **Caso B — Exo Ape, Fluid Glass (perfil A/B, B2B) [artículo].**
   - Nuxt.js + Storyblok (CMS headless) + Vercel; **base de datos de productos** mantenible por el cliente y enlazada a los proyectos donde se usan.
   - "Isla" de navegación central que cambia según la sección; formulario "Pedir presupuesto" que envía los detalles del proyecto al equipo.
   - Movimiento: ScrollTrigger, pequeñas animaciones SVG; **estudios de movimiento** previos (transiciones, menú, botones, hovers) comparando timing y easing → un lenguaje de interacción consistente; cargador que anima el logo y entrega a la home; casos encadenados; menú expandido al final de cada página.
   - Estética contenida: espacio, tipografía y foto/vídeo del producto (sin efectos de vidrio en WebGL pese al nombre).
   - No publican métricas ni respaldos.
5. **Aprendizajes para la biblioteca [síntesis].**
   - Decidir el **dispositivo objetivo y los fps** antes del diseño (WGPU-001).
   - Prototipar el movimiento por componentes y fijar tokens de duración/easing (UX-001, DS-001).
   - En B2B/comercial, el CMS y la estructura de datos del cliente son parte del diseño (ASTRO-002, HERO-001).
   - Los casos de estudio no documentan accesibilidad ni respaldos: la biblioteca los exige igualmente (A11Y-001, A11Y-005).
6–14. **Aplicaciones / pruebas.** Usar como lista de preguntas en el encargo (CLIENT-001): ¿dispositivo objetivo?, ¿quién mantiene el contenido?, ¿qué datos alimentan la web?, ¿hay audio?
15. **Estado.** Artículos leídos; webs no abiertas (panel oculto).
