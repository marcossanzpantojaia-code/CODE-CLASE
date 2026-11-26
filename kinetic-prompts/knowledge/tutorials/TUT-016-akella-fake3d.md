---
id: TUT-016
titulo: Fake 3D Image Effect with WebGL (Codrops, 2019)
creador: Yuri Artiukh (akella)
identidad_verificada: SI (ver TUT-008)
repo: https://github.com/akella/fake3d
commit: c86d190 (2019-02-20)
licencia: licencia Codrops (uso en proyectos sí; redistribuir tal cual no) → solo paráfrasis
video_url: no enlazado
narrado: n/a
transcript_status: n/a (artículo de Codrops INACCESIBLE desde aquí)
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-016 · akella — Falso 3D con mapa de profundidad

1. **Identidad.** Repo de la cuenta verificada; README enlaza artículo y demo de Codrops (tympanus.net/Tutorials/Fake3DEffect/, no inspeccionada).
2. **Qué construye.** Una foto plana que parece tener volumen: al mover el ratón (o inclinar el móvil) las zonas cercanas se desplazan más que las lejanas.
3. **Stack.** **WebGL puro** (sin three.js), gyronorm.js para el giroscopio.
4. **Archivos leídos.** `js/src.js` (276 líneas), `js/shaders/fragment.glsl`, `index.html` (atributos `data-`).
5. **Técnicas extraídas.** → [GL-003](../threejs/GL-003-falso-3d-mapa-profundidad.md). Observado: dos texturas (foto + mapa de profundidad en gris); en el fragment shader se desplazan las UV de la foto en función de `(profundidad − 0,5) × ratón / umbral`; umbrales por atributo (`data-horizontalThreshold` 35, `data-verticalThreshold` 15); UV "espejadas" para no mostrar bordes; ratón suavizado un 5 % por frame; en móvil, inclinación limitada a ±15° normalizada.
6. **Fallos y límites.** `devicePixelRatio` sin límite; render continuo; en iOS 13+ la orientación del dispositivo exige pedir permiso (`DeviceOrientationEvent.requestPermission`), que el código de 2019 no hace (análisis propio; verificar); sin reduced motion; el mapa de profundidad hay que generarlo (herramientas de IA de profundidad o edición manual).
7. **APIs.** WebGL 1; sin dependencias obsoletas salvo gyronorm (sin mantenimiento).
8. **Huecos visuales.** Calidad del efecto según el mapa: demo.
9. **Valor.** A: medio (hero de una clínica o barbería con foto real, muy ligero frente a un modelo 3D); B: alto.
10. **Evidencia.** Código leído. No ejecutado.
