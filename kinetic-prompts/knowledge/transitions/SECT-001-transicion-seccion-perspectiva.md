---
id: SECT-001
titulo: Transición entre secciones con escala y rotación ligadas al scroll (perspective section transition)
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (repo olivierlarose/perspective-section-transition, commit f0b6aaa) + ARTICULO_AUTOR_ANALIZADO (2024-05-13)
versiones: Next 14.2.3, framer-motion ^11.1.9, lenis ^1.0.45
perfil: ambos
ultima_revision: 2026-10-26
---

# SECT-001 · Perspective section transition

1. **Finalidad.** La sección actual se aleja (encoge y gira) mientras la siguiente sube por encima y se endereza (temas 5, 8).
2. **Fuente.** blog.olivierlarose.com/tutorials/perspective-section-transition (sin vídeo enlazado); repo del autor. Demo no inspeccionada.
3. **Ubicación.** `src/app/page.js` (componentes `Section1`, `Section2`).
4. **Resultado [COD].** Contenedor de 200vh; sección 1 sticky de 100vh: escala 1 → 0,8 y rotación 0° → −5° a lo largo del recorrido; sección 2 (100vh): escala 0,8 → 1 y rotación 5° → 0°.
5. **Explicación [COD].** `useScroll` del contenedor con offsets `start start` → `end end`; `useTransform` lineal. No hay `perspective` CSS: el "3D" es solo escala + rotación en 2D (lo dice también el artículo).
6. **Dependencias.** framer-motion (fuente); equivalente con GSAP ScrollTrigger + scrub o CSS-001 (`animation-timeline: view()`).
7. **Procedimiento para Claude Code.** Timeline con `scrub` sobre el contenedor, dos tweens en posición 0 (`ease: "none"`); `transform-origin` centrado; fondos opacos en ambas secciones; reduced motion: sin rotación (solo corte o fundido).
8. **Parámetros.** Escala mínima 0,8, rotación ±5°, recorrido 100vh.
9. **Código (adaptación propuesta; no ejecutada):** `tl.to(".s1", { scale: 0.8, rotation: -5, ease: "none" }, 0).fromTo(".s2", { scale: 0.8, rotation: 5 }, { scale: 1, rotation: 0, ease: "none" }, 0)`.
10. **Limitaciones.** `alt="img"`; tipografía en vw; rotación con texto encima puede verse borrosa durante el movimiento.
11. **Rendimiento / a11y.** Solo transform. Rotaciones = movimiento "no esencial" → desactivar con reduced motion (A11Y-002).
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** Paso de la portada a la sección de servicios; cambio de capítulo en una landing.
14. **Pruebas.** Scroll adelante/atrás, 3 anchos, reduced motion.
15. **Estado de evidencia.** Código y artículo leídos; demo no vista.
