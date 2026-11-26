---
id: SEO-001
titulo: SEO técnico esencial según Google Search Central (y qué ignorar)
categoria: seo
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (Google Search Central — SEO Starter Guide)
versiones: guía vigente (consulta 2026-10-26)
perfil: ambos (crítico en comercial)
ultima_revision: 2026-10-26
---

# SEO-001 · SEO técnico básico

1. **Finalidad.** Que las webs que construya Claude Code sean rastreables, entendibles y presentables en Google, sin mitos.
2. **Fuente.** developers.google.com/search/docs/fundamentals/seo-starter-guide.
3. **Hacer (docs).**
   - **Enlaces rastreables** con texto descriptivo (`<a href>` real; `nofollow` para enlaces no confiables o de usuarios).
   - `<title>` **único, claro y conciso** por página; meta description corta y única (Google la usa a veces para el snippet).
   - Encabezados para el usuario (la guía dice que orden y número no afectan a Search).
   - Imágenes nítidas junto al texto relacionado, con `alt` descriptivo.
   - URLs legibles con palabras; directorios por temas en sitios grandes.
   - **Una URL por contenido**: redirigir duplicados o `rel="canonical"`.
   - Sitemap opcional (muchos CMS lo generan); priorizar descubrimiento por enlaces.
   - Google debe ver la página como un usuario: no bloquear CSS/JS; comprobar con la herramienta de inspección de URL de Search Console.
   - Datos estructurados válidos → elegibilidad para resultados enriquecidos (p. ej. breadcrumbs).
4. **No preocuparse (docs).** Meta keywords (ignorada), palabras clave en el dominio/URL (efecto mínimo), longitud del contenido como objetivo, subdominio vs subdirectorio, E-E-A-T "no es un factor de ranking" según la guía; el relleno de palabras clave **viola** las políticas de spam.
5. **Aplicación a la biblioteca (análisis propio).** Titulares solo en WebGL (TXT3D-001) o solo en imágenes (CASE-001) son invisibles para buscadores → duplicar en HTML; enlaces `<a>` sin `href` (TUT-003) no son rastreables; `metadata` por defecto "Create Next App" (TUT-001/003/011) → título/descripción reales; contenido dentro de `<Scroll html>` de R3F → verificar renderizado.
6. **Dependencias.** En Next.js: API `metadata`/`generateMetadata` (no analizada en este lote).
7. **Procedimiento.** Checklist por página: title, description, canonical, h1 único y visible en HTML, alt, enlaces reales, sitemap/robots, datos estructurados (LocalBusiness para negocios locales: verificar en la documentación de datos estructurados, no analizada aquí).
8–9. **Código.** n/a.
10. **Errores habituales.** Contenido principal renderizado solo en cliente tras animación; texto en canvas; URLs duplicadas por parámetros.
11. **Accesibilidad.** Coincide en gran parte (alt, enlaces, encabezados).
12. **Compatibilidad.** n/a.
13. **Aplicaciones.** Barberías, clínicas y despachos: búsqueda local.
14. **Pruebas.** Search Console (inspección de URL), Lighthouse SEO, validador de datos estructurados.
15. **Estado de evidencia.** Guía oficial leída (resumen). Detalles de móvil y datos estructurados en guías aparte, no analizadas.
