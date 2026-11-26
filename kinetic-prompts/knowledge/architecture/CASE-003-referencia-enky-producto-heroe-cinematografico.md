---
id: CASE-003
titulo: Referencia Enky (reels de @enkywebstudio) — landings de producto héroe "cinematográficas" para cafeterías y restaurantes; patrones observados, qué es montaje y qué podría ser web, y cómo mapearlos a la biblioteca
categoria: architecture
estado: INVESTIGADO
evidencia: VIDEO_INSPECCIONADO (grabación de pantalla aportada por el usuario, 51 s, 6 reels; fotogramas y mediciones en evidence/visual/2026-10-27-lote20-enky/) + METADATOS_VERIFICADOS (enkiswebstudio.com, sin datos técnicos)
versiones: —
perfil: cinematografico (aplicable a comercial de restauración y estética)
ultima_revision: 2026-10-27
---

# CASE-003 · Referencia Enky: producto héroe cinematográfico

1. **Finalidad.** Aprender de una referencia del nivel visual que busca el usuario: **dirección de arte, composición y continuidad del movimiento**, más allá de que una web compile o use GSAP. Es la diferencia principal con el prototipo n.º 1 (A1), cuyo héroe era un poste de barbero en CSS y la galería, avatares SVG.
2. **Fuente.** Grabación del usuario `ENKY_referencia_para_Cowork.mp4` (sha256 `ce630506…`), con los reels R1 POUR/PLAY, R2 CREMA, R3 café, R4 ROSSO, R5 AMBRA y R6 "Gold in every drop". Informe completo con *timestamps*: `evidence/visual/2026-10-27-lote20-enky/INFORME_AUDIOVISUAL_ENKY.md`.
3. **Ubicación.** Ver el mapa temporal del informe, §1.
4. **Resultado observado.** Cada landing cuenta **una historia de producto en 3 actos**, con:
   - un **objeto fotorrealista único** que se transforma de un acto a otro;
   - tipografía display gigante en capas delante y detrás del objeto;
   - una paleta monocroma cálida;
   - transiciones por panel que sube, cambio de fondo o disolución de ~0,5 s;
   - una interfaz mínima (cabecera fina, botón píldora, puntos de progreso).
5. **Advertencia de evidencia.**
   - Instagram etiqueta **todos** los reels como **"Contenido generado con IA"**.
   - Hay erratas y pseudotexto en la "página" ("LOVE AT AT FIRST TWIRL.", "Frech from the sea", párrafos ilegibles).
   - → **No hay prueba de que exista una web real**. Hay que tratarlo como **referencia de dirección de arte y de movimiento**, no como prueba de lo que una web consigue en tiempo real.
   - La cámara del reel está **quieta** dentro de cada reel (< 0,15 px/f medido); todo el movimiento ocurre en la pantalla.
6. **Patrones (P1–P11 del informe, §3) → fichas de la biblioteca.**
   | Patrón | Implementación propuesta | Fichas |
   |---|---|---|
   | P1, P2, P10 Objeto único que se transforma entre secciones | Secuencia de fotogramas (o vídeo) en `<canvas>` fijado y controlado por el scroll, como capa propia | **SEQ-001**, VID-001, ST-002 |
   | P3, P4 Texto en sándwich y palabra fantasma | Pila de capas: fondo → palabra fantasma → titular → objeto con alfa → partículas | **DEPTH-001**, TXT-001 |
   | P5, P6, P7, P11 Actos rotulados, paleta, botón píldora, interfaz mínima | Receta de dirección de arte | **ART-001**, UI-002, TYPE-001 |
   | P8 Satélites en órbita | Elipse con GSAP (posición por ángulo; escala y `z-index` según la profundidad) | **DEPTH-001** §9, MP-001 |
   | P9 Panel que sube, cambio de fondo, disolución | Paneles *sticky* (CARD-001), `backgroundColor` con `scrub`, *timeline* con `autoAlpha` (OBS-001 si son escenas a pantalla completa) | CARD-001, CLIP-001, OBS-001 |
   | Scroll con inercia (impulsos que deceleran en ~1–1,5 s) | Lenis o inercia del sistema (no distinguibles) | LN-001, GS-002 |
7. **Procedimiento para Claude Code.** Antes de escribir código:
   1. definir los **3 actos** y el **objeto protagonista** de cada uno (ART-001);
   2. decidir **de dónde salen los recursos fotorrealistas** (§10);
   3. montar la pila de capas (DEPTH-001);
   4. controlar el objeto con SEQ-001;
   5. evaluar con los **tres criterios** de EVAL-001.
8. **Parámetros observados [MED/OBS].**
   - Disolución entre escenas ≈ 0,5 s.
   - Aparición del gotero ≈ 0,25 s.
   - Impulsos de scroll que decaen en ~1–1,5 s.
   - Etiquetas en órbita: ~5, entrando de una en una durante ~1 s.
   - Respiración en reposo de la gota: oscilación lenta durante ≥ 2 s.
9. **Código.** Ninguno de la fuente (no hay código). Ver SEQ-001 y DEPTH-001.
10. **Problemas habituales al imitarla.**
    - **El cuello de botella son los recursos, no el código.** Sin fotografía, render o vídeo del objeto con alfa, el resultado vuelve a parecerse a A1.
    - Copiar marcas o textos de la referencia está prohibido: se transfieren **principios**.
    - Las secuencias pesan mucho (SEQ-001 §11).
    - El texto sobre fotografía necesita medir el contraste (TEST-003).
11. **Rendimiento / a11y.** Con *reduced motion*: mostrar el fotograma final de cada acto, sin secuencia. El contenido debe ser HTML real, no texto dentro de las imágenes (los reels lo hacen al revés).
12. **Compatibilidad.** Depende de la técnica elegida (SEQ-001 §12).
13. **Aplicaciones.** Cafetería, restaurante, barbería (navaja → espuma → toalla), perfumería, cosmética.
14. **Pruebas.** Las de EVAL-001 (fidelidad visual, de movimiento y calidad creativa), además de las técnicas habituales.
15. **Estado.** Vídeo inspeccionado fotograma a fotograma; tecnología **desconocida**; nada implementado.

**Lote 21 — clasificación (CASE-004 §3):** clase **R3/R4**: vídeo conceptual, probablemente generado con IA según la etiqueta de Instagram y las señales del texto. Sirve como referencia de dirección de arte; **no** demuestra que haya páginas web funcionando. Para la técnica, usar referencias R1 (OPTIKKA, Apple; CASE-004).

**Lote 24 — recetas derivadas (implementación propia, NO atribuida a Enky):** R1 POUR/PLAY → REC-001 (objeto que conecta secciones); R2/R6 CREMA → REC-002 (partículas como puente); R4 ROSSO → REC-003 (producto fijo, entorno cambiante).

**Lote 30:** reconstrucción del lenguaje de R4 ROSSO 33,0–34,3 s (aterrizaje en el plato) con identidad original → `integration/contratos/RECETA_PRODUCCION_ROSSO_ATERRIZAJE.md` y EDIT-001 (animática medida con fixtures; no atribuido a Enky).
