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

Fichas citadas en el encargo y **no leídas** en esta sesión: ST-001 (no leída), LN-001 (no leída), informe del lote 32 (no leído; solo su resumen dentro de MBLUR-001), ASSET-001 (no leída). AIVID-001 se leyó en la segunda iteración (apartado 8).

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

## 8. Segunda iteración: animales que se mueven (marionetas fotográficas)

### 8.1 Encargo
"Métete en la biblioteca y hazme mejores animaciones con los animales, que tengan mejor movimiento y se vea más complicado". Partida: seis fotos fijas, que hasta ahora solo se acercaban, alejaban y cambiaban de pose con cortes ocultos.

### 8.2 Necesidades → fichas (leídas completas en esta iteración)
Rutas relativas a `/home/user/web_engineering_knowledge_library/`.

| Necesidad | Ficha | Ruta | Estado | Qué dice para este caso |
|---|---|---|---|---|
| Personaje que avanza con el scroll | MP-001 | `scrolltrigger/MP-001-personaje-por-camino-con-scroll.md` | INVESTIGADO | El personaje avanza ligado al scroll y cambia según la dirección (se gira al subir) |
| Muelles, amortiguación, oscilación | PHYS-001 | `animations/PHYS-001-fisica-para-animacion.md` | INVESTIGADO | Ley de Hooke, amortiguación y cálculo independiente de la frecuencia de la pantalla |
| Alternativas para dar movimiento a un protagonista | PROD-001 | `animations/PROD-001-movimiento-corto-de-producto-alternativas.md` | INVESTIGADO | Secuencia prerenderizada = máxima calidad; 2,5D = creíble con giros pequeños |
| Vídeo generado a partir de una foto | AIVID-001 | `frontend/AIVID-001-clips-image-to-video-encadenados-para-transiciones.md` | PROPUESTO | Para deformaciones o giros que una foto no puede dar hace falta un clip; generadores de pago, no autorizados |
| Foto con volumen sin modelo 3D | GL-003 | `threejs/GL-003-falso-3d-mapa-profundidad.md` | INVESTIGADO | Desplazamiento por profundidad: paralaje, no movimiento de extremidades |
| Distinguir movimiento correcto de movimiento convincente | AUD-001 | `testing/AUD-001-auditoria-visual-de-escenas-por-scroll.md` | IMPLEMENTADO | P1 (reversible) no basta; revisar siempre la hoja de estados a dos anchos |
| Motion blur | MBLUR-001 | `animations/MBLUR-001-motion-blur-por-acumulacion-analitica-en-canvas.md` | IMPLEMENTADO (mecánica) | Ya leída en la iteración 1 |
| Límites de una imagen fija | AIIMG-001 | `frontend/AIIMG-001-integracion-de-imagenes-generadas-por-ia-en-escenas-2-5d.md` | IMPLEMENTADO | Ya leída: una foto fija solo admite traslación, escala, profundidad y oclusión |

### 8.3 Lo que la biblioteca NO cubre y cómo se resolvió (adaptación propia)
Ninguna ficha describe cómo **deformar una foto con un esqueleto** (patas, cola, orejas). AIIMG-001 y AIVID-001 lo dan por imposible sin secuencia ni vídeo. Se implementó como **adaptación propia**, con la técnica de la herramienta "marioneta" de After Effects y de los programas de animación 2D por huesos [conocimiento general], y se validó con capturas a tamaño completo, no a ojo:

