---
id: CSS-006
titulo: Botón de neón solo con CSS (brillo en em, reflejo en el suelo, encendido en hover y foco)
categoria: css
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (CodePen de Kevin Powell, MIT) (TUT-022)
versiones: CSS (sin JS)
perfil: ambos
ultima_revision: 2026-10-26
---

# CSS-006 · Neon button (Kevin Powell)

1. **Finalidad.** CTA con aspecto de tubo de neón que "se enciende" al pasar el ratón o enfocar con teclado (temas 2 y 6).
2. **Fuente.** https://codepen.io/kevinpowell/pen/QWdRzON (MIT; leído literal 2026-10-26). Vídeo asociado: no enlazado en el pen; no buscado ni visto.
3. **Ubicación.** CSS del pen (~70 líneas); HTML: un `<a class="neon-button">`.
4. **Resultado (según código).** Texto y borde magenta con halo; un reflejo borroso en el "suelo" bajo el botón; en hover/foco el botón se rellena de color y el halo crece.
5. **Explicación técnica [COD].**
   - **Todo en `em`:** borde 0,125em, padding 0,25em 1em, radios y sombras en em → cambiar `font-size` escala el efecto entero.
   - **Brillo del texto:** `text-shadow: 0 0 .125em rgba(255,255,255,.3), 0 0 .45em currentColor`.
   - **Brillo del borde:** `box-shadow: inset 0 0 .5em 0 var(--clr-neon), 0 0 .5em 0 var(--clr-neon)` (dentro y fuera).
   - **Reflejo en el suelo:** `::before` del mismo color, `top: 120%`, `transform: perspective(1em) rotateX(40deg) scale(1, .35)` + `filter: blur(1em)`, opacidad 0,7 → 1 en hover. Truco: `perspective` dentro del propio `transform` (no hace falta contenedor).
   - **Encendido:** `::after` con fondo y `box-shadow: 0 0 2em .5em` a `opacity: 0`; en `:hover, :focus` pasa a 1 con `transition: opacity 100ms linear`; el texto cambia al color del fondo.
   - Solo se anima **opacidad** → barato (las sombras ya están pintadas en capas).
6. **Dependencias.** Ninguna.
7. **Procedimiento profesional (adaptación).**
   1. Usar `:focus-visible` en lugar de `:focus` (A11Y-004 y nota de foco) y un `<button>` o `<a href>` real (el pen usa `href="#"`).
   2. Color en `oklch`/`hsl` con variable y comprobar contraste.
   3. Reduced motion: no aplica (no hay movimiento), pero evitar parpadeos tipo "neón averiado" (WCAG 2.3.1).
8. **Parámetros.** `--clr-neon: hsl(317 100% 54%)`, `--clr-bg: hsl(323 21% 16%)`, font-size 4rem, reflejo `rotateX(40deg) scale(1,.35)`, transición 100 ms.
9. **Código (MIT, adaptado: el original usa `top/left/width` en vez de `inset`):**
   ```css
   .neon-button::before { content: ""; position: absolute; inset: 120% 0 auto; height: 100%;
     background: var(--clr-neon); transform: perspective(1em) rotateX(40deg) scale(1, .35); filter: blur(1em); opacity: .7; }
   ```
10. **Problemas / verificación.**
    - [CALC] Contraste neón (#FF14BD) sobre fondo (#31202B) = **4,42:1**: no llega a 4,5:1 para texto normal; vale para texto grande (≥ 18 pt / 24 px — aquí 4rem). En hover (texto color fondo sobre relleno neón) también 4,42:1. Si se reduce el tamaño, aclarar el neón.
    - `href="#"` y `body { padding-right: 10rem }` del pen (artefacto de la demo).
11. **Rendimiento / a11y.** `filter: blur` estático (no animado) → coste solo al pintar. Ver A11Y-003 para contraste.
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** Barbería con estética nocturna, bar, eventos, web *gaming*; en clínica/despacho, no.
14. **Pruebas.** Tab hasta el botón (foco visible); zoom 200 %; modo de alto contraste de Windows (las sombras desaparecen: el borde debe bastar).
15. **Estado de evidencia.** Código literal leído; contraste calculado; no ejecutado.
