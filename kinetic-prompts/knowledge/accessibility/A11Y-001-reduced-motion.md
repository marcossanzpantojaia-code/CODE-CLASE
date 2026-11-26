---
id: A11Y-001
titulo: Movimiento reducido (prefers-reduced-motion) en GSAP, Lenis y 3D
categoria: accessibility
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (README de Lenis; docs ScrollTrigger). MDN y WCAG pendientes.
versiones: lenis 1.3.27; GSAP 3.15
perfil: ambos (obligatorio)
ultima_revision: 2026-10-27
---

# A11Y-001 · Reduced motion

1. **Finalidad.** Respetar la preferencia del sistema de reducir movimiento. Obligatorio en ambos perfiles.
2. **Fuentes.** README de Lenis (Reduced motion) · ScrollTrigger docs (`gsap.matchMedia()`; `ScrollTrigger.matchMedia()` está **deprecado**) · MDN https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion (pendiente).
3. **Ubicación.** Lenis → Considerations → Reduced motion; ScrollTrigger → Features / Methods.
4. **Resultado.** Con la preferencia activa: sin parallax, sin scroll suave, sin pins largos; contenido completo.
5. **Explicación técnica.** Lenis la respeta por defecto (lerp 1, scrollTo instantáneo, detección en vivo). `gsap.matchMedia()` crea configuraciones por media query y las revierte al cambiar la condición.
6. **Dependencias.** Ninguna adicional.
7. **Procedimiento.** Dos ramas: movimiento completo y reducido (fundidos breves o estado final). En Three.js: sin rotación automática ni cámara guiada por scroll.
8. **Parámetros.** Qué se conserva en modo reducido.
9. **Código (adaptación propuesta, no ejecutada):**
   ```js
   const mm = gsap.matchMedia();
   mm.add("(prefers-reduced-motion: no-preference)", () => { /* parallax, pins, scrub */ });
   mm.add("(prefers-reduced-motion: reduce)", () => { gsap.set(".reveal", { autoAlpha: 1 }); });
   ```
10. **Problemas.** Ocultar contenido con `opacity: 0` en CSS y depender de JS para mostrarlo: si JS falla, el contenido queda invisible.
11. **Accesibilidad.** Criterio WCAG exacto pendiente de contrastar.
12. **Compatibilidad.** Media query soportada en navegadores modernos.
13. **Aplicaciones.** Todas.
14. **Pruebas.** Emular la preferencia en DevTools (Rendering) y recorrer toda la página con capturas.
15. **Evidencia.** Docs oficiales de Lenis y GSAP. Código no ejecutado.

**Actualización lote 3 (2026-10-26) — guía oficial gsap.com/resources/a11y (DOCUMENTACION_OFICIAL_ANALIZADA).**
- Patrón: `gsap.matchMedia()` con un bloque `(prefers-reduced-motion: no-preference)` (movimiento completo) y otro `(prefers-reduced-motion: reduce)` (versión reducida o nada).
- **Reducir o quitar**, caso por caso, con dos preguntas: ¿es especialmente desencadenante? (cortes de color rápidos, barridos grandes horizontales/verticales → sí; microinteracciones y fundidos simples → normalmente no) y ¿es decorativa o funcional? (funcional → simplificar; decorativa → se puede quitar). Ejemplo citado: sustituir un barrido lateral grande por un fundido cruzado que conserva el contexto espacial.
- Trastornos vestibulares (mareo, náusea) y destellos (riesgo de crisis epilépticas) como motivos.
- Los ajustes del sistema no bastan: recomienda un **interruptor de animaciones en la propia página** (demo GreenSock/RwMQwpR, no inspeccionada).
- SplitText (≥3.13): `aria-label` en el padre y `aria-hidden` en los trozos; no conserva enlaces anidados → para texto complejo, `aria: false` + duplicado solo para lectores de pantalla (con moderación).
- La página **no** trata pausa/autoplay, gestión del foco, animaciones de scroll ni cita criterios WCAG: esos puntos siguen pendientes (MDN/WCAG en el lote siguiente).
- Consecuencia para las fichas de este lote: VEL-001, ZOOM-001, CAM-002 y SCN-001 son "barridos grandes" → en modo reducido, sustituir por estados fijos o fundidos.

**Lote 13:** el §11 ("criterio WCAG exacto pendiente") quedó resuelto en A11Y-002 (2.3.3 Animation from Interactions, 2.2.2 Pause, Stop, Hide) y A11Y-006 (WCAG 2.2). Carruseles: A11Y-007.

**Lote 15 (Skill oficial `gsap-core`, GS-004):** usar `gsap.matchMedia()` con **condiciones** (`mm.add({ reduceMotion: "(prefers-reduced-motion: reduce)", … }, ({ conditions }) => …)`) en vez de dos bloques duplicados; no anidar `gsap.context()` dentro; `gsap.matchMediaRefresh()` vuelve a ejecutar los manejadores (útil tras el interruptor de animaciones de la página — combinación con una preferencia propia pendiente de verificar).

**Lote 16:** la documentación de `gsap.matchMediaRefresh()` lo confirma para el caso "casilla que cambia la preferencia de movimiento reducido" (GS-004, lote 16); el manejador debe leer la preferencia propia (clase o almacenamiento) además de la media query.
