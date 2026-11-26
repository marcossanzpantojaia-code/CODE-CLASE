---
id: CSS-001
titulo: Animaciones ligadas al scroll solo con CSS (animation-timeline, scroll(), view(), animation-range)
categoria: css
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (MDN: CSS scroll-driven animations) + datos de compatibilidad de caniuse (fuente MDN)
versiones: especificación CSSWG "Scroll-driven Animations" (borrador)
perfil: ambos (preferente en comercial)
ultima_revision: 2026-10-26
---

# CSS-001 · Scroll-driven animations nativas

1. **Finalidad.** Revelados, barras de progreso y parallax suaves **sin JavaScript** (sin GSAP), ideales para el perfil A por peso y robustez.
2. **Fuente.** developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations; compatibilidad: caniuse.com (datos MDN, consulta 2026-10-26).
3. **API.** `animation-timeline` con `scroll()` (progreso del scroll de un contenedor o raíz) o `view()` (progreso de un elemento al cruzar el área visible); timelines con nombre (`scroll-timeline`, `view-timeline` + `-axis`, `-inset`) y `timeline-scope` para usarlas fuera del subárbol; `animation-range` (`-start`/`-end`) con nombres de rango `entry`, `exit`, `cover`, `contain` y porcentajes. En JS: `ScrollTimeline`, `ViewTimeline` con `Element.animate()`.
4. **Compatibilidad (caniuse, 2026-10-26).** Chrome/Edge ≥ 115, Firefox ≥ 159, Safari ≥ 26 (macOS e iOS); ~88 % de uso global. **Contradicción registrada:** un blog de terceros (codercops, mayo-2026) afirma Firefox 133 y Safari 18.2; se descarta por contradecir los datos de compatibilidad. Usar siempre `@supports (animation-timeline: view())`.
5. **Explicación técnica.** La animación CSS normal se define con `@keyframes`; en vez de avanzar con el tiempo, avanza con el scroll. La duración se ignora a efectos de tiempo (se recomienda `animation-duration: auto` o 1 ms según la implementación; verificar) y el easing por defecto debería ser `linear` para scrub fiel.
6. **Dependencias.** Ninguna.
7. **Procedimiento (adaptación).** Revelado de tarjeta: `@keyframes reveal { from { opacity: 0; translate: 0 2rem } to { opacity: 1; translate: 0 0 } }` + `animation: reveal linear both; animation-timeline: view(); animation-range: entry 0% cover 30%;` dentro de `@supports` y de `@media (prefers-reduced-motion: no-preference)`.
8. **Parámetros.** Rango (`entry`/`cover`…), eje, inset.
9. **Código.** Ver §7 (adaptación propia, no ejecutada).
10. **Problemas habituales.** Contenedor sin altura/overflow (no hay timeline); timeline con nombre fuera de alcance (falta `timeline-scope`); el contenido debe ser visible sin soporte (estado final como base, animación solo como mejora); inconsistencias de `animation-range` señaladas en Safari por el mismo blog (sin verificar).
11. **Rendimiento / a11y.** Corre fuera del hilo principal en muchos casos (sin JS); envolver en `prefers-reduced-motion: no-preference` (WCAG 2.3.3, A11Y-002).
12. **Compatibilidad.** Ver §4.
13. **Aplicaciones.** Revelados de secciones en webs de negocio, barra de lectura, parallax sutil.
14. **Pruebas.** Chromium, Firefox ≥ 159, WebKit; navegador sin soporte (contenido visible); reduced motion.
15. **Estado de evidencia.** MDN leído (la página de la herramienta no mostró la sintaxis completa de `animation-range`; parte del §3 se completó con conocimiento general señalado por la herramienta). No ejecutado.
