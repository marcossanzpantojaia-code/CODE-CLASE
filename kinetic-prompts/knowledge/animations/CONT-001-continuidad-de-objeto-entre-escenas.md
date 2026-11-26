---
id: CONT-001
titulo: Continuidad del protagonista entre escenas — un solo elemento fijado, dos elementos correlacionados con GSAP Flip, o una secuencia en canvas; coordenadas compartidas, sincronización de capas y transiciones reversibles sin saltos de encuadre
categoria: animations
estado: IMPLEMENTADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (Flip.fit: firma, fitChild, getVars, scale, absolute, simple — gsap.com, 2026-11-01; FLIP-001/002) + DEMO_INSPECCIONADA propia (microdemo A: jarra fijada + chorro dibujado entre coordenadas de pantalla de dos capas; reversibilidad 0) + VIDEO_INSPECCIONADO (CASE-003 R1 3,5–9,5 s, patrón P10)
versiones: GSAP 3.15 (Flip); Chromium 153
perfil: cinematografico
ultima_revision: 2026-11-03
---

# CONT-001 · Continuidad de objeto

**Estado por niveles:**
- **DOCUMENTADO:** Flip.fit / getVars.
- **IMPLEMENTADO y PROBADO:** la estrategia 1 (un elemento fijado y un conector entre capas, en la microdemo A).
- **NO VERIFICADO:** las estrategias 2 (Flip con scroll) y 3 (canvas; ver SEQ-001).
- **VISUALMENTE VALIDADO:** no.

1. **Efecto.** El protagonista **no se corta** al cambiar de sección. Cambian el fondo, el texto y la composición, pero el ojo sigue el mismo objeto. Ejemplo de la referencia: en POUR/PLAY, el chorro de café une el gotero de la sección 1 con la taza de la sección 2 mientras el contenido sube (CASE-003, R1 3,5–4,5 s).
2. **Cómo funciona — tres estrategias.**
   | Estrategia | Mecanismo | Cuándo |
   |---|---|---|
   | **1 · Un solo elemento DOM fijado** | El objeto vive en un escenario `sticky`/pinned; las secciones "pasan" por detrás (fondos, textos) y el objeto solo cambia de transform (x, y, escala, rotación) según p | El objeto **conserva su forma** (jarra, frasco, plato); es lo más simple y robusto |
   | **2 · Dos elementos correlacionados con Flip** | El objeto tiene un **hueco** (placeholder) en cada maquetación; `Flip.fit(obj, hueco, { getVars: true, scale: true })` devuelve x, y, scaleX, scaleY y rotation para encajarlo → se usan como claves de un timeline con scrub | El objeto **cambia de maquetación** (de héroe a tarjeta o a columna) y el destino lo decide el layout (responsive) |
   | **3 · Secuencia en canvas** | Fotogramas prerenderizados en los que la forma cambia (SEQ-001/002) | El objeto **cambia de forma o de material** (granos → gotero, gota → partículas) |
3. **Cuándo usar cada una.** Regla: **¿cambia la forma del objeto?** → 3. **¿Cambia solo de sitio o de tamaño, y el destino depende del layout?** → 2. **¿Cambia solo de sitio dentro de un escenario fijo?** → 1. Se combinan: el canvas de la 3 suele vivir dentro de un escenario de la 1.
4. **Recursos.** 1–2: una imagen o SVG con alfa del objeto (con calidad C1). 3: una secuencia (SEQ-002).
5. **Tecnologías.** CSS `position: sticky`, GSAP ScrollTrigger (pin/scrub), Flip (`fit`, `getState`), canvas 2D.
6. **Estructura.**
   - **Coordenadas compartidas:** todas las capas de la escena se posicionan en el **mismo sistema** (el escenario de 100vw × 100vh). Para unir dos capas (pico de la jarra → boca de la taza), se leen sus puntos con `getBoundingClientRect()` **en cada fotograma** y se dibuja el conector (SVG) en una capa superior. Así se hizo en la microdemo A.
   - **Estrategia 2 (DOCUMENTADO, sin ejecutar):**
   ```js
   // Construir con el objeto en su estado natural; reconstruir al cambiar de layout (matchMedia/resize).
   function construir() {
     gsap.set(obj, { clearProps: "transform" });
     const a = Flip.fit(obj, "#hueco-1", { getVars: true, scale: true });   // encaje en la escena 1
     const b = Flip.fit(obj, "#hueco-2", { getVars: true, scale: true });   // encaje en la escena 2
     return gsap.timeline({ scrollTrigger: { trigger: "#acto", start: "top top", end: "+=200%", pin: "#escenario", scrub: 0.5 } })
       .fromTo(obj, a, { ...b, ease: "power2.inOut" });
   }
   let tl = construir();
   addEventListener("resize", () => { tl.scrollTrigger.kill(); tl.kill(); tl = construir(); });   // o gsap.matchMedia
   ```
   La doc de `Flip.fit` dice que `getVars` "returns a vars object" con x, y, scaleX, scaleY, rotation y skewX, y que `scale: true` "typically performs better". **La doc no muestra la combinación con scrub**: es una adaptación propia.
