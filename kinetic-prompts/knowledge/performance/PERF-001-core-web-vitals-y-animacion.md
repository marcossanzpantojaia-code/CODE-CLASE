---
id: PERF-001
titulo: Core Web Vitals (LCP, INP, CLS) y su relación con animaciones, 3D y heros cinematográficos
categoria: performance
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (web.dev: vitals, lcp, optimize-lcp, inp, cls)
versiones: conjunto estable vigente (INP sustituyó a FID en 2024)
perfil: ambos (obligatorio en comercial)
ultima_revision: 2026-10-26
---

# PERF-001 · Core Web Vitals

1. **Finalidad.** Criterio objetivo de "página rápida y estable" que debe cumplir cualquier web, también la cinematográfica. Base para el presupuesto de movimiento y de assets.
2. **Fuente.** web.dev/articles/vitals, /lcp, /optimize-lcp, /inp, /cls (Google, documentación oficial).
3. **Umbrales (percentil 75 de cargas reales, por separado en móvil y escritorio).**

   | Métrica | Bueno | Mejorable | Malo |
   |---|---|---|---|
   | LCP (carga) | ≤ 2,5 s | 2,5–4,0 s | > 4,0 s |
   | INP (respuesta) | ≤ 200 ms | 200–500 ms | > 500 ms |
   | CLS (estabilidad) | ≤ 0,1 | 0,1–0,25 | > 0,25 |

4. **Qué mide cada una.**
   - **LCP:** cuándo se pinta el mayor elemento visible (img, imagen SVG, póster/primer frame de vídeo, fondo CSS `url()`, bloque de texto). Chromium excluye elementos con opacidad 0, los que cubren todo el viewport (tratados como fondo) y marcadores de baja entropía.
   - **INP:** latencia de clics, toques y teclas (no scroll ni hover).
   - **CLS:** desplazamientos inesperados agrupados en ventanas de sesión (cada salto < 1 s del anterior, ventana ≤ 5 s); cuenta la peor ventana. Se excluyen los saltos en los 500 ms posteriores a un clic/tecla y **las animaciones con `transform`**.
5. **Receta oficial para LCP (4 subpartes).** TTFB (~40 %: CDN, HTML en caché, SSR/prerender, ≤1 redirección) · retraso de carga (<10 %: imagen descubrible en el HTML, `fetchpriority="high"` en 1–2 imágenes, `preload` si solo está en CSS, **nunca `loading="lazy"` en la imagen LCP**, mismo origen) · duración de carga (~40 %: AVIF/WebP, tamaño correcto, CDN, caché larga, `font-display` distinto de auto/block) · retraso de render (<10 %: CSS crítico pequeño, sin scripts síncronos en `<head>`, **no renderizar el hero en cliente ni esperar a JS**, trocear tareas largas).
6. **Consecuencias para las técnicas de la biblioteca (análisis propio sobre las reglas oficiales).**
   - **Precargadores con temporizador** (TUT-003: 2 s fijos) y heros que empiezan con **opacidad 0** retrasan o anulan el candidato LCP → mostrar el contenido real desde el HTML y animar con `transform`/`clip-path` encima.
   - **Animar `left/top/width/height`** (TUT-002, TUT-003) puede generar CLS; con `transform` no cuenta.
   - **Canvas WebGL/hero 3D:** el texto real (h1) debe estar en el DOM; un GLB de 4–21 MB (TUT-004, TUT-014, TUT-015) compite con el LCP → cargar el 3D después del primer pintado y con póster (TJ-002).
   - **INP:** manejadores de `pointermove` pesados o `setState` por evento (TUT-004) alargan el procesamiento → refs y `quickTo`.
   - SplitText y divisiones por letra multiplican nodos (DOM grande perjudica INP).
7. **Medición.** Campo: CrUX, PageSpeed Insights, Search Console, librería `web-vitals`. Laboratorio: DevTools (LCP, INP, CLS) y Lighthouse (LCP, CLS; usa TBT en lugar de INP). El laboratorio infravalora CLS.
8. **Parámetros de presupuesto propuestos (adaptación, a validar por proyecto).** Perfil A: LCP ≤ 2,0 s en 4G simulado, CLS ≤ 0,05, JS de animación ≤ 60 KB gzip. Perfil B: mismos umbrales oficiales en la primera pantalla; el 3D se carga después.
9. **Código.** n/a (criterios).
10. **Problemas habituales.** Lazy-load del hero; fuentes que reflujan; imágenes sin `width/height`; contenido insertado arriba tras cargar; medir solo en escritorio.
11. **Accesibilidad.** Reducir movimiento también reduce trabajo de render.
12. **Compatibilidad.** INP/LCP/CLS se miden en Chromium; en Safari/Firefox, solo parte de las APIs.
13. **Aplicaciones.** Todas las webs; requisito de SEO (señal de experiencia de página).
14. **Pruebas.** Lighthouse móvil + DevTools Performance; PSI si hay URL pública; `web-vitals` en producción.
15. **Estado de evidencia.** Docs oficiales leídas. Umbrales literales. Consecuencias del §6 = análisis propio.
