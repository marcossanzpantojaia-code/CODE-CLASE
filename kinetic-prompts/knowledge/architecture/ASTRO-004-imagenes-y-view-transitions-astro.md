---
id: ASTRO-004
titulo: Astro — imágenes optimizadas (<Image />, <Picture />, layouts responsive, imágenes remotas y de colecciones) y View Transitions (<ClientRouter />, transition:*, eventos y reinicio de GSAP)
categoria: architecture
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (docs.astro.build: guides/images y guides/view-transitions, leídas el 2026-10-27)
versiones: Astro 5 (Picture desde 3.3.0; layouts responsive desde 5.10.0; SVG como componente desde 5.7.0)
perfil: ambos
ultima_revision: 2026-10-27
---

# ASTRO-004 · Imágenes y View Transitions en Astro

1. **Nombre y finalidad.** Completar ASTRO-001 §8–14 (pendientes): servir imágenes sin CLS ni peso innecesario y añadir transiciones entre páginas sin romper los scripts de animación. Hueco de ARCH-001.
2. **Fuentes.** https://docs.astro.build/en/guides/images/ · https://docs.astro.build/en/guides/view-transitions/ .
3. **Ubicación.** Secciones de almacenamiento, componentes, layouts responsive, imágenes remotas, `getImage()`, colecciones; en transiciones: ClientRouter, directivas, *fallback*, reduced motion, eventos de ciclo de vida, scripts.
4. **Resultado.** Imágenes con `width/height`, `srcset/sizes` y formatos modernos generados en build; navegación con transición y estado persistente.
5. **Imágenes [doc].**
   - **Dónde guardarlas:** `src/` → Astro las transforma y optimiza; `public/` → se copian tal cual (favicons, URLs fijas).
   - **`<Image />`** (`astro:assets`): `src` importado o URL; **`alt` obligatorio** (aviso si falta); fija `width`/`height` a partir de la proporción original (evita CLS); salida con `loading="lazy"` y `decoding="async"`.
   - **`<Picture />`** (3.3.0+): `formats={['avif','webp']}` → `<source>` por formato, original como respaldo.
   - **Layouts responsive** (5.10.0+): `layout="constrained" | "full-width"` por componente o global `image.layout` (también para `![]()` en Markdown); generan `srcset` y `sizes`; estilos por defecto con `image.responsiveStyles: true`; `fit`/`position` → `object-fit`/`object-position`.
   - **Remotas:** autorizar con `image.domains` o `image.remotePatterns`; si no, se muestran **sin optimizar**.
   - **`getImage()`:** solo servidor (endpoints, fondos CSS, OG); pasar el `src` resultante al cliente.
   - **Colecciones:** `schema: ({ image }) => z.object({ cover: image() })`; rutas relativas a la entrada.
   - La guía consultada no documenta `priority`/`quality`/`densities` → verificar en la referencia de la API antes de usarlos.
6. **View Transitions [doc].**
   - **Por defecto:** navegación completa. **Transiciones nativas entre documentos** (CSS `@view-transition`, CSS-002): sin JS extra y sin cambiar los scripts → **primera opción para webs comerciales** [criterio propio a partir de la doc].
   - **`<ClientRouter />`** (`astro:transitions`, en el `<head>` del layout): convierte el sitio en SPA (estado compartido, elementos persistentes) a cambio de **reinicializar scripts** a mano.
   - **Directivas:** `transition:name` (emparejar elementos; único por página), `transition:animate` (`fade` por defecto, `initial`, `slide`, `none` o personalizada con `forwards/backwards`), `transition:persist` (mantener elemento/isla con su estado; las animaciones CSS se reinician y los iframes recargan), `transition:persist-props`.
   - **`fallback`:** `animate` (por defecto, simula), `swap`, `none`.
   - **Reduced motion:** con `prefers-reduced-motion` Astro **desactiva todas** las animaciones de transición, también las simuladas.
   - **Eventos (en `document`), en orden:** `astro:before-preparation` → `astro:after-preparation` → `astro:before-swap` (permite cambiar `event.swap`) → `astro:after-swap` → `astro:page-load` (también en la carga inicial).
   - **Scripts:** los módulos empaquetados se ejecutan **una sola vez**; inicializar dentro de `astro:page-load`; `data-astro-rerun` en scripts inline; `data-astro-reload` en un enlace/formulario fuerza navegación completa; `navigate(href)` desde `astro:transitions/client` (no sanea URLs → validar entradas).
7. **Procedimiento con GSAP (adaptación; la doc no menciona GSAP).**
   1. Crear las animaciones en `astro:page-load` dentro de un `gsap.context()`.
   2. En `astro:before-swap` (o `astro:before-preparation`), `ctx.revert()` para matar tweens y ScrollTriggers de la página saliente (ST-004, fila SPA).
   3. Tras el swap, `ScrollTrigger.refresh()` si el layout cambió.
   4. Un elemento con `transition:persist` (reproductor, carrito) no debe reinicializarse dos veces: proteger con una bandera.
