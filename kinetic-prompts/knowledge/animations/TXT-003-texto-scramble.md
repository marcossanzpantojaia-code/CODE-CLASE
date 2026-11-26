---
id: TXT-003
titulo: Texto que se "descifra" letra a letra al pasar el ratón (scramble / hacked text)
categoria: animations
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (código literal, CodePen Hyperplexed/rNrJgrd, MIT)
versiones: JS vanilla (2023)
perfil: ambos (titulares de marca)
ultima_revision: 2026-10-26
---

# TXT-003 · Scramble text

1. **Finalidad.** Titular que, al hover, muestra letras aleatorias que se van fijando de izquierda a derecha hasta formar la palabra (tema 2).
2. **Fuente.** Hyperplexed, "Hacked Text Effect", https://codepen.io/Hyperplexed/pen/rNrJgrd (2023-01-23); el pen enlaza un vídeo de "2 min tutorial" (https://youtu.be/W5oawMJaXbU) **no visto** y la web que lo inspiró (kprverse.com).
3. **Ubicación.** JS del pen (≈20 líneas); el texto original vive en `data-value`.
4. **Resultado [CALC desde el código].** Intervalo de 30 ms; cada tick fija 1/3 de letra → 90 ms por letra; "HYPERPLEXED" (11 letras) se resuelve en ≈ 33 ticks ≈ **1,0 s**. Las letras no fijadas cambian a una mayúscula aleatoria en cada tick (≈33 cambios/s).
5. **Explicación [COD].** `setInterval` que reescribe `innerText`: índice < iteración → letra real de `data-value`; resto → letra aleatoria A–Z; `iteration += 1/3`; se limpia el intervalo previo en cada `mouseover` y al terminar.
6. **Dependencias.** Ninguna. Alternativa oficial: **ScrambleTextPlugin de GSAP** (gratuito desde la adquisición por Webflow; no analizado en este lote).
7. **Procedimiento para Claude Code.** Mantener el texto accesible: `aria-label` con el texto real en el elemento y los caracteres animados en un hijo `aria-hidden="true"`, o usar ScrambleText; fuente monoespaciada (la demo usa Space Mono) para que el ancho no salte; disparar también con `:focus` si es un enlace; respetar reduced motion (mostrar el texto sin animar).
8. **Parámetros.** Intervalo (30 ms), paso (1/3 letra), alfabeto (A–Z).
9. **Código.** Idea completa en §5 (pen MIT; no se copia literal).
10. **Limitaciones (análisis propio).** Reescribir `innerText` 33 veces/s puede hacer que un lector de pantalla anuncie basura si el elemento es una región viva o recibe foco; en fuentes proporcionales el ancho cambia (CLS si empuja contenido); `setInterval` sigue aunque la pestaña esté oculta (throttled).
11. **Rendimiento.** Trivial.
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** Nombre de marca en una landing tecnológica, menú, títulos de sección en una web de agencia.
14. **Pruebas.** Lector de pantalla, fuentes no monoespaciadas, hover repetido rápido, reduced motion.
15. **Estado de evidencia.** Código literal leído; vídeo y demo no vistos.
