---
id: FOOT-001
titulo: Footer que se revela bajo el contenido (clip-path + sticky o fixed)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (repo olivierlarose/sticky-footer, commit 3a1c015) + ARTICULO_AUTOR_ANALIZADO (blog, 2024-05-21)
versiones: Next 14.2.3, lenis ^1.0.45, Tailwind (clases utilitarias); técnica = CSS puro
perfil: ambos (muy útil en comercial)
ultima_revision: 2026-10-26
---

# FOOT-001 · Sticky / reveal footer

1. **Finalidad.** Al llegar al final, el contenido sube y **descubre** un footer grande que parece estar "debajo" de la página (patrón frecuente en webs premiadas, según el autor).
2. **Fuente.** Olivier Larose, blog.olivierlarose.com/tutorials/sticky-footer (artículo del autor = versión escrita; **no enlaza vídeo**); repo github.com/olivierlarose/sticky-footer; demo /demos/sticky-footer (no inspeccionada: navegador limitado).
3. **Ubicación.** `src/components/Footer1.jsx` (sticky) y `Footer2.jsx` (fixed).
4. **Resultado [COD].** Footer de 800 px que permanece anclado al fondo de la ventana mientras la última sección se desliza por encima.
5. **Explicación [COD].** Contenedor `relative` de **800 px** con `clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)` (recorta a su propio rectángulo lo que hay dentro, incluso elementos fijos).
   - **Variante fixed:** hijo `position: fixed; bottom: 0; height: 800px` → solo se ve a través de la "ventana" que deja el contenedor recortado.
   - **Variante sticky:** hijo `relative` de `calc(100vh + 800px)` desplazado `top: -100vh`; dentro, el contenido de 800 px con `position: sticky; top: calc(100vh - 800px)` → se queda pegado al borde inferior. No depende de `position: fixed`.
   - Discrepancia registrada: el artículo llama "Method 1" a fixed y "Method 2" a sticky; en el repo `Footer1` es la versión sticky y es la que usa la página.
6. **Dependencias.** Ninguna para el efecto (Lenis solo suaviza el scroll de la demo).
7. **Procedimiento para Claude Code.** Usar la variante sticky (o fixed) con altura en una custom property (`--footer-h`); el footer debe seguir siendo un `<footer>` con enlaces reales; en móvil, altura `min(800px, 100svh)` (adaptación propia).
8. **Parámetros.** Altura del footer (800 px), clip-path rectangular.
9. **Código (estructura; repo sin licencia → paráfrasis).** `footer-wrap { position:relative; height:var(--h); clip-path: polygon(...) } > .track { position:relative; height:calc(100vh + var(--h)); top:-100vh } > .inner { position:sticky; top:calc(100vh - var(--h)); height:var(--h) }`.
10. **Limitaciones.** Altura fija (el contenido del footer no puede crecer libremente); si el footer es más alto que la ventana, parte queda inaccesible al principio; `h1` de 14vw en el contenido de ejemplo (TYPE-001); Lenis sin limpieza (patrón habitual del autor).
11. **Rendimiento / a11y.** Sin JS ni animación: coste nulo y sin problemas de movimiento; orden del DOM correcto.
12. **Compatibilidad.** `clip-path: polygon` y `sticky` universales.
13. **Aplicaciones.** Footer con datos de contacto y CTA de reserva para barberías, clínicas y despachos.
14. **Pruebas.** Contenido de footer más alto que 800 px; móvil con barra de direcciones dinámica; teclado (foco dentro del footer).
15. **Estado de evidencia.** Código y artículo leídos; demo no inspeccionada (panel del navegador oculto).
