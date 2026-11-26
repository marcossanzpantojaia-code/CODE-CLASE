---
id: EDIT-001
titulo: Edición de transiciones de calidad motion design llevada a la web — animática primero, elemento guía y timing compartido, anticipación, relevo de objetos en el momento de máxima velocidad, match cut por escala o posición, secundarios escalonados, efectos desfasados de la cámara, traspaso de velocidad en el contacto; qué es de After Effects y qué existe en GSAP, qué se prerenderiza y qué va en tiempo real, y el problema del scroll
categoria: animations
estado: IMPLEMENTADO
evidencia: TRANSCRIPCION_ANALIZADA + VIDEO_INSPECCIONADO (Ben Marriott rWUZWMDsglc, UVDpgP7sRbw, _cjEnGWN3Ug; transcripción de ythBGTLjot8 y LcWJKYbYvi8; Yuri Artiukh 12yVUxIkag0 con código en fotogramas) + DEMO_INSPECCIONADA propia (animática ROSSO, evidence/youtube/2026-11-04-lote30/fase4/)
versiones: GSAP 3.15.0 (gsap, EasePack); After Effects solo como referencia de los tutoriales (no instalado)
perfil: cinematografico
ultima_revision: 2026-11-04
---

# EDIT-001 · Edición de transiciones: de motion design a la web

**Estado:**
- **IMPLEMENTADO** como animática medida con *fixtures* rotulados. Se midieron el relevo, la velocidad y la ausencia de doble imagen.
- **C1 y C3 no evaluables:** no hay recursos reales.
- No sustituye a MOT-002 (reglas de movimiento de producto): añade **cómo se edita el cambio de escena**.

## 1. Efecto
Dos escenas que se leen como **un solo plano**. El ojo sigue un movimiento continuo y el cambio de objeto o de fondo ocurre donde nadie puede verlo.

## 2. Cómo funciona — procedimientos aprendidos (con su fuente)
| # | Procedimiento | Fuente | Cómo se hace en la web |
|---|---|---|---|
| 1 | **Animática en bruto antes de pulir.** Primero los estados extremos (inicio, forma intermedia y final); después los intermedios. En los tramos rápidos bastan **~3 fotogramas**. Marriott dibujó la lata → chorro a 12,5 fps (31 fotogramas) con papel cebolla y luego limpió en AE cada 2 fotogramas | Marriott _cjEnGWN3Ug 0:28–2:16; fotograma 2:07 | Timeline de GSAP con *fixtures* rotulados y capturas por progreso (`capturar30.mjs`) **antes** de pedir o integrar recursos |
| 2 | **Un elemento guía marca el tempo.** Se anima primero el elemento más simple que más informa; los demás **copian su easing** (plugin gratuito *Ease Copy*) | Marriott UVDpgP7sRbw 3:00–5:10 | Un único `ease` con nombre por tramo, reutilizado en todas las pistas del tramo (pistas de GS-005) o `CustomEase.create("guia", …)` |
| 3 | **Anticipación:** pequeño movimiento en sentido contrario; puede durar **hasta 3 veces** el gesto principal si se quiere más energía. En la espera, asas inclinadas para que nunca esté quieto del todo. Se puede anticipar en **otra propiedad** (rotación contraria antes de trasladar) | Marriott LcWJKYbYvi8 2:00–12:00; rWUZWMDsglc 2:54–3:33 (rotación −14 → 200 → 250) | Tween previo con `power2.out` + tramo con deriva lineal; o `back.in` de GSAP para una anticipación corta en un solo tween (no equivale a una curva dibujada a mano) |
| 4 | **Relevo en el momento de máxima velocidad.** El cambio de forma u objeto (círculos → yin-yang; asa de la taza que desaparece) se coloca donde la animación va más rápida: "eliminar elementos durante el movimiento más rápido, cuando el ojo mira a otra parte". Incluso un corte seco funciona ahí | Marriott rWUZWMDsglc 4:02–4:25 (fotograma 4:10: las capas terminan y empiezan en el mismo fotograma); UVDpgP7sRbw 6:36–6:55 | `tl.set(heroe, {opacity: 0}, tContacto)` + capa nueva ya visible. **No** un fundido cruzado |
| 5 | **Match cut:** el **movimiento** o el **sujeto** continúan a través del corte. Por escala: 100 → 105 % acelerando hacia el corte y 100 → 105 % saliendo de él; "5 % quizá ya es demasiado". También por posición o rotación. Cambiar el objeto 1–2 fotogramas antes del corte suaviza | Marriott ythBGTLjot8 1:26–2:46, 3:32–3:42 | `scale` del escenario (cámara) con `power2.in` hacia el corte y `power2.out` después; ≤ 3–5 % |
| 6 | **Secundarios que reaccionan y no arrancan ni paran a la vez.** Anillo de impacto: el tamaño sale **casi vertical** en el gráfico de valor y llega en horizontal (≈ `expo.out`) | Marriott rWUZWMDsglc 1:03–2:30 (fotograma 2:15); _cjEnGWN3Ug 2:16–2:41 | Retrasos y duraciones distintos por elemento (no un `stagger` uniforme); `expo.out` en el impacto |
| 7 | **Escala que "respira" y luego cae.** Sube muy despacio hasta el pico y cae acelerando; durante la caída se revela la escena siguiente | Marriott UVDpgP7sRbw 6:08–6:30 (fotograma 6:26) | Dos tweens: `sine.inOut` lento + `power3.in` rápido |
| 8 | **Efectos desfasados de la cámara.** Cámara x = 1,5 s; postprocesado 0 → 1 → 0 en 2 s; dolly z 900 → 700 → 900. Sincronizado "parece más aburrido"; con desfase, más natural | Artiukh 12yVUxIkag0 56:45–1:03:15, código en el fotograma 1:01:30 | En scroll: pistas de distinta duración en el mismo timeline (GS-005); en tiempo: `tl.to(..., 0)` con duraciones distintas |
| 9 | **Color global desde un solo control:** todo en escala de grises y un mapa de degradado arriba (CC Toner) | Marriott UVDpgP7sRbw 1:16–2:00 | Recursos en una sola paleta desde el contrato (P6 de CASE-003); en la web, sin filtros CSS sobre capas animadas (AIIMG-001) |
| 10 | **Mezcla de líquido que se aclara de abajo arriba:** máscara que sube con pluma creciente; el color pasa de blanco a gris | Marriott UVDpgP7sRbw 8:43–9:38 | Recurso prerenderizado (secuencia) o `clip-path`/máscara con degradado en una capa pequeña |

