# Lote 31 · ROSSO "aterrizaje en el plato" — auditoría, corrección y estrategia de scroll

**Alcance:** todo es una **animática con fixtures** del lote 27, con los mismos recursos, encuadre (1 280 × 720), duración (2,5 s) y 30 fps que la del lote 30.
- **Solo valida movimiento (C2 mecánico).**
- C1 y C3 **no se evalúan:** no hay recursos reales y C3 lo aprueba el usuario.

## Fase 0 — Recuperación
| Elemento | Estado |
|---|---|
| Biblioteca v0.30.0 (`library_check`) | 160 fichas, 253 VR, 0 errores. ZIP en salidas: 62 575 799 bytes, 1 166 entradas |
| Evidencias del lote 30 (`evidence/youtube/2026-11-04-lote30/fase4/`) | página, scripts, `serie.json`, `medidas.json`, hoja y vídeo: presentes. La copia de trabajo es idéntica a la de la biblioteca (`cmp`) |
| Fotogramas PNG del lote 30 (`base/`, `cine/`) | solo en la carpeta de trabajo de la sesión (no se guardaron en la biblioteca). Disponibles y reutilizados para la auditoría y el vídeo A |
| Dependencias | GSAP 3.15.0 (gsap, ScrollTrigger, EasePack, CustomEase) en `node_modules` de la carpeta de trabajo; Playwright, Chromium, ffmpeg, Pillow, NumPy y Matplotlib en el contenedor. **Nada instalado** |
| Recursos | fixtures del lote 27 (`fixture-rec003-lote27`): I1 = caja gris rotulada con una elipse "nido"; plato procedural con capa delantera y sombra; ingredientes |

## Fase 1 — Auditoría fotograma a fotograma del lote 30 (B)
Fuentes:
- `auditoria/auditoria_lote30.json` (`auditar30.py`, scratch);
- `auditoria/A_l30_original.json` (`auditar31.py`).

| Afirmación del lote 30 | Verificación | Veredicto |
|---|---|---|
| 11 fotogramas de doble imagen en A (lote 27) | 11 (opacidad 0,05–0,95 con los nidos a 5–115 px) | **Cierta** |
| 0 de doble imagen en B | 0 | Cierta |
| "Desajuste de 10,8 → 0,0 px" | El 0,0 se midió en el fotograma 33, cuando el héroe **ya era invisible**. Entre el último héroe visible (f32) y el plato (f33): **53,6 px de salto y −8 % de ancho** | **Engañosa: corregida** |
| Relevo junto al pico de velocidad | Pico en f32, relevo en f33 | Cierta |
| ~54 px por fotograma | Máximo de 53,6 px (1 360 px/s de velocidad total, no 770: aquella era solo la componente vertical) | Cierta |
| "0 cortes" | El detector no lo marca, pero la diferencia de píxeles en el relevo es de **21,1 (0–255), 20,7 veces la mediana** del movimiento. El segundo valor más alto es 7,9 | **El corte es perceptible:** el detector no basta |

**Defectos de B del lote 30, por gravedad**

| # | Defecto | Origen | Gravedad |
|---|---|---|---|
| D1 | **Desaparece toda la forma de I1 en 1 fotograma** (tenedor o caja) | El relevo sustituye una imagen grande por otra distinta; solo el nido es común | **Crítica** |
| D2 | Salto visible en el relevo: 53,6 px y −8 % | Se mide la alineación en el fotograma invisible; a máxima velocidad el último visible está a un fotograma de distancia | **Alta** |
| D3 | Estroboscopio: 45–54 px por fotograma sin desenfoque | Caída `power3.in` hasta el contacto, sin motion blur | **Alta** |
| D4 | Frenazo de 1 360 → 296 px/s en 1 fotograma (−48 195 px/s²), con un giro de 54° (de 144° a 90°) | Choque a máxima velocidad: el plato absorbe solo la componente vertical | Media |
| D5 | Escala que crece hasta un 8 % por fotograma al final | `expoScale … power2.in` acelera la escala junto con la caída | Media |
| D6 | Quiebro de dirección al empezar la caída (de −90° a 178°, aceleración de −802 px/s²) | La anticipación termina parada y la caída arranca en otra dirección con otro tween | Media |
| D7 | El héroe no proyecta sombra sobre el plato al acercarse | No hay capa de sombra del héroe | Media (C1/C2) |
| D8 | La capa delantera del plato queda **detrás** del héroe | Las tres capas del plato en un mismo contenedor por debajo del héroe | Media (profundidad) |
| D9 | Con `scrub`, el relevo de 1 fotograma queda expuesto con scroll lento | El relevo depende de la velocidad | **Alta** en la web (Fase 3) |

