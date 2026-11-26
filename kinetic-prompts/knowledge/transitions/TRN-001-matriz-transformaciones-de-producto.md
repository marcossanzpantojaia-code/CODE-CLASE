---
id: TRN-001
titulo: Matriz de decisión para transformar un producto o pasar de una escena a otra — secuencia de imágenes, vídeo, vídeo con alfa, máscaras, desplazamiento por shader, morphing 3D, partículas, 2,5D y fundido con continuidad — qué consigue de verdad cada una, qué recursos exige y sus límites
categoria: transitions
estado: INVESTIGADO
evidencia: síntesis de fichas existentes (SEQ-001/002, VID-001, MASK-001, CLIP-001, GL-002, GL-003, MORPH-001, TSL-*, PROD-001) + DOCUMENTACION_OFICIAL_ANALIZADA / ARTICULO_AUTOR_ANALIZADO ya citadas en ellas + foro de three.js (morph de partículas por interpolación de posiciones: R2/R6) + microdemo B propia (puente de partículas en canvas 2D, coste medido)
versiones: GSAP 3.15; three r186; Chromium 153
perfil: cinematografico
ultima_revision: 2026-11-03
---

# TRN-001 · Matriz de transformaciones

**Estado:** **INVESTIGADO** (comparación). **PROBADO** solo el puente de partículas 2D (microdemo B, REC-002). El resto, según sus fichas.

1. **Efecto.** Elegir **cómo** se convierte un objeto o una escena en otra sin caer en un morph artificial ni en un corte disimulado.
2. **Cómo funciona — la matriz.**
   | Técnica | Qué consigue DE VERDAD | Recursos que exige | Límites | Ficha |
   |---|---|---|---|---|
   | **A · Secuencia de imágenes** | Cualquier transformación fotorrealista, fotograma a fotograma, reversible | N fotogramas renderizados o rodados, con alfa si va sobre HTML | Peso y memoria (PROD-001 §6); solo lo que se produjo | SEQ-001/002 |
   | **B · Vídeo prerenderizado** | Igual que A en pantalla completa, con menos peticiones | Vídeo **all-intra** para el scrub | Saltos con GOP largo; Safari y VP9; sin alfa | VID-001 |
   | **C · Vídeo con alfa** | Objeto transformándose sobre HTML (Apple AirPods Pro 3) | VP9 alfa + HEVC alfa (o *stacked alpha*) | Dos codificaciones; scrub limitado por los fotogramas clave | SEQ-001/002, CASE-004 |
   | **D · Máscaras** (clip-path, mask, SVG) | Revelar u ocultar una escena sobre otra con forma intencionada (círculo, logo, panel) | Las dos imágenes o escenas finales | **No transforma** el objeto: es un corte con estilo | MASK-001, CLIP-001 |
   | **E · Desplazamiento por shader** | Transición "líquida" o de ruido entre dos imágenes (UV desplazadas por un mapa) | 2 texturas + un mapa de desplazamiento; WebGL | Funciona entre **imágenes** (planos), no entre volúmenes; puede parecer un filtro | GL-002 |
   | **F · Morphing de geometría 3D** | Un modelo se convierte en otro (morph targets o interpolación de vértices) | Dos mallas **con la misma topología** (o remallado) y materiales PBR | Muy caro de producir bien; con mallas distintas parece plastilina | TSL-*, MORPH-001 (en 2D) |
   | **G · Partículas** | La forma A se "disuelve" y se recompone en B (CREMA, R2 17,1–17,7 s) | Muestras de A y B (píxeles con alfa o superficies 3D) y, **para el realismo, las imágenes A y B en los extremos** | Las partículas no son fotorrealistas: hacen de **puente**, no de producto; coste según N | REC-002 |
   | **H · Composición 2,5D** | Parallax y profundidad en una foto (mapa de profundidad) o en capas recortadas | Foto + mapa de profundidad o capas | Giros ≤ ±5°; se rompe al rotar o al revelar lo oculto | GL-003, CAM-003 |
   | **I · Fundido con continuidad de forma y movimiento** | Disolución entre A y B **mientras ambas comparten silueta, posición y movimiento** (R2 19,33–19,83 s, ~0,5 s) | Dos recursos encuadrados igual | Si no coinciden la silueta o la posición, es un corte borroso | REC-001/003 |
