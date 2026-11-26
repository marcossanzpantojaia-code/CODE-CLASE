# Encargo de imágenes: «Objeto que une dos secciones» (jarra que vierte en una taza)

Imágenes generadas con IA por el usuario para sustituir los dibujos SVG de la demo `content/animaciones/object-transition-pour`. Basado en AIIMG-001 (contrato y biblia visual, fondo para recortar, inspección) e INTEG-001 (acabado e integración).

## Biblia visual (igual en todas las imágenes)

| Aspecto  | Valor                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estilo   | Fotografía de producto fotorrealista, editorial, sobria                                                                                                                           |
| Cámara   | Vista lateral, unos 15–20° por encima del objeto, objetivo de 85 mm (sin deformación de gran angular)                                                                             |
| Luz      | Luz principal suave desde arriba a la **izquierda**, balance de blancos neutro cálido; la misma en todas                                                                          |
| Encuadre | Objeto entero y centrado, con márgenes amplios (nada cortado)                                                                                                                     |
| Fondo    | PNG con transparencia si la herramienta lo permite. Si no: fondo **verde croma liso** (#00B140), sin degradado, sin textura, sin viñeteado y sin sombra del objeto sobre el fondo |
| Reflejos | Sin reflejos verdes del fondo sobre el objeto (iluminación pareja)                                                                                                                |
| Tamaño   | 2048 px o más por el lado largo, en PNG (no JPEG)                                                                                                                                 |
| Nitidez  | Todo el objeto enfocado                                                                                                                                                           |

Las sombras de contacto y el ajuste de color común se hacen después, iguales para todos los recursos.

## Imágenes

### 1. Jarra (imprescindible) → `jarra.png`

Jarra de cerámica mate color crema, vacía, con **el pico a la izquierda** y el asa a la derecha. Opaca (nada de vidrio: las transparencias no se recortan bien).

Prompt (en inglés funciona mejor en la mayoría de generadores):

```text
Photorealistic product photo of a matte cream-colored ceramic coffee jug with a pronounced pouring spout on the LEFT side and a handle on the RIGHT, empty, side view with the camera slightly above (about 15 degrees), centered, the whole jug visible with generous margins, soft key light from the upper left, warm neutral white balance, soft natural shading, no shadow on the background, isolated on a perfectly flat solid chroma green background (#00B140), no gradients, no green reflections on the object, sharp focus, 85mm lens, high detail, square 2048x2048
```

### 2. Taza (imprescindible) → `taza.png`

Taza de cerámica mate gris antracita, sin plato, llena de café con un poco de crema, asa a la derecha. Desde unos 20° por encima, para que la superficie del café se vea como una elipse.

```text
Photorealistic product photo of a matte charcoal ceramic coffee cup without saucer, filled with black coffee with a thin crema on top, handle on the RIGHT, camera about 20 degrees above so the coffee surface is visible as an ellipse, centered, the whole cup visible with generous margins, soft key light from the upper left, warm neutral white balance, no shadow on the background, isolated on a perfectly flat solid chroma green background (#00B140), no gradients, no green reflections on the object, sharp focus, 85mm lens, square 2048x2048
```

### 3. Fondo de la segunda sección (opcional) → `granos.jpg`

```text
Top-down macro photo of freshly roasted coffee beans filling the whole frame, warm soft light from the upper left, shallow depth of field, rich brown tones, editorial, no text, landscape 2560x1600
```

## Entrega

- Sube las imágenes a una carpeta de tu Google Drive llamada `kinetic-prompts-imagenes` (o adjúntalas en el chat).
- Indica con qué herramienta las has generado, para el registro de origen y licencia (ASSET-001).

## Qué se hace después (Claude Code)

1. **Inspección** (AIIMG-001): tamaño, fondo liso (desviación < 6), dirección de la luz igual en las dos imágenes y elevación de cámara de la taza.
2. **Recorte** por llave de color y **descontaminación de bordes**, para que no quede halo verde.
3. **Sombra de contacto** horneada en su propia capa y el mismo ajuste de color para las dos imágenes.
4. **Exportación** en WebP y AVIF por anchos; `img.decode()` antes de arrancar la escena.
5. Se marcan el pico de la jarra y la boca de la taza para que el chorro salga y llegue en el sitio exacto, y se vuelve a validar (reversibilidad, chorro unido, móvil).
