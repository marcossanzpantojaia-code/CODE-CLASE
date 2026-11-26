---
id: UI-001
titulo: "The Linear Look" — anatomía de la estética SaaS oscura (brillos, bordes finos, cristal, rejillas, bento)
categoria: ux
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Frontend Horse) (TUT-024)
versiones: CSS moderno
perfil: cinematografico / tecnológico (no para clínica o despacho clásicos)
ultima_revision: 2026-10-26
---

# UI-001 · The Linear Look

1. **Finalidad.** Reconocer y reproducir con criterio el estilo visual dominante en webs de producto tecnológico (Linear, Raycast, Vercel, Supabase, Resend, Clerk…), y saber cuándo **no** usarlo.
2. **Fuente.** https://frontend.horse/articles/the-linear-look (sin fecha visible; referencias posteriores a feb-2024; el propio artículo avisa de que la lista de webs puede estar desactualizada). Webs citadas: Linear, AuthKit, Resend, Gitness, Terzo, Gitbook, Raycast, Particl, Supabase, Whop, Reflect, Nuxt Labs, Railway, Clerk, Vercel, Million.dev, Fig, IDX. **No se abrió ninguna** de esas webs (no hay observación propia).
3. **Ingredientes [artículo].**
   - Fondo oscuro para que la luz destaque.
   - Titulares con degradados muy sutiles.
   - "Derrames" de color borrosos (glows) detrás de CTA y héroe.
   - Bordes de 1 px casi invisibles con un **brillo especular** en un tramo (a veces animado).
   - Cristal esmerilado: `backdrop-filter: blur(6px)` sobre superficies translúcidas.
   - Sans-serif en todos los casos.
   - Rejillas de fondo (líneas, puntos o guiones) muy tenues; líneas SVG finas tipo "circuito" que conectan un logo central con servicios.
   - Composición **bento** (rejilla de tarjetas de distintos tamaños).
   - Capturas de producto, fragmentos de código e ilustraciones vectoriales en lugar de fotos de stock y personas.
4. **Recetas CSS [propuesta propia, no del artículo; no ejecutadas].**
   - Borde con brillo: `background: linear-gradient(var(--card), var(--card)) padding-box, conic-gradient(from var(--angle), transparent 70%, #fff8, transparent) border-box; border: 1px solid transparent;` animando `--angle` con `@property` (CSS-007).
   - Rejilla de puntos: `background-image: radial-gradient(#ffffff14 1px, transparent 1px); background-size: 24px 24px;` + máscara radial para desvanecer bordes.
   - Glow: elemento absoluto con `filter: blur(80px)` y color de marca a baja opacidad, `pointer-events: none`.
   - Bento: `grid-template-columns: repeat(6, 1fr)` con `span` 2/3/4 y `grid-auto-flow: dense`; colapsa a 1 columna en móvil.
5. **Cuándo no usarlo [criterio propio].** Barberías, clínicas y despachos venden confianza y personas: fotos reales del equipo y del local convierten mejor que capturas abstractas (UX-002). Se puede tomar prestado solo el orden (bento de servicios, bordes finos) con paleta clara.
6. **Errores frecuentes [criterio propio].** Contraste insuficiente del texto gris sobre negro (A11Y-003); glows y `backdrop-filter` en exceso (GPU móvil); copiar el estilo sin producto que mostrar.
7–14. **Pruebas.** Contraste de todos los grises; rendimiento con `backdrop-filter` en gama media; modo claro equivalente (DS-001).
15. **Estado.** Artículo leído; recetas de §4 son propias y no se han probado.
