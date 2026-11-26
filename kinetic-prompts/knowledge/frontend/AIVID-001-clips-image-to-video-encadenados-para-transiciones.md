---
id: AIVID-001
titulo: Clips image-to-video encadenados para transiciones web — la imagen como primer fotograma, la prompt describe solo el movimiento, quitar pistas de movimiento implícitas, encadenar por el último fotograma y eliminar el fotograma compartido, planos casi fijos y bucles, cobertura de ángulos a partir de clips cortos, y cómo llevar el resultado a una secuencia por scroll sin fundido
categoria: frontend
estado: PROPUESTO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (Runway Help Center, "Image to Video Prompting Guide", Gen-4.5, leída el 2026-11-04) + ARTICULO_AUTOR_ANALIZADO (Curious Refuge, M. Huang, "How to Change Camera Angles With AI", Seedance 2.5) + fichas propias ya probadas (SEQ-001/002/003, AIIMG-001, GS-005 / Flip.fit del lote 28)
versiones: Runway Gen-4.5 (según la guía); Seedance 2.5 (según el artículo). Ninguna herramienta de vídeo IA se ha usado en la biblioteca (0 €).
perfil: cinematografico
ultima_revision: 2026-11-04
---

# AIVID-001 · Clips image-to-video encadenados para transiciones web

**Estado:** PROPUESTO. Es la parte de vídeo que faltaba en AIIMG-001: **cómo producir** el material animado que después se integra con SEQ-001/002.
- **Lo documentado** procede de la guía oficial de Runway y de un artículo de Curious Refuge.
- **Lo que la biblioteca añade** (§6, cosido web) usa herramientas existentes. Todavía no se ha ejecutado con clips reales porque no hay ninguno.
- **No se atribuye ninguna de estas herramientas a Enky:** no hay evidencia de qué usa (CASE-003 solo tiene la etiqueta de Instagram "Contenido generado con IA").

## 1. Efecto
Dos escenas generadas (p. ej. el tenedor con pasta → el plato) unidas por **movimiento continuo del mismo objeto**, en lugar de dos imágenes con un fundido.

## 2. Cómo funciona — reglas documentadas
| Regla | Fuente | Por qué importa para la web |
|---|---|---|
| **La imagen de entrada es el primer fotograma** y fija composición, sujeto, luz y estilo. **La prompt describe el movimiento**, no lo que ya se ve | Runway | La imagen I1/I2 del contrato REC-003 se puede reutilizar tal cual como fotograma inicial |
| Se describe lo visual **solo** para: elementos nuevos, cambios drásticos, detalles de una transformación e interacciones entre elementos | Runway | En una transformación (pasta que cae al plato) **sí** hay que describir el estado final |
| Estructura orientativa: *"The camera [movimiento] as the subject [acción]. [Detalles]"*. La claridad importa más que el orden | Runway | — |
| Vocabulario de cámara de los ejemplos: *push in, zoom out, handheld, whip pan, arc, crash zoom* | Runway | El *push in* corresponde a CAM-003 y expoScale (MOT-002) si el zoom se hace en la web |
| **Quitar de la imagen las pistas de movimiento implícitas** (desenfoque de movimiento, polvo, poses a medio gesto, líneas de dirección) si contradicen la prompt | Runway | Conflicto con COMP-001: el contrato pide recursos nítidos y aislados. Para vídeo, la imagen debe estar **en reposo** |
| Una imagen con artefactos (manos o caras borrosas) **los empeora** en vídeo | Runway | Pasar antes la inspección de AIIMG-001 |
| **Secuencia temporal:** "X, después Y; finalmente Z" o marcas `[00:01] … [00:03]`, ajustadas a la duración | Runway | Permite fijar el **momento del contacto** que la web hará coincidir con un estado de scroll |
| **Encadenar clips:** usar el **último fotograma** del clip A como entrada del B; al montar, **eliminar el fotograma compartido** | Runway | Es la base del cosido sin fundido (§6) |
| **Plano casi fijo o bucle:** *"The locked-off camera remains perfectly still"*, *"Minimal subject motion only"*, *"…start and end on the exact same frame…"*; si hace falta, estabilizar después | Runway | Fondos vivos detrás de titulares sin que el encuadre se mueva (capas de DEPTH-001) |
| **Cortes no deseados:** primero aumentar la duración; si siguen, quitar lo que sugiera un corte y añadir *"Continuous, seamless shot"* | Runway | `cortes_video.py` detecta esos cortes antes de integrar |
| **Cobertura de otro ángulo:** clips cortos de 3–5 s, el original declarado como "maestro" de identidad, objetos, luz, acción y tiempo, y restricciones explícitas (sin acciones ni objetos nuevos, sin cortes, velocidad normal). **2–3 iteraciones** de media | Curious Refuge (Seedance 2.5) | **Límite observado por el autor:** la continuidad del objeto no está garantizada (una naranja pasó a ser un pimiento) → la inspección del producto es obligatoria |

