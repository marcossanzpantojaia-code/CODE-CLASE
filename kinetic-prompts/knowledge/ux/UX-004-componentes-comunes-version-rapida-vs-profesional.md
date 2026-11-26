---
id: UX-004
titulo: Componentes típicos de una web de negocio — de la versión rápida de tutorial a la versión profesional (FAQ, cabecera pegajosa, etiqueta flotante)
categoria: ux
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (Brad Traversy, `50projects50days`, MIT) (TUT-027)
versiones: HTML/CSS/JS vanilla (commit c92b0bc, 2024-08-29)
perfil: comercial
ultima_revision: 2026-10-27
---

# UX-004 · Versión rápida vs versión profesional

1. **Finalidad.** Los tutoriales de proyectos rápidos enseñan bien la mecánica visual pero dejan fuera accesibilidad y robustez. Esta ficha toma tres piezas del repositorio de Traversy y documenta qué cambiar para producción.
2. **Fuente.** https://github.com/bradtraversy/50projects50days (MIT, 50 mini-proyectos; el README enlaza el curso en traversymedia.com, de pago → INACCESIBLE_POR_COSTE; demos en 50projects50days.com no abiertas; vídeos no vistos). Leídos: `faq-collapse`, `sticky-navigation`, `form-input-wave`.
3. **FAQ desplegable.**
   - **Rápido [COD]:** cada `.faq` tiene `h3`, `p` y un `<button class="faq-toggle">` con iconos; el JS hace `toggle.parentNode.classList.toggle('active')`; el CSS muestra/oculta la respuesta.
   - **Bien:** el botón es un `button` real (✔), pero le faltan nombre accesible (solo iconos), `aria-expanded` y `aria-controls`. Profesional: `<details><summary>Pregunta</summary>…</details>` (teclado y lector gratis) + animación con `interpolate-size` (CSS-007); si se mantiene el patrón JS, el `button` debe contener el texto de la pregunta dentro del `h3` y alternar `aria-expanded`. Añadir JSON-LD `FAQPage` solo si las preguntas son visibles [criterio propio].
4. **Cabecera que cambia al hacer scroll.**
   - **Rápido [COD]:** `window.addEventListener('scroll', fixNav)` y comparación con `nav.offsetHeight + 150` en cada evento → lectura de layout en cada scroll.
   - **Profesional:** un "centinela" de 1 px con `IntersectionObserver` (sin trabajo en cada scroll) o una animación CSS ligada al scroll (CSS-001/scroll-driven); `position: sticky` en lugar de `fixed` si no se quiere saltar el contenido; reservar la altura para no provocar CLS.
5. **Etiqueta flotante con "ola" de letras.**
   - **Rápido [COD]:** el JS sustituye el texto de cada `<label>` por un `span` por letra con `transition-delay: idx·50ms`; el `input` va antes del `label` y **no están asociados** (`for`/`id` ausentes); el estado "flotante" depende de `:focus`/`:valid` con `required`.
   - **Problemas:** sin asociación el lector no anuncia la etiqueta al enfocar el campo; trocear en `span` puede hacer que algunos lectores deletreen; `:valid` como "tiene texto" falla con campos opcionales o con valor inválido.
   - **Profesional:** `<label for="email">` + `id`, letras en un `span aria-hidden` y texto real en `aria-label` o en un `span` visualmente oculto; estado con `:placeholder-shown` (con `placeholder=" "`); `autocomplete="email"`; mensajes de error enlazados con `aria-describedby` (FORM-001).
6. **Patrón general [criterio propio].** Antes de copiar un componente de tutorial: (1) ¿es el elemento HTML nativo correcto? (2) ¿funciona con teclado? (3) ¿qué anuncia un lector? (4) ¿lee layout en scroll/resize? (5) ¿qué pasa con reduced motion y sin JS?
7–13. **Aplicaciones.** FAQ de clínica, cabecera de barbería con botón "Reservar", formulario de contacto de despacho.
14. **Pruebas.** Tab y lector en los tres componentes; Lighthouse (CLS de la cabecera); `getByRole`/`getByLabel` en Playwright (TEST-001) — si el localizador no encuentra el campo, la etiqueta no está asociada.
15. **Estado.** Código leído; correcciones propuestas sin implementar.

## Lote 18 · Cabecera móvil: presupuesto de anchura — `DEMO_INSPECCIONADA` (prototipo n.º 1, medido con Playwright)
- **Fallo observado [MED]:** en el prototipo n.º 1 la cabecera (marca + CTA "Reservar cita" + botón de menú, `display: flex; flex-wrap: wrap`) pasó a **dos filas** a 375 y 320 px (98 px de alto a 375). [CALC] 161 + 147 + 44 px de elementos + 2 × 9,6 px de huecos = 371 px > 335 px disponibles (375 − 2 × 20 px de margen).
- **Regla [criterio propio, sin probar]:** antes de cerrar la cabecera, sumar las anchuras mínimas de sus elementos en **320 px**; si no caben: (1) acortar el texto del CTA en pantallas estrechas ("Reservar"), (2) reducir el `letter-spacing` de la marca, (3) `flex-wrap: nowrap` con `min-width: 0` en la marca y texto truncable, o (4) sacar el CTA de la cabecera y fijarlo abajo en móvil (sin tapar el foco: A11Y-006).
- **Prueba:** medir la altura de la cabecera y la posición `top` de sus hijos a 320 y 375 px (todas iguales = una fila): ver `evidence/integration/2026-10-27/prototipo_1/herramientas_prueba/extra.mjs`.

## Lote 19 · Contraejemplo medido: B1 (sin biblioteca) resolvió la cabecera — `DEMO_INSPECCIONADA`
- En el control B1 la cabecera móvil es **marca + botón de menú**; el CTA "Reservar cita" va **dentro del menú** (`<li><a class="btn btn-small">`) a partir de 800 px hacia abajo → `filas_distintas: 1` a 320 y 375 px (64 px de alto), frente a 2 filas en A1. Es la opción (4) de la regla anterior, ahora con evidencia de que funciona en esos anchos. Coste: el CTA deja de estar visible sin abrir el menú → compensar con el CTA del héroe y, si se quiere, una barra inferior fija.
- Detección automática genérica: `integration/tools/extra_generico.mjs` (TEST-004).