## 3. Cuándo usarlo
- En todo cambio de escena con un protagonista (P2 de CASE-003).
- Si el cambio es solo de fondo, basta con el procedimiento 8 o un panel (CARD-001).

## 4. Recursos
- Del protagonista: **el estado de salida y el de llegada en la misma posición y escala de nido** (contrato REC-003).
- Opcional: un fotograma intermedio (*smear*) o una secuencia con desenfoque de movimiento renderizado (AIVID-001).

## 5. Tecnologías — After Effects frente a la web (no confundir)
| En los tutoriales (AE) | ¿Existe en GSAP o en el navegador? | Decisión |
|---|---|---|
| Editor de gráficos (curvas de valor dibujadas a mano) | `CustomEase` (incluido en gsap 3.15.0, sin coste) acepta una curva SVG; `power*`, `expo`, `back` y `blendEases` son aproximaciones | Tiempo real |
| Ease Copy | No existe como tal: se reutiliza el mismo nombre de ease | Tiempo real |
| Morph de trayectorias (*mask path*) | MorphSVG para **vectores**; **no** para fotos | Vector: tiempo real. Foto: **prerenderizar** (secuencia o vídeo, AIVID-001) |
| Motion blur de capa | **No hay** desenfoque direccional barato en CSS; un `filter: blur` animado cuesta (AIIMG-001) | Prerenderizar en la secuencia, o limitar la velocidad máxima |
| Turbulent Displace, Gaussian Blur + Simple Choker | SVG `feTurbulence`/`feDisplacementMap`, `feGaussianBlur` + `feColorMatrix` (umbral de alfa) | Tiempo real **solo en capas pequeñas** (medido en el lote 28: a pantalla completa, p95 = 50 ms) |
| Track matte | `mask-image`, `clip-path`, `<mask>` de SVG | Tiempo real |
| Postprocesado (cortina, RGB shift) | three.js `EffectComposer` + `ShaderPass` | Tiempo real, **requiere three.js (sin autorizar)** |

