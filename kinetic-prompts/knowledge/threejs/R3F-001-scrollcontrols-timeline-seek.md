---
id: R3F-001
titulo: Escena 3D guiada por scroll — ScrollControls de drei + timeline de GSAP rebobinada
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-004)
versiones: fuente — three ^0.149, @react-three/fiber ^8.10, @react-three/drei ^9.56, gsap ^3.11.4
perfil: cinematografico
ultima_revision: 2026-10-26
---

# R3F-001 · ScrollControls + timeline.seek()

1. **Nombre y finalidad.** Contar una historia con un modelo 3D que se mueve, gira y se ensambla según el scroll, con paneles HTML sincronizados (tema 13).
2. **Fuente.** Wawa Sensei, `wass08/r3f-scrolling-animation-tutorial` (TUT-004).
3. **Ubicación.** `src/components/Experience.jsx` (ScrollControls con `pages` y `damping`), `Office.jsx` (timeline + `useFrame`), `Overlay.jsx` (`Scroll html` y opacidades por rango).
4. **Resultado.** 3 páginas de scroll: el edificio baja una planta por página, alterna giros, y las plantas superiores entran desde fuera.
5. **Explicación técnica (observada).** Se construye **una sola timeline** con tweens sobre `position`/`rotation` de grupos 3D, usando tiempos absolutos (0, 0,5, 1, 1,5) como guion. En cada frame, `useFrame` hace `tl.seek(scroll.offset × tl.duration())`: el scroll es el cabezal de reproducción y `damping` de ScrollControls aporta la inercia. Los paneles HTML usan `scroll.range(inicio, longitud)` y `scroll.curve(...)` para opacidad.
6. **Dependencias.** @react-three/drei (`ScrollControls`, `Scroll`, `useScroll`), gsap core. **No** usa ScrollTrigger: ScrollControls crea su propio contenedor de scroll.
7. **Procedimiento (adaptación).** Crear la timeline con `paused: true` dentro de un efecto con limpieza (`tl.kill()` o `gsap.context().revert()`); preferir `to()` con valores explícitos sobre `from()` para que sea idempotente en modo estricto; escribir opacidades del DOM vía refs, sin `setState` por frame.
8. **Parámetros.** `pages`, `damping`, duración total de la timeline (unidades arbitrarias), tiempos de cada tramo.
9. **Código (adaptación propuesta; no ejecutada):**
   ```jsx
   const scroll = useScroll(); const tl = useRef();
   useLayoutEffect(() => { tl.current = gsap.timeline({ paused: true }) /* .to(...) */; return () => tl.current.kill(); }, []);
   useFrame(() => tl.current.seek(scroll.offset * tl.current.duration()));
   ```
10. **Problemas habituales.** Timeline sin pausa ni limpieza; `from()` duplicado en modo estricto; `setState` en `useFrame`; OrbitControls compitiendo con el scroll; el contenido HTML dentro de `<Scroll html>` no es el flujo normal de la página (afecta SEO/accesibilidad y anclas).
11. **Rendimiento / a11y.** Comprimir el GLB (4,6 MB en la fuente) con Draco/Meshopt; no servir `.blend`; con reduced motion, mostrar el estado final y paneles estáticos.
12. **Compatibilidad.** WebGL 2 recomendado; probar iOS Safari (gestos y barra de direcciones).
13. **Aplicaciones.** Presentación de edificio/promoción inmobiliaria, producto que se despieza, portfolio 3D.
14. **Pruebas.** Scroll adelante/atrás y salto rápido (seek debe ser determinista); modo estricto; resize; `renderer.info` y memoria (TJ-001).
15. **Estado de evidencia.** Código leído, no ejecutado. Alternativa con ScrollTrigger + Three.js sin React: pendiente (fuente Wael Yasmina o docs).


## Lote 7 — versión escrita del propio autor (dev.to, 2023-02-15, ed. 2023-02-25) — `ARTICULO_AUTOR_ANALIZADO`
Fuente: https://dev.to/wawasensei/scroll-animations-with-react-three-fiber-and-gsap-273j (publicado originalmente en wawasensei.hashnode.dev). Es la versión en texto del vídeo https://youtu.be/pXpckHDDNYo (**vídeo no visto**). Aporta el *porqué* de las decisiones:
- El GLB pesa mucho porque lleva **texturas horneadas** en Blender (luz y sombras precalculadas) → se ve bien con una simple luz ambiental, pero sin ella el modelo sale negro.
- **OrbitControls captura la rueda** y bloquea el scroll: hay que desactivar su zoom (así está en el repo).
- Una "página" de `ScrollControls` = una altura de ventana; con `pages = 3`, el autor diseña la timeline con **1 s por página** (0 s, 1 s, 2 s) para que tiempo de timeline y scroll queden alineados. Es una **convención del autor**, no un requisito (`seek(offset × duración)` funciona con cualquier duración), pero facilita pensar "1 s de timeline = 1 pantalla de scroll" (con 3 páginas hay 2 pantallas de recorrido).
- El edificio se mueve en sentido contrario al scroll porque se anima el modelo, no la cámara.
- `damping 0.25` elegido por el autor "porque funciona bien".
- El artículo contiene erratas de código (llave sin cerrar en un `className`, `class` en lugar de `className`, `fontFamily` mal colocado en Tailwind, `boxBufferGeometry` antiguo): **manda el repo**.
