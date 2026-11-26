---
id: TUT-020
titulo: Olivier Larose — Sticky Footer, Perspective Section Transition, Text Along Path, Pixel Transition
creador: Olivier Larose
identidad_verificada: SI (ver TUT-001)
repo: olivierlarose/sticky-footer (3a1c015, 2024-05-20) · perspective-section-transition (f0b6aaa, 2024-05-12) · text-along-path (208a664, 2024-03-04) · pixel-transition-effect (51dfa45, 2023-10-01)
licencia: ninguna declarada → solo paráfrasis
video_url: ninguno enlazado en las 4 páginas (solo el canal @olivierlarose1)
narrado: n/a (artículos escritos del autor)
code_route: B_CODIGO_PUBLICO + artículo del autor
evidencia: CODIGO_INSPECCIONADO + ARTICULO_AUTOR_ANALIZADO
ultima_revision: 2026-10-26
---

# TUT-020 · Olivier Larose (lote 7)

1. **Identidad.** Las 4 páginas del blog del autor enlazan sus repos y demos.
2. **Qué construyen / técnicas.** Footer que se descubre bajo el contenido → [FOOT-001](../scrolltrigger/FOOT-001-footer-revelado-sticky.md); transición entre secciones con escala y giro → [SECT-001](../transitions/SECT-001-transicion-seccion-perspectiva.md); texto sobre curva SVG → [TXT-004](../animations/TXT-004-texto-sobre-trazado.md); transición pixelada → [PIX-001](../transitions/PIX-001-transicion-pixelada.md).
3. **Stack.** Next 14.x, React 18, framer-motion 10–11, lenis 1.0.45 (paquete nuevo `lenis` en los repos de 2024; `@studio-freight/lenis` en el de marzo de 2024), Tailwind/Sass.
4. **Discrepancias artículo ↔ repo.** Sticky footer: numeración de métodos invertida; text-along-path: desplazamiento de logos −225 px (artículo) frente a −700 px (repo). Regla: manda el código del commit.
5. **Fallos.** Lenis sin limpieza (los 3 repos que lo usan); `pixel-transition` recalcula el orden aleatorio en cada render, lee `window` al renderizar y fija dependencias en `"latest"`; archivo basura de macOS en text-along-path; `alt` genéricos.
6. **Pago.** El tutorial "Horizontal Scroll" (2023-12-30) es del curso de pago → INACCESIBLE_POR_COSTE (solo demo pública).
7. **Evidencia.** Código y artículos leídos; demos no inspeccionadas (navegador limitado en el lote 7); vídeos no vistos.