## 6. Estructura (probada en la animática)
```js
const tc = 1.10;                                   // contacto = relevo
tl.to(h, { y: -0.03 * VH, rotation: -2, duration: .45, ease: "power2.out" }, 0)  // anticipación
  .to(h, { y: -0.036 * VH, duration: .15, ease: "none" }, .45)                   // espera con deriva
  .to(h, { x: DX, duration: tc - .6, ease: "power2.in" }, .6)                    // arco: x e y con eases distintos
  .to(h, { y: DY, rotation: 0, duration: tc - .6, ease: "power3.in" }, .6)       // acelera hasta el contacto
  .to(h, { scale: S, duration: tc - .6, ease: `expoScale(1,${S},power2.in)` }, .6)
  .to(plato, { y: 0, duration: .55, ease: "power3.out" }, tc - .55)              // la llegada frena justo en el contacto
  .set(h, { opacity: 0 }, tc)                                                    // RELEVO de 1 fotograma
  .to(plato, { y: .022 * VH, duration: .12, ease: "power2.out" }, tc)            // traspaso de peso (misma dirección)
  .to(plato, { y: 0, duration: .5, ease: "power2.inOut" }, tc + .12)
  .fromTo(escena, { scale: 1 }, { scale: 1.03, duration: tc, ease: "power2.in" }, 0)  // match cut de escala…
  .to(escena, { scale: 1, duration: 1, ease: "power2.out" }, tc);                // …con otra duración (desfase)
```

## 7. Parámetros
- Anticipación: 2–4 % del alto o 2–3°, durante 0,3–0,6 s.
- Push-in del match cut: ≤ 3–5 %.
- Traspaso de peso: un 30–40 % de la velocidad de llegada.
- Desfase cámara / efecto: 0,3–0,5 s.
- Retrasos de los secundarios: 0,02–0,25 s, cada uno distinto.

## 8. Problemas visuales
- **Doble imagen:** fundido cruzado con los nidos aún separados.
- **Frenazo antes del relevo:** el objeto llega parado y el cambio se ve.
- **Estroboscopio:** a máxima velocidad el objeto salta decenas de px por fotograma y, sin desenfoque de movimiento, se ve a saltos.
- Todos los secundarios arrancan a la vez.
- Push-in exagerado (> 5 %).

## 9. Móvil
- Las mismas proporciones (en `vh`).
- Si el protagonista es grande, reducir la velocidad máxima: los px por fotograma son proporcionales al tamaño.

## 10. Reduced motion
Sin anticipación, push-in ni rebotes. El relevo se convierte en un corte entre estados fijos.

## 11. Coste
Transforms y opacidad: coste despreciable (animática: 0 errores). El desenfoque de movimiento real solo en recursos prerenderizados.

## 12. Pruebas (medidas en la animática del lote 30)
| Métrica | A · base (lote 27: fundido) | B · receta (lote 30) |
|---|---|---|
| Fotogramas con **doble imagen** (héroe semitransparente) | **11**, con los nidos separados 115 → 5 px | **0** |
| Velocidad del héroe justo antes del relevo | 22 px/s (casi parado: el relevo se ve) | **770 px/s** hacia abajo |
| Fotograma del relevo frente al pico de velocidad | relevo f46, pico f30 | relevo **f33**, pico **f32** (relevo en el máximo) |
| Velocidad del plato antes y después del relevo | −305 → −146 px/s (el plato sigue entrando mientras el héroe se funde) | −3 → **+296 px/s** (llega parado y recibe el peso hacia abajo: sin meseta) |
| Desajuste de nidos en el relevo | 10,8 px | **0,0 px** ⚠ *corregido en el lote 31: medido en el fotograma en que el héroe ya era invisible; el salto VISIBLE es de 53,6 px y −8 %* |
| Anticipación (velocidad mínima previa) | 0 | −134 px/s (hacia arriba) |
| Cortes detectados (`cortes_video.py`) | 0 | 0 |

**Hallazgo nuevo — el scroll rompe la regla 4.** En After Effects, "máxima velocidad" es una propiedad del **tiempo**. Con `scrub`, la velocidad la decide el usuario: si desplaza despacio, el relevo ocurre a pocos px por fotograma y **se ve** [CALC: px/fotograma = dy/dp × dp/fotograma]. Opciones:
- convertir **ese tramo** en un tween de tiempo que se dispara al cruzar el punto (callbacks de ScrollTrigger o `snap` al final del tramo);
- esconder el relevo detrás de una oclusión (el titular, un ingrediente en primer plano, el cambio de texto de REC-003 en p = 0,72);
- usar una secuencia (AIVID-001), donde no hay relevo.

**Pendiente de medir en scroll real.**

## 13. Evidencia
- `evidence/youtube/2026-11-04-lote30/`: registro, 8 fotogramas, `fase4/` con la página, los scripts, `serie.json`, `medidas.json`, `hojas_estados.png` y `rosso_animatica_lote30.mp4`.
- Informe por tutorial en `integration/YOUTUBE_ESTUDIOS.md` (lote 30).

