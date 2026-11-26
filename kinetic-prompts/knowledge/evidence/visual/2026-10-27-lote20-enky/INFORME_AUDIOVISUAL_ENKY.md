# Informe audiovisual — referencia "Enky" (grabación de reels de @enkywebstudio) · lote 20 · 2026-10-27

> **Estado de evidencia: `VIDEO_INSPECCIONADO`.** Es el primer vídeo que se inspecciona en esta biblioteca. Lo aportó el usuario; no es de YouTube. Se inspeccionó **fotograma a fotograma**: hojas de contacto a 2 fps de los 51 s, detalles ampliados a 3–16 fps y mediciones con OpenCV.
>
> El audio **no** se analizó (no hay herramienta de transcripción). El MP4 no se incluye en la biblioteca: solo su huella y fotogramas reducidos para estudio.
>
> Leyenda: **[OBS]** observado en fotogramas · **[MED]** medido · **[INF]** inferido · **[DOC]** documentado en fuente oficial · **[VAL]** validado (nada lo está).

## 0. El archivo y qué es realmente
| Dato | Valor |
|---|---|
| Archivo | `ENKY_referencia_para_Cowork.mp4`, sha256 `ce630506…2378d0` (`enky.sha256`) |
| Formato | H.264 360 × 780, 24 fps, 1 225 fotogramas, 51,04 s; pista AAC (no analizada) |
| Contenido [OBS] | **Grabación de la pantalla de un móvil** navegando por Instagram. No es un vídeo editado por el estudio, sino varios **reels** de la cuenta `enkywebstudio` ("Enkis Web Studio", "Hong Kong Based", "Interactive 3D Websites", 142 publicaciones, 27,4 mil seguidores a la fecha de la grabación) y una visita a su perfil |
| **Etiqueta de Instagram [OBS]** | Todos los reels muestran **"Contenido generado con IA"** bajo el nombre de la cuenta (`detalle/etiquetas.jpg`, a 5, 20, 30, 40 y 46 s) |
| Web del estudio [DOC: lectura de enkiswebstudio.com, 2026-10-27] | Ofrece "premium websites, immersive experiences, and AI-powered digital systems". **No** nombra GSAP, Three.js ni WebGL, ni enlaza a los proyectos POUR/PLAY, CREMA, ROSSO o AMBRA |

### Conclusión de partida (importante)
Hay **tres capas de montaje** entre nosotros y una posible web real:
1. la grabación de la pantalla del móvil;
2. el reel de Instagram: maqueta de un portátil sobre una mesa, título impreso en la pared, bucle;
3. el contenido de la pantalla del portátil.

Además, Instagram marca los reels como **generados con IA**, y el contenido de la pantalla tiene señales típicas de imagen generada:
- erratas estables: "LOVE AT **AT** FIRST TWIRL.", "**Frech** from the sea", "Your Table is **viting**";
- párrafos de pseudotexto ilegible (`detalle/texto_46.80.jpg`);
- rótulos de sección incoherentes ("Section 02 — THE EXTRACTION" y "Section 03" para la misma escena).

→ **No se puede afirmar que exista una web funcionando detrás de ninguno de los reels.** Lo que se ve en la pantalla puede ser un vídeo de concepto generado. En este informe, "**movimiento de la página**" significa "movimiento **dentro** de la pantalla del portátil, que *simula* una página", no una animación web comprobada.

## 1. Mapa temporal (cortes medidos con `select=scene` de ffmpeg y desplazamiento del teclado con OpenCV)
| Tramo | Contenido | Tipo |
|---|---|---|
| 0,00–1,60 | Centro de control del móvil e historial de reels | Grabación (no es referencia) |
| 1,60–2,25 | Fundido desde negro del reel 1 | Carga del reel |
| **2,25–12,40** | **R1 · POUR/PLAY** (café de especialidad, fondo claro). Bucle a los 12,05→12,25 s | Reel |
| 12,40–14,40 | Perfil de la cuenta | Grabación |
| **14,50–24,90** | **R2 · CREMA "The Golden Extraction"** (espresso, fondo oscuro). Bucle a los 23,6 s | Reel |
| 24,90–26,50 | R1 de nuevo, con otro encuadre del portátil | Reel |
| 26,55–27,70 | **R3 · café "Premium Coffee"**, variante de "Wake the beans" | Reel (fragmento) |
| **27,80–36,60** | **R4 · ROSSO** (restaurante de pasta). Bucle a los 36,1→36,3 s | Reel |
| **37,05–42,95** | **R5 · AMBRA "The Golden Drop"** (café y miel o caramelo) | Reel |
| **43,05–51,04** | **R6 · "Gold in every drop" oscuro** (otra variante de CREMA) | Reel |

