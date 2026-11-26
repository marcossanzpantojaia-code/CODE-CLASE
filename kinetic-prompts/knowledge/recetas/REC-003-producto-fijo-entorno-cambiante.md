---
id: REC-003
titulo: Receta C — producto fijo, entorno cambiante (inspirada en ROSSO): el producto queda estable mientras paneles, titulares e ingredientes se mueven a distintas velocidades y profundidades; titular "enhebrado" en el producto con legibilidad medida
categoria: recetas
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia (evidence/demos/2026-11-01-lote24/receta_c_producto_fijo/: 5 estados a 1 440 y 375 px, vídeo, medicion.json con solape del titular; comparacion_halo.png) + VIDEO_INSPECCIONADO (CASE-003 R4 27,8–36,1 s, observación) + DOCUMENTACION_OFICIAL_ANALIZADA (MDN, contextos de apilamiento; realtimerendering.com, alfa premultiplicado)
versiones: microdemo con JS nativo + Chromium 153; variante GSAP 3.15 documentada
perfil: cinematografico
ultima_revision: 2026-11-02
---

# REC-003 · Receta C: producto fijo, entorno cambiante

**Niveles:**
- **IMPLEMENTADO y PROBADO** (mecánica): reversibilidad 0, 0 errores, reduced motion activo, script p95 0,4 ms. Solape del borde delantero sobre la 2.ª línea del titular: **máx. 6,4 % a 1 440 px** y 0 % a 375 px [MED].
- **VISUALMENTE VALIDADO:** **no** (plato procedural).

**Referencia observada (R4 ROSSO).** La pasta enrollada queda fija mientras el panel granate sale hacia arriba y los textos de las tres secciones se suceden. Los ingredientes estallan y orbitan, y el plato entra para recibir la pasta.

## 1. Estados
| p | Producto | Panel | Titular | Ingredientes | Fondo y fantasma |
|---|---|---|---|---|---|
| 0 % | centro-derecha, escala 1 | granate cubriendo la mitad derecha | "Amor al primer giro." **enhebrado** en el plato | — | "ROSSO" a +4vw |
| 25 % | igual (dolly 1,015) | saliendo hacia arriba (18–34 %) | igual | — | — |
| 50 % | igual (1,03) | fuera | "Un poco de todo." (cambio en el 38 %, con la línea **fuera de la máscara**) | entran (40–50 %) y orbitan en 3 planos | — |
| 75 % | igual (1,045) | — | cambio a "Tu mesa te espera." (72 %) | salen (68–78 %) | — |
| 100 % | 1,06 | — | legible | — | "ROSSO" a −4vw |

## 2. Capas y oclusión
`panel` (z0) → fantasma (z1) → **producto trasero** (z2) → **titular** (z3) → ingredientes cercanos (z5) / medios (z3) / lejanos (z1) → **producto delantero** (z4, la misma imagen recortada con `clip-path: inset(66% 0 0 0)`).

El titular queda **delante del borde trasero y detrás del delantero**: parece atravesar el plato. Con un render, las dos capas se obtienen con *holdout* (BLEND-001 §8); con una foto, con una máscara pintada de la parte delantera.

**Legibilidad:** el borde delantero solo puede cubrir una franja baja de las letras. Métrica: **solape ≤ 15 % del área de la línea** y nunca la palabra clave entera. En la primera versión de la microdemo (`inset(56%)`) tapaba "giro" y se corrigió a `inset(66%)` → máx. 6,4 %.

## 3. Movimiento por profundidad (MOT-001, CAM-003)
- Plano lejano: velocidad ×0,6, escala 0,55, `blur(2,5px)`.
- Medio: ×1, escala 0,85.
- Cercano: ×1,6, escala 1,35, **delante** del producto.
- Órbita elíptica alrededor del centro del producto, **leído en cada fotograma** con `getBoundingClientRect()`, para que no se despegue durante el dolly.

## 4. Timeline GSAP equivalente (DOCUMENTADO, sin ejecutar)
```js
const tl = gsap.timeline({ scrollTrigger: { trigger: "#acto", start: "top top", end: "+=320%", pin: ".escenario", scrub: .5,
  snap: { snapTo: "labelsDirectional", duration: { min: .2, max: .5 } } } });
tl.addLabel("s1").to(".prod", { scale: 1.06, ease: "none", duration: 1 }, 0)                 // dolly continuo
  .to(".panel", { clipPath: "inset(0 0 100% 0)", duration: .16, ease: "power2.inOut" }, .18)
  .add(cambiarTitular(1), .38).addLabel("s2", .45)
  .fromTo(".ing", { autoAlpha: 0, scale: .3 }, { autoAlpha: 1, scale: i => [.55, .85, 1.35][capa(i)], stagger: .01, duration: .1 }, .40)
  .to(".ing", { autoAlpha: 0, duration: .1 }, .68)
  .add(cambiarTitular(2), .72).addLabel("s3", .8);
// cambiarTitular(n): timeline que baja las líneas a yPercent 110, cambia el texto en su onComplete/onReverseComplete y las sube.
// Para la reversibilidad: el texto se elige por progreso (como en la microdemo), no por eventos.
// Órbita: un objeto {a:0} animado de 0 a 2π a lo largo de tl + onUpdate que coloca cada .ing según su plano.
```

