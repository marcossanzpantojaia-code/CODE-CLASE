---
id: AUD-001
titulo: Auditoría visual de escenas por scroll — distinguir movimiento matemáticamente reversible, visualmente continuo, con buen ritmo e integrado en una composición profesional; métricas automáticas (protagonista, legibilidad, cobertura, valles de visibilidad, cortes, reversibilidad visual) y auditoría de las recetas A/B/C del lote 24
categoria: testing
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia (evidence/demos/2026-11-01-lote25/auditoria/: auditoria.json de A/B/C a 1 440 y 375 px; cortes_*.json de los vídeos del lote 24) + herramientas integration/tools/auditoria_visual_escena.mjs y cortes_video.py ejecutadas
versiones: Playwright 1.63.0 + Chromium 153; OpenCV 5.0.0
perfil: cinematografico
ultima_revision: 2026-11-02
---

# AUD-001 · Auditoría visual de escenas por scroll

**Estado:** herramientas **IMPLEMENTADAS y ejecutadas** sobre las 3 microdemos. Los umbrales son **provisionales**: salen de 3 casos procedurales y aún hay que calibrarlos con recursos reales y con una revisión humana.

## 1. Cuatro propiedades que NO se deben confundir
| Propiedad | Pregunta | Cómo se comprueba | Las microdemos del lote 24 |
|---|---|---|---|
| **P1 · Matemáticamente reversible** | ¿Da el mismo valor la misma posición del scroll al bajar y al subir? | `medir_escena_scroll.mjs` (valores) y `auditoria_visual_escena.mjs` (**píxeles**) | **Sí**: valores con diferencia 0; píxeles 0 % a 1 440 px y **0,21 % (A) y 0,14 % (C) a 375 px**, por redondeos de layout en móvil |
| **P2 · Visualmente continuo** | ¿Hay cortes, saltos o valles en los que "no hay nada"? | `cortes_video.py` (picos aislados de cambio de píxeles), cobertura y luminancia de lo dibujado, ancho del protagonista | **No del todo**: en B, **valles** en los relevos y protagonista casi invisible a mitad del puente (ver §2) |
| **P3 · Buen ritmo** | ¿Se alternan mesetas legibles y movimiento? ¿Cuánto dura sin texto legible? | "pasos sin ninguna línea legible", duración de las mesetas, velocidad del protagonista | **Mejorable**: A pasa **el 50 % del tramo** (p 0,25–0,75) sin ningún titular legible; B, el 30 % |
| **P4 · Integrado en una composición profesional** | Luz, materiales, escala, capas, tipografía, color | C1 (`composicion_captura.py`) + **C3 humano** | **No evaluable / no**: recursos procedurales planos, sin luz ni sombras |

Un movimiento puede cumplir P1 y fallar en P2, P3 y P4. **Las microdemos del lote 24 demuestran P1, no P4.**

## 2. Hallazgos de la auditoría de A, B y C (clasificados)
| # | Hallazgo | Dónde | Medida | Clase | Corrección (fichas) |
|---|---|---|---|---|---|
| H1 | **Objetos visualmente pobres** (SVG planos, sin luz, material ni sombra) | A, B, C | inspección de las capturas | P4 / C1 | recursos con alfa y luz coherente (COMP-001, BLEND-002, ASSET-001) |
| H2 | **Momento sin protagonista claro**: a mitad del puente de partículas solo se dibuja el **1,2–1,4 % del lienzo** (1 440 px) | B, p 0,25–0,75 | `lienzo_cobertura` 0,0122–0,0142 frente a 0,065 (gota) y 0,072 (plato) | P2 / C1 | más densidad y tamaño de las partículas, mantener una silueta legible, más cortas las fases sin forma (REC-002 §DA) |
| H3 | **Valle de visibilidad en los relevos**: la luminancia media de lo dibujado cae a **25 y 29** (de 255) en p 0,20 y 0,80, porque la imagen se apaga antes de que las partículas sean visibles | B | `lienzo_luminancia_media` 128 → 25 → 76 y 92 → 29 → 182 | P2 | **relevo sin valle**: la partícula aparece al 100 % mientras la imagen se apaga encima (solape ≥ 5 % del recorrido), nunca dos fundidos opuestos encadenados (SEQ-003) |
| H4 | **Partículas casi invisibles** (1 px de CSS, con el color medio de la gota sobre un fondo oscuro) | B | cobertura del 1,2 % | C1 | 2–3 px; brillo ligado a la profundidad; densidad suficiente para leer la forma |
| H5 | **Texto ilegible durante mucho tiempo** | A | sin línea legible el 50 % del tramo | P3 | meseta de lectura en el clímax o un texto secundario fijo ("rótulo de sección") que no se oculte (MOT-001) |
| H6 | **Cambio de escena que parece un corte** | C (fondo granate) | ningún pico aislado atribuible a la escena; el único detectado (0,8 s) es el **salto inicial de la grabación** | — | sin fallo; **lección de la herramienta**: descartar el primer segundo o grabar desde la posición inicial |
| H7 | **Ausencia de profundidad** | A | 2 planos (fondo y objeto) + fantasma; ningún elemento en primer plano | P4 | un plano cercano (vapor, granos) y una sombra de contacto (DEPTH-001, CAM-003) |
| H8 | **Incoherencia de materiales y luz** | C | ingredientes = esferas con un degradado genérico; plato sin sombra ni reflejos | P4 | recortes reales con la misma luz; sombra de contacto (COMP-001) |
| H9 | Protagonista pequeño a ratos | A, 1 440 px | ancho mínimo 0,29 de la ventana | C1 | ≥ 0,30 en escritorio (el umbral provisional se roza) |
| H10 | Diferencia visual al invertir en móvil | A y C, 375 px | 0,21 % y 0,14 % de píxeles | P1 (menor) | redondear las traslaciones a píxeles enteros en móvil o usar `transform` con valores en px |