## Fase 2 — Corrección (B del lote 31): `escena31.js`, modo `l31`
| Corrección | Técnica | Defecto |
|---|---|---|
| El protagonista del aterrizaje es **solo el nido** (máscara elíptica suave sobre el MISMO recurso I1). Con recursos reales: un recorte del nido (I1-nido). Coherente con CASE-003: "la pasta baja y se posa"; en la referencia, el tenedor ya no está en ese tramo | Continuidad de forma | D1 |
| **Aterrizaje suave** ("se posa"): la velocidad baja a 37 px/s en el contacto; el plato sube, rebasa un 0,3 % y baja a +60 px/s, la **misma** velocidad final del nido → se "recogen" sin choque | Traspaso de velocidad sin frenazo | D4 |
| **Relevo por fundido ALINEADO:** desde el contacto, el nido queda bloqueado al nido del plato (separación 0,00 px en todo el fundido) y se funde en 0,32 s. No es una doble imagen, porque las dos capas ocupan el mismo sitio | Ocultación por composición | D2, D9 |
| **Trayectoria Hermite C1** (posición, escala, giro y escala Y con claves [t, valor, velocidad]): sin quiebros. La anticipación (arriba a la derecha, 1,6 % del alto, −1,5°) gira hacia la caída mientras la velocidad es casi 0 | Marriott: anticipación + curva suave | D6 |
| **Falso 3D en un eje** (Marriott, UVDpgP7sRbw): la escala Y del nido baja a 0,52 para igualar la elevación aparente del anillo del plato (0,78 → ~0,40 de proporción) | Continuidad de forma y perspectiva | D1 |
| Escala con velocidad final 0 en el contacto | Hermite | D5 |
| **Motion blur** por acumulación analítica (MBLUR-001) | 180° centrado, árbol 4×4, estela limitada | D3 |
| **Sombra del nido** sobre el plato: crece en opacidad y se cierra al acercarse; **la capa delantera del plato va por delante del héroe** | Profundidad | D7, D8 |
| Cámara: push-in del 2 % hasta el contacto y salida en 1,1 s (desfasada) | EDIT-001 §2.8 | — |
| Ingredientes: los mismos que en el lote 30, escalonados; `power2.inOut` hacia el contacto | Secundarios | — |

## Fase 4 — Comparación A/B (mismos fixtures, encuadre, 2,5 s, 1 280 × 720, 30 fps)
- **A** = fotogramas originales del lote 30.
- **B** = `rosso31.html?modo=l31`.
- El puerto de A al lienzo (`?modo=l30`) reproduce A: 53,6 px de salto, ratio de diferencia 20,2 frente a 20,7.

| Métrica (`auditar31.py`) | A · lote 30 | B · lote 31 |
|---|---|---|
| Salto visible en el relevo (último héroe visible → nido del plato) | **53,6 px**, −8 % de ancho | **0,7 px**, 0 % |
| Diferencia de píxeles en el relevo / mediana del movimiento | 21,1 / 1,02 (**20,7×**) | 2,44 / 0,92 (2,7×) |
| Máxima diferencia de píxeles del clip | 21,1 (el relevo) | 6,7 (la entrada del plato; en A, 7,9) |
| Espaciado máximo del protagonista | 53,6 px por fotograma | **16,2** |
| Velocidad máxima | 1 360 px/s | 485 px/s |
| Velocidad del héroe antes del relevo | 1 360 px/s | 37 px/s (se posa) |
| Cambio de escala máximo por fotograma | 6,9 % | 2,4 % |
| Fotogramas de doble imagen | 0 | 0 (separación durante el fundido: 0,00 px) |
| Motion blur | 0 | hasta 12,2 px, con error frente a la referencia **4× menor** que sin blur (MBLUR-001 §12) |
| Plato: px por fotograma máximo | 108,6 | 36,1 |

Archivos:
- `rosso_AB_lote31.mp4`: arriba A, abajo B; primero a velocidad real y después 4 veces más lento;
- `rosso_B_lote31_solo.mp4`;
- `hoja_AB.png` (fotogramas clave);
- `curvas_AB.png` (espaciado, diferencia de píxeles, trayectoria, opacidad y blur);
- `recortes_B.png`;
- `ref_blur/comparacion_blur_f21.png`.

