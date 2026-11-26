---
id: MBLUR-001
titulo: Motion blur en el navegador para recursos 2D — acumulación analítica en canvas (obturador de 180° centrado, muestras ≤ 1,5 px, árbol 4×4 contra el sesgo de 8 bits, estela limitada), qué aproximación sirve para cada tipo de recurso y qué exige prerenderizar
categoria: animations
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia (lote 31: comparación con una referencia de supermuestreo temporal de 16 subfotogramas; pruebas de scroll lento, rápido e inverso) + ARTICULO_AUTOR_ANALIZADO (C. y T. Meyer, ProVideo Coalition, "Motion Blur Musings", 2008, y "CMG Hidden Gems: Chapter 8", 2011) + DOCUMENTACION_OFICIAL_ANALIZADA (Adobe After Effects SDK, "Motion Blur": shutter_angle / shutter_phase)
versiones: Canvas 2D (Chromium 153), GSAP 3.15.0 solo como reloj
perfil: cinematografico
ultima_revision: 2026-11-04
---

# MBLUR-001 · Motion blur por acumulación analítica en canvas

**Estado:**
- **IMPLEMENTADO (mecánica)** y medido frente a una referencia.
- Probado **solo con fixtures**: C1 y C3 sin evaluar.
- Pendiente: medir el coste en un móvil real.

## 1. Efecto
Un objeto que se mueve rápido deja una estela corta en la dirección del movimiento, como con el obturador de una cámara. Elimina el "estroboscopio": copias nítidas separadas decenas de píxeles entre fotogramas.

## 2. Cómo funciona
- **Principio (After Effects):**
  - el motion blur nativo de capa **solo** existe para capas movidas por sus propiedades de transformación (posición, rotación…);
  - **no** se añade a material ya renderizado (Meyer 2011);
  - el obturador de 180° es el de cine;
  - la fase recomendada es **−½ del ángulo**, para que el desenfoque quede centrado en el fotograma; con fase 0 el movimiento parece pararse de golpe en los fotogramas clave (Meyer 2008);
  - pocas muestras producen **ecos** visibles.
- **Web:** si el protagonista es una imagen 2D movida por transformaciones y su estado se puede **evaluar en cualquier instante** (trayectoria analítica: Hermite o timeline de GSAP con `seek`), el desenfoque se calcula igual:
  1. Δt = avance REAL del tiempo de la transición desde el último render. Con scroll, Δt depende de la velocidad del usuario.
  2. Ventana de obturación `[t − ¼Δt, t + ¼Δt]` (180°, fase −0,5).
  3. Longitud de la estela = desplazamiento del nido en la ventana (+ cambio de escala). **Se limita** a 0,12 × el ancho del nido; con scroll rápido o saltos, la ventana abarcaría media trayectoria.
  4. Muestras: 1 si la estela mide < 1 px; 4 si mide ≤ 6 px; 16 si es mayor. Así quedan como mucho a 1,5 px y no hay ecos.
  5. **Árbol 4×4:** 4 lienzos con 4 muestras cada uno (`lighter`, alpha ¼) y después la suma de los 4 (alpha ¼). Sumar 16 copias con alpha 1/16 en un lienzo de 8 bits **sesga el color**.
- **Sesgo medido** (Chromium, gris 120 opaco):

  | Método | Resultado |
  |---|---|
  | 9 muestras planas | 128 |
  | 16 muestras planas | 128 |
  | 24 muestras planas | 144 |
  | Árbol 4×4 | 120 (correcto) |

  En píxeles semitransparentes: 230/64 → 255 con 16 planas y 239 con el árbol (`dbg4.mjs`).

## 3. Cuándo usarlo
- Protagonista 2D (foto recortada) con velocidades > ~5 px por fotograma.
- **No** con texto (pierde legibilidad, Meyer 2008) ni con objetos casi quietos (K = 1, coste nulo).

## 4. Recursos
El recurso nítido del protagonista. **No hace falta pedir variantes "smear"** si el movimiento es una transformación 2D: corrige la receta del lote 30 (I1-smear).

## 5. Tecnologías — qué aproximación sirve para cada caso
| Aproximación | Sirve con | Necesita | Decisión |
|---|---|---|---|
| **Acumulación analítica** (esta ficha) | Fotos 2D movidas por transformaciones | Estado evaluable en cualquier t | **Tiempo real** |
| Desenfoque direccional prerenderizado (variante *smear*) | Fotos 2D, una dirección fija | Recurso extra; no se adapta a la velocidad del scroll | Solo si no hay canvas |
| Fotogramas intermedios | Cambios de forma | Dibujarlos o generarlos | Prerenderizar |
| Flujo óptico / vectores (Pixel Motion Blur, Timewarp) | **Vídeo** sin desenfoque (clips de IA, renders sin blur) | Vectores de movimiento; puede "derretir" la imagen (Meyer 2011) | Prerenderizar en el editor, ≥ 12 muestras |
| Blur real de render 3D o cámara | Giros, deformaciones, líquidos | Información 3D o rodaje | Secuencia (SEQ-001, AIVID-001) |
| `filter: blur()` CSS | — | Es **isotrópico**: destruye forma y material; caro animado (AIIMG-001) | **No usar** |

