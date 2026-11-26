# Receta de producción v2 · ROSSO "la pasta se posa en el plato" (lote 31)

Sustituye en lo técnico a `RECETA_PRODUCCION_ROSSO_ATERRIZAJE.md` (lote 30), que **se conserva** como historial.

**Qué cambia y por qué** (medido en `evidence/demos/2026-11-04-lote31/INFORME_LOTE31.md`):
- el relevo de 1 fotograma a máxima velocidad dejaba un salto visible de 53,6 px (20,7 veces la mediana de diferencia de píxeles) y, con scroll lento, la desaparición de golpe de toda la imagen;
- el **aterrizaje suave con relevo alineado** reduce el salto a 0,7 px y lo mantiene invisible a cualquier velocidad de scroll.

**Identidad original:** marca `[MARCA]` y paleta del contrato REC-003. No se atribuye a Enky ninguna herramienta.

**Estado:** mecánica validada con fixtures (C2 mecánico). **C1 y C3 pendientes** de los recursos reales y de la revisión del usuario.

## 1. Guion (2,5 s de tiempo de la transición; con scroll, del tramo 0,30 → 0,70 del acto)
| t (s) | Protagonista: **nido de pasta** (I1-nido) | Plato (I2) | Cámara | Secundarios |
|---|---|---|---|---|
| 0–0,38 | Anticipación: sube un 1,6 % del alto, se desplaza un 0,4 % a la derecha y gira −1,5°; termina casi parado | fuera de cuadro | push-in del 2 % que empieza | ingredientes orbitando |
| 0,38–0,86 | Caída en **arco**: x por delante de y (Hermite C1); velocidad máxima ~485 px/s a 1 280 px (16 px por fotograma); **motion blur** de hasta ~12 px | entra desde abajo (desde 0,45 s) | — | los ingredientes empiezan a caer escalonados |
| 0,86–1,25 | **Se posa:** frena hasta 37 px/s; la escala Y baja a 0,52 (falso 3D: el nido "se inclina" hacia la elevación del plato); su sombra crece sobre el plato; **la capa delantera del plato lo tapa por abajo** | rebasa un 0,3 % hacia arriba y baja a +60 px/s, la misma velocidad que el nido | 102 % en el contacto | — |
| **1,25–1,57** | **Relevo alineado:** el nido va **bloqueado** al nido del plato (separación 0 px) y se funde en 0,32 s | hunde un 1,2 % y vuelve (peso) | salida en 1,1 s (desfasada) | aterrizan con rebotes y paradas distintas |
| 2,05–2,5 | — | quieto | 100 % | quietos |

## 2. Contrato de recursos (lo mínimo necesario)
Biblia visual común (contrato REC-003 §2):
- 100 mm, **30° de elevación**;
- luz principal arriba a la izquierda a 45°, ~4 500 K, f/11;
- fondo liso y contrastado para recortar.

| Id | Qué | Obligatorio | Encuadre y tamaño | Requisitos críticos de este lote |
|---|---|---|---|---|
| **I1-nido** | **Solo el nido de pasta enrollada** (con gambas si forman parte del plato), **sin tenedor**, flotando, visto desde **la misma elevación de 30°** que el plato | **Sí** (sustituye a I1 en este tramo) | 1:1, nido ≥ 60 % del ancho, ≥ 1 600 px de lado, fondo #7A7A7A liso | Mismo tipo de pasta, salsa, brillo, color y **forma de contorno** que el nido de I2 (generar con I2 como referencia de imagen o de estilo). Sin desenfoque de movimiento ni poses "a medio gesto". Borde recortable (halo < 25 tras descontaminar) |
| **I2** | Plato servido con el nido | **Sí** | 3:2, plato ≥ 70 % del ancho, ≥ 2 400 px, fondo #2E2E2E | El nido del plato a ~47 % de la altura; **capa delantera recortable** (borde del plato por delante del nido: la genera `preparar_recursos.py`) y sombra horneada |
| I3 | Ingredientes (≥ 4) | Sí | contrato REC-003 | — |
| I1 | Tenedor con el nido | Solo para el acto anterior (giro y hélice), no para este tramo | contrato REC-003 | — |
| ~~I1-smear~~ | ~~Variante con desenfoque~~ | **Ya no hace falta** | — | El motion blur se calcula en tiempo real a partir del movimiento (MBLUR-001) |
| O1 | Clip image-to-video del nido que **cae y se asienta** en el plato (2–3 s) | Opcional, de pago (sin autorizar) | — | Solo si se quiere una deformación real de la pasta al posarse. Dos fotos fijas **no** permiten reconstruir una deformación física: solo traslación, escala, giro plano y falso 3D en un eje |

**Comprobación de consistencia antes de integrar** (`preparar_recursos.py inspeccionar` + la hoja):
- proporción aparente del contorno del nido: I1-nido escalado en Y frente a I2, con una diferencia ≤ 10 %;
- ΔE de color del nido ≤ 6 (LAB);
- misma dirección de luz (vector de luz ±15°).

Si no se cumple, **regenerar**: no se maquilla con el fundido.

## 3. Procedimiento de edición
1. Animática con los fixtures: `integration/plantillas/rosso_aterrizaje_l31/rosso31.html` (ya aprobada a nivel mecánico).
2. Generar I1-nido e I2 (+ I3).
3. Preparar con `preparar_recursos.py`. Calibrar:
   - `meta.nido` de I2 (centro y ancho del anillo);
   - en `escena31.js`: la máscara elíptica deja de ser necesaria, el `AY` pasa a ser el centro del nido de I1-nido y la escala Y final (`HSY`) es la proporción del anillo de I2 / la de I1-nido.
4. Repetir **la misma batería**:
   - `capturar31.mjs` + `auditar31.py`: salto en el relevo ≤ 2 px; separación en el fundido ≤ 1 px; 0 fotogramas de doble imagen; ratio de diferencia en el relevo ≤ 3×;
   - `ref_blur.mjs` + `err_blur.py`: error de borde con blur < sin blur;
   - `test_scroll31.mjs` en 1 280 y 375: lento con Δopacidad ≤ 0,1 por fotograma; zigzag con 0 relevos repetidos; desmontaje limpio; 0 errores.
5. **C1:** hoja de estados frente a CASE-003 (revisión humana). **C3:** EVAL-001 (puntúa el usuario).

## 4. Integración web
- **Estrategia C (elegida):** scrub reversible; el relevo se esconde por composición (nidos bloqueados + capa delantera del plato + sombra), así que no depende de la velocidad del scroll.
- Protagonista en `<canvas>` (motion blur MBLUR-001); plato, textos e ingredientes en el DOM.
- Geometría relativa al escenario y reconstruida en `onRefresh`; `matchMedia` con reduced motion (corte entre estados) y `revert` al desmontar.
- **Pendiente:** el plato entra sin desenfoque (36 px por fotograma). Opciones: dibujarlo también en el lienzo con MBLUR-001, o hacer más lenta su entrada.
