---
id: TXT-002
titulo: Revelados de texto — (A) opacidad letra a letra con scrub, (B) líneas que emergen de una máscara
categoria: animations
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-012 con GSAP; TUT-013 con framer-motion) + DOCUMENTACION_OFICIAL_ANALIZADA (SplitText, TXT-001) + DEMO_INSPECCIONADA **solo variante A** (lote 5)
versiones: fuente A gsap ^3.11.5; fuente B framer-motion ^10.12.16; propuesta gsap 3.15 + SplitText
perfil: ambos
ultima_revision: 2026-10-26
---

# TXT-002 · Revelados de texto

1. **Nombre y finalidad.** Dos patrones de lectura muy usados (tema 2): (A) párrafo atenuado que se "enciende" letra a letra al hacer scroll; (B) titulares cuyas líneas suben desde detrás de un borde invisible al entrar en pantalla.
2. **Fuentes.** Olivier Larose: `text-gradient-opacity-on-scroll` (TUT-012) y `text-mask-animation` (TUT-013). Contraste: docs SplitText (TXT-001) y a11y oficial de GSAP.
3. **Ubicación.** `src/app/page.js` de cada repo.
4. **Resultado.** (A) degradado de opacidad que avanza con el scroll; (B) aparición escalonada de líneas.
5. **Explicación técnica (observada).**
   - **A:** cada carácter en un span a opacidad 0,2; un tween a opacidad 1 con `ease: "none"`, `stagger: 0.1` y `scrub: true` sobre el bloque (`start: "top"`, `end: +innerHeight/1.5`). El stagger define la "anchura" del degradado.
   - **B:** cada línea dentro de un contenedor `overflow: hidden`; la línea pasa de `y: 100%` a 0 (0,75 s, curva [0.33, 1, 0.68, 1], retardo 0,075 s × índice) una sola vez al alcanzar el 75 % de visibilidad.
