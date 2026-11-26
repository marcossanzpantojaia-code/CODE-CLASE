---
id: FLIP-001
titulo: Transiciones de layout con GSAP Flip (getState → cambio de DOM → Flip.from)
categoria: transitions
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (docs Flip v3.15) + CODIGO_INSPECCIONADO + DEMO_INSPECCIONADA (Card Stack, CodePen Yzdzxem, lote 5; en el lote 3 solo resumen)
versiones: GSAP 3.15 (docs); Flip existe desde 3.9.0; gratuito
perfil: ambos
ultima_revision: 2026-10-26
---

# FLIP-001 · Flip: animar cambios de layout

1. **Nombre y finalidad.** Animar suavemente un elemento cuando cambia de sitio o tamaño por un cambio de DOM/CSS (filtrar una galería, abrir una tarjeta a pantalla completa, reordenar, mover un elemento de un contenedor a otro). **Tema 8** (transformaciones).
2. **Fuente.** Docs oficiales gsap.com/docs/v3/Plugins/Flip/ (v3.15). Demos oficiales en CodePen (colección "how-to" y Card Stack Yzdzxem). Vídeo oficial en Vimeo (no visto).
3. **Ubicación.** Docs: secciones *Config Object*, *Methods*, *Caveats*.
4. **Resultado.** El elemento parece "viajar" de su posición/tamaño anterior al nuevo, aunque el DOM haya cambiado de golpe.
5. **Explicación técnica (docs).** Técnica FLIP (First, Last, Invert, Play): `Flip.getState(targets)` guarda posición/tamaño/rotación; se cambia el DOM; `Flip.from(state, vars)` aplica el desplazamiento inverso y lo anima hasta cero. Devuelve una timeline. Emparejamiento por `data-flip-id` (o IDs automáticos); dos elementos distintos con el mismo ID se intercambian (con `fade: true`, en fundido).
6. **Dependencias.** `gsap` + `Flip` (`gsap.registerPlugin(Flip)`).
7. **Procedimiento.** (1) `getState` **antes** de cualquier cambio; (2) cambiar clases/DOM; (3) `Flip.from` con `targets` explícitos si un framework re-renderiza; (4) en React, esperar al render (`useLayoutEffect`/`useGSAP` con dependencia del estado) o `Flip.batch`.
8. **Parámetros (docs).** `absolute` (soluciona saltos en flex/grid), `absoluteOnLeave`, `fade`, `nested` (padre e hijo animados), `onEnter`/`onLeave` (elementos que aparecen/desaparecen: los animas tú), `props` (propiedades extra capturadas con `getState(…, {props})`), `prune` (descarta los que no cambian), `scale` (escala en vez de width/height, más rápido), `simple` (sin cálculo de rotación/skew), `spin`, `targets`, `toggleClass`, `zIndex`, más duration/ease/stagger. Métodos: `Flip.to`, `Flip.fit` (encajar un elemento sobre otro), `Flip.batch`, `Flip.makeAbsolute`, `Flip.isFlipping`, `Flip.killFlipsOf`.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   const state = Flip.getState(".gallery__item");
   grid.classList.toggle("is-filtered");
   Flip.from(state, { duration: 0.6, ease: "power2.inOut", absolute: true, stagger: 0.02,
     onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }),
     onLeave: els => gsap.to(els, { opacity: 0, scale: 0.9 }) });
   ```
   Ejemplo oficial (Card Stack, según resumen): al hacer clic se oculta la última tarjeta, se inserta una copia al principio y `Flip.from` con `absolute: true` y `ease: "sine.inOut"` recoloca la pila; `onEnter` sube y funde la nueva (0,3 s, `expo.out`), `onLeave` desplaza y funde la saliente y la elimina al terminar.
10. **Problemas habituales (docs).** Transformaciones 3D (rotationX/Y, z) no soportadas; usar `box-sizing: border-box`; con `absolute`, hacer scroll/resize a mitad de animación puede desviar el recorrido (el estado final es correcto); fijar transforms con GSAP y no con CSS (caché de transforms; `clearProps: "transform"` para limpiarla); en frameworks, los elementos re-renderizados son instancias nuevas → `targets`. Soporte de SVG: la página no lo menciona (sin confirmar).
11. **Rendimiento / a11y.** `scale: true` y `prune: true` reducen coste. Con reduced motion: cambio instantáneo o fundido corto. El orden del DOM debe reflejar el orden visual final (lectores de pantalla y teclado).
12. **Compatibilidad.** Navegadores actuales.
13. **Aplicaciones.** Filtro de servicios/tratamientos, galería que se amplía, carrito que "vuela", pestañas de precios.
14. **Pruebas.** Clics rápidos repetidos (interrumpir flips: `isFlipping`/`killFlipsOf`), resize durante la animación, grid y flex, React con re-render, reduced motion.
15. **Estado de evidencia.** Docs oficiales leídas; demo leída solo como resumen automático. Nada ejecutado.


## Inspección visual (lote 4) — BLOQUEADA (superado: ver lote 5)
demos.gsap.com/demo/card-stack y su CodePen (GreenSock/Yzdzxem): sin acceso desde el navegador de la nube (salida de red bloqueada para demos.gsap.com y codepen.io) ni desde el navegador del usuario (extensión no conectada). El vídeo de vista previa del Demo Hub tampoco se ha visto. Ritmo y easing reales **sin verificar**; solo constan los parámetros del resumen del código (`sine.inOut`; entradas/salidas 0,3 s `expo.out`; duración principal = valor por defecto de Flip, no indicado en el resumen).


## Inspección visual REAL (lote 5, 2026-10-26) — `DEMO_INSPECCIONADA`
Navegador integrado de Cowork; viewport 747×894, DPR 1,5, 60 fps. Evidencia: [evidence/visual/2026-10-26](../evidence/visual/2026-10-26/README.md). **No es el vídeo del tutorial.**

- **Código LITERAL leído** del editor de CodePen (GreenSock/Yzdzxem "Flip Cards", creado 2023-08-18, actualizado 2025-11-23): coincide con el resumen del lote 3. Carga `gsap@3` y `Flip` desde unpkg → en ejecución **gsap 3.15.0 / Flip 3.15.0**. Imágenes con `alt=""`.
- **Medición tras un clic real** (posiciones de cada carta por frame): la carta delantera sale (opacidad 1→0, deriva 15 px a la izquierda y 23 px abajo) y al ~50 % de opacidad en 50 ms (`expo.out` 0,3 s); la nueva carta aparece al fondo subiendo 90 px (de y+90 a y) con opacidad 0→1 en ~0,3 s; las 4 restantes avanzan 20 px en diagonal en **≈0,45–0,5 s** (duración por defecto de GSAP, 0,5 s), con la mitad del recorrido a los 250 ms — compatible con `sine.inOut`.
- **Captura** `FLIP-001_cardstack_tras_1_clic.jpg`: pila de 5 cartas en abanico diagonal; tras un clic la carta "2" pasa al frente.
- **Licencia:** CodePen indica licencia MIT por defecto para pens públicos (según su política; verificar en codepen.io/license).


### Trazabilidad v0.6.1 (corrección tras auditoría)
Etiquetas: **[OBS]** visto en captura · **[MED]** medido en el DOM con datos guardados · **[CALC]** calculado a partir del código o de los datos · **[EST]** estimación (latencia de herramienta, ojo humano) · **[COD]** leído en el código.
- [COD] código literal del pen; [MED] serie de posiciones ([FLIP-001_cardstack_serie.json](../evidence/visual/2026-10-26/data/FLIP-001_cardstack_serie.json)).
- Precisiones sobre lo escrito en el lote 5: la carta saliente está al **36 % de opacidad** (64 % desvanecida) en la primera muestra, ~50 ms después de insertarse la nueva **[MED]**; la recolocación de 20 px está **a mitad (10 px) a los 250 ms** [MED] y **sin cambio de píxel** a partir de los 350–450 ms [MED, posiciones redondeadas]; que la duración sea **0,5 s** es [CALC]: compatible con el valor por defecto de GSAP y `sine.inOut` (a 0,9 de la duración quedan < 0,5 px), no medido directamente.
- [OBS] `FLIP-001_cardstack_tras_1_clic.jpg` muestra el estado tras un clic (carta "2" delante); no hay captura del instante intermedio.
