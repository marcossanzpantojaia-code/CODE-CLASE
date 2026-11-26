# CONTRATO DE RECURSOS · REC-003 con imágenes generadas por IA (lote 27)

**Para quién:** la persona que genera las imágenes (con cualquier generador) y Claude Code, que las integra.

**Qué se integra:** la escena "producto fijo, entorno cambiante" (REC-003), con identidad **original**. No se usan textos, marcas ni recursos de la referencia; la marca es `[MARCA]` hasta que el usuario la defina.

**Qué no hace falta:** nuevas preguntas. Lo variable está fijado aquí.

**Comprobación automática:** `integration/tools/preparar_recursos.py preparar integration/contratos/contrato_rec003.json <entrada> <salida>`.

---

## 1. Idea de la escena (3 actos, identidad propia)
| Acto | Protagonista | Texto (propio) | Fondo |
|---|---|---|---|
| 1 · "La vuelta" | **Tenedor que levanta un nido de tagliatelle** enrollado, con salsa, a la derecha del encuadre, cruzando el borde de un panel terracota | "Amor al / primer giro." | hueso a la izquierda y terracota a la derecha |
| 2 · "Lo que lleva" | El mismo tenedor, **fijo**. Los ingredientes salen y orbitan en 3 planos de profundidad | "Un poco / de todo." | el panel sale hacia arriba; queda el hueso |
| 3 · "La mesa" | La pasta baja y **se posa en el plato**, que entra desde abajo; el plato queda fijo | "Tu mesa / te espera." | hueso con una sombra de contacto suave |

**Paleta propia:**

| Uso | Color |
|---|---|
| hueso | `#F2EADF` |
| terracota | `#A4472D` |
| tinta | `#2A1C14` |
| oliva (acento) | `#6B6B3A` |

---

## 2. BIBLIA VISUAL — pegar al principio de CADA prompt (no cambiar ni una palabra entre recursos)
```
Commercial food photography for a premium Italian trattoria website. Photorealistic, high detail, natural textures.
Camera: 100mm lens equivalent, camera elevation 30 degrees above the subject (three-quarter view), no tilt, no dutch angle.
Lighting: large soft key light from the UPPER LEFT at 45 degrees, soft white fill from the right at low intensity,
subtle warm rim light from behind right. White balance neutral-warm (about 4500K). Soft shadows falling to the lower right.
Sharp focus front to back (f/11), no depth of field blur, no motion blur, no lens flare, no vignette.
Isolated subject, nothing else in frame, generous empty margin around the subject.
```
**Fondo** — añadir UNA de estas dos líneas, por este orden de preferencia:

- A) `transparent background, PNG with alpha` — si el generador exporta transparencia real.
- B) La línea de fondo liso indicada en cada recurso (§4), elegida por **contraste con los bordes del objeto** (§6).

**Negativo** — en el campo de prompt negativo o al final del prompt:
```
text, letters, watermark, logo, brand, label, hands, people, table, tablecloth, props, multiple plates, cropped subject,
cast shadow on the background, background texture, gradient background, bokeh, blur, vignette, reflections of a room
```
**Consistencia** (dentro de lo que el generador permita):

- Genera primero el recurso I2 (el plato) y úsalo como **referencia de estilo** en todos los demás. En Midjourney, `--sref <URL de I2>` transfiere el estilo, no el sujeto; el sujeto lo da el texto.
- **Reutiliza la semilla** o el código de estilo resultante.
- No cambies la biblia visual entre recursos.

---

## 3. Lista de recursos
| ID | Recurso | Prioridad | Archivo de entrega |
|---|---|---|---|
| **I1** | Tenedor con nido de tagliatelle (héroe de los actos 1–2) | **IMPRESCINDIBLE** | `I1_heroe_tenedor.png` |
| **I2** | Plato servido (héroe del acto 3; capa trasera, delantera y sombra derivadas) | **IMPRESCINDIBLE** | `I2_plato.png` |
| **I3** | 6 ingredientes sueltos (uno por imagen) | **IMPRESCINDIBLE** (mín. 4 de 6) | `I3_<nombre>.png` |
| O1 | Secuencia del tenedor bajando al plato (vídeo de imagen a vídeo, 2–3 s) | opcional (mejora la continuidad del acto 3) | `O1_secuencia.mp4` (o carpeta de PNG) |
| O2 | Salpicadura de salsa o hilo de aceite suelto | opcional | `O2_salpicadura.png` |
| O3 | Textura de fondo sutil (papel o lino), sin objetos | opcional | `O3_fondo_escritorio.png` y `O3_fondo_movil.png` |
| O4 | Variante vertical del héroe para móvil | opcional (solo si I1 sale horizontal) | `O4_heroe_movil.png` |

