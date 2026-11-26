---
id: ASTRO-002
titulo: Sitio Astro 5 completo — colecciones de contenido tipadas, paginación, isla de formulario, sitemap
categoria: architecture
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (Coding in Public, `astro-course-files`, rama module-6.21, sin licencia) (TUT-026)
versiones: astro ^5.5.2, @astrojs/react ^4.2.1, @astrojs/sitemap ^3.2.1, react 19, react-hot-toast
perfil: comercial (A)
ultima_revision: 2026-10-26
---

# ASTRO-002 · Astro 5 en la práctica

1. **Finalidad.** Plantilla para la web de un negocio con blog/novedades, servicios y proyectos, casi sin JavaScript; completa ASTRO-001.
2. **Fuente.** Chris Pennington (Coding in Public), https://github.com/coding-in-public/astro-course-files — 212 ramas (lesson-*, module-*); leída la última, `module-6.21` (commit a82b5ec, 2025-03-15). Curso asociado no consultado (puede ser de pago); vídeos **no vistos**. El propio autor avisa en `global.css` de que el CSS **no** sigue buenas prácticas porque el curso se centra en Astro.
3. **Estructura [COD].** `src/content.config.ts`, `src/content/{blog/*.md, projects.yaml, features.json}`, `src/layouts/{Layout, BaseHead, Nav, Footer}.astro`, `src/components/{ui,blog,home}/…`, `src/pages/{index, projects, 404}.astro`, `src/pages/blog/[...page].astro`, `src/data/siteData.ts`, alias `@/`.
4. **Content Layer de Astro 5 [COD].**
   - Cargadores: `glob({ pattern: "src/content/blog/**/*.md" })`, `file("src/content/features.json")`, `file("…projects.yaml")` y uno **asíncrono** que hace `fetch` a una API y devuelve `{id, name}` (autores).
   - Esquemas Zod con límites pensados para SEO: `title: z.string().max(65)`, `description: z.string().max(160)`; `image: image()` (optimización de imágenes de Astro); `author: reference("authors")` (relación entre colecciones); `isDraft` opcional.
   - Proyectos con `href: z.string().url()`.
5. **Páginas [COD].** `getStaticPaths` con `paginate(posts, { pageSize: 3 })` tras filtrar borradores (`getCollection("blog", ({data}) => !data.isDraft)`) y ordenar por fecha; `page.url.prev/next` para la paginación; `<section aria-label=…>` para la rejilla.
6. **Interactividad [COD].** Único componente React: `ContactForm` con `client:visible` (se hidrata al entrar en pantalla); `react-hot-toast` para avisos. Integraciones: `sitemap()` y `react()`.
7. **Errores detectados [COD].**
   - En `ContactForm`, si falta el email se hace `return` sin `setIsSubmitting(false)` → botón bloqueado; el envío es simulado (`setTimeout`). Para producción: endpoint/Action de Astro con validación en servidor (SEC-002).
   - `<link rel="sitemap" href="/sitemap-index.html">` → la integración genera `sitemap-index.xml` [conocimiento general; verificar].
   - Google Fonts por CDN (preconnect) en vez de autoalojar (rendimiento y RGPD [EST]).
   - Errata `aria-label="Blog Pposts"`; conviven `[page].astro` y `[...page].astro` en `blog/` (rutas solapadas; comprobar cuál gana).
   - La colección de autores depende de una API externa en build (si falla, falla el build).
8. **Procedimiento profesional.**
   1. Contenido del negocio (servicios, equipo, horarios, FAQ) como colecciones `file()` en JSON/YAML con esquema → editar sin tocar componentes.
   2. Límites de `title`/`description` en el esquema = SEO garantizado en build.
   3. Islas solo para formulario, mapa y galería (`client:visible`).
   4. JSON-LD LocalBusiness generado desde `siteData` (SEO-002/003).
9–13. **Aplicaciones.** Webs del perfil A con blog o novedades; portfolio.
14. **Pruebas.** Build sin red (colección remota); validación de esquemas con datos erróneos; Lighthouse; sitemap generado.
15. **Estado.** Código leído; no ejecutado.

**Lote 19 — cambios de Astro 6/7 [doc, guías oficiales de actualización]:** `<ViewTransitions />` eliminado (usar `<ClientRouter />`); colecciones *legacy* eliminadas (`src/content.config.ts`, `loader` como `glob()` obligatorio, `getEntry()` en lugar de `getEntryBySlug()`, `id` en lugar de `slug`, `render(entry)` importado de `astro:content`, `z` desde `astro/zod` con Zod 4); Node ≥ 22.12 (astro 7.4.2 pide ≥ 22.23.4); Vite 8 y compilador Rust en Astro 7. Resumen en ASTRO-004 (apéndice lote 19). El código de esta ficha anterior a Astro 6 **no debe copiarse sin adaptar**.
