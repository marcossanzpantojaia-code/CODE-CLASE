---
id: TUT-001
titulo: Cards Parallax (pila de tarjetas al hacer scroll)
creador: Olivier Larose
identidad_verificada: SI
repo: https://github.com/olivierlarose/cards-parallax
commit: 2953b03 (2023-11-12)
licencia: ninguna declarada → no reproducir código
video_url: https://www.youtube.com/watch?v=am0ZueQmpzg (enlazado desde el blog del autor; NO visto)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-001 · Olivier Larose — Cards Parallax

1. **Identidad.** La cuenta GitHub `olivierlarose` enlaza a olivierlarose.com → blog.olivierlarose.com; la página del tutorial en ese blog enlaza este repositorio, una demo (blog.olivierlarose.com/demos/cards-parallax) y el vídeo de YouTube del canal `@olivierlarose1`. Cadena completa creador ↔ repo ↔ vídeo.
2. **Qué construye.** Una lista de proyectos donde cada tarjeta ocupa una pantalla, se queda pegada arriba y, a medida que llegan las siguientes, las anteriores se encogen formando una pila escalonada. La imagen interior de cada tarjeta hace un "zoom-out" al entrar.
3. **Stack.** Next.js 14.0.2 (App Router), React 18, **framer-motion ^10.16.4** (no GSAP), `@studio-freight/lenis` ^1.0.27, Sass.
4. **Archivos leídos.** `src/app/page.js`, `src/components/Card/index.jsx`, `src/components/Card/style.module.scss`, `src/app/globals.css`, `src/data.js`, `package.json`. ~25 archivos en total.
5. **Técnicas extraídas.** → [CARD-001](../scrolltrigger/CARD-001-pila-tarjetas-sticky.md) (pila de tarjetas con `position: sticky` + escala por progreso). Uso de Lenis → complementa [LN-001](../lenis/LN-001-lenis-scrolltrigger.md).
6. **Fallos detectados.**
   - `page.js`: el efecto que crea Lenis **no tiene array de dependencias ni limpieza** → no se llama a `destroy()` ni se cancela el bucle `requestAnimationFrame`. En modo estricto de React (desarrollo) se crean dos instancias.
   - `data.js` define la URL de cada proyecto como `link`, pero `Card` espera `url` → el enlace "See more" queda **sin href** (análisis estático; confirmar en demo).
   - Tarjeta de tamaño fijo en píxeles (ancho 1000 × alto 500) → no responsive.
   - `alt="image"` genérico en todas las imágenes.
   - El rango de cada tarjeta usa un paso fijo (0,25) que solo encaja con 5 tarjetas: añadir o quitar tarjetas rompe el ritmo.
   - `body { margin-bottom: 100vh }` como relleno para que termine la pila.
   - Sin `prefers-reduced-motion`.
7. **APIs obsoletas.** El paquete `@studio-freight/lenis` fue sustituido por `lenis` (ver LN-001, Lenis 1.3.x). `framer-motion` se publica hoy también como `motion`; verificar la API antes de reutilizar.
8. **Huecos visuales.** Curva de easing percibida y comportamiento en móvil: requieren ver la demo o capturas.
9. **Valor por perfil.** A: alto (portfolio de servicios/casos de éxito) si se hace responsive y accesible. B: medio.
10. **Evidencia.** Solo lectura de código. No ejecutado. Vídeo no visto.
