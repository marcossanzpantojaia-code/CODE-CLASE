---
id: EVAL-001
titulo: Tres criterios obligatorios para aprobar una web como "cinematográfica" — C1 fidelidad visual, C2 fidelidad de movimiento, C3 calidad creativa — con pruebas verificables, umbrales provisionales y regla de aprobación
categoria: testing
estado: PROPUESTO
evidencia: VIDEO_INSPECCIONADO (referencia Enky, CASE-003) + DEMO_INSPECCIONADA (A1/B1, lote 19) + medición exploratoria con integration/tools/composicion_captura.py (lote 20)
versiones: Playwright 1.63.0 + Chromium 153; OpenCV 5.0.0; ffmpeg
perfil: cinematografico (C3 también en el héroe de webs comerciales premium)
ultima_revision: 2026-11-02
---

# EVAL-001 · Fidelidad visual, fidelidad de movimiento y calidad creativa

1. **Finalidad.** Impedir que una web se apruebe como cinematográfica **solo porque compila, pasa las pruebas funcionales o usa GSAP**. A1 pasaba casi todas las pruebas técnicas y estaba muy por debajo del nivel buscado. Directiva del usuario, lote 20.
2. **Fuentes.** CASE-003 (referencia), ART-001 (receta), SEQ-001 / DEPTH-001 (técnicas), TEST-004 (batería técnica), COMPARACION_CON_SIN_BIBLIOTECA §3 (rúbrica anterior).
3. **Material de partida obligatorio.** Para poder evaluar, cada encargo debe tener una **referencia**: un storyboard propio (fotograma clave por acto + tabla de movimiento) y, si existe, la referencia externa con sus *timestamps*. Sin referencia no se puede puntuar C1 ni C2 → la evaluación queda **NO VERIFICADA**.

## C1 · Fidelidad visual (captura frente a fotograma de referencia)
| # | Prueba | Cómo | Aprobado si |
|---|---|---|---|
| C1.1 | Composición por acto | Captura a 1 440 × 900 y 375 × 812 del **fotograma clave** de cada acto (en el punto de scroll del storyboard), lado a lado con el fotograma de referencia | un revisor confirma: mismo protagonista, misma posición (tercio o centro), titular en la zona prevista, mismo orden de capas (DEPTH-001 §5) |
| C1.2 | Objeto protagonista | `composicion_captura.py` → `foco_mayor_componente` | **≥ 0,30** [umbral provisional: referencia 0,32–0,76; A1 0,25; B1 0,18] |
| C1.3 | Paleta | k-means de 5 colores frente a la paleta del storyboard; distancia ΔE entre los 3 colores principales | ΔE < 10 por color [provisional] y `dispersion_tono` ≤ 0,05 (monocromía; referencia 0,00–0,03) |
| C1.4 | Riqueza cromática | `croma_media` | ≥ 0,10 en marcas cálidas [provisional: referencia 0,06–0,28, mediana 0,20; A1/B1 0,06] |
| C1.5 | Escala tipográfica | `font-size` del titular / ancho de la ventana | ≥ 9 vw en escritorio (ART-001) |
| C1.6 | Recursos | Ninguna ilustración genérica (avatares, iconos de *stock*) donde el storyboard pide fotografía o render | 0 |

## C2 · Fidelidad de movimiento (cómo entra, se transforma y sale cada elemento)
| # | Prueba | Cómo | Aprobado si |
|---|---|---|---|
| C2.1 | Tabla de movimiento | El storyboard fija, para cada elemento: punto de entrada y de salida (en % del recorrido del acto), propiedad (y, escala, opacidad, fotograma), *easing* y duración o `scrub` | existe **antes** de programar |
| C2.2 | Curvas medidas | Playwright: scroll en 60 pasos por acto; en cada paso, `getComputedStyle` (transform, opacity) de los elementos clave y fotograma dibujado (SEQ-001) → curva valor/progreso | entrada y salida dentro de **±10 %** del recorrido previsto; curvas monótonas donde se espera |
| C2.3 | Continuidad | El objeto protagonista **no desaparece ni salta** entre actos: fotograma dibujado continuo (Δ ≤ 2 fotogramas por paso) y sin pantalla vacía | 0 saltos y 0 pasos sin objeto |
| C2.4 | Ritmo y suavidad | Vídeo `recordVideo` a 1 440 y 375 px con rueda simulada a impulsos (como en la referencia) + mosaico de fotogramas (TEST-004) | revisión **humana** del vídeo: sin tirones; sin elementos que lleguen a la vez sin intención |
| C2.5 | Rendimiento durante el movimiento | `PerformanceObserver('longtask')` durante el recorrido; fotogramas perdidos | ninguna tarea > 50 ms en escritorio; en gama baja, documentar |
| C2.6 | Reduced motion | Mismo recorrido con `reduce` | fotogramas clave estáticos visibles; 0 animaciones de scroll |

