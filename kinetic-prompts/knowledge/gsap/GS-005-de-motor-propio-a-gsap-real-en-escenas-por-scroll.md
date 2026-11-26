---
id: GS-005
titulo: Escenas por scroll con GSAP real (3.15.0) — timeline con scrub a partir de una tabla de pistas, pin frente a sticky, scrub numérico medido, refresh y resize, ciclo de vida de matchMedia, desmontaje, y 8 defectos reales encontrados y corregidos al ejecutarlo; comparación visual nativo frente a GSAP
categoria: gsap
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia con GSAP 3.15.0 instalado desde npm (evidence/demos/2026-11-02-lote26/: 3 recetas × 3 viewports, capturas de 5 estados, 27 grabaciones, resultados.json, diferencias.json) + CODIGO_INSPECCIONADO (node_modules/gsap/dist/ScrollTrigger.js 3.15.0: _refreshAll, _recordScrollPositions, oyentes de matchMedia) + DOCUMENTACION_OFICIAL_ANALIZADA (ScrollTrigger, helpers; lotes 24–25)
versiones: gsap 3.15.0 (npm, integridad sha512-dMW4CWBT…; gsap.min.js sha256 92bb9a96…, ScrollTrigger.min.js sha256 b0b14d67…), Chromium 153 (Playwright 1.63.0) en un contenedor Linux sin GPU
perfil: cinematografico
ultima_revision: 2026-11-03
---

# GS-005 · Escenas por scroll con GSAP real

**Estado: IMPLEMENTADO** (lote 26). GSAP 3.15.0 se instaló con autorización del usuario en una carpeta temporal aislada (`npm ci`, sin instalaciones globales).

Las tres recetas (REC-001/002/003) se han **ejecutado con GSAP real** en tres viewports: 1 440 × 900, 375 × 812 y 375 × 800. Sin errores de consola.

**No es VALIDADO:**
- solo se ha probado en Chromium;
- C1 y C3 dependen de recursos reales y de una persona.

## 1. Arquitectura verificada (reutilizable)
Plantilla en `integration/plantillas/escena_gsap/`. Es una copia exacta de la que se probó.

- **Tabla de pistas** por receta: `{ el, keys: [[p, valor]…], ease, desfase, gsap: { prop, conv } }`.
  - La misma tabla alimenta dos motores:
    - **GSAP:** un `fromTo` por tramo con `immediateRender: false`, colocado en `p0 + desfase` de un timeline de duración 1.
    - **Nativo:** `muestra()` + transform compuesto en el mismo orden que GSAP.
  - Así la comparación nativo frente a GSAP compara **dos motores distintos** (los tweens de GSAP frente a la interpolación propia), no una copia contra sí misma.
- **Curvas idénticas:**
  - `ease.inOut` propio = `"power2.inOut"` de GSAP (power2 es cúbica);
  - `none` = `"none"`.
- **Valores en función** (`vw(46)` → `() => 46 * innerWidth / 100`) + `invalidateOnRefresh: true`.
  - Una pista constante pero dependiente del viewport se convierte en un tween de 0 a 1 con el mismo valor, para que se recalcule.
- **Lo que no es interpolable** va en `receta.actualizar(p)`, llamado desde el `onUpdate` del timeline:
  - trazos medidos en el DOM;
  - el lienzo de partículas;
  - el cambio de texto;
  - las órbitas.
- **Ciclo de vida:** `gsap.matchMedia()` con condiciones `{ normal, reducir, movil: "(max-width: 700px)" }`.
  - La limpieza llama a `receta.limpiar()`.
  - `destruir()` = `mm.revert()` + `gsap.ticker.remove(fn)` + quitar el oyente de `resize`.
- **Carga:**
  - `arranque.js` inyecta `node_modules/gsap/dist/gsap.min.js` y `ScrollTrigger.min.js` **solo** con `?motor=gsap`. La versión nativa no carga GSAP; está comprobado: `window.gsap` no existe.
  - Opciones unificadas por URL: `?motor=gsap|nativo&pin=1&scrub=true|<s>`. La antigua opción `suavizado` se eliminó porque ningún motor la aceptaba igual.