| Decisión | Por qué | Dónde |
|---|---|---|
| Malla fina recortada a la silueta (celdas de ~16 px) y esqueleto 2D por pose: cadera, rodilla, pata, cola de 3–4 huesos, cuello, orejas, lengua | Deformar sin inventar píxeles: cada punto de la foto se mueve con sus huesos | `tools/rig-def.json`, `tools/build-rigs.py` → `js/data/rigs.js` |
| Pesos por cápsulas que compiten entre partes hermanas; reparto suave en vistas de frente y de espaldas | Con frontera dura, las patas que se tocan se cortaban en seco (medido en capturas a 900 px) | `tools/build-rigs.py` |
| El borde semitransparente del pelo hereda los pesos de la parte opaca más cercana | Sin esto, el pelo del borde se quedaba quieto y se estiraba en dientes de sierra | ídem |
| Triángulos que cruzan huecos entre patas: fuera con la foto nítida, dentro con la desenfocada | Nítidos se estiran; desenfocados, su falta dejaba cuñas blancas | ídem y `js/rig.js` (`draw`) |
| Malla ampliada hasta el halo del desenfoque | El borde borroso se recortaba en escalera | ídem |
| Sombra suave para las marionetas | La sombra original tiene una mancha bajo cada pata que se quedaba en el suelo al levantarla | `assets/img/cast/*-shadow-soft.webp` |
| Ciclo de paso con apoyo lineal y vuelo suave; ángulo de cada pata calibrado para que todas barran la misma distancia; balanceo con pivote en el suelo | Que la pata apoyada no patine (medido: de 0,6–1,7 px a 0,03–0,3 px de deriva por paso de 1,5–3,3 px) | `js/rig.js` (`swing`, `calibrate`, `animate`) |
| Orejas, lengua y cola con muelles (PHYS-001) integrados a 120 Hz y empujados por la aceleración del cuerpo | Movimiento secundario: lo que hace que no parezca un recorte rígido | `js/rig.js` (`Spring`) |
| En "Juntos", la fase del paso sale de la distancia recorrida con el scroll; al subir caminan hacia atrás (MP-001) | Sin patinar y reversible | `js/duo.js` |
| En la historia, el paso se mezcla por tramos (trote en el héroe, galope al lanzarse, parada curiosa del gato) y se acelera con la velocidad del scroll | Ritmo y respuesta al usuario | `js/scenes.js` (`gait`) |
| WebGL con plan B en `file://`: si el navegador no deja leer las fotos locales, se cargan incrustadas (`js/data/cast-data.js`) | La web debe abrir con doble clic | `js/rig.js` (`loadCastData`) |
| El shader reproduce exactamente las tres capas nítida / b1 / b2 del DOM | La transición de desenfoque ya validada no cambia (cobertura 1,000) | `js/rig.js` (`FS`) |

### 8.4 Fichas consultadas y descartadas en esta iteración
| Ficha | Motivo |
|---|---|
| AIVID-001 (clips de vídeo generados) | Es la vía de máxima calidad para un ciclo real, pero exige un generador de pago no autorizado. Queda como siguiente paso, con la autorización del usuario. |
| PROD-001, alternativa a (secuencia prerenderizada en Blender) | No hay modelos 3D de estos animales; renderizar pelo realista queda fuera de alcance. |
| GL-003 (mapa de profundidad) | Da volumen, no movimiento de patas; ya se probó en una versión anterior ("fotos vivas") y se retiró. |
| MBLUR-001 | El desenfoque necesario es de foco y ya está en los recursos; la estela por velocidad no aporta en ciclos de paso lentos. |

### 8.5 Pruebas de esta iteración (Chromium sin GPU: WebGL por software)
| Prueba | Resultado |
|---|---|
| Las 6 marionetas se crean en `file://` (plan B) y por http | Sí, 6/6, sin errores de consola |
| Patinaje de la pata apoyada en "Juntos" (cálculo exacto) | Perro: 0,07–0,31 px por paso de 3,26 px; gato: 0,03–0,08 px por paso de 1,50 px |
| Hojas de ciclo a 900 px de alto (las 6 poses) | Sin dientes de sierra ni cuñas; queda un corte pequeño en una pata trasera del perro de espaldas al levantarla (ver pendientes) |
| Batería de movimiento de la iteración 1 | 9/9 (reversible, sin valles, cortes ocultos, scroll rápido, cambio de tamaño) |
| Carrito y filtros | 15/15 y 20/20 |
| Accesibilidad (axe-core, WCAG 2.2 A/AA) | 0 incidencias en 14 puntos (1440 y 390 px); el lienzo es decorativo (`aria-hidden`) y las fotos con su texto alternativo siguen en el DOM |
| Movimiento reducido | Sin marionetas ni animaciones: fotos estáticas |
| Rendimiento por tramo, 1440 px (modo ligero por software) | Héroe y mesetas 60 fps; transiciones 49–60 fps; "Juntos" 33–42 fps. A 390 px, 60 fps en "Juntos". El JavaScript de las marionetas cuesta ~0,2 ms por fotograma; el resto es el dibujo por software de este contenedor |
| Vídeo de estudio a 30 fps exactos (reloj fijo) | `capturas/estudio-movimiento-animales.mp4` |

