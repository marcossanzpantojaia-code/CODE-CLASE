---
id: SEO-002
titulo: Metadatos en Next.js (Metadata API, OG, sitemap/robots) y datos estructurados LocalBusiness
categoria: seo
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (nextjs.org "Metadata and OG images", act. 2026-08-25; Google Search Central "Local business structured data")
versiones: Next.js App Router (oct-2026)
perfil: comercial (crítico para negocio local)
ultima_revision: 2026-10-26
---

# SEO-002 · Metadata + LocalBusiness

1. **Finalidad.** Implementar en Next.js lo que pide SEO-001 y hacer elegible al negocio para resultados locales enriquecidos.
2. **Fuentes.** nextjs.org/docs/app/getting-started/metadata-and-og-images · developers.google.com/search/docs/appearance/structured-data/local-business.
3. **Next.js (docs).** Export `metadata` (estático) o `generateMetadata` (datos dinámicos) **solo en Server Components** (layout/page); `charset` y `viewport` se añaden siempre; para páginas dinámicas, los metadatos se transmiten en *streaming* salvo para bots que los esperan en `<head>` (configurable con `htmlLimitedBots`); `cache()` de React para no pedir dos veces los mismos datos; archivos especiales: `favicon.ico`/`icon`/`apple-icon`, `opengraph-image`/`twitter-image` (estáticos o generados con `ImageResponse` 1200×630, solo flexbox y un subconjunto de CSS), `robots.txt`/`robots.ts`, `sitemap.xml`/`sitemap.ts`.
4. **LocalBusiness (Google).** Obligatorios: `name`, `address` (PostalAddress lo más completo posible). Recomendados: `geo` (≥ 5 decimales), `telephone` con prefijo de país, `url` de la ubicación, `openingHoursSpecification` (formatos especiales para pasada la medianoche y 24 h), `priceRange` (< 100 caracteres), `department` para unidades internas. **`aggregateRating`/`review` no deben usarse para valorarse a uno mismo.** Usar el **subtipo más específico** de schema.org (la página muestra Restaurant, Store, DaySpa, HealthClub; para barbería, clínica dental o despacho, buscar el subtipo correspondiente en schema.org — **no verificado aquí**); varios tipos en array; `additionalType` no soportado. Formato JSON-LD en `<script type="application/ld+json">`. Validar con Rich Results Test y la inspección de URL; violaciones → acción manual.
5. **Procedimiento para Claude Code (propuesta).** `app/layout.tsx` con `metadata` base (`title.template`, `description`, `openGraph`); `generateMetadata` por servicio/página; `sitemap.ts` y `robots.ts`; componente servidor que inserte el JSON-LD del negocio con datos reales (nombre, dirección, teléfono, horario) coherentes con Google Business Profile.
6–9. Ver §3–5.
10. **Errores habituales.** Metadatos por defecto "Create Next App" (TUT-001/003/011); reseñas propias en el marcado; horario del JSON-LD distinto del real.
11. n/a. 12. n/a.
13. **Aplicaciones.** Barbería, clínica, despacho (búsqueda local).
14. **Pruebas.** Rich Results Test, inspección de URL, vista previa de OG en redes.
15. **Estado de evidencia.** Docs oficiales leídas. Subtipos concretos y campos de `title.template` (citado como práctica, no leído en detalle) pendientes de verificar.

**Lote 9:** factores oficiales del ranking local y relación con la web → [SEO-003](SEO-003-seo-local-perfil-de-empresa.md).