## 2. Resultados medidos (resumen; tablas completas en `evidence/demos/2026-11-02-lote26/RESULTADOS.md`)
| Prueba | Resultado |
|---|---|
| **Carga** | `gsap.version` = `ScrollTrigger.version` = 3.15.0. Respuestas HTTP 200 desde `node_modules/gsap/dist/`, con sha256 igual al de los archivos instalados. 1 ScrollTrigger por escena |
| **Nativo ↔ GSAP** (scrub true, sticky), 5 estados | 1 440 px y 375 × 800: **0 % de píxeles con diferencia visible** (suma RGB > 24) en las 3 recetas; máximo por canal ≤ 5. 375 × 812: hasta 1,36 % visible (máx. 111) → §3 D7 |
| **Pin de ScrollTrigger** (`?pin=1`) | `position: fixed` y `top = 0` en 5 puntos del tramo, con pin-spacer. Recorrido y altura del documento iguales a la versión sticky (p. ej., 2 700 px y 4 680 px a 1 440). Diferencia visible con el nativo ≤ 0,08 % a 1 440 px (antialias del texto en la capa fija) y ≤ 0,8 % a 375 px |
| **Reversibilidad** (21 posiciones bajando y subiendo) | 0 en los valores de estado en los 3 motores; 0 % de píxeles en 1 440 y 375 × 800 |
| **Scrub numérico 0,8** (salto de p = 0 a 0,5) | p = 0,17 / 0,36 / 0,47 / 0,497 / **0,50** a 50 / 150 / 300 / 500 / **800 ms** → GSAP llega exactamente en `scrub` segundos. Asentado = 0,05 % de diferencia con `scrub: true`. La aproximación exponencial nativa **no** coincide (0,4997 a los 2 s) |
| **Resize** (5 cambios, cruzando 700 px) | Triggers siempre 1; 3 reconstrucciones de matchMedia. Captura sin volver a hacer scroll frente a una carga limpia en el mismo scrollY: 0 % visible a 1 440 |
| **Reduced motion** | Al cargar: `.rm` y **0** ScrollTriggers. En caliente (`emulateMedia`): triggers 1 → 0 → 1 |
| **Desmontaje** | 0 triggers, sin pin-spacer, sin clases, **0 estilos en línea** residuales y el ticker detenido |
| **Vídeo** (27 recorridos de bajada y subida) | 0 cortes (ningún pico aislado > 0,30) |

## 3. Defectos REALES encontrados al ejecutar GSAP (y su corrección)
| # | Síntoma observado | Causa | Corrección verificada |
|---|---|---|---|
| D1 | Al cargar arriba del todo, los elementos aparecían **sin transformar** | `tl.set(el, …, 0)` en un timeline con scrub: al volver a progreso 0, GSAP **revierte** los set de duración 0 al valor previo | Estado inicial con `gsap.set` (fuera del timeline, dentro de matchMedia) + `fromTo` con `immediateRender: false` |
| D2 | Tras un resize **sin scroll**, el chorro de A desaparecía con la jarra vertiendo (`prueba_onrefresh.json`: `p` del dibujo = 0 y timeline = 0,7) | Durante `refresh()` ScrollTrigger lleva la animación a 0 para medir (`onUpdate` recibe 0) y la devuelve a su progreso **sin** un `onUpdate` final | `onRefresh: self => receta.actualizar(self.animation.progress())` |
| D3 | Con `pin`, las medidas de `getBoundingClientRect` en `onUpdate` salían desplazadas (jarra con top −1 246 px en p = 0,5) | `onUpdate` se ejecuta antes de que el pin pase a `position: fixed` en ese mismo ciclo | Medir en **coordenadas relativas al escenario** (restar su rect) |
| D4 | Error `Cannot read properties of null (reading 'progress')` al desmontar | `mm.revert()` renderiza el timeline a 0 y dispara `onUpdate` con `tl.scrollTrigger === null` | Proteger: `tl.scrollTrigger ? … : null` |
| D5 | Después de `mm.revert()` quedaba `transform: translate3d(-50%,-50%,0); translate: none` en un elemento | GSAP 3.15 **absorbe la propiedad CSS `translate`** del elemento que anima y la pasa a `transform`; el revert no la restaura | No animar elementos centrados con `translate`; centrar con una capa contenedora (`display: grid; place-items: center`) |
| D6 | Al **cruzar un punto de corte** de matchMedia con un resize, el documento saltaba a **scrollY = 0** (`prueba_breakpoint.json`; sin la condición `movil` no ocurre) | En el ciclo revert → refresh, `_refreshAll` hace `scrollTo(0, 0)` y no restaura la posición (traza de pila en el código de ScrollTrigger) | Guardar el progreso en el evento `resize`, que llega **antes** que el cambio de media query, y restaurarlo en cada `"refresh"` durante 1 s: hay **dos** ciclos encadenados. Con la corrección, 2 430 px se conservan en sticky y pin |
| D7 | Diferencias de hasta 1,4 % en 375 × 812, pero **0 %** en 375 × 800 | ScrollTrigger **redondea** start y end a px enteros; el motor nativo usa la posición fraccionaria (60vh de 812 = 487,2 px) → Δp ≈ 1·10⁻⁴, visible solo en los tramos rápidos | No es un error de la animación; para comparar motores, usar layouts con px enteros. Documentado, no ocultado |
| D8 | Un lienzo vacío tras el resize hasta el siguiente scroll | Cambiar `canvas.width` borra el lienzo | Redibujar en `resize` con el último p |

