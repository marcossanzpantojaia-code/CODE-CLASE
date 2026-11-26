---
id: TUT-005
titulo: React Three Fiber — 3D Table Configurator
creador: Wawa Sensei (Wassim Samad)
identidad_verificada: SI
repo: https://github.com/wass08/table-configurator-three-js-r3F-tutorial-final (starter: ...-starter)
commit: c0ee744 (2024-05-17)
licencia: ninguna declarada → no reproducir código
video_url: https://www.youtube.com/watch?v=wW0XwNhrDFQ (embebido en wawasensei.dev; NO visto)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-005 · Wawa Sensei — Configurador de mesa 3D

1. **Identidad.** wawasensei.dev/tuto/react-three-fiber-tutorial-table-configurator enlaza los repos starter y final, la demo en CodeSandbox y el vídeo.
2. **Qué construye.** Configurador de producto: una mesa 3D con panel lateral (ancho por deslizador, tres tipos de patas, cuatro acabados de color). El tablero se estira y las patas se desplazan suavemente al cambiar el ancho; el color cambia el material metálico.
3. **Stack.** three 0.153.0, @react-three/fiber 8.13.3, @react-three/drei 9.75.0 (`Stage` con sombras acumulativas, `OrbitControls`, `useGLTF`), MUI 5 (interfaz), React 18 con Context para el estado.
4. **Archivos leídos.** `App.jsx`, `components/Experience.jsx`, `Interface.jsx`, `Table.jsx`, `contexts/Configurator.jsx`, `index.css`. Modelo `Table.gltf` **8,3 MB** en formato `.gltf` con el buffer incrustado en base64 (≈33 % más pesado que un GLB).
5. **Técnicas extraídas.** → [CFG-001](../threejs/CFG-001-configurador-producto-r3f.md): estado del configurador en un Context compartido entre el canvas y la interfaz HTML; variantes de geometría por renderizado condicional; interpolación por frame hacia valores objetivo. **Tema 12** (producto 3D interactivo).
6. **Fallos detectados.**
   - `Table.jsx`: crea `Vector3` nuevos en cada frame (presión sobre el recolector de basura) y usa `lerp` con factor `delta × 12`, que puede superar 1 en frames lentos (sobrepaso). Alternativa: `THREE.MathUtils.damp` o `maath/easing`.
   - El color se aplica sustituyendo `material.color` por un objeto nuevo y **muta el material cacheado de `useGLTF`**: cualquier otra instancia del modelo cambiaría también.
   - `Experience`: se suscribe a `legs` solo para forzar el re-render de las sombras (truco documentado en un comentario).
   - `Interface`: lee `window.innerWidth` en el estado inicial (rompe en SSR) y `user-select: none` global en `index.css`.
   - Sin optimización de assets (Draco/Meshopt, KTX2) ni estados de carga.
7. **APIs.** R3F 8 / drei 9 (2023-24). Verificar `Stage`/`AccumulativeShadows` en drei actual.
8. **Huecos visuales.** Calidad de iluminación y sombras: requiere demo.
9. **Valor por perfil.** B: alto (base de configuradores de coche, mueble, producto). A: medio (catálogos premium).
10. **Evidencia.** Lectura de código. No ejecutado. Vídeo no visto.