3. **Cuándo usar cada una (reglas).**
   1. **Solo hay dos fotografías incompatibles** (encuadre, luz y escala distintos) → **D o I**, o rediseñar el paso. **Nunca** F ni un morph "anatómico": no hay información intermedia.
   2. **Hay que cambiar de forma o de material con realismo** → **A, B o C** (producirlo en Blender o rodarlo); si no hay presupuesto → **G como puente** entre dos imágenes de calidad.
   3. **Cambio de escena sin transformar el objeto** → D o I + continuidad (CONT-001).
   4. **Profundidad sin 3D** → H (pequeña) o capas DEPTH-001.
   5. **La interactividad libre (girar con el ratón) es imprescindible** → F/3D en tiempo real (CAM-001/002), aceptando un realismo menor que el render.
4. **Recursos.** Ver la columna de la tabla. Licencias en ASSET-001.
5. **Tecnologías.** Canvas 2D, `<video>`, CSS mask/clip-path, WebGL/Three.js (E, F, G en 3D), GSAP para orquestar (nunca genera por sí mismo partículas ni materiales).
6. **Estructura.** Toda transformación tiene **tres tramos**: (1) A estable y legible (meseta), (2) puente (la técnica), (3) B estable. El puente debe **empezar exactamente en A y acabar exactamente en B** (mismos píxeles, posición y escala); si no, se nota el corte.
7. **Parámetros.** Duración del puente (15–40 % del recorrido del acto) y solape de los fundidos en los extremos (5–8 %); en G, N y la forma del retardo por partícula.
8. **Problemas visuales.**
   - Morph artificial (plastilina) por topologías incompatibles.
   - Puente que no coincide con los extremos (salto).
   - Partículas sin relación con el producto.
   - Desplazamiento por shader con aspecto de filtro de vídeo.
   - Máscara que se ve "de PowerPoint" (formas genéricas sin relación con la marca).
9. **Móvil.** Menos N en G; secuencias con resolución de móvil (SEQ-002); E y F con un respaldo D/I si no hay WebGL (WGPU-001).
10. **Reduced motion.** Sustituir el puente por los estados A y B estáticos (o un fundido sin movimiento).
11. **Coste (orientativo).**
    - D/I: casi nulo.
    - G en canvas 2D: **2 318 partículas → script p95 6,2 ms; 9 278 → p95 19,1 ms** [MED, microdemo B, contenedor sin GPU]. Por encima de ~5 000, pasar a WebGL (`THREE.Points`/instancing con interpolación en el *shader*).
    - A/B/C: descarga y memoria.
    - E/F: GPU.
12. **Pruebas.** Comprobar en las capturas que el inicio y el fin del puente coinciden con A y B (diferencia por píxeles en esos fotogramas); vídeo bajando y subiendo; coste por fotograma con N creciente.
13. **Evidencia.** Microdemo B (REC-002). El resto, según cada ficha (DOCUMENTADO).
14. **Cómo pedirlo.** "Para el paso de X a Y aplica la matriz TRN-001: di qué recursos existen realmente, qué técnica eliges y por qué no las otras, y cómo garantizas que el puente empieza en A y termina en B".

## Lote 28 · Dos técnicas de transición extraídas de vídeos (con código leído)
1. **Banda de disolución** (Codegrid 9Y2bjYQCWvE; código en los fotogramas 8:35 y 10:00), sin canvas ni WebGL:
   - imágenes apiladas, cada una recortada con `clip-path: polygon` de arriba abajo;
   - encima, una rejilla de celdas (`div` con un carácter) que solo son visibles cerca del borde de la transición.
   - Por celda: distancia a la banda + desplazamiento aleatorio determinista (*hash* seno) escalado por la distancia al núcleo → densidad `(1 − d)²` → visible si supera un umbral aleatorio fijo.
   - Fuera de las transiciones se ocultan todas las celdas (ahorro).
   - **Para Enky:** el mismo cálculo de banda sirve para hacer aparecer y desaparecer **partículas de color de la propia imagen** (REC-002) en lugar de caracteres.
   - **Coste no medido:** el bucle recorre todas las celdas en cada fotograma.
