---
id: ST-002
titulo: Pinning de secciones
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA
versiones: GSAP 3.15
perfil: ambos (con moderación en comercial)
ultima_revision: 2026-10-26
---

# ST-002 · Pinning

1. **Finalidad.** Mantener una sección fija mientras ocurren animaciones en su interior (pasos, producto que rota, comparativas).
2. **Fuente.** https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — `pin`, `pinSpacing`, `pinReparent`, `pinType`, `anticipatePin`, `pinnedContainer` y FAQ "How does pinning work under the hood?".
3. **Ubicación.** Config Object → pin*; FAQ final.
4. **Resultado.** La sección queda fija durante un tramo de scroll y después continúa sin saltos.
5. **Explicación técnica.** ScrollTrigger envuelve el elemento en un `div.pin-spacer` de tamaño fijo y, por defecto, añade padding inferior igual a la duración del pin. Mientras está activo usa `position: fixed` si el scroller es el body; en scrollers anidados usa transforms. En cada refresh retira el spacer, mide y lo vuelve a colocar.
6. **Dependencias.** gsap + ScrollTrigger.
7. **Procedimiento.** Fijar el contenedor; animar solo sus **hijos**; definir `end` relativo (`"+=150%"`) para la duración.
8. **Parámetros.** `pin`, `pinSpacing` (`false` o `"margin"`; en `display:flex` es `false` por defecto), `anticipatePin` (~1 si parpadea con scroll rápido), `pinReparent` (último recurso, caro), `pinnedContainer` (el pinning anidado no está soportado).
9. **Código (adaptación propuesta, no ejecutada):**
   ```js
   gsap.timeline({
     scrollTrigger: { trigger: ".steps", pin: true, start: "top top", end: "+=200%", scrub: 1 }
   }).to(".steps__item", { yPercent: -100, stagger: 0.5 });
   ```
10. **Problemas.** No animar el propio elemento fijado. Ancestros con `transform` o `will-change` rompen `position: fixed` (comportamiento del navegador). Triggers fuera de orden desalinean los posteriores (`ScrollTrigger.sort()` / `refreshPriority`). En React, limpieza obligatoria (GS-001).
11. **Rendimiento / a11y.** Pins largos fatigan en móvil y pueden dificultar la navegación por teclado. Ofrecer versión sin pin con reduced motion.
12. **Compatibilidad.** Probar Safari y móviles con barra de direcciones dinámica.
13. **Aplicaciones.** Servicios por pasos, producto 3D que gira, antes/después.
14. **Pruebas.** Sin solapamientos posteriores; resize durante el pin; teclado; capturas en 3 anchos.
15. **Evidencia.** Documentación oficial. Código no ejecutado.