## C3 · Calidad creativa (rúbrica 1–5, al menos una persona; a ciegas si hay comparación)
| Dimensión | 3 = correcto | 5 = nivel de referencia |
|---|---|---|
| Dirección de arte | coherente pero genérica | idea visual propia y reconocible en cada acto |
| Profundidad y capas | 2 planos | ≥ 4 planos legibles (fondo, fantasma, titular, objeto, primer plano) |
| Materiales | planos o ilustrados | fotorrealistas: vidrio, metal, líquido o tela creíbles |
| Iluminación | uniforme | luz con dirección, sombras de contacto, brillos coherentes en todos los recursos |
| Tipografía | jerarquía clara | tipografía como imagen (escala, capas, contraste de familias) |
| Composición | ordenada | un foco por pantalla, espacio negativo con intención |
| Coherencia narrativa | secciones sueltas | 3 actos con transformación continua del objeto |
| Movimiento (solo con vídeo) | revelados correctos | el movimiento cuenta la historia (transformación, continuidad, ritmo) |

Se aprueba con **media ≥ 4,0 y ninguna dimensión < 3**. Si una dimensión no se puede ver (p. ej. el movimiento sin vídeo), se marca **NO VERIFICADO** y la web **no** se aprueba como cinematográfica.

## Regla de aprobación "cinematográfica"
1. Pruebas técnicas T1–T10 (TEST-004) sin fallos críticos (T1, T3, T6, T7, T8).
2. **C1, C2 y C3 aprobados.**
3. Evidencia guardada: capturas lado a lado, curvas JSON, vídeos, rúbrica firmada (quién y cuándo).

Compilar, usar GSAP o Three.js, o aprobar Lighthouse **no cuenta** para ningún criterio creativo.

4. **Línea base medida [MED, exploratoria].** `composicion_captura.py` sobre 7 fotogramas de la referencia (recortes de la pantalla del portátil a ~300 px, reescalados) y sobre las capturas de escritorio de A1 y B1:
   - **foco:** referencia 0,32–0,76, A1 0,25, B1 0,18;
   - **croma:** referencia 0,06–0,28, A1 y B1 0,06;
   - **espacio negativo:** referencia 0,24–0,43, A1 0,58, B1 0,62 (A1 y B1 son, sobre todo, fondo vacío oscuro).

   **Limitaciones:** resolución y compresión distintas (el ruido del vídeo reduce los bloques "uniformes"); los umbrales son **provisionales** hasta calibrarlos con más referencias y con capturas a la misma resolución.
5. **Estado.** **PROPUESTO**. La herramienta de C1 está ejecutada sobre 9 imágenes. Faltan las herramientas de C2.2 y C2.3 (curvas) y ninguna construcción ha pasado todavía por los tres criterios.

