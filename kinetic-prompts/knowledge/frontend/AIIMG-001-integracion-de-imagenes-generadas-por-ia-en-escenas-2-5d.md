---
id: AIIMG-001
titulo: Integrar imágenes generadas por IA en escenas cinematográficas 2,5D con scroll — contrato y biblia visual, consistencia, fondo para recortar, matting y ecuación de composición, descontaminación de bordes, inspección automática (luz, elevación de cámara, halo, color), capas de oclusión y sombras horneadas, color matching, formatos AVIF/WebP, memoria y decodificación, y flujo de 10 pasos para Claude Code
categoria: frontend
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia (evidence/demos/2026-11-02-lote27/: preparar_recursos.py con fixtures, integración REC-003 por manifiesto validada con GSAP 3.15.0 en 3 viewports, diagnóstico de rendimiento) + ARTICULO_AUTOR_ANALIZADO (Xue, Agarwala, Dorsey y Rushmeier 2012, realismo de composiciones; Xu, Price, Cohen y Huang, Deep Image Matting; J. Archibald 2024, vídeo con alfa; imagecompressor.com, memoria de imágenes; quickimagetools, bordes con alfa) + DOCUMENTACION_OFICIAL_ANALIZADA (MDN HTMLImageElement.decode(); Midjourney Style Reference; libcom, color transfer)
versiones: Pillow 12.3 (WebP y AVIF), OpenCV 5.0, SciPy 1.18, Chromium 153, GSAP 3.15.0
perfil: cinematografico (y héroe premium)
ultima_revision: 2026-11-02
---

# AIIMG-001 · Imágenes generadas por IA en escenas 2,5D

**Estado:**
- **IMPLEMENTADO:** el pipeline y la integración. Se han **probado con fixtures** (marcadores rotulados).
- **No probado con imágenes reales del usuario:** no hay ninguna todavía. **C1 y C3 siguen NO VERIFICADOS.**

No sustituye a ASSET-001 (licencias), DEPTH-001 (premultiplicación y sándwich) ni COMP-001 (iluminación): las aplica a recursos generados.

## 1. Efecto
Que imágenes generadas por separado (héroe, plato, ingredientes) se lean como **un solo rodaje**: misma luz, misma cámara, bordes limpios y capas por delante y por detrás de la tipografía. Además, con un movimiento que solo use lo que esas imágenes permiten.