**Calificación:** la mecánica (C2) está medida. Si el movimiento resulta natural o "de plastilina" es C3 y **lo decide el usuario** viendo el vídeo de estudio y la web.

## 9. Tercera iteración: directiva «Cinematic Animal Experience» (hito 1)

### 9.1 Encargo
Reconstruir la narrativa en seis escenas (The Arrival, The Connection, The Transition, The Energy, The Reveal, Final Composition), con movimiento animal plausible y transiciones de montaje profesional. Empezar por la escena protagonista y la primera transición.

### 9.2 Referencias externas realmente inspeccionadas
La red del entorno las bloqueaba; se creó, con aprobación del usuario, un entorno con solo esos dominios.

| Referencia | Qué se pudo ver | Principio extraído |
|---|---|---|
| Dogstudio (ficha de mesh3d.gallery) | Solo el texto de la ficha y los metadatos: perro 3D azul y violeta en la oscuridad, titular serif alto, hojas que derivan, luz de color que recorre el pelaje con scroll y cursor, WebGL con shaders propios, 7,8 MB. El vídeo de vista previa está en cdn.mesh3d.gallery (dominio no permitido): **no visto** | Un único animal protagonista, gigante, con la luz como elemento que reacciona al usuario |
| Archon (dev.viseni.com) | Texto técnico de la demo: 241 WebP en un canvas, ScrollTrigger con scrub, `end` proporcional al número de fotogramas, ajuste tipo *cover*, texto con parallax propio | Confirma SEQ-001/002 como vía para los clips IA |
| Little Guy (angelosgiovanis.com) | Código fuente leído (licencia no indicada: **no se copia**): 48 fotogramas reales de un giro de cabeza recorridos con el cursor, reflejados para el otro lado con una banda central de fundido, muelle (rigidez 90, amortiguación 19), respiración de 0,6 % y miradas sueltas cada 3–7 s | Mirada que sigue al cursor con muelle y miradas propias en reposo; con fotos fijas se aplica como inclinación, no como giro |
| Codrops, *scroll transitions WebGL* | **Inaccesible**: el sitio responde con un reto de Cloudflare (403) | — |
| Enky | Solo lo que ya estaba en la biblioteca (CASE-003, informe del lote 20). No se le atribuye ninguna técnica nueva | — |

### 9.3 Fichas leídas en esta iteración (además de las anteriores)
| Ficha | Ruta | Estado | Decisión |
|---|---|---|---|
| SEQ-001 | `/home/user/web_engineering_knowledge_library/animations/SEQ-001-secuencia-de-fotogramas-objeto-continuo.md` | INVESTIGADO | Formato de entrega de los clips IA (canvas + scrub, `clearRect`, DPR, fotograma clave estático con movimiento reducido) → `RECURSOS_IA.md` |
| SEQ-002 | `/home/user/web_engineering_knowledge_library/animations/SEQ-002-produccion-y-entrega-de-secuencias-prerenderizadas.md` | INVESTIGADO | Juegos por dispositivo, precarga direccional ±5 y presupuesto de memoria → `RECURSOS_IA.md` |

### 9.4 Decisión de tecnología (punto 4 de la directiva)
| Opción | Veredicto |
|---|---|
| A · Vídeo IA → secuencia de fotogramas | La única que da patas que giran, pelaje vivo y un giro real de cabeza. **No ejecutable**: herramientas de pago no autorizadas. Especificada clip a clip con prompts en `RECURSOS_IA.md` |
| B · Modelos 3D | Sin modelos de golden retriever y gato atigrado con pelaje realista a coste 0; el pelaje en tiempo real quedaría artificial (PROD-001). Descartada |
| C · 2,5D con las fotos + marioneta validada | **Elegida para el hito 1**: caminata sin patinar (medida), primer plano real para la mirada, saltos y cortes ocultos por oclusión. Lo que exige otro ángulo se resuelve con un corte de montaje, no con un giro fingido |

