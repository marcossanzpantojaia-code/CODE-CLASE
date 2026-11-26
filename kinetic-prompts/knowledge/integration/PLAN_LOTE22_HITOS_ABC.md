# Plan del lote 22: de la referencia a una prueba profesional verificable (hitos A → B → C)

Estado: **PLANIFICADO. NADA INSTALADO, DESCARGADO NI RENDERIZADO** (2026-10-27).

El storyboard completo "El ritual" se conserva (`BRIEFING_STORYBOARD_PROTOTIPO_2.md`). Este plan **cambia el orden de validación** del `PLAN_PRUEBA_ACTO_I_II.md`: primero un fotograma, después un movimiento corto y, por último, el control con el scroll. Fichas de apoyo: BLEND-001, PROD-001, SEQ-001/002, DEPTH-001, ART-001, ASSET-001, CASE-004 y EVAL-001.

## 1. Estrategia para alcanzar el nivel visual de la referencia
1. **La calidad nace en el recurso, no en el código.** La referencia (CASE-003, clase R3/R4) se distingue de A1 en el protagonista fotorrealista, la luz y las capas tipográficas, no en la cantidad de JavaScript.
2. **Validar en este orden y detenerse si un hito no se aprueba:**

   | Hito | Qué se valida | Coste | Quién lo aprueba |
   |---|---|---|---|
   | **A · Fotograma** | Que la navaja tenga calidad de anuncio, compuesta con la marca y la tipografía | 1 escena + 1–3 renders acotados | **usuario** (C1 + C3 sobre el fotograma) |
   | **B · Movimiento corto** | Que la apertura (36 fotogramas) sea convincente y continua | reutiliza la escena de A | usuario (C2 en vídeo + C3) |
   | **C · Control con el scroll** | Que GSAP sincronice el objeto, el texto y el fondo sin saltos, con versión móvil y reduced motion | instalar Astro + GSAP | métricas C2 + usuario |
3. **Tecnología mínima suficiente:** Blender (calidad de material) + secuencia en canvas + GSAP ScrollTrigger/SplitText. **Sin Three.js** en esta prueba: no mejora la calidad del metal frente a Cycles (PROD-001 §7). Se reconsiderará si hace falta interactividad libre.
4. **Ninguna afirmación de calidad sin ver el resultado:** Blender permite el fotorrealismo, pero **no está demostrado** que nosotros lo alcancemos. El Hito A existe precisamente para comprobarlo.

## 2. Especificación del fotograma de producto (Hito A)
| Aspecto | Especificación |
|---|---|
| Encargo visual | Navaja de barbero **cerrada** en diagonal ascendente (~20°), sobre fondo tabaco, con la hoja asomando ~15 % de las cachas; anuncio editorial de "El ritual — Acto I" |
| Geometría | Modelado propio (BLEND-001 §5): hoja con *hollow grind* y bisel del filo; espiga con estrías de agarre; cachas de resina negra con bordes redondeados; **pasador de latón**; proporciones de una navaja clásica (hoja ~7–8 cm, longitud cerrada ~15 cm) [conocimiento general] |
| Materiales | Acero: `Metallic 1`, `Roughness` 0,08–0,15 con microvariación, `Anisotropic` 0,3–0,6 en la dirección de la hoja; cachas: dieléctrico negro con `Coat Weight` ~0,8 y `Coat Roughness` ~0,07; latón: `Metallic 1` dorado (BLEND-001 §6) |
| Luz | HDRI de estudio CC0 (candidatas: `studio_kontrast_0x`, `monochrome_studio_0x`, `studio_small_09`) a baja intensidad; **luz clave de área alargada desde la izquierda** (franja de reflejo a lo largo de la hoja); contraluz cálido (≈ 3 200 K) en el filo; tarjeta negra a la derecha |
| Sombra | Plano con `is_shadow_catcher` → sombra de contacto suave bajo las cachas |
| Cámara | Teleobjetivo de 85–100 mm (poca distorsión), elevación de ~15°; profundidad de campo leve: la punta enfocada y el extremo de las cachas un poco suavizado |
| Composición en la web | Objeto en el 45–55 % del ancho, centro-derecha; palabra fantasma "FILO" (≈ 30 vw) **detrás**; h1 "El oficio empieza en el filo." a la izquierda, **con la punta de la hoja por delante** de la última palabra (capa delantera con *holdout*, BLEND-001 §8) |
| Paleta | Fondo tabaco (`oklch(18% 0.02 50)` orientativo), acentos latón; los reflejos del HDRI no deben introducir colores ajenos (C1.3) |
| Render | Cycles en CPU; prueba a 960 × 540 con `time_limit` de 120 s; final a 2 560 × 1 440 en PNG RGBA (`film_transparent`), recortado al objeto; versión compuesta sobre el color de la marca **solo para la evaluación** |
| Excelente fotograma frente a secuencia | El fotograma puede usar muchas muestras y retoque. La secuencia exige **la misma** luz y semilla fija, menos muestras por coste y ausencia de parpadeo. Aprobar el Hito A **no** implica aprobar el B |
| Aceptación (C1 + C3 sobre el fotograma) | Revisión humana lado a lado con referencias R1 de producto. Mediciones: `foco_mayor_componente` ≥ 0,30 (provisional); < 1 % de píxeles quemados (255) en la hoja; sin ruido visible al 200 %; borde del alfa limpio al 400 % sobre claro y oscuro; titular p10 ≥ 3:1 (TEST-003). C3 "Materiales" e "Iluminación" ≥ 4 |