Medida de la "cámara" del reel [MED] (`analisis/movimiento.json`): el desplazamiento de la zona del teclado es **< 0,15 px/fotograma dentro de cada reel**, así que el portátil y la cámara están **quietos**. Los picos de 8–30 px/f coinciden con los deslizamientos de Instagram entre reels (12,5; 24,5; 26,5; 27,5; 37,0; 43,0 s). **No hay movimiento de cámara del reel**: todo el movimiento está en la pantalla.

## 2. Análisis por "página" (los 10 puntos)
Tamaño en el vídeo: la pantalla del portátil mide ~300 × 190 px. Los textos pequeños y la navegación son ilegibles o casi.

### R1 · POUR/PLAY — `hojas/vista_0s.jpg`, `detalle/r1a–r1d.jpg`, `det_morph.jpg`
1. **Composición [OBS].** Cabecera fina fija (logo "POUR / PLAY", 3–4 enlaces, botón con borde). El héroe es asimétrico: titular a la izquierda y objeto protagonista en el centro-derecha, **solapando el titular**. Flechas ‹ › en los laterales y puntos de progreso abajo al centro. Mucho aire.
2. **Tipografía [OBS].**
   - Display muy pesada, condensada y con carácter: la "E" tiene forma de épsilon ("WAKƐ THƐ BƐANS"). A los 6 s pasa a otra display de carácter en rojo óxido con un trazo curvo decorativo: "LET IT BLOOM".
   - **Texto fantasma gigante** en beige claro detrás del objeto ("DECAF / OKIF…", recortado).
   - Microetiqueta en versalitas: "SECTION 1 — WAKE THE BEANS".
   - Jerarquía de tres niveles: etiqueta → titular gigante → botón píldora negro "READ NOW".
3. **Elementos protagonistas [OBS].** Granos de café fotorrealistas sobre un anillo de molienda en espiral; después un gotero de vidrio, una taza de cerámica roja con filtro, una jarra de vidrio, cintas de café y leche, y un latte art.
4. **Iluminación y profundidad [OBS].** Luz de estudio suave lateral, sombras de contacto bajo los objetos y reflejos en el vidrio. Los objetos parecen fotografía o render, no ilustración.
5. **Capas [OBS].** Fondo liso → texto fantasma → titular → objeto (encima del titular) → partículas de molienda delante → interfaz fija encima de todo.
6. **Entradas y salidas [OBS].**
   - 3,15–3,40 s: aparece un gotero de vidrio sobre los granos (~0,25 s) y de él cae café.
   - 3,5–4,5 s: el chorro **continúa hacia abajo mientras el contenido sube** y entra en la taza de la sección 2: **objeto continuo entre secciones**.
   - 6,0 s: la taza sube y aparece debajo una jarra que se llena; 7,0–7,5 s: la jarra se inclina y vierte.
   - 10,6–11,6 s: cinco etiquetas ("ROAST", "ORIGIN", "FLAVOR"…) entran de una en una y **orbitan** en elipse alrededor de la taza, sobre un anillo tenue. Algunas tapan el titular.
   - 11,0 s: aparecen el subtítulo y el botón "FIND YOUR CUP".
7. **Transformaciones [OBS].**
   - Cambio de forma (granos → gotero → chorro → taza);
   - rotación de la jarra;
   - cintas en hélice (8,5–9,5 s);
   - etiquetas que giran en su órbita con escala variable.
   - El titular "MAKE TIME TASTE BETTER" aparece por líneas (8,75 s "MAKE TIME" → 9,5 s completo).
8. **Transiciones de sección [OBS].** El paso a la sección 3 ocurre a los 8,0–8,5 s: una franja crema con "SECTION 3 — SIP THE UNEXPECTED" y una flecha sube, y debajo **cambia el color de fondo** a caramelo, mientras el chorro sigue sin cortarse.
   - **[MED]** El contenido sube **a impulsos**. Las velocidades medidas en el vídeo (px por fotograma, signo negativo = sube) son `-16, -11, -12, -22, -9, -8, -12, -4, -4, -6, -2…`: cada impulso **decelera de forma exponencial en ~1–1,5 s**, unas 5 veces entre 3,3 y 9,5 s.
   - Hay además un patrón periódico de 1 de cada 4 fotogramas sin desplazamiento, que podría venir de una conversión de cadencia en el montaje (no concluyente).
