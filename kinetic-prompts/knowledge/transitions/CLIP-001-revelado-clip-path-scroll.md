---
id: CLIP-001
titulo: Revelado de imagen con clip-path inset() ligado al scroll
categoria: transitions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-002)
versiones: fuente — gsap ^3.12.1 + ScrollTrigger; docs vigentes 3.15
perfil: ambos
ultima_revision: 2026-10-26
---

# CLIP-001 · Revelado con clip-path

1. **Nombre y finalidad.** Una imagen de hero que empieza recortada como un marco y se abre a pantalla completa al hacer scroll (tema 9; completa MASK-001, que usaba máscara de logo).
2. **Fuente.** Olivier Larose, `olivierlarose/smooth-scroll`, `src/components/Intro/index.jsx` (TUT-002).
3. **Ubicación.** Componente Intro: timeline con ScrollTrigger sobre el documento, de 0 a +500 px.
4. **Resultado.** Fondo que pasa de `inset(15%)` a sin recorte mientras una imagen central se encoge (altura de ~475 a 200 px) y el titular se mueve con parallax.
5. **Explicación técnica.** Tween `from` de `clipPath` (GSAP interpola los porcentajes de `inset()`), en paralelo (posición 0) con otro tween en la misma timeline; `scrub: true`.
6. **Dependencias.** gsap + ScrollTrigger. CSS `clip-path`.
7. **Procedimiento (adaptación).** Usar el propio hero como `trigger` (no `document.documentElement`), `start: "top top"`, `end: "+=60%"`; animar escalas con `scale` en vez de `height`.
8. **Parámetros.** Recorte inicial (%), `inset(… round 24px)` para esquinas, longitud del scroll, `scrub`.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   gsap.fromTo(".hero__media",
     { clipPath: "inset(15% round 24px)" },
     { clipPath: "inset(0% round 0px)", ease: "none",
       scrollTrigger: { trigger: ".hero", start: "top top", end: "+=60%", scrub: true } });
   ```
10. **Problemas habituales.** Interpolar entre `inset()` con distinto número de valores o con/sin `round` (debe coincidir la forma); animar `height` (layout, como en la fuente) en vez de `scale`.
11. **Rendimiento / a11y.** `clip-path` se repinta pero suele ir fluido en imágenes únicas; evitarlo sobre vídeos grandes en móviles modestos. Reduced motion → estado final directamente.
12. **Compatibilidad.** `clip-path: inset()` soportado en navegadores actuales (verificar `round` en Safari antiguo).
13. **Aplicaciones.** Hero de clínica estética, presentación de local de barbería, portada de proyecto.
14. **Pruebas.** Scroll adelante/atrás, 3 anchos, reduced motion, LCP de la imagen (que no quede oculta al cargar).
15. **Estado de evidencia.** Código leído, no ejecutado.

**Corrección v0.4.0 (defecto P4 del informe de validación).** La versión anterior usaba `from()` hacia el valor natural del elemento, que es `clip-path: none`. Leyendo `CSSPlugin.js` de gsap 3.12.2, el destino `none` no contiene números que interpolar, así que el efecto podría saltar en lugar de animarse (**sin verificar**). Ahora se usa `fromTo` con un destino explícito de la misma forma (`inset(0% round 0px)`). La fuente (TUT-002) usa `from` con `inset(15%)`; comprobar en la demo si allí anima o salta. Prueba añadida: muestrear `getComputedStyle(el).clipPath` al 50 % del recorrido y esperar un `inset` intermedio (~7,5 %).
