---
id: REC-001
titulo: Receta A — objeto que conecta dos secciones (inspirada en POUR/PLAY): el recipiente permanece en el encuadre mientras cambian texto, fondo y composición, y un conector (chorro) une dos capas
categoria: recetas
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia (evidence/demos/2026-11-01-lote24/receta_a_continuidad/: capturas de 5 estados a 1 440 y 375 px, vídeo bajando y subiendo, medicion.json) + VIDEO_INSPECCIONADO (CASE-003 R1 2,25–12 s, observación; tecnología de Enky DESCONOCIDA) + DOCUMENTACION_OFICIAL_ANALIZADA (ScrollTrigger, Flip) — la variante GSAP está DOCUMENTADA, sin ejecutar
versiones: microdemo: JS nativo + Chromium 153; variante GSAP 3.15
perfil: cinematografico
ultima_revision: 2026-11-02
---

# REC-001 · Receta A: objeto que conecta dos secciones

**Niveles:**
- **IMPLEMENTADO y PROBADO** (mecánica): reversibilidad 0 en 41 pasos a 1 440 y 375 px, 0 errores, reduced motion activo, script p95 1,3 ms.
- **VISUALMENTE VALIDADO:** **no**. Jarra y taza son SVG procedurales; con recursos reales hay que pasar C1/C3.

**Referencia observada (CASE-003, R1).** El chorro baja del gotero y "atraviesa" el cambio de sección hasta la taza; el fondo cambia de crema a caramelo con un panel que sube; los titulares cambian por líneas. **Tecnología de Enky: desconocida** (los reels están marcados como IA).

## 1. Estados (método MOT-001)
| p | Protagonista (jarra) | Conector (chorro) | Fondo | Texto | Secundario |
|---|---|---|---|---|---|
| **0 %** | derecha (58vw, 24vh), vertical | — | crema | "Deja que florezca." legible | palabra fantasma "BLOOM" a −6vw |
| **25 %** | moviéndose hacia (46vw, 12vh) | — | crema | titular 1 saliendo por la máscara (línea a línea) | taza aún fuera (por abajo) |
| **50 %** | en posición, empieza a inclinarse | — | crema | — | taza entrando (llega al 55 %) |
| **75 %** | inclinada −38° (**meseta** del 58 al 85 %) | chorro completo pico → taza | panel caramelo cubriendo (60–80 %) | "Sirve sin prisa." entrando por líneas | — |
| **100 %** | se endereza a −12° | chorro "se corta" de arriba abajo (86–98 %) | caramelo | titular 2 legible | fantasma a +6vw |

## 2. Capas (de atrás adelante)
`f1` crema → `f2` caramelo (`clip-path: inset(X% 0 0 0)`) → palabra fantasma (z1) → textos (z3) → jarra y taza (z4) → chorro SVG a pantalla completa (z5). El escenario lleva `isolation: isolate` para que el `z-index` de las capas no se mezcle con el resto de la página (contextos de apilamiento, DEPTH-001).

## 3. Mapeo del scroll
Sección de 400vh; escenario `sticky` de 100vh → recorrido de 3 pantallas. Pistas en `evidence/demos/2026-11-01-lote24/codigo/receta_a_continuidad.html` (objeto `K`). El conector se dibuja **cada fotograma** entre `#pico.getBoundingClientRect()` y `#boca.getBoundingClientRect()` (coordenadas compartidas, CONT-001 estrategia 1).

## 4. Timeline GSAP equivalente (DOCUMENTADO, sin ejecutar)
```js
gsap.registerPlugin(ScrollTrigger);
const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: {
  trigger: "#acto", start: "top top", end: "+=300%", pin: ".escenario", scrub: 0.4 } });
tl.addLabel("florecer")
  .to({}, { duration: .15 })                                                      // meseta del titular 1
  .to(".t1 .linea > span", { yPercent: -110, stagger: .02, duration: .12 })
  .to("#jarra", { x: "46vw", y: "12vh", duration: .3 }, "<")                       // desplazamiento a la posición de vertido
  .from("#taza", { y: "120vh", duration: .2 }, "-=0.1").addLabel("verter")
  .to("#jarra", { rotation: -38, duration: .13 })
  .to(".f2", { clipPath: "inset(0% 0 0 0)", duration: .2 }, "+=0.02")
  .to(".t2 .linea > span", { yPercent: 0, stagger: .02, duration: .12 }, "-=0.08").addLabel("servir")
  .to({}, { duration: .1 })
  .to("#jarra", { rotation: -12, duration: .15 });
// chorro: onUpdate del ScrollTrigger → recalcular el trazo pico→boca y su strokeDashoffset según tl.progress()
```
`f2` debe partir de `clip-path: inset(100% 0 0 0)` en CSS. Las líneas de `t2`, de `yPercent: 110` (`gsap.set`).

## 5. Requisitos visuales (para C1/C3 con recursos reales)
- **Recursos:** jarra y taza fotorrealistas con alfa y **la misma luz** (ART-001, BLEND-002). El chorro, como vector, debe imitar el color y el brillo del líquido; con el realismo de la referencia haría falta **una secuencia del líquido** (SEQ-001) en vez de un trazo.
- Protagonista ≥ 30 % del ancho en escritorio y ≥ 50 % en móvil; nunca más pequeño que el titular.
- La palabra fantasma no debe competir: ≤ 6 % de contraste con el fondo.

