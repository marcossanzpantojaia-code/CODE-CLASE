# Fallos conocidos de A1 (prototipo n.º 1), documentados sin corregir (lote 19)

Por la directiva del lote 19, A1 **no se ha modificado**. La huella sha256 de `index.html`, `styles.css` y `main.js` se tomó antes de las pruebas y se comprobó igual después (`A1_sha_antes.txt`). Las pruebas se hicieron sobre una **copia** servida en local.

| # | Fallo | Evidencia | Estado |
|---|---|---|---|
| 1 | Cabecera móvil en dos filas a 375 y 320 px (marca + CTA + menú no caben) | ronda 2: `filas_distintas: 2`, alto 98 / 84 px; [CALC] 161 + 147 + 44 + 2×9,6 = 371 > 335 px | SIN CORREGIR |
| 2 | `CONSULTA_BIBLIOTECA.md` no creado; registro solo en la respuesta, con rutas abreviadas | verificador de construcción 13/16 (lote 18) | SIN CORREGIR (proceso) |
| 3 | Contrastes elegidos "a ojo" sin leer A11Y-003; textos sobre degradado sin medir | nuevo: `contraste_compuesto.mjs` a 375 px → "Barbería · Madrid" p10 4,14 y "Calle de Ejemplo 12" p10 3,63 (< 4,5) | SIN CORREGIR; ahora **medido** |
| 4 | `input type=date`: la parada del selector de calendario de Chromium no tiene indicador de foco | 23/24 paradas con indicador | SIN CORREGIR (B1 tiene el mismo fallo) |
| 5 | Sin GSAP ni Astro (encargo sin dependencias; instalación no autorizada) | `BLOQUEO_DEPENDENCIAS.md` | BLOQUEADO |
| 6 | Sin pruebas propias de Claude Code (no tenía navegador ni terminal) | respuesta final | Limitación del entorno |
