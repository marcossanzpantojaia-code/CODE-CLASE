---
id: TUT-011
titulo: Zoom Parallax
creador: Olivier Larose
identidad_verificada: SI (ver TUT-001)
repo: https://github.com/olivierlarose/zoom-parallax
commit: f6dc2b2 (2024-01-13)
licencia: ninguna declarada → no reproducir código
video_url: no enlazado específicamente (la página del blog solo enlaza el canal @olivierlarose1)
blog: https://blog.olivierlarose.com/tutorials/zoom-parallax (publicado 2024-01-13) · demo: https://blog.olivierlarose.com/demos/zoom-parallax
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO + ARTICULO_AUTOR_ANALIZADO + DEMO_INSPECCIONADA (lote 5)
ultima_revision: 2026-10-26
---

# TUT-011 · Olivier Larose — Zoom Parallax

1. **Identidad.** La página del blog del autor enlaza este repo y la demo.
2. **Qué construye.** Un collage de 7 imágenes alrededor de una central; al hacer scroll todo escala desde el centro de la pantalla, las laterales "salen" hacia los bordes y la central acaba ocupando la pantalla.
3. **Stack.** Next 14.0.4, framer-motion ^10.18.0, @studio-freight/lenis ^1.0.33, Sass.
4. **Archivos leídos.** `src/components/ZoomParallax/index.jsx`, `styles.module.scss`, `src/app/page.js`.
5. **Técnicas extraídas.** → [ZOOM-001](../scrolltrigger/ZOOM-001-zoom-parallax-sticky.md). Clave observada: **cada imagen vive en una capa a pantalla completa centrada** y la escala se aplica a esa capa (no a la imagen); como la escala se hace desde el centro del viewport, las imágenes desplazadas del centro se alejan proporcionalmente. Imagen central 25vw×25vh × escala 4 = pantalla completa. Escalas por capa: 4, 5, 6, 5, 6, 8, 9. Contenedor 300vh con hijo sticky de 100vh.
6. **Fallos detectados.** Lenis sin `destroy()` ni cancelación del rAF; `alt="image"` en las 7 imágenes; posiciones en vw/vh fijas (en móvil vertical las imágenes de 20vw quedan muy estrechas); `metadata` por defecto.
7. **APIs.** `@studio-freight/lenis` → `lenis` (LN-001).
8. **Huecos visuales.** Densidad del collage en móvil: requiere demo/capturas.
9. **Valor.** A: medio (portada de galería de trabajos); B: alto.
10. **Evidencia.** Código y artículo leídos. No ejecutado. Vídeo no localizado.


**Lote 5:** demo pública del autor inspeccionada en el navegador integrado (`DEMO_INSPECCIONADA`); mediciones y capturas en ZOOM-001 y evidence/visual/2026-10-26. El vídeo sigue sin verse.