## 4. Rendimiento (Chromium sin GPU; distinguir script, render y fluidez)
- **Script** (`ScriptDuration` de CDP) en un recorrido completo: A 57 ms con GSAP frente a 133 ms con el nativo. El bucle rAF nativo trabaja en cada fotograma aunque no haya scroll; el timeline de GSAP solo cuando cambia el progreso.
- **Estilo y layout:** 19–25 ms en A y C; ~2 ms en B (todo en canvas).
- **Resto de tareas** (pintado, composición, GC): domina en B (686 ms con GSAP a 1 440 px) y en C a 1 440 px (372 ms).
- **Fluidez:** fotogramas rAF de p50 16,7 ms en todos.
  - **C a 1 440 px:** 30 fotogramas > 33 ms con GSAP y 26 con el nativo. El coste es de **pintado** (sombras `drop-shadow`, `blur` y `mix-blend-mode` de la corrección visual), no de GSAP.
  - **B a 375 px:** `actualizar()` p95 = 8,5 ms (presupuesto de 8 ms rebasado por poco).
- Los valores son de software rendering en un contenedor: **no** representan un móvil real.

## 5. Cómo pedirlo
"Construye la escena con la plantilla `integration/plantillas/escena_gsap/` (GS-005):
- tabla de pistas, valores en función, `onRefresh` → `actualizar`;
- medidas relativas al escenario, `gsap.set` para el estado inicial y nada de `tl.set(…, 0)`;
- no animar elementos con la propiedad CSS `translate`;
- restaurar el progreso al cruzar puntos de corte.

Valida con `integration/tools/validar_gsap.mjs` y `diferencias.py` a 1 440 y 375 px."

## 6. Lote 27
- **D7 se amplifica con fotos.** Con recursos fotográficos, el desfase subpíxel de los layouts fraccionarios (375 × 812) produce hasta un 3,2 % de píxeles con diferencia visible en modo pin. En 375 × 800 (px enteros) da 0 %. Comparar motores siempre con layouts de px enteros.
- **Validador portátil.** `validar_gsap.mjs` usa `createRequire(import.meta.url)` y se ejecutó desde otra carpeta de trabajo sin errores (lote 27).
- **Cambios de profundidad discretos** (z-index) en `actualizar()` solo en momentos ocultos, como el cambio de texto enmascarado: no se ven y son reversibles.

## 7. Lote 28 · Plugins adicionales en la plantilla
- `arranque.js` ya no recarga GSAP si la página lo cargó antes. Recargarlo **sustituye** `window.gsap` y pierde los plugins registrados (Flip, EasePack).
- Las pistas aceptan **`easeGsap`** (cadena de ease de GSAP para toda la pista, p. ej. `"expoScale(1, 0.4, power2.inOut)"`). El motor nativo la ignora y usa su curva, así que hay diferencias esperadas con el nativo en esos tramos (0,4 % visible medido).
- `Flip.fit` (y `gsap.getProperty`) escribe `translate: none; rotate: none; scale: none` en los elementos que **mide**, y esas propiedades persisten tras `mm.revert()`. Son inofensivas, pero los marcadores no deben centrarse con la propiedad CSS `translate` (D5).
- Validación sin regresiones de la página base y de la variante Flip: `evidence/youtube/2026-11-03-lote28/fase4/`.
