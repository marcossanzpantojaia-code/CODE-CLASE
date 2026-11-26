---
id: REC-002
titulo: Receta B — transformación por partículas (inspirada en CREMA): un producto se disuelve en partículas que se recomponen en el siguiente, con las imágenes reales en los extremos y alternativas según los recursos
categoria: recetas
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia (evidence/demos/2026-11-01-lote24/receta_b_particulas/: 5 estados a 1 440 y 375 px, vídeo, medicion.json; coste_por_fotograma.json con 2 318 y 9 278 partículas) + VIDEO_INSPECCIONADO (CASE-003 R2 17,1–17,7 s y R6 45,5–46,5 s, observación; tecnología desconocida) + foro de three.js sobre morph de partículas por interpolación (R2/R6)
versiones: canvas 2D (microdemo); variante WebGL documentada en TRN-001
perfil: cinematografico
ultima_revision: 2026-11-03
---

# REC-002 · Receta B: transformación por partículas

**Niveles:**
- **IMPLEMENTADO y PROBADO** (mecánica en canvas 2D): reversibilidad 0, 0 errores, reduced motion activo.
- **Coste [MED]:** 2 318 partículas → script p95 6,2 ms; 9 278 → p95 19,1 ms (por encima del presupuesto de 16,7 ms en este contenedor sin GPU).
- **VISUALMENTE VALIDADO:** **no** (gota y plato procedurales).

**Referencia observada.** La gota de CREMA "estalla" en partículas que forman una espiral alrededor del portafiltros. **No se sabe cómo se hizo** (probablemente vídeo generado; CASE-003).

## 0. Primero, elegir según los recursos (TRN-001)
| Recursos disponibles | Técnica |
|---|---|
| Render o rodaje de la transformación completa | **Secuencia o vídeo con alfa** (SEQ-002): es la de más calidad; las partículas sobran |
| Dos imágenes de calidad (A y B) con alfa, sin transformación | **Puente de partículas** (esta receta): las partículas nacen en los píxeles de A y aterrizan en los de B, con fundidos en los extremos |
| Dos imágenes incompatibles (encuadre o luz distintos) | **Máscara o fundido** (TRN-001 D/I); las partículas no arreglan la incompatibilidad |
| Modelo 3D de A y B | Partículas en WebGL muestreando superficies (`MeshSurfaceSampler` en three.js) y la interpolación en el *shader* |

**GSAP no genera partículas ni materiales:** solo da el `progress` que las mueve.

## 1. Estados
| p | Imagen A | Partículas | Imagen B | Texto |
|---|---|---|---|---|
| 0–15 % | **nítida (meseta)** | — | — | "Oro en cada gota." |
| 15–22 % | fundido a 0 | aparecen **exactamente** en los píxeles de A | — | — |
| 22–78 % | — | viaje con remolino; retardo por distancia al centro (se disuelve de dentro afuera) | — | titular A sale (30–42 %) / B entra (60–72 %) |
| 78–87 % | — | aterrizan en los píxeles de B y se desvanecen | fundido a 1 | "La extracción." |
| 87–100 % | — | — | **nítida (meseta)** | legible |

## 2. Cómo funciona (código probado: `codigo/receta_b_particulas.html`)
1. **Muestreo:** dibujar A y B en canvas fuera de pantalla del tamaño del escenario; tomar los píxeles con alfa > 0,5 en una rejilla (`paso = √(área / (n·6))`) con su color; barajado **determinista** (un seno como semilla).
2. **Emparejamiento:** ordenar A y B por **ángulo** alrededor del centro y emparejar por índice → las partículas giran de forma coherente (sin cruces caóticos).
3. **Posición = función pura de p:**
   ```js
   t     = easeInOut(clamp((tp - d_i) / (1 - d_i * .9)))      // d_i = retardo ∝ distancia al centro (0–0,25)
   bell  = sin(π t)                                          // desvío máximo a mitad de viaje
   pos   = lerp(A_i, B_i, t) + polar(ángulo + giro_i·bell, radio_i·bell)
   color = lerp(colorA_i, colorB_i, t)
   ```
   Sin estado ni tiempo → **reversible** (bajar y subir da los mismos fotogramas).
4. **Fundidos en los extremos:** A visible hasta el 15–22 % y B desde el 78–87 %. Como las partículas parten de los píxeles de A y llegan a los de B, el relevo no se nota.