## 3. Prueba breve de movimiento (Hito B) — justificación (PROD-001)
- **B0 (sin coste de render adicional):** máscara y disolución entre los estados "cerrada" y "abierta". **Corrección del lote 23:** como B0 necesita dos estados, el Hito A entrega **dos renders finales** de la misma escena y cámara (`--estado cerrada` y `--estado abierta`, `integration/blender/hitoA_navaja.py`). Valida las capas, la tipografía y GSAP.
- **B1 (la prueba):** **apertura de la navaja en 36 fotogramas** (0° → ~165°) en la misma escena, con cámara fija y una aproximación del 3–5 %. Alfa y dos capas (trasera/delantera).
- **Por qué esta y no otra:** máxima calidad de material (Cycles), continuidad real, reversible con el scroll y coste incremental bajo sobre el Hito A. El 2,5D (GL-003) se rompe en giros grandes; las partículas y la órbita en tiempo real dan menos calidad de metal; la disolución sola no transforma.

## 4. Plan de integración con GSAP y ScrollTrigger (Hito C)
```
<section class="acto-filo">                       ← trigger + pin (end: "+=150%")
  <div class="escena" aria-hidden="true">
    <span class="fantasma">FILO</span>             ← capa 1 (parallax −10 %)
    <canvas class="navaja-tras"></canvas>          ← capa 2 (secuencia "trasera")
  </div>
  <h1 class="titular">El oficio empieza en el filo.</h1>   ← capa 3 (SplitText, mask: "lines")
  <canvas class="navaja-delante" aria-hidden="true"></canvas>  ← capa 4 (solo la punta)
  <img class="clave" src="hitoA_0001.avif" alt="Navaja de barbero cerrada con pasador de latón">  ← LCP y reduced motion
</section>
```
| Requisito | Solución |
|---|---|
| Scrub progresivo y reversible | Un *timeline* con `scrollTrigger: { pin: true, scrub: 0.6, end: "+=150%" }`; `playhead.frame` 0 → 35 con `ease: "none"`; las dos capas dibujan **el mismo índice** de fotograma |
| Sincronización con textos y fondos | Etiquetas en el *timeline* (`"abre"`, `"satelites"`); titular por líneas en 0–0,3; satélites en 0,45; `backgroundColor` tabaco → crema al final (paso al Acto II) |
| Sin saltos visibles | Precarga completa del tramo antes de habilitar el pin (fotograma 0 visible al instante); `img.decode()`; dibujar el fotograma cargado más cercano; C2.3 con Δ ≤ 2 |
| Capas delante y detrás | Render con *holdout* (BLEND-001 §8) → dos canvas con el titular entre ambos (DEPTH-001) |
| Móvil | Juego de 900 px recortado; titular **encima** del objeto (sin solaparse); sin la capa delantera si estorba la lectura; `ScrollTrigger.config({ ignoreMobileResize: true })` y una revisión con ST-006 |
| Reduced motion | `gsap.matchMedia()`, condición `reduceMotion`: sin pin ni secuencia; `<img class="clave">` y el fotograma abierto como imágenes estáticas; texto visible |
| Optimización | Recorte al objeto; WebP con alfa (calidad ~80); juego por dispositivo; memoria decodificada calculada (PROD-001 §6); `devicePixelRatio` ≤ 2; ningún `will-change` en ancestros del pin (ST-002) |
| Medición | `window.__secuencia = { frame }` solo en desarrollo; `curvas_scroll.mjs`; vídeo a 1 440 y 375 px; *long tasks* |
| Limpieza | `ctx = gsap.context()` / `mm.revert()` al desmontar; con `<ClientRouter />`, `revert` en `astro:before-swap` (ASTRO-004 §7) |

