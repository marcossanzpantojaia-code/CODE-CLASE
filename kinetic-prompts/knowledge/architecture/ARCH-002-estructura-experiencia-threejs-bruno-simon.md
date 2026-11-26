---
id: ARCH-002
titulo: Cómo estructura Bruno Simon una experiencia Three.js completa (folio-2019)
categoria: architecture
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (repo MIT) (TUT-023)
versiones: three ^0.164.1, cannon ^0.6.2, gsap ^3.12.5, howler ^2.2.4, vite ^5.2.11, vite-plugin-glsl
perfil: cinematografico
ultima_revision: 2026-10-26
---

# ARCH-002 · Arquitectura de folio-2019 (Bruno Simon)

1. **Finalidad.** Plantilla mental para organizar un proyecto WebGL grande (portfolio jugable con coche, física, sonido, zonas) sin React: clases con responsabilidades claras y un bus de eventos.
2. **Fuente.** https://github.com/brunosimon/folio-2019 (MIT; commit 540f135, 2024-05-06; 6 808 líneas JS en `src/javascript`). Autor de Three.js Journey (curso de **pago**, INACCESIBLE_POR_COSTE; este repo es la alternativa gratuita). Vídeos: no vistos.
3. **Ubicación.** `src/index.js` → `Application.js`; `Utils/` (Time, Sizes, EventEmitter, Loader), `Resources.js`, `Camera.js`, `World/` (Car, Physics, Controls, Shadows, Objects, Sections/…), `Materials/`, `Passes/`.
4. **Resultado.** El repo es la versión publicada del portfolio de 2019 (no se abrió la demo).
5. **Decisiones técnicas [COD].**
   - **Una clase raíz** `Application` que crea, en orden: `Time`, `Sizes`, `Resources` → config → debug → renderer → cámara → postproceso → mundo. Cada pieza recibe por opciones solo lo que necesita (`time`, `sizes`, `debug`, `config`).
   - **Bus de eventos** propio (`EventEmitter`): `time.on('tick')` y `sizes.on('resize')` sustituyen los listeners repartidos; un solo rAF en `Time`.
   - **Delta acotado:** `Time` limita `delta` a 60 ms → al volver de una pestaña oculta la física no da un salto enorme.
   - **Tamaño real del viewport:** `Sizes` mide un `div` temporal de `100vw × 100vh` (evita discrepancias de `innerHeight` en móvil).
   - **Depuración por URL:** `#debug` crea el panel dat.gui; sin el hash no se carga UI de depuración (también `#cybertruck` como modo oculto).
   - **Manifiesto de recursos:** `Resources` lista texturas/GLB con nombre; el `Loader` emite progreso y fin.
   - **Modelos dobles:** cada objeto tiene `base.glb` (visual) y `collision.glb` (formas simples para cannon) → física barata y visual detallado.
   - **Iluminación falsa:** materiales **matcap** (`ShaderMaterial` con `lights: false`) + uniforms de "luz indirecta" → aspecto iluminado sin coste de luces ni sombras en tiempo real.
   - **Sombras falsas:** planos con material de sombra que siguen al objeto proyectados según un vector "sol" y su altura (`Shadows.js`), en lugar de shadow maps.
   - **Fusión de geometrías por material** (`BufferGeometryUtils.mergeGeometries`) en `Objects.js` → menos draw calls.
   - **Postproceso ligero:** blur horizontal + vertical (desactivado en táctil) y un pase de "glow" radial.
   - Contenedores estáticos con `matrixAutoUpdate = false`.
6. **Dependencias.** three, cannon (física), gsap (transiciones), howler (sonido), dat.gui.
7. **Procedimiento profesional (adaptación).**
   1. Replicar el esqueleto `Experience/Time/Sizes/Resources/World` para cualquier escena seria sin React (o como capa dentro de un componente cliente).
   2. Adoptar matcaps/horneado (ver R3F-001, texturas horneadas de Wawa) y sombras falsas para móviles.
   3. Cambiar `setPixelRatio(2)` fijo por `Math.min(devicePixelRatio, 2)`.
   4. Pausar el `tick` con `visibilitychange` y con reduced motion ofrecer una versión estática/HTML del portfolio.
8. **Parámetros.** Delta máx. 60 ms; DPR 2 fijo; glow `uRadius 0.7`, `uAlpha 0.55`.
9. **Código (MIT, fragmento mínimo de `Utils/Time.js`):**
   ```js
   this.delta = current - this.current; this.current = current;
   if (this.delta > 60) this.delta = 60;
   this.trigger('tick');
   ```
10. **Problemas detectados [COD].** `setPixelRatio(2)` fijo (desperdicio en pantallas 1x, insuficiente en 3x sin límite consciente); `Date.now()` en lugar de `performance.now()`; contenido del portfolio solo en WebGL (SEO/a11y) — el autor no ofrece versión HTML en este repo.
11. **Rendimiento.** Las decisiones de §5 (matcaps, sombras falsas, colisiones simples, fusión, blur desactivado en táctil) son un catálogo de técnicas de rendimiento para móviles.
12. **Compatibilidad.** WebGL; teclado y táctil (`Controls.setTouch()` al primer `touchstart`).
13. **Aplicaciones.** Portfolio interactivo, experiencia de marca, configurador sin React.
14. **Pruebas.** Cambiar de pestaña y volver (delta), móvil gama media, `#debug`.
15. **Estado.** Código leído (estructura, Application, Time, Sizes, Resources, Matcap, Shadows, merge en Objects); no ejecutado; demo no abierta.
