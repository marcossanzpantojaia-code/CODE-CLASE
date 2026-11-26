---
id: CARD-001
titulo: Pila de tarjetas al hacer scroll (sticky + escala por progreso)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-001, framer-motion); equivalente GSAP = adaptación propuesta
versiones: fuente — framer-motion ^10.16.4, Next 14.0.2; propuesta — gsap 3.15 + ScrollTrigger
perfil: ambos
ultima_revision: 2026-10-26
---

# CARD-001 · Pila de tarjetas con sticky

1. **Nombre y finalidad.** Mostrar N casos/servicios uno por pantalla; cada tarjeta se queda pegada y las anteriores retroceden en escala formando una pila (temas 5 y 6).
2. **Fuente.** Olivier Larose, `olivierlarose/cards-parallax` (TUT-001). Variante GSAP de la misma idea en Codegrid VR-001 (solo metadatos).
3. **Ubicación.** `src/app/page.js` (cálculo de escala objetivo y rango por índice), `src/components/Card/index.jsx` (escala de tarjeta e imagen), `Card/style.module.scss` (sticky).
4. **Resultado.** Tarjetas apiladas con desfase vertical creciente; la de delante a tamaño completo, las de detrás algo más pequeñas; la imagen de cada tarjeta pasa de ampliada a normal al entrar.
5. **Explicación técnica (observada).** El fijado **no usa pin de JS**: cada tarjeta vive en un contenedor de 100vh con `position: sticky; top: 0`, y un `top` extra proporcional al índice crea el escalonado. Un único progreso del contenedor completo (0→1) se reparte: la tarjeta *i* empieza a encogerse en `i/(N−1)` y llega a `1 − (N−i)·0,05`. `transform-origin: top` para que retroceda hacia arriba.
6. **Dependencias.** Fuente: framer-motion (`useScroll`, `useTransform`), Lenis. Propuesta: gsap + ScrollTrigger (o CSS scroll-driven animations donde haya soporte).
7. **Procedimiento (adaptación).** (1) Contenedores sticky en CSS; (2) un ScrollTrigger con `scrub` sobre la lista; (3) por tarjeta, tween de `scale` en una timeline cuyo inicio dependa del índice; (4) derivar el paso de N en vez de un 0,25 fijo; (5) `gsap.matchMedia()` para desactivar en móvil/reduced motion.
8. **Parámetros.** Reducción por tarjeta (0,05), desfase vertical (25 px), escala inicial de imagen (2→1), offsets de inicio/fin.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   const cards = gsap.utils.toArray(".card");
   const tl = gsap.timeline({ scrollTrigger: { trigger: ".cards", start: "top top", end: "bottom bottom", scrub: true } });
   const n = cards.length;
   cards.forEach((card, i) => {
     const start = i / (n - 1);                    // igual que la fuente: rango [i·paso, 1]
     if (i < n - 1) tl.to(card, { scale: 1 - (n - i) * 0.05, ease: "none", duration: 1 - start }, start);
   });                                             // la última tarjeta no se encoge (en la fuente su rango [1,1] es nulo)
   ```
10. **Problemas habituales.** Paso fijo acoplado al número de tarjetas; tamaños fijos en px; un ancestro con `overflow: hidden` anula `sticky`; enlaces mal mapeados (bug real en la fuente: `link` vs `url`).
11. **Rendimiento y accesibilidad.** Solo `transform` → barato. El orden del DOM se mantiene (bien para lectores). Con reduced motion: lista normal sin escala.
12. **Compatibilidad.** `position: sticky` universal en navegadores actuales.
13. **Aplicaciones comerciales.** Servicios de una clínica, casos de éxito de un despacho, catálogo de cortes de una barbería.
14. **Pruebas.** 3 anchos; N = 3, 5, 8 tarjetas; scroll adelante/atrás; enlaces de cada tarjeta; reduced motion; CLS.
15. **Estado de evidencia.** Código de la fuente leído, no ejecutado. Adaptación GSAP sin probar.

**Corrección v0.4.0 (defecto P6 del informe de validación).** El reparto del progreso pasa de `i/N` a `i/(N−1)`, que reproduce el paso de la fuente (0,25 con 5 tarjetas); la última tarjeta no se encoge, igual que en la fuente.