9. **Interacciones posibles [INF].** Scroll vertical con inercia; flechas laterales y puntos que sugieren navegación por secciones. **No se ve cursor ni ninguna interacción.**
10. **Técnicas para reproducirlo [INF].**
    - Una **secuencia de fotogramas en `<canvas>` fijada (*pin*) y controlada por el scroll** como capa del objeto (SEQ-001), con textos HTML encima o debajo (DEPTH-001).
    - Inercia tipo Lenis o del propio trackpad: **indistinguibles** en esta grabación.
    - Etiquetas en órbita con GSAP sobre una elipse (`x = rx·cos θ`, `y = ry·sin θ`, escala y `z-index` según `sin θ`).
    - Revelado por líneas con SplitText (TXT-001).
    - Cambio de color de fondo con `scrub`.

### R2 · CREMA "The Golden Extraction" — `detalle/r2a–r2c.jpg`, `det_disolucion.jpg`, `r2t.jpg`
1. **Composición [OBS].** Fondo casi negro marrón. Titular partido **a los dos lados de una gota de vidrio central** ("GOLD IN / EVERY" a la izquierda, "GOLD IN / DROP" a la derecha; texto repetido o incoherente). Palabra gigante "CREMA" fantasma arriba. Botón píldora pequeño.
2. **Tipografía [OBS].** Serif de alto contraste, condensada, en crema cálido. Microetiqueta "Section 01 — THE DROP".
3. **Protagonistas [OBS].** Gota con espresso y crema dentro; portafiltro con nube de café molido; máquina vertiendo en una taza negra; granos desenfocados en primer plano.
4. **Luz [OBS].** Luz cálida de contra y lateral, brillos especulares en el metal y el vidrio, desenfoque de profundidad en los granos delanteros.
5. **Capas [OBS].** Fondo → "CREMA" gigante → titular → gota encima del titular → granos desenfocados delante.
6. **Entradas y salidas [OBS].**
   - 14,7–17,0 s: la gota **respira** (oscilación lenta en reposo).
   - 17,1–17,7 s: la gota **estalla en partículas** que forman una espiral alrededor del portafiltro ("THE EXTRACTION").
   - 19,33–19,83 s: **disolución cruzada de ~0,5 s** entre "THE EXTRACTION" y "THE REWARD": los dos titulares se ven a la vez y el nuevo sube unos px.
   - 20,5–23,5 s: vertido continuo en la taza.
7. **Transformaciones [OBS].** Gota → partículas → máquina (cambio de escena por partículas); espiral de partículas girando.
8. **Transiciones [OBS/MED].** **No hay scroll vertical** entre secciones: posiciones fijas, con desplazamiento medido de ~0 durante 15–17 s y una deriva lenta de −0,4 a −0,6 px/f durante 20,5–23,5 s. Las secciones cambian por **fundido o transformación en el mismo encuadre**, como diapositivas. Hay una flecha "‹" a la izquierda.
9. **Interacciones [INF].** Navegación por secciones a pantalla completa (gesto o rueda → siguiente escena), compatible con OBS-001. No se ve ningún gesto.
10. **Técnicas [INF].**
    - Escenas a pantalla completa con GSAP Observer (OBS-001) y una **transición por vídeo o secuencia** entre escenas (SEQ-001).
    - Fundido cruzado del texto con un *timeline* (`autoAlpha` + `y`).
    - Alternativa 3D: partículas en Three.js (TJ-*, SCN-002), pero no hay ninguna evidencia de 3D en tiempo real.
    - **El título "CREMA A / The Golden Extraction" está impreso en la pared del reel** (montaje, `r2t.jpg`), no en la web.

### R3 · café "Premium Coffee" (26,55–27,70 s, fragmento) — `detalle/r3.jpg`
Estructura igual a R1: titular "WAKE THE BEANS" en marrón, grano grande y prensa francesa que se forma sobre él (27,05–27,55 s), y una flecha dibujada a mano. Demasiado corto para analizar el movimiento.

