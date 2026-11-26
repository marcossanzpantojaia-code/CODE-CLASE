---
id: HOV-001
titulo: Botón magnético con gsap.quickTo y relleno circular
categoria: interactions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (perfil Larose, TUT-003) + CODIGO_INSPECCIONADO + DEMO_INSPECCIONADA (perfil GSAP oficial, CodePen azmKBBJ, lote 5)
versiones: fuente — gsap ^3.12.2; docs vigentes 3.15
perfil: ambos
ultima_revision: 2026-10-26
---

# HOV-001 · Botón magnético

> **Dos variantes distintas en esta ficha.** Los campos 1–15 describen la variante de **Olivier Larose** (`awwwards-landing-page`, quickTo, 0,35, 1 s, `elastic.out(1,0.3)`): código leído, **demo no vista, nada medido**. La variante **oficial de GreenSock** (zona de 200 px, `gsap.to` + `overwrite`, 0,4/0,24, 0,4 s `power2.out`, salida 0,7 s `elastic.out(1,0.4)`) está en las secciones del lote 3 y lote 5: código literal leído y **demo medida**. No mezclar sus parámetros.

1. **Nombre y finalidad.** Botón que "atrae" hacia el cursor cuando está encima y vuelve con rebote al salir; al entrar, un círculo de color sube y rellena el fondo (tema 10).
2. **Fuente.** Olivier Larose, `olivierlarose/awwwards-landing-page`: `src/common/Magnetic/index.jsx` y `src/common/RoundedButton/index.jsx` (TUT-003).
3. **Ubicación.** Magnetic (≈30 líneas), RoundedButton (≈40 líneas).
4. **Resultado.** El elemento se desplaza ~35 % de la distancia entre cursor y centro, con ease elástico; relleno circular con salida diferida 300 ms.
5. **Explicación técnica (observada).** Dos funciones `gsap.quickTo()` (x e y) creadas una vez; en `mousemove` se calcula la distancia al centro con `getBoundingClientRect()` y se llama a las funciones; en `mouseleave` vuelven a 0. El relleno es una timeline en pausa con etiquetas `enter`/`exit`: entrar reproduce de `enter` a `exit` (`tweenFromTo`) y salir reproduce el resto tras un `setTimeout`.
6. **Dependencias.** gsap (core).
7. **Procedimiento (adaptación).** Envolver un `<button>`/`<a href>` real; crear quickTo en `useGSAP` con `contextSafe` para los manejadores; retirar listeners al desmontar; activar solo con `(hover: hover) and (pointer: fine)` y sin reduced motion vía `gsap.matchMedia()`.
8. **Parámetros.** Fuerza (0,35), duración (1 s), ease (`elastic.out(1, 0.3)`), retardo de salida (300 ms).
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   const el = document.querySelector(".magnetic"); // <button> o <a href> real
   const mm = gsap.matchMedia();
   mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
     const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1,0.3)" });
     const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1,0.3)" });
     const move = e => { const r = el.getBoundingClientRect();
       xTo((e.clientX - r.left - r.width / 2) * 0.35); yTo((e.clientY - r.top - r.height / 2) * 0.35); };
     const leave = () => { xTo(0); yTo(0); };
     el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
     return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
   });
   ```
10. **Problemas habituales (vistos en la fuente).** Listeners sin retirar; `console.log` olvidado; `div` con `onClick` en lugar de `<button>`; `<a>` sin `href`; `setTimeout` de salida sin cancelar al desmontar.
11. **Rendimiento / a11y.** `quickTo` reutiliza un tween → muy barato. El foco de teclado debe tener estilo visible propio (el efecto no existe con teclado y no debe ser necesario).
12. **Compatibilidad.** Universal; desactivado en táctil por la media query.
13. **Aplicaciones.** CTA "Reservar cita", "Pedir presupuesto".
14. **Pruebas.** Ratón, táctil, teclado (Tab + Enter), reduced motion, desmontaje (sin listeners huérfanos).
15. **Estado de evidencia.** Variante Larose: código leído, no ejecutado, demo no vista. (Variante GSAP: ver lote 5.)

**Contraste con la fuente oficial (lote 3, TUT-017).** GreenSock publica un demo oficial "Magnetic Button — overwrite modes" (CodePen GreenSock/azmKBBJ; en el lote 3 se leyó como resumen automático; **superado en el lote 5 por la lectura literal**). Diferencias de parámetros: fuerza 0,4 (botón) + 0,24 (texto interior, capa de parallax), seguimiento `power2.out` 0,4 s y retorno `elastic.out(1, 0.4)` 0,7 s, frente a 0,35 / 1 s / `elastic.out(1, 0.3)` de Olivier Larose. El objetivo didáctico del demo oficial es el **conflicto de tweens**: si se crea un `gsap.to()` por cada `mousemove`, hay que usar `overwrite: true` o `"auto"` (con `false` los tweens se acumulan). `quickTo` (esta ficha) evita el problema por diseño. Propuesta para la demo experimental: parámetros configurables y dos perfiles ("Larose" y "GSAP oficial").

**Corrección v0.4.0:** el fragmento del campo 9 declaraba `mm` y `el` implícitamente (defecto P5 del informe de validación); ya están declarados.


## Inspección visual REAL (lote 5, 2026-10-26) — `DEMO_INSPECCIONADA`
Navegador integrado de Cowork; viewport 747×894, DPR 1,5, 60 fps. Evidencia: [evidence/visual/2026-10-26](../evidence/visual/2026-10-26/README.md). **No es el vídeo del tutorial.**

- **Código LITERAL leído** de GreenSock/azmKBBJ ("Overwrite / Dynamic Tweens", creado 2026-04-03), ejecutado con **gsap 3.15.1** (build "latest beta"). Corrige/precisa el resumen del lote 3:
  - El listener está en una **zona** de 200×200 px (`.mag-zone`) alrededor del botón, no en el botón: el imán actúa antes de tocarlo. La posición se mapea con `gsap.utils.mapRange(rect.left, rect.right, −w/2, w/2, clientX)`.
  - Botón: `gsap.to(x·0,4, y·0,4, 0,4 s, power2.out, overwrite)`; etiqueta interior: factor 0,24 con `overwrite: true`; salida `elastic.out(1,0.4)` 0,7 s.
  - Semántica demostrada de `overwrite`: `true` mata **todos** los tweens del objetivo (incluido un vaivén de rotación con CustomWiggle); `"auto"` mata solo las propiedades en conflicto (x/y) y conserva el vaivén; `false` (variante con seguimiento de 1,5 s) deja vivo el tween largo, que "recupera" x/y y produce un **salto de vuelta** visible.
- **Medición con puntero real** (botón "DYNAMIC", modo `true`): puntero a (+55, +54) px del centro de la zona → reposo en **x = 22,2, y = 21,8** (= 0,4 × distancia ✓); etiqueta **13,3** (= 0,24 × 55 ✓) sobre el botón → el texto adelanta al botón (paralaje interno). Seguimiento: 33 % a los 50 ms, 87 % a los 200 ms, ~100 % a los 350 ms. Al salir: **sobrepaso a −5,1 px (≈23 % al lado contrario) a los ~85 ms**, segundo rebote +1,5 px a ~235 ms, reposo efectivo a ~400 ms.
- **Capturas** `HOV-001_gsap_overwrite_reposo.jpg` (4 botones; los de vaivén visiblemente girados) y `HOV-001_gsap_boton_atraido.png`.
- **Conclusión para Claude Code:** dos perfiles reproducibles y medidos: "GSAP oficial" (zona de 200 px, 0,4/0,24, 0,4 s power2.out, salida elastic.out(1,0.4) 0,7 s, `overwrite: "auto"` si convive con otras animaciones) y "Larose" (quickTo, 0,35, 1 s elastic.out(1,0.3); este último **no medido**).


### Trazabilidad v0.6.1 (corrección tras auditoría)
Etiquetas: **[OBS]** visto en captura · **[MED]** medido en el DOM con datos guardados · **[CALC]** calculado a partir del código o de los datos · **[EST]** estimación (latencia de herramienta, ojo humano) · **[COD]** leído en el código.
- **Discrepancia 0,15 s vs 0,5 s (modo `overwrite: false`) — resuelta [COD]:** el pen contiene dos cosas distintas: (a) el **texto de ejemplo** que muestra el modal "</>" (`modalSnippets[3]`) usa una salida de **0,15 s**; (b) el **código que se ejecuta** en los botones usa `duration: isFalse ? 0.5 : 0.7` → la salida real del modo `false` es **0,5 s** con `power2.out`. La versión v0.6.0 citaba erróneamente 0,15 s como comportamiento demostrado. El modo `false` **no se midió** con puntero real (solo el botón "DYNAMIC", modo `true`).
- **Medido [MED]** (datos: [HOV-001_gsap_magnetic_serie.json](../evidence/visual/2026-10-26/data/HOV-001_gsap_magnetic_serie.json)): reposo x = 22,2 / y = 21,8 con el puntero a (+55, +54) px; etiqueta 13,3; muestreo cada ~50 ms, por lo que los instantes de pico (−5,1 px a ~85 ms; +1,5 px a ~235 ms) tienen **±25 ms** de incertidumbre y el valor real del pico puede ser algo mayor que el muestreado.
- **[CALC]** 22,2 ≈ 0,4 × 55,4 y 13,3 ≈ 0,24 × 55,4 (distancia horizontal real del puntero).
- **[OBS]** captura `HOV-001_gsap_overwrite_reposo.jpg` (4 botones; los dos de vaivén aparecen girados) y recorte `HOV-001_gsap_boton_atraido.png` (botón desplazado hacia abajo-derecha).
- **No medido:** modos `false` y `"auto"`; la variante de Olivier Larose.
