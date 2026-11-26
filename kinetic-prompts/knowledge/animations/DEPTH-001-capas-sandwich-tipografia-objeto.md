---
id: DEPTH-001
titulo: Profundidad por capas — tipografía gigante detrás y delante del objeto (sándwich), palabra fantasma de fondo, partículas en primer plano y satélites en órbita elíptica con GSAP
categoria: animations
estado: INVESTIGADO
evidencia: VIDEO_INSPECCIONADO (patrones P3, P4 y P8 de CASE-003: R1 2,25–12 s, R2 14,7–19 s, R4 30,5–32,5 s, R6 45,5–49,5 s) + adaptación propia (sin código fuente)
versiones: CSS (z-index, mix-blend-mode opcional), GSAP 3.x
perfil: cinematografico (comercial: solo en el héroe)
ultima_revision: 2026-11-03
---

# DEPTH-001 · Capas "sándwich" y órbitas

1. **Finalidad.** Dar profundidad sin 3D en tiempo real. El objeto queda **entre** capas de texto, y los elementos pequeños **giran a su alrededor**, pasando por delante y por detrás.
2. **Fuente.** Observación de la referencia Enky (CASE-003; informe en `evidence/visual/2026-10-27-lote20-enky/`). Sin código ni tecnología confirmada → implementación **inferida**.
3. **Ubicación.**
   - R1, 2,25–3 s: "WAKE THE BEANS" y la palabra fantasma "DECAF" detrás de los granos.
   - R6, 46,1 s: el titular "THE EXTRACTION" detrás del portafiltro.
   - R6, 49,2 s: el chorro pasa por delante de "THE REWARD".
   - R1, 10,6–11,6 s: cinco etiquetas en órbita.
   - R4, 31–32,5 s: ingredientes en órbita alrededor de la hélice de pasta.
4. **Resultado.** Una lectura en profundidad que funciona en una captura fija: la composición ya parece "cinematográfica" antes de moverse.
5. **Pila de capas [OBS → propuesta].**
   | z | Capa | Notas |
   |---|---|---|
   | 0 | Fondo liso o degradado suave de la paleta | color por acto (ART-001) |
   | 1 | **Palabra fantasma gigante** (20–40 vw), del color del fondo ±6–10 % de luminosidad | `aria-hidden="true"` si es decorativa; no cuenta para el contraste (texto decorativo, A11Y-003) |
   | 2 | **Titular display** (h1/h2 real) | debe cumplir 3:1 o 4,5:1 (TEST-003) |
   | 3 | **Objeto con alfa** (canvas de SEQ-001, `<img>` WebP/AVIF con alfa o vídeo con alfa) | tapa **parte** del titular, nunca la palabra que da sentido |
   | 4 | Partículas o desenfoque de primer plano (granos, molienda, espuma) | `filter: blur()` solo en imágenes pequeñas; mejor ya desenfocadas en el recurso |
   | 5 | Interfaz (cabecera, botones, puntos) | siempre legible |
   - Texto **delante** del objeto (un chorro que cruza las letras): se consigue partiendo el recurso en dos capas (detrás/delante) o con un segundo canvas solo del elemento delantero [adaptación].
6. **Dependencias.** CSS; GSAP para las órbitas y la parallax entre capas (PX-001).
7. **Procedimiento.**
   1. Componer primero en **estático** (captura a 1 440 y 375 px) y comprobar la legibilidad del titular y el contraste.
   2. Añadir una parallax leve entre capas: fantasma −10 %, titular 0, objeto +5 %, partículas +20 % del recorrido [EST].
   3. Añadir los satélites.
8. **Parámetros.** Tamaño y opacidad de la palabra fantasma; solape objeto/titular (≤ 30 % del ancho del titular [criterio propio]); radios de la órbita (`rx`, `ry`); velocidad angular; escala entre la parte delantera y la trasera de la órbita (p. ej. 1 → 0,75).
9. **Código — órbita elíptica con profundidad (adaptación propia; no ejecutada):**
   ```js
   const sats = gsap.utils.toArray(".satelite"), centro = document.querySelector(".objeto");
   const st = { a: 0 };
   gsap.to(st, { a: Math.PI * 2, duration: 14, ease: "none", repeat: -1, onUpdate: () => {
     const r = centro.getBoundingClientRect(), rx = r.width * 0.75, ry = r.height * 0.28;
     sats.forEach((s, i) => {
       const t = st.a + (i / sats.length) * Math.PI * 2, prof = Math.sin(t);  // -1 detrás, +1 delante
       gsap.set(s, { x: Math.cos(t) * rx, y: prof * ry, scale: 0.8 + 0.2 * (prof + 1) / 2,
                     zIndex: prof > 0 ? 4 : 2, autoAlpha: 0.6 + 0.4 * (prof + 1) / 2 });
     });
   }});
   // entrada escalonada (R1: ~5 etiquetas en ~1 s): gsap.from(sats, { autoAlpha: 0, scale: 0.4, stagger: 0.2 });
   ```
   El `zIndex` alterna entre la capa 2 (detrás del objeto) y la 4 (delante), y los satélites deben ser hermanos del objeto en el mismo contexto de apilamiento.
10. **Problemas habituales.**
    - Satélites tapando el titular o el botón: en la referencia las etiquetas tapan "MAKE TIME" a los 11 s. Hay que **evitarlo** en una web comercial.
    - Varios `transform` en ancestros crean contextos de apilamiento y el `z-index` deja de cruzar capas.
    - Palabra fantasma leída por lectores de pantalla.
    - Desenfoque con `filter` muy caro en móvil.
