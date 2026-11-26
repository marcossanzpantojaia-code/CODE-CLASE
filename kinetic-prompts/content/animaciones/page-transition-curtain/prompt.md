# {{title}}

Transición de página de nivel intermedio. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Al pulsar un enlace interno, una cortina de color {{color}} sube desde abajo con el borde superior curvo. Al tapar la página, la curva se endereza. Con la página tapada se ve el texto «{{label}}» en el centro y se cambia de página. Después, la cortina sigue subiendo y sale por arriba dejando una curva en su borde inferior. Tiene que sentirse como una tela que pasa, fluida y sin saltos.

## 2. Stack

- Sin dependencias: HTML, CSS y JavaScript con la Web Animations API (`element.animate`).
- Si el proyecto ya usa GSAP o Motion, puedes usarlos para las mismas animaciones, pero no los instales solo para esto.

## 3. Estructura

Antes de escribir código, mira el proyecto: qué framework usa, cómo navega entre páginas y dónde está el layout común. Después:

1. Crea una capa fija a pantalla completa (`position: fixed; inset: 0`, por encima de todo, `pointer-events: none`, `overflow: hidden` y `aria-hidden="true"`).
2. Dentro, un panel del 100 % del alto, de color {{color}}, colocado justo debajo de la pantalla.
3. Pega al borde superior del panel un **lóbulo**: un bloque del mismo color, del ancho de la pantalla y de {{curve}} % de alto de la pantalla, con `border-radius: 50% 50% 0 0 / 100% 100% 0 0` y `transform-origin` abajo. Pega otro igual al borde inferior, con las esquinas al revés y `transform-origin` arriba. Los dos solapan 1 px con el panel, para que no asome una línea entre ellos.
4. En el centro del panel, el texto «{{label}}» en blanco o en negro, el que tenga más contraste con {{color}} (mínimo 4,5:1).
5. Engancha la navegación según el proyecto:
<!-- solo: nextjs -->
   - **Next.js (App Router):** un componente cliente `TransitionLink` que envuelve `next/link`. En un clic izquierdo sin teclas modificadoras sobre un enlace interno, cancela la navegación por defecto, cubre, llama a `router.push(href)` y destapa cuando cambie `usePathname()`. Monta la capa en `app/layout.tsx`.
<!-- fin -->
<!-- solo: astro, html -->
   - **Astro o HTML de varias páginas:** intercepta los clics en enlaces internos, cubre, guarda una marca en `sessionStorage` y navega con `location.href`. En la página nueva, un script pequeño en el `<head>` deja la cortina cubriendo si encuentra la marca, antes del primer pintado. Al cargar, destapa y borra la marca.
<!-- fin -->
6. Los enlaces siguen siendo `<a href>` reales: sin JavaScript tienen que funcionar igual.

## 4. Comportamiento paso a paso

1. **Cubrir:** anima el panel de `translateY(calc(100% + altura del lóbulo))` a `translateY(0)` y, a la vez, el lóbulo superior de `scaleY(1)` a `scaleY(0)`. Duración {{duration}} s y easing `cubic-bezier(0.76, 0, 0.24, 1)`. La curva se aplana justo al tapar.
2. **Cambiar:** cuando acaben las dos animaciones (promesa `finished`), cambia de página, lleva el scroll arriba y espera 0,25 s con el texto a la vista.
3. **Descubrir:** anima el panel de `translateY(0)` a `translateY(calc(−100% − altura del lóbulo))` y el lóbulo inferior de `scaleY(0)` a `scaleY(1)`, con la misma duración y easing.
4. Al terminar, devuelve el panel a su sitio de partida, sin animar.
5. Mientras dura, ignora los clics nuevos de navegación. Si la página nueva tarda más de 3 s, destapa igualmente.
6. Atrás y Adelante del navegador navegan sin cortina.

## 5. Parámetros configurables

- Color de la cortina: {{color}}.
- Duración de cada fase (cubrir y descubrir): {{duration}} s.
- Altura de la curva: {{curve}} % de la altura de la pantalla.
- Texto en la cortina: «{{label}}» (puede ir vacío).

Defínelos como constantes o variables CSS en un solo sitio.

## 6. Responsive

- Usa unidades relativas para la curva (`vh` o un porcentaje): así no hay que medir la ventana y no se rompe al cambiar de tamaño.
- El texto usa `clamp()` para leerse bien de 375 a 1440 px de ancho.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, no muevas la cortina: cambia de página con un fundido de 150 ms de la página nueva (`opacity` de 0 a 1).
- Tras cambiar de página, mueve el foco al `<h1>` de la nueva (con `tabindex="-1"`) y anuncia su título en una región `aria-live="polite"`.
- La capa no recibe clics ni foco y los lectores de pantalla la ignoran.

## 8. Rendimiento

- Anima solo `transform` (y `opacity` en el modo reducido). Nada de animar `height`, `top` ni el trazado de un SVG.
- `will-change: transform` en el panel solo mientras dura la transición.
- No dejes animaciones ni listeners vivos al desmontar.

## 9. Criterios de validación

- Al pulsar un enlace interno, la cortina sube con el borde curvo, que se endereza al tapar; se ve «{{label}}», cambia la página y la cortina sale por arriba con una curva por debajo.
- Al terminar de cubrir no asoma ninguna línea de la página de debajo. Compruébalo a 1366 × 768 y a 390 × 844.
- El texto de la cortina se lee con cualquier color (contraste de 4,5:1 o más).
- Atrás y Adelante funcionan, y pulsar dos enlaces seguidos no deja la página tapada.
- Con movimiento reducido solo hay un fundido corto, y la consola no muestra errores.
