---
id: TXT-001
titulo: Texto animado por líneas, palabras o letras con SplitText (accesible y responsive)
categoria: animations
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA
versiones: SplitText reescrito en GSAP 3.13 (mitad de tamaño, 14 funciones nuevas); docs 3.15. Gratuito.
perfil: ambos
ultima_revision: 2026-10-27
---

# TXT-001 · SplitText

1. **Finalidad.** Revelar titulares por línea, palabra o letra (tema 2 de la captura).
2. **Fuente.** https://gsap.com/docs/v3/Plugins/SplitText/ · Uso real observado en el repositorio de JavaScript Mastery (ver CASE-001; su README declara SplitText para revelados de texto, archivo concreto no revisado).
3. **Ubicación.** Secciones Config Object, Responsive Line Splitting, Masking, Screen Reader Accessibility, Reverting, Tips & Limitations.
4. **Resultado.** Titulares que aparecen escalonados, a menudo desde detrás de una máscara.
5. **Explicación técnica.** SplitText envuelve cada línea/palabra/letra en un elemento propio. Desde 3.13:
   - **Accesibilidad automática** (`aria: "auto"`): `aria-label` en el padre y `aria-hidden` en los fragmentos, para que el lector de pantalla no deletree.
   - **Re-split responsive** (`autoSplit: true`): vuelve a dividir al cargar las fuentes o al cambiar el ancho si se dividen líneas. Las animaciones deben crearse **dentro de `onSplit()`** y **devolverse**, para que SplitText las revierta y sincronice su tiempo en cada re-split.
   - **Máscaras** (`mask: "lines" | "words" | "chars"`): envoltorio extra que recorta, ideal para revelados; solo un tipo a la vez.
6. **Dependencias.** gsap + SplitText (`gsap.registerPlugin(SplitText)`). Puede usarse sin el core.
7. **Procedimiento.** Dividir solo lo necesario → máscara por líneas → animar en `onSplit` → `revert()` al terminar si no se vuelve a necesitar.
8. **Parámetros.** `type` (por defecto los tres; reducir por rendimiento), `mask`, `autoSplit`, `onSplit`, `aria`, `linesClass`/`wordsClass`/`charsClass` (sufijo `++` numera), `propIndex` (variables CSS `--word: n`), `smartWrap`, `deepSlice`, `ignore`, `tag`.
9. **Código (adaptación propuesta, no ejecutada):**
   ```js
   gsap.registerPlugin(SplitText, ScrollTrigger);
   SplitText.create(".headline", {
     type: "lines, words", mask: "lines", autoSplit: true,
     onSplit: (self) => gsap.from(self.lines, {
       yPercent: 110, stagger: 0.08, duration: 0.9, ease: "power3.out",
       scrollTrigger: { trigger: self.lines[0], start: "top 85%" }
     })
   });
   ```
10. **Problemas habituales.** Dividir antes de cargar las fuentes (descuadres; SplitText avisa por consola si no hay `autoSplit`); `text-wrap: balance` interfiere; no funciona con `<text>` de SVG; dividir letras sin palabras provoca cortes raros (usar `smartWrap`); el kerning se pierde (`font-kerning: none` mitiga el salto); con `tag: "span"` no se aplican rotaciones/escala (elementos inline).
11. **Rendimiento y accesibilidad.** Miles de nodos son caros: dividir lo mínimo y revertir. `aria: "auto"` no conserva la semántica de enlaces internos: en ese caso `aria: "none"` + copia solo para lectores de pantalla. **SEO:** si se divide el `<h1>`, mantener `aria: "auto"` y metadatos title/description.
12. **Compatibilidad.** Emojis y caracteres extranjeros soportados; idiomas sin espacios (chino) requieren `prepareText`.
13. **Aplicaciones.** Hero de landings, títulos de sección, citas.
14. **Pruebas.** Redimensionar con el texto a medio animar; carga con red lenta (fuente tardía); lector de pantalla (VoiceOver/NVDA) lee el titular completo; reduced motion.
15. **Evidencia.** Documentación oficial completa. Código no ejecutado.

**Lote 15 (Skill oficial `gsap-plugins`, GS-004):** al dividir en letras, `font-kerning: none; text-rendering: optimizeSpeed;` evita el salto de *kerning*; `smartWrap: true` si solo se divide en letras; `deepSlice` (por defecto) para `<strong>` que cruza líneas; SplitText no admite `<text>` de SVG; con enlaces dentro, `aria: "none"` + copia solo para lectores de pantalla.

## Lote 24 · Tipografía cinematográfica (composición, no solo animar letras)
- **Animar letras ≠ componer:** la composición la deciden la escala (titular ≥ 9 vw), el corte (palabras gigantes recortadas por el borde del escenario), la relación con el objeto (detrás, enhebrado o delante; DEPTH-001) y la **meseta de lectura** (MOT-001). El revelado es secundario.
- **Cambio de texto entre escenas sin parpadeo** (probado en la microdemo C): el texto cambia **solo cuando todas sus líneas están fuera de la máscara** (`yPercent` ≥ 110); se elige por **progreso** y no por eventos, para que sea reversible.
- **Revelado por líneas con desfase** (microdemo A): cada línea con +0,02 de progreso. En GSAP: `SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true, onSplit: s => tl.from(s.lines, { yPercent: 110, stagger: .02 }) })`; con `autoSplit`, la animación debe crearse **dentro** de `onSplit` y devolverse (TXT-001 §5).
- **Texto que cambia de posición entre escenas:** el mismo titular pasa de grande a la izquierda a pequeño arriba → `Flip.fit` hacia un hueco (CONT-001, estrategia 2). Si cambia de tamaño, usar `scale` (no `font-size`) para que no se vuelva a maquetar en cada fotograma.
- **Palabra fantasma:** `aria-hidden="true"`, contraste ≤ 6 % con el fondo, paralaje lento (plano lejano).
- **Accesibilidad:** el titular es un `h1`/`h2` real; SplitText añade `aria-label` con el texto completo (TXT-001); nada de texto importante dentro de las imágenes (los reels lo hacen; CASE-003).
- **Responsive:** el titular **no** se enhebra en móvil (solape 0 en la microdemo C a 375 px); va encima del objeto.
