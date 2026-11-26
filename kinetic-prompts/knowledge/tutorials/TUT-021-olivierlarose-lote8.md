---
id: TUT-021
titulo: Olivier Larose — lote 8 (Sticky Cursor, Curved Menu, 3D Wave on Scroll, Infinite Text Move on Scroll, SVG Morph)
creador: Olivier Larose
identidad_verificada: SI (repos github.com/olivierlarose enlazados desde blog.olivierlarose.com)
repo: olivierlarose/sticky-cursor (06efcb6), /curved-menu (48ef7d2), /3d-wave-on-scroll (0ea6d97), /infinite-text-move-on-scroll (9842aca), /svg-morph (03bcc91)
licencia: ninguna declarada en los cinco repos → solo paráfrasis
video_url: sticky-cursor https://www.youtube.com/watch?v=MJ_cRRqBfU8 · curved-menu https://www.youtube.com/watch?v=NOJCt7qyh9c (ambos enlazados en los artículos; NO vistos). 3d-wave: el artículo no enlaza vídeo. infinite-text y svg-morph: no consultado.
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA (se usa la versión escrita del autor cuando existe)
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO (5) + ARTICULO_AUTOR_ANALIZADO (3)
ultima_revision: 2026-10-26
---

# TUT-021 · Olivier Larose (lote 8)

1. **Qué construye.** Cursor que se imanta (HOV-005), menú lateral con curva SVG (MENU-001), imagen WebGL ondulada que se expande con el scroll (GL-004), marquesina infinita reversible (TXT-005), morph de iconos con flubber (MORPH-001, anexo).
2. **Stack.** Next.js 13 App Router + framer-motion 10/11 (4 de 5); GSAP solo en infinite-text; R3F + drei + leva en 3d-wave.
3. **Patrones del autor (transversales, [COD]).**
   - Ease favorita `[0.76, 0, 0.24, 1]` en menús y transiciones (también en tutoriales anteriores).
   - Valores de animación fuera del componente (`anim.js` con variantes) y `custom={index}` para escalonar.
   - Interpolaciones con `transform()` de framer-motion (mapear rango → rango) en lugar de fórmulas a mano.
   - Contenedor alto + hijo `sticky` + `useScroll({ offset: ['start start','end end'] })` como armazón de casi todos los efectos de scroll (también en CARD-001, ZOOM-001).
4. **Fallos recurrentes del autor [COD].** Lectura de `window` en el render; animaciones dependientes de los Hz (`+= constante` por frame); rAF/listeners sin limpieza; `div` con `onClick` en lugar de `button`; sin `prefers-reduced-motion`; paneles de depuración (leva) en producción.
5. **Valor por perfil.** B alto; A: menú curvo y cursor magnético en el CTA, con las correcciones.
6. **Evidencia.** Código leído; artículos de sticky-cursor, curved-menu y 3d-wave leídos; **0 vídeos vistos**; nada ejecutado ni medido (panel del navegador oculto).
