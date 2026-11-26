---
id: TUT-003
titulo: Awwwards Landing Page (recreación del portfolio de Dennis Snellenberg)
creador: Olivier Larose
identidad_verificada: SI (cuenta); vídeo asociado NO localizado
repo: https://github.com/olivierlarose/awwwards-landing-page
commit: 3fce019 (2023-08-01)
licencia: ninguna declarada → no reproducir código
video_url: no confirmada
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-003 · Olivier Larose — Awwwards Landing Page

1. **Identidad.** Repo de la cuenta verificada `olivierlarose` (repo más popular, ~217 estrellas según la página de perfil). No se ha localizado aún la página del blog ni el vídeo que lo acompañan.
2. **Qué construye.** Landing completa de portfolio: precarga con saludos en varios idiomas y salida con curva SVG; hero con texto en bucle infinito cuya dirección sigue al scroll; descripción con palabras que suben desde una máscara; lista de proyectos con vista previa flotante que sigue al cursor; carruseles de imágenes que se desplazan en sentidos opuestos; pie con botones "magnéticos"; menú lateral con borde curvo animado.
   - **Atención propiedad intelectual:** recrea el portfolio real de Dennis Snellenberg (cofundador de Osmo) e incluye su nombre, correo y teléfono en `Contact` y `Header`. Sirve para estudiar técnicas; **no** debe reutilizarse el diseño, la marca ni los datos.
3. **Stack.** Next.js 13.4.10, React 18.2, gsap ^3.12.2 (ScrollTrigger, `quickTo`), framer-motion ^10.13.0, locomotive-scroll ^5.0.0-beta.8, Sass.
4. **Archivos leídos.** Todos los `.jsx/.js` de `src/` (Magnetic, RoundedButton, Header + nav/Curve/Link, Landing, Preloader, Description, Projects, SlidingImages, Contact).
5. **Técnicas extraídas.**
   - [HOV-001](../interactions/HOV-001-boton-magnetico-quickto.md) — botón magnético con `gsap.quickTo` + relleno circular con timeline etiquetada.
   - [HOV-002](../interactions/HOV-002-preview-que-sigue-cursor.md) — vista previa de proyecto que sigue al cursor.
   - Texto por palabras con máscara (`overflow: hidden` + `y: 100%`) → complementa TXT-001 (tema 2).
   - Marquesina infinita cuya dirección depende de `self.direction` de ScrollTrigger (tema 1/14).
   - Menú y precarga con morph del atributo `d` de un path SVG (curva cuadrática) → primer material del **tema 8** (transformaciones); pendiente contrastar con MorphSVG.
6. **Fallos detectados.**
   - `Magnetic`: añade listeners `mousemove`/`mouseleave` sin retirarlos y deja un `console.log` en producción.
   - `Landing`: bucle `requestAnimationFrame` de la marquesina que nunca se cancela; ScrollTrigger sin revertir.
   - `Projects`: `quickTo` sobre `left`/`top` (layout) en lugar de `x`/`y` (transform).
   - Precarga fija de 2 s con `setTimeout` antes de mostrar contenido → retrasa LCP aunque todo esté cargado.
   - Enlaces `<a>` sin `href` en cabecera y pie (no enfocables); botones construidos con `div` + `onClick` (sin rol ni teclado).
   - `Header`: `end: window.innerHeight` fijo; `gsap.to()` con un segundo argumento extra que en realidad es una llamada a `setIsActive` (efecto lateral escondido).
   - Imágenes con `alt="image"`. Sin reduced motion.
   - `metadata` por defecto ("Create Next App").
7. **APIs.** `import { ScrollTrigger } from 'gsap/all'` funciona pero importa más de lo necesario; usar `gsap/ScrollTrigger`.
8. **Huecos visuales.** Curvas de easing y temporización global de la precarga; ver demo publicada o capturas.
9. **Valor por perfil.** A: botón magnético y preview de hover son microinteracciones de alto valor si se hacen accesibles. B: referencia de "landing completa" (tema 15) de estilo Awwwards.
10. **Evidencia.** Lectura de código. No ejecutado. Vídeo no localizado ni visto.
