---
id: PROD-001
titulo: Movimiento corto de un producto para validar la viabilidad antes de una secuencia completa — siete alternativas (apertura y rotación, órbita de cámara, máscara, disolución, secuencia prerenderizada, 2,5D, partículas) comparadas en dificultad, calidad, continuidad y rendimiento
categoria: animations
estado: INVESTIGADO
evidencia: síntesis de fichas existentes (SEQ-001/002, GL-003, MASK-001, CLIP-001, CAM-002, PHYS-001, TSL-*) + casos R1 (CASE-004) + código de Blender (BLEND-001); puntuaciones = estimación razonada [EST], no medidas
versiones: GSAP 3.15; three r186; Blender 5.2.3 LTS
perfil: cinematografico
ultima_revision: 2026-10-27
---

# PROD-001 · Movimiento corto de producto

1. **Finalidad.** Elegir **una prueba pequeña** que demuestre que el movimiento del protagonista puede ser convincente antes de producir 70 fotogramas o más (Hito B de la directiva del lote 22).
2. **Fuentes.** Ver la cabecera. No se reproduce nada que ya esté en esas fichas.
3. **Ubicación.** —
4. **Resultado.** La tabla de §5 y la elección de §7.
5. **Comparación.** Escala 1–5; en dificultad, 5 = lo más fácil.
   | Alternativa | Dificultad | Calidad esperable | Continuidad | Rendimiento web | Fichas |
   |---|---|---|---|---|---|
   | **a. Apertura y rotación de la navaja prerenderizada** (pivote real, 24–36 fotogramas, alfa) | 3 | **5** (Cycles: reflejos reales) | 5 | 3–4 (peso y memoria, §6) | BLEND-001, SEQ-002 |
   | b. Órbita de cámara alrededor del objeto | 3 (pre) / 2 (tiempo real) | 5 pre / 3–4 tiempo real | 5 | pre: 3 · tiempo real: 4 con un GLB optimizado | CAM-002, GLTF-001, PBR-001 |
   | c. Transición con máscara (clip-path, máscara de SVG o de forma) | **5** | depende de los 2 fotogramas | 3 (corte con estilo, no transformación) | **5** | MASK-001, CLIP-001 |
   | d. Disolución entre dos objetos | 5 | depende de los fotogramas | 2 (fundido; la referencia lo usa entre escenas, CASE-003 P9) | 5 | — |
   | e. Secuencia prerenderizada genérica (cualquier movimiento) | 3 | 5 | 5 | 3 | SEQ-001/002 |
   | f. Composición 2,5D (mapa de profundidad sobre un fotograma) | 4 | 3–4 (parallax creíble ±5°; se rompe en giros grandes) | 3 | 4–5 (WebGL, 1 imagen + 1 mapa) | GL-003 |
   | g. Transformación con partículas (objeto → partículas → objeto) | 2 | 3–4 (tiempo real) / 5 (pre) | 4 | tiempo real: 3 (GPU) | TSL-*, GL-*; observado en CASE-003 R2 |
6. **Coste de memoria de la secuencia [CALC].** Memoria decodificada = ancho × alto × 4 B:
   - fotograma de 1 600 × 1 000 → **6,4 MB**; 36 fotogramas → **≈ 230 MB** si el navegador los mantiene todos decodificados;
   - recortado al objeto, 1 200 × 500 → 2,4 MB → **≈ 86 MB**;
   - en móvil, 900 × 375 → 1,35 MB → **≈ 49 MB**.

   → Recortar al rectángulo del objeto y limitar el número de fotogramas es **obligatorio**. Comprobar el consumo real en Chrome (Administrador de tareas) [procedimiento; no medido].
7. **Elección para el Hito B [criterio propio].**
   - **(a) Apertura de la navaja prerenderizada, 36 fotogramas**, cámara fija con una ligera aproximación (*dolly* de 3–5 %), en la **misma escena** que el fotograma del Hito A.
   - **Por qué:** reutiliza el Hito A (coste incremental bajo); demuestra la continuidad real y los reflejos; es reversible y controlable por el scroll (SEQ-001); y prueba la técnica de capas delante y detrás (BLEND-001 §8).
   - **Prueba previa barata, B0:** máscara y disolución (c + d) entre dos fotogramas del Hito A (cerrada y abierta) para validar antes las capas, la tipografía y la sincronización con GSAP, **sin coste de render**.
   - **No se elige** el tiempo real (b, g) para esta prueba: aporta interactividad, pero con menos calidad de material que Cycles. Se reconsiderará si C1/C3 del Hito A muestran que el resultado prerenderizado no merece su peso.
8. **Parámetros de la apertura.**
   - Ángulo de la hoja de 0° (cerrada) a ~165° (abierta) [criterio propio].
   - Curva de movimiento en Blender: *ease-in-out* suave; el *easing* final lo da el `scrub` de GSAP.
   - 36 fotogramas ≈ 1 fotograma por cada ~10 px de scroll en un pin de `+=360px`: demasiado corto. En la práctica el pin será más largo (~150 % de la altura de la ventana) y se repartirá ≈ 1 fotograma cada 35–40 px → hay que **comprobar a ojo y con C2.3 si se perciben saltos** [EST].
9. **Código.** Ver SEQ-001 §9 (adaptación) y DEPTH-001 §9.
10. **Problemas.**
    - Ruido temporal (parpadeo) entre fotogramas eliminados de ruido.
    - Halo en el alfa.
    - Reflejos que "saltan" si el HDRI gira con la cámara.
    - Pocas muestras en el filo.
11. **Rendimiento / a11y.** Reduced motion: fotogramas 0 y 35 estáticos. Presupuesto en el plan del lote 22 §6.
12. **Compatibilidad.** Canvas 2D en todos los navegadores.
13. **Aplicaciones.** Toda presentación de producto con una pieza mecánica que se abre, gira o se despliega.
14. **Pruebas.** C2.2 y C2.3 con `curvas_scroll.mjs` y `window.__secuencia`; vídeo a 1 440 y 375 px; memoria; C3 humano.
15. **Estado.** Comparación razonada; nada producido.

**Lote 23:** B0 depende de **dos estados** (cerrada y abierta) renderizados en el Hito A con la misma cámara; el script `integration/blender/hitoA_navaja.py` los produce con `--estado`. Los 36 fotogramas de B1 siguen sin crearse.

**Lote 24:** matriz general de transformaciones entre productos y escenas en TRN-001; recetas implementadas (mecánica) en REC-001/002/003.