## 3. Cuándo usarlo
- Cuando la transición de Enky exige **transformación o giro real** del producto (CASE-003: la pasta que baja al plato), que una imagen fija no puede dar (MOT-002: `rotateY` sobre una foto delata el truco).
- Si el movimiento es solo de traslación o escala, basta con capas de imagen (REC-003).

## 4. Recursos
- Imagen inicial en reposo (contrato REC-003).
- Opcional: imagen final; la guía de Runway solo documenta la imagen inicial y su app Animate Frames, sin detallar el control del fotograma final.
- Prompt de movimiento.
- Duración suficiente para la secuencia.

## 5. Tecnologías
- Generador image-to-video (de pago; **no autorizado**, 0 €).
- ffmpeg para extraer fotogramas (disponible en el contenedor).
- `preparar_recursos.py` para el recorte por fotograma.
- SEQ-001 (canvas) y GS-005 para el scroll.

## 6. Estructura — cosido sin fundido (propuesta de la biblioteca; sin ejecutar)
1. **Generar A** desde I1, con la prompt de movimiento y el momento del contacto marcado (`[00:03]`).
2. **Generar B** con el **último fotograma de A** como imagen de entrada.
3. **Extraer** los fotogramas de A y B con ffmpeg y **descartar el primer fotograma de B**, porque duplica el último de A. Si se deja, produce una **meseta**: un paso de scroll sin cambio, de la misma familia que los "fantasmas" de SEQ-003.
4. **Recortar** cada fotograma con el mismo `meta.nido`. Si el objeto cambia de forma o de tamaño, comprobar la deriva del nido fotograma a fotograma.
5. **Una sola secuencia** A+B en canvas (SEQ-001). El cambio de escena **no tiene tween de opacidad**: el plano B empieza donde acaba el A.
6. **Ocultar el cambio de fondo**, si lo hay, detrás del protagonista o de un cambio de texto. Es el mismo principio que el cambio de profundidad del héroe en p = 0,72 (REC-003).
7. **Verificar:**
   - `cortes_video.py` sobre la grabación del scroll → 0 cortes en la unión;
   - diferencia entre los fotogramas N y N+1 en la unión ≤ la mediana de la secuencia [umbral provisional].

## 7. Parámetros
- Duración del clip según la complejidad (Runway).
- Fotogramas por tramo de scroll (SEQ-001; memoria = ancho × alto × 4 por fotograma decodificado).
- Momento del contacto.
- Número de iteraciones (2–3 según Curious Refuge).

## 8. Problemas visuales
- Fotograma duplicado en la unión (meseta).
- Deriva de identidad del producto entre clips.
- Cortes inventados por el modelo.
- Pistas de movimiento de la imagen que contradicen la prompt.
- Artefactos de la imagen amplificados.
- Bucle que "salta" porque el primer y el último fotograma no coinciden.

## 9. Móvil
Menos fotogramas (cada uno se decodifica). Variante por ancho × DPR, como en AIIMG-001.

## 10. Reduced motion
Mostrar los fotogramas clave (inicio, contacto y final) sin secuencia.

## 11. Coste
- Generación: de pago (Curious Refuge cita unos 25 $ por 24 s con Seedance; dato del artículo, no verificado).
- Web: memoria de la secuencia (SEQ-001).

## 12. Pruebas
- `cortes_video.py` (0 cortes).
- Diferencia en la unión (§6.7).
- Inspección de identidad del producto en la hoja de AIIMG-001.
- C1 y C3 por una persona.

## 13. Evidencia
Guía oficial y artículo leídos (registro en `evidence/research/2026-11-04-lote29/registro_fuentes.json`). **Sin ejecución con clips reales.**

## 14. Cómo pedirlo
"Integra los clips A y B con AIVID-001: confirma que B parte del último fotograma de A, elimina el fotograma compartido, monta una sola secuencia sin fundido, oculta el cambio de fondo y demuestra 0 cortes y una unión sin meseta."

## Lote 30
- **Marriott (_cjEnGWN3Ug) confirma el principio:** la transformación imposible (lata → líquido) solo dura **~3 fotogramas** y se esconde en el tramo más rápido.
  - En vídeo generado: pedir el cambio **rápido** y en el punto de máxima velocidad; no un morph lento, que delata artefactos.
- **Fotograma *smear*:** si no hay clip, una variante de la imagen con **desenfoque de movimiento** en la dirección del gesto (I1-smear) para los 2–3 fotogramas previos al relevo. Evita el estroboscopio medido en la animática: ~54 px por fotograma a 1 280 px.
- Receta aplicada: `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE.md` (O1 e I1-smear).

## Lote 31
- **Corrección:** para un protagonista 2D movido por transformaciones, **ya no se pide la variante I1-smear**. El desenfoque se calcula a partir del movimiento (MBLUR-001), validado contra una referencia de 16 subfotogramas.
- I1-smear o un clip solo siguen teniendo sentido para **deformaciones** o giros que una foto no puede dar.
- **Clips de IA sin desenfoque:** el blur por flujo óptico (Pixel Motion Blur / Timewarp) se aplica en el editor antes de exportar la secuencia, con ≥ 12 muestras, vigilando que la imagen no se "derrita" (Meyer 2011).