### R4 · ROSSO — `detalle/r4a–r4c.jpg`, `texto_28.05.jpg`, `texto_36.30.jpg`
1. **Composición [OBS].** Pantalla partida: texto sobre crema a la izquierda y panel **rojo granate** a la derecha con un tenedor enrollando espaguetis con gambas. Puntos de progreso verticales a la derecha y botón redondo de chat abajo a la derecha.
2. **Tipografía [OBS].** Serif editorial clásica en mayúsculas ("LOVE AT AT FIRST TWIRL."), subtítulo en cursiva ("Frech from the sea. Straight to your heart."), botón píldora granate "EXPLORE THE MENU" con flecha circular aparte.
3. **Protagonistas [OBS].** Pasta enrollada en el tenedor; ingredientes (tomates cherry, mejillones, gambas, albahaca); plato final.
4. **Luz [OBS].** Luz de estudio cálida; salsa con brillo; sombras suaves en el plato.
5. **Capas [OBS].** Fondo crema → panel rojo → texto → objeto que sobresale del panel y pasa sobre el texto (30,5–32,5 s) → etiquetas pequeñas de ingredientes.
6. **Entradas y salidas [OBS].**
   - 29,0–30,0 s: el panel rojo **sale por arriba** con el scroll y la pasta **se queda en su sitio**: el objeto está fijado mientras el texto sube.
   - 31,0–32,5 s: los ingredientes **salen disparados** y orbitan alrededor de una hélice de pasta, con etiquetas.
   - 33,0–34,3 s: la pasta **baja y se posa** en un plato que entra desde abajo.
   - 35,05–35,3 s: aparece el botón "RESERVE A TABLE" y el rótulo "SECTION 03".
7. **Transformaciones [OBS].** Tenedor → hélice de pasta → explosión de ingredientes → plato servido.
8. **Transiciones [MED].** Scroll a **velocidad casi constante** (−4 a −6 px/f, sin impulsos marcados, 28,9–30,6 s). Después, durante 31–32 s, el objeto cambia sin que el texto se mueva (+0,6 a +0,9 px/f, correlación baja): fase de "pin" en la que solo cambia el objeto. Luego vuelve a subir y el plato entra con +9 a +19 px/f (contenido que baja). Bucle a los 36,1 s.
9. **Interacciones [INF].** Scroll; botón de reserva; chat. No se ve ninguna interacción.
10. **Técnicas [INF].** Pin de toda la escena con la secuencia del objeto controlada por el scroll (SEQ-001 + ST-002); textos de sección que entran y salen dentro del pin; panel de color que sale con `yPercent`/`clip-path` (CLIP-001); botón con `scale` + `autoAlpha` al final.

### R5 · AMBRA "The Golden Drop" — `detalle/r5a–r5b.jpg`
1. **Composición [OBS].** Tres bandas verticales (ocre, crema y madera oscura) con una gota de miel o ámbar en el centro y una taza de vidrio debajo. Titular "A MOMENT WORTH SAVOURING" encima de la taza.
2. **Tipografía [OBS].** Serif fina en crema y microetiqueta "Section 01 — THE GOLDEN DROP".
3. **Protagonistas [OBS].** Gota de ámbar con burbujas, cinta de caramelo en hélice, granos en vuelo y taza de vidrio.
4. **Luz [OBS].** Luz dorada lateral fuerte, translucidez en la gota (dispersión) y sombras de ventana en el fondo.
5. **Capas [OBS].** Bandas → texto → gota → granos delante.
6. **Entradas y salidas [OBS].**
   - 37,3–39,5 s: la gota se balancea en reposo.
   - 39,8–40,6 s: la gota **se estira en una cinta** y el contenido sube (−5 a −7 px/f); aparece el panel "Section 02 — THE TRANSFORMATION" con forma redondeada.
   - 41–42,3 s: la cinta forma una hélice con los granos alrededor.
   - 42,5–42,9 s: entra desde abajo un panel oscuro con "THE PERFECT POUR".
7. **Transformaciones [OBS].** Gota → cinta → hélice → vertido.
8. **Transiciones [OBS].** Paneles que suben y cubren el anterior, de esquinas redondeadas (similar a CARD-001), con el objeto continuo por encima.
9. **Interacciones [INF].** Scroll.
10. **Técnicas [INF].** Paneles apilados con *sticky* o pin (CARD-001); objeto continuo en una capa fija con una secuencia (SEQ-001).

