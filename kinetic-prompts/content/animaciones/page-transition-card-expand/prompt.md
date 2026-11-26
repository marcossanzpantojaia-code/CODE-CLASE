# {{title}}

Transición de página de nivel avanzado. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Al abrir un elemento de un listado (un proyecto, un producto, un artículo), su imagen viaja desde la tarjeta y crece hasta convertirse en la portada de su página, en {{duration}} s. El fondo de la página nueva, de color {{background}}, aparece mientras tanto y el texto entra después, subiendo y escalonado {{stagger}} s. Al volver al listado, la portada se encoge hasta su tarjeta. Se siente como abrir la tarjeta, no como cambiar de página.

## 2. Stack

<!-- solo: nextjs -->
- Next.js 16 (App Router): el componente `<ViewTransition>` de React 19.3 con un elemento compartido. Funciona sin configuración.
<!-- fin -->
<!-- solo: astro, html -->
- Astro o HTML de varias páginas: View Transitions entre documentos con `view-transition-name`.
<!-- fin -->
- Si el listado y el detalle están en la misma página (un panel que se abre), técnica FLIP con la Web Animations API, sin dependencias. Si el proyecto ya usa GSAP, su plugin Flip (gratuito) hace lo mismo.

## 3. Estructura

Antes de escribir código, mira el proyecto: si el detalle es una página aparte o un panel en la misma página, y cómo se llama cada elemento (su `id` o `slug`). Después:

1. En la tarjeta del listado, separa la imagen (un bloque sin texto dentro) del título. Solo viaja la imagen.
2. En la página de detalle, la portada es el mismo tipo de bloque, a todo el ancho.
<!-- solo: nextjs -->
3. **Next.js:** envuelve la imagen de la tarjeta y la portada del detalle en `<ViewTransition>` con el mismo `name` (por ejemplo, `proyecto-${slug}`), `share="morph"` y `default="none"`. Cada `name` es único en la página. Envuelve el texto del detalle en otro `<ViewTransition>` con `enter="kp-texto"` y `default="none"`.
<!-- fin -->
<!-- solo: astro, html -->
3. **Astro o HTML:** activa `@view-transition { navigation: auto; }` en todas las páginas y pon el mismo `view-transition-name` (`proyecto-<slug>`) a la imagen de la tarjeta y a la portada del detalle. Solo la tarjeta del elemento abierto lleva ese nombre: dos elementos con el mismo nombre en una página cancelan la transición.
<!-- fin -->
4. **Misma página (FLIP):** guarda el rectángulo de la imagen de la tarjeta (`getBoundingClientRect`), muestra el detalle, mide la portada y anima la portada desde `translate(dx, dy) scale(sx, sy)` hasta `none` con `transform-origin: 0 0`.

## 4. Comportamiento paso a paso

1. **Viaje de la imagen:** {{duration}} s con easing `{{ease}}`, desde la posición y el tamaño de la tarjeta hasta la portada.
2. **Fondo de la página nueva ({{background}}):** de opacidad 0 a 1 en el 60 % de esa duración. El texto del detalle va en blanco o en negro, el que tenga más contraste con {{background}} (mínimo 4,5:1).
3. **Texto:** cada línea (enlace de volver, título y párrafo) entra de `opacity: 0` y `translateY(16px)` a su sitio. Empieza a mitad del viaje y se escalona {{stagger}} s.
4. **Volver:** el mismo viaje al revés; el texto se funde en el 30 % del tiempo y el fondo desaparece al final.
5. Mientras dura un viaje, ignora otros clics. No empieces el siguiente hasta que acabe el actual.
6. Atrás y Adelante del navegador hacen la misma transición, o ninguna, pero nunca dejan la página a medias.

## 5. Parámetros configurables

- Duración del viaje: {{duration}} s.
- Escalonado del texto: {{stagger}} s.
- Easing: `{{ease}}`.
- Color de la página de detalle: {{background}}.

<!-- solo: nextjs -->
En Next.js, define en los estilos globales `::view-transition-group(.morph)` con esa duración y ese easing, y la animación de entrada `kp-texto` para `::view-transition-new(.kp-texto)`.
<!-- fin -->

## 6. Responsive

- Funciona igual en todos los anchos. En móvil, el listado va a 2 columnas y la portada ocupa el ancho de la pantalla.
- Si el ancho y el alto escalan distinto, el bloque se deforma durante el viaje. Por eso viaja la imagen sola, sin texto dentro, con `object-fit: cover` si es una foto.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, sin viaje: la página nueva aparece con un fundido de 150 ms.
- Al abrir, el foco va al título del detalle (`tabindex="-1"`); al volver, al título del listado o a la tarjeta de la que se salió. Anuncia el cambio en una región `aria-live="polite"`.
- Las tarjetas son enlaces o botones reales, con nombre accesible, y el orden del DOM coincide con el orden visual final.

## 8. Rendimiento

- Anima solo `transform` y `opacity`. Nada de animar `width`, `height`, `top` ni `left`.
- Usa imágenes del mismo archivo en la tarjeta y en la portada (o la grande ya precargada) para que no haya parpadeo al llegar.
- Limpia las animaciones al terminar.

## 9. Criterios de validación

- La imagen sale exactamente de la posición y el tamaño de su tarjeta y termina como portada en {{duration}} s.
- El texto entra después, escalonado {{stagger}} s, y el foco queda en el título.
- Al volver, la portada se encoge hasta su tarjeta y el listado queda como estaba.
- Clics rápidos y Atrás o Adelante no dejan la página a medias.
- Con movimiento reducido solo hay un fundido corto, y la consola no muestra errores.