## 5. Recursos necesarios y licencias (las tres vías gratuitas)
| Punto | **A · Render en Blender** | **B · Fotografía o vídeo con licencia compatible** | **C · Composición avanzada con recursos existentes** |
|---|---|---|---|
| 1 Recursos concretos | Blender 5.2.3 LTS; navaja de modelado propio; HDRI de estudio Poly Haven (CC0); texturas CC0 opcionales | Fotos o vídeos de navajas y espuma en Pexels/Unsplash/Pixabay, o rodaje propio (fondo liso, luz lateral) | Fotogramas de A o B + máscaras CSS/SVG, mapa de profundidad (GL-003), partículas en canvas, mezcla `screen` para el vapor |
| 2 Origen y licencia | Render propiedad del autor (blender.org); HDRI CC0 | Comercial sin atribución, con límites (Pexels: personas, marcas, reventa; Pixabay: no vender por separado; Unsplash: no replicar el servicio) | La licencia de cada recurso base; recorte con BiRefNet/rembg (MIT) si se autoriza; **RMBG-2.0 excluido (NC)** |
| 3 Calidad esperable | Alta si el modelado y la luz están bien; **sin comprobar** | Muy alta en una foto bien hecha; con fotos de banco, poco control del ángulo y la luz | La de los recursos base; la composición añade profundidad, no realismo |
| 4 Control del movimiento | **Total** (fotograma a fotograma) | Nulo en fotos; limitado en vídeo (lo que se rodó) | Medio: el movimiento lo crea el código (parallax, máscaras) |
| 5 Rendimiento | Secuencia recortada (§6) | Igual si es secuencia; una foto es muy ligera | Muy ligero (pocas imágenes + código) |
| 6 Complejidad | Alta: modelado, luz, render en CPU | Baja con banco; media con rodaje propio | Media |
| 7 Transparencias | **Nativas** (`film_transparent`, *holdout*) | Recorte necesario; espuma y vapor difíciles | Heredadas; `screen` para elementos claros sobre oscuro |
| 8 Riesgo de inconsistencia | Bajo (una sola escena) | **Alto** (fotos de fuentes y luces distintas) | Medio |
| 9 Integración con GSAP | Directa (SEQ-001) | Directa para fotos y vídeo | Directa (MASK-001, CLIP-001, GL-003) |
| 10 Validación | Hito A con C1/C3 humano; tiempo de render medido; bordes del alfa | Registro de licencias (`RECURSOS.md`); revisión de personas y marcas; consistencia de luz | C1/C2 sobre la composición; revisión de artefactos (bordes, parallax) |

**IA generativa:** solo se estudia como alternativa (ASSET-001); **no se usa** sin autorización. Aquí no es viable: no hay GPU ni acceso a los modelos.

## 6. Presupuesto de rendimiento previsto (tramo del Acto I) [EST, a medir]
| Concepto | Escritorio | Móvil |
|---|---|---|
| Fotograma clave LCP (AVIF/WebP) | ≤ 150 KB | ≤ 80 KB |
| Secuencia de 36 fotogramas × 2 capas | ≤ 3 MB (≈ 40–80 KB por fotograma recortado) | ≤ 1,2 MB |
| Memoria decodificada | ≤ 90 MB (1 200 × 500 × 4 B × 36 + capa delantera pequeña) [CALC] | ≤ 50 MB |
| JS (GSAP core + ScrollTrigger + SplitText + código) | medir en el build (objetivo ≤ 60 KB gzip) | igual |
| LCP de laboratorio | ≤ 1,5 s en local sin limitación; ≤ 2,5 s p75 en campo (PERF-001) | igual |
| *Long tasks* durante el scroll | 0 > 50 ms | documentar |
| CLS | 0 | 0 |

