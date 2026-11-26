# Microdemos del lote 24 (2026-11-01): mecánica de movimiento cinematográfico

Son implementaciones **sin dependencias**: el motor `codigo/escena.js` replica un timeline con scrub a base de funciones puras del progreso. Los recursos son **procedurales**: un plato generado con PIL, una jarra y una taza en SVG y una gota dibujada en canvas. Prueban la **mecánica** (C2), **no** la calidad visual (C1/C3).

| Carpeta | Receta | Qué se midió |
|---|---|---|
| `receta_a_continuidad/` | REC-001 | reversibilidad, 5 estados a 1 440 y 375 px, vídeo bajando y subiendo, reduced motion |
| `receta_b_particulas/` | REC-002 | lo mismo + coste con N partículas (`coste_por_fotograma.json`) |
| `receta_c_producto_fijo/` | REC-003 | lo mismo + solape del titular con el borde delantero; `comparacion_halo.png` (izquierda limpia, derecha con halo oscuro) |

Para verlas: `python3 -m http.server` dentro de `codigo/` y abrir `http://127.0.0.1:8000/receta_a_continuidad.html` (los módulos ES no cargan desde `file://`). Para medir: `node ../../../../integration/tools/medir_escena_scroll.mjs <url> <salida> 1440 40`.

Resultados:
- **Reversibilidad:** diferencia 0 en las 6 mediciones.
- **Errores de consola:** 0.
- **Reduced motion:** activo.
- **Script por fotograma (p95):** A 1,3 ms; C 0,4 ms; B 6,2 ms con 2 318 partículas y 19,1 ms con 9 278.

Entorno: Chromium 153 sin interfaz, contenedor sin GPU con 2 núcleos (orientativo).
