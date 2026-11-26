---
id: TUT-010
titulo: GTA VI landing (React + GSAP) — revisión completa 10/10 secciones
creador: JavaScript Mastery (Adrian Hajdu)
identidad_verificada: SI (README del repo, lote 1)
repo: https://github.com/adrianhajdin/jsm_gta_vi_landing
commit: 56b6e63 (2025-06-20)
licencia: ninguna declarada → no reproducir código
video_url: no confirmada (enlace del README comentado)
narrado: DESCONOCIDO
transcript_status: NO_SOLICITADA
code_route: B_CODIGO_PUBLICO
evidencia: CODIGO_INSPECCIONADO
ultima_revision: 2026-10-26
---

# TUT-010 · JavaScript Mastery — GTA VI landing (cierre de VR-007)

1. **Identidad.** Verificada en el lote 1 (CASE-001).
2. **Qué construye.** Ver CASE-001. En este lote se leen las 5 secciones pendientes: segundo vídeo fijado que se funde (SecondVideo), sección editorial con columna de imágenes en parallax (Lucia), tarjeta postal con vídeo y efecto hover (PostCard), vídeo final fijado que aparece escalando (Final) y mensaje de cierre con logo y fecha (Outro).
3. **Stack.** React 19.1, gsap ^3.13.0, @gsap/react ^2.1.2, Tailwind 4.1, Vite 6.3.
4. **Archivos leídos (nuevos).** `src/sections/SecondVideo.jsx`, `Lucia.jsx`, `PostCard.jsx`, `Final.jsx`, `Outro.jsx`.
5. **Técnicas confirmadas.** Patrón repetido de VID-001 (vídeo como cámara) en 3 secciones más; patrón de PX-001 en Lucia (idéntico a Jason); solapes con márgenes negativos (−60vh, −80vh, −100vh) para fundidos entre secciones fijadas (CASE-001).
6. **Fallos nuevos detectados.**
   - La **condición de carrera de `onloadedmetadata`** (VID-001) se repite en SecondVideo, PostCard y Final: si el vídeo ya tenía metadatos antes de asignar el manejador (caché), el tween de `currentTime` nunca se añade.
   - PostCard: el vídeo tiene `autoPlay` **y** a la vez se controla `currentTime` con scrub → dos fuentes de verdad en conflicto.
   - Clases Tailwind inválidas: `hover:-[1.02]` (probablemente quería `hover:scale-[1.02]`), `transation` (errata de `transition`), `lg:1/2` (falta `w-`). El hover de la tarjeta no funciona como se pretende (análisis estático).
   - Final: crea una timeline vacía solo para fijar la sección (bastaría `ScrollTrigger.create({ pin })`).
   - Outro anima `.final-content`, que pertenece a otra sección → acoplamiento entre componentes por selector global.
   - Lucia: de nuevo `gsap.to(..., '<')` fuera de una timeline (sin efecto) y varias `<img>` sin `alt`; varios `h1` en la página.
7. **APIs.** Vigentes (GSAP 3.13, useGSAP).
8. **Huecos visuales.** Ritmo de fundidos entre vídeos: demo o capturas.
9. **Valor.** Confirma CASE-001: buena referencia de **narrativa**, no plantilla de calidad.
10. **Evidencia.** Repo leído completo (10/10 secciones). No ejecutado.
