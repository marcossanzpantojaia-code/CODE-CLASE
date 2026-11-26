---
id: I18N-001
titulo: Internacionalización — rutas por idioma en Next.js (proxy + `[lang]` + diccionarios en servidor) y `hreflang` según Google
categoria: seo
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (Next.js "Internationalization", act. 2026-06-10; Google Search Central "Localized versions")
versiones: Next.js App Router (proxy.ts, `next/root-params`)
perfil: comercial
ultima_revision: 2026-10-27
---

# I18N-001 · Webs en varios idiomas

1. **Finalidad.** Web de un negocio en español + inglés (o catalán, etc.) con URLs propias por idioma, sin JS de traducción en el cliente y correctamente indicada a Google.
2. **Fuentes.** https://nextjs.org/docs/app/guides/internationalization ; https://developers.google.com/search/docs/specialty/international/localized-versions .
3. **Next.js [docs].**
   - Detectar idioma con la cabecera `Accept-Language` (`negotiator` + `@formatjs/intl-localematcher` → `match(idiomas, locales, porDefecto)`).
   - Rutas por **subruta** (`/es/servicios`) o por **dominio**; en `proxy.ts`, si la ruta no lleva idioma, redirigir a `/${locale}${pathname}`; `matcher` que excluya `_next`.
   - Todo `app/` dentro de `app/[lang]/` (también el layout raíz, con `<html lang={lang}>`).
   - **Diccionarios JSON** cargados con `import()` en un módulo `server-only` (`getDictionary(locale)`), con `hasLocale()` que estrecha el tipo y devuelve 404 si el idioma no existe → las traducciones **no** van al bundle del cliente.
   - `next/root-params`: `lang()` lee el idioma en cualquier Server Component o utilidad de servidor sin pasarlo por props (no funciona en Client Components, Server Actions ni Route Handlers).
   - `generateStaticParams` → `[{ lang: 'es' }, { lang: 'en' }]` para prerenderizar.
   - Librerías citadas: next-intl, next-international, next-i18n-router, paraglide-next, lingui, tolgee, next-intlayer, gt-next.
4. **hreflang [Google].**
   - Tres métodos equivalentes (elegir uno): `<link rel="alternate" hreflang>` en `<head>`, cabecera HTTP `Link` (PDF), o sitemap con `xhtml:link`.
   - Cada versión se lista **a sí misma y a todas las demás**; el conjunto debe ser idéntico en todas; si no hay enlaces de vuelta, Google ignora las anotaciones.
   - URLs absolutas; `x-default` para la página de elección/idioma no soportado.
   - Códigos: idioma ISO 639-1 (+ región ISO 3166-1 alfa-2 opcional): `es`, `es-ES`, `ca`, `en-GB`; **no** solo región; **no** `UK` (usar `GB`), `EU`, `UN`; `es-419` no admitido.
5. **Procedimiento [síntesis].**
   1. Decidir idiomas y si hay variantes regionales reales (precios, teléfono): si no, códigos solo de idioma.
   2. Next.js: `alternates.languages` en la Metadata API para generar los `hreflang` [conocimiento general, verificar en la doc de Metadata] o sitemap con alternativas (SEO-001/002).
   3. Selector de idioma con enlaces reales (`<a hreflang lang>`), no solo detección automática; guardar la elección.
   4. NAP y JSON-LD `LocalBusiness` coherentes en cada idioma (SEO-003); `inLanguage` en contenido.
   5. Astro: equivalente con rutas `src/pages/[lang]/` o el i18n integrado de Astro [conocimiento general, verificar].
6–13. **Aplicaciones.** Clínica con pacientes extranjeros, barbería en zona turística, despacho con clientes internacionales.
14. **Pruebas.** Cada URL devuelve su idioma y `lang` correcto; hreflang recíproco (todas las versiones); redirección del proxy no afecta a robots ni a `sitemap.xml`; sin texto mezclado.
15. **Estado.** Docs leídas; no implementado.
