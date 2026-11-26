---
id: GL-003
titulo: Falso 3D en una foto con mapa de profundidad (desplazamiento de UV)
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-016; licencia Codrops)
versiones: fuente — WebGL 1 puro (2019), gyronorm.js
perfil: ambos
ultima_revision: 2026-10-26
---

# GL-003 · Fake 3D con depth map

1. **Nombre y finalidad.** Dar volumen a una fotografía real con un coste mínimo (una foto + un mapa de profundidad) en lugar de un modelo 3D (temas 11 y 12 "ligeros").
2. **Fuente.** akella/fake3d (TUT-016), `js/src.js`, `js/shaders/fragment.glsl`.
3. **Ubicación.** Fragment shader (cálculo `fake3d`), métodos `mouseMove`, `gyro`, `render`.
4. **Resultado.** Paralaje interno: los píxeles "cercanos" se mueven más que los lejanos al mover el ratón o inclinar el móvil.
5. **Explicación técnica (observada).** Se muestrea el mapa de profundidad (canal rojo) y se desplazan las UV de la foto en `(d − 0,5) × ratón / umbral` por eje; el resultado se muestrea con UV "espejadas" para evitar bordes vacíos. Umbrales configurables por atributo (35 horizontal, 15 vertical). Entrada suavizada al 5 % por frame; en móvil, inclinación ±15° normalizada a [−1, 1].
6. **Dependencias.** WebGL (o three.js con un `ShaderMaterial` y el "cover" de GL-001).
7. **Procedimiento (adaptación).** Plano con la foto (GL-001); uniforms `uDepth`, `uPointer`, `uThreshold`; suavizado dependiente de `delta`; pedir permiso de orientación en iOS tras un gesto del usuario; limitar `pixelRatio`; renderizar solo si la entrada cambia.
8. **Parámetros.** Umbrales (cuanto menor, más desplazamiento), suavizado (0,05), inclinación máxima (15°).
9. **Código.** Sin fragmento (licencia Codrops: no redistribuir tal cual). La fórmula de §5 es la idea general del desplazamiento por profundidad.
10. **Problemas habituales.** Halos en bordes del sujeto si el mapa no es preciso; desplazamientos grandes deforman la imagen; permiso de orientación en iOS (verificar); sin reduced motion en la fuente.
11. **Rendimiento / a11y.** Muy ligero (2 texturas). Mantener `<img>` con `alt` real como contenido; efecto decorativo; desactivar con reduced motion.
12. **Compatibilidad.** WebGL 1; giroscopio según permisos del navegador.
13. **Aplicaciones.** Hero de barbería/clínica con foto del local o del equipo; producto fotografiado.
14. **Pruebas.** Calidad con 3 mapas de profundidad distintos, móvil con giroscopio, reduced motion, FPS en gama baja.
15. **Estado de evidencia.** Código leído. No ejecutado. Demo de Codrops no inspeccionada.


## Lote 6 — demo pública: inspección PARCIAL ([evidencia](../evidence/visual/2026-10-26-lote6/README.md))
- Demo: https://tympanus.net/Tutorials/Fake3DEffect/ (demo 1 de 4); la página enlaza el artículo de Codrops y **github.com/akella/fake3d** (procedencia confirmada).
- **[MED]** atributos desplegados: `data-horizontalThreshold="35"`, `data-verticalThreshold="15"`, imágenes `lady.jpg` + `lady-map.jpg` (= repo); canvas 1120×1341 a DPR 1,5.
- **[COD desplegado]** el `app.js` servido (26 074 bytes) contiene `maxTilt=15` y **no contiene `requestPermission`** → confirma que en iOS 13+ el giroscopio no se activará sin pedir permiso (antes era análisis estático del repo).
- **[OBS, panel oculto]** estado inicial: retrato con hojas; la página muestra el texto "Tilt your phone to see the effect." Captura solo ilustrativa.
- **NO medido:** respuesta al ratón y suavizado (panel oculto).
