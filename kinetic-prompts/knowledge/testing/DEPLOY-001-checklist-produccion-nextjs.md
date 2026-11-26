---
id: DEPLOY-001
titulo: Lista de comprobación antes de publicar una web Next.js (guía oficial de producción)
categoria: testing
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (nextjs.org/docs/app/guides/production-checklist, lastUpdated 2026-03-10)
versiones: Next.js App Router (docs 2026)
perfil: ambos
ultima_revision: 2026-10-26
---

# DEPLOY-001 · Checklist de producción Next.js

1. **Finalidad.** Revisión ordenada antes de entregar una web a un cliente.
2. **Fuente.** https://nextjs.org/docs/app/guides/production-checklist.
3. **Automático (no hay que hacer nada) [docs].** Server Components por defecto (no añaden JS al cliente), code-splitting por segmento de ruta, *prefetch* de `<Link>` visibles, prerenderizado en build, caché.
4. **Durante el desarrollo [docs].**
   - **Rutas/render:** layouts compartidos; `<Link>`; páginas de error y `not-found`; revisar dónde están los límites `"use client"`; `cookies()`/`searchParams` vuelven dinámica la ruta entera (en el layout raíz, toda la app) → usarlos a propósito y con `<Suspense>`.
   - **Datos:** obtener datos en Server Components; Route Handlers solo desde el cliente (no llamarlos desde Server Components); streaming con `loading.js`/Suspense; peticiones en paralelo; comprobar qué se cachea.
   - **UI/a11y:** formularios con Server Actions y validación en servidor; `app/global-error.tsx`; `app/global-not-found.tsx`; `next/font` (sin peticiones externas, menos CLS); `<Image>`; `<Script>` para terceros; `eslint-plugin-jsx-a11y`.
   - **Seguridad:** *tainting* de datos sensibles; en cada Server Action verificar autenticación y autorización (no confiar solo en el proxy/layout); capa de acceso a datos `server-only`; *rate limiting* en operaciones caras; `.env*` en `.gitignore` y solo lo público con `NEXT_PUBLIC_`; CSP (SEC-001).
   - **SEO:** Metadata API, imágenes OG, sitemap y robots (SEO-001/002).
   - **Tipos:** TypeScript + plugin (TS-001).
5. **Antes de publicar [docs].** `next build` y `next start` en local; Lighthouse en incógnito (simulado: contrastar con datos de campo); `useReportWebVitals` para enviar Core Web Vitals a analítica; `@next/bundle-analyzer`; Import Cost, Package Phobia, Bundle Phobia, bundlejs para el peso de dependencias.
6. **Añadidos de la biblioteca [criterio propio].** Tests E2E (TEST-001); cabeceras de seguridad comprobadas en la URL final; `prefers-reduced-motion` revisado; JSON-LD validado (SEO-002); contraste y objetivos (A11Y-003); imágenes con `sizes` (IMG-001).
7. **Procedimiento.** Recorrer §4–§6 como checklist en el README del proyecto; guardar el informe Lighthouse y el del bundle analyzer junto a la entrega.
8–14. —
15. **Estado.** Documentación leída; no aplicada a ningún proyecto.
