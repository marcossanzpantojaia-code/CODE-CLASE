---
id: ART-001
titulo: Dirección de arte para una web "de producto héroe" — narrativa en 3 actos, objeto protagonista, paleta monocroma cálida, tipografía display en capas, luz de estudio e interfaz mínima; y por qué el prototipo A1 no llegaba
categoria: ux
estado: INVESTIGADO
evidencia: VIDEO_INSPECCIONADO (patrones P1, P5, P6, P7 y P11 de CASE-003, 6 reels) + DEMO_INSPECCIONADA (capturas de A1 y B1, lote 19) — criterios propios derivados, no normativos
versiones: —
perfil: cinematografico (y héroe de webs comerciales premium)
ultima_revision: 2026-10-27
---

# ART-001 · Dirección de arte de producto héroe

1. **Finalidad.** Dar a Claude Code una **receta de decisiones creativas** previa al código. A1 y B1 fallaban aquí, no en la técnica: avatares SVG sin rostro, poste de barbero en CSS, efectos discretos.
2. **Fuente.** Observación de los 6 reels de CASE-003, comparada con las capturas de A1/B1 (`evidence/integration/2026-10-27/comparacion_A1_B1/`).
3. **Ubicación.** Informe Enky §2–3.
4. **Resultado esperado.** Cada captura fija de la web parece un **fotograma de anuncio**: un único foco, luz con intención, tipografía como elemento gráfico y color controlado.
5. **Reglas observadas [OBS] → receta [criterio propio].**
   | Regla | Observado en la referencia | A1/B1 | Receta |
   |---|---|---|---|
   | **Un objeto protagonista por pantalla** | granos, gota, tenedor, cinta (P1) | varios elementos pequeños sin protagonista | 1 objeto que ocupe el 35–55 % del ancho del héroe, fotorrealista o render, con alfa |
   | **Historia en 3 actos** | "Section 01/02/03 — THE DROP / THE EXTRACTION / THE REWARD" (P5) | secciones de catálogo (servicios, galería, opiniones) | título de cada acto = un verbo del ritual del producto; el catálogo va **después** de la historia |
   | **Transformación entre actos** | el objeto muta (P2) | — | el objeto del acto 1 se convierte en el del acto 2 (SEQ-001) |
   | **Paleta monocroma por marca** | crema/café, negro/oro, crema/granate, ocre/ámbar (P6) | oscuro con latón, correcto pero plano | 1 color de fondo por acto dentro de una familia; acento único; sin degradados de interfaz genéricos |
   | **Tipografía como imagen** | display de 15–25 % del ancho, palabra fantasma, serif de alto contraste (P3, P4) | serif del sistema bien usada, sin escala dramática | titular de ≥ 9 vw en escritorio; una sola familia display + una de texto; microrrótulos en versalitas con `letter-spacing` 0,1–0,2 em |
   | **Luz de estudio** | lateral o de contra cálida, sombras de contacto, brillos en vidrio y metal | sin luz (ilustración plana) | luz coherente entre todos los recursos; sombra de contacto bajo el objeto |
   | **Interfaz mínima** | cabecera fina, botón píldora pequeño, puntos de progreso (P7, P11) | cabecera con muchos elementos | ≤ 4 enlaces + 1 botón; botón píldora de altura ≥ 44 px (A11Y-003, 2.5.8), aunque la referencia los hace más pequeños |
   | **Espacio negativo** | 40–60 % de la pantalla vacío | rejillas llenas | un solo grupo de texto por pantalla en la historia |
6. **Dependencias.** Recursos visuales de calidad: el paso que decide el resultado.
   - Opciones con **0 €**: fotografía propia del cliente; render en Blender (gratuito; LIGHT-002, PBR-001); objeto 3D en tiempo real con Three.js (TJ-*, LIGHT-001).
   - Generación de vídeo o imagen con IA: **no autorizada ni evaluada** (coste y licencias desconocidos).
7. **Procedimiento.**
   1. Escribir el **guion de 3 actos** con su objeto y su verbo.
   2. Hacer una **hoja de estilo visual**: paleta en OKLCH con contraste medido (UI-002), par tipográfico (TYPE-001), dirección de luz, ejemplo de composición por acto.
   3. Hacer un **storyboard** con un fotograma por acto y las transiciones entre ellos.
   4. Producir o elegir los recursos.
   5. Solo entonces, el código.
