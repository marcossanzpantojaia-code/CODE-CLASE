# Comparación preliminar A1 (con biblioteca) frente a B1 (sin biblioteca) — EXPLORATORIA, n = 1 por brazo (2026-10-27)

> **Una sola pareja de ejecuciones no permite concluir nada.** La regla de decisión de `integration/COMPARACION_CON_SIN_BIBLIOTECA.md` §5 exige ≥ 3 ejecuciones por brazo. Este documento informa lo medido, sin generalizar.

## 0. Equivalencia de condiciones
Registro previo: `../control_B1/registro_previo.md`, escrito **antes** de lanzar B1.
| Condición | ¿Igual? | Nota |
|---|---|---|
| Claude Code 2.1.311 | Sí | `init` de ambos |
| Modelo `claude-sonnet-5-5` | Sí (mismo id) | A1 por defecto; B1 fijado con `--model`. Ambos `modelUsage` incluyen además `claude-haiku-5-5` (tareas auxiliares internas) |
| Prompt | Sí, byte a byte | sha256 `6ec0d8dd…f8e0b` en los dos |
| Herramientas, modo de permisos, presupuesto, banderas | Sí | salvo `--add-dir` |
| Biblioteca | **No (variable del experimento)** | `init` de B1: 0 Skills `web-*`, `additional_directories` vacío; reglas *deny* de Read/Glob/Grep sobre `/home/claude/**` (biblioteca y A1) y `/mnt/user-data/**` |
| Acceso de B1 a A1 | Ninguno | B1 solo hizo `Write` ×3 y `Edit` ×2; 0 lecturas; 0 denegaciones |
| Momento | No | B1 ~1,5 h después de A1 |
| Cargos | Ninguno | `isUsingOverage: false` en todos los eventos de B1; `total_cost_usd` es un valor nominal de la suscripción |

**Conclusión de equivalencia:** condiciones suficientemente reproducidas para una comparación **exploratoria**; la variabilidad propia del modelo entre ejecuciones no está controlada.

## 1. Proceso (informativo)
| | A1 | B1 |
|---|---|---|
| Turnos | 26 | 6 |
| Duración | 319 s | 114 s |
| Coste nominal (no facturado) | 0,91 USD | 0,27 USD |
| Lecturas antes de escribir | índice + manifiesto + 11 fichas | ninguna |
| Archivos | 412 + 474 + 140 líneas | 316 + 230 + 88 líneas |

La biblioteca multiplicó por ~3,4 el consumo nominal y por ~2,8 la duración en esta pareja.

## 2. Anonimización
Códigos generados al azar (`secrets` + `SystemRandom`) **antes** de las pruebas: **W-4FF0** y **W-8508**. La correspondencia está en `CORRESPONDENCIA_SELLADA.json`. **Limitación declarada:** el orquestador ya conocía A1 y lo reconoció por sus métricas (21,7 KB de HTML, 362 nodos) y por sus capturas, así que **su evaluación visual no es ciega**. Para una evaluación ciega real, una persona debe puntuar las carpetas `W-*/ronda1/*.jpg` sin abrir el archivo de correspondencias.

## 3. Batería técnica idéntica (misma máquina, mismo servidor local, Playwright 1.63.0, Chromium 153)
Herramientas:
- `integration/tools/prueba_web_playwright.mjs`, en la versión de la ronda 2;
- `extra_generico.mjs`;
- `contraste_compuesto.mjs`.

La ronda 1 usó el arnés del lote 18 (`herramientas/prueba_web_playwright_v18.mjs`). La ronda 2 añade `ocultos_con_contenido` porque en la ronda 1 la métrica bruta contaba decoración `aria-hidden` (puntos guía de B1) y arte decorativo a mitad de su animación de entrada (A1). Se conservan los datos de las dos rondas.