## 5. Requisitos visuales
- Producto fotorrealista con **alfa premultiplicado correcto**. La `comparacion_halo.png` muestra el **halo oscuro** de un PNG cuyos bordes arrastran el color de un fondo negro (simulado) frente al recurso limpio.
- Ingredientes reales (recortes con la misma luz que el producto), no círculos.
- Sombra de contacto del producto bajo el plato, en su propia capa (la proyecta el render: `is_shadow_catcher`).

## 6. Responsive
- Móvil: producto al 96 % del ancho, titular arriba (sin enhebrar; solape 0), panel en la mitad inferior.
- Ingredientes: limitar a 6 en móvil.

## 7. Problemas que evitar
- Producto que "tiembla" por mezclar `scale` con cálculos de layout (usar solo `transform`).
- Titular cubierto en exceso (medir el solape).
- Texto que cambia a la vista.
- Ingredientes sin relación con el producto o en un solo plano (sin profundidad).
- `filter: blur` en elementos grandes (caro).
- Contextos de apilamiento inesperados: `opacity < 1`, `transform`, `filter`, `clip-path`, `mask`, `will-change`, `isolation` o `position: sticky/fixed` crean uno nuevo, y el `z-index` interior ya no compite con el exterior [MDN].

## 7b. DIRECCIÓN ARTÍSTICA APLICADA (lote 25)
| Aspecto | Decisión |
|---|---|
| **Tipo de recurso** | Producto en **dos pases del mismo render** (trasero y delantero, o *holdout*; BLEND-001 §8); **ingredientes reales** fotografiados o renderizados con alfa, no formas vectoriales (la microdemo usó formas: es su principal carencia visual) |
| **Iluminación** | Misma luz clave y misma altura de cámara en producto e ingredientes; contraluz para separar el producto del fondo que cambia de color (COMP-001) |
| **Integración con el fondo** | **Sombra de contacto** del producto en su capa; el color del fondo de cada acto se refleja en los bordes (plano del color del fondo visible solo en reflejos, o un tinte suave por acto) |
| **Qué controla GSAP** | Color del fondo, paralaje de los ingredientes por planos de profundidad, recorte del titular (`clip-path`), escala mínima del producto |
| **Qué exige canvas, vídeo, WebGL o secuencia** | Nada si el producto no gira; si gira, secuencia (SEQ-002). Partículas o vapor: vídeo con alfa |
| **Evitar el movimiento artificial** | Los ingredientes entran con retardo por profundidad y en arco (MOT-002), nunca todos a la vez ni en línea recta; desenfoque solo en los del primer plano, coherente con su profundidad |
| **Atención en el protagonista** | El producto es fijo: ningún secundario debe taparlo más del 10 %; solape con el titular ≤ 15 % (ya medido). Visibilidad del protagonista ≥ 0,50 en todos los pasos (AUD-001) |
| **C1** | Capturas de los 5 estados frente a R1; borde al 400 % sobre los fondos claro y oscuro (halo, DEPTH-001) |
| **C2** | Paralaje medido por plano (velocidades distintas y constantes por capa), reversibilidad visual ≤ 0,5 % (medido en la microdemo: 0,14 % a 375 px), vídeo |
| **C3** | Rúbrica humana |

## 8. Evidencia necesaria
`medicion.json` (reversibilidad, solape del titular), capturas de los 5 estados, vídeo, prueba del halo (borde al 400 % sobre fondo claro y oscuro) y C1/C3 humanos.

## 9. Cómo pedirlo
"Implementa la Receta C (REC-003) con [producto]: capas trasera y delantera del producto con alfa limpio, tabla de estados, planos de profundidad de los secundarios y medición del solape del titular (≤ 15 %)".