Sin I1, I2 y al menos 4 de I3, la página **no arranca** y muestra qué falta: no se dibujan sustitutos.

---

## 4. Especificación por recurso (prompts listos)
### I1 · Tenedor con nido de tagliatelle — IMPRESCINDIBLE
- **Encuadre:**
  - VERTICAL 2:3. El tenedor entra desde arriba, ligeramente inclinado (10–15°, mango hacia arriba a la derecha).
  - El nido de pasta ocupa el **tercio inferior central** y la salsa gotea levemente hacia abajo.
  - Margen vacío ≥ 8 % en todos los lados: no puede tocar el borde.
- **Resolución:** ≥ 1536 × 2304 px (mínimo aceptado: 1024 × 1536).
- **Fondo (si no hay transparencia):** `plain flat mid-grey seamless background (#7A7A7A)`.
  - Los bordes son metal claro, pasta amarilla y salsa roja oscura: un gris medio contrasta con los tres.
- **Prompt (tras la biblia):**
```
A single silver fork lifting a tight twirled nest of fresh egg tagliatelle coated in glossy tomato sauce, a few drops of
sauce about to fall, two small basil leaves tucked in the pasta, fine parmesan dust. The fork enters from the top of the
frame, tilted 12 degrees. Vertical composition, subject centred, the pasta nest in the lower third.
```

### I2 · Plato servido — IMPRESCINDIBLE (generar PRIMERO)
- **Encuadre:**
  - HORIZONTAL 3:2. Plato hondo blanco hueso, de ala ancha, **completo y centrado**, visto a 30° (elipse con alto/ancho ≈ 0,50).
  - Pasta en nido **en el centro** y **nada sobre el ala delantera**: la capa delantera de oclusión se recorta automáticamente de esa ala.
- **Resolución:** ≥ 2400 × 1600 px (mínimo aceptado: 2048 × 1365).
- **Fondo (si no hay transparencia):** `plain flat dark charcoal seamless background (#2E2E2E)`.
  - Medido en el lote 27: un plato claro sobre un gris claro **no se puede recortar** (halo claro de +71,5). Sobre un fondo oscuro sí, y la descontaminación deja el borde en −7,7.
- **Prompt:**
```
A wide-rimmed off-white ceramic pasta bowl, completely visible and centred, seen from 30 degrees above. In the centre a
neat nest of tagliatelle in glossy tomato sauce with torn basil leaves and parmesan shavings. The front rim of the plate
is clean and empty. No cutlery, no tablecloth. Soft contact shadow only directly under the plate.
```

### I3 · Ingredientes (uno por imagen) — IMPRESCINDIBLE, mínimo 4
- **Encuadre:** CUADRADO 1:1, un solo ingrediente **flotando** (sin superficie ni sombra en el suelo), centrado y con un margen ≥ 15 %.
- **Resolución:** ≥ 1024 × 1024 px.
- **Fondo (si no hay transparencia):** `plain flat mid-grey seamless background (#7A7A7A)`; para la albahaca, `#B8B8B8`.
- **Plantilla de prompt:** `A single <INGREDIENT>, floating, isolated, seen from 30 degrees above, studio lit.` Sustituir `<INGREDIENT>` por:

  | Archivo | `<INGREDIENT>` |
  |---|---|
  | `I3_tomate.png` | `ripe cherry tomato on the vine stem, glossy skin with a small specular highlight` |
  | `I3_tomate_partido.png` | `halved cherry tomato showing seeds, juicy` |
  | `I3_albahaca.png` | `fresh basil leaf, slightly curved, visible veins` |
  | `I3_parmesano.png` | `thin curled shaving of aged parmesan cheese` |
  | `I3_ajo.png` | `peeled garlic clove` |
  | `I3_guindilla.png` | `small dried red chili pepper` |

