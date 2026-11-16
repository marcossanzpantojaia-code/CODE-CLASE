# CONSULTA_BIBLIOTECA — evidencia de uso de WEB_ENGINEERING_KNOWLEDGE_LIBRARY

## 1. Encargo
- Descripción breve: transformar WILDPAW (tienda demostrativa de mascotas) en una experiencia cinematográfica con fondo blanco, tipografía tipo iOS 16 y las seis imágenes de estudio aportadas (golden retriever ×3 poses, gato atigrado ×3 poses), con las transiciones como elemento diferencial y conservando tienda, filtros, carrito y accesibilidad.
- Perfil (A/B) y motivo: **B, cinematográfico** (historia con scroll fijado, protagonista fotográfico, transiciones entre poses).
- Versión de la biblioteca (`KNOWLEDGE_INDEX.md` → "Versión …"): **0.32.0 · Lotes 0–32 · 2026-11-04** (commit `67ac4f1`). Biblioteca en `/home/user/web_engineering_knowledge_library`, usada en **solo lectura**: no se ha modificado ningún archivo suyo.
- Stack y versiones instaladas: HTML + CSS + JavaScript clásico (sin build, abre con doble clic); GSAP 3.15.0, ScrollTrigger 3.15.0 y Flip 3.15.0 (copias locales en `js/vendor/`). **No se ha instalado ninguna dependencia nueva** en el proyecto. Pruebas con Playwright + Chromium ya presentes en el entorno.

**Calificación propia (EVAL-001):** C2 (movimiento) medido y superado en las pruebas del apartado 6. C1 (fidelidad a un storyboard) no aplica: no había storyboard previo. **C3 (calidad creativa) no está evaluado: solo puede puntuarlo una persona.** No se afirma equivalencia con la referencia Enky, que además es un vídeo de concepto (clase R3/R4), no una web real medible.

## 2. Necesidades → fichas
Rutas relativas a `/home/user/web_engineering_knowledge_library/`. Todas las fichas de esta tabla se leyeron completas.

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Cómo consultar la biblioteca | — | `integration/RETRIEVAL_PROCEDURE.md`, `skills/web-library-router/SKILL.md`, `skills/web-cinematic-site/SKILL.md`, `skills/web-qa-validation/SKILL.md` | — | — |
| Qué hace especial a la referencia | CASE-003 + informe del lote 20 | `architecture/CASE-003-referencia-enky-producto-heroe-cinematografico.md`, `evidence/visual/2026-10-27-lote20-enky/INFORME_AUDIOVISUAL_ENKY.md` | INVESTIGADO (vídeo inspeccionado) | — |
| Dirección de arte y lista contra lo genérico | ART-001 | `ux/ART-001-direccion-de-arte-producto-heroe.md` | INVESTIGADO | — |
| Composición, sombra de contacto, luz coherente | COMP-001 | `ux/COMP-001-composicion-e-iluminacion-de-producto-para-web.md` | INVESTIGADO | — |
| Gramática de escena: estados y mesetas | MOT-001 | `animations/MOT-001-gramatica-de-escena-por-scroll.md` | IMPLEMENTADO (mecánica) | GSAP 3.15 = 3.15.0 |
| Movimiento del protagonista, curvas, anticipación | MOT-002 | `animations/MOT-002-movimiento-de-producto-cinematografico.md` | INVESTIGADO | GSAP 3.15 |
| Cámara: zoom, 2,5D o 3D | CAM-003 | `threejs/CAM-003-camara-virtual-cinematografica.md` | INVESTIGADO / 2,5D probado | three r186 (no usado) |
| Edición de transiciones, relevo oculto | EDIT-001 + informe del lote 31 | `animations/EDIT-001-edicion-de-transiciones-de-motion-design-a-la-web.md`, `evidence/demos/2026-11-04-lote31/INFORME_LOTE31.md` | IMPLEMENTADO (mecánica, con fixtures) | GSAP 3.15.0 |
| Qué transformación admite cada tipo de recurso | TRN-001 | `transitions/TRN-001-matriz-transformaciones-de-producto.md` | INVESTIGADO | — |
| Límites de una imagen fija | AIIMG-001 | `frontend/AIIMG-001-integracion-de-imagenes-generadas-por-ia-en-escenas-2-5d.md` | IMPLEMENTADO (con fixtures) | — |
| Integración y acabado de recursos 2D | INTEG-001 | `frontend/INTEG-001-integracion-y-acabado-cinematografico-de-recursos-2d.md` | INVESTIGADO | — |
| Tipografía detrás y delante del objeto | DEPTH-001 | `animations/DEPTH-001-capas-sandwich-tipografia-objeto.md` | IMPLEMENTADO | — |
| Continuidad del objeto entre escenas | CONT-001 | `animations/CONT-001-continuidad-de-objeto-entre-escenas.md` | INVESTIGADO | — |
| Relevos entre imágenes sin "valle" | SEQ-003 | `animations/SEQ-003-interpolacion-y-relevos-entre-fotogramas.md` | IMPLEMENTADO | — |
| Motion blur en navegador | MBLUR-001 | `animations/MBLUR-001-motion-blur-por-acumulacion-analitica-en-canvas.md` | IMPLEMENTADO (mecánica) | Canvas 2D |
| GSAP real en escenas por scroll, defectos D1–D8 | GS-005 | `gsap/GS-005-de-motor-propio-a-gsap-real-en-escenas-por-scroll.md` | IMPLEMENTADO | GSAP 3.15.0 = proyecto |
| Pin, errores frecuentes, móvil | ST-002, ST-004, ST-006 | `scrolltrigger/ST-002-pinning.md`, `scrolltrigger/ST-004-errores-frecuentes.md`, `scrolltrigger/ST-006-normalizescroll-y-movil.md` | DOCUMENTADO | ScrollTrigger 3.15 |
| Criterios C1/C2/C3 | EVAL-001 | `testing/EVAL-001-criterios-fidelidad-visual-movimiento-calidad-creativa.md` | — | — |

