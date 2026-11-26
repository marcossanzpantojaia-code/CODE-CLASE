---
id: CSS-002
titulo: View Transitions API — transiciones de página y de estado nativas (SPA y MPA)
categoria: css
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (MDN View Transition API; Chrome for Developers "What's new in view transitions (2025 update)", 8-oct-2025)
versiones: CSS View Transitions Level 1 y 2 (borradores)
perfil: ambos
ultima_revision: 2026-10-26
---

# CSS-002 · View Transitions

1. **Finalidad.** Transiciones entre páginas o estados (fundidos, elementos compartidos que "viajan") sin librería, con fallback automático.
2. **Fuente.** developer.mozilla.org/en-US/docs/Web/API/View_Transition_API; developer.chrome.com/blog/view-transitions-in-2025 (Bramus, 2025-10-08).
3. **API.**
   - **Mismo documento:** `document.startViewTransition(callback)` → objeto `ViewTransition` con promesas `updateCallbackDone`, `ready`, `finished` y `skipTransition()`.
   - **Entre documentos (MPA, mismo origen):** `@view-transition { navigation: auto; }` en ambas páginas; eventos `pageswap`/`pagereveal`.
   - `view-transition-name` (instantánea propia por elemento; `match-element` para nombres automáticos en mismo documento), `view-transition-class`, tipos de transición (`:active-view-transition-type()`).
   - Pseudo-elementos: `::view-transition`, `::view-transition-group()`, `::view-transition-image-pair()`, `::view-transition-old()`, `::view-transition-new()`.
4. **Compatibilidad (según Chrome for Developers, oct-2025).** Mismo documento: Chrome/Edge 111, Safari 18, Firefox 144 → Baseline "recién disponible" desde Firefox 144 (14-oct-2025); Firefox sin tipos de transición. `match-element`: Chrome 137, Safari 18.4, Firefox 144. Grupos anidados: solo Chrome/Edge 140. Entre documentos: Chrome desde 2024 y Safari con soporte (sin versiones exactas en la fuente). React `<ViewTransition>`: en canary (2025). **Contradicción registrada:** un blog de terceros afirma Firefox 130; se descarta.
5. **Explicación.** El navegador captura una imagen del estado viejo, aplica el cambio, y anima entre la captura vieja y la nueva con animaciones CSS por defecto (fundido) que se pueden sobrescribir.
6. **Dependencias.** Ninguna.
7. **Procedimiento (adaptación).** (1) Comprobar soporte (`if (!document.startViewTransition) { update(); return; }`); (2) nombrar los elementos compartidos (miniatura → imagen de detalle) con el mismo `view-transition-name`; (3) ajustar duración/easing en `::view-transition-group(name)` siguiendo UX-001; (4) en MPA, `@view-transition` en ambas páginas; (5) reduced motion: `animation-duration: 0s` en los pseudo-elementos o desactivar la transición.
8. **Parámetros.** Nombres, duración (200–400 ms, UX-001), easing.
9. **Código.** Ejemplos de MDN (no copiados); estructura en §7.
10. **Problemas habituales.** Nombres duplicados en la misma página (la transición se salta); elementos sin nombre que se funden con todo; transiciones largas que bloquean la interacción.
11. **Rendimiento / a11y.** Instantáneas = memoria; mantener transiciones cortas; respetar reduced motion; foco tras navegación.
12. **Compatibilidad.** Ver §4; mejora progresiva (sin soporte, el cambio ocurre igual).
13. **Aplicaciones.** Galería → detalle de proyecto; filtros; páginas de un sitio estático (MPA) sin framework.
14. **Pruebas.** Chromium, Firefox ≥ 144, WebKit; navegador sin soporte; reduced motion; navegación atrás.
15. **Estado de evidencia.** Docs leídas. No ejecutado. Relación con FLIP-001: Flip para animaciones dentro de una página con control fino; View Transitions para cambios de página/estado con mínimo código.
