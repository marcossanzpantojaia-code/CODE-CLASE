# Evidencia visual — lote 6 (2026-10-26)

Navegador integrado de Cowork, **panel OCULTO** durante todo el lote (la página recibía ~1 `requestAnimationFrame` por segundo). Consecuencias:
- **No se pudieron medir animaciones temporales** (máscara de líneas, respuesta al ratón del falso 3D, inclinación por velocidad).
- Las capturas tomadas con el panel oculto pueden **no reflejar el estado actual del DOM** (se comprobó en la galería bento: la captura de p = 0 no coincidía con las medidas del DOM). Por eso solo se conservan dos capturas, etiquetadas `_PANEL_OCULTO`, como ilustración, **no como prueba de estado**.
- Los estados de la galería bento se obtuvieron del DOM forzando `ScrollTrigger.update()` (ver data/).

Formato de captura: vista completa del pane reducida a 0,5 (400×478 px), marco de coordenadas 800×957.

| Archivo | Qué contiene | Fiabilidad |
|---|---|---|
| data/FLIP-002_bento_estados.json | Rectángulos de los 8 elementos en p = 0…1 + comparación con expoScale | [MED] (actualización forzada) |
| data/TXT-002B_textmask_dom.json | Estructura de máscaras (16 líneas, 45 px, overflow hidden) | [MED] estructura; tiempos NO medidos |
| data/GL-003_fake3d_desplegado.json | Atributos y comprobaciones del `app.js` desplegado | [MED]/[COD] |
| data/CAM-002_codesandbox_bloqueo.json | Bloqueo por verificación anti-bots | registro |
| FLIP-002_bento_p100_final_PANEL_OCULTO.jpg | Estado final (elemento central a pantalla completa) | ilustrativa |
| GL-003_fake3d_inicial_PANEL_OCULTO.jpg | Estado inicial de la demo 1 (estático) | ilustrativa |