## Lote 21 · Consolidación (directiva aprobada con reservas)
- C1, C2 y C3 siguen siendo **obligatorios** en toda experiencia cinematográfica, y **C2 también en cualquier héroe premium animado** de una web comercial (Skill `web-commercial-site` corregida).
- Los umbrales de C1 (foco ≥ 0,30, croma ≥ 0,10, dispersión de tono ≤ 0,05) **siguen siendo provisionales**: proceden de recortes de ~300 px de un vídeo comprimido, que además podría estar generado con IA (CASE-003). Se recalibrarán con referencias R1 (CASE-004) capturadas a resolución completa.
- **Herramienta para C2.2 y C2.3:** `integration/tools/curvas_scroll.mjs` (opacidad, traslación, escala y rotación desde la matriz computada; entrada y salida en % del recorrido; continuidad del fotograma si la página expone `window.__secuencia`). Ejecutada sobre A1 como prueba: el título de servicios entra en el 10 % y el primer servicio en el 12,5 % del tramo 0–2 500 px (`evidence/integration/2026-10-27/lote21/curvas_scroll_prueba_A1.json`). **No validada** sobre una secuencia real.
- **Clasificación de la referencia** (CASE-004 §3) obligatoria en el informe de C1: comparar con una referencia R3/R4 mide la proximidad a una imagen **deseada**, no a algo que se haya demostrado en una web.

## Lote 23 · Aceptación del Hito A (fotograma de producto)
Solo tras **inspeccionar el render real**. La aprueba el usuario o un revisor humano independiente; **nunca** por el mero hecho de haberse creado con Blender.
| Requisito | Cómo se comprueba | Aprobado si |
|---|---|---|
| Metal creíble | PNG final al 100 % y al 200 % | franja de reflejo continua a lo largo de la hoja; sin aspecto plástico ni espejo plano; microvariación visible |
| Reflejos e iluminación profesionales | comparación con referencias R1 de producto metálico | dirección de la luz clara, contraluz en el filo, negros con forma; < 1 % de píxeles quemados en la hoja |
| Geometría y proporciones | revisión frente a fotografías de navajas reales (no se copian) | hoja vaciada, filo fino, cachas y pasador creíbles; proporciones de navaja de barbero |
| Composición editorial | `composicion_hitoA.html` a 1 440 y 375 px | foco ≥ 0,30 (provisional), objeto al 45–55 % del ancho, espacio negativo con intención |
| Tipografía integrada | la misma página | palabra fantasma y titular detrás; el objeto cruza el titular sin impedir leerlo; titular p10 ≥ 3:1 (TEST-003) |
| Transparencias limpias | alfa al 400 % sobre claro y oscuro | sin halo ni recorte de la sombra de contacto |
| Comparación con referencias | lado a lado con 2 referencias R1 y con CASE-003 (R3/R4, solo dirección de arte) | C3 "Materiales" e "Iluminación" ≥ 4 |

## Lote 24 · Catálogo de fallos que detectar ANTES de entregar
| Fallo | Criterio | Cómo detectarlo |
|---|---|---|
| Protagonista demasiado pequeño | C1 | `foco_mayor_componente` < 0,30 (provisional) o el producto < 30 % del ancho en escritorio y < 50 % en móvil |
| Exceso de espacio vacío | C1/C3 | `espacio_negativo` > 0,55 sin una intención declarada en el storyboard (A1 tenía 0,58 y B1 0,62) |
| Texto que parece pegado encima de la imagen | C3 | sin interacción de capas (ni detrás ni delante), sin sombra ni color compartido; el titular ignora la luz y la paleta |
| Partículas sin relación con la narrativa | C3 | las partículas no nacen ni mueren en un recurso de la historia (REC-002 §5) |
| Cambio de escena que parece un corte | C2 | en el vídeo, un fotograma con > 30 % de píxeles cambiados (umbral provisional) sin puente (TRN-001 §6) |
| Morphing artificial | C1/C3 | transformación entre recursos incompatibles (TRN-001 regla 1) |
| Transición que falla al invertir el scroll | C2 | `medir_demo.mjs`: diferencia de reversibilidad > 0 en las mismas posiciones, o vídeo de subida distinto del de bajada |
| Recursos de calidad inconsistente | C1 | luz, resolución o estilo distintos entre recursos de una misma escena (ASSET-001) |
| Efectos que degradan el móvil | C2 | script p95 > 8 ms, fotogramas > 33 ms o solape del titular > 0 en móvil; capturas a 375 px |
| Titular tapado | C1 | solape del primer plano > 15 % de la línea (REC-003) |
| Halo en los bordes | C1 | borde al 400 % sobre fondo claro y oscuro (DEPTH-001, lote 24) |

