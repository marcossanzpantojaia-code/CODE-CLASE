---
id: CSS-007
titulo: Animar a altura automática (interpolate-size / calc-size) y propiedades personalizadas tipadas (@property)
categoria: css
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Web Dev Simplified, 2024 y 2025) + DOCUMENTACION_OFICIAL_ANALIZADA (MDN)
versiones: interpolate-size/calc-size: "Limited availability" según MDN (2026-10-26); @property: >93 % de soporte según el artículo (ene-2025)
perfil: ambos
ultima_revision: 2026-10-26
---

# CSS-007 · height: auto animable y @property

1. **Finalidad.** Acordeones, FAQ y "leer más" que se abren con transición sin medir alturas en JS; animar colores/ángulos guardados en variables (bordes con degradado giratorio, contadores) (tema 6 y webs comerciales A).
2. **Fuentes.** Kyle Cook (Web Dev Simplified): https://blog.webdevsimplified.com/2024-07/css-calc-size (01-07-2024) y https://blog.webdevsimplified.com/2025-01/css-at-property (13-01-2025). MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size. Canal de YouTube asociado: vídeos **no vistos**.
3. **interpolate-size (preferido) [MDN].**
   - `:root { interpolate-size: allow-keywords; }` (se hereda) permite transicionar entre una longitud y `auto`, `min-content`, `max-content`, `fit-content`.
   - No anima entre dos tamaños intrínsecos (p. ej. `auto ↔ min-content`); un extremo debe ser longitud/porcentaje.
   - MDN la marca **no Baseline / experimental** → mejora progresiva.
4. **calc-size() [artículo + MDN].** `height: calc-size(auto)` o `calc-size(min-content, size + 50px)`; equivale a activar `allow-keywords` en esa declaración. Usarlo solo si además hay que calcular. Fallback del autor: declarar primero `height: auto` y después `height: calc-size(auto)` (los navegadores sin soporte abren sin animar). Cuando se escribió (jul-2024) solo funcionaba en Chrome Canary con bandera: dato **desactualizado**, ver MDN.
5. **Alternativa universal [conocimiento general, no de las fuentes de este lote].** Envolver el contenido en un grid: `grid-template-rows: 0fr → 1fr` con hijo `min-height: 0; overflow: hidden`; funciona en todos los navegadores modernos.
6. **@property [artículo].**
   ```css
   @property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
   ```
   Sin tipo, una variable no se puede interpolar (el navegador no sabe cómo); con `syntax` se puede transicionar/animar como una propiedad normal. Sintaxis admite tipos (`<color>`, `<length>`, `<percentage>`, `<number>`, `<angle>`…), `|` (o), `+` (lista con espacios), `#` (lista con comas). Inconveniente citado: VS Code no resalta ni valida `@property`.
7. **Procedimiento profesional.**
   1. FAQ de una clínica: `<details>/<summary>` (accesible sin JS) + `interpolate-size` como mejora; con reduced motion, sin transición.
   2. Nunca ocultar contenido con `height: 0` sin `overflow: hidden` + `visibility`/`inert` para el lector y el tabulador cuando está cerrado (si no se usa `<details>`).
   3. Degradados animados con `@property --angle` en `conic-gradient(from var(--angle), …)`; solo como detalle (repinta).
8. **Parámetros.** Duración de acordeón típica 200–300 ms [EST, criterio propio].
9. **Código (adaptación; no ejecutada):**
   ```css
   :root { interpolate-size: allow-keywords; }
   .panel { height: 0; overflow: hidden; transition: height .25s ease; }
   .panel.is-open { height: auto; }
   @media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
   ```
10. **Problemas habituales.** Confiar en `calc-size` sin fallback; animar `height` de muchos elementos a la vez (layout cada frame); olvidar el estado cerrado para teclado/lector.
11. **Rendimiento.** `height` provoca layout: aceptable en un acordeón, no en listas largas ni en scroll.
12. **Compatibilidad.** Ver cabecera; comprobar en caniuse/MDN antes de usar.
13. **Aplicaciones.** Preguntas frecuentes, horarios desplegables, servicios con detalle, menú móvil.
14. **Pruebas.** Navegador sin soporte (abre sin animación), teclado, lector, reduced motion.
15. **Estado.** Fuentes leídas; no implementado.
