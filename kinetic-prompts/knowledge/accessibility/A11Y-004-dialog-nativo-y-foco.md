---
id: A11Y-004
titulo: Modales con <dialog> nativo, cierre ligero, animación de entrada/salida y estilos de foco correctos
categoria: accessibility
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (MDN) + ARTICULO_AUTOR_ANALIZADO (Web Dev Simplified 2023 y 2024)
versiones: <dialog> Baseline "Widely available" desde 03-2022 (MDN); `closedby`, `requestClose`, `:open`, `@starting-style`, `transition-behavior: allow-discrete`: comprobar soporte
perfil: ambos
ultima_revision: 2026-10-26
---

# A11Y-004 · <dialog> y foco

1. **Finalidad.** Modales (pedir cita, galería ampliada, aviso) y menús a pantalla completa sin reinventar el foco, Esc ni la inertización del fondo (tema 15; base de MENU-001 y UX-003).
2. **Fuentes.** MDN https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog; Kyle Cook https://blog.webdevsimplified.com/2023-04/html-dialog (24-04-2023) y https://blog.webdevsimplified.com/2024-07/css-focus-crash-course (29-07-2024).
3. **Lo que el navegador hace solo con `showModal()` [MDN].** Capa superior (*top layer*), `::backdrop`, resto del documento **inert**, `aria-modal="true"` implícito, Esc cierra (con varios, solo el último), foco al primer elemento enfocable (o al que tenga `autofocus`). `show()` = no modal (sin inert, sin Esc). Evitar el atributo `open` a mano.
4. **Cierre [MDN].**
   - `closedby="any"` (clic fuera + Esc), `"closerequest"` (Esc/gesto atrás; por defecto en modales), `"none"`.
   - Sin soporte de `closedby`: listener de clic en el `dialog` y comparar coordenadas con `getBoundingClientRect()` (el backdrop forma parte del dialog) [WDS].
   - `<form method="dialog">` cierra sin enviar; `returnValue` = `value` del botón; evento `cancel` (antes, prevenible) y `close` (después).
5. **Foco y etiquetas [MDN].** `autofocus` en el control principal o en "Cerrar"; no poner `tabindex` en el `<dialog>`; siempre un botón de cierre visible; al cerrar, el foco vuelve al disparador (comprobar).
6. **Animación [MDN].** `dialog` alterna `display: none`: añadir `display` y `overlay` a `transition` con `allow-discrete` y definir el estado inicial con `@starting-style`:
   ```css
   dialog { opacity: 0; transition: opacity .3s, overlay .3s allow-discrete, display .3s allow-discrete; }
   dialog:open { opacity: 1; }
   @starting-style { dialog:open { opacity: 0; } }
   ```
   Con `@keyframes` no hace falta `allow-discrete`, pero el backdrop no puede fundirse al cerrar.
7. **Estilos de foco [WDS].** `:focus-visible` para controles (no `:focus`, que pinta el anillo tras un clic); `:focus-within` para contenedores con cualquier foco; `:has(:focus-visible)` para resaltar un contenedor solo con foco de teclado.
8. **Procedimiento profesional.**
   1. Modal = `<dialog>` + `showModal()`; menú lateral a pantalla completa = `<dialog>` o `inert` en `<main>`.
   2. Título con `aria-labelledby` [buena práctica general; MDN no la cubre en esta página].
   3. Bloquear el scroll del fondo (`body:has(dialog[open]) { overflow: hidden }` o Lenis `stop()`).
   4. Reduced motion: sin escala, fundido corto.
9. **Código.** Arriba (§6); adaptación de MDN.
10. **Problemas habituales.** Modales con `div` sin inert; foco perdido al cerrar; animación de salida que no se ve (falta `allow-discrete`); contenido fijo dentro de un wrapper transformado (ScrollSmoother, GS-002) → el dialog en *top layer* lo evita.
11. **Rendimiento.** Nulo.
12. **Compatibilidad.** `<dialog>` universal; `closedby`, `:open`, `@starting-style` y `overlay`: recientes → mejora progresiva (el modal funciona igual sin animación).
13. **Aplicaciones.** Formulario de cita, aviso de horario festivo, galería, política de cookies (sin patrones oscuros).
14. **Pruebas.** Tab/Shift+Tab dentro del modal; Esc; lector de pantalla (anuncia "diálogo" + título); clic fuera; foco al volver.
15. **Estado.** Fuentes leídas; no implementado.

**Lote 9:** la lección de Fireship sobre un modal con Framer Motion (PHYS-001 §7) no gestiona foco, Esc ni inert: usar este patrón nativo y animarlo aparte.
