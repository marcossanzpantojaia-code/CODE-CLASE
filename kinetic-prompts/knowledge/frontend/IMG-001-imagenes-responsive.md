---
id: IMG-001
titulo: Imágenes responsive y optimizadas (srcset/sizes, picture, dimensiones, carga y prioridad)
categoria: frontend
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (web.dev Learn Responsive Design: "Responsive images" y "The picture element"; contraste con web.dev optimize-lcp, PERF-001)
versiones: HTML vigente
perfil: ambos (obligatorio)
ultima_revision: 2026-10-26
---

# IMG-001 · Imágenes responsive

1. **Finalidad.** Servir a cada dispositivo la imagen justa: sin saltos de layout, sin descargar 4K en móvil y con la imagen LCP cargando primero.
2. **Fuentes.** web.dev/learn/design/responsive-images y web.dev/learn/design/picture-element.
3. **Reglas (docs).**
   - CSS base: `img { max-inline-size: 100%; block-size: auto; }`; recortes con `aspect-ratio` + `object-fit: cover|contain` + `object-position`.
   - **Siempre `width` y `height`** en el `<img>` para reservar espacio (CLS).
   - `loading="lazy"` **solo bajo el pliegue**; la imagen del hero queda en `eager` con `fetchpriority="high"` (con moderación: puede quitar prioridad a scripts/fuentes).
   - Imágenes que no están en el HTML (fondos CSS, inyectadas por JS): `<link rel="preload" as="image" fetchpriority="high">`; mejor aún, ponerlas en el HTML.
   - **Anchos:** `srcset="s.jpg 300w, m.jpg 600w, l.jpg 1200w"` + `sizes="(min-width: 66em) 33vw, (min-width: 44em) 50vw, 100vw"` — `sizes` debe describir el ancho real de la imagen en el layout.
   - **Densidades:** `srcset="a.png 1x, b.png 2x"`; no mezclar `w` y `x` en el mismo `srcset`. Fondos CSS: `image-set()`.
   - **`<picture>`:** formatos con `<source type="image/avif">`, `<source type="image/webp">` y `<img>` JPEG de reserva (obligatorio; el navegador usa la **primera** fuente compatible → formatos preferidos primero). Dirección de arte con `media` (el navegador lo trata como **orden**, no como sugerencia). Con recortes distintos, `width/height` en cada `<source>`; un único `alt` válido para todos los recortes.
4. **Aplicación a la biblioteca (análisis propio).** ZOOM-001 escala la central ×4: necesita una fuente de al menos 4× su tamaño inicial en pantalla (no se comprobó qué resolución sirve la demo del autor); FLIP-002 termina a pantalla completa; CLIP-001/MASK-001 suelen ser la imagen LCP → no lazy, `fetchpriority="high"`.
5–8. **Procedimiento.** Generar 3–5 anchos por imagen (p. ej. 480/960/1440/1920), AVIF + WebP + JPEG; escribir `sizes` a partir del CSS; en Next.js, `next/image` genera `srcset` y exige dimensiones (verificar `priority`/`fetchPriority` en la versión del proyecto).
9. **Código.** Patrones de atributos en §3 (documentación).
10. **Errores habituales.** `sizes` omitido (el navegador asume 100vw y descarga de más); lazy en el hero; `alt` genérico (TUT-001/003/011); imágenes de 1 770 px para 40vmin (DRAG-001).
11. **Accesibilidad.** `alt` descriptivo o `alt=""` si es decorativa.
12. **Compatibilidad.** AVIF/WebP con reserva JPEG vía `<picture>`.
13. **Aplicaciones.** Todas las webs.
14. **Pruebas.** DevTools Network a 375/768/1440 px y DPR 1/2/3 (qué archivo se descarga), CLS, LCP.
15. **Estado de evidencia.** Docs leídas (resumen de la herramienta). `decoding="async"` aparece en los ejemplos pero la página no lo explica.
