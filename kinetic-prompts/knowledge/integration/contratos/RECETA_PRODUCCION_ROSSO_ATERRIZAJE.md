# Receta de producción · ROSSO "la pasta aterriza en el plato" (lote 30)

> **SUSTITUIDA en lo técnico por la v2 (lote 31):** `RECETA_PRODUCCION_ROSSO_ATERRIZAJE_v2.md`. La auditoría del lote 31 midió en esta versión un salto visible de 53,6 px en el relevo y su exposición con scroll lento. Se conserva como historial.

**Referencia:** CASE-003, R4 ROSSO, 33,0–34,3 s: "la pasta baja y se posa en un plato que entra desde abajo"; el plato entra a +9 / +19 px/f [MED]. El análisis está en `evidence/visual/2026-10-27-lote20-enky/INFORME_AUDIOVISUAL_ENKY.md`.

**Identidad original:**
- Marca `[MARCA]`, paleta y textos del contrato REC-003.
- **No** se copian marca, textos ni recursos de Enky.
- No se sabe con qué herramienta lo hizo Enky. Esta receta es una **reconstrucción del lenguaje** a partir de técnicas verificadas: EDIT-001, MOT-002, AIVID-001 y AIIMG-001.

**Estado:**
- Animática medida con fixtures (C2 mecánico).
- **C1 y C3 pendientes** de los recursos reales y de la revisión humana.

## 1. Guion de la transición (2,5 s de tiempo, o el tramo 0,72–0,90 del scroll de REC-003)
| t (s) | Estado | Protagonista | Cámara | Secundarios |
|---|---|---|---|---|
| 0,00 | **Fotograma inicial:** tenedor con nido de pasta (I1), vertical, a la derecha y por detrás del titular "Tu mesa te espera." (cambio de profundidad oculto, REC-003) | En reposo | 100 % | Ingredientes orbitando (ya disparados en el acto 2) |
| 0,00–0,45 | **Anticipación** | Sube un 3 % del alto y gira −2° (sentido contrario a la caída), `power2.out` | Push-in que empieza a acelerar | — |
| 0,45–0,60 | **Espera viva** | Deriva un 0,6 % más; nunca quieto | 100,6 % | — |
| 0,60–1,10 | **Caída en arco** | x `power2.in`, y `power3.in` (arco); escala del nido con `expoScale(1, s, power2.in)` | Llega a 103 % (`power2.in`) | Ingredientes empiezan a caer escalonados desde 0,65 s |
| 0,55–1,10 | **Entrada del plato (I2)** | El plato sube desde abajo con `power3.out` y **llega parado** en 1,10 | — | Sombra de contacto ancha y tenue |
| **1,10** | **Relevo (1 fotograma)** | I1 desaparece de golpe: su nido está exactamente sobre el nido del plato (0 px) y va a **máxima velocidad** | Punto del corte | — |
| 1,10–1,22 | **Traspaso de peso** | El plato baja un 2,2 % del alto (≈ 38 % de la velocidad de llegada) | Push-out que empieza (`power2.out`, 1 s: desfasado) | La sombra se cierra: escala x 1,08 → 1 |
| 1,22–1,72 | **Asentamiento** | El plato vuelve con `power2.inOut` | Vuelve a 100 % en 2,1 s | Ingredientes aterrizan uno a uno con un pequeño rebote (0,12 s arriba y 0,22 s abajo) y paradas distintas |
| 2,10 | **Fotograma final:** plato servido centrado, titular legible delante, botón "Reservar" (REC-003 acto 3) | Quieto | 100 % | Quietos |

**Iluminación:**
- La misma biblia que el contrato: luz principal arriba a la izquierda a 45°, ~4 500 K y 30° de elevación de cámara en I1 e I2.
- **En el relevo**, el nido de I1 y el de I2 deben tener **la misma luz y la misma forma aparente**: es lo único que el ojo compara en ese fotograma.

**Partículas y máscaras:**
- Sin partículas nuevas; los ingredientes horneados del contrato hacen de secundarios.
- Sin máscara líquida: la pasta es fotográfica. El morph vectorial y el *gooey* de Sonduckfilm solo valen para formas planas (TRN-001).

