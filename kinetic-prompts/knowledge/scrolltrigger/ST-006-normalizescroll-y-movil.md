---
id: ST-006
titulo: ScrollTrigger en móvil — normalizeScroll() (barra de direcciones, pins que tiemblan, iOS) e ignoreMobileResize, con sus límites
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (gsap.com/docs/v3/Plugins/ScrollTrigger/static.normalizeScroll())
versiones: GSAP 3.15 (docs); la página la califica de "experimental"
perfil: cinematografico (en comerciales, normalmente no)
ultima_revision: 2026-10-27
---

# ST-006 · normalizeScroll() y móvil

1. **Nombre y finalidad.** Decidir cuándo dejar que ScrollTrigger tome el control del scroll en móviles para evitar saltos de pins y cambios de viewport. Resuelve la "ficha pendiente" de ST-001 §12.
2. **Fuente.** https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.normalizeScroll() .
3. **Ubicación.** Descripción, opciones, advertencias y `ScrollTrigger.config({ ignoreMobileResize })`.
4. **Resultado.** Scroll procesado en el hilo de JavaScript: los pins no tiemblan y el viewport no cambia de alto al mostrar/ocultar la barra (salvo en iPhone vertical reciente).
5. **Qué hace [doc].** Intercepta los eventos nativos de scroll, lee el desplazamiento y lo aplica con JS (usa un Observer interno). Problemas que ataca:
   - barra de direcciones móvil que cambia el viewport y desplaza los triggers;
   - pins que se repintan un instante fuera de sitio (el navegador desplaza en otro hilo);
   - *jitter* de Safari iOS (salta uno de cada dos `touchmove` y lleva la posición internamente);
   - rebote de *overscroll* de iOS que ignora `overscroll-behavior`;
   - inercia distinta entre Android e iOS.
   Sin argumento devuelve el Observer activo (o `null`).
6. **Dependencias.** gsap + ScrollTrigger.
7. **Procedimiento (adaptación).**
   1. Primero probar **sin** normalizar: si no hay pins ni scrub críticos, no activarlo (GreenSock no lo activa por defecto para no secuestrar el scroll).
   2. Si hay pins que tiemblan en móvil: `ScrollTrigger.normalizeScroll(true)` solo en táctil (`gsap.matchMedia()` con `(pointer: coarse)`).
   3. Si lo que molesta es el recálculo por la barra: `ScrollTrigger.config({ ignoreMobileResize: true })` (la doc avisa: las posiciones pueden quedar inexactas tras el cambio).
   4. Reduced motion: no normalizar (devolver el scroll nativo) [criterio propio, A11Y-001].
8. **Parámetros [doc].** Objeto en vez de `true` con opciones de Observer; el ejemplo usa `allowNestedScroll: true`, `lockAxis: false`, `momentum: self => Math.min(3, self.velocityY / 1000)`, `type: "touch,wheel,pointer"` (con `pointer`, la página se arrastra con el ratón). La página no describe en detalle `allowNestedScroll` ni `lockAxis`; `target` no aparece → ver docs de Observer (OBS-001).
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   gsap.matchMedia().add("(pointer: coarse) and (prefers-reduced-motion: no-preference)", () => {
     ScrollTrigger.normalizeScroll({ allowNestedScroll: true });
     return () => ScrollTrigger.normalizeScroll(false);
   });
   ```
10. **Problemas habituales [doc].** Cede el control con varios dedos o con zoom ≠ 1; no reproduce las barras de scroll nativas que solo aparecen al desplazar; "experimental"; los iPhone recientes en vertical siguen forzando la barra. Con Lenis o ScrollSmoother ya hay otra capa de scroll → no combinar sin probar (GS-002, LN-001) [criterio propio].
11. **Rendimiento / a11y.** Es una forma híbrida de *scroll-jacking*: valorar el coste para usuarios que dependen del scroll nativo (zoom, lectores, teclado). En webs comerciales, normalmente innecesario.
12. **Compatibilidad.** Pensado para iOS/Android; en escritorio no suele hacer falta.
13. **Aplicaciones.** Landings cinematográficas con pins largos y escenas 3D guiadas por scroll en móvil.
14. **Pruebas.** iPhone real (Safari) y Android: pins, barra de direcciones, rebote, zoom con dos dedos, scroll dentro de un modal (scroll anidado).
15. **Estado.** Documentación leída; no probado en dispositivos.
