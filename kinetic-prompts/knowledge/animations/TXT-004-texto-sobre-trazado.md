---
id: TXT-004
titulo: Texto que avanza sobre un trazado SVG curvo con el scroll (textPath + startOffset)
categoria: animations
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (repo olivierlarose/text-along-path, commit 208a664) + ARTICULO_AUTOR_ANALIZADO (2024-02-23)
versiones: Next 14.1.0, framer-motion ^11.0.5, @studio-freight/lenis ^1.0.36
perfil: ambos
ultima_revision: 2026-10-26
---

# TXT-004 · Text along path

1. **Finalidad.** Frases que se deslizan a lo largo de una curva SVG mientras se hace scroll, típico en footers (temas 2, 6).
2. **Fuente.** blog.olivierlarose.com/tutorials/text-along-path (sin vídeo enlazado); repo del autor.
3. **Ubicación.** `src/components/Footer.jsx`.
4. **Resultado [COD].** SVG con `viewBox` 0 0 250 90 y un trazado (dibujado en un editor vectorial); 3 `<textPath href="#curve">` con `startOffset` 0 %, 40 %, 80 %; con el scroll cada uno avanza 40 puntos porcentuales; debajo, una fila de logos que sube con parallax.
5. **Explicación [COD].** `useScroll` con offsets `start end` → `end end`; en el evento `change` de la MotionValue se escribe directamente `startOffset = −40 + i·40 + progreso·40 %` en cada `textPath` (sin re-render de React).
6. **Dependencias.** Ninguna imprescindible (SVG nativo); fuente: framer-motion.
7. **Procedimiento para Claude Code.** Un `onUpdate` de ScrollTrigger (o `scroll()` de CSS no aplica a atributos SVG: necesita JS) que escriba `startOffset`; `aria-hidden` en el SVG si el texto es decorativo o duplicarlo en HTML; dibujar el trazado con espacio suficiente para el texto.
8. **Parámetros.** Separación entre copias (40 %), recorrido por scroll (40 %), tamaño de texto (6 unidades SVG).
9. **Código.** Fórmula en §5 (repo sin licencia).
10. **Discrepancias y fallos.** El artículo indica un desplazamiento de logos de ≈ −225 px a 0; el **repo usa −700 a 0** (manda el código). El repo incluye un archivo basura de macOS (`._Footer.jsx`); el listener `on("change")` no se elimina al desmontar; imágenes sin `alt`.
11. **Rendimiento / a11y.** Cambiar un atributo por frame: barato; texto SVG legible para lectores si no se oculta, pero repetido 3 veces → `aria-hidden` en las copias.
12. **Compatibilidad.** `textPath` + `startOffset` universales.
13. **Aplicaciones.** Footer de marca, sección "sobre nosotros", separadores.
14. **Pruebas.** Anchos estrechos (texto que se corta al final del trazado), reduced motion, lector de pantalla.
15. **Estado de evidencia.** Código y artículo leídos; demo no vista.