### 9.5 Aplicación (hito 1)
| Plano / transición | Técnica | Fichas | Dónde |
|---|---|---|---|
| 1 The Arrival | El gato entra andando desde fuera de cuadro; la fase del paso sale de la distancia recorrida; frena (`power2.out`) y se asienta; WILDPAW detrás con la cabeza solapando las letras | MP-001, PHYS-001, DEPTH-001, ART-001 | `js/scenes.js` (`intro`, `walkPhase`) |
| 1 → 2 corte en iris | Un círculo nace en la cabeza del plano general con una cara del mismo tamaño y crece siguiendo la cara del primer plano; empuje de cámara del 7 % en el plano general (CAM-003, ≤ 8 %) | EDIT-001 (corte motivado), CAM-003, MOT-002 | `js/scenes.js` (`applyIris`) |
| 2 The Connection | Primer plano real de frente; cabeza que se inclina hacia el cursor ±2,8° con muelle y miradas propias si el ratón se queda quieto; la palabra CURIOUS detrás de las orejas; niebla del color del fondo que corta por el pecho | PHYS-001, DEPTH-001, Little Guy (principio) | `js/rig.js` (mirada), `css/scenes.css` |
| 2 → 3 → 4 salto y oclusión | El gato salta al objetivo (estira las patas, orejas atrás), relevo de desenfoque sin valle, su pelaje tapa el encuadre; corte oculto; el pelaje sale hacia abajo, en la dirección del salto (raccord de movimiento) | EDIT-001 estrategia C, SEQ-003, INTEG-001 | `js/scenes.js`, `css/scenes.css` (`.wash--cat`) |
| 4 The Energy | El perro llega galopando desde el fondo con curva de escala exponencial; luz dorada propia del plano | MOT-002, ART-001 (un color por acto) | `js/scenes.js` |
| 6 → 7 The Deep | El gato se aleja y el agua sube con su ola (revelado con máscara direccional) en lugar de repetir el salto | TRN-001, MASK-002 (no leída) | `js/scenes.js`, `index.html` |
| Rótulo de plano | Número, nombre del plano, barra de progreso y código de tiempo | ART-001 (interfaz mínima) | `.hud` |

### 9.6 Pruebas del hito 1 (Chromium sin GPU)
| Prueba | Resultado |
|---|---|
| Estados 0/25/50/75/100 % de 7 transiciones | Tablas en la salida de la batería; láminas en `capturas/hito1-*.jpg` |
| Relevos de desenfoque (gato que salta, perro que se acerca) | Cobertura mínima 1,000 |
| Cortes 3→4 y 4→5 | Nunca conviven las dos fotos; el cambio ocurre con el pelaje al 100 % |
| Reversibilidad (9 puntos), scroll rápido, resize 1440→1024 | Correcto (diferencias del iris ≤ 0,3 px, redondeadas) |
| Zancada de entrada del gato | La pata apoyada se mueve 0,04–0,13 px por paso de 2,44 px |
| Mirada | Cursor a la izquierda: −2,9°; a la derecha: +2,7°; con el ratón quieto vuelve sola |
| Carrito / filtros / accesibilidad (16 puntos) / movimiento reducido / 5 tamaños | 15/15 (×2) / 20/20 / 0 incidencias / sin animaciones / sin desbordes |
| Rendimiento, 390 px | 59–60 fps en todos los tramos |
| Rendimiento, 1440 px (WebGL por software, modo ligero) | 45 fps iris, 60 primer plano, 44 salto, 52–60 perro y contraplano, 49–52 agua y océano |

**C3 no está evaluado:** corresponde al usuario.

## 10. Hito 2: escenas 5 (The Reveal) y 6 (Final Composition)