## 2. Cómo funciona — pipeline verificado
| Paso | Qué se hace | Herramienta | Evidencia |
|---|---|---|---|
| Contrato | Biblia visual común (cámara, elevación, luz, balance, nitidez, encuadre, fondo), lista imprescindible u opcional, tamaños y nombres | `integration/contratos/CONTRATO_RECURSOS_REC003.md` + `contrato_rec003.json` | — |
| Consistencia | Generar primero el recurso "ancla" y usarlo como referencia de estilo; reutilizar la semilla o el código; **no cambiar la biblia** | En Midjourney, `--sref` transfiere estilo (no sujeto), `--sw 0–1000` y el código de estilo es reutilizable (docs oficiales) | La consistencia entre variantes de producto sigue siendo un problema abierto: verificar siempre con la inspección |
| Fondo para recortar | Transparencia real si el generador la da; si no, fondo **liso** (desviación < 6) y **que contraste con el borde** del objeto | `preparar_recursos.py` (llave de diferencia) | Plato claro sobre gris claro: franja de 14 437 px y halo de +71,5 (**inutilizable**). Sobre gris oscuro: −51,8 → **−7,7 tras descontaminar** |
| Matting | `I = αF + (1−α)B`: 7 incógnitas y 3 datos por píxel → infradeterminado. El *trimap* marca frente, fondo y zona dudosa. Pelo, transparencias y desenfoque de movimiento fallan con métodos de color | Pro: herramienta de recorte del generador o de un editor; aquí, llave + descontaminación (solo con fondos lisos) | Xu et al., Deep Image Matting |
| Descontaminación | El RGB de la franja 0 < α < 1 se sustituye por el del píxel opaco más cercano → el color del fondo original desaparece del borde | `descontaminar()` | Halo de −51,8 → −7,7 (fixture) |
| Inspección automática | Tamaño, alfa útil, caja y márgenes, **halo** (luminancia de la franja − interior), **luz** (vector centroide → 5 % más luminoso), **elevación de cámara** de un objeto circular (elipse: asin(b/a)), color L\*a\*b\* y zonas altas (p99,9), memoria | `preparar_recursos.py inspeccionar` | Detectó el halo oscuro del fixture del lote 24 (−112) y la luz arriba-izquierda del plato procedural; elevación de 25° |
| Capas de oclusión | Capa delantera = media luna del ala (elipse interior al 80 %) **del mismo recurso** | `mascara_delantera()` | Oclusión real del titular por alfa: 3,1 % (escritorio) |
| Sombras | Sombra de contacto y sombras de ingredientes **horneadas** en RGBA; desenfoque por profundidad en premultiplicado | `sombra_contacto()`, `hornear_ingrediente()` | Ver §11 (rendimiento) |
| Color matching | Si un recurso no casa: igualar **zonas** de la luminancia (H), la temperatura (L) y la saturación (H) del fondo, no la media global; el contraste local, con curva en S | Fórmula de Xue et al. 2012; Reinhard L\*αβ (libcom: solo para casos sencillos) | Umbrales perceptivos medidos por Xue et al.: ≈ 3 stops de luminancia, ≈ 65 mired de temperatura y ≈ 1 stop de saturación (anchos de la caída de realismo). Aquí: **solo medido, no corregido automáticamente** |
| Exportación | WebP (q 86, método 6) y AVIF (q 62) por anchos, **reescalado premultiplicado**, nunca hacia arriba | `exportar()` | Pillow 12.3 escribe y lee AVIF con alfa |
| Carga | Manifiesto → variante mínima ≥ ancho CSS × DPR (máx. 2); AVIF si decodifica, si no WebP; **`img.decode()` de todo antes de arrancar** | `plantillas/rec003_recursos/index.html` | `decode()` resuelve cuando la imagen está lista para el DOM (MDN, Baseline 2020) |

## 3. Cuándo usarlo
Siempre que los protagonistas sean imágenes (generadas o fotografiadas) que se componen sobre HTML. Con 3D en tiempo real, ver TJ-*.

## 4. Recursos
Los del contrato. **Imprescindibles** para REC-003:
- I1: héroe vertical;
- I2: plato a 30°, con el ala delantera libre;
- I3: ≥ 4 ingredientes flotantes de 1:1.

**Opcional muy recomendado:** O1, una secuencia de imagen a vídeo para cambiar de forma.

## 5. Tecnologías
Pillow, NumPy, SciPy y OpenCV (ya disponibles; sin instalar nada); GSAP 3.15.0 con la plantilla del lote 26.

## 6. Estructura
- `preparar_recursos.py preparar` → `recursos/`, que contiene: `manifest.json`, `informe.json`, `hoja_inspeccion.png` y `*.webp|avif`.
- `index.html`: lee el manifiesto. **Si falta un recurso imprescindible no arranca y lo lista** (sin sustitutos).

## 7. Parámetros
- `fraccion_elipse_interior` (0,80);
- `meta.nido` del héroe y del producto (fracciones; se calibran con la hoja);
- planos de los ingredientes: desplazamiento, desenfoque y opacidad de la sombra, desenfoque de profundidad;
- calidades de WebP y AVIF;
- anchos.

## 8. Problemas visuales
- Halo claro u oscuro (fondo mal elegido o exportación aplanada).
- Luz contradictoria entre recursos.
- Perspectivas mezcladas (elevación distinta).
- Recurso reescalado hacia arriba.
- Objeto que toca el borde de la imagen (no se puede animar fuera de su caja).
- Cambio de forma "inventado" sin secuencia.
- Subpíxel: con fotos, un desplazamiento de 0,2 px se ve más que con dibujos planos (§11).

