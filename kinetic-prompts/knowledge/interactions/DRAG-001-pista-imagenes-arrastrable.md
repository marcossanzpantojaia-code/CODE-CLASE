---
id: DRAG-001
titulo: Pista de imágenes arrastrable con parallax interno (Web Animations API)
categoria: interactions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (código literal, CodePen Hyperplexed/MWXBRBp, MIT)
versiones: JS vanilla + Web Animations API (2022)
perfil: cinematografico (también portfolios comerciales)
ultima_revision: 2026-10-27
---

# DRAG-001 · Sliding image track

1. **Finalidad.** Fila horizontal de imágenes que se arrastra con el ratón o el dedo; mientras avanza, el encuadre de cada imagen se desplaza en sentido contrario (parallax interno) (temas 6, 7, 10).
2. **Fuente.** Hyperplexed, "Sliding Image Track", https://codepen.io/Hyperplexed/pen/MWXBRBp (2022-11-29). Vídeo asociado no visto.
3. **Ubicación.** JS: `handleOnDown/Up/Move`; CSS: `#image-track`, `.image`.
4. **Resultado [COD].** Arrastrar media pantalla recorre el 100 % de la pista; la imagen se reencuadra de `object-position: 100%` a `0%` a lo largo del recorrido; cada movimiento se suaviza con una animación de 1 200 ms.
5. **Explicación [COD].** Se guarda la X del `mousedown`; en `mousemove` el desplazamiento relativo a `innerWidth/2` se convierte en porcentaje (0 a −100) y se suma al porcentaje previo; luego `track.animate({ transform: translate(p%, -50%) }, { duration: 1200, fill: "forwards" })` y, para cada imagen, `animate({ objectPosition: (100 + p)% center })`. Pista con `left: 50%` para que empiece centrada; imágenes 40vmin × 56vmin.
6. **Dependencias.** Ninguna.
7. **Procedimiento para Claude Code.** Reemplazar los ~N animaciones nuevas por evento por un único bucle de interpolación (o `gsap.quickTo` de x y de `objectPosition`), usar Pointer Events con `setPointerCapture`, añadir navegación por teclado (flechas) y botones, inercia opcional (InertiaPlugin/Draggable de GSAP, gratuitos).
8. **Parámetros.** Sensibilidad (`innerWidth/2` = 100 %), suavizado (1 200 ms), tamaño de imagen (vmin), hueco (4vmin).
9. **Código.** Idea en §5 (no se copia literal).
10. **Errores detectados (análisis propio).** Cada `mousemove` crea 1 + N animaciones WAAPI con `fill: "forwards"` que nunca se cancelan → se acumulan objetos de animación durante el arrastre (memoria/CPU); `ontouchend` lee `e.touches[0]`, que en `touchend` es `undefined` (inofensivo aquí porque no se usa); sin teclado ni lector de pantalla; la página bloquea el scroll vertical (`overflow: hidden` en body).
11. **Rendimiento / a11y.** `transform` y `object-position`: barato, pero ver acumulación de animaciones; imágenes grandes de Unsplash (1 770 px) para 40vmin.
12. **Compatibilidad.** Web Animations API universal en navegadores actuales.
13. **Aplicaciones.** Portada de portfolio, galería de proyectos o de tratamientos.
14. **Pruebas.** Arrastre largo (nº de animaciones en `document.getAnimations()`), táctil, teclado, límites 0/−100 %.
15. **Estado de evidencia.** Código literal leído; demo y vídeo no vistos.

## Lote 13 · Alternativa profesional con Draggable de GSAP — `DOCUMENTACION_OFICIAL_ANALIZADA`
Fuente: https://gsap.com/docs/v3/Plugins/Draggable/ (docs v3.15).
- `Draggable.create(target, { type: "x", bounds, inertia: true, snap, edgeResistance })`; `type` admite `"x,y"` (defecto), `"x"`, `"y"`, `"rotation"`, `"left,top"`, `"top"`, `"left"`.
- **Inercia** solo con InertiaPlugin (`inertia: true`; `throwResistance` 1000, `maxDuration` 10 s, `minDuration` 0,2 s, `overshootTolerance` 1; `onThrowUpdate`/`onThrowComplete`). La página de Draggable no lo dice, pero la Skill oficial de GreenSock `gsap-plugins` (repo greensock/gsap-skills, MIT, commit aed9cfd, 2026-04-21) afirma que **todos los plugins son gratuitos, también para uso comercial**, desde la compra de GSAP por Webflow, y pide no configurar el registro privado ni tokens de Club GSAP [COD, lote 14].
- `snap` (al soltar) y `liveSnap` (durante el arrastre; función, array u objeto, `points` + `radius`).
- `allowNativeTouchScrolling: true` (defecto) permite el scroll nativo en el eje contrario → importante para una pista horizontal dentro de una página vertical.
- `dragClickables`: por defecto **no** arrastra desde `a`, `button`, `input`, `select`, `textarea` ni `data-clickable="true"` → los enlaces de la pista siguen funcionando.
- `minimumMovement`: la página da 2 px en un sitio y 3 px en otro (incoherencia de la doc).
- Métodos `enable()`, `disable()`, `kill()`, `update()`, `applyBounds()`; limpiar con `kill()` al desmontar.
- **La doc no trata teclado ni accesibilidad** → añadir botones anterior/siguiente (WCAG 2.5.7, A11Y-006) y el patrón de A11Y-007.
