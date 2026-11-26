---
id: MOT-001
titulo: Gramática de una escena cinematográfica controlada por scroll — método de estados 0/25/50/75/100 %, timeline maestra con labels, scrub, snap, pausas visuales, timelines anidadas, coreografía y movimiento secundario; scroll real frente a animación ligada al scroll y cuándo NO suavizar
categoria: animations
estado: IMPLEMENTADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (gsap.com ScrollTrigger y ScrollSmoother, leídas el 2026-11-01) + DEMO_INSPECCIONADA propia (microdemos del lote 24 en evidence/demos/2026-11-01-lote24/: motor de estados sin dependencias, reversibilidad y tiempos medidos) — la versión GSAP del código está DOCUMENTADA, no ejecutada
versiones: GSAP 3.15 (snap "labelsDirectional", directional desde 3.8, clamp() desde 3.12); Chromium 153 para las microdemos
perfil: cinematografico
ultima_revision: 2026-11-01
---

# MOT-001 · Gramática de escena por scroll

**Estado por niveles:**
- **DOCUMENTADO:** la API de GSAP.
- **IMPLEMENTADO y PROBADO:** el método de estados, con un motor nativo equivalente en 3 microdemos (reversibilidad exacta; coste de script medido).
- **VISUALMENTE VALIDADO:** no (los recursos son procedurales).

1. **Efecto.** El scroll se convierte en una **línea de tiempo narrativa**: el usuario avanza y retrocede por una escena en la que el protagonista, la tipografía, los fondos y los elementos secundarios cambian de forma coreografiada, con pausas en las que la composición "respira". Es lo que se observa en CASE-003 (P2, P9, P10).
2. **Cómo funciona.**
   - **Scroll real del navegador:** el documento se desplaza de verdad y el navegador pinta. Solo se ve contenido que sube.
   - **Animación ligada al scroll:** una sección se **fija** (pin o `position: sticky`) durante N alturas de ventana. Su progreso `p ∈ [0,1]` = (scroll − inicio) / (fin − inicio) es el **playhead** de un timeline. Nada "pasa" con el tiempo: todo es **función de p**.
   - **ScrollTrigger [doc]:**
     - `scrub: true` liga el progreso de la animación al de ScrollTrigger; `scrub: 0.5` es el "tiempo de alcance" en segundos.
     - Con scrub, **las duraciones del timeline son proporciones** ("total duration 5 s → ⅕ = 20 %").
     - Solo **una** animación por ScrollTrigger: envuélvelo todo en **un** timeline.
   - **Mesetas (pausas visuales):** tramos del timeline en los que ninguna propiedad cambia. En GSAP, un `tl.to({}, { duration: 0.6 })` vacío o espacio entre labels; en el motor nativo, dos claves con el mismo valor.
3. **Cuándo usarlo.** Héroes y transiciones narrativas de producto (perfil B, o héroe premium en A). **No** en listados, formularios ni contenido que el usuario necesite leer deprisa.
4. **Recursos.** Ninguno propio. Depende de los recursos de cada capa (SEQ-001/002, ART-001).
5. **Tecnologías.** GSAP core + ScrollTrigger (y SplitText, Flip). Alternativa nativa probada: `position: sticky` + rAF + funciones puras de p (`evidence/demos/2026-11-01-lote24/codigo/escena.js`). CSS scroll-driven animations (CSS-001) para casos simples sin JS.
6. **Estructura — el método de estados.**
   1. **Dibujar 5 fotogramas clave** (0, 25, 50, 75 y 100 %) en el storyboard: dónde está el protagonista (x, y, escala, rotación), qué texto se lee, qué fondo hay y qué capas existen.
   2. **Tabla de pistas:** una fila por elemento, con columnas de claves `[p, valor]`, *easing* y capa (lejana, media o cercana).
   3. **Mesetas:** al menos un 10–15 % de meseta en cada estado legible (el usuario debe poder leer el titular sin que se mueva).
   4. **Coreografía:** como máximo **un movimiento principal** a la vez; los secundarios, con un retardo del 2–5 % del recorrido (en la microdemo A, cada línea del titular entra con +0,02 de p).
   5. **Labels** en los estados legibles (`"florecer"`, `"verter"`, `"servir"`) → `snap: "labelsDirectional"` si se quiere que el scroll "descanse" en ellos.
   6. **Timelines anidadas:** un timeline por subescena, añadido al maestro en su label (`master.add(subTl, "verter")`). Cada uno se prueba por separado.
   ```js
   // DOCUMENTADO (API oficial), NO ejecutado aquí
   const master = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
     trigger: "#acto", start: "top top", end: "+=300%", pin: true, scrub: 0.6,
     snap: { snapTo: "labelsDirectional", duration: { min: 0.2, max: 0.6 }, delay: 0.1, ease: "power1.inOut" } } });
   master.addLabel("florecer")
         .to({}, { duration: 0.15 })                                    // meseta: se lee el titular
         .add(salidaTitulo(), ">").addLabel("verter")
         .add(inclinarJarra(), "verter").add(chorro(), "verter+=0.05")  // principal + secundario desplazado
         .to({}, { duration: 0.25 }).addLabel("servir")
         .add(entradaTitulo2(), "servir");
   ```
