---
id: TYPE-001
titulo: Tipografía web profesional — tamaño fluido accesible, medida de línea, interlineado y carga de fuentes
categoria: frontend
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (web.dev Learn Responsive Design: "Typography")
versiones: CSS vigente
perfil: ambos
ultima_revision: 2026-10-27
---

# TYPE-001 · Tipografía

1. **Finalidad.** Texto legible y escalable en todos los dispositivos, sin romper el zoom del usuario ni el rendimiento.
2. **Fuente.** web.dev/learn/design/typography.
3. **Reglas (docs).**
   - **Nunca `font-size` solo en `vw`** (el usuario no puede ampliar): combinar `rem + vw` dentro de `clamp()`, p. ej. `clamp(1rem, 0.75rem + 1.5vw, 2rem)`.
   - **Medida de línea:** limitar el contenedor con `max-inline-size` en `ch`/`rem`; la guía recomienda **66ch** (rango satisfactorio 45–75 caracteres, citando a Bringhurst).
   - **Interlineado** sin unidades (`1.5`); líneas largas → valores moderados; líneas cortas → más generosos (ejemplos: 1,65 para un artículo de 66ch; 2 para una cita de 45ch).
   - **Fuentes:** `@font-face` con **woff2**; `<link rel="preload" as="font" type="font/woff2" crossorigin>` (incluso autoalojadas); `font-display: swap` (muestra la del sistema y cambia) o `fallback`; `size-adjust` para reducir el salto (CLS).
   - **Fuentes variables:** un archivo para varios pesos; suele ser menor que el conjunto que sustituye. `system-ui` evita descargas.
4. **Contraste con la biblioteca (análisis propio).** Los tutoriales usan tamaños en `vw` puro (TUT-002: 3vw, 7vw; TUT-012: 3,5vw; TUT-013: 5vw) → **incumplen** la regla del zoom; Hyperplexed usa `clamp(3rem, 10vw, 10rem)` (TXT-003), que tiene límites pero el término central sigue sin `rem`.
5–8. **Procedimiento.** Escala tipográfica con 5–7 pasos definidos como tokens `clamp()`; cuerpo ≥ 1rem; 1–2 familias, 2–4 pesos (o una variable); preload solo de la fuente del titular LCP; `text-wrap: balance` en titulares (la página **no** lo trata: verificar en MDN).
9. **Código (patrón):** `--step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem); --step-5: clamp(2.5rem, 1.8rem + 3.5vw, 4.5rem); p { max-inline-size: 66ch; line-height: 1.6 }` (valores de ejemplo, no de la fuente).
10. **Errores habituales.** Texto en `vw`; medida de línea ilimitada en escritorio; cargar 6 pesos; fuentes de titular sin preload que provocan salto.
11. **Accesibilidad.** Zoom al 200 % (WCAG 1.4.4) — por eso `rem` en la fórmula; contraste de color (no tratado aquí).
12. **Compatibilidad.** `clamp()` universal.
13. **Aplicaciones.** Toda web; crítico en landings de texto grande.
14. **Pruebas.** Zoom 200 %, 320 px de ancho, CLS por cambio de fuente, Lighthouse (fuentes).
15. **Estado de evidencia.** Docs leídas (resumen). Ejemplos de tokens del §9 = propuesta propia.

**Lote 9:** escala completa con dos ratios interpolados y tokens calculados → [TYPE-002](TYPE-002-escala-tipografica-fluida-utopia.md).

## Lote 15 · Carga de fuentes según web.dev — `DOCUMENTACION_OFICIAL_ANALIZADA`
Fuente: Katie Hempenius y Barry Pollard, "Best practices for fonts", web.dev (act. 2022-10-04), https://web.dev/articles/font-best-practices .
- **`font-display` [doc]:** `swap` (bloqueo 0 ms, intercambio infinito: texto antes, salto si llega tarde), `optional` (bloqueo 100 ms, sin intercambio: sin salto pero puede no usar la fuente), `fallback` (100 ms + 3 s), `block` (2–3 s, texto invisible), `auto` (según navegador). Para el héroe/LCP: `optional` si la marca lo tolera, `swap` + `size-adjust` si no [criterio propio].
- **Declaraciones:** `@font-face` y CSS crítico en línea en el `<head>`; **no** incrustar los archivos de fuente.
- **Terceros:** `preconnect` al origen de la hoja y otro `preconnect` **con `crossorigin`** al origen de los archivos (Google Fonts usa dos orígenes).
- **Autoalojar no siempre es más rápido** (depende de CDN y HTTP/2); si se autoaloja, hacer subconjunto y WOFF2 uno mismo. En España, autoalojar evita además enviar IP a terceros (LEGAL-001) [criterio propio].
- **`preload`:** útil si la fuente se descubre tarde, pero quita recursos a otros, ignora `unicode-range` → con moderación y un solo formato.
- **WOFF2** solamente; **subconjuntos** y `unicode-range` (revisar la licencia de la fuente antes de recortarla).
- **Variables:** compensan cuando se usan varios pesos/estilos; un solo peso → archivo estático.
- Iconos con fuente → mejor SVG (menos saltos).
