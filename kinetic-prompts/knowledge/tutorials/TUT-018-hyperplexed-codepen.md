---
id: TUT-018
titulo: Hyperplexed — 3 pens con tutorial (Magical Hover Effect, Hacked Text Effect, Sliding Image Track)
creador: Hyperplexed
identidad_verificada: SI (el perfil de CodePen enlaza youtube.com/@hyperplexed y hyperplexed.io)
repo: CodePen — MWQeYLW, rNrJgrd, MWXBRBp
licencia: pens públicos → MIT por defecto (política de CodePen: "public Pens are MIT Licensed")
video_url: rNrJgrd enlaza https://youtu.be/W5oawMJaXbU ("2 min tutorial"); MWQeYLW indica "w/ Tutorial" — NO vistos
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO (código literal del editor de CodePen, navegador integrado)
ultima_revision: 2026-10-26
---

# TUT-018 · Hyperplexed

1. **Identidad.** Perfil codepen.io/Hyperplexed ("Stay perplexed, friends.") con enlaces a su YouTube y web. Pens más populares: App Menu With Lock Screen, Magical Hover Effect, Sliding Image Track, Futuristic Card Effect, Hacked Text Effect, Kippo Hover Card Effect.
2. **Qué construyen.** Foco de luz sobre rejilla de tarjetas (recreación de linear.app); texto que se descifra al hover (inspirado en kprverse.com); pista de imágenes arrastrable con parallax interno.
3. **Stack.** HTML/CSS/JS vanilla; Web Animations API; Font Awesome (iconos de la demo).
4. **Leído.** HTML, CSS y JS de los 3 pens (literal).
5. **Técnicas.** → [HOV-004](../interactions/HOV-004-spotlight-tarjetas.md), [TXT-003](../animations/TXT-003-texto-scramble.md), [DRAG-001](../interactions/DRAG-001-pista-imagenes-arrastrable.md).
6. **Fallos.** Acumulación de animaciones WAAPI en cada `mousemove` (DRAG-001); reescritura de `innerText` sin protección para lectores (TXT-003); efectos solo de ratón.
7. **Valor.** Alto: efectos premium con **cero dependencias**, ideales para el perfil A con las correcciones de accesibilidad indicadas.
8. **Evidencia.** Código literal; demos y vídeos no vistos.
