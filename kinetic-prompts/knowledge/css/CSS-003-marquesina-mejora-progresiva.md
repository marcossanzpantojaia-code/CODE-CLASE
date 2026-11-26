---
id: CSS-003
titulo: Marquesina infinita con mejora progresiva (CSS + JS mínimo, reduced motion, aria-hidden)
categoria: css
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (código literal, CodePen kevinpowell/BavVLra, MIT)
versiones: CSS + JS vanilla (2023-09-28)
perfil: ambos (prioritario en comercial)
ultima_revision: 2026-10-26
---

# CSS-003 · Infinite scroller accesible

1. **Finalidad.** Cinta horizontal infinita de logos/etiquetas/testimonios con la mejor práctica de accesibilidad y sin librerías; contrasta con la marquesina de TUT-003 (bucle rAF sin cancelar).
2. **Fuente.** Kevin Powell, "Progressively enhanced infinite horizontal scroll", https://codepen.io/kevinpowell/pen/BavVLra. Identidad: el perfil de CodePen enlaza youtube.com/kevinpowell y kevinpowell.co. Vídeo asociado no visto.
3. **Ubicación.** Comentario de cabecera del HTML (explica la estrategia), CSS `.scroller[data-animated]`, JS `addAnimation()`.
4. **Resultado [COD].** Sin JS o con reduced motion: los elementos se muestran **envueltos en varias líneas**, sin ocultar nada. Con JS y movimiento permitido: cinta continua con bordes difuminados por máscara.
5. **Explicación [COD].**
   - JS solo actúa si `!matchMedia("(prefers-reduced-motion: reduce)").matches`: marca `data-animated="true"` y **duplica cada hijo con `aria-hidden="true"`** (los lectores de pantalla no leen el contenido dos veces).
   - CSS animado: `overflow: hidden`, `mask: linear-gradient(90deg, transparent, white 20%, white 80%, transparent)`; el interior pasa a `width: max-content; flex-wrap: nowrap` y anima `translate(calc(-50% - 0.5rem))` (−50 % del contenido duplicado menos medio `gap` de 1rem) en bucle lineal.
   - Configuración por atributos: `data-speed="fast|slow"` → 20 s / 60 s (40 s por defecto); `data-direction="right"` → `animation-direction: reverse`.
6. **Dependencias.** Ninguna.
7. **Procedimiento para Claude Code.** Copiar la estrategia (no el código): contenido real en HTML, duplicado `aria-hidden` por JS, animación solo con permiso de movimiento, máscara de bordes. **Añadir** un botón de pausa visible (WCAG 2.2.2: el contenido que se mueve solo más de 5 s junto a otro contenido necesita pausa; pausar solo en hover no cuenta, A11Y-002).
8. **Parámetros.** Duraciones 20/40/60 s, máscara 20 %–80 %, gap 1rem (debe coincidir con el `- 0.5rem` del keyframe).
9. **Código (fragmento mínimo, MIT, © Kevin Powell):** `@keyframes scroll { to { transform: translate(calc(-50% - 0.5rem)); } }`
10. **Limitaciones.** Sin control de pausa; los duplicados `aria-hidden` siguen siendo enfocables si contienen enlaces (añadir `tabindex="-1"` o `inert` a los clones); si el contenido es más estrecho que el contenedor, aparece un hueco (duplicar más veces).
11. **Rendimiento.** Animación de `transform` en CSS: hilo del compositor, coste mínimo.
12. **Compatibilidad.** `mask` universal en navegadores actuales (prefijo `-webkit-` incluido en la fuente).
13. **Aplicaciones.** Logos de clientes, sellos de confianza, servicios, testimonios.
14. **Pruebas.** Reduced motion, JS desactivado, lector de pantalla (sin duplicados), teclado (clones no enfocables), anchos estrechos.
15. **Estado de evidencia.** Código literal leído; demo y vídeo no vistos.


**Lote 8:** variante con JS que además invierte el sentido con la dirección del scroll → [TXT-005](../animations/TXT-005-marquesina-infinita-con-scroll.md) (Olivier Larose). Esta versión CSS sigue siendo la recomendada para webs comerciales.
