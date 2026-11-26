# Evidencia del lote 28 (2026-11-03) — estudio de vídeos de YouTube

- **Acceso:** los vídeos se reprodujeron en el navegador del ordenador del usuario, enlazado a la sesión, con los anuncios de YouTube.
- **Transcripciones:** se leyó el panel "Mostrar transcripción" (subtítulos automáticos en inglés). Por derechos de autor **no se copian**; `registro_videos.json` guarda su sha256 y el número de segmentos únicos.

| Archivo | Contenido |
|---|---|
| `registro_videos.json` | 8 vídeos: URL, título, autor, duración, fecha, estados de la evidencia, sha256 de la transcripción, fotogramas inspeccionados, código, capítulos; pendientes prioritarios |
| `fotogramas/` | 6 fotogramas pausados (código en pantalla y resultado) de Larose, Codegrid ×2 y Artiukh |
| `fase4/prueba_flip_expo.*` | Aterrizaje del héroe de REC-003: manual frente a Flip.fit(fitChild) ± expoScale (error de alineación y ritmo del zoom) |
| `fase4/comparacion_086.png` | Fotograma en p = 0,86: manual (izquierda) y Flip + expo (derecha) |
| `fase4/perf_filtro.*`, `filtro_turbulencia.html` | Filtro SVG de turbulencia con scrub: pantalla completa frente a tamaño de producto |
| `fase4/validacion_flip_1440/`, `fase4/regresion_base_1440/` | `validar_gsap.mjs` sobre la variante Flip y sobre la página base tras los cambios del motor |

Todas las imágenes de la fase 4 son **fixtures de prueba**: no cuentan para C1 ni C3.
