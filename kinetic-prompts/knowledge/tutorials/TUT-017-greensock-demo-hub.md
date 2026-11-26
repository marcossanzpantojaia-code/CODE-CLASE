---
id: TUT-017
titulo: GSAP Demo Hub — selección (Magnetic Button overwrite modes, Velocity Skew, Card Stack) + docs Flip, MorphSVG, React, a11y
creador: GreenSock / GSAP (oficial)
identidad_verificada: SI (gsap.com, demos.gsap.com, cuenta CodePen "GreenSock" enlazada desde demos.gsap.com)
repo: n/a (CodePen) — azmKBBJ (magnetic), eYpGLYL (velocity skew), Yzdzxem (card stack)
licencia: "Standard License" de GSAP en el pie del Demo Hub; licencia de cada demo no indicada → solo paráfrasis
video_url: n/a (vídeos de vista previa embebidos, no vistos)
narrado: n/a
transcript_status: n/a
code_route: B_CODIGO_PUBLICO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (docs) + CODIGO_INSPECCIONADO + DEMO_INSPECCIONADA (Yzdzxem, azmKBBJ; lote 5) + CODIGO_RESUMIDO_POR_LECTOR (eYpGLYL)
ultima_revision: 2026-10-26
---

# TUT-017 · GreenSock — documentación y demos oficiales

1. **Identidad.** Fuente oficial.
2. **Recursos procesados.**
   - Docs **Flip** (v3.15) → [FLIP-001](../transitions/FLIP-001-flip-transiciones-layout.md).
   - Docs **MorphSVG** (v3.15) → [MORPH-001](../transitions/MORPH-001-morphsvg.md).
   - **gsap.com/resources/React** → actualización de GS-001.
   - **gsap.com/resources/a11y** → actualización de A11Y-001.
   - Demo **Magnetic Button — overwrite modes** (CodePen azmKBBJ) → contraste de HOV-001.
   - Demo **Velocity Skew** (CodePen eYpGLYL) → [VEL-001](../scrolltrigger/VEL-001-skew-por-velocidad.md).
   - Demo **Card Stack** (CodePen Yzdzxem) → ejemplo de FLIP-001.
3. **Cómo se leyó el código de CodePen.** CodePen no es accesible por terminal en este entorno (proxy lo rechaza). Las páginas se leyeron con la herramienta de lectura web, que devuelve **un resumen automático del código, no el código literal**. Por eso el estado es `CODIGO_RESUMIDO_POR_LECTOR`: los parámetros citados son los que dio el resumen y deben volver a comprobarse en el editor de CodePen antes de pasar a VALIDADO.
4. **No accesibles en este lote.** CodePen PwqrzeG (cursor-tracking image preview), vYMzKZx (scrubbed bento gallery), LYwmdmr (reduced motion) devolvieron error del sitio. Solo metadatos del Demo Hub: el bento combina Flip + ScrollTrigger + scrub + ExpoScaleEase + gsap.context; la vista previa usa `quickTo`.
5. **Hallazgo clave (magnetic oficial).** El demo oficial existe precisamente para enseñar **conflictos de tweens**: si en cada `mousemove` se crea un `gsap.to()`, hay que elegir `overwrite` (`true`, `false`, `"auto"`); con `false` los tweens se acumulan. Parámetros según el resumen: fuerza 0,4 (botón) y 0,24 (texto interior, efecto parallax), seguimiento `power2.out` 0,4 s, retorno `elastic.out(1, 0.4)` 0,7 s; botón con vaivén de CustomWiggle opcional. HOV-001 (`quickTo`) evita el problema por diseño.
6. **Valor.** Máximo: es la fuente de verdad de la API. Complementa (no sustituye) las Skills oficiales `gsap-*`.


**Lote 5:** el código de Yzdzxem (Flip Cards) y azmKBBJ (Overwrite / Dynamic Tweens) se leyó **literalmente** del editor de CodePen en el navegador integrado y se ejecutaron las demos (gsap 3.15.0 y 3.15.1) → `CODIGO_INSPECCIONADO` + `DEMO_INSPECCIONADA`. Velocity Skew (eYpGLYL) sigue solo como resumen.