### 10.1 Encargo
Escena 5: «El perro gira y continúa su recorrido. Aprovecha su movimiento para revelar una sección nueva de la web. La tipografía, los elementos de interfaz y el fondo deben estar coreografiados con la animación. No quiero elementos entrando aleatoriamente.» Escena 6: «Un cierre visual sofisticado con ambos animales […] que conecte con el propósito de la web y ofrezca una navegación clara. No inventes mensajes comerciales, productos o servicios que no existan en el proyecto.»

### 10.2 Fichas aplicadas (biblioteca v0.32.0, solo lectura)
| Ficha | Ruta | Qué se tomó |
|---|---|---|
| EDIT-001 regla 2 | `animations/EDIT-001-edicion-de-transiciones-de-motion-design-a-la-web.md` | «Un elemento guía marca el tempo; los demás copian su easing»: el perro es el elemento guía del plano 5. Su avance en profundidad, la fase de su paso y el borde de la sección usan la misma curva (`outE`), y las entradas cuelgan de sus pisadas |
| EDIT-001 reglas 6 y 8 | ídem | Secundarios que no arrancan ni paran a la vez (cada elemento en una pisada distinta) y efecto desfasado de la cámara (al adelantarlo, el texto, más cerca, se va antes que el panel) |
| MOT-001 | `animations/MOT-001-gramatica-de-escena-por-scroll.md` | Estados 0/25/50/75/100 % de cada tramo nuevo y meseta de lectura (8,6–9,8) con la sección interactiva |
| DEPTH-001 | `animations/DEPTH-001-capas-sandwich-tipografia-objeto.md` | En el cierre, la tipografía gigante va detrás de los dos animales (sándwich), como WILDPAW en la llegada |
| TXT-001 / TXT-002 (variante B) | `animations/TXT-001-splittext.md`, `animations/TXT-002-revelado-texto-scroll-y-mascara.md` | Letras que salen de su máscara; se usa 130 % en lugar de 110 % porque con 110 % el punto de la «i» asomaba 2 px por el borde (medido) |
| ART-001 | `ux/ART-001-direccion-de-arte-producto-heroe.md` | «El catálogo va después de la historia» y un color por acto: la sección del perro usa el mismo papel cálido de su plano; el cierre vuelve al papel de la llegada |
| CONT-001 | `animations/CONT-001-continuidad-de-objeto-entre-escenas.md` | Los mismos dos protagonistas cierran la historia; nada de animales nuevos |
| ST-002 | `scrolltrigger/ST-002-pinning.md` | El plano 5 vive dentro del pin maestro. En el cierre se probó un pin propio y dejaba un plano vacío de una pantalla; se cambió a un encuadre `position: sticky` con la línea de tiempo desde «top bottom», así los animales entran mientras el encuadre sube (decisión propia, ver 10.4) |
| EVAL-001 | `testing/EVAL-001-criterios-fidelidad-visual-movimiento-calidad-creativa.md` | C1 y C2 con pruebas medidas; **C3 queda para el usuario** |

Referencias externas: no se inspeccionó ninguna nueva en este hito. El principio de Dogstudio (luz que acompaña al animal, §9.2) se aplica como una luz cálida que sigue al perro en el plano 5; no se le atribuye ninguna técnica concreta.

