---
id: ASTRO-001
titulo: Astro y la arquitectura de islas — cuándo elegirlo para una web de negocio
categoria: architecture
estado: INVESTIGADO (parcial)
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (docs.astro.build/en/concepts/islands)
versiones: Astro actual (docs consultadas 2026-10-26)
perfil: comercial (A) principalmente
ultima_revision: 2026-10-27
---

# ASTRO-001 · Islas

1. **Finalidad.** Decidir entre Astro y Next.js para webs de contenido (barbería, clínica, despacho) y entender cómo Astro mantiene el JavaScript al mínimo.
2. **Fuente.** https://docs.astro.build/en/concepts/islands/ (leída). La referencia de directivas (https://docs.astro.build/en/reference/directives-reference/) se consultó pero la parte de `client:*` **no se extrajo** → pendiente.
3. **Concepto [docs].** La página se renderiza a HTML estático; solo los componentes marcados se "hidratan" como islas independientes (hidratación parcial/selectiva). Las islas cargan en paralelo y una de baja prioridad no bloquea a otra.
4. **Directivas documentadas en la página.** `client:load` (inmediato: cabecera crítica), `client:idle` (cuando el navegador está libre: baja prioridad), `client:visible` (al entrar en pantalla: carrusel al final). `client:media` y `client:only` existen pero no se describen en la página leída.
5. **Islas de servidor [docs].** `server:defer` renderiza en paralelo una parte personalizada (avatar, ofertas, reseñas) mostrando un *fallback* sin salto de diseño; el armazón estático se puede cachear agresivamente.
6. **Elección [criterio propio a partir de esta ficha, NEXT-001 y DEPLOY-001].**
   | Necesidad | Astro | Next.js |
   |---|---|---|
   | Web de contenido con 1–3 widgets | ✔ mínimo JS por defecto | ✔ con Server Components |
   | Área privada, panel, mucha lógica | posible | ✔ más natural |
   | Experiencia GSAP/Three.js a pantalla completa | isla `client:only`/`visible` | ✔ |
   | Blog/Markdown, multi-idioma estático | ✔ | ✔ |
   Para el perfil A sin área privada, Astro suele bastar; para B o apps, Next.js.
7. **Procedimiento.** Mantener la animación decorativa en scripts de Astro (`<script>` empaquetado) o islas `client:visible`; formularios con endpoint de servidor y validación (SEC-002, TS-001).
8–14. **Pendiente.** Detalle de `client:media`, `client:only`, View Transitions de Astro (`transition:*`), imágenes (`astro:assets`), despliegue estático vs SSR.
15. **Estado.** Concepto leído en docs; directivas incompletas; no implementado.

**Lote 9:** proyecto Astro 5 real (colecciones de contenido, paginación, isla de formulario) → [ASTRO-002](ASTRO-002-sitio-astro-5-completo.md).

**Lote 13:** imágenes (`astro:assets`) y View Transitions (`<ClientRouter />`, eventos, reinicio de GSAP) → [ASTRO-004](ASTRO-004-imagenes-y-view-transitions-astro.md).

**Lote 18 — aviso de versión [MED, npm 2026-10-27]:** la última versión publicada es **Astro 7.4.2**; esta ficha se escribió con Astro 4–5 → comprobar en la documentación de la versión instalada antes de aplicar APIs concretas. Ver `integration/VERSIONES_VIGENTES.md`.

**Lote 19 — cambios de Astro 6/7 [doc, guías oficiales de actualización]:** `<ViewTransitions />` eliminado (usar `<ClientRouter />`); colecciones *legacy* eliminadas (`src/content.config.ts`, `loader` como `glob()` obligatorio, `getEntry()` en lugar de `getEntryBySlug()`, `id` en lugar de `slug`, `render(entry)` importado de `astro:content`, `z` desde `astro/zod` con Zod 4); Node ≥ 22.12 (astro 7.4.2 pide ≥ 22.23.4); Vite 8 y compilador Rust en Astro 7. Resumen en ASTRO-004 (apéndice lote 19). El código de esta ficha anterior a Astro 6 **no debe copiarse sin adaptar**.