## 3. Capas
Fondo oscuro → canvas (A, partículas, B) → titulares (z3). El canvas lleva `aria-hidden="true"`; el texto es HTML real.

## 4. Variante GSAP (DOCUMENTADA, sin ejecutar)
```js
const estado = { p: 0 };
gsap.timeline({ scrollTrigger: { trigger: "#acto", start: "top top", end: "+=300%", pin: ".escenario", scrub: 0.5 } })
  .to(estado, { p: 1, ease: "none", onUpdate: () => dibujar(estado.p) }, 0)       // dibujar(p) = la función pura del §2
  .to(".titulo.a", { autoAlpha: 0, y: -30, duration: .12 }, .30)
  .fromTo(".titulo.b", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .12 }, .60);
```

## 5. Requisitos visuales
- A y B **fotorrealistas, con alfa y la misma luz**.
- Partículas del **color de los recursos** (se interpolan), tamaño de 1–2 px de CSS y densidad suficiente para "leer" la silueta al empezar y al terminar.
- Relación narrativa: gota → granos → portafiltros (CREMA); en la barbería, espuma → vapor. **Nunca** un "confeti" genérico.

## 6. Rendimiento
- Canvas 2D hasta unas 2 000–3 000 partículas en escritorio (p95 6,2 ms con 2 318).
- Por encima: WebGL (`THREE.Points` con atributos inicio y fin, y la mezcla en el *vertex shader* con un *uniform* `uProgress`) [adaptación; sin probar].
- En móvil, N × 0,4 y `devicePixelRatio` ≤ 2.
- Recalcular el muestreo al redimensionar (la microdemo lo hace en `resize`).

## 7. Problemas que evitar
- Partículas que no empiezan o no terminan en la imagen (salto visible).
- Emparejamiento aleatorio (nube caótica).
- Simulación física con tiempo (no reversible).
- `fillStyle` por partícula en canvas 2D: el coste crece con N. Agrupar por color o pasar a WebGL.
- N excesivo en móvil.

## 7b. DIRECCIÓN ARTÍSTICA APLICADA (lote 25)
| Aspecto | Decisión |
|---|---|
| **Tipo de recurso** | A y B **reales y compatibles** (misma cámara, luz y escala; COMP-001); las partículas muestrean el **color de los recursos**, no un color plano. Si existe una secuencia o un vídeo de la transformación real, **úsalos en su lugar** (TRN-001) |
| **Iluminación** | La misma dirección de luz en A y en B; las partículas heredan la luminancia del píxel muestreado, de modo que el "puente" conserva la luz |
| **Integración con el fondo** | Fondo con valor medio, no negro puro: sobre negro, un puente poco denso parece un apagón |
| **Qué controla GSAP** | El progreso del puente, las opacidades del relevo y la escala o posición de A y B |
| **Qué exige canvas, vídeo, WebGL o secuencia** | Canvas 2D hasta el N medido en `coste_por_fotograma.json`; WebGL (puntos) si hace falta más densidad en móvil |
| **Evitar el movimiento artificial** | Trayectorias con curvatura y retardo por profundidad (MOT-001/002), no líneas rectas simultáneas; dispersión que nace del contorno |
| **Atención en el protagonista** | **Correcciones de la auditoría (H3, H4, H5):** la cobertura medida del lienzo a mitad del puente era del 1,22–1,42 % → partículas **más grandes y densas** hasta una cobertura **≥ 3 %**; los valles de luminancia (25 y 29 de 255) → **relevo sin valle** (SEQ-003): las partículas al 100 % **debajo** desde que empieza el fundido de A, y A desvaneciéndose encima; nunca dos fundidos opuestos sobre fondo oscuro. Regla de AUD-001: ningún valle < 50 % de la luminancia de los extremos |
| **C1** | Estados 0/50/100 lado a lado con el storyboard; los estados 0 y 100 deben ser idénticos a las imágenes A y B |
| **C2** | Cobertura y luminancia por paso (`auditoria_visual_escena.mjs`), cortes (`cortes_video.py`: ningún pico aislado > 0,30), vídeo |
| **C3** | Rúbrica humana; si una persona la lee como "efecto de demo", volver a TRN-001 y buscar una secuencia |

## 8. Evidencia necesaria
`medicion.json` (reversibilidad 0), `coste_por_fotograma.json` con el N de producción, capturas de los 5 estados, vídeo, reduced motion y C1/C3 humanos con A y B reales.

