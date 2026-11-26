---
id: GL-004
titulo: Imagen WebGL ondulada que se expande a pantalla completa con el scroll
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO + ARTICULO_AUTOR_ANALIZADO (TUT-021)
versiones: fuente — @react-three/fiber ^8.16.2, @react-three/drei ^9.105.4, framer-motion ^11.1.5, leva ^0.9.35
perfil: cinematografico
ultima_revision: 2026-10-26
---

# GL-004 · 3D wave on scroll (Olivier Larose)

1. **Nombre y finalidad.** Una foto en un plano 3D con ondas sinusoidales que, al hacer scroll, crece hasta ocupar toda la ventana mientras las ondas se calman (temas 8 y 13).
2. **Fuente.** `olivierlarose/3d-wave-on-scroll` (commit 0ea6d97, 2024-04-19, sin licencia); artículo https://blog.olivierlarose.com/tutorials/3d-wave-on-scroll (18-04-2024). El artículo **no enlaza vídeo** propio.
3. **Ubicación.** `app/page.js` (contenedor 300vh + sticky), `components/Scene.jsx`, `Model.jsx`, `Shader.js`.
4. **Resultado (según código).** Imagen al 30 % del encuadre ondulando; al bajar 2 pantallas se expande a todo el canvas y queda plana.
5. **Explicación técnica [COD].**
   - **Scroll:** contenedor `h-[300vh]` con hijo `sticky top-0 h-screen`; `useScroll({ target, offset: ['start start','end end'] })` da 0→1 a lo largo de 200vh de recorrido.
   - **Geometría:** `planeGeometry(1, 1, 15, 15)`: los segmentos son imprescindibles, el vertex shader solo desplaza vértices.
   - **Vertex shader:** `z += uAmplitude · sin(position.x · uWaveLength + uTime)` (onda que viaja en X).
   - **Escala inicial:** `useAspect(w, h, 0.3)` de drei = tamaño tipo `object-fit: cover` multiplicado por 0,3.
   - **Por frame:** escala X/Y interpolada desde ese valor hasta `viewport.width/height`; amplitud interpolada `0.25 → 0`; `uTime += 0.04`.
   - **Corrección de la textura:** uniform `vUvScale = (1, aspectImagen / aspectPlano)`; en el fragment `uv = (vUv − 0.5)·vUvScale + 0.5` (escala alrededor del centro).
6. **Dependencias.** R3F, drei (`useTexture`, `useAspect`), framer-motion (`useScroll`, `transform`), leva (paneles de ajuste).
7. **Procedimiento profesional (adaptación).**
   1. Tiempo independiente de la tasa de refresco: `uTime += delta` (segundo argumento de `useFrame`).
   2. Corrección *cover* en ambos ejes: si `aspectPlano > aspectImagen` → escalar Y por `aspectImagen/aspectPlano`; si no → escalar X por `aspectPlano/aspectImagen`.
   3. Quitar leva en producción (o cargarlo solo con `?debug`, como Bruno Simon — ARCH-002).
   4. `dynamic(() => import(...), { ssr: false })` para el canvas (ya lo hace el autor) y una imagen `<img>` de respaldo con `alt` para SEO, sin JS y reduced motion.
   5. Con reduced motion: amplitud 0 y sin expansión (o expansión sin ondas).
8. **Parámetros.** Segmentos 15×15; amplitud 0,25 (0–2); longitud de onda 5 (0–20); factor inicial 0,3; incremento de tiempo 0,04/frame.
9. **Código (adaptación propia; no ejecutada):**
   ```js
   useFrame((_, delta) => { mat.uniforms.uTime.value += delta * 2.4; }); // 0,04 × 60 ≈ 2,4 u/s
   ```
10. **Problemas detectados.**
    - [CALC] `uTime += 0.04` por frame → 2,4 u/s a 60 Hz pero 4,8 u/s a 120 Hz: la onda va el doble de rápido en pantallas de 120 Hz.
    - [CALC] La corrección solo actúa en Y: con pantalla vertical (plano más alto que la imagen) `aspectImagen/aspectPlano > 1` → se muestrea fuera de 0–1 y la textura se estira en los bordes (clamp) en lugar de recortar.
    - leva visible en producción; textura sin `colorSpace` explícito (comprobar en la versión de three usada).
11. **Rendimiento / a11y.** 256 vértices: coste mínimo. El coste real es el canvas a pantalla completa (DPR: limitar a 1,5–2). La imagen WebGL no es accesible: duplicar con `<img alt>` oculto visualmente o como respaldo.
12. **Compatibilidad.** WebGL 1/2. `position: sticky` universal.
13. **Aplicaciones.** Hero de producto o de proyecto en portfolio; transición de portada a galería.
14. **Pruebas.** 60 vs 120 Hz (velocidad de la onda); móvil vertical (estiramiento); scroll rápido y vuelta atrás; sin JS.
15. **Estado de evidencia.** Código + artículo leídos; no ejecutado ni medido (panel oculto).
