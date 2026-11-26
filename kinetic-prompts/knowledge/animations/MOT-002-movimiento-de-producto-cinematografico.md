---
id: MOT-002
titulo: Movimiento de producto con calidad cinematográfica — trayectorias en arco, aceleración y desaceleración, continuidad de velocidad entre tramos, anticipación y movimiento secundario, rotación y cambio de perspectiva, desenfoque de movimiento, y cámara frente a objeto; qué mejora de verdad y qué complica sin beneficio
categoria: animations
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (gsap.com: blendEases, smoothOriginChange; ScrollTrigger scrub) + VIDEO_INSPECCIONADO (CASE-003: la jarra que se inclina y vierte, la gota que "respira", la pasta que baja al plato) + pruebas propias (SEQ-003: fantasmas de interpolación; microdemos A/C del lote 24) + principios clásicos de animación [conocimiento general, señalado como tal]
versiones: GSAP 3.15
perfil: cinematografico
ultima_revision: 2026-11-03
---

# MOT-002 · Movimiento de producto cinematográfico

**Estado:** INVESTIGADO. Las reglas son verificables con `curvas_scroll.mjs` y `medir_escena_scroll.mjs`; **no** se han validado con un producto real.

1. **Efecto.** El producto se mueve "con peso" y con intención, como en un anuncio, en lugar de desplazarse en línea recta a velocidad constante.
2. **Cómo funciona — reglas.**
   | Técnica | Qué aporta | Cómo se aplica con scroll | Cuándo **no** compensa |
   |---|---|---|---|
   | **Trayectoria en arco** | naturalidad (los objetos lanzados o vertidos describen curvas) [principio clásico] | x e y con *easing* distintos (x `power1.inOut`, y `power2.out`), o MotionPath (GS-003) | movimientos ≤ 5 % de la pantalla |
   | **Aceleración y desaceleración** | peso y masa | `inOut` en los cambios de estado; `none` en lo que sigue al dedo (posición de la secuencia) | con `scrub` alto ya hay inercia: no apilar *easing* fuerte + scrub de 2 s (todo parece lento) |
   | **Continuidad de velocidad entre tramos** | sin "tirones" al encadenar | que la velocidad de salida de un tramo coincida con la de entrada del siguiente: un tween que **termina** en `power2.out` (velocidad 0) no puede ir seguido de uno que empieza rápido. Opciones: un solo tween con `blendEases("power2.in", "power2.out")`, o tramos solapados | tramos separados por una meseta (la velocidad 0 es la intención) |
   | **Anticipación** | lectura del cambio | un retroceso breve antes del gesto (la jarra se inclina 3° hacia atrás antes de verter), un 3–5 % del tramo | en productos que deben parecer estables (joyas, relojes) |
   | **Movimiento secundario (*follow-through*)** | vida | elementos ligados al protagonista que se retrasan (el chorro llega después del giro; los ingredientes, con retardo por profundidad; MOT-001) | si compite con el protagonista |
   | **Rotación y cambio de perspectiva** | volumen | **solo con una secuencia o 3D** (SEQ-002, CAM-003); en 2D, `rotate` plano + sombra que cambia | con una foto: `rotateY` de CSS deforma la imagen y delata el truco |
   | **Origen del giro** | credibilidad física | `transform-origin` en el punto de apoyo real (asa o pivote); cambiarlo **sin salto** con `smoothOriginChange` | — |
   | **Desenfoque de movimiento** | velocidad percibida en gestos rápidos | **renderizado** en la secuencia (motion blur de Blender), coherente con la dirección; en web solo un `blur` direccional por velocidad (VEL-001: skew por velocidad) | con scroll lento (no hay velocidad) o con texto |
   | **Cámara frente a objeto** | escala y profundidad | mover la **cámara** (dolly o truck de todas las capas con paralaje; CAM-003) cuando cambia el encuadre; mover el **objeto** cuando la historia lo exige (verter, abrir) | mover las dos cosas a la vez sin necesidad (mareo, pérdida de referencia) |
3. **Cuándo usarlo.** Siempre que el protagonista se desplace o gire en un tramo > 10 % de la pantalla.
4. **Recursos.** Para rotaciones y cambios de perspectiva creíbles: una secuencia o un modelo 3D. Para un movimiento plano: un recurso con alfa y sombra en su propia capa.
5. **Tecnologías.** GSAP (eases, `blendEases`, MotionPath, `smoothOriginChange`), canvas o vídeo para las secuencias.
6. **Estructura.**
   ```js
   // gesto de verter con anticipación + continuidad (DOCUMENTADO; sin ejecutar)
   tl.addLabel("verter")
     .to("#jarra", { rotation: 3, duration: .03, ease: "power1.out" }, "verter")                 // anticipación
     .to("#jarra", { rotation: -38, duration: .13, ease: blendEases("power2.in", "power1.out") }) // acelera y llega sin frenazo
     .add(chorro(), "verter+=0.06");                                                             // secundario con retraso
   ```
