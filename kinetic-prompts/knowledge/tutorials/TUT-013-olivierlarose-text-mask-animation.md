---
id: TUT-013
titulo: Text Mask Animation (líneas que emergen de una máscara)
creador: Olivier Larose
identidad_verificada: SI
repo: https://github.com/olivierlarose/text-mask-animation
commit: 63ce338 (2023-05-27)
licencia: ninguna declarada → no reproducir código
video_url: https://www.youtube.com/watch?v=vKoAKIhI0OE (embebido en el blog; NO visto)
blog: https://blog.olivierlarose.com/tutorials/text-mask-animation (2023-05-07)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO + ARTICULO_AUTOR_ANALIZADO
ultima_revision: 2026-10-26
---

# TUT-013 · Olivier Larose — Máscara de líneas al entrar en pantalla

1. **Identidad.** Blog del autor → repo + vídeo.
2. **Qué construye.** Bloques de 4 líneas que, al entrar en pantalla, suben desde debajo de una línea invisible, una tras otra.
3. **Stack.** Next 13.4.4, framer-motion ^10.12.16, **react-intersection-observer ^9.4.3**.
4. **Archivos leídos.** `src/app/page.js`, `page.module.css`.
5. **Técnicas extraídas.** → [TXT-002](../animations/TXT-002-revelado-texto-scroll-y-mascara.md) variante B. Parámetros: contenedor de línea con `overflow: hidden`; línea de `y: 100%` a `0`, 0,75 s, curva `[0.33, 1, 0.68, 1]` (equivale aproximadamente a un *ease-out* cúbico), retardo 0,075 s × índice; se dispara una sola vez con un umbral de visibilidad del 75 %.
6. **Discrepancia artículo ↔ repo (registrada).** El artículo describe el hook `useInView` de framer-motion con margen 75 % (y luego −75 %); el repo usa `useInView` de **react-intersection-observer** con `threshold: 0.75` y `triggerOnce`. Para la biblioteca manda el repo (código real).
7. **Fallos detectados.** Las líneas son cadenas fijas: en otro ancho de pantalla el texto se reparte en más líneas y la máscara por "línea" deja de coincidir con las líneas visuales. SplitText con `type: "lines"`, `mask: "lines"` y `autoSplit` lo resuelve (TXT-001). Sin reduced motion.
8. **Huecos visuales.** Ninguno crítico.
9. **Valor.** A: alto (titulares de secciones); B: alto.
10. **Evidencia.** Código y artículo leídos. No ejecutado. Vídeo no visto.
