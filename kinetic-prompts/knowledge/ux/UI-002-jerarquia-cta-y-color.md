---
id: UI-002
titulo: Jerarquía visual tipográfica, CTA primario/secundario y paleta por tintes y sombras (DesignCourse)
categoria: ux
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (blog de DesignCourse, 2021–2022) (TUT-028)
versiones: independiente de tecnología
perfil: ambos (especialmente comercial)
ultima_revision: 2026-10-27
---

# UI-002 · Jerarquía, CTA y color

1. **Finalidad.** Reglas de diseño visual que separan una web "amateur" de una profesional en las piezas que más se repiten en webs de negocio: pie, sección de servicios, bloque de texto, entrada de blog, botones y paleta.
2. **Fuentes (gratuitas, sin registro).**
   - "Typographic Visual Hierarchy in UI Design (4 Examples)", Ex Powanpongkul, 02-11-2021: https://designcourse.com/blog/post/typographic-visual-hierarchy-in-ui-design-4-examples
   - "Web Design Color Schemes – The Tint / Shade Method", 31-10-2021 (firmado "cryptofox"): https://designcourse.com/blog/post/web-design-color-schemes---the-tint--shade-method — vídeo incrustado `rUTuvDyFHwo` (**no visto**).
   - "Primary vs Secondary CTA Buttons in UI Design", Gary Simon, 01-03-2022: https://designcourse.com/blog/post/primary-vs-secondary-cta-buttons-in-ui-design
   Cursos de DesignCourse: de pago → INACCESIBLE_POR_COSTE.
3. **Jerarquía tipográfica [artículo].** Palancas: tamaño, peso, color/contraste, espacio, mayúsculas, espaciado de letras, contenedor tintado, decoración (subrayar enlaces, separadores en migas), opacidad. Casos:
   - **Pie:** títulos de columna idénticos a los enlaces → títulos más grandes, en negrita y con más contraste; enlaces subrayados.
   - **Sección de características:** titular, subtítulo y descripción iguales → titular grande y negrita, subtítulo apenas mayor (o versalitas con *tracking*, o en una píldora tintada), descripción separada y con otro color.
   - **Bloque de cuerpo:** encabezado y títulos en negrita, descripción en otro color.
   - **Entrada de blog:** título grande (negrita o, al revés, más fino que el cuerpo), migas con separador, fecha aclarada.
   Errores: vecinos con el mismo estilo; confiar solo en el espacio en blanco; encabezado y subencabezado casi del mismo tamaño; enlaces sin subrayar. El artículo **no da valores numéricos** → usar la escala de TYPE-002.
4. **CTA [artículo].** Un único CTA primario por bloque ("la acción que quieres que haga el usuario"), visualmente más fuerte (relleno de color, contraste); el secundario más débil (fondo blanco con borde). Error principal: estilar ambos igual.
5. **Paleta por tintes/sombras [artículo].**
   1. Elegir un color base (ejemplo oscuro: `#890388`).
   2. Decidir tema claro u oscuro.
   3. Fondo: mismo tono, **lejos del centro** del espectro de luminosidad (ejemplo oscuro: `#352335` desaturado; claro: tinte muy fuerte).
   4. Primario (titulares y CTA): mismo tono con saturación al máximo y algo de tinte.
   5. Tarjetas: fondo + tinte (o sombra) sutil; énfasis = más tinte.
   6. Blanco/negro puros solo cuando haga falta; iterar y comprobar contraste.
6. **Procedimiento profesional (traducción a código, propia).**
   - Generar la paleta en `oklch()` variando solo L (y C para el primario) a partir del tono H de la marca → tokens `--surface-1…3`, `--primary`, `--text`, `--text-muted` (DS-001).
   - Botones: componente `Button` con `variant="primary" | "secondary" | "ghost"` (TS-001) y como mucho un primario por sección.
   - Validar cada par texto/fondo con 4,5:1 (A11Y-003).
7–13. **Aplicaciones.** Home de barbería: CTA primario "Reservar cita", secundario "Ver servicios"; pie con columnas jerarquizadas; tarjetas de servicios con tinte del color de marca.
14. **Pruebas.** Prueba de "entrecerrar los ojos"/desenfoque (¿se distingue el CTA?) [confirmada por NN/g, ver lote 13]; contraste; vista en escala de grises (la jerarquía no debe depender solo del color).
15. **Estado.** Artículos leídos; vídeos no vistos; traducción a código = propuesta propia no probada.

