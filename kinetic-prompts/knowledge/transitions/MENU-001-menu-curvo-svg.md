---
id: MENU-001
titulo: Menú lateral con borde curvo SVG que se aplana al entrar
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO + ARTICULO_AUTOR_ANALIZADO (TUT-021)
versiones: fuente — next 13 (App Router), framer-motion 10
perfil: ambos
ultima_revision: 2026-10-26
---

# MENU-001 · Curved menu (Olivier Larose)

1. **Nombre y finalidad.** Panel de navegación a pantalla completa en altura que entra desde la derecha con el borde izquierdo abombado; al llegar, el borde se endereza. Enlaces escalonados e indicador de página activa (tema 15, menús).
2. **Fuente.** `olivierlarose/curved-menu` (commit 48ef7d2, 2023-07-03, sin licencia); artículo https://blog.olivierlarose.com/tutorials/curved-menu (04-07-2023); vídeo enlazado https://www.youtube.com/watch?v=NOJCt7qyh9c (**no visto**).
3. **Ubicación.** `components/header/anim.js` (variantes), `nav/index.jsx`, `nav/Curve/index.jsx`, `nav/Link/index.jsx`.
4. **Resultado (según código).** Panel gris oscuro fijo a la derecha; mientras se desliza, un "lóbulo" sobresale a su izquierda y se aplana; los 4 enlaces llegan uno detrás de otro; un punto marca la página activa o la que está bajo el ratón.
5. **Explicación técnica [COD].**
   - **Panel:** `x: calc(100% + 100px) → 0`, 0,8 s, ease `[0.76, 0, 0.24, 1]` (los 100 px extra esconden también la curva).
   - **Curva:** un `<svg>` de 100 px de ancho pegado al panel (`left: -99px`, 1 px de solape para evitar costura). Trazado: rectángulo de x=100 a x=200 cerrado con una curva cuadrática `Q` cuyo punto de control pasa de **x = −100** (abombado) a **x = 100** (recto). framer-motion interpola el atributo `d` (mismo número y tipo de comandos en ambos trazados → interpolación directa). Entrada 1 s, salida 0,8 s.
   - **Enlaces:** variante con `custom={index}`: `x: 80 → 0`, delay 0,05·i.
   - **Indicador:** `scale 0↔1` (0,3 s abrir / 0,4 s cerrar) según `selectedIndicator`, que sigue al ratón y vuelve a la ruta actual en `mouseleave`.
   - **Montaje/desmontaje:** `AnimatePresence mode="wait"` para ejecutar la salida; la cabecera cierra el menú al cambiar `usePathname()` (el artículo no lo cubre).
6. **Dependencias.** framer-motion, next/navigation. El título del artículo menciona GSAP pero el código mostrado no lo usa.
7. **Procedimiento profesional (adaptación).**
   1. Calcular la altura en un efecto/`ResizeObserver`, no en el render (el original lee `window.innerHeight` durante el render: rompe en SSR y no se actualiza al redimensionar). Alternativa: `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` y coordenadas relativas → sin medir nada.
   2. Botón real `<button aria-expanded aria-controls>` con etiqueta accesible.
   3. Al abrir: foco al primer enlace, `Esc` cierra, foco atrapado o resto de la página `inert`; al cerrar, foco al botón.
   4. Bloquear el scroll del fondo (o Lenis `stop()`).
   5. Reduced motion: solo fundido.
8. **Parámetros.** Ancho de curva 100 px; punto de control −100→100; duraciones 0,8/1/0,8 s; stagger 0,05 s; desplazamiento de enlaces 80 px.
9. **Código (adaptación propia, no del autor; no ejecutada):**
   ```js
   // <svg viewBox="0 0 100 100" preserveAspectRatio="none"> de 100 px de ancho y 100 % de alto
   const curved = "M100 0 Q-100 50 100 100 Z"; // lóbulo que llega a x = 0
   const flat   = "M100 0 Q100 50 100 100 Z";  // línea recta en el borde: invisible
   ```
   [CALC] En el original, la parte rectangular del trazado (x = 100…200) queda **fuera** del SVG de 100 px de ancho y no se ve; lo único visible es el lóbulo de la curva. El punto más saliente de una cuadrática con control en −100 está en t = 0,5: 0,25·100 + 0,5·(−100) + 0,25·100 = 0 → el lóbulo ocupa justo los 100 px. Con coordenadas relativas no hace falta medir la ventana.
10. **Problemas detectados [COD].** `window` en render; hamburguesa como `div` con `onClick` (sin teclado, sin `aria-expanded`); sin Esc ni gestión de foco; trazado fijo al tamaño inicial; menú de 56 px de fuente fijo sin `clamp()`.
11. **Rendimiento / a11y.** Animar `d` repinta el SVG en cada frame (barato a este tamaño). Transform del panel en compositor. Ver A11Y-004 para patrones de diálogo/foco.
12. **Compatibilidad.** Animación de `d` vía JS (framer) funciona en todos los navegadores; la propiedad CSS `d` no es universal → no depender de CSS para esto.
13. **Aplicaciones.** Menú de agencia/portfolio; versión sobria para clínica o despacho (curva sutil, sin escalonado largo).
14. **Pruebas.** Abrir/cerrar rápido (AnimatePresence); navegar con teclado; resize con el menú abierto; ruta cambia → se cierra; lector de pantalla anuncia estado.
15. **Estado de evidencia.** Código + artículo leídos. No ejecutado; sin medición (panel oculto). Vídeo no visto. La ease `[0.76, 0, 0.24, 1]` aparece en varios tutoriales del autor; coincide con la aproximación de *easeInOutQuart* que publica easings.net [EST, no verificado en este lote].