## 9. Móvil
- Las mismas imágenes en variantes más pequeñas (sin generar otras).
- El héroe se recoloca para no cruzar el titular: medido 71 % de oclusión con 56vh → 2,3 % con 48vh y el cambio de profundidad.
- Memoria: ancho × alto × 4 bytes por imagen decodificada.

## 10. Reduced motion
Composición final estática (plato y titular). Sin órbitas ni héroe.

## 11. Coste (medido)
| Medida | Resultado |
|---|---|
| **Diagnóstico de REC-003 a 1 440 px** (capas desactivadas una a una, 2 recorridos por variante) | Con todo: 26–38 fotogramas > 33 ms. Sin filtros en los ingredientes: 25–37. Sin el desenfoque de la sombra: 27–32. **Sin `mix-blend-mode: multiply` en la sombra: 0–1.** Sin nada de lo anterior: 0 |
| Integración con recursos horneados | **0 fotogramas > 33 ms** en 3 recorridos a 1 440 px. Script p95 de `actualizar()` 0,7 ms |
| Memoria de los fixtures preparados | 18 MB decodificados |

- **Regla:** nada de `mix-blend-mode` sobre una capa grande que cambia cada fotograma con contenido móvil detrás. **Hornear.**
- **Decodificación:** una imagen de 4 000 × 3 000 ocupa ~48 MB decodificada aunque pese 2 MB. AVIF ahorra bytes pero cuesta más CPU al decodificar.
- **Lazy-loading:** no aplicarlo a los recursos de la escena fijada; llevaría la decodificación al scroll.

## 12. Pruebas
Las del README de `integration/plantillas/rec003_recursos/`:
- `validar_gsap.mjs` y `diferencias.py`;
- `cortes_video.py`;
- `auditoria_visual_escena.mjs` con `ocluyentes_img` (alfa real y orden de profundidad);
- contraste de los colores planos;
- memoria;
- C1 humano frente a `REC003_FIDELIDAD_CINCO_ESTADOS.md`;
- C3 del usuario.

## 13. Evidencia
`evidence/demos/2026-11-02-lote27/`. **Todo con fixtures, no con imágenes reales.**

## 14. Flujo de 10 pasos para Claude Code
1. **Recibir** las imágenes en una carpeta con los nombres del contrato. Si el usuario no ha generado nada todavía, entregarle el contrato. **No inventar recursos.**
2. **Inspeccionar** con `preparar_recursos.py inspeccionar`: dimensiones, recorte, alfa, halo, luz, elevación y color.
3. **Decidir el movimiento viable:**
   - imagen fija → traslación, escala, profundidad y oclusión;
   - cambio de forma → solo con una secuencia (O1);
   - giro → solo con una secuencia o 3D.
4. **Preparar las capas** con `preparar_recursos.py preparar`: descontaminación, capa delantera, sombras horneadas y variantes. Calibrar los nidos.
5. **Construir el timeline** con la plantilla verificada (GS-005).
6. **Componer delante y detrás de la tipografía.**
   - Oclusión del titular ≤ 15 % (capa delantera) y ≤ 5 % (secundarios).
   - Cambios de profundidad solo en momentos ocultos (cambio de texto enmascarado).
   - El titular nunca sobre un color de bajo contraste.
7. **Validar el scroll en ambos sentidos** con `validar_gsap.mjs`: 1 440, 375 y 375 × 800.
8. **Optimizar:** AVIF/WebP por ancho, `decode()`, memoria ≤ 60 MB y nada de blend ni filtros en capas animadas.
9. **Entregar capturas** (hoja de estados) **y vídeo** (`recorrido_*.webm`).
10. **Evaluar C1 y C2** con la tabla de fidelidad y **pedir al usuario la puntuación de C3**.


**Lote 29:** la producción de **vídeo** a partir de estas imágenes (image-to-video, encadenado de clips y cosido sin fundido) está en AIVID-001.

## Lote 32
El grado común y el "match" del protagonista (sat −12 %, luminosidad −10 %, curvas) se **hornean** en todos los recursos (`evidence/demos/2026-11-04-lote32/grado32.py`). La composición posterior (sombra de la silueta, sombreado, luz rebotada, atmósfera) está en INTEG-001.
