---
id: MASK-001
titulo: Revelado cinematográfico con máscara CSS de logotipo (zoom-out de mask-size ligado al scroll)
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (repositorio público; vídeo NO visto)
versiones: gsap ^3.13.0, @gsap/react ^2.1.2, React 19, Tailwind 4, Vite 6 (package.json del repo, commit 56b6e63, 2025-06-20)
perfil: cinematografico
ultima_revision: 2026-10-26
---

# MASK-001 · Revelado con máscara de logotipo

1. **Finalidad.** Hero en el que la imagen de fondo se ve **a través** de la silueta de un logotipo gigante que se encoge con el scroll, como en la web del tráiler de GTA VI (tema 9: revelados con máscaras).
2. **Fuente.** JavaScript Mastery (Adrian Hajdu), repositorio `adrianhajdin/jsm_gta_vi_landing`: https://github.com/adrianhajdin/jsm_gta_vi_landing — archivos `src/sections/Hero.jsx`, `constants/index.js` (`useMaskSettings`) y `src/index.css` (`.mask-wrapper`, `.entrance-message`). **Sin archivo LICENSE**: no se reproduce el código.
3. **Ubicación.** Hero.jsx (timeline completa del hero); index.css líneas ~233-242.
4. **Resultado.** Al hacer scroll, la sección queda fijada y la máscara pasa de un tamaño enorme (el logo "contiene" toda la pantalla) a su tamaño final; el texto desaparece, aparece el logo y después un mensaje se revela con un degradado radial.
5. **Explicación técnica (observada en el código).**
   - El contenedor de imágenes usa `mask-image: url(logo.svg)` con `mask-repeat: no-repeat`.
   - GSAP fija `maskPosition` y `maskSize` iniciales (valores del orden de `3500% 3500%`) y una timeline anima `maskSize` hasta el tamaño final, a la vez que escala la imagen de fondo (`scale-out`) y desvanece textos (`fade-out`).
   - La timeline está ligada a un ScrollTrigger con `pin: true`, `start: "top top"`, `end: "+=200%"` y `scrub: 2.5` (suavizado alto, sensación cinematográfica).
   - El mensaje final se revela animando `mask-image` entre dos `radial-gradient` (círculo que se abre).
   - Los valores de máscara cambian por breakpoint (móvil ≤ 768 px, tablet 769–1024 px, escritorio) mediante un hook con `react-responsive`.
6. **Dependencias.** gsap, ScrollTrigger, @gsap/react, react-responsive, un SVG del logotipo.
7. **Procedimiento reproducible (adaptación propia).** (1) SVG del logotipo como `mask-image`; (2) estado inicial con `gsap.set` (máscara gigante); (3) timeline con pin + scrub; (4) en la misma posición (`"<"`) animar `maskSize` y `scale` del fondo; (5) valores por breakpoint con `gsap.matchMedia()`.
8. **Parámetros.** Tamaño y posición inicial/final de la máscara por breakpoint; `scrub` (2.5 en la fuente); longitud del pin (`+=200%`); eases `power1.inOut`.
9. **Código (adaptación propuesta con gsap.matchMedia en lugar del hook; no ejecutada):**
   ```js
   const mm = gsap.matchMedia();
   mm.add({ mobile: "(max-width: 768px)", desktop: "(min-width: 769px)",
            motion: "(prefers-reduced-motion: no-preference)" }, ({ conditions: c }) => {
     if (!c.motion) return;                       // ver A11Y-001
     gsap.set(".mask-wrapper", { maskSize: c.mobile ? "3100% 3100%" : "3500% 3500%" });
     gsap.timeline({ scrollTrigger: { trigger: ".hero", pin: true, start: "top top", end: "+=200%", scrub: 2.5 } })
       .to(".hero__fade", { autoAlpha: 0 })
       .to(".mask-wrapper", { maskSize: c.mobile ? "50% 50%" : "20% 20%" }, "<"); // valores finales de la fuente (tablet: 30%)
   });
   ```
10. **Problemas detectados en el código fuente (análisis propio, a confirmar en ejecución):**
    - `useGSAP` sin `scope`: selectores globales (`.fade-out`, `.mask-wrapper`), contrario a la recomendación de las Skills oficiales de GSAP.
    - Los valores de máscara salen de un hook de React, pero `useGSAP` no declara dependencias: al cruzar un breakpoint redimensionando, la timeline probablemente **no se reconstruye** (hipótesis).
    - Un `onComplete` que lanza otro tween dentro de una timeline con scrub no se revierte al volver hacia atrás.
    - Imágenes sin `alt` o con `alt` genérico ("background").
    - Uso de `mask-*` sin prefijo: comprobar soporte de `-webkit-mask-*` en los navegadores objetivo (pendiente de contrastar en MDN).
11. **Rendimiento y accesibilidad.** Animar `mask-size` provoca repintado en cada frame (no es solo composición): medir FPS en móvil. Pin de 200 % + scrub 2.5 es largo; ofrecer versión estática con reduced motion.
12. **Compatibilidad.** Pendiente verificar `mask-image` animado en Safari/Firefox.
13. **Aplicaciones.** Lanzamientos de producto, campañas de marca, portadas de eventos. Poco adecuado para webs de negocio local.
14. **Pruebas.** FPS en móvil medio; cruzar breakpoints redimensionando; scroll hacia atrás completo (el logo superpuesto debe volver a su estado); reduced motion.
15. **Evidencia.** Código fuente leído (Hero.jsx, constants, CSS). Vídeo del tutorial **no visto** (URL exacta no confirmada: el enlace del README está comentado y parece de plantilla). Nada ejecutado.