Fichas citadas en el encargo y **no leídas** en esta sesión: ST-001 (no leída), LN-001 (no leída), informe del lote 32 (no leído; solo su resumen dentro de MBLUR-001), AIVID-001 (no leída), ASSET-001 (no leída).

## 3. Aplicación
| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| AIIMG-001 + TRN-001 | Con fotos fijas solo se usa lo que una foto aguanta: traslación, escala, profundidad y oclusión. Por eso toda la historia se mueve en el **eje de la cámara** (acercarse/alejarse) y ningún cambio de pose se hace por fundido ni por *morph*. | `js/scenes.js:1` (cabecera), `:53` (`layout`) | No | Sí |
| EDIT-001 estrategia C (relevo oculto por composición) | **Corte en el objetivo:** el perro crece hasta tapar el encuadre con su pelaje; con el velo al 100 % se cambia de pose y de plano. Mismo recurso para gato → agua. | `js/scenes.js:226`–`:248`, `:282` · `css/scenes.css:91` | No | Sí |
| EDIT-001 / CONT-001 | **Corte en la distancia:** el gato cambia de pose (de espaldas → saltando) cuando mide el 7 % del alto, en el instante en que su velocidad es cero. | `js/scenes.js:265` | No | Sí |
| SEQ-003 (relevo sin valle) | Desenfoque de proximidad en 3 capas (nítida, b1, b2): la capa inferior llega al 100 % antes de que la superior empiece a irse. Cobertura medida = 1,000. | `js/scenes.js:134`–`:144` | No | Sí |
| AIIMG-001 / INTEG-001 | Nada de `filter: blur()` ni `mix-blend-mode` sobre capas animadas: desenfoques, sombras e igualado de color **horneados** en los recursos (`assets/img/cast/*-b1`, `*-b2`, `*-shadow`). Se eliminó el cursor con `mix-blend-mode` de la versión anterior. | `css/scenes.css:1` (regla), `:87` · `css/base.css` (cursor) | No | Sí |
| COMP-001 / INTEG-001 | Sombra de contacto en capa propia para apoyar al animal; en el salto la sombra se queda en el suelo. Viñeta oscura cuando el cuerpo tapa la lente (entra menos luz). | `css/scenes.css:86`, `:104` · `js/scenes.js:277` | No | Sí |
| CAM-003 | Se evaluó Three.js y se descartó: el movimiento necesario es dolly/truck, que en 2,5D es más nítido y ligero. Dolly con paralaje real entre perro (cerca) y gato (lejos). | `js/scenes.js:250` | No | Sí |
| MOT-002 | Curva de escala **exponencial** para acercarse/alejarse (velocidad percibida constante), compartida por x, y y escala para que el recorrido sea una recta en perspectiva. | `js/scenes.js:110` (`depthEase`) | No | Sí |
| MOT-001 | Mesetas de lectura (héroe, puente, gato, océano) y un movimiento principal por tramo. | `js/scenes.js:199` (`buildMaster`) | No | Sí |
| DEPTH-001 + ART-001 | Palabra gigante **detrás** del animal (efecto de profundidad tipo pantalla de bloqueo de iOS 16); titular ≥ 9 vw; un protagonista por pantalla; catálogo después de la historia. | `index.html` (`.mega`), `css/scenes.css:56` | No | Sí |
| GS-005 / ST-004 | Estados iniciales con `gsap.set`; tramos encadenados con `fromTo` + `immediateRender: false`; valores por función + `invalidateOnRefresh`; un único pivote por actor; nunca se anima un elemento colocado con `translate` CSS. | `js/scenes.js:118`, `:217`, `:370` | No | Sí |
| ST-002 / ST-006 | Pin del escenario con `scrub: 1`; `ignoreMobileResize`; sin Lenis ni ScrollSmoother ni `normalizeScroll`. El tamaño del escenario se mide con una sonda `100svh` porque el elemento fijado conserva medidas antiguas durante el refresh (defecto encontrado en las pruebas). | `js/scenes.js:44` (`stageSize`), `:415` | No | Sí |
| MBLUR-001 | **No adoptada.** El desenfoque que se necesita aquí es de proximidad (foco), no de velocidad; el de velocidad por acumulación en canvas queda como mejora posible. | — | — | — |

