# Lote 32 · 10 tutoriales y primera microprueba de acabado cinematográfico

## 1. Tutoriales estudiados (registro: `evidence/youtube/2026-11-04-lote32/registro_videos.json`)
| # | Vídeo | Estado real | Lectura | Valor para Enky |
|---|---|---|---|---|
| 1 | SonduckFilm, *Hollywood Cinematic Visual Motion Graphics* (JHeMJ_l2iNA) | Transcripción + fotograma 8:21 | completa | **Alto:** luz motivada, profundidad, partículas, acabado |
| 2 | SonduckFilm, *Best 3D Motion Graphics* (2bi5YcnOGkA) | Transcripción | completa | Bajo en 2D (escena 3D de AE) |
| 3 | Ben Marriott, *Advanced Lighting* (rdi0bPWqYyI) | Transcripción + fotograma 11:46 | completa | **Muy alto:** integración de un elemento en la escena |
| 4 | Ben Marriott, *Perfect Shape Morphs* (n24aTp1-jK4) | Transcripción | parcial (filtrada a partir de 8 min) | Medio: confirma el relevo con forma intermedia |
| 5 | Ben Marriott, *10 Underrated Techniques* (a7Nyzqy9_I0) | Transcripción | completa | Medio: consecuencia del impacto, tensión, gate weave |
| 6 | Ben Marriott, *15 After Effects Tricks* (l_-c5QDpYY0) | Transcripción | ~92 % | Medio: rayos, brillo interior, parpadeo, grano |
| 7 | Yuri Artiukh, *Animating triangles* (frgmk0Wu76A) | Transcripción | **parcial** (filtrada) | Medio: progreso local desfasado; luz horneada |
| 8 | Yuri Artiukh, *Teleportation transition* (GeNjyb8UBKM) | Transcripción | **parcial** + tramo de la transición completo | **Alto** para pasar entre fotos (distorsión radial) |
| 9 | Yuri Artiukh, *Checkerboard transition for text* (NRheDOjkOs8) | Transcripción | **parcial** | Bajo (rótulos) |
| 10 | Yuri Artiukh, *midwam.com look* (Vr9l4m6bkcQ) | Transcripción | **parcial** | Bajo sin 3D |

- **Ningún vídeo estaba ya estudiado:** no hubo sustituciones.
- **Vistos con fotogramas:** 1 y 3.
- **Sin código fuente:** los de Artiukh no lo publican; las demos enlazadas no se inspeccionaron.

## 2. Microprueba (tras los 3 primeros vídeos útiles: 1, 3 y 5)
**Combina:**
- integración de Marriott: grado y match horneados, sombra de la silueta, sombreado, luz rebotada, grano, viñeta, respiro de foco;
- luz motivada, profundidad y partículas de SonduckFilm;
- sobre el aterrizaje validado en el lote 31.

**Mismos fixtures, encuadre, 2,5 s y 1 280 × 720.** Dos entornos:
- ROSSO (claro);
- CREMA (oscuro: el fondo y la tipografía de R2/R6 de CASE-003; el protagonista sigue siendo el de ROSSO).

**Archivos:**
- `microprueba32_AB.mp4`: arriba CREMA, abajo ROSSO; izquierda lote 31, derecha lote 32; luego 3 veces más lento;
- `hoja_crema_A31_B32.png` y `hoja_rosso_A31_B32.png`;
- `B32_crema_f50.png` y `B32_rosso_f38.png`.

| Comprobación | Resultado |
|---|---|
| La mecánica del lote 31 se conserva | Idéntica (`auditoria/`): relevo de 0,7 px, 0 de doble imagen, espaciado máximo de 16,2 px |
| Sombra coherente con la luz | se desplaza en contra de la luz y se acerca a 0 en el contacto (41,9 → 9,2 → 0,7 → 0 px); de suave a dura |
| Profundidad de partículas | bokeh delantero de 15,3 px frente a 5,2 px del trasero; 21,2 / 7,5 en el pico del respiro de foco |
| Coste (CPU × 1) | 1 280: 2 fotogramas > 33 ms (lote 31: 1). 375: 0 |
| Coste (CPU × 4) | 1 280: 14 (lote 31: 2). 375: 9 (lote 31: 1) → **degradación adaptativa pendiente** |
| Defecto encontrado y corregido | desenfocar solo el plato dejaba nítidos los ingredientes del mismo plano → el respiro de foco se limita a lo que está fuera del plano |
| Defecto encontrado y corregido | **el motion blur del lote 31 era caro** (JS p95 28,6 ms) → recorte + rectángulo sucio: 5,3 ms, imagen idéntica |
| Defecto encontrado y corregido | fondo con degradado dentro del contenedor que escala → re-rasterizado en cada fotograma → movido fuera |
| Defecto abierto | las partículas cálidas no se ven sobre un fondo claro (ROSSO); sí sobre oscuro (CREMA) |

## 3. Evaluación (C1/C2/C3) frente a CASE-003
- **C1:** sin aprobar (fixtures).
- **C2:** sin cambios respecto al lote 31 en el protagonista (validado). Añade movimiento secundario de profundidad (paralaje por z y deriva) coherente con el push-in.
- **C3:** pendiente del usuario.

**Qué acerca más a Enky.** La técnica que más acerca es la **integración de Marriott** (sombra de la silueta + sombreado + grado común horneado). En CASE-003:
- ROSSO tiene "sombras suaves en el plato" y "luz de estudio cálida" (R4.4);
- CREMA tiene "luz lateral, sombras de contacto, reflejos" (R1.4), en un entorno oscuro con partículas y rayos (R2, R6).

Lo que separa los fixtures de un "rodaje único" es exactamente lo que cubre INTEG-001: grado común, sombra derivada de la silueta, luz motivada y grano. En la microprueba el contacto nido-plato gana una sombra que se afila al aterrizar, cosa que el lote 31 no tenía (solo una elipse genérica). **Su efecto real solo se puede juzgar con recursos reales.**

Las partículas con bokeh se corresponden con R2/R6 (oscuro, partículas doradas), **no con ROSSO**.

## 4. Recursos que faltan para la prueba con imágenes reales
Los de `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE_v2.md` §2 (I1-nido, I2, I3). **Ningún recurso adicional** para la integración: sombra, sombreado y luz rebotada se derivan de I1-nido.

Para el entorno CREMA (opcional):
- **CR1-gota:** gota o chorro de espresso o caramelo recortado, misma biblia visual, luz lateral, fondo liso oscuro (#2E2E2E) para recortar;
- **CR2-taza:** taza recibiendo, 3:2, con capa delantera recortable.

Sin estos, CREMA solo se puede probar como entorno (fondo y partículas), no como transición de producto.

## 5. Siguientes tres pruebas visuales (por impacto)
1. **ROSSO con I1-nido + I2 reales** y la integración del lote 32 (`rosso32.html?v=32`, sustituyendo `recursos/`). Medir la misma batería y revisar C1 con el usuario. **Es la única que puede validar la calidad.**
2. **Degradación adaptativa + partículas solo en tema oscuro:** medir que con CPU × 4 se queda en ≤ 2 fotogramas > 33 ms sin perder la sombra, el sombreado ni el blur del protagonista.
3. **Transición "teletransporte" entre dos fotos** (distorsión radial de Artiukh) con WebGL **nativo** del navegador, sin instalar nada, frente al relevo alineado: decidir si aporta en el paso de sección de CREMA a ROSSO. Requiere comprobar antes la fórmula en el vídeo con fotogramas del código.