## 9. Cómo pedirlo
"Implementa la Receta B (REC-002) entre [A] y [B]: confirma primero con TRN-001 que no hay una secuencia disponible, aporta A y B con alfa y la misma luz, fija N según el coste medido y entrega el §8".

## 10. Ejecución con GSAP 3.15.0 (lote 26)
Código: `evidence/demos/2026-11-02-lote26/demos/receta_b.html`. Resultados: `evidence/demos/2026-11-02-lote26/resultados/B_*`. GSAP mueve los titulares y el progreso; el lienzo se dibuja en `actualizar(p)`.
- **Equivalencia con el nativo:** 0 % de diferencia (máx. 0 por canal) a 1 440 y 375 × 800. Pin, reversibilidad, resize y reduced motion correctos.
- **Correcciones medidas:**
  1. **Relevo sin valle — segunda versión.** Poner las partículas al 100 % debajo de A (1.ª corrección) **no bastó**: la luminancia seguía en 25 a p = 0,20. Con 2 318 partículas de 2 px solo se cubría una fracción del área de A, y debajo no había casi nada.
     - Corrección: cada partícula mide en reposo **el paso de muestreo** (teselan A y B) y crece un 30 % en vuelo.
     - **Luminancia mínima 111 frente a los extremos 128/184** (antes 25 y 29). **Cobertura mínima del lienzo 6,5 %** a 1 440 px y 4,8 % a 375 px (antes 1,2 %).
  2. **Cuña que faltaba en el plato al recomponerse** — defecto heredado del lote 24, visto en la hoja de estados y no en las métricas.
     - Causa: `B[i % B.length]` con menos puntos en A que en B → solo se cubría un tramo angular de B.
     - Corrección: `max(nA, nB)` partículas, con recorrido proporcional de las dos imágenes.
  3. **Mosaico** de cuadrados visible mientras A se desvanece → discos de radio 0,75·paso y desvanecimiento de A en 0,15–0,26.
  4. **Titulares:** hueco sin texto legible de 4 de 21 pasos (0,35–0,50).
- **Coste:** `actualizar()` p95 = 6,4 ms a 1 440 px y **8,5 ms a 375 px (rebasa el presupuesto de 8 ms)**. Los discos (`arc`) cuestan más que los rectángulos. En móvil, reducir N o usar WebGL (puntos).
- **Pendiente:** A y B siguen siendo procedurales; el contorno de partículas se nota en los bordes de A y B durante los fundidos.

## 11. Lote 28 · Relevo vídeo real ↔ réplica WebGL de partículas (Yuri Artiukh, 3SJIPjlSjtM; código en el fotograma 55:35)
- **Pasos:**
  1. Partículas = `THREE.Points` sobre una geometría de plano con **tantos segmentos como píxeles** de la imagen o vídeo (proporcionales al aspecto). Cada vértice ya trae su **UV**, así que el color se lee de la textura sin calcular nada.
  2. Explosión = `posición + curlNoise(posición, tiempo) × uDistortion`, con `uDistortion` animado 0 → 3 → 0 (GSAP, 2 s) y el **bloom** sincronizado (`strength` 0 → 10 → 0). Se descartan las partículas casi negras.
  3. **Alineación sin código de resize:** el `<video>` HTML y la cámara WebGL dependen los dos de la altura del viewport, así que coinciden en cualquier tamaño.
  4. **Relevo:** en el evento `ended` del vídeo, `opacity 0` en 0,1 s; detrás ya está el **mismo último fotograma** en partículas. Para volver, mezclar dos texturas por `progress`.
- **Errores del directo:**
  - el autoplay exige `muted`;
  - usar un **timeline**, no tweens sueltos con `delay`;
  - con postprocesado, revisar la salida de color;
  - la versión de three.js es de 2020 (`PlaneBufferGeometry` ya no existe por separado).
- **Para Enky (R2/R6: gota → partículas → máquina):** con imágenes o un vídeo de IA del usuario, la capa real se ve en reposo y la réplica de partículas solo en el puente, con el relevo de opacidad corto y coincidencia exacta.
- **Requisito:** three.js, que **no está instalado**; pedir autorización. Sin WebGL, la versión en canvas 2D de esta receta (lotes 24–26) aplica la misma idea de relevo. Fuente: `integration/YOUTUBE_ESTUDIOS.md` y `evidence/youtube/2026-11-03-lote28/`.
