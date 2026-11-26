---
id: PERF-002
titulo: Optimizar INP (respuesta a la interacción) — procedimiento de web.dev aplicado a webs con animación
categoria: performance
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (web.dev "Optimize Interaction to Next Paint")
versiones: —
perfil: ambos
ultima_revision: 2026-10-27
---

# PERF-002 · INP

1. **Finalidad.** Que botones, menús y formularios respondan rápido incluso en páginas con GSAP, Lenis o WebGL (complementa PERF-001, centrado en LCP/CLS).
2. **Fuente.** https://web.dev/articles/optimize-inp .
3. **Umbrales [doc].** Bueno ≤ 200 ms; malo > 500 ms; percentil 75, por separado en móvil y escritorio.
4. **Procedimiento [doc].**
   1. **Campo primero:** datos RUM (interacción concreta, tipo y tiempo) o CrUX vía PageSpeed Insights.
   2. **Reproducir en laboratorio:** flujos reales e interactuar **durante la carga** (hilo principal más ocupado); panel Performance de DevTools.
   3. **Descomponer** cada interacción: **retraso de entrada** (tareas largas al arrancar: parseo/evaluación de scripts) → reducir trabajo inicial; **duración del procesamiento** (los *callbacks*) → hacer menos y partir en tareas; **retraso de presentación** (hasta pintar) → DOM más pequeño, `content-visibility`, menos HTML generado en cliente.
5. **Arreglos [doc].** Ceder el hilo partiendo callbacks largos (`setTimeout`); aplicar solo la actualización visual de forma síncrona y aplazar lo demás (`requestAnimationFrame` + `setTimeout`); evitar *layout thrashing* (leer layout justo después de escribir estilos); aplanar el DOM; `content-visibility` para lo que está fuera de pantalla; Web Workers.
6. **Aplicación a la biblioteca [síntesis propia].**
   - Animaciones de entrada que crean muchos nodos (SplitText en párrafos largos, partículas DOM de BTN-001) → retraso de presentación: limitar a titulares; partículas en canvas.
   - Inicialización de WebGL/GSAP en el arranque compite con el primer toque → cargar la escena tras el LCP y en `requestIdleCallback`/al entrar en pantalla (Astro `client:visible`, `dynamic(..., { ssr: false })`).
   - Lecturas de layout en `scroll`/`mousemove` (UX-004, HOV-005) → `IntersectionObserver`, valores cacheados, `quickTo`.
   - Menús/modales: abrir primero (cambio de clase/atributo) y animar después.
7–13. **Aplicaciones.** Toda web; crítico en móviles de gama media.
14. **Pruebas.** CrUX/RUM; CPU ×4 en DevTools; interactuar durante la carga; marcar las tareas largas > 50 ms [umbral general de tarea larga, conocimiento general].
15. **Estado.** Doc oficial leída; no aplicado.
