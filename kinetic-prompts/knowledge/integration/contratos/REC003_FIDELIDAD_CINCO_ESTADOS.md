# REC-003 · Fidelidad con la referencia en cinco estados (lote 27)

**Referencia audiovisual:**
- **Qué es:** el reel R4 de CASE-003, grabación del usuario, tramo 27,80–36,60 s. Fotogramas en `evidence/visual/2026-10-27-lote20-enky/detalle/r4a–r4c.jpg`.
- **Cómo se ha analizado:** **solo observación** a ~300 px de ancho. Las medidas son estimaciones [EST] sobre esos fotogramas.
- **Lo que no se afirma:** no se atribuye ninguna tecnología al creador ([INFORME §5](../../evidence/visual/2026-10-27-lote20-enky/INFORME_AUDIOVISUAL_ENKY.md)). El reel lleva la etiqueta "Contenido generado con IA" y no se sabe si es una web real.

**Objetivo:**
- Igualar la **calidad audiovisual**, no el contenido.
- Identidad propia: `[MARCA]`, textos propios, paleta hueso y terracota, y tagliatelle en lugar del plato de la referencia.
- Contrato de recursos: `CONTRATO_RECURSOS_REC003.md`. Implementación: `integration/plantillas/rec003_recursos/`.

Los porcentajes son el progreso p del tramo fijado. Los tiempos de la referencia son aproximados.

---

## Estado 0 % (ref. ≈ 27,8–28,6 s)
| Aspecto | Referencia (observado) | Objetivo propio (implementado con fixture) |
|---|---|---|
| Posición del protagonista | Tenedor con pasta enrollada a la derecha, en vertical, del borde superior al tercio inferior; sobresale del panel | Héroe I1 centrado en x = 68 % (móvil: 60 %), 84vh de alto (móvil: 48vh) |
| Tamaño relativo | ≈ 30–35 % del ancho y ≈ 90 % del alto [EST] | ≈ 25 % del ancho y 84 % del alto (escritorio). Regla de AUD-001: el protagonista vertical se mide por **alto** |
| Escala del titular | Serif en mayúsculas, 3 líneas a la izquierda, ≈ 10 % del alto por línea [EST] | Serif, 2 líneas, `clamp(48px, 9,5vw, 150px)` (≈ 15 % del alto por línea a 1 440 px) |
| Orden de profundidad | crema → panel rojo → texto → objeto (el objeto pasa sobre el texto) | hueso → panel terracota → palabra fantasma → titular → **héroe por delante** (oclusión real del titular ≤ 3,1 %) |
| Ocultación y revelado | Todo visible; el subtítulo y el botón aparecen pequeños | Todo visible |
| Secundarios | Gotas de salsa en el héroe; sin satélites | Ninguno (los ingredientes esperan en escala 0,3 y opacidad 0) |
| Color y luz | Crema y granate; luz cálida de estudio; brillo en la salsa | Hueso y terracota; biblia visual con la clave arriba-izquierda |
| Relación con el siguiente | El panel empezará a salir por arriba con el objeto quieto | Ídem: el panel sale con `clip-path` (0,18–0,34) |

## Estado 25 % (ref. ≈ 29,0–30,0 s)
| Aspecto | Referencia | Objetivo propio |
|---|---|---|
| Posición del protagonista | **Quieto** mientras el panel rojo sale por arriba y el texto sube | Quieto; dolly de escala 1 → 1,04 en todo el acto 1–2 (casi imperceptible) |
| Tamaño relativo | Igual | Igual |
| Escala del titular | El titular 1 sube y sale | Titular 1 legible hasta 0,33 y salida enmascarada en 0,33–0,38 |
| Orden de profundidad | Igual; el panel desaparece | Igual |
| Ocultación y revelado | El panel se recorta hacia arriba | `clip-path: inset(0 0 x% 0)` |
| Secundarios | — | — |
| Color y luz | Pasa a fondo crema dominante | Pasa a hueso dominante |
| Relación | Puente al acto 2 sin mover el objeto | Ídem (REC-003: producto fijo, entorno cambiante) |