## 14. Cómo pedirlo
"Edita el cambio de escena con EDIT-001:
1. Haz primero una animática con fixtures rotulados.
2. Declara el elemento guía y su ease, la anticipación y el instante del relevo (a máxima velocidad, sin fundido).
3. Declara el match cut de cámara (≤ 5 %, con otra duración) y los secundarios escalonados.
4. Mide: 0 fotogramas de doble imagen, relevo a ±1 fotograma del pico, sin meseta en el traspaso.
5. Di cómo se resuelve el relevo si el usuario desplaza despacio."

## Lote 31 · Correcciones medidas (evidence/demos/2026-11-04-lote31/INFORME_LOTE31.md)
1. **Cómo medir un relevo:** la distancia entre el **último fotograma con el héroe visible** y el primero con el objeto nuevo, más la diferencia de píxeles en ese fotograma frente a la mediana del movimiento.
   - El lote 30 midió el fotograma invisible (0,0 px). El salto real era de **53,6 px**, y la diferencia en el relevo, **20,7×** la mediana.
   - `cortes_video.py` no lo detectó: **un detector de cortes no aprueba un relevo**.
2. **La regla 4 (relevo a máxima velocidad) solo se aplica cuando las dos formas son casi iguales y el tiempo es fijo** (vídeo).
   - Si cambia toda la silueta (tenedor + nido → plato), el ojo lo ve aunque vaya rápido.
   - Con scroll lento queda expuesta: medido, la imagen desaparece en un fotograma (Δopacidad 1,0), con 12 px de salto y 5 parpadeos en un zigzag.
3. **Alternativa validada — relevo por composición:**
   - el objeto que llega **se posa** (velocidad → ~0);
   - se **bloquea** al destino (separación 0 px);
   - se funde en ~0,3 s mientras una capa delantera (el borde del plato) y la sombra integran el contacto.
   - Medido: 0,7 px de salto en tiempo; 0,3 px y Δopacidad ≤ 0,054 por fotograma con scroll lento; 0 relevos repetidos en el zigzag.
   - **Un fundido entre capas alineadas no es una doble imagen.**
4. **Para cambiar de forma, aislar la parte común:** el protagonista del tramo es solo lo que existe en las dos escenas (el nido). Lo demás (el tenedor) sale antes o no está en ese tramo.
5. **Velocidad continua en el contacto:** el receptor (el plato) debe moverse **en la misma dirección y a la misma velocidad** que el objeto en el instante del encuentro (+60 px/s ambos). Así no hay frenazo ni giro (en el lote 30: −48 195 px/s² y 54°).
6. **Trayectorias Hermite C1** con claves [t, valor, velocidad] en lugar de tweens encadenados: no hay quiebros de dirección entre la anticipación y el gesto. GSAP sigue siendo el reloj (`tl` de 2,5 s); el estado se evalúa en cualquier t, que es lo que permite el motion blur (MBLUR-001).
7. **Falso 3D en un eje** (Marriott, UVDpgP7sRbw) para igualar la perspectiva de dos recursos: escala Y 1 → proporción del destino.
8. **Estrategias de scroll comparadas** (A scrub + relevo de 1 fotograma, B microtransición en tiempo, C scrub + composición): **elegida C**. B solo si la transición debe verse completa siempre: se salta con scroll rápido y sigue animando cuando el usuario se detiene.

## Lote 32 · Confirmaciones de Marriott (n24aTp1-jK4, a7Nyzqy9_I0)
- **Morph por relevo:** las dos capas animan hacia una **forma intermedia común** y se relevan en el centro, como un match cut (1:36–2:03). Los dos fotogramas del relevo están **separados un fotograma**, no son idénticos.
  - Coincide con lo medido en el lote 31: para cambiar de forma, aislar lo común (el nido) y llevar las dos capas al mismo estado.
- **Velocidad máxima en los 3 fotogramas centrales** con el ease máximo. **Es válido en vídeo; con scroll, ver §Lote 31.**
- **Anticipación antes de partirse:** contraer un ~9 % y estallar.
- **Escala inicial al 10 %** en lugar de 0: un fotograma visible más.
- **Mostrar la consecuencia del impacto** (salpicadura, rebote) para que el impacto "se sienta". Con scroll: ingredientes que rebotan, migas, un pequeño hundimiento del plato.
- **Tensión creciente** antes del impacto (temblor que aumenta).
- **Límite:** son morphs de trayectorias **vectoriales**. Con un producto fotográfico solo se aplica a máscaras y siluetas, nunca a los píxeles (TRN-001).