### R6 · "Gold in every drop" oscuro — `detalle/r6a–r6b.jpg`, `texto_49.25.jpg`
Variante de R2 con otro encuadre:
- **Tipografía y capas [OBS].** Titular serif enorme "GOLD IN EVERY DROP." que **cruza** la gota; olas de caramelo a la derecha.
- **Transición a "THE EXTRACTION" [OBS].** Ocurre a los 45,5–46,5 s: la gota se dispersa en partículas y el titular nuevo queda **detrás del portafiltro** (texto entre el fondo y el objeto).
- **Paso a "THE REWARD" [OBS].** Ocurre a los 47,1–48,5 s: entra desde abajo una franja crema con el rótulo, y el **chorro de café pasa por delante de las letras** de "THE REWARD".
- **Medición [MED].** Desplazamientos de −3 a −4 px/f en las transiciones y ~−1 a −2 px/f de deriva en "THE REWARD".

## 3. Técnicas visuales realmente identificadas (patrones repetidos en ≥ 3 reels)
| # | Patrón | Reels | Evidencia |
|---|---|---|---|
| P1 | **Un único objeto protagonista fotorrealista** por sección, sobre fondo liso | todos | [OBS] |
| P2 | **El objeto se transforma** de una sección a la siguiente (granos → gotero → taza; gota → partículas → máquina; tenedor → plato) en lugar de cortar | R1, R2, R4, R5, R6 | [OBS] |
| P3 | **Texto en sándwich**: titular gigante detrás del objeto, o el objeto pasando por delante de las letras | R1, R2, R4, R6 | [OBS] |
| P4 | **Palabra fantasma gigante** de bajo contraste en el fondo | R1, R2 | [OBS] |
| P5 | Narrativa en **3 actos rotulados** ("Section 01 — …", "02", "03") con un microrrótulo en versalitas | todos | [OBS] |
| P6 | **Paleta monocroma cálida por marca** (crema/café, negro/oro, crema/granate, ocre/ámbar), sin colores ajenos | todos | [OBS] |
| P7 | Botón **píldora** pequeño, y discreto, al final de cada acto | todos | [OBS] |
| P8 | **Elementos satélite** que orbitan el objeto (etiquetas, ingredientes, partículas, granos) | R1, R2, R4, R5 | [OBS] |
| P9 | Cambio de sección por **panel que sube**, **cambio de color de fondo** o **disolución de ~0,5 s** | R1, R2, R5, R6 | [OBS/MED] |
| P10 | Movimiento "líquido" continuo (chorros, cintas, hélices) que **une** secciones | R1, R2, R5, R6 | [OBS] |
| P11 | Cabecera mínima fija, mucho espacio negativo y navegación por puntos | todos | [OBS] |

## 4. Montaje del reel frente a movimiento "de la página"
| Elemento | Pertenece a |
|---|---|
| Portátil sobre la mesa, luz de ventana, título impreso en la pared ("CREMA A…") | **Montaje del reel** |
| Bucles (vuelta al inicio a los 12,05, 23,6 y 36,1 s) | **Montaje del reel** |
| Deslizamientos entre reels y perfil | **Grabación del móvil** |
| Cámara del reel | Quieta [MED] |
| Scroll, objetos, textos y transiciones dentro de la pantalla | "Página" **simulada**: podría ser una web real grabada o un vídeo generado; **no se puede distinguir**, y la etiqueta de IA y los errores de texto apuntan a lo segundo |

## 5. Limitaciones y aspectos no observables
- **Resolución:** la pantalla del portátil mide ~300 px de ancho en el vídeo, así que los textos pequeños, el menú y los botones no se leen. Las velocidades están en px del vídeo; la equivalencia con px reales (~×4,8 si la página fuera de 1 440 px) es una **estimación [EST]**.
- **Sin interacción visible:** no hay cursor, ni *hover*, ni clics, ni versión móvil, ni redimensionado.
- **Tecnología:** no hay código, red ni DOM. **No se atribuye** GSAP, Three.js, WebGL ni vídeo; todo lo de la columna "técnicas" es inferido.
- **¿Web real?** No se puede confirmar. La etiqueta "Contenido generado con IA" puede afectar a todo el reel o solo a una parte; Instagram no lo detalla.
- **Easing:** solo se midió el perfil de velocidad del contenido de R1 y R4. Las curvas de los objetos (cambios de forma) no se pueden medir sin la fuente.
- **Audio:** no analizado.
- **Fuente secundaria:** el artículo de Codrops sobre "From HTML5 Video to Frame Sequences" (OPTIKKA) no se pudo leer (error del sitio).