## 3. Herramientas (cómo se usan)
- `node integration/tools/auditoria_visual_escena.mjs <url> <dir> '{"protagonista":"#obj","textos":[".t .linea > span"],"lienzo":"canvas"}' 1440 20` → tamaño y visibilidad del protagonista, legibilidad por línea (fracción visible dentro de su máscara × opacidad), cobertura y luminancia del canvas, **reversibilidad visual** (capturas bajando y subiendo, % de píxeles distintos).
- `python integration/tools/cortes_video.py recorrido.webm --umbral 0.30` → picos **aislados** de cambio (corte sin puente). Ignorar el primer segundo si la grabación empieza con un `scrollTo`.
- Con `medir_escena_scroll.mjs` (mecánica) y `composicion_captura.py` (C1) completan C1/C2 automáticos; **C3 sigue siendo humano**.

## 4. Reglas para detectar transiciones que funcionan pero son mediocres (umbrales provisionales)
1. Reversible (P1) **no** es suficiente: exige P2 y P3 medidos y P4 revisado.
2. **Protagonista visible** en todo el tramo: ancho ≥ 0,30 (escritorio) o ≥ 0,50 (móvil), o cobertura del lienzo ≥ 3 % durante los puentes.
3. **Sin valles**: la luminancia media de lo dibujado no cae por debajo del 50 % de la de los extremos en ningún paso del relevo.
4. **Ritmo:** ninguna ventana > 30 % del tramo sin una línea legible, salvo que sea un clímax visual declarado en el storyboard.
5. **Sin cortes:** ningún pico aislado de cambio > 0,30 que no esté en el storyboard.
6. **Reversibilidad visual** ≤ 0,5 % de píxeles distintos.
7. Si la escena solo cumple estas reglas pero los recursos son planos o genéricos → **C1/C3 suspenso** (lista contra lo genérico de ART-001).

## 5. Cómo pedirlo
"Audita la escena con AUD-001: entrega `auditoria.json` a 1 440 y 375 px, `cortes_video.py` del recorrido y una tabla de hallazgos clasificados (P1–P4) con su corrección; no la des por buena con solo P1".

## Lote 26 · Re-auditoría tras corregir y ejecutar con GSAP 3.15.0
Resultados en `evidence/demos/2026-11-02-lote26/auditoria/` y `RESULTADOS.md`.

| Hallazgo | Antes (lote 25) | Después (lote 26, GSAP) |
|---|---|---|
| A · pasos sin línea legible | 11/21 | **2/21** |
| B · cobertura mínima del lienzo | 1,2 % | **6,5 %** (1 440) / 4,8 % (375) |
| B · luminancia mínima en los relevos | 25 / 29 | **111** (extremos 128/184) |
| C · sombra de contacto | ninguna | capa propia (procedural) |
| C · oclusión del titular | no medida | **4,2 %** (375) / 0,2 % (1 440) |

- **Herramienta ampliada:**
  - `auditoria_visual_escena.mjs` (y `medir_escena_scroll.mjs`) usan el rango real de ScrollTrigger si la página expone `window.__motor.st()`; con pin, `offsetTop` no sirve.
  - Nuevo `ocluyentes` en la configuración → `oclusion_texto` por línea y `oclusion_texto_max` en el resumen.
  - Regla provisional nueva: **oclusión del texto ≤ 5 %.**
- **Límite de las métricas (lección del lote 26):** tres defectos claros **no** los detectó ninguna métrica: la cuña del plato (B), el mosaico de partículas (B) y los rótulos solapados (A). Se vieron en la **hoja de estados** (5 capturas por receta y ancho).
  - Regla: revisar **siempre** la hoja de estados a 1 440 y 375 px, además de los números.

## Lote 27 · Oclusión por alfa real y orden de profundidad
- `ocluyentes_img`: muestrea el **alfa de la imagen** (rejilla de 3 px) sobre cada línea del titular y **solo cuenta las capas que están por delante del texto** (z-index del hijo directo del escenario; en caso de empate, el orden del DOM).
  - Sin el orden de profundidad, una capa trasera contaba como oclusión.
  - Reglas: ala delantera ≤ 15 %; resto ≤ 5 %.
- **Lección:** las métricas de oclusión no detectan el **bajo contraste** de un texto oscuro sobre un panel oscuro (1,82:1). Medir también el solape del titular con paneles de color (`solape_panel.mjs`, en la evidencia del lote 27).
