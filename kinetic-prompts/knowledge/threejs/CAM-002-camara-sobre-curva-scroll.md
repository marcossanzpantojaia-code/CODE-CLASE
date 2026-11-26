---
id: CAM-002
titulo: Cámara (y objeto) que recorren una curva 3D con el scroll, con alabeo en las curvas
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-014)
versiones: fuente — three ^0.150.1, @react-three/fiber ^8.11.5, @react-three/drei ^9.56.28
perfil: cinematografico
ultima_revision: 2026-10-26
---

# CAM-002 · Recorrido sobre spline

1. **Nombre y finalidad.** Narrativa de "viaje": el scroll avanza la cámara por un camino curvo (tema 13). Complementa CAM-001 (posturas discretas) y R3F-001 (timeline rebobinada).
2. **Fuente.** Wawa Sensei, `wass08/r3f-wawatmos-part-1`, `src/components/Experience.jsx` (TUT-014).
3. **Ubicación.** `useMemo` de la curva y de los puntos; `useFrame` de seguimiento.
4. **Resultado.** Avión y cámara avanzan por una cinta blanca entre nubes; el avión se inclina en los giros.
5. **Explicación técnica (observada).** `CatmullRomCurve3` (11 puntos, abierta, tipo "catmullrom", tensión 0,5) → `getPoints(12000)`; en cada frame, índice = `round(scroll.offset × N)`; la posición del grupo cámara+avión se interpola hacia ese punto; el alabeo se calcula con el desplazamiento en x respecto al punto siguiente (× 80, limitado a π/3) y se aplica por `slerp` de cuaterniones al avión (eje z) y a la cámara (eje y). La cinta es una `ExtrudeGeometry` de un perfil 2D a lo largo de la curva.
6. **Dependencias.** three (curvas, cuaterniones), drei `ScrollControls` (pages 5, damping 0.3) o, sin React, ScrollTrigger con `onUpdate`.
7. **Procedimiento (adaptación).** Usar `curve.getPointAt(u)` y `curve.getTangentAt(u)` (parametrización por longitud de arco → velocidad constante) en lugar de un array de 12 000 puntos; reutilizar `Vector3`/`Quaternion`; suavizar con `THREE.MathUtils.damp`; orientar la cámara con `lookAt(punto adelantado)`; cinta con `TubeGeometry` o una línea con pocos segmentos.
8. **Parámetros.** Puntos de control, tensión, nº de páginas de scroll, damping, factor de alabeo (80) y límite (π/3), velocidades de slerp/lerp.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   const p = new THREE.Vector3(), ahead = new THREE.Vector3();
   useFrame((_, dt) => { const u = THREE.MathUtils.clamp(scroll.offset, 0, 0.999);
     curve.getPointAt(u, p); curve.getPointAt(Math.min(u + 0.01, 1), ahead);
     rig.current.position.lerp(p, 1 - Math.exp(-8 * dt)); rig.current.lookAt(ahead); });
   ```
10. **Problemas habituales (vistos).** `getPoints` por *t* (velocidad irregular); geometría de 12 000 pasos; objetos nuevos por frame; factores `delta × k` > 1; modelo de nube de 13,9 MB.
11. **Rendimiento / a11y.** Movimiento de cámara continuo = riesgo vestibular → reduced motion: imágenes fijas por sección o fundidos. Presupuesto de assets (comprimir GLB).
12. **Compatibilidad.** WebGL 2; probar iOS (barra de direcciones y altura de viewport).
13. **Aplicaciones.** Historia de una marca, recorrido por un proceso, ruta de una experiencia turística.
14. **Pruebas.** Velocidad aparente constante (medir distancia recorrida por unidad de scroll), salto rápido al final, resize, FPS móvil, memoria (TJ-001).
15. **Estado de evidencia.** Código leído; la mejora `getPointAt` es análisis propio sobre la API de three.js, sin probar.


## Inspección visual (lote 4) — BLOQUEADA
Demo solo en CodeSandbox (https://codesandbox.io/p/github/wass08/r3f-wawatmos-part-1); no accesible desde esta sesión (mismo bloqueo de red; extensión del navegador no conectada). Nada visto.

## Cálculos derivados del código (NO observados)
Reimplementación propia, en Python, de la fórmula de `CatmullRomCurve3` tipo "catmullrom" (tensión 0,5, extremos extrapolados) con los 11 puntos del repo y 12 000 muestras (no se ejecutó three.js):
- Distancia recorrida por cada 10 % de scroll: 10,01 · 10,20 · 10,08 · 10,48 · 11,19 · 10,25 · 10,25 · 11,21 · 10,04 · 10,00 unidades → **variación de velocidad del 12 %** (más rápida en las curvas cerradas, 40–50 % y 70–80 % del scroll).
- **Corrección de la v0.4.0:** el uso de `getPoints()` sí produce velocidad no uniforme, pero con estos puntos el efecto es **moderado (12 %)**, no grave. `getPointAt()` sigue siendo preferible en curvas con tramos de longitud muy distinta.
- Alabeo máximo calculado: 0,40 rad (**23°**); el límite de π/3 (60°) **nunca se alcanza** en este recorrido: el `Math.min` es inactivo con estos puntos.
- Estados: inicio en (0,0,0) mirando a −z, sin alabeo; intermedio (50 %) cerca de (0,0,−50) tras la curva a la derecha, alabeo máximo; final en (0,0,−100), recto.


## Lote 6 — demo: BLOQUEADA
CodeSandbox (https://codesandbox.io/p/github/wass08/r3f-wawatmos-part-1) mostró una **verificación anti-bots de Cloudflare** ("Verificación de seguridad en curso"). No se intentó eludirla. Registro: [lote 6](../evidence/visual/2026-10-26-lote6/README.md). Sin demo pública alternativa del autor. Los cálculos del lote 4 siguen siendo **[CALC]**, no observados.

## Lote 22 · Trayectoria de cámara dibujada en Blender (Codrops, 07-07-2026) — `ARTICULO_AUTOR_ANALIZADO`
- Fuente: "Building a Scroll-Driven 3D Gallery Using a Blender Camera Path with Three.js and GSAP" (demo tympanus.net/Tutorials/CurveGallery/, código github.com/gaspoorf/curve-gallery; **el artículo no indica la licencia del repositorio** → no copiar código).
- **Blender:** curva Bézier exportada con un **script de Python** que lee los vértices evaluados y escribe JSON, con los ejes recolocados (`[x, z, -y]`, 3 decimales). No usa glTF.
- **Three.js:** `new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5)` (cerrada, tensión 0,5), con escala ×16; `getPoint(t)` / `getTangent(t)`.
- **GSAP:** **Observer** (`wheel,touch,pointer`) en lugar de ScrollTrigger; `SENSITIVITY = 1 / (innerHeight * 4)`; suavizado con `gsap.quickTo(camProxy, 't', { duration: 1, ease: 'power3.out' })`; enfoque por distancia con `quickTo` reutilizado (500 planos, 12 texturas compartidas, DPR ≤ 2).
- **Para "El ritual" [criterio propio]:** si la cámara rodea el producto en **tiempo real**, la trayectoria se puede diseñar en Blender y exportar así. En la prueba del lote 22 se prefiere un render (PROD-001 §7). Observer **secuestra** la rueda: en una web comercial, preferir ScrollTrigger con el scroll nativo.

**Lote 24:** vocabulario de cámara, y diferencia entre 3D real, 2,5D y zoom, en CAM-003.