## 10. Ejecución con GSAP 3.15.0 (lote 26)
Código: `evidence/demos/2026-11-02-lote26/demos/receta_c.html`, plato `producto_c.png` (`genera_plato.py`). Resultados: `evidence/demos/2026-11-02-lote26/resultados/C_*`.
- **Equivalencia con el nativo:** 0 % visible a 1 440 y 375 × 800 (máx. 5 por canal). Pin, reversibilidad, resize, reduced motion y desmontaje correctos (0 estilos residuales tras `limpiar()`).
- **Correcciones visuales** (procedurales; **no son fotorrealismo**):
  - **Plato con volumen:** luz clave arriba-izquierda, ala con gradiente y brillo especular, oclusión en el canto, salsa con brillo, pasta con sombreado propio. Escalado **premultiplicado**.
  - **Sombra de contacto** en su propia capa (`multiply`, dos elipses: penumbra y oclusión), que escala con el producto.
  - **Ingredientes con sombra proyectada coherente** con la misma luz (más desplazada y difusa cuanto más cerca).
- **Defecto nuevo detectado y corregido:** a 375 px los ingredientes del primer plano tapaban el titular. AUD-001 no lo medía; ahora mide `oclusion_texto`.
  - Regla: un ingrediente se atenúa en proporción a su solape con el titular (transparente al 40 %).
  - **Oclusión máxima: 4,2 % (375 px) y 0,2 % (1 440 px).**
- **Coste:** a 1 440 px, 30 fotogramas > 33 ms en el recorrido (26 con el motor nativo). El cuello de botella es el **pintado** de `drop-shadow`, `blur` y `mix-blend-mode` en software rendering; el script p95 es ≤ 0,7 ms. Con recursos reales: **hornear** las sombras de los ingredientes en sus PNG en vez de usar filtros CSS.
- **Recursos publicitarios necesarios:** ver COMP-001 §15.

## 11. Recursos reales e integración preparada (lote 27)
- **Corrección del diagnóstico del lote 26.** El bajo rendimiento a 1 440 px **no** lo causaban los filtros de los ingredientes, sino el **`mix-blend-mode: multiply` de la sombra**. Medido desactivando las capas una a una:
  - con todo: 26–38 fotogramas > 33 ms;
  - sin `multiply`: 0–1;
  - sin filtros: 25–37.
  - Corrección: sombra **horneada** en RGBA con mezcla normal → **0 fotogramas > 33 ms** en la integración.
- **Contrato de recursos:** `integration/contratos/CONTRATO_RECURSOS_REC003.md` (prompts, encuadres, luz, perspectiva, fondos, formatos e imprescindibles u opcionales) y `contrato_rec003.json`.
- **Fidelidad:** `integration/contratos/REC003_FIDELIDAD_CINCO_ESTADOS.md`.
  - La referencia transforma el objeto (tenedor → hélice → plato). Aquí: héroe fijo en los actos 1–2 y **aterrizaje del nido del héroe en el nido del plato** con relevo sin valle en el acto 3.
  - El cambio de forma solo con una secuencia (O1).
- **Integración:** `integration/plantillas/rec003_recursos/` (manifiesto, AVIF/WebP, `decode()`, sin sustitutos).
  - Validada con fixtures y GSAP 3.15.0: 0 errores; 0 % visible nativo↔GSAP en layouts de px enteros; reversible; pin, resize, reduced motion y desmontaje correctos; 0 cortes.
- **Legibilidad corregida y medida:**
  - el héroe tapaba el 71 % de una línea en móvil → 2,3 % (recolocación y paso detrás del titular en p = 0,72);
  - el titular cruzaba el panel granate en un 6,6 % de su caja (contraste de 1,82:1) → 0 % (panel desde el 56 %).

## 12. Lote 30 · Receta de producción del aterrizaje y animática
- `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE.md`: guion de la transición, recursos (nuevos: I1-smear y O1), procedimiento de edición, estrategia web y criterios de aceptación.
- Animática medida: `integration/plantillas/rec003_recursos/animatica_aterrizaje.html`.
  - Frente al fundido del lote 27: **11 → 0 fotogramas de doble imagen**; relevo a máxima velocidad (f33 frente al pico en f32); 0,0 px de desajuste; traspaso de peso sin meseta.
- **Cambio recomendado** para la integración con scroll: el tramo del aterrizaje se dispara en tiempo al cruzar p = 0,80 (EDIT-001 §12), porque con `scrub` un desplazamiento lento haría visible el relevo. **Pendiente de implementar y medir** en `index_flip.html`.

## 13. Lote 31
- La receta del aterrizaje pasa a la **v2** (`integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE_v2.md`): nido aislado (I1-nido), aterrizaje suave, relevo alineado por composición, motion blur en canvas y estrategia C de scroll.
- Prueba aislada: `integration/plantillas/rosso_aterrizaje_l31/` (scroll lento, rápido, zigzag, saltos, resize, reduced motion, recursos retrasados y desmontaje medidos en 1 280 y 375).
- **Pendiente:** llevarlo a `index_flip.html`, sustituyendo el tramo 0,72–0,90.