11. **Rendimiento / a11y.**
    - Órbita solo con `transform`/`opacity`.
    - Reduced motion: satélites en posición fija, sin órbita.
    - Las etiquetas con información (p. ej. "Origen") deben existir también como texto accesible en el contenido.
12. **Compatibilidad.** Universal (CSS + transform).
13. **Aplicaciones.** Héroe de producto; barbería: navaja en el centro con "Afeitado", "Toalla" y "Perfilado" en órbita.
14. **Pruebas.**
    - Captura estática frente a la referencia de composición (EVAL-001, fidelidad visual).
    - TEST-003 del titular sobre el objeto.
    - Comprobar con el muestreo de `zIndex` que cada satélite pasa por delante y por detrás.
    - Reduced motion.
15. **Estado.** Efecto observado; implementación inferida; nada ejecutado.

**Lote 22 — capas delante y detrás con un render:** en Blender, dos *view layers*: (1) todo el objeto con la parte "delantera" (p. ej. la punta) en una colección marcada como `holdout` ("Mask out objects in collection from view layer", `rna_layer.cc`); (2) solo la parte delantera, con el resto en `indirect_only` para conservar los reflejos. En la web: canvas trasero → h1 → canvas delantero, dibujando **el mismo índice** de fotograma (BLEND-001 §8). Es una adaptación propia, sin probar.

## Lote 24 · Oclusión, contextos de apilamiento y alfa premultiplicado (probado en la microdemo C, REC-003)
- **Contextos de apilamiento [MDN]:** crean uno nuevo `position` absolute/relative con `z-index` ≠ auto, `fixed`/`sticky`, `opacity < 1`, `transform`/`scale`/`rotate`/`translate`, `filter`, `backdrop-filter`, `perspective`, `clip-path`, `mask`, `mix-blend-mode` ≠ normal, `isolation: isolate`, `will-change` sobre esas propiedades y `contain: layout/paint`. "the z-index values of its child stacking contexts only have meaning within its parent's stacking context". → **Las capas que deben cruzarse (fantasma, titular, producto trasero y delantero, secundarios) tienen que ser hermanas dentro del mismo contexto**, el del escenario con `isolation: isolate`; ningún envoltorio intermedio con `transform` u `opacity`.
- **Titular "enhebrado" con una sola imagen** (sin render en dos pases): dos `<img>` con la misma fuente, la trasera bajo el titular y la delantera sobre él recortada con `clip-path` o `mask-image` a la parte que debe quedar delante. **Probado** (microdemo C).
- **Métrica de legibilidad:** solape del primer plano sobre cada línea del titular ≤ **15 %** de su área y nunca una palabra clave completa. Medido por rectángulos en la microdemo C: máx. 6,4 % a 1 440 px tras corregir una primera versión que tapaba "giro".
- **Alfa premultiplicado [realtimerendering.com, 2016]:** los PNG guardan alfa **no premultiplicado**; al filtrar o escalar, el color de los píxeles transparentes (a menudo negro) se mezcla con el borde y aparecen **halos oscuros**. Soluciones: premultiplicar antes, "sangrar" el color hacia los píxeles transparentes, o exportar desde un render con el fondo transparente bien gestionado. **Demostrado:** `evidence/demos/2026-11-01-lote24/comparacion_halo.png` (izquierda limpia, derecha con el borde contaminado por negro, sobre crema). Prueba: borde al 400 % sobre fondo claro y oscuro.
- **Sombras y reflejos:** la sombra de contacto va en su propia capa, **bajo** el producto trasero (render con `is_shadow_catcher` o sombra pintada con `mix-blend-mode: multiply`). Los reflejos del producto deben coincidir con la luz de la escena (ART-001); nunca `box-shadow` genéricas.

## Lote 28 · Sincronizar capas HTML y WebGL
- Dos sistemas independientes (un objeto WebGL y su réplica u overlay HTML) se superponen sin costuras si **consumen la misma geometría**:
  - por regla de tamaño común (ambos dependen de la altura del viewport; Artiukh, 3SJIPjlSjtM);
  - o copiando la **misma matriz de transformación** al CSS del HTML (Hyperplexed, 37wy90RnATM, sobre la API experimental HTML-in-canvas).
- Así un titular HTML puede pasar por delante y por detrás de un objeto WebGL (sándwich C) sin perder la accesibilidad del texto. Fuente: `integration/YOUTUBE_ESTUDIOS.md` y `evidence/youtube/2026-11-03-lote28/`.

## Lote 30 · Profundidad desde una sola foto: capas con agujero (Yuri Artiukh, 12yVUxIkag0, 15:30–35:50)
- **Técnica:** la misma imagen en 3 planos. Los delanteros llevan una máscara con un **agujero** y están más cerca de la cámara. Al girar el grupo con inercia o mover la cámara aparece paralaje dentro de la foto.
  - En three.js la máscara (`alphaMap`) debe ser **blanco y negro**, no transparencia. El autor la invierte y la guarda en JPEG (~50 KB).
  - Mientras se mira, los planos se acercan lentamente en z: zoom con volumen.
- **Aplicación a imágenes de IA:** la máscara del sujeto ya la produce `preparar_recursos.py`; su inversa, dilatada, es el agujero.
  - Sin three.js (no autorizado): capas DOM de la misma imagen con `mask-image` y desplazamiento distinto por capa.
  - **No probado en este lote.**
