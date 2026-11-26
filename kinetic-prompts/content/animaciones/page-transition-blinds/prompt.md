# {{title}}

Transición de página de nivel intermedio. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Al pulsar un enlace interno, la página se tapa con {{strips}} tiras {{direction}} de color {{color}} que se cierran desde el centro hacia los bordes. Con la página tapada se cambia de página, y las tiras se recogen igual, desde el centro, para descubrir la nueva. Tiene que sentirse como unas persianas que se cierran y se abren: rápido, ordenado y sin parpadeos ni líneas entre tiras.

## 2. Stack

- Sin dependencias: HTML, CSS y JavaScript con la Web Animations API (`element.animate`).
- Si el proyecto ya usa GSAP, puedes usarlo para las mismas animaciones, pero no lo instales solo para esto.
- Vale para Next.js (App Router), Astro y webs de HTML con varias páginas.

## 3. Estructura

Antes de escribir código, mira el proyecto: qué framework usa, cómo navega entre páginas y dónde está el layout común. Después:

1. Crea una capa fija a pantalla completa (`position: fixed; inset: 0`, por encima de todo, `pointer-events: none` y `aria-hidden="true"`) con {{strips}} tiras en posición absoluta.
2. Cada tira mide 100 % / {{strips}} de alto (de ancho si son verticales) más 2 px, y empieza 1 px antes de su sitio. Ese solape evita la línea de 1 px que aparece entre tiras cuando la medida no es un número entero de píxeles.
3. Pon la capa en el layout común para que exista en todas las páginas.
4. Engancha la navegación según el proyecto:
   - **Next.js (App Router):** un componente cliente `TransitionLink` que envuelve `next/link`. En un clic izquierdo sin teclas modificadoras sobre un enlace interno, cancela la navegación por defecto, cubre, llama a `router.push(href)` y destapa cuando cambie `usePathname()`. Monta la capa en `app/layout.tsx`.
   - **Astro o HTML de varias páginas:** intercepta los clics en enlaces internos, cubre, guarda una marca en `sessionStorage` y navega con `location.href`. En la página nueva, un script pequeño en el `<head>` deja la capa cubierta si encuentra la marca, antes del primer pintado. Al cargar, destapa y borra la marca.
5. Los enlaces siguen siendo `<a href>` reales: sin JavaScript tienen que funcionar igual.

## 4. Comportamiento paso a paso

1. **Cubrir:** anima cada tira de `transform: scaleY(0)` a `scaleY(1)` (`scaleX` si son verticales), con `transform-origin` en su centro, en {{duration}} s y con easing `cubic-bezier(0.65, 0, 0.35, 1)`.
2. **Escalonado desde el centro:** cada tira espera |i − (N − 1) / 2| × {{stagger}} s, donde i es su posición y N el número de tiras. La central cierra la primera y las de los bordes, las últimas.
3. **Cambiar:** cuando hayan terminado todas (usa la promesa `finished` de cada animación), cambia de página y lleva el scroll arriba del todo.
4. **Descubrir:** anima de `scaleY(1)` a `scaleY(0)` con la misma duración, el mismo easing y el mismo escalonado.
5. Mientras dura, ignora los clics nuevos de navegación.
6. Si la página nueva tarda más de 3 s, destapa igualmente para no dejar la web tapada.
7. Atrás y Adelante del navegador navegan sin persianas.

## 5. Parámetros configurables

- Número de tiras: {{strips}} (entre 6 y 40).
- Duración de cada fase (cubrir y descubrir): {{duration}} s.
- Escalonado entre tiras: {{stagger}} s.
- Color de las tiras: {{color}}.
- Dirección de las tiras: {{direction}}.

Defínelos como constantes al principio del módulo para cambiarlos en un solo sitio.

## 6. Responsive

- Por debajo de 600 px de ancho, usa la mitad de tiras (como mínimo 6) para que el escalonado se siga leyendo.
- Al redimensionar, espera 150 ms y rehaz las tiras solo si cambia su número y no hay una transición en marcha.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, no muevas las tiras: cambia de página con un fundido de 150 ms de la página nueva (`opacity` de 0 a 1).
- Tras cambiar de página, mueve el foco al `<h1>` de la nueva (con `tabindex="-1"`) y anuncia su título en una región `aria-live="polite"`.
- La capa no recibe clics ni foco y los lectores de pantalla la ignoran.

## 8. Rendimiento

- Anima solo `transform` (y `opacity` en el modo reducido). Nada de animar `height`, `top` o `clip-path`.
- Pon `will-change: transform` en las tiras solo mientras dura la transición.
- No dejes animaciones ni listeners vivos al desmontar.

## 9. Criterios de validación

- Al pulsar un enlace interno, las tiras cubren desde el centro, cambia la página y se recogen. Cada fase dura {{duration}} s más el escalonado.
- Con todas las tiras cerradas no se ve ninguna línea de la página de debajo. Compruébalo a 1366 × 768 y a 390 × 844, donde la altura de una tira no es un número entero de píxeles.
- Atrás y Adelante funcionan, y pulsar dos enlaces seguidos no deja la página tapada.
- Con movimiento reducido solo hay un fundido corto.
- El foco queda en el título de la página nueva y la consola no muestra errores.