2. **Desmaterialización con filtro SVG** (Hyperplexed z1wZp4jV4cQ; CodePen MWqNroM):
   - `feTurbulence type=fractalNoise baseFrequency="0.7 0.8"` con `seed` animado;
   - `feDisplacementMap in=SourceGraphic scale` 0 → 40 → 0 (con `scale = 0` en reposo).
   - Con scroll: `gsap.to('#desp', { attr: { scale: 40 } })` en un timeline con scrub.
   - **Medido (lote 28, sin GPU):** a pantalla completa, p95 = 50 ms y 15–21 fotogramas > 33 ms → **no viable**; del tamaño del producto (40vw × 60vh), 0 fotogramas > 33 ms → **viable**.
   - Uso: transformar la superficie de un producto (vapor, calor, "decodificación") en el relevo del héroe al plato de REC-003, nunca el fondo. Fuente: `integration/YOUTUBE_ESTUDIOS.md` y `evidence/youtube/2026-11-03-lote28/`.

## Lote 30 · Morph líquido, cortina líquida y morph de contorno (SonduckFilm): vectorial frente a fotorrealista
| Técnica (AE) | Equivalente web | ¿Sirve con fotos de producto? |
|---|---|---|
| Desenfoque gaussiano 100 + Simple Choker (*gooey*, YcHH6_T9DTU) | SVG `feGaussianBlur` + `feColorMatrix` (umbral de alfa) | **No:** funde contornos de **color plano**; con una foto destruye textura y luz. Sí para gotas o salpicaduras gráficas |
| Rectángulos con Turbulent Displace (Twist 150) escalonados + track matte (uX5J3dnQZao) | máscara SVG con `feTurbulence`/`feDisplacementMap`, o borde ondulado precalculado | **Sí como transición entre escenas** (la máscara es gráfica y lo revelado puede ser una foto). A pantalla completa: prerenderizar o calcular sin filtro (p95 = 50 ms, lote 28) |
| Morph de trayectorias con auto-trace (tolerancia 2–5), velocidad máxima en el centro y motion blur (xvCTlEIvC8U) | MorphSVG / `d` de SVG | **No** para el objeto fotográfico (solo su silueta). Transformación fotorrealista → AIVID-001 o 3D |

Regla: **el morph es de la máscara o del clip, nunca de los píxeles de una foto.**

## Lote 32 · Técnicas WebGL de Yuri Artiukh (transcripción parcial; necesitan WebGL: three.js sin autorizar o WebGL nativo)
| Técnica | Vídeo | Qué aporta a una transición de producto | Estado |
|---|---|---|---|
| **Triángulos independientes:** geometría no indexada (`toNonIndexed`), atributos por triángulo (aleatorio, `aCenter` = media de los 3 vértices) y escala hacia su centro con el progreso | frgmk0Wu76A 10:04–57:27 | Desintegrar un modelo 3D en fragmentos (CREMA: gota → partículas) | PROPUESTO (requiere modelo 3D) |
| **Progreso local desfasado por posición:** `lp = clamp((P − w·d)/(1 − w))`, con d ∈ [0, 1] según la altura | frgmk0Wu76A 1:09:38–1:18:38 | Ola de disolución o aparición que recorre el objeto. **Se puede aplicar en 2D** a partículas o teselas de una foto | PROPUESTO |
| **Sombras de un shader propio:** material de profundidad con el **mismo** uniform | frgmk0Wu76A 38:57–41:50 | La sombra se deforma igual que el objeto | PROPUESTO |
| **Luz horneada (light maps)** en el sitio original, no sombras en tiempo real | frgmk0Wu76A 21:06–22:25 | Confirma la regla de AIIMG-001: hornear | — |
| **Teletransporte:** 2 escenas en *render targets* y un plano final que las mezcla con una **distorsión radial de zoom** (uv centradas; un exponente controla lo "explosivo"; `pow(…, 32)` produce un estallido al final; la segunda imagen entra retrasada con `smoothstep(0,75; 1; p)`) | GeNjyb8UBKM 44:47–1:08:30 | Pasar entre dos fotos de IA con un "salto" de zoom radial. **Sirve para fotos** (deforma la UV, no la forma) | PROPUESTO. Fórmula no leída completa |
| **Ajedrez por celdas:** valor 0..1 por celda y `smoothstep` sobre el progreso menos el valor | NRheDOjkOs8 29:37–39:10 | Rótulos de sección (texto MSDF) | PROPUESTO |
| **Luz IBL desde una JPEG** (PMREM) que envuelve los bordes, animada rotando el vector de reflexión, + bloom | Vr9l4m6bkcQ 13:11–51:23 | Producto 3D con luz de contorno viva | PROPUESTO (requiere 3D) |

**Vectorial frente a foto:** el teletransporte y el ajedrez deforman o enmascaran **coordenadas UV** de imágenes, así que funcionan con fotos. Los triángulos y la IBL necesitan geometría 3D.
