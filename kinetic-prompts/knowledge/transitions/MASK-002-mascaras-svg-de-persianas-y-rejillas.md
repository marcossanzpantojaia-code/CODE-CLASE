---
id: MASK-002
titulo: Transiciones con máscaras SVG de persianas y rejillas controladas por scroll (patrón de H. Watanabe, Codrops 2026) — viewBox 0–100, tiras abiertas desde el centro, reconstrucción en resize y COSTURAS de 1 px medidas y corregidas
categoria: transitions
estado: IMPLEMENTADO
evidencia: ARTICULO_AUTOR_ANALIZADO indirecto (tutorial de Hiroki Watanabe en Codrops, 11-03-2026: el original dio error del sitio; leídos dos resúmenes secundarios, engineered.at y abduzeedo.com) + DEMO_INSPECCIONADA propia (evidence/demos/2026-11-01-lote25/pruebas/prueba_mascara_persianas.html, costuras.mjs, costuras.txt, comparacion_costuras.png: 16 combinaciones medidas)
versiones: SVG 1.1 mask; Chromium 153; en el tutorial, GSAP ScrollTrigger + Lenis (según los resúmenes)
perfil: cinematografico (y comercial en transiciones de sección)
ultima_revision: 2026-11-01
---

# MASK-002 · Máscaras SVG de persianas y rejillas

**Clase de evidencia:** caso de experto (R2), leído **a través de resúmenes** (el artículo original no cargó). La técnica se ha **reimplementado y medido** con código propio; no se ha copiado código.

1. **Efecto.** Una imagen o escena aparece sobre otra **por tiras o celdas** que se abren con el scroll: persianas horizontales desde el centro (30 tiras escalonadas de 0,02 en el tutorial), persianas verticales (12), rejilla aleatoria y columnas aleatorias. Es un **corte con intención** (TRN-001 D): no transforma el objeto, pero da ritmo y textura a un cambio de escena.
2. **Cómo funciona.**
   - SVG a pantalla completa con `viewBox="0 0 100 100"` y `preserveAspectRatio="none"` → **unidades virtuales** 0–100 independientes de los píxeles.
   - Una `<mask>` (`maskUnits="userSpaceOnUse"`) contiene N `<rect>` blancos.
   - La escena entrante (imagen o grupo) lleva `mask="url(#m)"`.
   - Cada tira crece desde su centro: `y = c − h·t/2`, `height = h·t`, con `t` = progreso propio escalonado según la distancia al centro.
   - En el tutorial, `scrub` de 2,0–2,5 (estela de inercia) y Lenis; en resize, el ancho virtual se recalcula (`vbWidth` según la proporción) y los timelines se **matan y reconstruyen** (resúmenes).
3. **Cuándo usarlo.** Cambios de escena editoriales (de un acto a otro, o de producto a catálogo) cuando **no hay continuidad de objeto** que mostrar. **No** para transformar un producto (parece un corte).
4. **Recursos.** Las dos escenas finales con calidad C1; la máscara es vectorial (sin coste de recursos).
5. **Tecnologías.** SVG `mask`; GSAP (o funciones de p) para los atributos de los rect; ScrollTrigger con pin y scrub.
6. **Estructura (probada: `prueba_mascara_persianas.html`).**
   ```html
   <svg viewBox="0 0 100 100" preserveAspectRatio="none">
     <defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
       <g id="tiras" fill="#fff" shape-rendering="crispEdges"></g></mask></defs>
     <g mask="url(#m)"> … escena B … </g>
   </svg>
   ```
   ```js
   // t_i = ease(clamp((p − dist_i·0,4) / 0,6)), dist_i = |i − (N−1)/2| / (N/2)  → abre desde el centro
   rect.setAttribute('y', c - (h * t + s) / 2); rect.setAttribute('height', h * t + s);   // s = solape (0,05 unidades)
   ```
   Versión GSAP (DOCUMENTADA, sin ejecutar): `tl.to(rects, { attr: { height: h, y: i => c_i - h/2 }, stagger: { each: .02, from: "center" }, ease: "power2.inOut" })` con `scrollTrigger: { pin, scrub: 1 }`; reconstruir con `callAfterResize` (GS-005).
7. **Parámetros.** Número de tiras o celdas, dirección, escalonado (`from: "center"`, aleatorio), solape `s`, `scrub`.
8. **Problemas visuales — COSTURAS (medidas).** Con las tiras exactamente contiguas y antialias, cada borde fraccionario deja **una línea de 1 px** por la que se ve la escena anterior.

   | Viewport | Sin `crispEdges` ni solape | Con `crispEdges` | Con solape de 0,05 |
   |---|---|---|---|
   | 1 440 × 900 (900/30 = 30 px, entero) | 0 filas | 0 | 0 |
   | **1 366 × 768** (25,6 px por tira) | **14 filas con costura** | 0 | 0 |
   | **375 × 812 @3x** | **12 filas** | 0 | 0 |
   | **390 × 844 @3x** | **14 filas** | 0 | 0 |

   → **Probar siempre en un viewport en el que la altura de la tira no sea entera**, y aplicar `shape-rendering="crispEdges"` **o** un solape de unas centésimas (las dos correcciones lo resolvieron en las 16 combinaciones). Imagen: `comparacion_costuras.png` (izquierda con costuras azules, derecha corregida).
9. **Móvil.** Menos tiras (12–16) para que el escalonado se lea; el tutorial recalcula la geometría en resize.
10. **Reduced motion.** La escena B aparece completa (o con un fundido corto) sin animar las tiras.
11. **Coste.** Bajo: atributos de N rect por fotograma; la máscara se rasteriza cada vez que cambia (con N grande, ≤ 60 tiras o celdas [criterio propio]).
12. **Pruebas.** Detector de costuras de `costuras.mjs`: escena anterior en un color de control (azul puro) y recuento de filas con ese color en p = 1, en 4 viewports y 2 DPR. Vídeo del recorrido; reversibilidad.
13. **Evidencia.** Mi prueba (16 combinaciones) y los resúmenes del tutorial. **No** se ha visto la demo original de Codrops.
14. **Cómo pedirlo.** "Transición de escena con MASK-002 (persianas desde el centro, N = 30): `crispEdges` o solape, prueba de costuras en 1 366 × 768 y 390 × 844 @3x, y reconstrucción en resize".
