# {{title}}

Animación de texto de nivel intermedio. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

El titular, en {{color}} sobre {{background}}, aparece línea a línea: cada línea sube desde detrás de su propia máscara, como si saliera de una ranura, con {{stagger}} s de retraso entre una y la siguiente. Es elegante y editorial. Las líneas son las reales del titular, sea cual sea el ancho de la pantalla.

## 2. Stack

- JavaScript y la Web Animations API (`element.animate`), sin dependencias.
- Si el proyecto ya usa GSAP: SplitText (gratuito desde la 3.13) con `type: "lines"`, `mask: "lines"` y `autoSplit: true`, animando dentro de `onSplit()`.

## 3. Estructura

Antes de escribir código, mira el proyecto y localiza los titulares que deben animarse (normalmente el `<h1>` del hero y los `<h2>` de sección). Después:

1. Espera a que carguen las fuentes (`document.fonts.ready`) antes de dividir: con la fuente de respaldo, los cortes de línea serían otros.
2. Divide el texto en palabras (un `<span>` por palabra), agrúpalas por su posición vertical (`offsetTop`) y envuelve cada línea en un `<span>` con `display: block` y `overflow: hidden` (la máscara), con otro `<span>` dentro, que es el que se mueve.
3. Pon el texto completo en `aria-label` del titular y `aria-hidden="true"` en cada línea, para que los lectores de pantalla lo lean de una vez.
4. Vuelve a dividir al cambiar el ancho (con 150 ms de espera), solo si ha cambiado.
5. No uses `text-wrap: balance` en estos titulares: cambia los cortes después de dividir.
<!-- solo: nextjs -->
6. **Next.js:** un componente cliente (`"use client"`) que recibe el texto, lo pinta completo en el servidor (bueno para SEO) y lo divide en un `useEffect` al montar, limpiando listeners y animaciones al desmontar.
<!-- fin -->
<!-- solo: astro -->
6. **Astro:** el titular en el HTML y un `<script>` que lo divide y lo anima; con las View Transitions de Astro, vuelve a ejecutarlo en `astro:page-load`.
<!-- fin -->
<!-- solo: html -->
6. **HTML:** el titular en el HTML y un script con `defer` que lo divide y lo anima.
<!-- fin -->

## 4. Comportamiento paso a paso

1. Estado inicial de cada línea: `transform: translateY(105%)`, oculta bajo su máscara.
2. Cuando el titular entra en pantalla (IntersectionObserver, una sola vez) o al cargar si ya está visible: cada línea anima a `translateY(0)` en {{duration}} s con easing `cubic-bezier(0.33, 1, 0.68, 1)` (equivale a `power2.out`).
3. Cada línea empieza {{stagger}} s después de la anterior.
4. Al terminar, deja el titular quieto. Si se vuelve a dividir por un cambio de ancho, muéstralo ya colocado, sin repetir la animación.

## 5. Parámetros configurables

- Color del texto: {{color}}.
- Color de fondo: {{background}}.
- Duración de cada línea: {{duration}} s.
- Retraso entre líneas: {{stagger}} s.

## 6. Responsive

- Las líneas se recalculan con el ancho: a 375 px habrá más líneas que a 1440 px, y cada una entra por separado.
- El tamaño del titular con `clamp()`, para que no haya líneas de una sola palabra en móvil.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, el titular aparece entero y quieto, sin dividir.
- El titular se lee completo una sola vez (`aria-label`), y el texto sigue en el HTML para buscadores y para cuando no hay JavaScript.

## 8. Rendimiento

- Anima solo `transform`. Divide en líneas, no en letras: menos nodos.
- No vuelvas a dividir en cada `resize`: espera 150 ms y solo si cambia el ancho.

## 9. Criterios de validación

- Cada línea sube desde su máscara, escalonada {{stagger}} s, y el titular queda bien colocado.
- A 375 y a 1440 px, las líneas animadas coinciden con los cortes reales del titular.
- Un lector de pantalla lee el titular entero una sola vez.
- Sin JavaScript se ve el titular normal; con movimiento reducido, quieto. La consola no muestra errores.
