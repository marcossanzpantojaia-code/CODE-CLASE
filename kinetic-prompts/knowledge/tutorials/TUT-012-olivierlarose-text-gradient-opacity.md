---
id: TUT-012
titulo: Text Gradient Opacity On Scroll
creador: Olivier Larose
identidad_verificada: SI
repo: https://github.com/olivierlarose/text-gradient-opacity-on-scroll
commit: 912a9f7 (2023-06-10)
licencia: ninguna declarada → no reproducir código
video_url: https://www.youtube.com/watch?v=m-ROvHYyoqk (embebido en el blog; NO visto)
blog: https://blog.olivierlarose.com/tutorials/text-gradient-opacity-on-scroll (2023-06-10)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO + ARTICULO_AUTOR_ANALIZADO + DEMO_INSPECCIONADA (lote 5)
ultima_revision: 2026-10-26
---

# TUT-012 · Olivier Larose — Texto que se "ilumina" letra a letra con el scroll

1. **Identidad.** Blog del autor → repo + vídeo.
2. **Qué construye.** Un párrafo grande en gris tenue (opacidad 0,2) cuyas letras pasan a opacidad 1 una tras otra según se hace scroll: un "degradado" de lectura que avanza.
3. **Stack.** Next 13.4.2, React 18.2, **gsap ^3.11.5** + ScrollTrigger (uno de los pocos tutoriales del autor con GSAP).
4. **Archivos leídos.** `src/app/page.js`, `page.module.css`.
5. **Técnicas extraídas.** → [TXT-002](../animations/TXT-002-revelado-texto-scroll-y-mascara.md) variante A. Parámetros: opacidad inicial 0,2 (CSS), tween a 1 con `ease: "none"`, `stagger: 0.1`, `scrub: true`, `start: "top"`, `end` = +innerHeight/1,5. El autor explica que **el stagger controla la anchura del degradado**.
6. **Fallos detectados.**
   - Las referencias se acumulan con un `ref` en callback que hace `push` en cada render → el array crece con duplicados y `null` (y se duplica en modo estricto). Mejor recolectar los nodos con un selector acotado o usar SplitText.
   - Cada palabra es un `<p>` y cada letra un `<span>` sin `aria-label` → un lector de pantalla puede leer letra a letra y la semántica de párrafo se pierde. SplitText (≥3.13) resuelve la accesibilidad (TXT-001, A11Y-001).
   - `end` calculado una vez con `window.innerHeight` (no se recalcula en resize salvo usar función + `invalidateOnRefresh`).
   - Sin limpieza del ScrollTrigger; sin reduced motion.
7. **APIs.** Vigentes; la división manual puede sustituirse por SplitText (gratuito).
8. **Huecos visuales.** Ninguno crítico (efecto de opacidad, comprobable por código).
9. **Valor.** A: alto (manifiesto/claim de marca) si es accesible; B: alto.
10. **Evidencia.** Código y artículo leídos. No ejecutado. Vídeo no visto.


**Lote 5:** demo pública del autor inspeccionada en el navegador integrado (`DEMO_INSPECCIONADA`); mediciones y capturas en TXT-002 y evidence/visual/2026-10-26. El vídeo sigue sin verse.