## Estado 50 % (ref. ≈ 31,0–32,5 s)
| Aspecto | Referencia | Objetivo propio |
|---|---|---|
| Posición del protagonista | La pasta se estira en una **hélice vertical** que ocupa toda la altura (un cambio de forma del objeto) | **El héroe no cambia de forma**: un cambio de forma creíble exige una secuencia (O1) y no se inventa un morph (TRN-001). Sin O1, el héroe sigue fijo |
| Tamaño relativo | La hélice crece en altura (≈ 100 %) | Sin cambio |
| Escala del titular | Titular 2 en 2–3 líneas, a la izquierda | Titular 2, entrada enmascarada en 0,38–0,43 |
| Orden de profundidad | Ingredientes delante y detrás de la hélice | 3 planos: plano 0 detrás del titular y del héroe, planos 1 y 2 delante. Sombras y desenfoque **horneados** |
| Ocultación y revelado | Los ingredientes **salen disparados** y orbitan; etiquetas pequeñas | Órbitas alrededor del **nido** del héroe (0,40–0,50 aparición; 0,68–0,78 recogida); el ingrediente se atenúa al solaparse con el titular (oclusión ≤ 5 %) |
| Secundarios | Tomates, mejillones, gambas, albahaca | Tomate, albahaca, parmesano, guindilla (+ tomate partido y ajo opcionales) |
| Color y luz | Ingredientes saturados con la misma luz | Misma biblia visual; luz verificada con `preparar_recursos.py` (lado arriba-izquierda) |
| Relación | El clímax del acto 2 prepara la caída al plato | Ídem |

## Estado 75 % (ref. ≈ 33,0–34,3 s)
| Aspecto | Referencia | Objetivo propio |
|---|---|---|
| Posición del protagonista | La pasta **baja** y se posa en un plato que entra desde abajo | El plato (I2) entra desde abajo (0,70–0,86); el héroe viaja hasta que su nido coincide con el del plato (0,72–0,86) |
| Tamaño relativo | La pasta se reduce al tamaño de la ración | La escala del héroe va de 1,04 al tamaño del nido del plato (valores en función, recalculados en refresh) |
| Escala del titular | Titular 3 "…TABLE…" arriba | Titular 3, entrada enmascarada en 0,72–0,77 |
| Orden de profundidad | Pasta sobre plato; texto detrás | **En 0,72 el héroe pasa por detrás del titular** (cambio de profundidad oculto por el cambio de texto). El plato queda enhebrado: capa trasera → titular → ala delantera |
| Ocultación y revelado | Corte con movimiento rápido (+9 a +19 px/f) | **Relevo sin valle:** el plato está opaco debajo cuando el héroe se desvanece encima (0,84–0,90) |
| Secundarios | Desaparecen | Recogida hacia el nido (0,68–0,78) |
| Color y luz | Plato blanco con sombra suave | Sombra de contacto **horneada** (sin `mix-blend-mode`) |
| Relación | Aterrizaje → plato servido | Ídem; con O1 (secuencia) el aterrizaje sería continuo de verdad |

## Estado 100 % (ref. ≈ 35,0–35,3 s)
| Aspecto | Referencia | Objetivo propio |
|---|---|---|
| Posición del protagonista | Plato servido a la derecha, en reposo | Plato en reposo con un dolly final de 1,05 → 1,06 |
| Tamaño relativo | ≈ 45 % del ancho [EST] | 58vw (máx. 880 px) en escritorio; 96vw en móvil |
| Escala del titular | Titular arriba a la izquierda + botón píldora | Titular 3. **Pendiente:** botón píldora (P7) con `autoAlpha` al final |
| Orden de profundidad | Texto, plato | Capa trasera → titular → ala delantera (oclusión de la línea 2 ≤ 15 %) |
| Ocultación y revelado | Aparece el botón | — |
| Secundarios | — | — |
| Color y luz | Crema, brillo de la salsa | Hueso; reflejo del fondo en el ala (depende de I2) |
| Relación | Fin del acto; el reel vuelve a empezar (montaje) | Fin del tramo fijado |

## Diferencias conscientes y lo que falta para igualar la calidad
1. **Cambio de forma del objeto (hélice):**
   - La referencia lo muestra; aquí **solo es posible con una secuencia (O1)**. Sin ella, el acto 2 conserva el héroe fijo (P8 sin P2).
   - Es la mayor diferencia de movimiento.
2. **Calidad fotográfica:** depende por completo de I1–I3. Los fixtures **no** son evaluables en C1/C3.
3. **Etiquetas de ingredientes y botón:** pendientes; el texto debe ser propio.
4. **Ritmo:**
   - La referencia avanza a −4 a −6 px/f con el scroll "casi constante" del reel. Aquí el ritmo depende del usuario, y el diseño garantiza mesetas legibles.
   - Pasos sin línea legible: 4 de 21, en los cambios de texto enmascarados.
