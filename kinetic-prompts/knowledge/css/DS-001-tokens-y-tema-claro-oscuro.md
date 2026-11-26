---
id: DS-001
titulo: Sistema de diseño mínimo — tokens en variables CSS y tema claro/oscuro sin parpadeo
categoria: css
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (Coding in Public, `light-dark`, sin licencia) + DOCUMENTACION_OFICIAL_ANALIZADA (MDN `light-dark()`) (TUT-026)
versiones: `light-dark()` Baseline 2024 (desde mayo 2024, según MDN)
perfil: ambos
ultima_revision: 2026-10-26
---

# DS-001 · Tokens y temas

1. **Finalidad.** Un único lugar donde viven colores, tipografía, espacios, radios y sombras, con tema claro/oscuro que respeta la preferencia del sistema y la elección del usuario.
2. **Fuentes.** Chris Pennington (Coding in Public), repo `coding-in-public/light-dark` (commit 90a6fea, 2021-08-24; sin licencia; serie de 3 vídeos **no vistos**). MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark.
3. **Cómo lo hace el autor [COD].**
   - Dos juegos de primitivos con sufijo: `--text-light/--text-dark`, `--bkg1-light/-dark`, `--accent1…3`, `--shadow-light/-dark`.
   - Tokens semánticos (`--text`, `--bkg1`, `--accent1`, `--shadow`) que apuntan al juego correcto mediante `@media (prefers-color-scheme: dark|light)` **y** mediante un atributo en la raíz `[color-scheme="dark"]` / `[color-scheme="light"]` (gana la elección manual).
   - JS: tema = `localStorage` si existe, si no `matchMedia('(prefers-color-scheme: dark)')`; botón con `role="switch"` y `aria-label`; sonido de interruptor (audio CC BY-NC).
4. **Alternativa moderna [MDN].** `:root { color-scheme: light dark; }` y `color: light-dark(#333b3c, #efefec)`; forzar con `:root[data-theme="dark"] { color-scheme: dark }`. Acepta dos colores o dos imágenes; requiere `color-scheme`. MDN desaconseja en general imponer un tema contra la preferencia del usuario (ofrecer el selector, no forzarlo).
5. **Estructura de tokens recomendada [criterio propio].**
   - Primitivos: `--blue-500`, `--gray-50…950` (o `oklch` generados, UI-002).
   - Semánticos: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-primary`, `--color-border`, `--focus-ring`.
   - Escalas: `--step-*` (TYPE-002), `--space-*` (misma lógica fluida), `--radius-*`, `--shadow-*`, `--ease-*`, `--duration-*` (UX-001).
   - Componentes usan **solo** semánticos.
6. **Sin parpadeo (FOUC) [criterio propio a partir del fallo del repo].** En el repo el tema se aplica en `DOMContentLoaded` desde un módulo al final del `body` → si el usuario guardó "claro" y su sistema está en oscuro, verá un destello. Solución: script mínimo **inline y bloqueante en `<head>`** que lee `localStorage` y pone `data-theme` antes del primer pintado (en Next.js, script en `layout` con `suppressHydrationWarning` en `<html>`; en Astro, `<script is:inline>`).
7. **Procedimiento.**
   1. Definir tokens en `:root`; temas como sobrescrituras de semánticos.
   2. `color-scheme` correcto (afecta a scrollbars y controles nativos).
   3. Selector: `<button aria-pressed>` o `role="switch"` **con `aria-checked`** (el repo no lo pone).
   4. Comprobar contraste en ambos temas (A11Y-003).
8. **Parámetros.** —
9. **Código (adaptación propia; no ejecutada):**
   ```html
   <script>try{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
   ```
   ```css
   :root { color-scheme: light dark; --color-bg: light-dark(#fff, #111418); --color-text: light-dark(#1b1530, #dbe4f3); }
   :root[data-theme="light"] { color-scheme: light; } :root[data-theme="dark"] { color-scheme: dark; }
   ```
10. **Problemas detectados [COD].** `role="switch"` sin `aria-checked`; `innerHTML` para cambiar el icono; tema aplicado tarde (FOUC); `transition: all` en varios elementos (anima propiedades no deseadas al cambiar de tema).
11. **Rendimiento.** Cambiar variables en la raíz repinta toda la página: no animar el cambio de tema con `transition: all` global.
12. **Compatibilidad.** Variables universales; `light-dark()` desde 2024 → con navegadores antiguos, mantener el patrón de §3.
13. **Aplicaciones.** Todas las webs; imprescindible si hay tema oscuro.
14. **Pruebas.** Recarga con tema guardado distinto del sistema (sin destello); contraste en ambos; modo alto contraste de Windows.
15. **Estado.** Código y docs leídos; no implementado.
