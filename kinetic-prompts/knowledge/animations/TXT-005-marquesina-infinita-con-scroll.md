---
id: TXT-005
titulo: Marquesina de texto infinita que cambia de sentido con el scroll
categoria: animations
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-021)
versiones: fuente — next 13.4.4, gsap 3 (ScrollTrigger)
perfil: ambos
ultima_revision: 2026-10-26
---

# TXT-005 · Infinite text move on scroll (Olivier Larose)

1. **Nombre y finalidad.** Texto gigante ("Freelance Developer –") que se desplaza en bucle; al hacer scroll hacia abajo va en un sentido y hacia arriba en el otro, y además se desliza 500 px durante la primera pantalla (temas 5 y 6).
2. **Fuente.** `olivierlarose/infinite-text-move-on-scroll` (commit 9842aca, 2023-06-18, sin licencia). Artículo/vídeo no consultados en este lote.
3. **Ubicación.** `src/app/page.js`, `page.module.css`.
4. **Resultado (según código).** Banda de texto blanco de 230 px sobre una foto a pantalla completa, moviéndose sin cortes.
5. **Explicación técnica [COD].**
   - **Bucle sin costura:** dos `<p>` idénticos; el segundo `position: absolute; left: 100%` (justo detrás del primero). Ambos reciben el mismo `xPercent`; cuando llega a −100 se reinicia a 0 (y viceversa): el segundo ocupa exactamente el lugar del primero → salto invisible.
   - **Motor:** bucle `requestAnimationFrame` propio que suma `0.1 × direction` a `xPercent` y lo aplica con `gsap.set`.
   - **Dirección:** un ScrollTrigger sobre `document.documentElement` con `onUpdate: e => direction = e.direction * -1`.
   - **Deslizamiento extra:** el mismo ScrollTrigger anima el contenedor `x: -500px` con `scrub: 0.25` entre 0 y `innerHeight`.
6. **Dependencias.** gsap + ScrollTrigger.
7. **Procedimiento profesional (adaptación).**
   1. Usar `gsap.ticker.add(fn)` y `gsap.ticker.deltaRatio()` (o un tween `repeat:-1` con `timeScale` controlado por la dirección/velocidad) en vez de un rAF propio; retirar en la limpieza.
   2. Dentro de `useGSAP`/`gsap.context` para limpiar en React (modo estricto monta dos veces).
   3. Variables de estado en refs, no `let` en el cuerpo del componente (se reinician en cada render).
   4. Segundo texto con `aria-hidden="true"`; texto real legible una vez.
   5. Reduced motion: detener la marquesina (WCAG 2.2.2 si dura > 5 s).
   6. Variante solo CSS para comerciales: CSS-003 (Kevin Powell).
8. **Parámetros.** Velocidad 0,1 % del ancho del texto por frame; scrub 0,25; recorrido extra 500 px; fuente 230 px.
9. **Código.** Sin fragmentos (sin licencia).
10. **Problemas detectados.**
    - [CALC] Velocidad dependiente de los Hz: 6 %/s a 60 Hz, 12 %/s a 120 Hz.
    - [COD] El rAF nunca se cancela → fuga al desmontar; en modo estricto de desarrollo arrancan dos bucles y la marquesina va al doble de velocidad.
    - [COD] `ScrollTrigger` importado desde `gsap/all` (arrastra todos los plugins al bundle; importar `gsap/ScrollTrigger`).
    - [COD] Sin `gsap.registerPlugin` fuera del efecto, sin limpieza del tween.
11. **Rendimiento / a11y.** Solo transform: barato. Texto decorativo gigante: asegurar contraste sobre la foto (overlay).
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** Cinta de servicios ("Corte · Barba · Color –") en una barbería; titular de portfolio.
14. **Pruebas.** 60/120 Hz; desmontar/montar ruta; scroll arriba/abajo cambia el sentido; reduced motion.
15. **Estado de evidencia.** Código leído; no ejecutado ni medido.
