---
id: HERO-001
titulo: Hero de prueba social — contador tipo tragaperras con el número del CMS + collage de caras que rota en bucle
categoria: interactions
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Codrops, Jonas Arleth, 18-08-2026; implementación en Webflow + GSAP)
versiones: Webflow Interactions (GSAP) — técnica trasladable a GSAP en código
perfil: comercial
ultima_revision: 2026-10-26
---

# HERO-001 · Testimonial hero dinámico

1. **Finalidad.** Mostrar prueba social real ("+1 240 clientes", caras de miembros/clientes) con movimiento sobrio y datos que el cliente actualiza solo desde el CMS (tema 15; perfil A).
2. **Fuente.** https://tympanus.net/codrops/2026/08/18/building-an-animated-testimonial-hero-using-the-gsap-timeline-and-dynamic-cms-data/ (demo en la página del curso Webflow de Formburg; sin repositorio ni licencia de código indicados; el script del contador viene de una herramienta gratuita del autor).
3. **Estructura [artículo].**
   - Contador "tragaperras" que gira empezando por la cifra de la derecha, con el valor leído del CMS (el autor lo actualiza mensualmente; un script lo expone globalmente).
   - Collage de 4 retratos de distintos tamaños y desplazamientos desde una lista del CMS; estilo por posición con `:first-child`, `:last-child`, `:nth-child(odd/even)`; solo una etiqueta visible por collage.
   - Máscara degradada detrás, dimensionada en `em` desde un contenedor con unidades de *container query* → todo escala junto.
   - **Dos listas superpuestas** (absolutas) para que una salga mientras la otra entra; desfase de elementos (saltar 4 y luego 8) para mostrar caras distintas en cada ciclo.
4. **Coreografía [artículo].** El contador va primero y el resto entra cuando frena; las imágenes cambian **de fuera hacia dentro** (hacia el contador); `set` instantáneo de opacidad para la lista oculta antes de animarla; bucle infinito con ~4 s de pausa entre cambios; la entrada inicial es una interacción aparte (si toda la timeline repite, repite también la entrada).
5. **Parámetros [artículo].** Rotate X −90°→0, Y 50 %→0, escala 0,7→1, opacidad 0→1, perspectiva 1000, stagger de imágenes 0,08 s, de texto 0,035 s, desplazamiento de texto 110 %, ease *Elastic Out* (amplitud/periodo ajustables).
6. **Control y accesibilidad [artículo].** Se reproduce al entrar, se pausa al salir y se reanuda al volver (no corre en segundo plano); con reduced motion el bucle pasa a "sin animación" y la entrada se reproduce una vez. **Sin botón de pausa** visible.
7. **Problemas [artículo].** Repetir toda la timeline; listas del CMS que no permiten posicionar cada elemento; etiquetas repetidas a ocultar; ambas listas visibles en el editor (poner la segunda a opacidad 0); el interlineado del contador hay que **leerlo del estilo computado**; `em` solo funciona si el contenedor fija su `font-size` desde su ancho.
8. **Procedimiento profesional (traducción a código, propia).**
   1. Número desde el CMS/servidor renderizado en HTML (legible sin JS y por buscadores); el contador anima desde 0 solo como mejora; `aria-live="off"` y el valor final en el texto accesible.
   2. Bucle de caras > 5 s → botón de pausa (WCAG 2.2.2) además de reduced motion.
   3. `IntersectionObserver` o ScrollTrigger `toggleActions: "play pause resume pause"`.
   4. Retratos con permiso y `alt` útiles ("Ana, clienta desde 2023") o `alt=""` si son decorativos y el texto ya lo dice; **nunca caras de stock presentadas como clientes reales**.
9. **Código.** No incluido (sin licencia).
10–13. **Aplicaciones.** Gimnasio, clínica ("pacientes atendidos"), academia, barbería ("cortes este año") — solo con cifras verificables.
14. **Pruebas.** Sin JS (cifra visible), reduced motion, pausa, lector (no anunciar cada cambio), CLS del contador (reservar ancho con `font-variant-numeric: tabular-nums`) [criterio propio].
15. **Estado.** Artículo leído; no implementado.