### Estados medidos de cada transición (1440×900)
Origen → destino, protagonista, técnica y límite de cada una; debajo, los valores leídos del navegador.

| Transición | Origen → destino | Protagonista y dirección | Técnica | Relevo de recurso | Límite |
|---|---|---|---|---|---|
| A | Héroe → encuadre tapado | Perro, hacia la cámara | Escala exponencial + desenfoque horneado + velo de pelaje | nítida → b1 → b2, sin valle | Las patas no se mueven |
| B | Encuadre tapado → contraplano | Perro, alejándose; gato al fondo | Cambio de pose con el velo al 100 %; enfoque b2 → b1 → nítida | Oculto por el velo | Es un corte, no un giro real |
| C | Contraplano → meseta del gato | Cámara (dolly) | Paralaje: el perro (cerca) sale desenfocado, el gato (lejos) crece | Ninguno | — |
| D | Meseta del gato → océano | Gato: se aleja, se gira y salta | Cambio de pose a tamaño mínimo; salto en arco; velo; burbujas | Lejos y bajo el velo | El giro no se ve; el salto es una sola foto |

**A perro→objetivo**

| Scroll | t | Actores visibles (escala · opacidad nítida / b1 / b2 · sombra) | Velo perro | Velo gato | Océano |
|---|---|---|---|---|---|
| 0 % | 0.45 | perro de frente ×0.84 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 25 % | 0.824 | perro de frente ×1.38 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 50 % | 1.2 | perro de frente ×2.28 · 0.32 / 1.00 / 0.00 · 0.25 | 0 | 0 | 0 |
| 75 % | 1.575 | perro de frente ×3.76 · 0.00 / 0.00 / 1.00 · 0.00 | 0 | 0 | 0 |
| 100 % | 1.949 | perro de frente ×6.20 · 0.00 / 0.00 / 1.00 · 0.00 | 1 | 0 | 0 |

