---
id: OBS-001
titulo: Secciones a pantalla completa que cambian con un gesto (GSAP Observer + SplitText)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (CodePen oficial de GreenSock, MIT) + DOCUMENTACION_OFICIAL_ANALIZADA (Observer)
versiones: GSAP 3.10+ (Observer), SplitText
perfil: cinematografico (comercial: solo landing de campaña)
ultima_revision: 2026-10-26
---

# OBS-001 · "Animated continuous sections" con Observer

1. **Nombre y finalidad.** Presentación tipo diapositivas: cada gesto de rueda, toque o arrastre pasa a la sección siguiente/anterior con un "telón" que se abre, parallax de la foto y letras que caen en orden aleatorio. No hay scroll nativo (tema 13).
2. **Fuente.** Pen oficial https://codepen.io/GreenSock/pen/XWzRraJ (basado en https://codepen.io/BrianCross/pen/PoWapLP; versión horizontal https://codepen.io/GreenSock/pen/xxWdeMK). Licencia: MIT (pens públicos de CodePen). Docs: https://gsap.com/docs/v3/Plugins/Observer/. Código leído literal el 2026-10-26 (JS y CSS).
3. **Ubicación.** JS del pen (≈70 líneas) y CSS.
4. **Resultado.** 5 secciones fijas superpuestas; transición de 1,25 s con la nueva sección deslizándose desde abajo (o arriba) y el titular entrando letra a letra.
5. **Explicación técnica [COD].**
   - **Estructura:** cada `section` es `position: fixed; visibility: hidden` con `.outer > .inner > .bg > h2`. `.outer` y `.inner` tienen `overflow: hidden`.
   - **Telón por contra-desplazamiento:** estado inicial `outer yPercent: 100`, `inner yPercent: −100`. Al entrar, ambos van a 0 a la vez: el exterior sube y el interior baja lo mismo → el contenido parece quieto mientras el borde de la máscara lo descubre (revelado sin `clip-path`).
   - **Salida:** la imagen saliente se desplaza `yPercent: −15·d` y después `autoAlpha: 0`; la entrante va de `15·d` a 0 (parallax), `d` = dirección.
   - **Titular:** `SplitText` en chars/words/lines con `linesClass: "clip-text"` (overflow hidden por línea); chars de `yPercent: 150·d, autoAlpha: 0` a 0, `duration 1, ease "power2", stagger { each: 0.02, from: "random" }`, en t = 0,2 s.
   - **Timeline:** `defaults { duration: 1.25, ease: "power1.inOut" }`; bandera `animating` = true hasta `onComplete` (no se encolan gestos).
   - **Bucle:** `gsap.utils.wrap(0, n)` → de la última se pasa a la primera.
   - **Entrada de gestos:** `Observer.create({ type: "wheel,touch,pointer", wheelSpeed: -1, onDown: anterior, onUp: siguiente, tolerance: 10, preventDefault: true })`. `wheelSpeed: -1` invierte el sentido para que "rueda hacia abajo" = siguiente.
6. **Dependencias.** gsap, Observer (o `ScrollTrigger.observe()`, idéntico, si ya se carga ScrollTrigger), SplitText.
7. **Procedimiento profesional (adaptación).**
   1. Añadir teclado: ↑/↓, PageUp/PageDown, Espacio, Inicio/Fin → mismas funciones.
   2. Indicador de posición y botones visibles (no depender solo del gesto).
   3. Sincronizar `location.hash` para enlazar cada sección y mantener el botón Atrás.
   4. Contenido SEO completo también en HTML normal (cada sección es un `<section>` con su `h2`); `visibility: hidden` ya las oculta a lectores de pantalla salvo la actual: anunciar el cambio con una región `aria-live="polite"` discreta.
   5. Reduced motion: fundido corto sin letras ni parallax.
   6. Móvil: el pen bloquea el gesto nativo (`preventDefault`); comprobar que no atrapa a usuarios que esperan desplazarse a un formulario.
   7. `SplitText` debe revertirse/rehacerse al redimensionar si se parte en líneas (o usar `autoSplit` en versiones recientes — comprobar en docs).
8. **Parámetros.** Duración 1,25 s; ease power1.inOut; parallax 15 %; letras 150 %, stagger 0,02 aleatorio, inicio 0,2 s; tolerancia 10 px.
9. **Código (MIT, fragmento mínimo):**
   ```js
   Observer.create({ type: "wheel,touch,pointer", wheelSpeed: -1, tolerance: 10, preventDefault: true,
     onDown: () => !animating && gotoSection(currentIndex - 1, -1),
     onUp:   () => !animating && gotoSection(currentIndex + 1,  1) });
   ```
10. **Problemas detectados [COD].** Sin teclado ni botones; `user-select: none` global; `*` con `will-change` en todas las letras del h2 (capas de más); titular en mayúsculas por CSS (ok) pero texto en `h2` sin `h1` en la página; el usuario no puede saltar secciones.
11. **Rendimiento / a11y.** Todo transform/opacity; 5 imágenes de fondo a pantalla completa → precargar la siguiente, `background-image` sin `alt` (decorativas; el contenido va en texto). WCAG 2.1.1 (teclado) incumplido tal cual.
12. **Compatibilidad.** Universal (Pointer/Touch/Wheel Events).
13. **Aplicaciones.** Landing de campaña, presentación de proyecto, portfolio "diapositivas". **No** para la web principal de una clínica o despacho (rompe el scroll esperado).
14. **Pruebas.** Rueda de ratón, trackpad (inercia: no debe saltar 2 secciones — `tolerance` + bandera), táctil, teclado, lector de pantalla, resize durante la transición.
15. **Estado de evidencia.** Código literal leído; **no ejecutado ni medido** (panel oculto).
