---
id: ST-003
titulo: Scroll horizontal controlado por scroll vertical (containerAnimation)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA
versiones: containerAnimation desde GSAP 3.8; docs 3.15
perfil: cinematografico (puntual en comercial)
ultima_revision: 2026-10-26
---

# ST-003 · Scroll horizontal

1. **Finalidad.** Desplazar paneles en horizontal con el scroll vertical y disparar animaciones cuando cada panel entra lateralmente.
2. **Fuente.** https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — `containerAnimation` y sus caveats. Demo CodePen oficial y notas de la 3.8 (https://gsap.com/blog/3-8/#containeranimation) pendientes de inspección.
3. **Ubicación.** Config Object → containerAnimation.
4. **Resultado.** Galería o línea temporal lateral con la sección fijada.
5. **Explicación técnica.** El movimiento horizontal no es scroll nativo, así que un ScrollTrigger normal no detecta la entrada lateral. Se pasa el tween horizontal como `containerAnimation` a los triggers internos.
6. **Dependencias.** gsap + ScrollTrigger.
7. **Procedimiento.** (a) Sección con pin; (b) tween del carril con `x` negativo y `ease: "none"`; (c) triggers internos con `containerAnimation`.
8. **Parámetros.** Distancia calculada con `scrollWidth`; `invalidateOnRefresh: true` para recalcular al redimensionar.
9. **Código (adaptación propuesta, no ejecutada):**
   ```js
   const track = document.querySelector(".track");
   const dist = () => track.scrollWidth - window.innerWidth;
   const move = gsap.to(track, {
     x: () => -dist(), ease: "none",
     scrollTrigger: { trigger: ".h-section", pin: true, scrub: 1,
       end: () => "+=" + dist(), invalidateOnRefresh: true }
   });
   gsap.from(".panel--3 h2", { autoAlpha: 0, y: 40,
     scrollTrigger: { trigger: ".panel--3", containerAnimation: move, start: "left 70%" } });
   ```
10. **Problemas.** El tween del contenedor **debe** ser lineal. Los triggers con containerAnimation **no admiten pin ni snap**. No animar horizontalmente el propio trigger.
11. **Rendimiento / a11y.** Contenido alcanzable con teclado y lectores; en móvil valorar carrusel nativo con `scroll-snap`.
12. **Compatibilidad.** Probar trackpads y móviles.
13. **Aplicaciones.** Portfolios, líneas de tiempo, catálogos.
14. **Pruebas.** Resize en mitad del recorrido; Tab por los paneles; reduced motion → layout vertical.
15. **Evidencia.** Documentación oficial. Código no ejecutado.