**B contraplano**

| Scroll | t | Actores visibles (escala · opacidad nítida / b1 / b2 · sombra) | Velo perro | Velo gato | Océano |
|---|---|---|---|---|---|
| 0 % | 1.949 | perro de frente ×6.20 · 0.00 / 0.00 / 1.00 · 0.00 | 1 | 0 | 0 |
| 25 % | 2.262 | perro de espaldas ×3.03 · 0.00 / 0.08 / 1.00 · 0.00; gato de espaldas ×0.12 · 1.00 / 0.00 / 0.00 · 1.00 | 0.029 | 0 | 0 |
| 50 % | 2.575 | perro de espaldas ×1.77 · 0.53 / 1.00 / 0.00 · 0.00; gato de espaldas ×0.12 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 75 % | 2.888 | perro de espaldas ×1.03 · 1.00 / 0.00 / 0.00 · 0.58; gato de espaldas ×0.12 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 100 % | 3.199 | perro de espaldas ×0.60 · 1.00 / 0.00 / 0.00 · 1.00; gato de espaldas ×0.12 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |

**C dolly al gato**

| Scroll | t | Actores visibles (escala · opacidad nítida / b1 / b2 · sombra) | Velo perro | Velo gato | Océano |
|---|---|---|---|---|---|
| 0 % | 3.75 | perro de espaldas ×0.60 · 1.00 / 0.00 / 0.00 · 1.00; gato de espaldas ×0.12 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 25 % | 4.075 | perro de espaldas ×0.65 · 0.54 / 1.00 / 0.00 · 0.25; gato de espaldas ×0.16 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 50 % | 4.4 | perro de espaldas ×1.01 · 0.00 / 0.00 / 1.00 · 0.00; gato de espaldas ×0.42 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 75 % | 4.725 | perro de espaldas ×1.99 · 0.00 / 0.00 / 1.00 · 0.00; gato de espaldas ×0.68 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 100 % | 5.049 | gato de espaldas ×0.72 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |

**D gato→salto→agua**

| Scroll | t | Actores visibles (escala · opacidad nítida / b1 / b2 · sombra) | Velo perro | Velo gato | Océano |
|---|---|---|---|---|---|
| 0 % | 6.65 | gato de espaldas ×0.72 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 25 % | 7.253 | gato de espaldas ×0.21 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 50 % | 7.856 | gato saltando ×0.20 · 1.00 / 0.00 / 0.00 · 1.00 | 0 | 0 | 0 |
| 75 % | 8.457 | gato saltando ×1.87 · 0.29 / 1.00 / 0.00 · 0.00 | 0 | 0.001 | 0 |
| 100 % | 9.06 | — | 0 | 0 | 1 |

Lectura: "×" es la altura del lienzo del actor respecto al alto de la ventana. El tiempo `t` es el de la línea de tiempo maestra (0 → 11,6).

## 4. Fichas consultadas y descartadas
| Ficha | Motivo |
|---|---|
| MBLUR-001 (acumulación en canvas) | Resuelve estela por velocidad; aquí el desenfoque es de foco y ya está horneado. Añadiría un canvas por actor sin mejora clara. |
| CAM-003, nivel "cámara 3D real" / Three.js | No hace falta órbita; añadiría una dependencia no autorizada. |
| TRN-001, *morph* y partículas entre imágenes incompatibles | Las poses no comparten cámara: un *morph* delataría el truco. Se usan cortes ocultos. |
| CASE-003, recursos de vídeo/secuencia | No se dispone de secuencias; se indica como material necesario para el siguiente salto de calidad. |