## Lote 13 · Jerarquía visual según NN/g — `ARTICULO_AUTOR_ANALIZADO`
Fuente: Kelley Gordon, "Visual Hierarchy in UX: Definition", Nielsen Norman Group, 17-01-2021 (https://www.nngroup.com/articles/visual-hierarchy-ux-definition/).
- **Definición:** ordenar los elementos para que se vean en el orden de importancia previsto.
- **Tres herramientas [artículo]:** (1) **color y contraste** — la jerarquía la da el contraste de valor/saturación con el entorno, no el color en sí; colores vivos solo para lo clave; rojos/cálidos para avisos y errores; diseños sencillos: ≤ 2 colores primarios + 2 secundarios; diseños complejos: ≤ 3 variaciones de contraste ("si todo contrasta, nada destaca"); no depender solo del color. (2) **escala** — ≤ 3 tamaños (pequeño, mediano, grande); ejemplo web: cuerpo 14–16 px, subtítulos 18–22 px, títulos hasta 32 px; el elemento más importante el mayor y como mucho 2 elementos grandes. (3) **agrupación** — proximidad y espacio en blanco (título pegado a su contenido, más aire entre grupos), regiones comunes con fondo/borde usadas con moderación.
- **Prueba de entrecerrar los ojos / desenfoque:** confirmada por la fuente (el artículo desenfoca a 5, 10 y 20 px) → el §14 de esta ficha deja de ser [EST].
- **Errores [artículo]:** todo del mismo tamaño/color/espaciado; demasiados colores o contrastes; diseñar la plantilla sin el contenido real (una foto muy saturada puede dominar la página).
- **Proceso:** definir primero la jerarquía del contenido y los mensajes clave → aplicar color, escala y agrupación → probar con usuarios.
- **Tensión con otras fichas [síntesis]:** los "≤ 3 tamaños / títulos hasta 32 px" son pauta para interfaces; las webs editoriales o cinematográficas usan titulares de pantalla mayores (TYPE-002). Mantener **pocos niveles** aunque el titular del héroe sea grande.

## Lote 15 · OKLCH y sintaxis de color relativa — `DOCUMENTACION_OFICIAL_ANALIZADA` (MDN `oklch()`)
- `oklch(L C H / A)`: L 0–1 (o %), **luminosidad percibida** (a diferencia de la L de HSL); C 0–~0,4 (en la práctica ≤ 0,5); H en grados, **no coincide** con el tono de HSL (el rojo de `hsl(0 100% 50%)` es ~29,23 en OKLCH).
- **Relativa:** `oklch(from var(--marca) calc(l + 0.15) c h)` (más clara) / `calc(l - 0.15)` (más oscura) → tintes y sombras de la paleta desde **un solo token** (DS-001); en `calc()` sumar números, no porcentajes.
- **Baseline: ampliamente disponible desde mayo de 2023** (algunas partes con soporte variable; consultar la tabla). La página no trata gama P3 ni recorte → pendiente.
- Seguir comprobando contraste con los colores resultantes (A11Y-003): la luminosidad percibida ayuda a prever, no sustituye la medición.

## Lote 16 · Gama amplia (Display P3) con respaldo — `DOCUMENTACION_OFICIAL_ANALIZADA` (MDN `@media (color-gamut)`)
- `color-gamut`: `srgb` (casi todas las pantallas), `p3` (Display P3 o más), `rec2020`; cada valor significa "aproximadamente esa gama **o más**" → `srgb` coincide en todas las pantallas en color: escribir primero el color sRGB y **después** la regla `@media (color-gamut: p3)` que lo sustituye. Baseline ampliamente disponible desde febrero de 2023.
- Patrón para la marca [adaptación]: token sRGB/OKLCH dentro de sRGB como base y, en `@media (color-gamut: p3)`, una variante más saturada (`color(display-p3 …)` u OKLCH con más croma). La página no explica qué hace el navegador con colores fuera de la gama de la pantalla → no confiar en ello: dar siempre el respaldo.
- Contraste: medir **ambas** variantes (A11Y-003).