**Defectos que siguen en B:**
- **La entrada del plato no tiene desenfoque** (36 px por fotograma, capa DOM).
- Cambio de dirección de 16° al bloquearse al plato, a velocidad baja.
- **Con fixtures, el fundido es de una elipse gris a un anillo dorado:** la continuidad de material solo se puede juzgar con I1-nido e I2 reales.

## Fase 3 / Fase 6 — Estrategias con scroll real (`prueba_scroll.html`, `test_scroll31.mjs`)
- Registro por **fotograma renderizado** (ticker de GSAP), no por escalón de rueda.
- **Escenarios:**
  - lento: 4 px cada 16 ms;
  - rápido: 120 px cada 16 ms;
  - zigzag: ±60 px cada 50 ms × 8 en el umbral;
  - saltos con `scrollTo`;
  - resize a 0,7 × 0,9;
  - reduced motion;
  - recursos retrasados 1,5 s (el usuario desplaza **antes** de que estén listos);
  - desmontaje.
- **Viewports:** 1 280 × 720 y 375 × 812.

| | A · scrub + relevo de 1 fotograma (lote 30) | B · microtransición en tiempo al cruzar el umbral | C · scrub + relevo oculto por composición (lote 31) |
|---|---|---|---|
| **Lento** — salto visible en el relevo / Δopacidad máx. por fotograma | 12 px / **1,0** (desaparece de golpe) — móvil 7,7 / 1,0 | 0,5 / 0,084 | **0,3 / 0,054** — móvil 0,3 / 0,048 |
| **Rápido** (7 200 px/s) | 236 px (la transición dura ~7 fotogramas) | 257 px: **salta al final sin reproducirse** (regla de salto lejano) | 9,9 px; estela limitada a 28 px |
| **Zigzag en el umbral** | **5 relevos parpadeando** (50 px cada uno) | 0 relevos; un solo timeline (2 tweens activos como máximo: sin acumulación) | 0 relevos; reversible por posición |
| **Saltos de barra** (fin / inicio / mitad) | correctos | correctos; en "mitad" **sigue reproduciéndose 1,4 s después** (el usuario espera 2,5 s) | correctos e inmediatos |
| **Resize** | lienzo y geometría reconstruidos | ídem | ídem |
| **Reduced motion** | corte entre estado inicial y final, sin blur | ídem | ídem |
| **Recursos retrasados 1,5 s** | estado coherente con la posición al cargar | ídem | ídem |
| **Desmontaje** | 0 transforms residuales, lienzo vacío, 0 triggers, 0 tweens | ídem | ídem |
| **Errores de consola** | 0 | 0 | 0 |

**Decisión: C.**
- Es la única que mantiene el relevo invisible a **cualquier** velocidad sin máquina de estados, conserva la reversibilidad por posición (el contenido nunca se desincroniza del scroll) y no hace esperar al usuario.
- **B** iguala a C con scroll lento, pero:
  - se salta la transición con scroll rápido;
  - sigue animando cuando el usuario se detiene;
  - necesita reglas de salto.
  - Queda como opción para una transición que **deba** verse completa (un logotipo, por ejemplo).
- **A** queda descartada para relevos de objeto.

**Nota de método:** antes de la versión final, la prueba de scroll reveló un error real del núcleo: la geometría se medía en coordenadas del viewport y no del escenario, y el héroe volaba fuera de la pantalla en la página con scroll. Lo corrige `escena31.js`, que mide relativo a `#escena`. Las ejecuciones previas están en `scroll/fase_trasera_y_suma_plana/`, con la fase trasera y la suma plana de 8 bits anteriores a la corrección.

**Uso de la plantilla de GS-005:**
- Se aplicaron sus reglas: sticky en lugar de pin JS; geometría reconstruida en `onRefresh`; `matchMedia` con `revert`; reduced motion; desmontaje verificado.
- **No** se usó el motor de pistas: el protagonista se dibuja en canvas con un estado analítico, y las pistas de GS-005 animan propiedades DOM.

## Recursos y siguiente paso
- Contrato: `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE_v2.md`.
- **Próxima acción de mayor impacto visual:** generar **I1-nido** e **I2** con el nido equivalente (misma elevación y luz) y repetir esta misma batería. Es lo único que permite juzgar C1 y la continuidad del material en el fundido.