## 5. Verificaciones en documentación oficial
| Afirmación de la ficha marcada "verificar" | Fuente consultada | Resultado |
|---|---|---|
| — | — | No se hicieron verificaciones nuevas en documentación oficial en esta sesión: el comportamiento de GSAP/ScrollTrigger se comprobó directamente en el navegador (apartado 6). |

## 6. Pruebas
Todas ejecutadas en Chromium (Playwright), **sin GPU** (renderizado por software).

| Prueba (campo 14 / A11Y-005 / TEST-001) | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Estados 0/25/50/75/100 % de las 4 transiciones | Playwright (script propio) | Tabla de arriba | `capturas/transicion-*.jpg` |
| Escala monótona al acercarse | idem | Correcto | — |
| Relevo de desenfoque sin valle | idem | Cobertura mínima 1,000 (antes de corregirlo: 0,964) | — |
| Cortes ocultos (nunca dos poses a la vez; nunca gato + océano) | idem | Correcto | — |
| Reversibilidad (8 puntos, bajando y subiendo) | idem | Estados idénticos | Vídeo, tramo inverso |
| Scroll rápido (6 saltos extremo a extremo) | idem | El héroe vuelve a su estado exacto | — |
| Resize 1440→1024 a mitad de historia | idem | Desvío 0 px respecto a carga limpia (antes de corregirlo: 139 px) | — |
| 1440×900, 1280×800, 768×1024, 390×844, 320×700 | Playwright | 0 px de desbordamiento, sin errores de consola | `capturas/` |
| Tienda y carrito | Playwright | 15/15, repetido 4 veces seguidas | — |
| Filtros bajo estrés (cambios rápidos con animaciones en curso; 10 escenarios × 1440 y 390 px) | Playwright (script propio) | 20/20: sin tarjetas solapadas, sin transformaciones residuales, botones accesibles. Antes de corregirlo, dos tarjetas quedaban desplazadas y una tapaba el botón «Añadir» de otra. | — |
| Accesibilidad WCAG 2.2 A/AA | axe-core 4.10.2 | 0 violaciones en 7 puntos a 1440 y 390 px, y en modo reducido. Contrastes "por revisar a mano" (texto sobre fotos/degradados): revisados a ojo. | — |
| Teclado y foco | Playwright | Orden lógico; escenas fuera de cámara `inert`; Esc cierra menú y carrito | — |
| Movimiento reducido | Playwright | Sin pin, 0 animaciones en curso, secciones apiladas | — |
| Coste por tramo | rAF, 3 s por tramo | 390 px: 60 fps en todos. 1440 px: 44–60 fps; fotogramas > 33 ms: A 12/160, B 2/202, D 6/202, océano 15/166 | — |

No ejecutado: herramientas Python de la biblioteca (`preparar_recursos.py`, `cortes_video.py`, `composicion_captura.py`), porque necesitan OpenCV, que no está instalado y no se instaló sin permiso; su trabajo se replicó con numpy/Pillow. Las herramientas Node (`validar_gsap.mjs`, `medir_escena_scroll.mjs`…) esperan la plantilla de recetas de la biblioteca (`window.__motor`, `#acto`) y no son aplicables tal cual; se siguió su método con scripts propios. No se probó en Firefox, Safari ni en un móvil real.

## 7. Propuestas para la biblioteca (no aplicar desde el proyecto)
- Correcciones de fichas: SEQ-003/EDIT-001 podrían indicar los tiempos exactos del relevo de tres capas (la capa inferior debe completar su entrada antes de que empiece la salida de la superior; un solape del 40 % deja un valle medido del 3,6 %). ST-002/GS-005 podrían advertir que el elemento fijado conserva su ancho y alto anteriores durante `refreshInit`.
- Fichas que podrían pasar a IMPLEMENTADO/VALIDADO (con evidencia): ninguna sin revisión humana. Este proyecto aporta un caso real de "corte en el objetivo" con fotografías (EDIT-001 estrategia C), pendiente de valoración C3.