## 7. Criterios verificables (EVAL-001, aplicados a los hitos)
- **C1 · Fidelidad visual:**
  - capturas reales de la implementación lado a lado con el storyboard y las referencias R1 (CASE-004) en 5 puntos del pin, a 1 440 y 375 px;
  - `composicion_captura.py` (umbrales **provisionales**);
  - revisión de las proporciones del objeto, la luz, los materiales, el color, la tipografía y las capas;
  - **ninguna ilustración genérica** en lugar del render.
- **C2 · Fidelidad de movimiento:**
  - `curvas_scroll.mjs` (entradas y salidas ±10 % de la tabla del plan; fotograma monótono, Δ ≤ 2);
  - vídeo a 1 440 y 375 px con rueda a impulsos, con mosaico de fotogramas;
  - *long tasks*; móvil; reduced motion;
  - **registros reproducibles** (comando, versión, fecha y JSON).
- **C3 · Calidad creativa:** rúbrica de 8 dimensiones de EVAL-001 (media ≥ 4,0 y ninguna < 3) **puntuada por el usuario o por un revisor humano independiente**. Claude Code **no** puede aprobarla.

Una web que compila, funciona o usa GSAP/Three.js **no es necesariamente profesional**.

## 8. Fichas nuevas o ampliadas en este lote
- **Nuevas:** BLEND-001 (Blender para producto web) y PROD-001 (alternativas de movimiento corto).
- **Ampliadas:** CAM-002 (trayectoria de cámara de Blender a JSON + Observer + quickTo, Codrops 07-2026), DEPTH-001 (capas con *holdout*), SEQ-002 (memoria decodificada), ART-001 (selección de recursos y lista contra lo genérico), `web-library-router` (mapa de lectura previo por elemento) y `web-cinematic-site` (orden A → B → C).

## 9. Bloqueos y autorizaciones pendientes
| # | Decisión | Detalle |
|---|---|---|
| **R1** | Instalar Blender 5.2.3 LTS (versión fijada) | **Dónde:** (a) en el contenedor, abriendo download.blender.org en la red de la organización (aquí solo hay CPU con 2 núcleos); (b) en el ordenador del usuario de forma nativa, mejor si tiene GPU (CUDA/OptiX/HIP/Metal/oneAPI). La VM del puente es Linux y probablemente sin GPU, y no tiene ninguna carpeta conectada. **Hace falta saber qué GPU tiene el ordenador del usuario** |
| **R1b** | Presupuesto de render autorizado | p. ej. ≤ 3 renders de prueba con un `time_limit` de 120 s y 1 render final del Hito A |
| **R2** | Recursos de banco o rodaje propio | solo para el vapor y la espuma (actos posteriores); el Hito A no los necesita |
| **R3** | IA generativa | se mantiene **excluida** salvo autorización |
| **D2** | Instalar Astro 7.4.2 + GSAP 3.15.0 + TS 6.0.3 | solo para el Hito C; procedimiento en `PLAN_ASTRO_GSAP.md` §2c (reversible: basta con borrar la carpeta) |
| **CC BY** | Si se usa un modelo de Sketchfab | requiere que el usuario lo descargue (no creamos cuentas) y una atribución visible |

## 10. Siguiente acción de mayor valor verificable
**Autorizar R1 + R1b y producir solo el fotograma del Hito A** (modelado + luz + 1–3 renders acotados), entregarlo compuesto con la tipografía en HTML estático (sin GSAP) y **que el usuario lo puntúe con C1/C3**. Si no alcanza ≥ 4 en "Materiales" e "Iluminación", se corrige la escena **antes** de producir cualquier movimiento. Es la prueba más barata que falsa la hipótesis central: que podemos producir un protagonista con calidad de anuncio.