7. **Parámetros.** Amplitud de la anticipación (2–4°, 3–5 % del tramo); retraso del secundario (2–8 %); *easing* por tramo; ángulo y origen.
8. **Problemas visuales.**
   - Movimiento lineal (robot).
   - Frenazo y arranque entre tramos encadenados.
   - Rotación 3D falsa sobre una foto.
   - Desenfoque uniforme con CSS.
   - El objeto y la cámara se mueven a la vez sin motivo.
   - Escalonado de una secuencia que parece movimiento "a tirones" (SEQ-003).
9. **Móvil.** Amplitudes menores; ningún movimiento que saque al protagonista del encuadre.
10. **Reduced motion.** Sin anticipación, rebotes ni secundarios; estados clave estáticos.
11. **Coste.** El *easing* y los helpers no cuestan; la secuencia o el 3D, según sus fichas.
12. **Pruebas.**
    - **Continuidad de velocidad:** derivada numérica de la posición del protagonista con `curvas_scroll.mjs` (salto de velocidad entre pasos consecutivos en las uniones de tramos ≤ 2× la mediana) [umbral provisional].
    - Vídeo revisado por una persona (C2).
13. **Evidencia.** Documentación de los helpers; observación de la referencia. Ninguna medición con un producto real.
14. **Cómo pedirlo.** "Anima el producto con MOT-002: declara la trayectoria, el *easing* por tramo, la anticipación y el secundario, demuestra con las curvas que no hay saltos de velocidad en las uniones y justifica si mueves la cámara o el objeto".

**Lote 26:** la anticipación de 3° antes del vertido se implementó en REC-001 como una pista `rotation` ([[0,0],[.45,0],[.48,3],[.58,-38]…]) y se ejecutó con GSAP 3.15.0 (reversible, sin cortes en el vídeo). La continuidad de velocidad entre tramos y `blendEases` **siguen sin medirse**.

## Lote 28 · ExpoScaleEase: escalas y zooms percibidos como continuos (vídeo de GreenSock rwdlO3uIlwk) — PROBADO
- Una escala lineal **parece decelerar**: el cambio relativo disminuye (de ×1 a ×2 es +100 %; de ×9 a ×10, +11 %).
  - `ease: "expoScale(inicio, fin, power2.inOut)"` (EasePack, incluido en gsap 3.15.0; registrarlo con `gsap.registerPlugin(ExpoScaleEase)`) curva el ease para que el **tamaño percibido** siga la curva indicada.
  - **Exige** los valores inicial y final reales.
- **Medido** en el aterrizaje del héroe de REC-003 (escala 1 → s): el log del área sigue `power2.inOut` con un RMS de **0,0009 (1 440) / 0,0004 (375)**, frente a **0,024 / 0,013** sin expoScale.
- **Limitación medida:** el ease se configura al construir el timeline; tras un resize **sin** cruzar un punto de corte, `s` cambia y el ritmo se desajusta (RMS 0,0123).
  - Corrección: reconstruir el timeline tras el resize (`callAfterResize` → `mm.revert()` + montar; GS-005).
- **Uso cinematográfico:** dolly y zoom de cámara (CAM-003), aterrizajes de producto y **zoom "infinito"** entre escenas encadenando imágenes recortadas al 50 % (técnica del vídeo; pendiente de probar con recursos reales). Fuente: `integration/YOUTUBE_ESTUDIOS.md` y `evidence/youtube/2026-11-03-lote28/`.

## Lote 30 · Anticipación y continuidad, medidas (Ben Marriott, LcWJKYbYvi8 y rWUZWMDsglc)
- La anticipación puede durar **hasta 3 veces** el gesto principal. En la espera, asas inclinadas para que nunca esté quieto. Se puede anticipar en otra propiedad (rotación contraria antes de trasladar).
- **Medido en la animática ROSSO** (EDIT-001 §12):
  - −134 px/s hacia arriba antes de la caída;
  - el traspaso de peso en el contacto mantiene la dirección (770 → +296 px/s): **la continuidad de velocidad entre tramos ya está medida** en este caso, con 0 fotogramas de meseta en el relevo.
- La parte de **edición del cambio de escena** (relevo, match cut, desfases) está en EDIT-001; aquí no se repite.

## Lote 31
La continuidad de velocidad en un contacto exige que el receptor acompañe al objeto (misma dirección y velocidad en el instante del encuentro). Con tweens encadenados aparecieron quiebros y frenazos medidos (EDIT-001, lote 31). Para trayectorias con velocidad controlada en las uniones: Hermite C1 (`evidence/demos/2026-11-04-lote31/escena31.js`).
