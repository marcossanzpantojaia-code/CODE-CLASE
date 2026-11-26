---
id: TUT-042
titulo: Codrops — "How to Build Cinematic 3D Scroll Experiences with GSAP" (cilindro OGL y dirección de escena R3F)
creador: Joseph Santamaria (publicado en Codrops)
identidad_verificada: SI (firma del artículo en tympanus.net/codrops; repo enlazado desde la demo: github.com/JosephASG)
repo: https://github.com/JosephASG/codrops-cinematic-scroll-animations (commit 7a56d1f, 2026-03-16)
licencia: el README declara MIT pero el repo no contiene archivo LICENSE → solo paráfrasis y fragmentos mínimos
video_url: no (el artículo incrusta grabaciones MP4 de pantalla; no vistas)
narrado: n/a
transcript_status: n/a
code_route: B_CODIGO_PUBLICO + ARTICULO
evidencia: ARTICULO_AUTOR_ANALIZADO + CODIGO_INSPECCIONADO
ultima_revision: 2026-10-27
---

# TUT-042 · Escenas 3D cinematográficas con scroll (Codrops)

1. **Estudiado.** Artículo (19-11-2025) y repo: `src/lib/variant-2/scene-data.ts` y `types.ts` (planos como datos), `src/components/pages/variant-2/cinematic-scene-showcase.tsx` (cámara, timeline, SplitText, limpieza), `package.json` (gsap ^3.13, three ^0.180, R3F ^9.4, drei ^10.7, ogl ^1.0.11) y cabecera del `.glb` (3 MB, sin Draco/Meshopt, 1 textura PNG) → apéndice del lote 13 en CAM-001.
2. **No estudiado.** Variante 1 (cilindro OGL y shaders) en detalle; demos en vivo y vídeos; no se ejecutó nada.
3. **Valoración.** Patrón útil (plano = datos con tramo de scroll); implementación con antipatrones documentados en CAM-001 y ST-004.
