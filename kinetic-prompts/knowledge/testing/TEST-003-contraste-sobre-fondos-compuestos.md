---
id: TEST-003
titulo: Medir el contraste de texto sobre degradados, imágenes y arte posicionado mediante muestreo de píxeles del fondo compuesto (Playwright, sin dependencias)
categoria: testing
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA (herramienta propia ejecutada sobre A1 y B1 el 2026-10-27; base normativa en A11Y-003: W3C Understanding 1.4.3 y fallo F83)
versiones: Playwright 1.63.0 + Chromium 153.0.8010.12; Node 22.23.4
perfil: ambos
ultima_revision: 2026-10-27
---

# TEST-003 · Contraste sobre fondos compuestos

1. **Nombre y finalidad.** Cubrir el hueco de A11Y-003 (lote 18). La medición por "color de fondo opaco más cercano" deja **sin medir** el texto sobre degradados, imágenes o ilustraciones posicionadas. En A1 eran 8 textos, incluido el `h1` del héroe.
2. **Fuente.** Método propio. La norma es WCAG 2.2, 1.4.3: contraste "with respect to the specified background over which the text is rendered" (A11Y-003). Herramienta: `integration/tools/contraste_compuesto.mjs`.
3. **Ubicación.** Pruebas: `evidence/integration/2026-10-27/comparacion_A1_B1/W-*/ronda1/contraste_compuesto_{1440,375}.json`.
4. **Resultado.** Por cada texto con fondo no opaco o que solapa arte posicionado, la herramienta da el contraste mínimo, el percentil 10 y la mediana frente al fondo real, en el ancho pedido.
5. **Explicación técnica.**
   1. Se seleccionan los nodos con texto propio cuyo ancestro tiene `background-image`, o que solapan un `svg`/`img`/`canvas` o un elemento con fondo de imagen dentro de un ancestro `absolute`/`fixed`.
   2. Se inyecta CSS que deja **solo ese texto** transparente (`color` y `-webkit-text-fill-color: transparent`, sin `text-shadow`, descendientes ocultos) y se captura su caja.
   3. El PNG se decodifica en el propio navegador (`canvas.getImageData`, sin dependencias) y se muestrean ≤ 4 000 píxeles.
   4. El color del texto se compone sobre cada píxel (si su alfa es menor que 1) y se aplica la fórmula WCAG.
6. **Dependencias.** Solo Playwright (ya instalado). Sin `pngjs` ni `axe-core`.
7. **Procedimiento.** `node contraste_compuesto.mjs <url> <salida.json> 375` y repetir con `1440`. Revisar los textos con **p10 < mínimo** (4,5 o 3 si es texto grande). El peor caso solo sirve como alarma (ver §10).
8. **Parámetros.** Ancho; `reducedMotion: 'reduce'` fijo, para medir sin animaciones a mitad; número de muestras.
9. **Código.** Ver la herramienta (adaptación propia, ejecutada).
10. **Problemas observados en la ejecución [OBS].**
    - El **peor caso** se contamina con los bordes de la caja: en los botones rellenos ("Reservar cita") sale ≈ 1,0 porque la captura incluye píxeles del fondo de la página → usar **p10** como criterio.
    - El enlace de salto oculto fuera de pantalla da valores absurdos (1,08) → excluir elementos fuera de la vista o probarlos con foco.
    - El texto sobre ilustraciones da un p10 alto pero un mínimo bajo si una letra cae sobre una zona clara. Ejemplo: el pie "Pompadour + barba completa" de B1 a 375 px, sobre la barba, con mínimo 1,8 → revisión visual obligatoria.
    - No evalúa `text-shadow` (que puede mejorar la legibilidad real) ni fuentes muy finas.
11. **Rendimiento / a11y.** Una captura por texto: ~20 textos ≈ 10 s.
12. **Compatibilidad.** Solo mide Chromium. El color del arte puede variar entre motores (filtros, mezclas).
13. **Aplicaciones.** Héroes con poste, degradado o foto; pies de galería sobre fotos; textos sobre vídeo (capturar un fotograma representativo).
14. **Resultados de la primera ejecución [MED].** A 375 px:
    - A1 (W-8508): "Barbería · Madrid", p10 4,14; "Calle de Ejemplo 12", p10 3,63.
    - B1 (W-4FF0): "Madrid · Desde 1987", p10 4,17; "(ficticio)", p10 3,57.

    En los dos, los textos pequeños del héroe quedan **por debajo de AA en móvil**, donde el arte queda detrás del texto. A 1440 px no hay fallos por p10.
15. **Estado.** **IMPLEMENTADO** (ejecutado sobre 2 webs). **No VALIDADO**: falta contrastarlo con una herramienta de referencia y con revisión humana. Es un método heurístico y no sustituye a una auditoría.