7. **Parámetros.** Claves de posición y escala por estado; `transform-origin` (en la jarra, el 30 %/20 %, junto al asa, para que la inclinación parezca natural); `scrub`; *easing* `inOut` en los cambios de estado y `none` en lo que sigue al dedo.
8. **Problemas visuales.**
   - **Salto de encuadre:** el objeto cambia de tamaño y de posición a la vez y deprisa. Regla: en cada tramo, cambiar **o** el tamaño **o** la posición, o hacerlo despacio (≥ 15 % del recorrido).
   - **Desincronización entre capas** (el conector no coincide con el objeto): calcular en el mismo fotograma, después de aplicar las transformaciones.
   - **Doble objeto:** en la estrategia 2, el hueco debe estar oculto (`visibility: hidden`) para no verse duplicado.
   - **Coordenadas obsoletas tras redimensionar:** reconstruir.
   - **Reversibilidad rota** por animaciones con tiempo (`toggleActions`, muelles) mezcladas con el scrub.
9. **Móvil.** Otra tabla de claves (microdemo A: la jarra pasa del 58 % al 40 % en x). El objeto se mantiene grande (≥ 50 % del ancho); el texto, arriba y sin solaparse.
10. **Reduced motion.** Sin pin: la composición de cada estado clave se muestra estática; el conector (chorro) se omite (microdemo A: `.rm`).
11. **Coste.** Estrategia 1: transformaciones con compositor; script p95 1,3 ms [MED, microdemo A]. Estrategia 2: igual tras construir. Estrategia 3: decodificación y memoria (SEQ-002).
12. **Pruebas.**
    - Reversibilidad (`medir_demo.mjs`).
    - El conector toca los dos extremos en los 41 pasos: en el estado de la microdemo A se registran `pico[x,y]` y el trazo.
    - Capturas en los 5 estados.
    - Vídeo bajando y subiendo (`evidence/demos/2026-11-01-lote24/receta_a_continuidad/mosaico_video_1440.jpg`).
13. **Evidencia.** Microdemo A: reversibilidad 0 a 1 440 y 375 px, 0 errores, reduced motion correcto. Recursos procedurales, así que **sin evaluación C1/C3**.
14. **Cómo pedirlo.** "Mantén el protagonista con CONT-001: indica qué estrategia (1, 2 o 3) y por qué, entrega la tabla de claves por estado (escritorio y móvil), el punto de unión entre capas si lo hay y la prueba de reversibilidad".

## Lote 28 · Flip.fit con fitChild (vídeo oficial de GreenSock YftYHkS5Dao, 7:20–17:20, y Flip.js 3.15.0) — PROBADO
- **`Flip.fit(contenedor, destino, { fitChild: hijo, scale: true, getVars: true })`** devuelve `x`, `y`, `scaleX` y `scaleY` para que el **hijo** del contenedor (p. ej., el marcador del nido de pasta) encaje en el destino (el nido del plato).
  - Contempla rotaciones y transformaciones anidadas.
  - Con `getVars` no aplica nada: los valores se usan en las pistas del timeline, como valores en función recalculados en el refresh.
- **Restricciones** (leídas en `_fit` de Flip.js):
  - el hijo debe estar **dentro** del elemento animado (un `<img>` no puede: envolverlo en un `div`);
  - la escala es ancho de destino / ancho del hijo y alto de destino / alto del hijo → los marcadores deben tener **la misma proporción** (cuadrados) para que la escala sea uniforme.
- **Medido en REC-003** (aterrizaje del héroe con fixtures): error de alineación **0,6–1,25 px** con Flip y **0,25–0,62 px** con el cálculo manual del lote 27, a 1 440 y 375 px y tras resize. **Equivalentes.**
  - **Usar Flip.fit cuando haya rotaciones o anidamiento** (el cálculo manual no los contempla); con traslación y escala basta el manual.
- **Relevo entre recursos distintos:** dos elementos con el mismo `data-flip-id` + `Flip.from(estado, { targets: grande, fade: true, absolute: true })` animan el recurso nuevo desde la posición y el tamaño del anterior, con fundido cruzado.
  - Es la versión de GSAP del "relevo con silueta coincidente" de REC-003 cuando el cambio es **por evento** (clic o estado), no por scroll.
- Código de la prueba: `evidence/youtube/2026-11-03-lote28/fase4/index_flip.html`. Fuente: `integration/YOUTUBE_ESTUDIOS.md` y `evidence/youtube/2026-11-03-lote28/`.
