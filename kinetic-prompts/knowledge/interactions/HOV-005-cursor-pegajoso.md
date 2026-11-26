---
id: HOV-005
titulo: Cursor personalizado "pegajoso" que se imanta, estira y gira hacia un elemento
categoria: interactions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO + ARTICULO_AUTOR_ANALIZADO (TUT-021)
versiones: fuente — next 13.4.19, react 18.2.0, framer-motion ^10.16.4
perfil: ambos (comercial con moderación)
ultima_revision: 2026-10-26
---

# HOV-005 · Sticky cursor (Olivier Larose)

1. **Nombre y finalidad.** Sustituir el puntero por un círculo que sigue al ratón con muelle y, al pasar sobre un elemento (p. ej. el botón hamburguesa), crece, se centra en él con una ligera atracción hacia el puntero y se deforma en la dirección del movimiento (tema 2, ratón).
2. **Fuente.** Olivier Larose, repo `olivierlarose/sticky-cursor` (commit 06efcb6, 2023-09-24, sin licencia) y artículo https://blog.olivierlarose.com/tutorials/sticky-cursor (24-09-2023). Vídeo enlazado por el autor: https://www.youtube.com/watch?v=MJ_cRRqBfU8 (**no visto**).
3. **Ubicación.** `src/components/stickyCursor/index.jsx` (cursor), `components/magnetic/index.jsx` (botón magnético reutilizado), `components/header/index.jsx` (`forwardRef` del área sensible).
4. **Resultado (según código y artículo, no observado).** Punto negro de 15 px que persigue al ratón; sobre el botón crece a 60 px, se queda en su centro desplazándose un 10 % hacia el puntero, se alarga (hasta 1,3 en X y 0,8 en Y) y se orienta hacia el puntero.
5. **Explicación técnica [COD].**
   - Posición en `useMotionValue` (sin re-render) suavizada con `useSpring` {damping 20, stiffness 300, mass 0.5}; se resta la mitad del tamaño para centrar.
   - Al entrar en el elemento: centro = `getBoundingClientRect()`; distancia = puntero − centro; posición = centro + distancia × 0,1 (la "atracción").
   - Estiramiento: `transform(max(|dx|,|dy|), [0, alto/2], [1, 1.3])` para scaleX y `[0, ancho/2] → [1, 0.8]` para scaleY.
   - Giro: `atan2(dy, dx)` en radianes, aplicado sin duración.
   - `transformTemplate` fuerza el orden `rotate → scaleX → scaleY`; así el estiramiento sigue la dirección del giro (el autor lo explica en el artículo).
   - El área sensible (`.bounds`) es un elemento propio, más grande que el icono, para que el `mouseleave` no se dispare demasiado pronto.
6. **Dependencias.** framer-motion (`useMotionValue`, `useSpring`, `transform`, `animate`).
7. **Procedimiento profesional (adaptación).**
   1. Activar solo con `matchMedia('(hover: hover) and (pointer: fine)')` y sin `prefers-reduced-motion: reduce`.
   2. Un único listener `pointermove` registrado una vez; guardar el estado "hover" en una ref (no en el array de dependencias).
   3. Mantener el cursor nativo visible o, si se oculta, ocultarlo solo dentro de la zona decorativa; nunca en formularios.
   4. Al salir, devolver escala **y giro** a 0.
   5. Alternativa sin framer: `gsap.quickTo` (HOV-001).
8. **Parámetros.** Tamaño 15/60 px; muelle 20/300/0,5; atracción 0,1; rangos de estiramiento 1→1,3 / 1→0,8; botón magnético interno con muelle {stiffness 350, damping 5, mass 0.5} y factor 0,1.
9. **Código.** Sin fragmentos (repo sin licencia). Nombres de API en §5.
10. **Problemas detectados [COD].**
    - `useEffect` depende de `isHovered`: los tres listeners se quitan y se vuelven a poner en cada entrada/salida.
    - La limpieza lee `stickyElement.current`, que puede ser `null` al desmontar.
    - `animate(..., {duration: 0.1}, {type: "spring"})`: el 4.º argumento no existe en framer-motion → se ignora (el artículo lo reproduce).
    - El giro no se restablece al salir.
    - Rangos de estiramiento usan alto/2 para X y ancho/2 para Y (cruzados); con un elemento cuadrado no se nota.
    - Se monta también en táctil; sin reduced motion.
11. **Rendimiento / a11y.** Solo transforms y `left/top` vía motion values (left/top provocan layout; preferir `x/y`). El cursor es decorativo: `aria-hidden`, `pointer-events: none`. No debe tapar el foco de teclado.
12. **Compatibilidad.** Cualquier navegador con Pointer Events; inútil en táctil.
13. **Aplicaciones.** Portfolio, agencia, menú hamburguesa de una web creativa; en comercial, solo como detalle en el CTA principal.
14. **Pruebas.** Entrar/salir rápido del botón; tabular por la página (el cursor no debe confundir); resize con el cursor encima; 120 Hz.
15. **Estado de evidencia.** Código y artículo leídos; **no ejecutado ni medido** (panel del navegador oculto en el lote 8). Vídeo no visto.