## 2. Recursos que debe generar el usuario
| Id | Qué | Obligatorio | Especificación nueva del lote 30 |
|---|---|---|---|
| I1 | Tenedor con nido de pasta (2:3 sobre #7A7A7A) | Sí | Contrato REC-003 §3. **El nido debe ocupar el 55–65 % del ancho y estar a ~76 % de altura** (calibrado de `meta.nido`) |
| I2 | Plato servido (3:2 sobre #2E2E2E) | Sí | Contrato REC-003. **El nido del plato debe parecer el mismo nido que I1 visto desde la misma elevación** (generar I2 con I1 como referencia de estilo y de forma) |
| I3 | Ingredientes (≥ 4) | Sí | Contrato REC-003 |
| **I1-smear** | **Nuevo, opcional:** el mismo I1 con **desenfoque de movimiento vertical** (o generado con *motion blur*), para los 2–3 fotogramas antes del relevo | Recomendado | Mismo encuadre y nido que I1; desenfoque solo en la dirección de caída. Sustituye a I1 desde t = 0,95 s. Evita el estroboscopio (56 px/fotograma a 1 280 px medido) |
| **O1** | **Opcional, alternativa de máxima calidad:** clip image-to-video de 2–3 s **desde I1**: "the fork lowers and the pasta nest drops onto a plate rising from below; the camera slowly pushes in; continuous, seamless shot" | Opcional (de pago, sin autorizar) | AIVID-001: imagen en reposo como primer fotograma; último fotograma ≈ I2; extraer, recortar y montar como secuencia |

## 3. Procedimiento de edición (orden de trabajo)
1. **Animática** con los fixtures: `integration/plantillas/rec003_recursos/animatica_aterrizaje.html` (copia de `evidence/youtube/2026-11-04-lote30/fase4/rosso_aterrizaje.html`).
   - Aprobar el **tempo**: C2 lo revisa una persona en `rosso_animatica_lote30.mp4`.
2. **Generar I1, I2 e I3** (y opcionalmente I1-smear y O1) con la biblia del contrato.
3. **Preparar** con `preparar_recursos.py preparar …`. Calibrar `meta.nido` de I1 e I2 con la hoja de inspección hasta que en el relevo coincidan:
   - **≤ 2 px** de posición;
   - **≤ 3 %** de ancho;
   - la misma elevación aparente.
4. **Elemento guía:** la caída del héroe (`power3.in`). Todo lo que acompaña a la caída reutiliza ese ease; lo que recibe el impacto usa `power2.out` o `expo.out` (EDIT-001 §2.2 y §2.6).
5. **Sustituir los fixtures** por los recursos y repetir la animática: mismas medidas (§5).
6. **Integración web** (§4).
7. **Revisión humana** de C1 (hoja de estados frente a CASE-003) y de C3 (rúbrica de EVAL-001).

## 4. Estrategia de integración web
- **Base:** `index_flip.html` de REC-003 (pistas → timeline de GSAP 3.15.0, `Flip.fit` para el nido y `expoScale`).
- **El relevo no puede depender de la velocidad de scroll** (EDIT-001 §12). Decisión:
  - **Escritorio y móvil:** el tramo del aterrizaje se **dispara en tiempo** cuando el progreso cruza 0,80, y vuelve a la inversa al retroceder. ScrollTrigger: `onEnter` / `onLeaveBack` reproducen o invierten el timeline de §6 de EDIT-001. El resto del acto sigue con `scrub`.
  - **Alternativa** si se exige scrub puro: el relevo en p = 0,72 detrás del cambio de texto (oclusión, como en el lote 27) + O1 como secuencia.
- **Rendimiento:**
  - solo transforms y opacidad;
  - I1-smear decodificado antes (`img.decode()`);
  - sin `filter` ni `mix-blend-mode` en capas animadas.
- **Reduced motion:** corte directo del estado inicial al final.

## 5. Criterios de aceptación (con recursos reales)
| Criterio | Medida | Umbral |
|---|---|---|
| Sin doble imagen | `medir30.py` sobre la serie | 0 fotogramas con 0,05 < opacidad < 0,95 |
| Relevo a máxima velocidad | fotograma del relevo frente al pico | ±1 fotograma |
| Nidos alineados en el relevo | `medir30.py` / `__medirNidos` | ≤ 2 px |
| Sin meseta en el traspaso | velocidad del plato tras el relevo con el mismo signo que la del héroe | sí, con un 25–50 % |
| Sin cortes | `cortes_video.py` | 0 |
| Retroceso | timeline invertido al volver hacia atrás | sin saltos |
| C1 | hoja de estados frente a CASE-003 | revisión humana |
| C3 | EVAL-001 | **lo puntúa el usuario** |

## 6. Medidas de la animática (fixtures, 1 280 × 720)
Fuente: `evidence/youtube/2026-11-04-lote30/fase4/medidas.json`.
- **A · base:** 11 fotogramas de doble imagen; el héroe llega casi parado (22 px/s) al relevo.
- **B · receta:** 0 fotogramas de doble imagen; relevo en f33 con el pico en f32; héroe a 770 px/s hacia abajo y plato a +296 px/s en la misma dirección; desajuste de 0,0 px; 0 cortes.
- **Limitación visible:** a máxima velocidad el héroe recorre ~54 px por fotograma → hace falta I1-smear u O1.