8. **Parámetros.** `layout`, `formats`, `image.domains/remotePatterns`, `transition:animate`, `fallback`.
9. **Código (adaptación propuesta; no ejecutada):**
   ```astro
   ---
   import { Image } from 'astro:assets';
   import corte from '../assets/corte-degradado.jpg';
   ---
   <Image src={corte} alt="Degradado bajo con raya marcada" layout="constrained" width={800} />
   <script>
     import { gsap } from 'gsap'; let ctx;
     document.addEventListener('astro:page-load', () => { ctx = gsap.context(() => { /* animaciones */ }); });
     document.addEventListener('astro:before-swap', () => ctx?.revert());
   </script>
   ```
10. **Problemas habituales.** Imágenes en `public/` esperando optimización; remotas sin autorizar (salen sin optimizar); `alt` vacío en imágenes informativas; scripts que solo funcionan en la primera página con ClientRouter; triggers duplicados al volver; `transition:name` repetido en la misma página.
11. **Rendimiento / a11y.** Imagen del héroe (LCP): no dejarla en `lazy` [criterio general, PERF-001]; reduced motion lo gestiona Astro en las transiciones, pero no en GSAP (A11Y-001); en SPA, el anuncio de página lo hace ClientRouter (lote 16); el foco no está documentado (ver final).
12. **Compatibilidad.** Transiciones nativas: Chromium y Safari recientes (CSS-002); ClientRouter simula en el resto.
13. **Aplicaciones.** Galería de cortes de una barbería, portfolio, blog de una clínica; transición héroe→detalle de servicio.
14. **Pruebas.** Lighthouse (CLS, formatos), navegar ida y vuelta con ClientRouter contando ScrollTriggers (`ScrollTrigger.getAll().length`), reduced motion, Firefox (fallback).
15. **Estado.** Documentación leída; nada implementado.

**Lote 16 — accesibilidad de `<ClientRouter />` [doc]:** incluye un **anunciador de rutas** sin configuración: añade a la página nueva un elemento con `aria-live="assertive"` que anuncia, por orden de prioridad, el `<title>`, el primer `<h1>` o el `pathname` → **todas las páginas deben tener `<title>` propio**. Reduced motion: desactiva todas las animaciones de transición (también las simuladas). **La gestión del foco tras la navegación no está documentada** → probar con teclado y, si hace falta, mover el foco al `<h1>` o al `main` en `astro:after-swap` [criterio propio, sin probar].

**Lote 18 — aviso de versión [MED, npm 2026-10-27]:** la última versión publicada es **Astro 7.4.2**; esta ficha se escribió con Astro 4–5 → comprobar en la documentación de la versión instalada antes de aplicar APIs concretas. Ver `integration/VERSIONES_VIGENTES.md`.

## Lote 19 · Cambios de Astro 6 y 7 que afectan a esta ficha — `DOCUMENTACION_OFICIAL_ANALIZADA` (docs.astro.build/en/guides/upgrade-to/v6 y /v7, leídas el 2026-10-27)
- **Astro 6:** eliminado `<ViewTransitions />` → usar **`<ClientRouter />`** (esta ficha ya lo hacía); eliminada la prop `handleForms`; eliminados `createAnimationScope()`, `isTransitionBeforePreparationEvent()`, `isTransitionBeforeSwapEvent()` y las constantes `TRANSITION_*` → comparar `event.type` con las cadenas `'astro:before-preparation'`, `'astro:after-swap'`… (los nombres de eventos de §6 **siguen vigentes**). Node **22.12+** (Node 18/20 sin soporte). Vite 7. `<script>`/`<style>` se emiten **en el orden en que se definen** (`preserveScriptOrder` pasa a ser el comportamiento por defecto). Imágenes responsive: los estilos ya **no** van en `style` en línea sino en una clase con hash + atributos `data-astro-fit`/`data-astro-pos`; por defecto **recorta** y **no amplía**; `getImage()` lanza error en el cliente. Colecciones: fin de las *legacy* (`src/content.config.ts`, `loader` obligatorio, `z` desde `astro/zod`, Zod 4: `z.email()`, `{ error }`).
- **Astro 7:** Vite 8; compilador en **Rust** (más estricto con etiquetas sin cerrar); `compressHTML` por defecto `'jsx'`; `src/fetch.ts` reservado; `@astrojs/db` eliminado. La guía no lista cambios en `astro:assets`, ClientRouter ni scripts.
- **npm [MED]:** `astro@7.4.2` exige `node >= 22.23.4` (`engines`).
- **Consecuencia para §7 (GSAP):** el procedimiento `astro:page-load` + `gsap.context()` + `ctx.revert()` en `astro:before-swap` sigue siendo compatible según la doc; **no probado** (prueba K2 de `integration/PLAN_ASTRO_GSAP.md`). Sustituye `versiones:` de la cabecera por "Astro 5–7 (cambios de 6/7 en este apéndice)" al aplicarla.