## 6. Estructura
Fuente: `evidence/demos/2026-11-04-lote31/escena31.js`, funciones `render()` y `dibujaSprite()`.
```js
const lo = t - .25 * dt, hi = t + .25 * dt;                        // 180°, fase −0,5
const d0 = desplazamiento(estado(lo), estado(hi));
const lim = .12 * anchoNido, k0 = Math.min(1, lim / d0);          // estela limitada
const K = d0 < 1 ? 1 : Math.min(d0, lim) <= 6 ? 4 : 16;
// K = 16 → 4 grupos × 4 muestras con 'lighter' y alpha .25, y después la suma de los grupos con alpha .25
```

## 7. Parámetros
- Obturador 0,5 (180°) y fase −0,5.
- `blurMax` = 0,12 × el ancho del nido.
- Muestras: 1, 4 o 16.

## 8. Problemas visuales
- Ecos (muestras escasas).
- Color aclarado (sumas planas de 8 bits).
- Estela gigante con scroll rápido (sin límite: 799 px medidos).
- Desenfoque en elementos que no se mueven.
- **El plato (capa DOM) no tiene desenfoque:** en la animática entra a 36 px por fotograma sin blur. Pendiente.

## 9. Móvil
Mismo algoritmo. La estela se mide en px de pantalla, así que en móvil sale más corta. Coste pendiente de medir en un dispositivo real.

## 10. Reduced motion
Sin movimiento → K = 1 (sin desenfoque).

## 11. Coste
- ≤ 16 `drawImage` del protagonista + 4 composiciones del lienzo por fotograma, solo mientras se mueve.
- En el contenedor (sin GPU), la prueba de scroll no dio errores. **No se midieron fotogramas > 33 ms con CDP.**

## 12. Pruebas (lote 31, `evidence/demos/2026-11-04-lote31/ref_blur/`)
Referencia: **16 subfotogramas** renderizados sin blur dentro de la ventana de 180° y promediados. Error medio (0–255) en los píxeles del borde que el movimiento cambia:

| Fotograma | Estela | Acumulación | Sin blur |
|---|---|---|---|
| f14 | 5 px | **2,62** | 5,23 |
| f18 | 10,4 px | **1,13** | 4,42 |
| f21 | 12,2 px | **1,08** | 4,93 |

- En f24 y f28 ambos errores son altos (16–18): domina el plato, que entra sin blur.
- Antes del árbol 4×4, la acumulación plana daba un error **mayor** que no desenfocar (1,72 frente a 0,15 de media en f21) por el sesgo de 8 bits.
- **Lección: una técnica de blur se valida contra una referencia, no a ojo.**

## 13. Evidencia
`evidence/demos/2026-11-04-lote31/` (`ref_blur.mjs`, `err_blur.py`, `errores_blur.json`, `comparacion_blur_f21.png`: sin blur | acumulación | referencia).

## 14. Cómo pedirlo
"Añade motion blur con MBLUR-001:
- estado del protagonista evaluable en cualquier t;
- obturador de 180° centrado; estela limitada; árbol 4×4;
- compáralo con una referencia de 16 subfotogramas en los fotogramas de máxima velocidad: el error en los bordes debe ser menor que sin blur."

## Lote 32 · Corrección de rendimiento (medida)
- **Problema:** la versión del lote 31 dibujaba el sprite completo (540 × 1 144 px, casi todo transparente) en cada una de las 16 muestras y limpiaba y componía **lienzos de pantalla completa**. JS p95 de **28,6 ms** por fotograma a 1 280 px (`evidence/demos/2026-11-04-lote32/coste/coste32_sin_optimizar.json`).
- **Corrección** (`evidence/demos/2026-11-04-lote32/escena32.js`):
  1. **Recorte del sprite** a la caja del nido, centrado en el ancla.
  2. **Rectángulo sucio:** solo se limpia, acumula y compone la caja que cubre las muestras (`est.caja`).
- **Resultado:** JS p95 de **5,3 ms**. Con CPU × 4: 2 fotogramas > 33 ms (antes, 7–9). Imagen idéntica: diferencia media 0,002 niveles y p99,9 ≤ 1.
- **`escena32.js` sustituye a `escena31.js`** en las plantillas nuevas. La plantilla del lote 31 se conserva como historial.
