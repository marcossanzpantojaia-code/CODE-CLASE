# Recursos de vídeo IA necesarios para el movimiento real

Las seis fotos actuales permiten la marioneta (patas que se doblan, cola, orejas,
inclinación de la cabeza) y los cortes de montaje que ya están en la web. **No
permiten** lo que exige un animal filmado: patas que giran sobre sí mismas,
omóplatos y pelaje que se mueven, giro real de la cabeza hacia la cámara ni un
salto completo. Para eso hacen falta los clips de esta lista.

- **No se ha generado nada.** Las herramientas de vídeo IA son de pago y no
  están autorizadas (CONSULTA_BIBLIOTECA.md, AIVID-001).
- Todo está pensado para que el clip **sustituya a la marioneta sin rehacer la
  web**: misma cámara, mismo encuadre, mismo fondo y misma luz que las fotos
  aprobadas.

## Reglas comunes (aplican a todos los clips)

| Aspecto | Requisito |
|---|---|
| Primer fotograma | La foto aprobada correspondiente (*image-to-video*). La prompt describe **solo el movimiento** (AIVID-001). |
| Fondo | Estudio blanco liso sin costuras (#F4F2EE a #FFFFFF), sin objetos, sin texto. Después se recorta (fondo → alfa). |
| Luz | Igual que en las fotos: luz de estudio suave y grande desde arriba a la izquierda de la cámara, relleno suave a la derecha y sombra de contacto suave bajo las patas. Sin contraluces de color. |
| Cámara | Fija (*locked-off*) salvo que se indique; objetivo de unos 85 mm equivalentes; sin zoom digital, sin cortes. |
| Resolución | 1920 × 1080 como mínimo (o 1080 × 1920 si se indica). Se recorta después a la caja del animal. |
| Fotogramas | 24 fps. Se extraen todos con `ffmpeg -i clip.mp4 -vsync 0 f_%04d.png`. |
| Identidad | **Gato:** atigrado marrón y gris, rayas marcadas en lomo y patas, pecho y punta de las patas blancos, ojos verdes, orejas grandes con borde claro, cola atigrada con punta oscura. **Perro:** golden retriever de pelaje dorado medio, largo y ondulado en pecho, patas y cola; orejas caídas; lengua rosa. Mismas marcas y proporciones en todos los fotogramas. |
| Continuidad | Sin cambios de identidad, sin patas que aparecen o desaparecen, sin cortes. Si el clip se encadena con otro, el último fotograma del primero es la entrada del siguiente y en el montaje se elimina el fotograma repetido (AIVID-001). |
| Entrega | MP4 H.264 de máxima calidad, o mejor ProRes/PNG si la herramienta lo permite. |

**Prompt negativo común** (añadir al de cada clip):
`extra legs, missing legs, five legs, three legs, merged legs, legs passing through each other, deformed paws, extra toes, warped face, melting fur, morphing, identity change, changing fur pattern, changing eye color, extra tail, two tails, text, watermark, logo, cuts, scene change, camera shake, zoom, motion blur smear, cartoon, 3d render, plastic look, oversaturated, dark background, colored light, props, people, hands`

---

## C1 · Gato caminando de perfil (ciclo que se repite) — PRIORIDAD 1

Sustituye la marioneta del **plano 1 (The Arrival)** y del gato de **Juntos**.

| Campo | Valor |
|---|---|
| Animal | Gato |
| Acción | Camina a paso normal hacia la derecha del encuadre, en el sitio (como en una cinta), dos zancadas completas. Cabeza estable, cola alta con una ligera ondulación. |
| Posición inicial y final | Perfil derecho completo, cuerpo centrado, ocupando ~70 % del ancho; **el último fotograma debe coincidir con el primero** (bucle). |
| Perspectiva | Lateral pura, cámara a la altura del lomo. |
| Cámara | Fija. |
| Duración | 2–3 s (2 ciclos de paso). |
| Primer fotograma | `assets/img/cast/cat-walk.webp` sobre fondo blanco. |
| Fotogramas en la web | 24–36 por ciclo; la fase se liga a la distancia recorrida (como ahora), así no patina. |

**Prompt:**
`The locked-off camera stays perfectly still as the tabby cat walks in place toward the right of the frame with a calm, natural feline gait, completing two full strides. Each paw lifts, swings forward and lands softly; shoulder blades and hips rise and fall slightly, the striped fur moves with the muscles, the head stays level and the tail is held high with a gentle sway. Clean white seamless studio, soft large key light from the upper left, soft contact shadow under the paws. Continuous, seamless shot that starts and ends on the exact same frame.`

## C2 · Gato se detiene y gira la cabeza hacia la cámara — PRIORIDAD 1

Da el momento «se detiene y observa al espectador» (final del plano 1) y la base del plano 2.

| Campo | Valor |
|---|---|
| Animal | Gato |
| Acción | Desde el paso de C1: da un último paso, se para y **gira solo la cabeza** hasta mirar directamente a cámara; parpadea una vez. |
| Posición inicial | Perfil derecho caminando (último fotograma de C1). |
| Posición final | Cuerpo de perfil parado, cabeza de frente mirando al objetivo. |
| Perspectiva | Lateral, cámara a la altura de la cabeza. |
| Cámara | Fija; como mucho un *push in* muy lento (≤ 3 %). |
| Duración | 3–4 s. |
| Fotogramas en la web | Secuencia de 48–72 fotogramas controlada por el scroll (reversible, SEQ-001). |

**Prompt:**
`Starting mid-stride, the tabby cat takes one last step, comes to a natural stop, and then slowly turns only its head toward the camera until it looks directly into the lens with its green eyes, then blinks once. The body stays in profile, the ears rotate slightly forward, whiskers move subtly. The locked-off camera remains still. Clean white seamless studio, soft key light from the upper left, soft contact shadow. Continuous, seamless shot, minimal motion besides the head turn.`

## C2b · Tira de giro de cabeza para el cursor (estilo «Little Guy») — PRIORIDAD 2

Sustituye la inclinación por marioneta del **plano 2 (The Connection)** por un giro real.

| Campo | Valor |
|---|---|
| Animal | Gato, primer plano de cara y pecho |
| Acción | Gira la cabeza lentamente de mirar 35° a su izquierda a mirar de frente al objetivo. Nada más se mueve. |
| Posición inicial / final | Cara girada 35° a su izquierda → cara de frente. |
| Perspectiva | Frontal, cámara a la altura de los ojos, encuadre de busto. |
| Cámara | Fija (*locked-off*). |
| Duración | 2 s → 48 fotogramas (la mitad derecha se obtiene reflejando, con una zona central de transición). |
| Primer fotograma | Recorte de cara de `assets/img/cast/cat-leap.webp` (o el último fotograma de C2). |

**Prompt:**
`Close-up portrait of the tabby cat. The locked-off camera remains perfectly still. The cat slowly and smoothly turns its head from looking 35 degrees to its left to looking straight into the camera, eyes calm and focused. Minimal subject motion only: no blinking, no mouth movement, body still. Clean white seamless studio, soft key light from the upper left. Continuous, seamless shot.`

## C3 · Gato salta hacia la cámara — PRIORIDAD 1

Sustituye el salto de la marioneta del **plano 3 (The Leap)**. Su cuerpo tapa el encuadre: ahí va el corte al perro.

| Campo | Valor |
|---|---|
| Animal | Gato |
| Acción | Desde el primer plano, se agacha (anticipación), salta directo hacia el objetivo con las patas delanteras estiradas y **llena el encuadre** con el pecho. |
| Posición inicial | Primer plano de frente (último fotograma de C2b o C2). |
| Posición final | Pecho y pelaje ocupando todo el encuadre, desenfocado por la cercanía. |
| Perspectiva | Frontal, ligeramente por debajo de los ojos. |
| Cámara | Fija; el gato viene hacia ella. |
| Duración | 1,5–2 s. |
| Fotogramas en la web | 36–48 por scroll; el último fotograma (todo pelaje) es el corte. |

**Prompt:**
`The tabby cat crouches briefly, then leaps straight toward the camera with both front legs stretched forward, ears slightly back, tail trailing behind. Its body comes closer and closer until its white chest and striped fur completely fill the frame and go softly out of focus. The camera does not move. Clean white seamless studio, soft key light from the upper left. Fast but continuous, seamless shot with no cuts.`

## C4 · Golden retriever corriendo hacia la cámara — PRIORIDAD 1

Sustituye la llegada del **plano 4 (The Energy)**: hoy el perro crece desde lejos con la marioneta de galope.

| Campo | Valor |
|---|---|
| Animal | Perro |
| Acción | Galope suelto y alegre directo hacia la cámara, desde el fondo del estudio hasta un plano medio; orejas y pelaje del pecho rebotando, lengua fuera. |
| Posición inicial | Pequeño al fondo, centrado. |
| Posición final | Plano medio, pose parecida a `dog-run.webp` (patas delanteras en el aire). |
| Perspectiva | Frontal, cámara baja (a la altura del pecho). |
| Cámara | Retrocede ligeramente (*dolly out*) o fija. |
| Duración | 2,5–3 s. |
| Último fotograma | Debe parecerse a `dog-run.webp`: así enlaza con el resto de la web. |

**Prompt:**
`The golden retriever gallops joyfully straight toward the camera from the back of a clean white seamless studio, ears bouncing, long golden chest fur and feathered legs moving with each stride, tongue out, paws striking the floor with soft contact shadows. The camera slowly pulls back as the dog arrives in a medium shot, front paws in the air. Soft large key light from the upper left. Continuous, seamless shot, realistic canine gallop with correct leg sequence.`

## C5 · El perro gira y sigue su camino (revelado) — PRIORIDAD 2

Para el **plano 5 (The Reveal)**: hoy es un corte bajo el pelaje al contraplano de espaldas.

| Campo | Valor |
|---|---|
| Animal | Perro |
| Acción | Llega trotando hacia la cámara, gira 180° sobre su izquierda y se aleja trotando; a mitad del alejamiento mira atrás por encima del hombro. |
| Posición inicial | De frente, plano medio (último fotograma de C4). |
| Posición final | De espaldas, alejándose, mirando atrás (como `dog-back.webp`). |
| Perspectiva | Frontal → trasera, cámara baja. |
| Cámara | Fija o *truck* lateral suave siguiendo el giro. |
| Duración | 3–4 s. |

**Prompt:**
`The golden retriever trots toward the camera, then turns around to its left in one fluid motion and trots away from the camera; halfway, it looks back over its shoulder toward the lens with a happy expression, tail wagging. The camera stays low and almost still. Clean white seamless studio, soft key light from the upper left, soft contact shadows. Continuous, seamless shot with a natural canine turn and correct leg placement.`

## C6 · Perro y gato caminando de perfil (para «Juntos») — PRIORIDAD 3

Dos clips separados (C6-perro, C6-gato), como C1, para el travelling final.

**Prompt (perro):**
`The locked-off camera stays perfectly still as the golden retriever walks in place toward the right of the frame with a relaxed trot, completing two full strides; long golden fur on the chest, legs and tail flows with the movement, head slightly bobbing, tongue out. Clean white seamless studio, soft key light from the upper left, soft contact shadow. Continuous, seamless shot that starts and ends on the exact same frame.`

**Prompt (gato):** el de C1.

---

## Qué se puede resolver ya con las fotos actuales (y ya está hecho)

| Necesidad | Solución actual | Límite |
|---|---|---|
| Gato que entra andando (plano 1) | Marioneta de perfil con la fase ligada a la distancia: la pata apoyada no patina (medido) | Las patas se doblan, no giran |
| «Te mira» (plano 2) | Corte en iris a un primer plano real de frente + inclinación de cabeza con muelle hacia el cursor (±2,8°) | Inclinación, no giro: el giro real es C2b |
| Salto y oclusión (plano 3) | La foto del salto se acerca al objetivo, se desenfoca y su pelaje tapa el corte | Sin anticipación ni cambio de forma: C3 |
| Perro corriendo hacia la cámara (plano 4) | Marioneta de galope + acercamiento en perspectiva | C4 daría las patas y el pelaje reales |
| Perro que gira (plano 5) | Corte oculto bajo el pelaje al contraplano de espaldas | C5 daría el giro continuo |

## Cómo entrarán los clips en la web (cuando existan)

1. Extraer todos los fotogramas con ffmpeg y recortar el fondo con el mismo modelo de segmentación que las fotos actuales.
2. WebP con alfa en dos juegos, escritorio (~1 200 px) y móvil (~720 px), recortados a la caja del animal (SEQ-002: memoria = ancho × alto × 4 por fotograma).
3. Un `<canvas>` por clip, dibujado con el fotograma que toque según el scroll (SEQ-001), en el mismo sitio y con el mismo pivote que hoy tiene la marioneta.
4. Precarga escalonada (fotograma 0 primero; ±5 en el sentido del scroll) y el fotograma clave como imagen estática con movimiento reducido.
5. Validación: sin saltos de más de 2 fotogramas entre pasos de scroll, sin cortes en las uniones y reversibilidad (las mismas pruebas que hoy).