8. **Parámetros.** Proporción del objeto, tamaño del titular, color por acto, dirección de la luz, número de actos (3).
9. **Código.** No aplica (dirección de arte).
10. **Problemas habituales.**
    - Confundir "cinematográfico" con "oscuro y con GSAP".
    - Ilustración SVG genérica en lugar de fotografía.
    - Demasiadas secciones al mismo nivel.
    - Textos dentro de las imágenes (la referencia lo hace; en web es un error).
    - Copiar la identidad de la referencia.
11. **Accesibilidad.**
    - Titulares sobre el objeto: medir con TEST-003.
    - Botón píldora con el tamaño mínimo.
    - La historia no puede ocultar la información comercial: precios, horario y reserva deben estar a ≤ 1 pantalla del final de la historia y en el menú.
12. **Compatibilidad.** —
13. **Aplicaciones.** Barbería, cafetería, restaurante, cosmética, joyería.
14. **Pruebas.** EVAL-001, criterio C3 (calidad creativa) con la rúbrica, y C1 (fidelidad visual) frente al storyboard.
15. **Estado.** Receta derivada de la observación; no probada en una construcción.

**Lote 21:** origen de los recursos (fotografía o vídeo libre, render en Blender, sintéticos) comparado en `integration/ESTRATEGIA_RECURSOS_VISUALES.md`; licencias y máscaras en ASSET-001. Recomendación: render propio para el protagonista (continuidad + alfa + control) y fotografía propia o libre como complemento.

## Lote 22 · Selección de recursos y lista contra la landing genérica (obligatoria antes de programar)
**Selección de recursos visuales** (ASSET-001, BLEND-001):
1. ¿El realismo es esencial para el mensaje (producto, oficio, comida)? → **render o fotografía**, nunca una ilustración genérica.
2. ¿El protagonista se transforma o se mueve? → render (control fotograma a fotograma). ¿Solo se muestra? → la fotografía puede bastar.
3. ¿Hace falta transparencia para las capas? → render con `film_transparent`, o fotografía sobre fondo liso + recorte con un modelo MIT.
4. ¿Todos los recursos de una historia comparten la luz? Si no, se rechazan.
5. ¿Tienen licencia comercial clara y registrada en `RECURSOS.md`? Si no, no se usan.

**Lista contra lo genérico.** Si se cumple **2 o más**, el diseño vuelve a la mesa:
- héroe con un titular centrado sobre un degradado oscuro y dos botones;
- protagonista hecho con SVG, iconos o formas CSS donde la historia pide un objeto real;
- secciones de catálogo (servicios, galería, opiniones) **antes** de la historia;
- todas las secciones con la misma maquetación y el mismo fondo;
- titular sin interacción con el objeto (ni detrás ni delante);
- movimiento reducido a revelados de opacidad iguales en toda la página;
- paleta sin una regla por acto;
- ninguna referencia R1 consultada para la técnica (CASE-004).

## Lote 24 · Dirección de arte en movimiento
- **Color script:** antes de programar, una franja con el color dominante de cada estado (0–100 %) de cada acto. En la microdemo A: crema → crema → caramelo (el cambio coincide con el clímax del vertido). Regla: **un cambio de color por acto**, coincidiendo con un label de la narrativa (no a mitad de una lectura).
- **Continuidad de luz:** la dirección de la luz clave **no cambia** dentro de un acto; si cambia entre actos, que lo haga durante un puente (TRN-001), no en un corte.
- **Ritmo de escenas:** meseta (lectura) → movimiento principal → meseta. En la referencia, las mesetas duran ~2 s de vídeo (R2, la gota "respira" 14,7–17,0 s); en web, ≥ 10–15 % del recorrido del acto.
- **Jerarquía del producto:** el producto es lo más grande o lo más contrastado del encuadre. Si el titular lo supera en peso visual, el producto **sube de escala** o el titular **baja de contraste**.
- **Publicidad frente a plantilla:** composición asimétrica, un solo foco, escala editorial (titular gigante y recortado), espacio negativo **con intención** (el vacío equilibra el objeto; no queda sin rellenar) y recursos con la misma luz. Si falta una de estas cinco, se parece a una plantilla (lista contra lo genérico, lote 22).