| # | Métrica | W-4FF0 | W-8508 |
|---|---|---|---|
| T1 | Errores de consola / JS (1440, 768, 375) | 0 | 0 |
| T2 | Peticiones fallidas | 0 (3 peticiones) | 0 (3 peticiones) |
| T3 | Desbordamiento horizontal 320/375/768/1440 | ninguno | ninguno |
| T4 | Cabecera en una fila a 320 / 375 | **sí / sí** (marca + botón de menú; CTA solo en el menú) | **no / no** (2 filas; alto 84 / 98 px) |
| T5 | Foco visible (paradas con indicador) · salto primero | 23/24 · sí; sin indicador: `input#fecha`; 2 paradas posiblemente tapadas por la cabecera fija | 23/24 · sí; sin indicador: `input#fecha`; 1 posiblemente tapada |
| T6 | Reduced motion: ocultos con contenido / animaciones | 0 / 0 | 0 / 0 |
| T7 | Sin JS: ocultos con contenido | 0 | 0 |
| T8 | Formulario vacío: errores con texto · foco · peticiones | 5 · `nombre` · 0 | 5 + resumen · `nombre` · 0 |
| T9a | Contraste sobre fondo opaco (fallos / medidos) | 0 / 23 (7 no medibles) | 0 / 24 (8 no medibles) |
| T9b | Contraste compuesto a 375 px (p10 < mínimo) | "Madrid · Desde 1987" 4,17; "(ficticio)" 3,57; pies de galería superpuestos a la ilustración (peor caso 1,8; p10 > 11) | "Barbería · Madrid" 4,14; "Calle de Ejemplo 12" 3,63 |
| T10 | LCP / CLS / KB (HTML+CSS+JS) / nodos DOM | 132 ms / 0 / 16,6 + 12,4 + 3,5 = **32,5 KB** / **281** | 128 ms / 0 / 21,7 + 21,3 + 5,8 = 48,8 KB / 362 |
| T11 | Lighthouse | BLOQUEADO (no instalado) | BLOQUEADO |

Animaciones observadas con movimiento normal:
- W-4FF0: `sway` (haz de luz) más los revelados (23 contenedores).
- W-8508: `breathe`, `drift`, `art-in` (entrada del arte del héroe) y `spin` (poste), más los revelados (23).

En los fotogramas a 4 fps de `ronda1/fotogramas/`, W-8508 muestra la entrada del poste durante ~0,5 s y W-4FF0 un héroe estático. **El ritmo y la fluidez no se puntúan**: no los ha revisado una persona en vídeo.

## 4. Evaluación visual (1–5) — opinión del orquestador, **NO ciega**
| Criterio | W-4FF0 | W-8508 |
|---|---|---|
| Jerarquía | 4 | 4 |
| Tipografía | 4 | 4 |
| Color y composición | 4 (bandas *letterbox*) | 4 |
| Héroe | 4 | 4 |
| Móvil | 3 (poste visible tras el texto; pie de galería sobre la ilustración) | 3 (cabecera en dos filas) |
| Utilidad comercial | 3 (sin horario ni precio en el héroe; CTA fuera de la cabecera móvil) | 5 (franja horario · dirección · "desde 12 €"; duración de cada servicio; CTA junto a la lista de precios) |
| Accesibilidad percibida | 4 | 4 |
| Coherencia de marca | 4 | 4 |
| **Media** | **3,75** | **4,00** |

Observación cualitativa: las dos webs son **muy parecidas** en estética, con la misma paleta, la misma serif, un poste de barbero, avatares SVG sin rostro, testimonios marcados y un plano SVG. La biblioteca no cambió el lenguaje visual. Las diferencias visibles son de contenido comercial (W-8508) y de solidez de la cabecera móvil (W-4FF0).

## 5. Lectura con la regla fijada (solo orientativa, n = 1)
1. **Métricas críticas (T1, T3, T6, T7, T8):** empate. A1 no empeora ninguna.
2. **Total técnico:** A1 es **peor** en T4 (cabecera) y en peso (T10); el resto empata.
3. **Media visual:** A1 +0,25 (< 0,5, y no ciega).
4. **Resultado de esta pareja:** **no se observa mejora atribuible a la biblioteca** según la regla. Lo único favorable a A1 es la utilidad comercial (más información de conversión) y el registro de decisiones, que cuesta ~3,4× más.
5. **No se generaliza.** Hacen falta las 2+2 ejecuciones restantes, alternas, para que el resultado sea indicativo.

## 6. Hipótesis para la biblioteca (a comprobar, no conclusiones)
- Con una restricción de "solo HTML/CSS/JS sin dependencias", las fichas de animación cinematográfica (GSAP, Three.js) no se pueden aplicar. El margen de mejora queda en UX, accesibilidad y contenido, que el modelo ya hace razonablemente bien sin ayuda. → El experimento debería repetirse **con el stack de la biblioteca (Astro + GSAP)** en ambos brazos (`integration/PLAN_ASTRO_GSAP.md`).
- El fallo de cabecera de A1 no lo evitó ninguna ficha leída. UX-004 se escribió después. Una regla explícita en `web-commercial-site` ("en móvil, cabecera = marca + menú; CTA fijo inferior o dentro del menú") podría evitarlo. La solución de B1 coincide con esa regla.
- Ninguno de los dos brazos midió contraste sobre arte. Lo detectó `contraste_compuesto.mjs` en ambos → TEST-003.
