# {{title}}

Animación de texto de nivel básico. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.

## 1. Objetivo visual

Al pasar el ratón por un titular (o al enfocarlo con el teclado), sus letras se convierten en caracteres que cambian sin parar, en {{accent}}, y se van fijando una a una, de izquierda a derecha, hasta mostrar el texto real en {{color}} sobre {{background}}. Todo dura {{duration}} s. Da un aire técnico, de código que se descifra.

## 2. Stack

- JavaScript sin dependencias, con `requestAnimationFrame`.
- Si el proyecto ya usa GSAP: el plugin ScrambleText (gratuito) hace lo mismo.

## 3. Estructura

Antes de escribir código, mira el proyecto y elige dónde va (titulares cortos de marca, enlaces de navegación o botones; nunca párrafos largos). Después:

1. El elemento con el texto real en `aria-label` y, dentro, un `<span aria-hidden="true">` con las letras que se animan. Si es un enlace, el `aria-label` va en el enlace.
2. Fuente monoespaciada para ese texto: el ancho no puede cambiar mientras las letras cambian.
3. Un segundo `<span>` dentro del primero para las letras aún cifradas, con el color {{accent}}.
<!-- solo: nextjs -->
4. **Next.js:** un componente cliente (`"use client"`) que recibe el texto, lo pinta tal cual en el servidor y anima en los eventos `onPointerEnter` y `onFocus`, cancelando el `requestAnimationFrame` al desmontar.
<!-- fin -->
<!-- solo: astro, html -->
4. **Astro o HTML:** el elemento en el HTML y un script que escucha `pointerenter` y `focus`.
<!-- fin -->

## 4. Comportamiento paso a paso

1. Al empezar, todas las letras (menos los espacios) muestran un carácter al azar del alfabeto «{{alphabet}}».
2. Cada 30 ms, las letras aún no fijadas cambian a otro carácter al azar.
3. El progreso p va de 0 a 1 en {{duration}} s; la letra i queda fijada en su valor real cuando p supera i / número de letras. Así se descifran de izquierda a derecha.
4. Al llegar a p = 1, deja el texto real y para el bucle.
5. Si se vuelve a pasar el ratón mientras dura, reinicia desde el principio (cancela el bucle anterior).

## 5. Parámetros configurables

- Color del texto: {{color}}.
- Color de las letras cifradas: {{accent}}.
- Color de fondo: {{background}}.
- Duración del descifrado: {{duration}} s.
- Caracteres del cifrado: {{alphabet}} (letras: A–Z; números y símbolos: 0–9 y #$%&*+=?<>; binario: 0 y 1).

## 6. Responsive

- En pantallas táctiles no hay hover: dispáralo una vez cuando el titular entra en pantalla (IntersectionObserver).
- El tamaño con `clamp()`; en móvil, textos de pocas palabras para que no se partan en muchas líneas.

## 7. Accesibilidad

- Con `prefers-reduced-motion: reduce`, muestra el texto real sin animar.
- El lector de pantalla lee solo el `aria-label`; las letras que cambian están ocultas. No pongas este texto en una región `aria-live`.

## 8. Rendimiento

- Un solo `requestAnimationFrame` mientras dura, y nada cuando termina o cuando la pestaña está oculta.
- Actualiza el texto con `textContent` o con dos `<span>`, no con muchos nodos por letra.

## 9. Criterios de validación

- Al pasar el ratón o enfocar, las letras se descifran de izquierda a derecha en {{duration}} s y terminan en el texto real.
- El ancho del titular no cambia durante la animación.
- Un lector de pantalla lee el texto real una sola vez.
- Con movimiento reducido no hay animación, y la consola no muestra errores.
