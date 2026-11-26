---
id: CFG-001
titulo: Configurador de producto 3D (estado compartido canvas ↔ interfaz)
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-005)
versiones: fuente — three 0.153.0, @react-three/fiber 8.13.3, @react-three/drei 9.75.0, MUI 5
perfil: cinematografico (también comercial en catálogos premium)
ultima_revision: 2026-10-26
---

# CFG-001 · Configurador de producto

1. **Nombre y finalidad.** Permitir al usuario cambiar medidas, variantes y acabados de un producto 3D y verlo en tiempo real (tema 12).
2. **Fuente.** Wawa Sensei, `wass08/table-configurator-three-js-r3F-tutorial-final` (TUT-005).
3. **Ubicación.** `contexts/Configurator.jsx` (estado), `components/Interface.jsx` (controles), `Table.jsx` (aplicación al modelo), `Experience.jsx` (Stage + OrbitControls).
4. **Resultado.** Ancho continuo con animación suave del tablero y las patas; 3 variantes de patas; 4 colores.
5. **Explicación técnica (observada).**
   - **Estado:** un Context con `legs`, `legsColor`, `tableWidth` envuelve a la vez el `<Canvas>` y la interfaz HTML.
   - **Variantes:** el GLTF contiene todas las geometrías; se renderiza solo la variante elegida (renderizado condicional).
   - **Medidas:** cada frame se interpola la escala del tablero y la posición de las patas hacia el objetivo.
   - **Acabado:** se cambia el color del material metálico compartido.
   - **Presentación:** `Stage` de drei con entorno "city" y sombras acumulativas; OrbitControls con ángulo polar limitado para no ver por debajo del suelo.
6. **Dependencias.** R3F, drei, una librería de UI (MUI en la fuente; cualquiera accesible sirve).
7. **Procedimiento (adaptación).** Estado en un store (Context, Zustand o URL para compartir configuraciones); `THREE.MathUtils.damp` con objetos reutilizados; clonar el material antes de modificarlo y usar `color.set()`; comprimir el modelo (GLB + Draco/Meshopt, texturas KTX2); mostrar progreso de carga; renderizado bajo demanda (`frameloop="demand"`) cuando no hay animación.
8. **Parámetros.** Rango de medidas (50–200 en la fuente), velocidad de interpolación, paleta de acabados, límites de órbita.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   useFrame((_, dt) => {
     const s = width / 100;
     plate.current.scale.x = THREE.MathUtils.damp(plate.current.scale.x, s, 8, dt);
     left.current.position.x = THREE.MathUtils.damp(left.current.position.x, -1.5 * s, 8, dt);
   });
   ```
10. **Problemas habituales (vistos).** Objetos nuevos por frame; `lerp` con factor > 1 en frames lentos; mutación del material cacheado; `.gltf` con buffer en base64 (8,3 MB); leer `window` en el estado inicial (SSR).
11. **Rendimiento / a11y.** Controles con etiquetas y teclado (los radios/sliders nativos o de MUI lo resuelven); anunciar el cambio de configuración en texto (precio, medidas) fuera del canvas.
12. **Compatibilidad.** WebGL 2; probar GPUs integradas y móviles.
13. **Aplicaciones.** Muebles, coches (color, llantas), joyería, packaging.
14. **Pruebas.** Cambios rápidos repetidos; FPS a 30 y 60 Hz; memoria tras 50 cambios de variante; carga en 4G simulada; teclado.
15. **Estado de evidencia.** Código leído, no ejecutado.