Herramientas: `integration/tools/medir_escena_scroll.mjs` (reversibilidad, estados, tiempos, reduced motion, vídeo), `integration/tools/curvas_scroll.mjs` y `integration/tools/composicion_captura.py`. **C3 lo puntúa siempre una persona**; Claude Code entrega la rúbrica rellenada como propuesta.

## Lote 25 · Transiciones que "funcionan pero son mediocres"
Una escena puede ser **reversible** (P1) y **continua** (P2) y aun así ser mediocre: falla en ritmo (P3) o en composición (P4). Reglas provisionales, medidas con `integration/tools/auditoria_visual_escena.mjs` y `integration/tools/cortes_video.py` (detalle y hallazgos en `testing/AUD-001-auditoria-visual-de-escenas-por-scroll.md`):

| Síntoma de mediocridad | Regla (provisional) | Medida |
|---|---|---|
| Momento sin protagonista | visibilidad del protagonista ≥ 0,30 (escritorio) / 0,50 (móvil), o cobertura del lienzo ≥ 3 % si el protagonista son partículas | `pasos_sin_protagonista_claro` = 0 |
| Partículas invisibles | cobertura ≥ 3 % a mitad del puente | `lienzo_cobertura_min` |
| "Apagón" en el relevo | ningún valle de luminancia < 50 % de la de los extremos | luminancia por paso; relevo sin valle (SEQ-003) |
| Texto ilegible demasiado tiempo | ≤ 30 % del acto sin ninguna línea legible; meseta legible en el clímax | `pasos_sin_ninguna_linea_legible` |
| Cambio de escena artificial | ningún pico aislado > 0,30 de píxeles cambiados | `cortes_video.py` (descartar el artefacto del `scrollTo` inicial) |
| Reversible en datos pero no en imagen | diferencia visual bajando/subiendo ≤ 0,5 % | `reversibilidad_visual_max_pct` |
| Falta de profundidad | ≥ 3 planos con velocidades distintas o una oclusión real (DEPTH-001) | revisión de capas + curvas |
| Materiales o luz incoherentes | misma dirección de luz y altura de cámara en todos los recursos del acto | tabla de recursos (COMP-001) |
| Movimiento robótico | sin tramos lineales largos en el protagonista; continuidad de velocidad en las uniones | curvas (MOT-002) |
| Objeto pobre | recurso de forma vectorial o recorte sin sombra donde la escena exige realismo | revisión C1 con R1 |

Superar estas reglas **no** aprueba C3: solo descarta la mediocridad detectable automáticamente.

## Lote 26 · Lo que demostró la ejecución con GSAP real
- **C2 (movimiento) — ahora medible de extremo a extremo** con `integration/tools/validar_gsap.mjs`: equivalencia nativo/GSAP en 5 estados, pin, scrub numérico (curva temporal), reversibilidad, resize, reduced motion en caliente, desmontaje, rendimiento y 2–3 grabaciones por receta y viewport.
- **Separar siempre tres cifras de rendimiento:**
  1. **duración de script** (`ScriptDuration` de CDP y p95 de `actualizar()`);
  2. **coste de render** (estilo + layout frente a pintado, composición y GC);
  3. **fluidez** (intervalos rAF: p95 y número de fotogramas > 33 ms).
  - Ejemplo de por qué: C a 1 440 px tenía el script p95 ≤ 0,7 ms y aun así 30 fotogramas > 33 ms, por el pintado de filtros.
- **C1 y C3 siguen NO VERIFICADOS:** los recursos son procedurales. Las correcciones del lote 26 (sombra, volumen, legibilidad, partículas) **no son prueba de fotorrealismo** y la calidad creativa la decide el usuario.

## Lote 27 · C1 con recursos generados por IA
- **Antes de C1**, exigir el informe de `preparar_recursos.py` sin avisos:
  - tamaño, luz arriba-izquierda, elevación de 25–35° (plato) y halo |x| < 25 tras descontaminar;
  - la hoja de inspección revisada.
- **C1** se evalúa **estado a estado** frente a `integration/contratos/REC003_FIDELIDAD_CINCO_ESTADOS.md`: posición, tamaño, escala del titular, profundidad, revelado, secundarios, color y luz, relación entre estados.
- Los fixtures rotulados **nunca** cuentan para C1 ni C3.
