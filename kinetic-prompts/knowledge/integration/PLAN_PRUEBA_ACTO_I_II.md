# Plan de la prueba cinematográfica: transformación del Acto I al Acto II de "El ritual" (estado: PLANIFICADO, NO IMPLEMENTADO)

> **Lote 22:** el **orden de validación** de este plan queda sustituido por `PLAN_LOTE22_HITOS_ABC.md`: primero un fotograma (Hito A), después una apertura de 36 fotogramas (Hito B) y por último el control con el scroll (Hito C). La secuencia de 70 fotogramas solo se produce si se aprueban los hitos A–C. El resto de este documento (requisitos, mapa de scroll, criterios) sigue vigente.

Lote 21 (2026-10-27). Es un tramo **F0 → F4** de `BRIEFING_STORYBOARD_PROTOTIPO_2.md`, que se conserva completo: navaja cerrada → se abre → satélites → hilos que forman la hélice de espuma → cuenco del Acto II. No se implementa hasta resolver los recursos (`ESTRATEGIA_RECURSOS_VISUALES.md`) y las dependencias (`PLAN_ASTRO_GSAP.md`).

## 1. Qué debe demostrar → cómo y con qué se mide
| # | Requisito de la directiva | Implementación prevista | Evidencia y criterio |
|---|---|---|---|
| 1 | Objeto protagonista de calidad visual alta | Navaja renderizada en Blender (opción B): metal anisótropo, luz lateral cálida, HDRI de estudio CC0 | C1.2 `foco_mayor_componente` ≥ 0,30 (provisional); C3, dimensiones "Materiales" e "Iluminación" ≥ 4 |
| 2 | Tipografía editorial en varias capas | Palabra fantasma "FILO" (capa 1), titular h1 real (capa 2) solapado por la hoja (capa 3) y motas de luz (capa 4) (DEPTH-001 §5) | C1.1 capas en el orden del storyboard; C1.5 titular ≥ 9 vw; TEST-003 con p10 ≥ 3:1 |
| 3 | Transición real controlada por el scroll | ScrollTrigger con `pin` y `scrub: 0.6`; secuencia en canvas (SEQ-001) y color de fondo tabaco → crema en el mismo *timeline* | C2.2 entrada y salida de cada elemento ±10 % del recorrido previsto (`curvas_scroll.mjs`) |
| 4 | Continuidad del protagonista | Una sola secuencia de 0 a 70 para I → II, renderizada en **una** escena y con **una** cámara | C2.3 Δ fotograma ≤ 2 por paso y 0 pasos sin objeto (`window.__secuencia.frame`) |
| 5 | Máscaras, profundidad y composición | Alfa nativo (Film Transparent) en WebP; parallax entre capas (−10 / 0 / +5 / +20 %); revelado del titular con SplitText `mask: "lines"` | Bordes ampliados al 400 % sobre claro y oscuro; C3 "Profundidad" ≥ 4 |
| 6 | Responsive | Juegos de fotogramas de escritorio (1 600 px) y móvil (900 px) elegidos por el ancho real; en móvil, titular encima del objeto y satélites en fila (sin órbita) | Capturas a 1 440 × 900 y 375 × 812 en 5 puntos; T3/T4 de TEST-004 |
| 7 | Reduced motion | `gsap.matchMedia()` con `reduceMotion`: sin pin ni secuencia; fotogramas clave F0, F2 y F4 como `<img>` estáticos con su texto | C2.6: 0 animaciones de scroll, contenido visible (TEST-004 `ocultos_con_contenido` = 0) |
| 8 | Capturas y vídeo para C1, C2 y C3 | Playwright: capturas en el 0, 25, 50, 75 y 100 % del pin; `recordVideo` a 1 440 y 375 px con rueda a impulsos; mosaicos de fotogramas con ffmpeg | Carpeta de evidencia; rúbrica C3 rellenada **por el usuario** |

## 2. Recursos necesarios (especificación para producirlos)
| Recurso | Especificación | Origen (opción) |
|---|---|---|
| Secuencia `navaja_I_II` | 70 fotogramas (0–35 apertura y destello; 36–70 hilos → hélice de espuma); PNG RGBA desde Blender → WebP con alfa (calidad 80) a 1 600 y 900 px; encuadre ajustado al objeto | B |
| Fotograma clave estático | F0, F2 y F4 en AVIF/WebP (para reduced motion y LCP) | B |
| Motas de luz o polvo | 1 secuencia corta en bucle o partículas en canvas 2D | B o código |
| Satélites | 3 etiquetas HTML ("Navaja libre · 18 €", "Perfilado · 12 €", "Afeitado clásico · 22 €", precios **ficticios**) | código |
| Tipografía | Display serif de alto contraste condensada y sans humanista, ambas con licencia OFL, autoalojadas (TYPE-001) | por decidir (sin descargar) |
| Presupuesto de peso | Secuencia de escritorio ≤ 4 MB y de móvil ≤ 2 MB **para este tramo** [propio; ~15 KB por fotograma en móvil en OPTIKKA] | — |