7. **Parámetros.**
   - Longitud del pin (`end: "+=300%"` ≈ 3 pantallas de scroll).
   - `scrub` (0 = rígido; 0,3–1 = inercia de alcance).
   - Duración relativa de cada tramo y mesetas.
   - *Easing* por pista: `none` para lo que sigue directamente al dedo (posición de la secuencia); `inOut` para cambios de estado.
   - Snap: duración `{min, max}`, `delay` (por defecto, la mitad del scrub) y `directional`.
8. **Problemas visuales.**
   - **Scroll suavizado (Lenis/ScrollSmoother) + scrub alto** = doble retardo: la escena "flota" detrás del dedo.
   - Snap que pelea con el usuario (ScrollTrigger lo cancela si el usuario interactúa [doc]).
   - Pins largos con poco contenido (aburrimiento) o cortos con mucho (todo ocurre a la vez).
   - Elementos que cambian sin meseta (ilegibles).
   - Cambios de texto a mitad de la vista (en la microdemo C el texto **solo cambia cuando la línea está fuera de su máscara**).
   - `scroll-behavior: smooth` en `html` descoloca ScrollTrigger (ST-004).
   - Transformaciones en ancestros que rompen el pin (ST-002).
9. **Móvil.**
   - Pins más cortos (×0,6–0,8).
   - Tabla de estados propia (las coordenadas cambian; en la microdemo A las pistas de la jarra son funciones de `movil()`).
   - `ScrollTrigger.config({ ignoreMobileResize: true })` y ST-006.
   - **ScrollSmoother no suaviza el táctil por defecto** ("will NOT apply scroll smoothing on touch-only devices" [doc]).
10. **Reduced motion.** `gsap.matchMedia()` → sin pin ni scrub. Se muestran los fotogramas clave (estados 0 y 100 % o los labels) como composiciones estáticas apiladas. Microdemos: clase `.rm`, página de 1 786–1 980 px de alto sin `sticky` [MED].
11. **Coste.** El timeline en sí es barato: en la microdemo A el script tarda p50 0,4 ms y p95 1,3 ms por fotograma; en la C, p95 0,4 ms [MED, contenedor sin GPU]. El coste real está en las capas: decodificación de imágenes, canvas y filtros.
12. **Pruebas.**
    - **Reversibilidad:** barrido de bajada y subida por las mismas 41 posiciones, con diferencia máxima del estado = **0** en las 3 microdemos (por construcción, si todo es función de p).
    - Curvas con `curvas_scroll.mjs`.
    - Capturas en los 5 estados.
    - Vídeo con rueda real, bajando y subiendo.
    - Tiempos de fotograma.
    - Reduced motion.

    Herramienta: `integration/tools/medir_escena_scroll.mjs`.
13. **Evidencia.** Microdemos A/B/C, a 1 440 y 375 px: reversibilidad 0, 0 errores, reduced motion activo. Intervalo de fotograma con rueda: p50 16,7 ms y p95 ≤ 16,8 ms en las 6 mediciones; un fotograma > 33 ms en A a 375 px y en C a 1 440 px (máx. 50 ms) [MED, `medicion.json`; Chromium sin interfaz en un contenedor sin GPU, orientativo]. **Mecánica probada; calidad visual no evaluable** (recursos procedurales).
14. **Cómo pedirlo en un proyecto.** "Diseña la escena con el método de estados de MOT-001: entrega los 5 fotogramas clave, la tabla de pistas con mesetas y labels, y la prueba de reversibilidad; después impleméntala con un único timeline de GSAP con `pin` y `scrub` (y `snap` a labels si procede)".

**Movimiento secundario (reglas de esta ficha, aplicadas en las microdemos B y C):**
- **Velocidad según la profundidad:** lejano ×0,6, medio ×1, cercano ×1,6; escala 0,55, 0,85 y 1,35; desenfoque solo en el plano lejano (2–3 px).
- **Entra después y sale antes** que el protagonista.
- **Siempre relacionado con la narrativa:** ingredientes del plato, granos del café; nunca "confeti" decorativo.
- **Ruido orgánico** como función determinista de p (senos con fase por partícula), no aleatorio por fotograma, para que sea reversible.
- **Muelles** (PHYS-001) solo en interacciones (cursor), **no** en lo ligado al scroll: un muelle depende del tiempo y rompe la reversibilidad.
