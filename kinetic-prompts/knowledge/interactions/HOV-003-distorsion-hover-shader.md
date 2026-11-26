---
id: HOV-003
titulo: Distorsión de imagen al pasar el ratón (pase de postprocesado por velocidad)
categoria: interactions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-008, licencia MIT)
versiones: fuente — three ">=0.102" (2020); APIs a actualizar a three r17x
perfil: cinematografico
ultima_revision: 2026-10-26
---

# HOV-003 · Distorsión hover en WebGL

1. **Nombre y finalidad.** Deformar la imagen bajo el cursor proporcionalmente a la velocidad del ratón (tema 10, variante WebGL).
2. **Fuente.** akella/webgl-mouseover-effects (MIT, © Codrops), `js/scene.js` y `js/post/fragment.glsl` (TUT-008).
3. **Ubicación.** `getSpeed()` y `render()` en scene.js; tres modos en el fragment shader del pase.
4. **Resultado.** Desplazamiento RGB, lupa o granulado alrededor del cursor, que se desvanece al dejar de moverlo.
5. **Explicación técnica (observada).** La escena (planos de imágenes, ver GL-001) se renderiza a textura con `EffectComposer`; un `ShaderPass` recibe `uMouse` (posición suavizada) y `uVelo` (velocidad suavizada y limitada a 0,05). Un círculo suave alrededor de `uMouse` define dónde se desplazan las UV; en el modo "colorful" cada canal se muestrea con un desplazamiento ligeramente distinto.
6. **Dependencias.** three + EffectComposer/ShaderPass (hoy en `three/addons/postprocessing/`).
7. **Procedimiento (adaptación).** Suavizar ratón y velocidad con factor dependiente de `delta`; renderizar solo cuando hay movimiento o velocidad residual; limitar `pixelRatio` a 2.
8. **Parámetros.** Radio del círculo, límite de velocidad (0,05), factor de suavizado (0,1), modo.
9. **Código (fragmento mínimo de la fuente, MIT, © Codrops — idea del suavizado):** la posición seguida se acerca un 10 % por frame al ratón real, y la velocidad objetivo se acerca un 10 % a la velocidad medida; ambas se pasan como uniforms al pase. (Paráfrasis; no se copia el shader.)
10. **Problemas habituales.** Suavizado por frame (depende de los FPS); APIs antiguas (ver TUT-008 §7); render continuo innecesario.
11. **Rendimiento / a11y.** Postprocesado a pantalla completa = coste por píxel; decorativo, sin información; desactivar con reduced motion y en `(hover: none)`.
12. **Compatibilidad.** WebGL 1/2. Ofrecer `<img>` normal como fallback.
13. **Aplicaciones.** Portfolio, landing de moda o producto (perfil B).
14. **Pruebas.** FPS con 1 y 6 imágenes; HiDPI; `renderer.info` tras navegar; reduced motion.
15. **Estado de evidencia.** Código leído, no ejecutado.


## Inspección visual (lote 4) — BLOQUEADA
Demo de Codrops (tympanus.net/Tutorials/webgl-mouseover-effects/step3.html): bloqueada por la salida de red de la sesión (y Codrops ya bloqueaba lectores automáticos en el lote 1). Nada visto.

## Lectura cuantitativa del código (MIT, sin ejecutar)
La velocidad suavizada se limita a 0,05 por frame en el pase de postprocesado; en el modo "zoom" el radio del círculo es 0,1 + 2·velocidad (como máximo 0,2 en UV, es decir, una lupa de hasta un 20 % del ancho de pantalla) y su intensidad 40·velocidad (máx. 2); el seguimiento del ratón se acerca un 10 % por frame (a 60 Hz, ~95 % del camino en ~0,5 s: cálculo propio 1 − 0,9^29 ≈ 0,95). La velocidad residual decae un 0,1 % por frame además del suavizado.
