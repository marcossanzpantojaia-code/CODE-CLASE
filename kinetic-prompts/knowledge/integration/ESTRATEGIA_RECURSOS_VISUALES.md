# Estrategia comparada de recursos visuales para "El ritual" (lote 21, 2026-10-27)

> Decide **de dónde salen** el objeto protagonista y sus transformaciones (navaja → espuma, Acto I → II) antes de programar. **Nada se ha descargado, instalado ni generado.**
>
> Licencias citadas en ASSET-001; técnicas de entrega en SEQ-001/SEQ-002; casos reales en CASE-004. No es asesoramiento legal.
>
> **Una animación fluida no equivale a una composición visual de calidad:** la tabla puntúa por separado la calidad de imagen y la continuidad.

## 0. Restricciones medidas del entorno
| Recurso | Estado [MED] |
|---|---|
| GPU en el contenedor | no hay (`nvidia-smi` no existe) |
| CPU / RAM | 2 núcleos / 7 GB |
| Acceso a download.blender.org y huggingface.co desde el contenedor | **bloqueado** (HTTP 000 a través del proxy) |
| ffmpeg | disponible con libwebp (alfa verificado), libvpx-vp9, libaom-av1 y libx265 |
| Blender estable | 5.2.3 LTS (22-10-2026), `.tar.xz` para Linux de 367 MB (blender.org/download) |
| Equipo del usuario | VM de Linux accesible por el puente; GPU desconocida |

## 1. Comparación
Escala 1–5: 5 es lo mejor; en esfuerzo, 5 es lo más fácil. Las puntuaciones son **estimaciones razonadas [EST]**, no medidas.

| Criterio | **A · Fotografía o vídeo propios o libres** | **B · Render offline en Blender** | **C · Sintéticos o composición** (IA, profundidad, montaje) |
|---|---|---|---|
| Calidad fotorrealista posible | **5** si se rueda bien (luz real); 3–4 con *stock* (no está hecho para la historia) | **4** con modelado, materiales PBR y HDRI CC0 de Poly Haven; depende de la habilidad de modelado y del tiempo de render | 4–5 en una imagen fija con modelos grandes; **inestable** en secuencias (texto y forma inconsistentes, como en CASE-003) |
| **Continuidad entre escenas** (navaja → espuma) | **2**: una foto no se transforma; vídeo real de espuma posible, pero la transformación entre objetos exige montaje (fundidos y máscaras) | **5**: una sola escena 3D con cámara y luz constantes; la transformación se anima (simulación de fluidos o desplazamiento de malla, partículas) | 2–3: los modelos de vídeo generan transiciones, pero sin control fotograma a fotograma ni repetibilidad; la composición 2,5D no transforma objetos |
| Máscaras y transparencias | 2–3: recorte con un modelo MIT (BiRefNet); bordes de espuma y vapor difíciles; con fondo negro, `screen` funciona para el vapor | **5**: alfa nativo (`Film > Transparent`, `Transparent Glass`), pases separados, sin recorte | 2–3: requiere recorte posterior; los modelos NC (RMBG-2.0) están excluidos |
| Rendimiento y peso final | igual que B si se entrega como secuencia o vídeo (SEQ-002) | igual: ~15 KB por fotograma en móvil (referencia OPTIKKA) y más en escritorio con alfa; **se controla en el render** (resolución, encuadre ajustado) | igual |
| Esfuerzo de producción | 3 (rodaje casero: fondo liso, luz lateral, trípode) / 5 si es *stock* | **2**: modelar navaja, brocha, cuenco y toalla, materiales, simulación de espuma y vapor, y render en CPU (lento: hay que medirlo) | 3–4 si hay GPU o un servicio; **1 aquí** (sin GPU ni acceso) |
| Licencias y restricciones | Unsplash/Pexels/Pixabay: comercial sin atribución, con límites (personas, marcas, reventa); un rodaje propio no tiene restricciones | **libres**: el render es propiedad del autor; HDRI y texturas CC0 (Poly Haven) | FLUX.1-schnell y Wan2.1 son Apache-2.0, pero hay que aceptar condiciones; los servicios de pago tienen **sus** términos; **riesgo de engañar** si se presentan como fotos reales |
| ¿Resultado comparable a la referencia? | **parcial**: una imagen excelente sin transformación continua | **sí, es la opción más probable**, si el modelado y la luz alcanzan el nivel de ART-001 | dudoso y no repetible; además, la referencia parece usar precisamente esto y **no demuestra una web** |
| Coste adicional | 0 € (rodaje propio o *stock*) | 0 € (software libre); tiempo de CPU | 0 € solo con GPU propia; si no, de pago (**no autorizado**) |
| Autorización necesaria | ninguna para buscar; descargar recursos requiere tu permiso | **instalar Blender** (y abrir su descarga en la red o usar el equipo del usuario) | uso de modelos o servicios externos |

## 2. Recomendación (decisión del usuario)
**Opción B como base y A como complemento.**
- **B (Blender)** para el protagonista y su transformación Acto I → II: navaja → hilos → hélice de espuma, con alfa nativo, luz constante y entrega en WebP (SEQ-002). Es la única opción que cumple a la vez **continuidad**, **alfa** y **control** con 0 €.
- **A** para texturas de fondo y del vapor real (vídeo propio sobre negro + `screen`), y para la fotografía del cierre comercial (local, equipo), si el usuario la aporta.
- **C** solo como **boceto de dirección de arte** (no en producción) y solo si se autoriza: aquí no es viable sin GPU ni acceso a la red.

## 3. Riesgos de la opción B
| Riesgo | Mitigación |
|---|---|
| El render en CPU con 2 núcleos puede ser **muy lento** (vidrio, metal, espuma) | **Prueba de tiempo previa:** 1 fotograma a 50 % de resolución con 64 muestras + eliminador de ruido; extrapolar. Si supera ~3 min por fotograma, reducir a 60–80 fotogramas o renderizar en el equipo del usuario |
| Calidad del modelado (navaja creíble) | Navaja de afeitar sencilla (hoja + mango) con biselado y material PBR (metal anisótropo); HDRI de estudio CC0 |
| Espuma o fluido realistas | Primera versión con **desplazamiento de malla y partículas** (más controlable que Mantaflow); la simulación de fluidos solo si la prueba de tiempo lo permite |
| Descarga bloqueada en el contenedor | Opciones: (1) permitir download.blender.org en la configuración de red de la organización; (2) instalar Blender en la VM del equipo del usuario con su autorización; (3) que el usuario haga el render |
| Coherencia de luz entre actos | Una sola escena y una sola cámara para la secuencia I → II |

## 4. Decisiones pendientes
1. **R1** — ¿Se autoriza Blender 5.2.3 LTS (versión fijada) en una carpeta temporal? ¿Dónde: contenedor (requiere abrir la red) o equipo del usuario?
2. **R2** — ¿Hay fotografía o vídeo propio (vapor, local)? Si no, ¿se autoriza descargar *stock* de Pexels/Unsplash con registro de licencias?
3. **R3** — ¿Se descarta del todo la IA generativa (C), o se permite solo para bocetos internos?
