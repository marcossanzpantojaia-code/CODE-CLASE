---
id: ASTRO-003
titulo: Portfolio Astro de una sola página bien acabado (midudev) — cabecera SEO completa, tema de 3 estados, animaciones solo CSS ligadas al scroll, navegación activa
categoria: architecture
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (`midudev/porfolio.dev`, licencia CC BY-NC 4.0 → solo paráfrasis) (TUT-032)
versiones: fuente — astro 4.4.5, @astrojs/tailwind 5.1, tailwindcss 3.4, @fontsource-variable/onest, astro-robots-txt
perfil: comercial / personal
ultima_revision: 2026-10-26
---

# ASTRO-003 · porfolio.dev (Miguel Ángel Durán, midudev)

1. **Finalidad.** Ejemplo real y mantenido (último commit 2026-06-09, "feat(seo): Open Graph, Twitter Cards, canonical y JSON-LD") de una web de una página con acabado profesional y casi sin JavaScript; plantilla publicada también como tema de Astro.
2. **Fuente.** https://github.com/midudev/porfolio.dev (commit 9ac1724). Licencia **CC BY-NC 4.0**: no copiar código a proyectos comerciales; aquí solo se documentan decisiones. Vídeos del autor: no vistos.
3. **Estructura [COD].** `layouts/Layout.astro`; componentes pequeños (`Hero`, `Experience`/`ExperienceItem`, `Projects`, `AboutMe`, `SectionContainer`, `TitleSection`, `Badge`, `LinkButton`, `SocialPill`, `ThemeToggle`, iconos SVG como componentes `.astro`); datos en `data/experience.json` y `data/projects.json`; página `components.astro` (catálogo de componentes).
4. **Cabecera SEO [COD].** Props `title`, `description`, `image` (por defecto la imagen OG) y `canonical` (por defecto `Astro.url.href`); URL absoluta de la imagen con `new URL(image, siteUrl)`; Open Graph completo (`type`, `url`, `title`, `description`, `image` + **width 1200/height 630**, `locale es_ES`, `site_name`); Twitter `summary_large_image` con `site`/`creator`; JSON-LD `Person` con `sameAs` (LinkedIn, GitHub, X) y `jobTitle`, inyectado con `set:html={JSON.stringify(...)}`; `astro-robots-txt` y `site` en la configuración. (Equivalente comercial: `LocalBusiness`, SEO-002/003.)
5. **Tema de 3 estados [COD].** Claro / Oscuro / Sistema; preferencia en `localStorage` (por defecto "system"); escucha `matchMedia('(prefers-color-scheme: dark)')` y se re-suscribe limpiamente; clase `dark` en `<html>`; `color-scheme: light dark` en `:root`; listeners registrados con un **`AbortController`** que se aborta antes de volver a registrarlos (evita duplicados con View Transitions); `transition:persist` en el botón y el menú para que sobrevivan a la navegación.
6. **Movimiento solo con CSS [COD].**
   - Entrada escalonada: `@keyframes fade-in-up` (opacidad + `translate` 20 px), 0,65 s `cubic-bezier(0.22, 1, 0.36, 1)`, clases de retardo 120/260/400/540 ms.
   - Revelado al entrar en pantalla: dentro de `@supports (animation-timeline: view())`, `[data-section]` con `animation-timeline: view()` y `animation-range: entry 0% entry 18%`.
   - Cabecera que se convierte en "píldora" de cristal al bajar: `animation-timeline: scroll()` con `animation-range: 0 100px` (keyframes con `backdrop-filter: blur(20px)`, borde y fondo; variante oscura en `@media (prefers-color-scheme: dark)`).
   - `@media (prefers-reduced-motion: reduce)`: anula animaciones y deja opacidad 1; `scroll-behavior: smooth` solo sin reduced motion.
   - Fondo: degradado radial ámbar muy tenue + textura de **grano** (`noise.svg`, opacidad 0,035/0,05, `aria-hidden`).
7. **Navegación activa [COD].** `IntersectionObserver` (umbral 0,3) sobre cada `section` dentro de `astro:page-load`; marca el enlace cuyo identificador coincide con la sección visible.
8. **Observaciones de revisión [COD; no son fallos explotables, son mejoras].**
   - Los enlaces del menú llevan `aria-label` con el id de la sección ("experiencia", "sobre-mi") que **sustituye** al texto visible para lectores de pantalla; mejor emparejar por `data-section`/`href` y dejar el texto accesible igual al visible (WCAG 2.5.3 "Etiqueta en el nombre").
   - El script del tema es un módulo empaquetado (se ejecuta tras el análisis) → posible destello si la preferencia guardada no coincide con el sistema; ver DS-001 §6 (script inline en `<head>`).
   - El menú de temas es una lista de `li` con clic, no botones ni `role="menu"` → no operable con teclado tal cual.
   - La animación de la cabecera con `scroll()` no está dentro de `@supports` (los navegadores sin soporte la ignoran: aceptable).
9. **Procedimiento profesional (adaptación).** Copiar el **patrón**, no el código: Layout con props SEO + JSON-LD del tipo adecuado; tema 3 estados con script inline; revelados CSS con `@supports` + reduced motion; datos en JSON/colecciones (ASTRO-002); catálogo de componentes interno.
10–13. **Aplicaciones.** Web personal de un profesional (abogado, fisioterapeuta), landing de una sola página para un negocio.
14. **Pruebas.** Validador de OG/Twitter; prueba de resultados enriquecidos; lector con el menú; navegación entre páginas con View Transitions (persistencia del tema); navegador sin scroll-driven animations.
15. **Estado.** Código leído; no ejecutado; demo no abierta.

**Lote 19 — cambios de Astro 6/7 [doc, guías oficiales de actualización]:** `<ViewTransitions />` eliminado (usar `<ClientRouter />`); colecciones *legacy* eliminadas (`src/content.config.ts`, `loader` como `glob()` obligatorio, `getEntry()` en lugar de `getEntryBySlug()`, `id` en lugar de `slug`, `render(entry)` importado de `astro:content`, `z` desde `astro/zod` con Zod 4); Node ≥ 22.12 (astro 7.4.2 pide ≥ 22.23.4); Vite 8 y compilador Rust en Astro 7. Resumen en ASTRO-004 (apéndice lote 19). El código de esta ficha anterior a Astro 6 **no debe copiarse sin adaptar**.
