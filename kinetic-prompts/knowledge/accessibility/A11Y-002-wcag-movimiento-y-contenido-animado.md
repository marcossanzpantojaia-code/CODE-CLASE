---
id: A11Y-002
titulo: Criterios WCAG 2.2 que afectan al movimiento (2.2.2, 2.3.1, 2.3.3) y cómo cumplirlos
categoria: accessibility
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (w3.org/WAI Understanding WCAG 2.2: Animation from Interactions; Pause, Stop, Hide)
versiones: WCAG 2.2
perfil: ambos
ultima_revision: 2026-10-26
---

# A11Y-002 · WCAG y movimiento

1. **Finalidad.** Base normativa que completa A11Y-001 (técnica de reduced motion) con los criterios exigibles.
2. **Fuente.** w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html y /pause-stop-hide.html.
3. **Criterios.**
   - **2.2.2 Pause, Stop, Hide (nivel A, obligatorio en la práctica):** todo contenido que se mueve, parpadea o desplaza **automáticamente**, dura **> 5 s** y se muestra junto a otro contenido necesita un mecanismo para pausar, detener u ocultar. Contenido que se actualiza solo (tickers): mecanismo sin margen de 5 s. Pausar solo mientras hay hover/foco **no** cuenta. Recomendado: un único control para toda la página. Excepciones: movimiento esencial, animación de carga que es lo único en pantalla.
   - **2.3.1 Tres destellos (nivel A):** nada que destelle más de 3 veces por segundo por encima del umbral; ni siquiera brevemente.
   - **2.3.3 Animation from Interactions (nivel AAA):** el usuario debe poder desactivar el movimiento no esencial **provocado por su interacción** (incluido el scroll). El movimiento del propio scroll es esencial; el movimiento decorativo añadido al scroll (parallax) no. Color y opacidad no cuentan como "motion animation"; el desenfoque sí (erratum). Técnicas suficientes: C39 (CSS `prefers-reduced-motion`), SCR40 (lo mismo en JS), o preferencia propia del sitio.
4. **Aplicación a la biblioteca (análisis propio).**
   - Marquesinas infinitas (TUT-003), carruseles automáticos, vídeos en bucle de fondo y heros 3D que giran solos → **2.2.2**: botón de pausa visible si duran > 5 s.
   - Parallax (PX-001, ZOOM-001), skew (VEL-001), cámaras (CAM-001/002), pins con movimiento → **2.3.3**: desactivar con reduced motion; aceptable sustituir por **fundidos de opacidad** (no cuentan como motion).
   - Transiciones de shader con ruido/barridos rápidos (GL-002, SCN-001) → vigilar **2.3.1** (destellos y contrastes rápidos).
5. **Explicación.** Riesgos vestibulares (mareo, náusea), distracción y crisis fotosensibles.
6. **Dependencias.** Ninguna.
7. **Procedimiento.** (1) Inventariar movimiento automático vs provocado; (2) control global de pausa/animaciones (también recomendado por GSAP, A11Y-001); (3) `gsap.matchMedia`/`@media (prefers-reduced-motion)`; (4) revisar destellos.
8. **Parámetros.** 5 s, 3 destellos/s.
9. **Código.** Ver A11Y-001.
10. **Problemas habituales.** Pausa que solo actúa al hover; control de pausa que atrapa el foco; ignorar el movimiento del scroll decorativo.
11. **Rendimiento.** Menos movimiento = menos trabajo de render.
12. **Compatibilidad.** `prefers-reduced-motion` en todos los navegadores actuales.
13. **Aplicaciones.** Obligatorio en webs de administraciones y recomendable en todas (perfil A).
14. **Pruebas.** Emulación reduced motion; temporizar contenido automático; control de pausa con teclado; revisión de destellos.
15. **Estado de evidencia.** Docs W3C leídas (resumen de la herramienta). Asignación del §4 = análisis propio.
