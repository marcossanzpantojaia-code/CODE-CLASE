# {{title}}

Transición de página de nivel básico. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Al cambiar de página, la página vieja se desvanece mientras sube un poco y la nueva aparece desde {{shift}} px más abajo, en {{duration}} s. Es un cambio suave y discreto, sin pantallazo en blanco, que hace el propio navegador con la View Transitions API.

## 2. Stack

- Sin dependencias: CSS y la View Transitions API del navegador.
<!-- solo: nextjs -->
- Next.js 16 (App Router): el componente `<ViewTransition>` de React 19.3, que funciona sin configuración.
<!-- fin -->
<!-- solo: astro, html -->
- Astro y webs de HTML con varias páginas: transiciones entre documentos con la regla CSS `@view-transition`.
<!-- fin -->
- Es mejora progresiva: en un navegador sin soporte, la página cambia igual, sin animación.

## 3. Estructura

Antes de escribir código, mira el proyecto: qué framework usa y dónde están los estilos globales. Después, según el caso:

<!-- solo: nextjs -->
- **Next.js (App Router):** envuelve el contenido de cada `page.tsx` (no el layout, que no se desmonta al navegar) en `<ViewTransition>` de React, con `enter` y `exit` iguales a una clase propia, por ejemplo `kp-fade`, y `default="none"`. Define las animaciones de esa clase en los estilos globales con `::view-transition-old(.kp-fade)` y `::view-transition-new(.kp-fade)`.
<!-- fin -->
<!-- solo: astro, html -->
- **Astro o HTML de varias páginas:** añade `@view-transition { navigation: auto; }` a los estilos globales de todas las páginas y anima `::view-transition-old(root)` y `::view-transition-new(root)`. Las dos páginas tienen que ser del mismo dominio.
<!-- fin -->
- **Cambios dentro de una misma página** (pestañas, filtros): envuelve el cambio en `document.startViewTransition(() => actualizar())` y, si no existe, llama a `actualizar()` sin más.

## 4. Comportamiento paso a paso

1. Quita la animación del grupo raíz (`::view-transition-group(root) { animation: none; }`): la página no tiene que moverse de sitio, solo fundirse.
2. **Página vieja:** de `opacity: 1` a `0` y de `translateY(0)` a `translateY(−{{shift}} px / 2)`, en {{duration}} s con easing `{{ease}}`.
3. **Página nueva:** de `opacity: 0` y `translateY({{shift}} px)` a `opacity: 1` y `translateY(0)`, a la vez y con la misma duración y easing.
4. Si llega una navegación nueva en mitad de una transición, deja que el navegador la salte (es su comportamiento por defecto): no encoles transiciones.
5. No le pongas `view-transition-name` a nada más, salvo que quieras que un elemento concreto viaje entre páginas. Los nombres repetidos en una misma página cancelan la transición.

## 5. Parámetros configurables

- Duración: {{duration}} s (entre 0,15 y 0,8 s).
- Desplazamiento de la página nueva: {{shift}} px.
- Easing: {{ease}}.

Guárdalos como variables CSS en `:root` (`--vt-duracion`, `--vt-desplazamiento`, `--vt-easing`) y úsalos en las animaciones.

## 6. Responsive

- Funciona igual en todos los anchos. En móvil, si el desplazamiento se ve brusco, usa la mitad de {{shift}} px con una media query `(max-width: 600px)`.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, sin desplazamiento: solo un fundido de opacidad de 150 ms en la página nueva.
- Tras navegar, el foco va al `<h1>` de la página nueva (con `tabindex="-1"`) y su título se anuncia en una región `aria-live="polite"`.
<!-- solo: nextjs -->
- En Next.js, mueve el foco en un efecto que dependa de `usePathname()`.
<!-- fin -->

## 8. Rendimiento

- Anima solo `opacity` y `transform`. Las capturas de la transición ocupan memoria: mantén la duración por debajo de 0,8 s.
- No bloquees la interacción: con {{duration}} s, la página nueva responde enseguida.

## 9. Criterios de validación

- Al navegar, la página vieja se funde y la nueva aparece subiendo {{shift}} px en {{duration}} s, sin pantallazo en blanco.
- En un navegador sin View Transitions (desactívalas o prueba en uno antiguo), la página cambia igual y sin errores.
- Con movimiento reducido solo hay un fundido de 150 ms.
- Atrás y Adelante funcionan y la consola no muestra errores ni avisos.
- Pruébalo en Chrome, Safari y Firefox (Firefox desde la versión 144).
