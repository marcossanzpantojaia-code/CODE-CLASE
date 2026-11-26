---
id: TSL-002
titulo: Materiales procedurales con TSL — vidrio "líquido" falso con SDF, normales por diferencias finitas y refracción con dispersión (caso Codrops)
categoria: threejs
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Codrops, "Building an Infinite Liquid Glass Grid with Three.js, WebGPU, and TSL", Filip Kantedal, 08-09-2026)
versiones: según el artículo — Next.js, React Three Fiber v10, WebGPURenderer, TSL, Motion, vídeo HLS
perfil: cinematografico
ultima_revision: 2026-10-27
---

# TSL-002 · Vidrio procedural sin geometría de vidrio

1. **Finalidad.** Tarjetas con aspecto de cristal biselado (bordes redondeados, relieve, refracción, reflejo, brillo de canto) **en un plano plano** y sin pasada de transmisión — la técnica cuesta poco y escala a cientos de tarjetas (temas 8 y 11).
2. **Fuente.** https://tympanus.net/codrops/2026/09/08/building-an-infinite-liquid-glass-grid-with-three-js-webgpu-and-tsl/ ; demo infinite-jelly-glass.shader.se (no abierta). El artículo **no enlaza repositorio ni licencia** → sin código.
3. **Rejilla "infinita" [artículo].** Rejilla finita que **se envuelve** (lo que sale por un borde entra por el opuesto); coordenadas x/y envueltas proyectadas como distancias sobre una **esfera grande**, con las tarjetas en su superficie mirando hacia fuera → las del centro miran al usuario y las alejadas se inclinan y encogen (profundidad sin cámara compleja).
4. **Material [artículo].**
   1. **SDF de caja redondeada 2D** → distancia al borde de la tarjeta.
   2. Distancia → **mapa de alturas superelíptico** (un exponente controla si el bisel es blando o duro).
   3. **Normales por diferencias finitas:** muestrear la altura un paso pequeño a cada lado → pendiente → normal.
   4. **Refracción** con varias muestras (*taps*) y un índice de refracción ligeramente distinto por canal R/G/B → **dispersión cromática**; la fuente refractada es el **propio vídeo de la tarjeta**, no la pantalla.
   5. **Reflejo** de un mapa de entorno con la dirección de vista reflejada, dosificado con **Fresnel**; `smoothstep` sobre la SDF para un brillo de canto con degradado vertical.
   6. Todo en un `MeshBasicNodeMaterial` con `colorNode` propio → **sin luces** en la escena.
5. **Por qué no `MeshPhysicalMaterial` con transmisión [artículo].** Exige geometría real, escena iluminada y renderizar aparte todo lo que hay detrás; demasiado caro para cientos de tarjetas y además refracta el fondo, no el vídeo de la tarjeta.
6. **Interacción y física [artículo].** Arrastre con Motion (posición y velocidad como *motion values* fuera de React, leídos en el bucle de R3F → sin re-renders). Versión posterior: **simulación de tela en GPU** (XPBD en pasadas compute TSL) con restricciones de distancia y flexión, anclas a la esfera y viscosidad → retardo, ondas y asentamiento.
7. **Rendimiento [artículo].** Una sola pasada, sin posproceso ni render targets; el número de *taps* es un ajuste de calidad (TSL desenrolla los bucles JS al compilar → cambiarlo por dispositivo sin tocar el shader); etiquetas DOM actualizadas con escrituras de estilo directas en el bucle. Al pasar a tela, las etiquetas DOM dejaron de encajar → texto dentro de la escena con `pmndrs/glyph` y fuentes MSDF generadas en build.
8. **Limitaciones.** El artículo asume WebGPU (compute para la tela) y **no describe respaldo** → ver WGPU-001; texto en WebGL no accesible → duplicar en HTML.
9. **Procedimiento para reutilizar las ideas (adaptación propia, no probada).**
   - Botón o tarjeta "cristal" en una landing B: SDF + altura + normal por diferencias + 2–3 taps (calidad baja en móvil).
   - Mantener la escena sin luces cuando el material es "falso" (menos coste).
   - Variante estable en `WebGLRenderer`: las mismas ideas son portables a GLSL en `ShaderMaterial` (GL-001…004).
10–13. **Aplicaciones.** Galerías de proyectos, catálogo de vídeos, héroe de producto.
14. **Pruebas.** FPS con 100/300 tarjetas; calidad de taps por dispositivo; texto accesible; comportamiento sin WebGPU.
15. **Estado.** Solo artículo; no hay código público verificado.