## 3. Mapa de scroll (pin de `+=260 %` de la altura de la ventana; a ajustar con C2)
| Progreso | Fondo | Fotograma | Fantasma "FILO" | Titular | Satélites | "ESPUMA" / titular II |
|---|---|---|---|---|---|---|
| 0–10 % | tabaco | 0 | visible, `yPercent` 0 → −5 | entra por líneas (0,9 s, ya en la carga) | — | — |
| 10–40 % | tabaco | 0 → 35 (se abre) | −5 → −10 | sube y se desvanece entre el 30 y el 40 % | — | — |
| 40–65 % | tabaco | 35 | — | — | entran escalonados al 45 % y orbitan | — |
| 65–85 % | tabaco → crema (`scrub`) | 35 → 60 (hilos) | sale | — | salen al 70 % | — |
| 85–100 % | crema | 60 → 70 (hélice sobre el cuenco) | — | — | — | entran "ESPUMA" (fantasma) y el titular II, detrás del cuenco |

## 4. Dependencias concretas (sin instalar)
| Dependencia | Versión fijada | Restricción |
|---|---|---|
| Node | 22.23.4 (presente) | `astro@7.4.2` exige ≥ 22.23.4: **justo en el límite**; cualquier entorno con una versión menor fallará |
| `astro` | 7.4.2 | Vite 8 y compilador Rust; `sharp` 0.35.5 opcional (binarios precompilados `@img/*`, sin script de instalación; libvips es **LGPL-3.0-or-later**) |
| `gsap` | 3.15.0 | licencia Standard "No Charge" (uso comercial permitido; VERSIONES_VIGENTES) |
| `typescript` | **6.0.3** | `@astrojs/check@0.9.12` solo admite `^5 \|\| ^6` |
| `@astrojs/check` | 0.9.12 | opcional |
| Blender | **5.2.3 LTS** | GPL; renders propiedad del autor; descarga bloqueada en el contenedor (§ESTRATEGIA 0) |
| ffmpeg | el del contenedor | presente; WebP con alfa verificado |
| Playwright | 1.63.0 + Chromium 153 (presente) | solo Chromium (no hay WebKit ni Firefox) |

Árbol resuelto **sin instalar** (`npm install --package-lock-only --ignore-scripts`): 336 paquetes; único script de instalación en `fsevents` (macOS, opcional); licencias MIT 260, Apache-2.0 17, ISC 14, MPL-2.0 12 (lightningcss), LGPL-3.0-or-later 10 (libvips)… Lockfile en `evidence/integration/2026-10-27/lote21/package-lock.json` (sha256 `e51b6643…`).

## 5. Orden de trabajo (cada paso requiere la autorización indicada)
1. **[R1]** Instalar Blender 5.2.3 LTS en una carpeta temporal y hacer la **prueba de tiempo** de 1 fotograma.
2. **[R1]** Modelar y renderizar la secuencia de 70 fotogramas, convertirla con ffmpeg y revisar los bordes del alfa.
3. **[D2]** Instalar el stack desde el lockfile (`PLAN_ASTRO_GSAP.md` §2).
4. Ejecutar las pruebas K1–K6 de compatibilidad.
5. Construir solo la página del tramo I → II (una ruta de Astro y un componente `ActoTransicion`), con `window.__secuencia` expuesto **solo en desarrollo** para la medición.
6. Medir C1 (capturas + `composicion_captura.py`), C2 (`curvas_scroll.mjs` a 1 440 y 375 px, vídeo, *long tasks*) y TEST-003/004.
7. Entregar las evidencias y **pedir la puntuación C3** al usuario.

## 6. Criterios de aceptación de la prueba
Se acepta si **todos** se cumplen:
- 0 fallos críticos en T1–T10;
- C1.1–C1.6 conformes (umbrales **provisionales**, de la referencia Enky a baja resolución);
- C2.2–C2.6 conformes;
- C3 con media ≥ 4,0 y ninguna dimensión < 3 (puntúa una persona).

Si falta un recurso de calidad (p. ej. una navaja con aspecto de *render* barato), la prueba se marca **NO APROBADA** aunque todo lo técnico funcione.

## 7. Riesgos
- Tiempo de render en CPU desconocido.
- Calidad del modelado.
- Continuidad navaja → espuma difícil de hacer creíble.
- Peso de las dos resoluciones.
- Node en el mínimo exacto que exige Astro.
- Medición en un navegador oculto (CASE-004 §6) → usar Playwright en el contenedor para las capturas y el vídeo.
