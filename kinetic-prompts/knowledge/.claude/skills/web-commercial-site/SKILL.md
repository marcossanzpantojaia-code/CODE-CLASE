---
name: web-commercial-site
description: Guides building professional business websites (barbershops, clinics, law firms, local businesses) prioritising usability, conversion, accessibility, SEO, security and load speed, with animation only where it serves a business goal. Use when the site is for a company or client, a local business, a services page or a lead-generation landing.
---

# Web comercial profesional

Estado: PROPUESTO (no probado: registrada en la sesión de la prueba n.º 2 del 2026-10-27, pero no invocada). Revisada en el lote 14 (v0.14.1): rutas resueltas con `${CLAUDE_SKILL_DIR}` y comprobadas con `integration/tools/library_check.py`.

## Raíz de la biblioteca (LIB) — resolver antes de nada
- **LIB = `${CLAUDE_SKILL_DIR}/../../..`** cuando esta Skill se carga desde `<biblioteca>/.claude/skills/<skill>/` (modo recomendado: `claude --add-dir <ruta de la biblioteca>`; Claude Code sustituye `${CLAUDE_SKILL_DIR}` por la carpeta real de esta Skill).
- Si la Skill se instaló copiándola fuera de la biblioteca, LIB es la ruta absoluta literal que figure en la línea `WEB_LIBRARY_ROOT=` del `CLAUDE.md` del proyecto (con barras `/`, sin `~`).
- **Comprobación obligatoria:** lee `LIB/KNOWLEDGE_INDEX.md` y anota su línea "Versión …". Si no existe, **detente** e informa de la ruta probada; no improvises con conocimiento propio.
- Todas las rutas de esta Skill son relativas a LIB.

## Prioridades (en orden) y fichas

1. Encargo, propósito y métricas (CLIENT-001); contenido y CTA claros: qué ofrece, dónde, cómo reservar (UX-002, COPY-001, UI-002, HERO-001).
2. Sistema de diseño, HTML semántico, responsive móvil primero (DS-001, TYPE-001/002, UI-002, CSS-004, IMG-001; en Astro, ASTRO-004) y accesibilidad (A11Y-001…007, UX-004; carruseles: A11Y-007).
3. Stack: Astro para webs de contenido (ASTRO-001/002/003/004), Next.js si hay área privada o datos (NEXT-001/002/003/004, REACT-001, T3-001, TS-001).
4. Formularios y seguridad: validación en servidor, autorización en cada acción, cabeceras/CSP (FORM-001, SEC-001, SEC-002, NEXT-002).
5. SEO técnico y local, idiomas (SEO-001/002/003, I18N-001).
6. Cookies y analítica en España/UE: LEGAL-001 y ANALYTICS-001 (orientación técnica, **no** asesoramiento legal: indícalo al usuario).
7. Rendimiento (PERF-001, PERF-002) y despliegue (DEPLOY-001, CI-001; Lighthouse CI: CI-002).
8. Animación sobria: revelados cortos (ST-001, CSS-001), sin pins largos ni scroll suave salvo justificación.

## Fallos medidos en prototipos (lote 19) — comprobar siempre
- **Cabecera móvil:** en ≤ 375 px, cabecera = marca + botón de menú; el CTA va dentro del menú y/o en el héroe (A1 la partió en dos filas; B1 no) (UX-004).
- **Texto sobre arte en móvil:** cuando el arte del héroe queda detrás del texto, los textos pequeños bajan de 4,5:1 (A1 y B1); aparta el arte, pon un velo o sube el color, y mide con TEST-003 (A11Y-003).
- **Utilidad comercial en el héroe:** horario, zona y "desde X €" junto al CTA (lo que mejor puntuó en A1; COPY-001/UX-002).
- `input type=date`: comprueba el foco visible del selector (ambos prototipos fallan en Chromium) (FORM-001).

- **Héroe premium (lote 20, corregido en el lote 21):** si el cliente quiere un héroe de nivel "anuncio", aplica ART-001 (un objeto protagonista con fotografía real o render, tipografía en capas). Ese héroe se evalúa con **C1 y C3** de EVAL-001 y, **si está animado** (revelados de entrada, scroll, transformaciones), también con **C2** (curvas con `integration/tools/curvas_scroll.mjs`, continuidad y vídeo revisado por una persona). La información comercial (precios, horario, reserva) sigue a ≤ 1 pantalla. Superar solo las pruebas técnicas no lo convierte en profesional ni en premium.

## Transiciones sobrias para negocio (lote 30)
De EDIT-001, en sitios comerciales solo:
- **match cut sutil** (≤ 3 % de escala) entre secciones;
- **anticipación mínima** en microinteracciones;
- **nunca** un fundido entre dos fotos de producto que se solapan **desalineadas** (doble imagen). Si hay que cambiar una imagen por otra, que ocupen el mismo sitio (EDIT-001, lote 31).
- Sin motion blur en sitios comerciales salvo que el producto se mueva rápido (MBLUR-001).
- De INTEG-001, para negocio:
  - grado común horneado y sombra de contacto: coste nulo y gran mejora de la integración;
  - sin partículas, grano ni respiro de foco salvo una razón de marca.

Sin relevos de objeto ni efectos de postprocesado si no hay una razón de negocio.

## Técnicas base confirmadas por expertos (lote 28)
O. Larose, *My Top 5 Techniques for Web Animation* (transcripción analizada; `integration/YOUTUBE_ESTUDIOS.md`):
- detección de viewport (IntersectionObserver o ScrollTrigger) para las entradas;
- `position: sticky` antes que pins con JS;
- easing coherente con la marca;
- SplitText **solo** con accesibilidad (A11Y-001) y gestión del resize.

En una web comercial bastan estas cuatro. Shaders y partículas no aportan conversión.

## Presupuesto de movimiento

- Animaciones de entrada ≤ 0,6 s; nada que bloquee leer o pulsar el CTA.
- Lenis y Three.js: solo con justificación de negocio documentada.
- Reduced motion obligatorio (A11Y-001).

## Salida

Antes de terminar, invoca `web-qa-validation`.