## 6. Implementación mínima
1. Escenario `sticky` (o `pin`).
2. Tabla de estados.
3. Una función `aplica(p)` o un timeline.
4. Conector calculado por fotograma.
5. `.rm` para reduced motion.
6. Medición con `medir_demo.mjs`.

## 7. Problemas que evitar (vistos al construir la microdemo)
- **Conector desincronizado:** calcularlo **después** de mover la jarra en el mismo fotograma.
- **Cortar el chorro "hacia atrás"** (de abajo arriba) al final parece rebobinar: en la microdemo se invierte el sentido del `dashoffset` desde el 90 % para que se corte desde el pico.
- **Cambiar el texto sin meseta:** ilegible.
- **Titular saliendo a la vez que entra el siguiente:** separarlos ≥ 25 % del recorrido.
- En móvil, la jarra tapaba el titular → tabla de claves propia (`movil()`).

## 7b. DIRECCIÓN ARTÍSTICA APLICADA (lote 25)
| Aspecto | Decisión |
|---|---|
| **Tipo de recurso** | Jarra o producto **fotografiado o renderizado** con alfa limpio (ASSET-001, BLEND-002); si gira > 15°, **secuencia** de 36–72 fotogramas (SEQ-002); el chorro es un recurso propio (vídeo con alfa o secuencia), no un trazo de CSS |
| **Iluminación** | Luz clave lateral única para la jarra y para la escena de destino; gradiente en el vidrio o el metal y paneles negros para los bordes (COMP-001) |
| **Integración con el fondo** | Sombra de contacto en su propia capa que se separa al despegar (la sombra crece y se difumina con la altura); reflejo del color del fondo en el borde del recipiente |
| **Qué controla GSAP** | Posición, escala, giro (con `smoothOriginChange` al pasar a pivotar desde el asa), opacidades, máscaras, la línea de tiempo y el progreso de la secuencia (GS-005) |
| **Qué exige canvas, vídeo, WebGL o secuencia** | Todo giro con cambio de perspectiva o vertido real: secuencia o vídeo. WebGL solo si el líquido debe reaccionar (no es necesario en la receta) |
| **Evitar el movimiento artificial** | Trayectoria en arco, anticipación de 3° antes de verter, continuidad de velocidad entre tramos (MOT-002); nada de traslación lineal a velocidad constante |
| **Atención en el protagonista** | Ancho visible ≥ 0,30 del lienzo en todo el acto (AUD-001 regla 1). **Corrección de la auditoría (H1, H2):** con la microdemo, el 50 % del acto quedaba sin texto legible → añadir una **meseta legible en el clímax** (titular al 100 % entre p 0,45 y 0,60) y no apagar el titular de salida antes de que el de entrada sea legible |
| **C1** | Capturas de los 5 estados lado a lado con el storyboard y con R1 (CASE-004) |
| **C2** | Curvas de x, y y giro con `curvas_scroll.mjs`; saltos de velocidad en las uniones ≤ 2× la mediana; reversibilidad visual ≤ 0,5 % (`auditoria_visual_escena.mjs`); vídeo de bajada y subida |
| **C3** | Rúbrica de EVAL-001 puntuada por una persona |

## 8. Evidencia necesaria para darla por buena en un proyecto
`medicion.json` (reversibilidad = 0, 0 errores), capturas de los 5 estados en los 2 anchos, vídeo bajando y subiendo, reduced motion y **C1/C3 humanos** con los recursos reales.

## 9. Cómo pedirlo
"Implementa la Receta A (REC-001) con [jarra/frasco/producto]: aporta los recursos con alfa, la tabla de estados adaptada y las mediciones del §8".

## 10. Ejecución con GSAP 3.15.0 (lote 26)
Código: `evidence/demos/2026-11-02-lote26/demos/receta_a.html` (?motor=gsap|nativo, ?pin=1). Resultados: `evidence/demos/2026-11-02-lote26/resultados/A_*`.
- **Equivalencia con el nativo:** 0 % de píxeles con diferencia visible a 1 440 y 375 × 800 en los 5 estados.
- **Pin, reversibilidad, resize, reduced motion y desmontaje** correctos (GS-005 §2).
- **Correcciones visuales medidas (AUD-001):**
  - **Pasos sin ninguna línea legible: de 11 de 21 (52 %) a 2 de 21 (p 0,50 y 0,55; ≈ 10 %).** Para ello, el panel sube en 0,40–0,56, el titular 1 sale en 0,44–0,52 y el titular 2 entra en 0,52–0,60, sobre el caramelo.
  - **Rótulo de la sección 1** que nunca salía y se solapaba con el de la 2 (visto en la hoja de estados de 375 px; ninguna métrica lo detectaba): se desvanece en 0,42–0,48 y el de la 2 aparece en 0,54–0,60.
  - **Anticipación de 3°** antes de verter (MOT-002), implementada con la pista `rotation`.
- **El chorro se mide en coordenadas del escenario** (D3) y se redibuja en `onRefresh` (D2: sin esa corrección desaparecía tras un resize).
- **Pendiente:**
  - protagonista de 0,292 del ancho a 1 440 px (umbral 0,30, al límite);
  - la jarra, la taza y el chorro siguen siendo SVG procedurales (sin C1/C3).
