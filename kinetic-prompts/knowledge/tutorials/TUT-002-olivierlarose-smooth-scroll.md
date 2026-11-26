---
id: TUT-002
titulo: Smooth Scroll (Locomotive Scroll v5 + GSAP ScrollTrigger)
creador: Olivier Larose
identidad_verificada: SI
repo: https://github.com/olivierlarose/smooth-scroll
commit: 38b3ffe (2023-06-26)
licencia: ninguna declarada → no reproducir código
video_url: https://www.youtube.com/watch?v=-CYruydmDfg (embebido en el blog del autor, publicado 2023-06-25; NO visto)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-002 · Olivier Larose — Smooth Scroll

1. **Identidad.** Igual que TUT-001: la página `blog.olivierlarose.com/tutorials/smooth-scroll` enlaza este repo, la demo y el vídeo.
2. **Qué construye.** Una página de tres bloques: (a) hero con imagen de fondo que se "abre" de un marco recortado a pantalla completa y una imagen central que se encoge al hacer scroll; (b) frases que entran deslizándose desde la izquierda con scrub; (c) galería con imagen fijada a la izquierda y lista de nombres a la derecha que cambia la imagen al pasar el ratón.
3. **Stack.** Next.js 13.4.6, React 18.2, **gsap ^3.12.1** + ScrollTrigger, **locomotive-scroll ^5.0.0-beta.8** (no Lenis directamente; Locomotive v5 se apoya en Lenis).
4. **Archivos leídos.** `src/app/page.js`, `src/components/Intro/index.jsx`, `Description/index.jsx`, `Projects/index.jsx` y sus CSS.
5. **Técnicas extraídas.** → [CLIP-001](../transitions/CLIP-001-revelado-clip-path-scroll.md) (revelado con `clip-path: inset()` ligado al scroll); parallax por atributos de velocidad de Locomotive (complementa PX-001); pin de imagen con ScrollTrigger (ST-002); lista con imagen que cambia al hover (HOV-002, ver TUT-003).
6. **Fallos detectados.**
   - `Description`: ease escrito `"power3.Out"` (O mayúscula). **Verificado en el código fuente de gsap 3.12.2** (`_parseEase` / `_insertEase` en `src/gsap-core.js`): las claves registradas son `power3.out`, `Power3.easeOut` y `power3`; una cadena no reconocida devuelve el ease por defecto **sin avisar**. El efecto real usa el ease por defecto, no power3.
   - `Description`: anima `left` (propiedad de layout) en vez de `x` → provoca recálculo de layout en cada frame.
   - `Projects`: el `end` del pin se calcula una sola vez con la altura del documento al montar → se desajusta tras redimensionar, cargar fuentes o imágenes. Mejor `endTrigger` o `end` en función + `invalidateOnRefresh`.
   - Ningún `useLayoutEffect` revierte sus animaciones (sin `gsap.context().revert()` ni `useGSAP`) y la instancia de Locomotive nunca se destruye → fugas y duplicados en modo estricto (GS-001).
   - Cambio de imagen solo con `onMouseOver` sobre `div`: inaccesible con teclado y táctil.
   - `alt` genéricos ("project image").
7. **APIs / versiones.** Locomotive Scroll 5 estaba en beta en el commit; comprobar su estado actual antes de usarlo. Para la biblioteca se recomienda Lenis directo (LN-001).
8. **Huecos visuales.** Sensación de inercia de Locomotive frente a Lenis: requiere demo.
9. **Valor por perfil.** A: el revelado con clip-path y el texto con scrub son trasladables con mesura. B: alto como hero.
10. **Evidencia.** Lectura de código + lectura del código fuente de gsap 3.12.2 (descargado del registro npm a carpeta temporal, sin instalar ni ejecutar). Vídeo no visto.
