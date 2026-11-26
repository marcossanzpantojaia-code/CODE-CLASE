---
id: PIX-001
titulo: Transición pixelada de pantalla completa (bloques con retardos aleatorios)
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (repo olivierlarose/pixel-transition-effect, commit 51dfa45) + ARTICULO_AUTOR_ANALIZADO (2023-10-01)
versiones: framer-motion ^10.16.4; next/react "latest" (sin fijar)
perfil: ambos (menús, cambios de página)
ultima_revision: 2026-10-26
---

# PIX-001 · Pixel transition

1. **Finalidad.** Cubrir o descubrir la pantalla con bloques que aparecen en orden aleatorio (centrado) o en barrido con borde pixelado (horizontal/vertical), p. ej. al abrir un menú.
2. **Fuente.** blog.olivierlarose.com/tutorials/pixel-transition (sin vídeo enlazado); repo del autor.
3. **Ubicación.** `src/components/pixelTransition/{centered,horizontal,vertical}/index.jsx`.
4. **Resultado [COD].** Rejilla de 20 columnas (bloques de 5 % del ancho, cuadrados) o 10 filas (bloques del 10 % del alto). Cada bloque cambia de opacidad **instantáneamente** (duración 0) tras un retardo propio.
5. **Explicación [COD].**
   - Centrado: retardo = 0,03 s × índice aleatorio (Fisher–Yates) dentro de cada columna.
   - Horizontal: abrir = 0,02 s × (columna + aleatorio); cerrar = 0,02 s × (20 − columna + aleatorio) → barrido en un sentido al abrir y en el contrario al cerrar, con borde irregular.
   - Vertical: lo mismo con 10 filas y los retardos intercambiados.
   - El autor resume: la clave es usar un valor del array como retardo personalizado por elemento; se puede hacer en JS sin librería.
6. **Dependencias.** Ninguna imprescindible (fuente: framer-motion). Con GSAP: `stagger` con función o `gsap.utils.shuffle`.
7. **Procedimiento para Claude Code.** Generar la rejilla una vez (no en cada render), en un `div` fijo con `pointer-events: none` y `aria-hidden`; tween de `autoAlpha` con `duration: 0` y `delay` por bloque, o `stagger: { each: 0.02, from: "random" }`; recalcular en resize.
8. **Parámetros y duraciones [CALC].** Con viewport 747×894: bloque 37,35 px → 24 bloques por columna → transición centrada completa en 0,03 × 23 ≈ **0,69 s**; horizontal ≈ 0,02 × (19 + 23) ≈ **0,84 s**. En 1440×900: bloque 72 px → 13 por columna → ≈ 0,36 s.
9. **Código.** Fórmulas en §5 (repo sin licencia).
10. **Errores detectados.** Las posiciones aleatorias se **recalculan en cada render** (el shuffle está dentro de la función de render) y se lee `window` durante el render (riesgo en SSR); dependencias `next`/`react` en `"latest"` (builds no reproducibles); cientos de nodos animados por framer-motion.
11. **Rendimiento / a11y.** ~480 bloques a 1440 px: aceptable con opacidad; cambios bruscos de bloques claros/oscuros → revisar destellos (WCAG 2.3.1, A11Y-002); reduced motion: fundido simple.
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** Apertura de menú a pantalla completa, transición entre páginas de un portfolio.
14. **Pruebas.** Abrir/cerrar rápido, resize, SSR, reduced motion, número de nodos.
15. **Estado de evidencia.** Código y artículo leídos; demo no vista; duraciones = cálculo.
