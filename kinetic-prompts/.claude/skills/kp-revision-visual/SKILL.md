---
name: kp-revision-visual
description: Revisión visual de Kinetic Prompts al cerrar cada fase. Hace capturas con Playwright a 375, 768, 1280 y 1440 px, las mira una a una y las compara con la checklist de calidad de docs/PLAN.md, corrige lo que falle y entrega el informe. Úsala antes de dar por cerrada cualquier fase o cuando el usuario pida revisar el aspecto de la app.
---

# kp-revision-visual

## 1. Capturas

1. Arranca la app (`npm run dev`, o `npm run build && npm run start` si se mide rendimiento).
2. Para cada pantalla tocada en la fase, haz capturas con Playwright a estos anchos:

   | Ancho | Alto | Uso                                           |
   | ----- | ---- | --------------------------------------------- |
   | 375   | 812  | Móvil                                         |
   | 768   | 1024 | Tablet                                        |
   | 1280  | 800  | Portátil                                      |
   | 1440  | 900  | Escritorio (la galería debe verse sin scroll) |

   Haz una captura de la ventana (lo que se ve sin scroll) y otra de página completa.

3. Repite las de 375 y 1440 px con `reducedMotion: 'reduce'` y con el foco de teclado
   en el primer elemento interactivo (pulsa Tab).
4. Guárdalas en `tests/visual/<fase>/<pantalla>-<ancho>[-variante].png`.
5. Recoge los mensajes de consola de cada carga: deben estar vacíos.

## 2. Revisión

Abre y mira **cada** captura (no basta con que el test pase). Compárala con la
«Checklist de calidad visual y técnica» de `docs/PLAN.md`:

- **Estética:** solo tokens de `styles/tokens.css`; `--accent` solo en pulsables o
  activos; tarjetas con la misma proporción, altura y pie; Bricolage Grotesque en
  títulos, Instrument Sans en texto, JetBrains Mono en prompts; ningún texto cortado o
  desbordado; galería visible sin scroll a 1440×900; sin degradados, emojis ni sombras
  grandes; nada «todo centrado».
- **Movimiento:** tarjeta → ficha en 600 ms; hovers 150 ms y menús 240 ms con
  `cubic-bezier(0.2, 0.8, 0.2, 1)`; con reduced motion, fundidos y demos en pausa;
  nunca más de 6 vídeos a la vez.
- **Interacción:** todo usable con teclado y foco visible; «Copiado ✓» y texto copiado
  igual al mostrado; estados vacío, cargando, error, sin sesión y límite diseñados;
  errores que dicen qué falló y cómo solucionarlo.
- **Técnica:** consola limpia; Lighthouse móvil ≥ 90 / ≥ 95; vídeos < 600 KB y
  pósteres < 80 KB; tokens de sesión nunca en la URL; límite de copias en el servidor;
  lint, tests unitarios y e2e en verde.

Marca como «no aplica todavía» lo que pertenezca a fases futuras, en vez de darlo por bueno.

## 3. Corregir

Corrige todo lo que falle en esta fase (con `kp-design-system` si es la app) y repite
las capturas afectadas hasta que pasen.

## 4. Informe

Entrega:

- Tabla de la checklist: ✓, ✗ (con el motivo) o «no aplica todavía».
- Lista de lo corregido.
- Rutas de las capturas finales, para que el usuario las revise en el navegador.