### 10.3 Aplicación
| Plano | Técnica | Dónde |
|---|---|---|
| 5 · el giro | Contraplano del perro de espaldas tras el corte oculto bajo su pelaje (hito 1) | `js/scenes.js` |
| 5 · sección revelada | Panel cálido por debajo del perro cuyo borde es su flanco (`screenPoint` en cada fotograma); el panel parece salir de detrás de su cuerpo. En vertical el borde es su lomo (horizontal). Al pararse, el borde se queda | `applyReveal`, `.reveal` |
| 5 · pisadas | La fase de la marcha la marca el scroll (`stepP`), con la misma curva que su avance: las patas traseras apoyan en las fases .2 y .7 y en esos instantes exactos salen el rótulo «Perros», «Keep», «up.», los tres productos de perro del catálogo y el enlace «Ver todo para perros» (fórmula `footfall(k)`) | `footfall`, `revealSteps` |
| 5 · fondo | Luz cálida que acompaña al perro y escala con él | `.dog__spot` |
| 6 · la cámara lo adelanta | El perro sale por la derecha y la sección por la izquierda con la misma curva (`power2.in`); el texto va un 10 % más rápido y se apaga antes (en móvil no cruza la barra) | `js/scenes.js` |
| Cierre · entrada | Encuadre pegado; los dos recorren la misma distancia y van a la par; paso ligado a la distancia; frenan y vuelven a la postura de la foto | `js/duo.js` |
| Cierre · letras | Cada letra sube cuando el hocico que va delante pasa por ella (posición, no reloj); al pararse terminan las que queden | `step()` |
| Cierre · navegación | La raya de cada enlace se dibuja hacia donde andaban; recuentos reales del catálogo (3 · 3 · 3 · 9); al señalar «Perros» o «Gatos» el otro animal se atenúa; abre la tienda filtrada | `.duo__nav`, `js/shop.js` |

Contenido: no se añadió ningún producto, servicio ni mensaje comercial. Textos nuevos: «Ver todo para perros», «Toda la tienda» y los recuentos, que describen categorías y productos que ya existían.

### 10.4 Lo que se corrigió tras verlo
| Problema observado | Corrección |
|---|---|
| Las letras del cierre se adelantaban demasiado a los animales | Adelanto de 14 % → 5 % del ancho |
| La cabeza del perro tapaba «Every day.» (escritorio y tableta) | Animales más bajos y tamaño limitado por la altura |
| Flecha de «Toda la tienda» partía la línea | Flecha fuera del flujo |
| En móvil, las tarjetas subían por debajo del logotipo al irse | El texto se apaga al empezar la salida |
| Tras redimensionar, la distancia de entrada del cierre era la del tamaño anterior | Se mide en `refreshInit`, antes de que GSAP relea los valores |
| Enlaces del cierre enfocables sin nombre antes de aparecer (axe: `link-name`) | Ocultos (`visibility`) hasta que se dibujan |
| Plano vacío de una pantalla al entrar el cierre | Encuadre `sticky`: entran mientras sube |
| El punto de la «i» asomaba por la máscara | 130 % |

### 10.5 Pruebas del hito 2 (Chromium sin GPU)
| Prueba | Resultado |
|---|---|
| Batería de movimiento (27 comprobaciones) por http y por `file://` | 27/27 en las dos |
| Borde de la sección frente al flanco del perro (28 muestras) | 0 px de diferencia; solo avanza |
| Fase del paso frente al avance en profundidad | Error máximo 0,0000 |
| Elemento ↔ pisada (7) | Fases 1,220 · 1,715 · 2,214 · 2,715 · 3,211 · 3,708 · 4,200 (todas a ≤ 0,02 de .2/.7) |
| Reversibilidad (12 puntos, incluidos 7,6 · 8,3 · 9,3 · 10,4), scroll rápido, resize 1440→1024 en t = 7,8 y 9,3 | Idénticos a una carga limpia |
| Cierre: inicio, mitad, final, reversibilidad, pata apoyada, foco del animal, enlace «Gatos» | Correcto; pata 0,06–0,24 px por paso de 1,1–2,5 px |
| Carrito / filtros / axe (9 puntos × 2 tamaños + movimiento reducido) / teclado / 5 tamaños | 15/15 / 20/20 / 0 incidencias / Tab entra en los productos del perro y en la navegación; Enter filtra / sin desbordes |
| Rendimiento, 390 px | 60 fps en todos los tramos nuevos |
| Rendimiento, 1440 px (software, modo ligero) | Plano 5: 56 fps; meseta: 60; cámara y encuentro: 55; agua: 53; cierre: 38–49 (antes 34–39) |

Defectos pendientes: borde escalonado en el halo del perro de espaldas mientras está muy desenfocado (ya existía); las patas se doblan, no giran; el perro no gira de verdad (el giro es un corte a otra foto). **C3 no está evaluado: corresponde al usuario.**