6. **Dependencias.** Propuesta: gsap + ScrollTrigger + SplitText (gratuito).
7. **Procedimiento (adaptación).** Usar SplitText en lugar de divisiones manuales: A → `type: "chars"` (o "words", más legible y barato); B → `type: "lines", mask: "lines", autoSplit: true` y animar dentro de `onSplit()` (TXT-001). La accesibilidad automática de SplitText (≥3.13: `aria-label` en el padre, `aria-hidden` en los trozos) evita la lectura letra a letra.
8. **Parámetros.** A: opacidad base (0,2), stagger (0,1), recorrido de scroll. B: duración (0,75), ease (la curva `[0.33, 1, 0.68, 1]` aproxima easeOutCubic = **`power2.out`** en GSAP; corregido en v0.5.0, antes decía `power3.out`), retardo por línea (0,075), umbral de entrada.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   // A
   SplitText.create(".manifesto", { type: "words", onSplit: s =>
     gsap.fromTo(s.words, { opacity: 0.2 }, { opacity: 1, ease: "none", stagger: 0.1,
       scrollTrigger: { trigger: ".manifesto", start: "top 80%", end: "bottom 40%", scrub: true } }) });
   // B
   SplitText.create(".title", { type: "lines", mask: "lines", autoSplit: true, onSplit: s =>
     gsap.from(s.lines, { yPercent: 100, duration: 0.75, ease: "power2.out", stagger: 0.075,
       scrollTrigger: { trigger: ".title", start: "top 75%", once: true } }) });
   ```
10. **Problemas detectados en las fuentes.** Refs acumuladas con `push` en cada render (A); palabras como `<p>` y letras sin aria (A); líneas fijas en el código que no coinciden con las líneas reales al cambiar el ancho (B); discrepancia artículo/repo en el detector de visibilidad (B); `end` fijo en píxeles (A).
11. **Rendimiento / a11y.** Dividir por letras multiplica nodos: preferir palabras en párrafos largos. Reduced motion: texto a opacidad 1 sin animación. Contraste: la opacidad 0,2 inicial no debe ser el único estado legible si el usuario no hace scroll (en A, el texto ya está en el DOM y es legible por lectores; visualmente comprobar contraste mínimo).
12. **Compatibilidad.** Universal; `mask` de SplitText desde 3.13.
13. **Aplicaciones.** Claim de marca, misión de un despacho, titulares de sección.
14. **Pruebas.** Resize (re-split), lector de pantalla, reduced motion, scroll adelante/atrás (A), entrada única (B).
15. **Estado de evidencia.** Código leído; adaptación SplitText sin probar.


## Inspección visual (lote 4, v0.5.0) — BLOQUEADA

- Demo pública: https://blog.olivierlarose.com/demos/text-gradient-opacity-on-scroll y /demos/text-mask-animation
- Intento 1: Chromium preinstalado en la nube (Playwright) → `ERR_TUNNEL_CONNECTION_FAILED` (la salida de red de esta sesión no permite ese host).
- Intento 2: navegador del usuario (Claude in Chrome) → extensión no conectada.
- No se repite el intento. **Nada de esta ficha ha sido visto en pantalla.**

## Estados derivados del código (calculados, NO observados)

- **Variante A (degradado):** 178 caracteres sin espacios; cada tween dura 0,5 (por defecto de GSAP) con stagger 0,1 → duración total 18,2 unidades repartidas en 600 px de scroll (innerHeight/1,5 a 900 px) ⇒ **≈3,4 px de scroll por carácter** y **≈5 caracteres en transición a la vez** (0,5/0,1): esa es la "anchura del degradado" que describe el autor. Estado inicial: todo a 0,2; intermedio: la mitad del texto a 1, ~5 letras en gradiente; final: todo a 1.
- **Variante B (máscara):** líneas a 0,000 / 0,075 / 0,150 / 0,225 s → fin 0,750 / 0,825 / 0,900 / 0,975 s. Con easeOutCubic, a mitad de su duración cada línea ya ha recorrido el **87,5 %** del trayecto: la sensación es de "golpe rápido y asentamiento", total < 1 s.


## Inspección visual REAL (lote 5, 2026-10-26) — `DEMO_INSPECCIONADA`
Navegador integrado de Cowork; viewport 747×894, DPR 1,5, 60 fps. Evidencia: [evidence/visual/2026-10-26](../evidence/visual/2026-10-26/README.md). **No es el vídeo del tutorial.**

- **Demo A:** https://blog.olivierlarose.com/demos/text-gradient-opacity-on-scroll — 178 spans de una letra (coincide con el cálculo), sin Lenis.
- **Medición** (opacidad computada de cada letra tras saltos de scroll): 0 px → 0 letras a 1; 100 → 11; 200 → 41; 300 → 72; 400 → 102; 500 → 133; 600 → 164; 700 → 178. **≈30,6 letras por 100 px = 3,3 px por letra** (cálculo previo 3,4). En todos los puntos intermedios hay **exactamente 5 letras en transición** (predicho: 0,5/0,1 = 5). El efecto empieza cuando el `main` (top 50 px, bajo la cabecera de la demo) llega arriba y termina ~600 px después.
- **Captura** `TXT-002A_scroll350_degradado.jpg`: dos líneas y media en blanco, banda de transición visible en "at its", resto en gris al 20 %.
- **Variante B (máscara de líneas):** demo no inspeccionada en esta sesión.


### Trazabilidad v0.6.1 (corrección tras auditoría)
Etiquetas: **[OBS]** visto en captura · **[MED]** medido en el DOM con datos guardados · **[CALC]** calculado a partir del código o de los datos · **[EST]** estimación (latencia de herramienta, ojo humano) · **[COD]** leído en el código.
- **Variante A (opacidad letra a letra) — inspeccionada:** [MED] conteos de letras por posición de scroll ([TXT-002A_letras_por_scroll.json](../evidence/visual/2026-10-26/data/TXT-002A_letras_por_scroll.json)); [CALC] 3,3 px por letra (= 100/30,6 de la pendiente media 100→600 px); [OBS] captura `TXT-002A_scroll350_degradado.jpg`.
- **Variante B (máscara de líneas) — NO inspeccionada en el lote 5.** Sus tiempos (0,75 s, retardo 0,075 s, fin a 0,975 s) son **[COD]+[CALC]**, no observados. Ver lote 6 más abajo.


## Lote 6 — variante B (máscara de líneas): inspección PARCIAL
Demo: https://blog.olivierlarose.com/demos/text-mask-animation · evidencia: [lote 6](../evidence/visual/2026-10-26-lote6/README.md)
- **[MED] estructura:** 4 bloques × 4 líneas (16 máscaras), cada línea en un contenedor de **45 px de alto con `overflow: hidden`**, bloques de 181 px en y = 350 / 681 / 1012 / 1342 (viewport 747×894). Las 4 frases son cadenas fijas y a este ancho **caben en una línea** (ancho del texto 609 px = ancho del contenedor): a 747 px no aparece el problema de líneas partidas señalado en el campo 10, pero sigue existiendo en anchos menores (no comprobado).
- **[CALC]** con umbral del 75 %, el bloque 3 debería dispararse a partir de scrollY ≈ 1012 + 0,75·181 − 894 ≈ 254 px.
- **NO medido:** la animación (0,75 s, retardo 0,075 s): el panel del navegador estaba oculto (~1 frame/s) y el script de medición agotó el tiempo. Los tiempos siguen siendo **[COD]**.
