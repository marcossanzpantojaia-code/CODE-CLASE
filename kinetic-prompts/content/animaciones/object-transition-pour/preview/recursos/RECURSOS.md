# Recursos de «Objeto que une dos secciones»

| Archivo | Origen | Licencia | Preparación |
|---|---|---|---|
| `jarra.webp` (900 × 670) | Imagen generada con IA por el usuario (2026-11-28), sobre fondo verde croma. Herramienta: ChatGPT (OpenAI) | Del usuario, que la cede al proyecto (revisar los términos de uso de OpenAI antes de un uso comercial) | Llave de color por dominancia del verde, descontaminación del borde, recorte al objeto, WebP con alfa q86 |
| `taza.webp` (900 × 744) | Imagen generada con IA por el usuario (2026-11-28), sobre fondo verde croma. Herramienta: ChatGPT (OpenAI) | Del usuario, que la cede al proyecto (revisar los términos de uso de OpenAI antes de un uso comercial) | Igual que la jarra, más una sombra de contacto horneada |
| `granos.webp` (1600 × 1001) | Imagen generada con IA por el usuario (2026-11-28) con ChatGPT (OpenAI) | Del usuario, que la cede al proyecto (revisar los términos de uso de OpenAI antes de un uso comercial) | Reducida a 1600 px, WebP q72 |

Script: `scripts/preparar-recursos.mjs` (AIIMG-001: fondo liso, matting por llave, descontaminación y exportación WebP).

## Inspección (AIIMG-001)

- **Fondo:** verde liso, con desviación de 0,6–0,9 por canal; la ficha pide menos de 6.
- **Halo:** ninguno visible sobre fondo oscuro, medio y claro, ni ampliando el borde del pico.
- **Luz:** principal desde la izquierda en las dos imágenes, coherente.
- **Duplicado:** las dos imágenes de jarra entregadas son idénticas; hay una tercera más pequeña que no se usa.
- **Anclas** (en % del recurso), calculadas con el script:
  - Pico de la jarra: x 0,74 %, y 13,47 %.
  - Superficie del café: x 41,5 %, y 17,3 %.

## Nota para la vista previa publicada

Los artefactos privados no sirven archivos sueltos a un iframe con `sandbox` (origen opaco, sin la sesión). En la copia de la vista previa, las tres imágenes van dentro del HTML de la demo como `data:` URI. En la app no hace falta: `public/contenido/` es público y el test `en el panel, cada demo carga todas sus imágenes` lo comprueba.