### O1 · Secuencia tenedor → plato (opcional, recomendada)
- **Herramienta:** un generador de **imagen a vídeo** con I1 como fotograma inicial e I2 como fotograma final, si la herramienta admite el fotograma final.
- **Formato:** 2–3 s, 24 fps, la misma cámara y luz, **sin cortes ni zoom de cámara**, y el fondo liso del mismo color en todos los fotogramas.
- **Entrega:** el MP4 sin recomprimir. Claude Code extraerá 48–72 fotogramas, los recortará y los servirá como secuencia (SEQ-002 y SEQ-003).
- **Si no hay O1:** el acto 3 se resuelve con un relevo de silueta coincidente (§7).

### O2 · O3 · O4
- **O2:** salpicadura o hilo de aceite. Formato 1:1, ≥ 1024 px, mismo fondo que I3.
- **O3:** textura sin objetos, de bajo contraste, en tono hueso `#F2EADF`. Tamaños: 2560 × 1440 (escritorio) y 1080 × 1920 (móvil).
- **O4:** como I1, pero más estrecho (9:16) y con el nido en el centro.

---

## 5. Formatos de entrega
- **Formato:** PNG RGBA de 8 bits por canal, sRGB, sin perfil exótico. Si el generador solo da JPEG o WebP, entregar el original **sin recomprimir**.
- **Prohibido:** reescalar hacia arriba, añadir sombras, recortar el objeto al borde, ni pasar las imágenes por un editor que las "aplane" sobre blanco.
- **Nombres:** exactamente los de la §3, todos en **una carpeta**.
- **Variantes:** no hace falta entregar variantes para móvil. Claude Code exporta WebP y AVIF a 1640, 1080 y 820 px (ingredientes a 512, 256 y 128) y elige por ancho × DPR.

---

## 6. Por qué esos fondos (si el generador no da transparencia)
- El recorte por **llave de diferencia** (`preparar_recursos.py`) necesita un fondo **liso** (desviación < 6 niveles) y **distinto del borde del objeto**.
- **Medido en el lote 27:**
  - plato claro sobre gris claro → franja de 14 437 px y halo claro de +71,5: inutilizable;
  - el mismo plato sobre gris oscuro → halo de −51,8, que la **descontaminación** reduce a −7,7.
- Ningún color de fondo es perfecto para un objeto que refleja (el tenedor). Por eso la prioridad es la **transparencia real** o el recorte con la herramienta de eliminación de fondo del propio generador, y después `preparar_recursos.py` (descontamina el borde, mide el halo y genera las capas).

---

## 7. Qué hará Claude Code con cada recurso (integración preparada)
| Recurso | Capas que se generan | Uso en la escena |
|---|---|---|
| I1 | héroe (y su sombra en el panel) | Actos 1–2: fijo a la derecha, con un leve dolly (escala 1 → 1,04); el panel sale por detrás |
| I2 | `producto` (trasera), `producto_delantero` (media luna del ala, recorte automático por elipse), `producto_sombra` (sombra **horneada**) | Acto 3: el titular queda enhebrado entre la capa trasera y la delantera (solape ≤ 15 %) |
| I3 | 3 variantes por ingrediente (plano 0 con desenfoque horneado y planos 1–2 con sombra horneada) | Acto 2: órbitas en 3 planos que se atenúan al pasar sobre el titular (oclusión ≤ 5 %) |
| O1 | secuencia de fotogramas | Acto 3: la pasta baja al plato con continuidad real |
| sin O1 | — | Acto 3: el plato entra desde abajo hasta que el nido coincide en posición y tamaño con el del tenedor; relevo **sin valle** (I2 al 100 % debajo, I1 se desvanece encima) en ≤ 8 % del recorrido |

---

## 8. Criterios de aceptación automáticos (`preparar_recursos.py`)
| Comprobación | I1 | I2 | I3 |
|---|---|---|---|
| Tamaño mínimo | 1024 × 1536 | 2048 de ancho | 1024 |
| No toca el borde | sí | sí | sí |
| Halo tras descontaminar (luminancia de la franja − interior) | \|x\| < 25 | \|x\| < 25 | \|x\| < 25 |
| Luz estimada | arriba-izquierda | arriba-izquierda | arriba-izquierda |
| Elevación de cámara (elipse del plato) | — | 25–35° | — |
| Memoria decodificada total servida | ≤ 60 MB en escritorio | | |

Lo que la máquina **no** puede aprobar (persona, C1/C3): apetecibilidad, realismo de la salsa, coherencia de estilo entre recursos, y si el conjunto alcanza la calidad de la referencia.
