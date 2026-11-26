---
id: PHYS-001
titulo: Física mínima para animación web — muelles, amortiguación, oscilación y su equivalencia en GSAP/framer-motion
categoria: animations
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (The Nature of Code, Daniel Shiffman / The Coding Train, cap. "Oscillation") + CODIGO_INSPECCIONADO (valores de muelles en HOV-005, BTN-001) + ARTICULO (Fireship, modal)
versiones: independiente (p5.js en la fuente)
perfil: ambos
ultima_revision: 2026-10-26
---

# PHYS-001 · Física para animar

1. **Finalidad.** Entender qué significan `stiffness`, `damping`, `mass`, `elastic.out(1, .5)` o una onda `sin()` para elegir valores con criterio en lugar de copiarlos (temas 2, 10 y 13).
2. **Fuentes.** *The Nature of Code* (2.ª ed.), capítulo "Oscillation", gratuito en https://natureofcode.com/oscillation/ (la licencia del texto/código no figura en la página leída; repo `nature-of-code/noc-book-2` pendiente de comprobar → **solo paráfrasis**). Canal The Coding Train: vídeos **no vistos**. Fireship, lección "Build an animated modal with Framer Motion" (https://fireship.io/lessons/framer-motion-modal/, sin fecha visible).
3. **Conceptos [libro].**
   - **Muelle (ley de Hooke):** fuerza = −k·extensión (extensión = longitud actual − longitud en reposo). `k` = rigidez. En el libro, una clase `Spring` con ancla, longitud de reposo y `k = 0.2` aplica la fuerza al objeto cada frame; opcionalmente se limita la longitud.
   - **Amortiguación:** el capítulo la aplica al péndulo multiplicando la velocidad angular por **0,99** cada frame (pierde un 1 % por frame).
   - **Movimiento angular:** igual que el lineal (aceleración → velocidad → ángulo), en radianes.
   - **Oscilación armónica:** `x = amplitud · sin(2π · frame / periodo)`; frecuencia = 1/periodo; alternativa incrementando un ángulo. **Ondas:** muchos puntos con `y = A·sin(ángulo)` desfasados `deltaAngle` y un `startAngle` que avanza cada frame (= GL-004 en un shader).
4. **Traducción a librerías [criterio propio + valores [COD] de la biblioteca].**
   | Concepto | framer-motion | GSAP |
   |---|---|---|
   | Rigidez k | `stiffness` (300–500 en HOV-005/Fireship) | —/ `elastic.out(amplitud, periodo)` |
   | Amortiguación | `damping` (5 = muy rebotón en el botón magnético de Olivier; 20–25 = asentado en el cursor y en el modal de Fireship; 15 en la variante "suspensión mala") | menor periodo/amplitud = menos rebote |
   | Masa | `mass` (0,5 = más ágil) | — |
   | Seguimiento suave | `useSpring(motionValue)` | `gsap.quickTo(el, "x", { duration, ease })` (HOV-001) |
   | Oscilación continua | `animate(..., { repeat: Infinity, repeatType: "mirror" })` | `yoyo: true, repeat: -1, ease: "sine.inOut"` |
5. **Independencia de la tasa de refresco [criterio propio; ver GL-004 y TXT-005].** El libro trabaja "por frame" (p5.js a 60 fps). En la web hay pantallas de 120 Hz: multiplicar por `delta` o usar un factor por frame corregido `f^(dt·60)` (p. ej. amortiguación `0.99^(dt·60)`) [CALC: equivalente exacto de aplicar 0,99 por frame a 60 fps].
6. **Procedimiento para elegir valores.** (1) Interfaz seria (clínica, despacho): sin rebote — `damping` alto o eases `power2/3.out`; (2) microinteracción lúdica (botón, favorito): un rebote visible (`elastic.out(1, .5)` como Aaron Iker); (3) seguimiento del ratón: muelle crítico o `quickTo` 0,3–0,6 s; (4) reduced motion: sustituir muelles por cambios instantáneos o fundidos.
7. **Anexo Fireship (modal).** [artículo] `AnimatePresence` + variantes `hidden/visible/exit`, telón con `onClick` para cerrar y `stopPropagation` en el contenido; muelle `damping 25, stiffness 500`. La lección **no trata accesibilidad** (sin foco, Esc ni inert) → para producción, `<dialog>` (A11Y-004) y animar con framer o CSS.
8–13. **Aplicaciones.** Cursor y botones (HOV-001/005, BTN-001), ondas en WebGL (GL-004), péndulos/cuelgues decorativos, "gelatina" en menús.
14. **Pruebas.** Comparar 60/120 Hz; reduced motion; que el rebote no supere los límites del contenedor (recortes).
15. **Estado.** Capítulo y lección leídos; tabla §4 = síntesis propia sin pruebas.
