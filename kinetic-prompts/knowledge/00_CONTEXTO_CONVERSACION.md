# 00 · CONTEXTO COMPLETO DE LA CONVERSACIÓN (traspaso a Claude Cowork)

> **Lee este archivo antes que cualquier otro.** Resume toda la conversación mantenida en claude.ai el 26 de octubre de 2026 que dio origen a esta biblioteca: peticiones del usuario, decisiones, hallazgos verificados, reglas acordadas y trabajo pendiente. Es un resumen fiel. **La conversación literal, la captura original y los dos archivos de partida están en [`_origen/`](_origen/README.md).**

---

## 1. Quién es el usuario y qué quiere

- Habla **español** (ubicación aproximada: Madrid). Responder siempre en español.
- Trabaja en **Windows** y usa **Claude Code** para programar. Tiene otro proyecto independiente llamado `AI_CINEMATIC_VIDEO_ENGINE` que **no debe mezclarse** con esta biblioteca.
- **Objetivo final:** poder pedir a Claude Code *"Construye una página web profesional y cinematográfica utilizando las mejores técnicas documentadas de diseño, GSAP, ScrollTrigger, Lenis, Three.js y desarrollo frontend"* y que disponga de conocimiento verificado para seleccionar, implementar, combinar, optimizar y comprobar esas técnicas.
- **Dos perfiles de producción:**
  - **A · Web comercial premium:** barberías, despachos, clínicas, empresas. Prioridad: diseño, UX, responsive, rendimiento, SEO, accesibilidad, conversión, mantenimiento. Animación al servicio del negocio.
  - **B · Web cinematográfica avanzada:** configuradores de coches, productos 3D, landings inmersivas. Prioridad: storytelling con scroll, Three.js/WebGL, materiales, iluminación, transiciones, rendimiento GPU.
  - Regla: **no confundir espectacularidad con calidad profesional.**
- Método de trabajo que pide: por lotes de 5–10 tutoriales, guardando resultados tras cada lote; distinguir estrictamente evidencia real de propuestas; no inventar pasos ni resultados de pruebas.

---

## 2. Cronología de la conversación

### Turno 1 — Canales de YouTube que mejor usan GSAP
Recomendados: GreenSock (oficial), Creative Coding Club (Carl Schooff), Codegrid, Olivier Larose, Codrops, Hyperplexed, DesignCourse (Gary Simon), Cassie Evans. Orden de aprendizaje sugerido: Creative Coding Club → GreenSock → Codegrid/Olivier Larose.

### Turno 2 — Captura con 15 técnicas
El usuario subió una imagen con 15 apartados (ver §5) y pidió canales por técnica. Se asignaron canales a cada una; para 3D se añadieron **Wael Yasmina**, **Wawa Sensei** (React Three Fiber) y **JavaScript Mastery**; se mencionó el curso de pago **Three.js Journey** (Bruno Simon).

### Turno 3 — Búsqueda de más expertos en animaciones y transiciones
Añadidos: The Code Creative, Ihatetomatoes (Petr Tichy), Rajacharles SRD, Motion Tricks (comunidad GSAP), **Osmo** (Dennis Snellenberg y Luka Primorac; recomendado en gsap.com; de pago, fuerte en transiciones de página), Codrops, Mastering Web Animation (curso), Kevin Powell (CSS y View Transitions), Yuri Artiukh/akella (WebGL, shaders), Frontend Horse (Alex Trost), The Coding Train. Inspiración: sección "Elements" de Awwwards.

### Turno 4 — Búsqueda de expertos en creación de páginas web
Inglés: Kevin Powell, Web Dev Simplified, Traversy Media, Fireship, freeCodeCamp, The Net Ninja, Jack Herrington, ByteGrad, Matt Pocock, Theo (t3.gg), Coding in Public, ThePrimeagen, DesignCourse, Flux Academy, JavaScript Mastery. Español: midudev, MoureDev, Soy Dalto, Fazt, FalconMasters, Carlos Azaustre.

### Turno 5 — Misión "WEB ENGINEERING KNOWLEDGE LIBRARY" + 2 adjuntos
El usuario adjuntó `catalogo_fuentes_web_2026.json` y `fuentes_biblioteca_animacion_web.md` (41 fuentes: 36 canales/creadores + 5 recursos; especialidades **no verificadas**) y pidió investigar, crear fichas de 15 campos, una biblioteca Markdown/JSON y una arquitectura de Skills para Claude Code.
**Resultado: lote 0 → biblioteca v0.1** (ver §4).

### Turno 6 — "Master Research Prompt" (versión ampliada de la misión)
Añade `VIDEO_RESEARCH_INDEX.json`, estado `INACCESIBLE`, carpetas `frontend/ architecture/ transitions/ interactions/`, investigación de Skills oficiales de GSAP y trabajo en 7 fases.
**Resultado: lote 1 → biblioteca v0.2.**

### Turno 7 — "Directiva del orquestador": desbloquear YouTube
Auditar entorno, evaluar herramientas (transcripciones, yt-dlp, navegadores, repositorios), prueba controlada sin instalar nada, y diseñar un flujo repetible. **No integrar todavía la biblioteca ni instalar nada.** Resultado: informe (ver §6).

### Turnos 8–9 — Paso a Claude Cowork
El usuario quiere continuar en Cowork **con todo el contexto**: este archivo.

---

## 3. Reglas acordadas (obligatorias)

1. No modificar proyectos ni repositorios del usuario. No crear código de producción durante la investigación.
2. **No instalar herramientas ni dependencias sin autorización explícita.**
3. No ejecutar código externo sin revisarlo; si se ejecuta, solo en carpeta temporal aislada.
4. **No usar cookies de sesión, contraseñas, cuentas ni credenciales.**
5. **No automatizar el acceso a YouTube** (yt-dlp, scrapers, navegador automatizado sobre youtube.com): sus condiciones de uso lo prohíben salvo permiso o excepción legal (ver §6).
6. No copiar íntegramente tutoriales, cursos, transcripciones ni código sin licencia. Solo paráfrasis, marcas de tiempo y fragmentos mínimos.
7. No eludir muros de pago (Codegrid Pro, Creative Coding Club, Osmo, Three.js Journey): solo con suscripción del usuario y respetando licencias.
8. Estados de evidencia honestos: no decir que se ha visto un vídeo si solo se leyeron metadatos; no marcar código como validado sin ejecutarlo y probarlo.
9. Mantener la biblioteca separada de `AI_CINEMATIC_VIDEO_ENGINE`.
10. No meter la biblioteca entera en `CLAUDE.md`: carga bajo demanda mediante Skills.

### Estados
- **Técnicas:** `INVESTIGADO` · `PROPUESTO` · `IMPLEMENTADO` · `VALIDADO` · `NO VERIFICADO` · `INACCESIBLE`.
- **Evidencia:** `SOLO_REFERENCIA` · `METADATOS_VERIFICADOS` · `SOLO_METADATOS` · `DOCUMENTACION_OFICIAL_ANALIZADA` · `TRANSCRIPCION_ANALIZADA` · `VIDEO_INSPECCIONADO` · `CODIGO_INSPECCIONADO`.
- Añadidos en v0.3–0.4: `ARTICULO_AUTOR_ANALIZADO` (artículo en texto del propio creador), `CODIGO_RESUMIDO_POR_LECTOR` (código de CodePen leído a través del lector web, que devuelve un resumen, no el código literal), `INACCESIBLE_POR_COSTE` (tras muro de pago o registro).
- `TRANSCRIPCION_ANALIZADA` ≠ `VIDEO_INSPECCIONADO`. Una técnica solo está **aprendida** cuando llega a `VALIDADO`.

---

## 4. Estado de la biblioteca (v0.2)

- **13 fichas, todas INVESTIGADO.** Ninguna implementada ni validada. **Ningún vídeo visto. Ningún código ejecutado.**
- **Fuentes:** 41 en `SOURCE_CATALOG.json` (8 con identidad verificada; JavaScript Mastery con código inspeccionado) + 10 referencias oficiales.
- **Inventario de tutoriales:** 10 entradas en `VIDEO_RESEARCH_INDEX.json`.
- **Skills propuestas (no probadas):** `web-library-router`, `web-commercial-site`, `web-cinematic-site`, `web-qa-validation`.
- Nombre adoptado: `WEB_ENGINEERING_KNOWLEDGE_LIBRARY` (el JSON de entrada decía `WEB_MOTION_KNOWLEDGE_LIBRARY`).

| ID | Técnica | Base de evidencia |
|---|---|---|
| ST-001 | Fundamentos de ScrollTrigger | Docs oficiales |
| ST-002 | Pinning | Docs oficiales |
| ST-003 | Scroll horizontal (containerAnimation) | Docs oficiales |
| ST-004 | Errores frecuentes de ScrollTrigger | Artículo oficial completo |
| TXT-001 | SplitText | Docs oficiales |
| PX-001 | Parallax | Código JSM + docs |
| VID-001 | Vídeo controlado por scroll | Código JSM |
| MASK-001 | Revelado con máscara de logotipo | Código JSM |
| LN-001 | Lenis + ScrollTrigger | README oficial |
| GS-001 | GSAP en React (useGSAP, limpieza) | README gsap-skills |
| TJ-001 | dispose() y memoria GPU en Three.js | Manual oficial |
| A11Y-001 | Reduced motion | Docs Lenis y GSAP |
| CASE-001 | Estudio de caso: landing GTA VI | Código JSM |

---

## 5. Los 15 temas de la captura del usuario y su cobertura

| # | Tema | Cobertura |
|---|---|---|
| 1 | Animación de entrada (GSAP) | Parcial (ST-001) |
| 2 | Texto por letra/palabra | TXT-001 |
| 3 | Scroll suave (Lenis) | LN-001 |
| 4 | ScrollTrigger básico | ST-001, ST-004 |
| 5 | Pinning | ST-002 |
| 6 | Parallax | PX-001 |
| 7 | Scroll horizontal | ST-003 |
| 8 | Transformaciones (Flip, MorphSVG) | **Pendiente** |
| 9 | Imagen que se revela (máscaras, clip-path) | MASK-001 (falta clip-path) |
| 10 | Efectos hover | **Pendiente** |
| 11 | 3D + texto (Three.js + GSAP) | **Pendiente** |
| 12 | Producto 3D interactivo | **Pendiente** |
| 13 | Escena 3D + scroll | Parcial (VID-001, versión con vídeo) |
| 14 | Timeline de animaciones | Parcial |
| 15 | Landing completa | Parcial (CASE-001) |

---

## 6. Hallazgos verificados clave

### Tecnología (a 2026-10-26)
- **GSAP 3.15** es la versión de la documentación. Tras la adquisición por **Webflow**, GSAP y **todos sus plugins** (SplitText, MorphSVG…) son **gratuitos**, incluido uso comercial, desde el paquete npm público `gsap`.
- `ScrollTrigger.matchMedia()` está **deprecado** → usar `gsap.matchMedia()`.
- **SplitText** se reescribió en 3.13: accesibilidad automática (aria), `autoSplit` + `onSplit()`, máscaras.
- **Lenis 1.3.27** (MIT, darkroomengineering): se apoya en el scroll nativo; respeta reduced motion por defecto; no admite CSS scroll-snap (usar `lenis/snap`); 60 fps máx. en Safari.
- **Existen Skills oficiales de GSAP para Claude Code:** `github.com/greensock/gsap-skills` (MIT; gsap-core, timeline, scrolltrigger, plugins, utils, react, performance, frameworks). La biblioteca debe **complementarlas, no duplicarlas**. Instalarlas requiere autorización.
- Skills en Claude Code: `~/.claude/skills/` (personales) o `.claude/skills/` (proyecto); carga progresiva (metadatos → SKILL.md → recursos). Anthropic recomienda auditar Skills de terceros antes de usarlas.

### Repositorio inspeccionado: JavaScript Mastery · GTA VI
- `github.com/adrianhajdin/jsm_gta_vi_landing`, commit `56b6e63` (2025-06-20). React 19, gsap ^3.13, @gsap/react, Tailwind 4, Vite 6. **Sin licencia** → no reproducir código.
- Leídas 5 de 10 secciones (App, Hero, FirstVideo, Jason, ComingSoon, constants, CSS). Pendientes: SecondVideo, Lucia, PostCard, Final, Outro.
- Patrones útiles: una sección = un módulo de movimiento; secciones fijadas solapadas con márgenes negativos; máscara de logo; vídeo como "cámara".
- **Fallos detectados** (no copiar): selectores sin `scope`, probable condición de carrera en `onloadedmetadata`, sin reduced motion, imágenes sin `alt`, position parameter en un tween suelto.

### Acceso a YouTube (directiva del orquestador)
- En el entorno de claude.ai: YouTube **no resuelve** desde la terminal; la lectura web da **solo metadatos** (canal, fecha, duración, descripción), no transcripción ni imagen; Playwright instalado **sin navegadores**; yt-dlp no instalado. **La prueba de transcripción no se pudo hacer.**
- **Condiciones de uso de YouTube** (versión del 9 de enero de 2026): prohíben el acceso automatizado (robots, scrapers) salvo buscadores según robots.txt, permiso previo por escrito o lo permitido por la ley aplicable; uso personal y no comercial.
- **yt-dlp** (evaluado leyendo su repo oficial, sin instalar): `yt-dlp.exe` para Windows 10+; Unlicense (los ejecutables incluyen código GPLv3+); subtítulos sin vídeo con `--skip-download --write-subs --write-auto-subs --sub-langs --list-subs`; para YouTube completo recomienda `yt-dlp-ejs` + motor JS (Deno); puede requerir "PO Token" también para subtítulos; frágil ante cambios. **Veredicto: no recomendado por defecto** por conflicto con las condiciones de uso. La posible excepción europea de minería de textos y datos es una cuestión legal a consultar.
- **API oficial de YouTube (captions.download):** exige OAuth (credenciales) y, en la práctica, permisos sobre el vídeo → **descartada**.
- **Codegrid:** sus vídeos parecen ser solo con música (la descripción solo cita Epidemic Sound) y su código está en Gumroad de pago → solo estudiable visualmente o con Codegrid Pro.
- **Codrops** bloquea la lectura automatizada → artículos `INACCESIBLE`.

### Métodos aprobados para estudiar tutoriales
| Método | Estado |
|---|---|
| A · Transcripción **copiada manualmente por el usuario** ("Mostrar transcripción") | Recomendado |
| B · **Código publicado por el creador** (GitHub, CodePen, blog de la descripción) | Recomendado y prioritario |
| C · Inspección visual: capturas del usuario o Playwright sobre la **demo publicada** (no YouTube) | Recomendado (Playwright requiere autorización para instalar navegadores) |
| D · yt-dlp | Solo con decisión explícita del usuario tras valorar el riesgo legal |
| E · API de YouTube | Descartado |
| F · Permiso del creador / curso con licencia | Opción de pago |

### Cuentas de GitHub encontradas (nombres coincidentes; vínculo con el canal **pendiente de verificar**, salvo JSM)
| Canal | Cuenta | Repos aprox. |
|---|---|---|
| Wawa Sensei | wass08 (Wassim SAMAD) | 169 |
| Wael Yasmina | WaelYasmina | 48 |
| Yuri Artiukh | akella | 203 |
| Olivier Larose | olivierlarose | 64 |
| Kevin Powell | kevin-powell | 114 |
| JavaScript Mastery | adrianhajdin (verificado vía README) | — |
| Hyperplexed | Hyperplexed | 0 (usa CodePen, por verificar) |
| Codegrid | codegrid | sin repos visibles |
| Creative Coding Club | snorkltv → 404 | — |
| GreenSock | greensock (oficial) | — |

---

## 7. Flujo repetible propuesto para estudiar tutoriales

1. **Inventario:** metadatos y enlaces de la descripción → `VIDEO_RESEARCH_INDEX.json`.
2. **Clasificación:** ¿código público? ¿narrado? ¿de pago? → elegir método A/B/C.
3. **Código:** clonar en carpeta temporal, sin instalar ni ejecutar; anotar licencia, commit, archivos y versiones.
4. **Transcripción** (si está narrado): el usuario la pega; extraer pasos con marcas de tiempo; descartarla después.
5. **Huecos visuales:** listar minutos sin resolver y pedir capturas solo de esos.
6. **Contraste** con documentación oficial vigente; marcar APIs obsoletas.
7. **Fichas:** `tutorials/TUT-xxx` por tutorial + fichas por técnica (15 campos).
8. **Validación posterior:** demo mínima aislada → IMPLEMENTADO → pruebas → VALIDADO.

### Cambios propuestos a la biblioteca (aún no aplicados)
- Carpeta `tutorials/` con fichas `TUT-xxx`.
- Campos nuevos en `VIDEO_RESEARCH_INDEX.json`: `narrated`, `transcript_status`, `transcript_langs`, `code_route`, `visual_gaps`, `evidence`.
- Skill propuesta `web-tutorial-research` que ejecute este flujo.

---

## 8. Trabajo pendiente (en orden)

1. **Prueba manual de transcripción** con un vídeo narrado (Kevin Powell o Wawa Sensei): ¿existe?, ¿manual o automática?, ¿idiomas?, ¿marcas de tiempo?, ¿nombra parámetros concretos? → primera ficha `TUT-001`.
2. **Lote 2:** verificar y analizar repositorios públicos de wass08, WaelYasmina, olivierlarose, akella, kevin-powell; terminar las 5 secciones pendientes del repo GTA VI.
3. Documentación oficial: gsap.com/resources/a11y, /resources/React, Flip (tema 8), ScrollSmoother; MDN `prefers-reduced-motion` y `mask-image`; React Three Fiber (ciclo de vida).
4. Temas sin cubrir: 8, 10, 11, 12 y las capas de ingeniería (HTML/CSS, TypeScript, Next.js, Astro, UI/UX, SEO, seguridad, testing, despliegue).
5. Las 34 fuentes en `SOLO_REFERENCIA` siguen sin verificar.
6. **Plan de validación** (requiere autorización para instalar herramientas): demo mínima por ficha, capturas en 3 anchos, reduced motion, scroll adelante/atrás, resize, FPS/CLS/LCP, Chromium + WebKit. Orden: ST-001 → TXT-001 → ST-002 → PX-001 → LN-001 → VID-001 → MASK-001.

---

## 9. Primer mensaje sugerido para continuar en Cowork

> Lee 00_CONTEXTO_CONVERSACION.md, mira _origen/captura_15_tecnicas.png, lee KNOWLEDGE_INDEX.md, RESEARCH_PROGRESS.md y VIDEO_RESEARCH_INDEX.json. Respeta las reglas de la sección 3. Empieza por el punto 1 o 2 del trabajo pendiente, según te indique, y guarda la biblioteca al terminar cada lote.

---

## 10. Continuación en Claude Cowork (26-10-2026) — lote 2

- El usuario abrió Cowork con el mensaje de arranque del §9 (ver `_origen/CONVERSACION_LITERAL.md`, turno 8) y después aportó la v0.2.2, que añade la carpeta `_origen/` (conversación literal, captura original y sus dos archivos de partida). Pidió **guardar todo ese contexto**: está integrado en la biblioteca v0.3.0 (`_origen/` + este archivo). Esta biblioteca es la memoria persistente del proyecto entre chats.
- **Lote 2 hecho:** identidad verificada de wass08, WaelYasmina, olivierlarose, akella y kevin-powell; 11 repos inspeccionados sin ejecutar; carpeta `tutorials/` con TUT-001…TUT-010; 11 fichas por técnica nuevas (CARD-001, CLIP-001, HOV-001/002/003, R3F-001, CFG-001, TXT3D-001, CAM-001, GL-001, GL-002); repo GTA VI completado 10/10. Detalle en `RESEARCH_PROGRESS.md` (Lote 2).
- Sigue siendo cierto: **0 vídeos vistos, 0 transcripciones, 0 código ejecutado, 0 fichas validadas.**
- Nuevo estado de evidencia: `ARTICULO_AUTOR_ANALIZADO` (artículo en texto del propio creador; no es documentación oficial).
- Primer paso del lote 3: la **prueba de transcripción manual** con TUT-004 (necesita que el usuario pegue la transcripción).

## 11. Validación y lote 3 (26-10-2026) — v0.4.0

- El orquestador pidió una validación de solo lectura de la v0.3.0: resultado en `INFORME_VALIDACION_v0.3.0.md` (entregado aparte). Conclusión: formato compatible con Claude Code, integración bloqueada por rutas (las Skills no saben dónde está la biblioteca; `~` en Windows), 0 fichas validadas, 3 defectos en fragmentos de código. Primera demo propuesta: HOV-001 con 11 pruebas Playwright.
- El usuario fijó la prioridad: **investigar exhaustivamente los canales** (Codegrid, Olivier Larose, GreenSock, Creative Coding Club, Wawa Sensei, Wael Yasmina, Yuri Artiukh primero) y alimentar la biblioteca; la integración e implementación las hará después Claude Code.
- Lote 3 hecho (ver `RESEARCH_PROGRESS.md`): 7 TUT nuevos, 8 fichas nuevas, tema 8 cubierto con docs oficiales, defectos P4–P7 corregidos. Codegrid y Creative Coding Club requieren pago/cuenta → pendiente de decisión del usuario.
- Sigue siendo cierto: 0 vídeos vistos, 0 transcripciones, 0 código ejecutado, 0 fichas validadas.

## 12. Lote 4 (26-10-2026) — v0.5.0

- Decisiones del orquestador: no contratar nada; navegador autorizado para demos públicas sin iniciar sesión ni instalar; no depender de transcripciones manuales masivas; conservar 32 fichas y 17 TUT.
- **RESTRICCIÓN PERMANENTE — PRESUPUESTO 0 €** (usuario): solo recursos gratuitos y legales; fuentes de pago → `INACCESIBLE_POR_COSTE` + alternativa gratuita; no proponer compras como requisito. Sigue vigente la regla de no automatizar YouTube (condiciones de uso), aunque los tutoriales públicos se pueden usar como referencia.
- Inspección visual bloqueada (red de la nube y extensión no conectada); se calcularon estados desde el código.
- 9 fichas nuevas orientadas a webs completas (rendimiento, Next.js, CSS nativo, WCAG, UX, 3D) + receta ARCH-001.
- El lector web alcanzó el límite de gasto de la cuenta: lote interrumpido de forma ordenada.

## 13. Lote 5 (26-10-2026) — v0.6.0

- El **navegador integrado de Cowork** (en el equipo del usuario) sí funciona; se concedió acceso por sitio a blog.olivierlarose.com, codepen.io, cdpn.io, r3f-3d-text-effect.vercel.app y tympanus.net. La extensión Claude in Chrome seguía sin conectar y el Chromium de la nube sigue bloqueado.
- Primera evidencia visual auténtica: 6 técnicas con capturas y mediciones (`evidence/visual/2026-10-26/`), nuevo estado `DEMO_INSPECCIONADA`. Código literal de 2 CodePen de GreenSock.
- Sigue siendo cierto: 0 vídeos de YouTube vistos; 0 fichas validadas en proyecto propio.

## 14. Auditoría externa y lote 6 (26-10-2026) — v0.6.1 y v0.7.0

- Una auditoría independiente (ChatGPT Work) aprobó la v0.6.0 **con reservas**; v0.6.1 corrige la trazabilidad: recuentos, etiquetas [OBS]/[MED]/[CALC]/[EST]/[COD], datos en bruto de cada medición, discrepancia 0,15 s/0,5 s del botón de GreenSock, separación Larose/GSAP, variantes inspeccionadas de TXT-002 y GL-002, estados antiguos y formato de capturas.
- Lote 6 (v0.7.0): 5 demos pendientes (parciales o bloqueadas por panel oculto y Cloudflare), galería bento (FLIP-002), Hyperplexed y Kevin Powell vía CodePen, y 5 fichas de web completa.
- Regla nueva de método: **solo medir animaciones con el panel del navegador visible**; con el panel oculto, usar solo DOM forzado y marcar capturas como ilustrativas.

## 15. Lote 7 (26-10-2026) — v0.8.0
- El usuario pidió comprobar primero que el panel del navegador estuviera visible y medir la tasa de refresco. Resultado: panel oculto en las 4 comprobaciones (≈0,5 rAF/s, sin foco) → ninguna medición temporal; se avisó al usuario.
- Nuevas fichas: FOOT-001, SECT-001, TXT-004, PIX-001 (Olivier Larose), SEC-001, SEC-002, A11Y-003, UX-002, SEO-002. TUT-020. R3F-001 ampliada con el artículo del autor.
- Creado CHANNEL_COVERAGE.md (tutoriales identificados / estudiados / evidencia / técnicas / pendiente, por canal).
- Restricciones vigentes: 0 €, sin automatizar YouTube, sin instalar, sin modificar proyectos, nada marcado VALIDADO.

## 16. Lote 8 (26-10-2026) — v0.9.0
- El orquestador aprobó v0.8.0 "con reservas" y pidió: resolver la inspección visual si el panel está visible; avanzar sistemáticamente por los canales (sin confundir repositorio con vídeo); ampliar conocimiento profesional (TS, React/Next, Astro, UI/UX, testing, despliegue…); conservar todo; no declarar terminada la investigación; el informe final exhaustivo **no** corresponde todavía.
- Panel oculto en las 2 comprobaciones → sin mediciones. Se avisó al usuario al inicio.
- 18 fichas nuevas (HOV-005, HOV-006, MENU-001, OBS-001, GS-002, GS-003, TXT-005, GL-004, CSS-005, CSS-006, CSS-007, UX-003, A11Y-004, TS-001, ASTRO-001, ARCH-002, TEST-001, DEPLOY-001); TUT-021…023; nueva carpeta `testing/`.
- Primeras coberturas: Bruno Simon, Web Dev Simplified, Matt Pocock; Cassie Evans y midudev solo metadatos.

## 17. Lote 9 (26-10-2026) — v0.10.0
- Directiva: priorizar 8 expertos poco estudiados (DesignCourse, Traversy, Net Ninja, Jack Herrington, Coding in Public, Fireship, Frontend Horse, Coding Train); conocimiento de webs comerciales completas; animación/3D original; registrar el bloqueo del navegador una sola vez; registro separado de vídeos estudiados; no preparar aún el informe final.
- Los 8 tienen ahora cobertura (código, artículos o libro gratuitos). Vídeos estudiados: 0 (registro separado en CHANNEL_COVERAGE.md).
- 13 fichas nuevas (MP-001, BTN-001, PHYS-001, INST-001, UI-001, UI-002, UX-004, DS-001, TYPE-002, NEXT-002, NEXT-003, ASTRO-002, SEO-003) y TUT-024…030.

## 18. Lote 10 (26-10-2026) — v0.11.0
- Directiva: ampliar cobertura (freeCodeCamp, ByteGrad, Codrops, Flux, Theo, midudev, MoureDev, Carlos Azaustre, Motion Tricks, The Code Creative); conocimiento de alto nivel; actualizar ARCH-001; trazabilidad de hallazgos de seguridad sin presentarlos como explotados; corregir solo referencias obsoletas relevantes; registrar el bloqueo del navegador una vez; no preparar el informe final.
- 7 de las 10 fuentes con contenido estudiado; ByteGrad y MoureDev revisadas sin valor aprovechable; The Code Creative sin identidad verificable.
- 9 fichas nuevas (CLIENT-001, PT-001, TXT-006, SVG-001, HERO-001, ASTRO-003, CSS-008, T3-001, A11Y-005), TUT-031…037, ARCH-001 reorganizada.

## 19. Lote 11 (27-10-2026) — v0.12.0
- Directiva: ingeniería creativa avanzada (TSL, WebGPU, shaders procedurales, transiciones de escena, instancing, integración WebGL+GSAP, degradación); fuentes pendientes (Osmo, Cassie Evans, Awwwards, Ihatetomatoes, Rajacharles, Mastering Web Animation, ThePrimeagen); webs comerciales (copy, landing, SEO local, cookies/RGPD, analítica, i18n, CI/CD, rendimiento); **obligatorio** preparar el aprovechamiento por Claude Code sin instalar nada; corregir la discrepancia de Olivier Larose; verificar CSS-008; no repetir pruebas del navegador; no preparar el informe final.
- Hecho: 14 fichas nuevas, 3 TUT, carpeta `integration/` con guía, procedimiento, pruebas, plantilla de evidencias, manifiesto y validador; 4 Skills revisadas (siguen PROPUESTAS); correcciones de P5.

## 20. Lote 12 (27-10-2026) — v0.13.0
- Directiva: corregir integración (riesgo de `robocopy /MIR`, simulación segura, no sobrescribir Skills personales, ruta real de la biblioteca, convenciones vigentes de Skills), diseñar una prueba mínima de solo lectura **sin ejecutarla**, y seguir investigando (Three.js/TSL/WebGPU, glTF, shaders, GSAP, UI/UX, rendimiento, accesibilidad, seguridad). No ejecutar scripts de sincronización; no declarar validada la integración; no preparar el informe final.
- Hecho: Skills con `${CLAUDE_SKILL_DIR}`, espejo `.claude/skills/`, script seguro, guía reescrita, prueba mínima + verificador; 5 fichas nuevas y 2 ampliadas.


## 21. Lote 13 (27-10-2026) — v0.14.0
- Directiva "fase de validación e investigación continua": autorizada **una única** prueba mínima de lectura con v0.13.0 (sin instalar, sin `sync_skills.ps1`, sin escritura, sin superar límites del plan); después, seguir investigando (animación/3D, ingeniería, UI/UX), documentar con 10 puntos, no duplicar, mantener índices y Skills, vídeos pendientes, entregar versión y auditoría. El usuario decide cuándo parar; no preparar el informe final.
- Resultado de la prueba: lectura de la biblioteca CONFIRMADA; Skill NO descubierta con `--restricted` (causa documentada, no verificada); verificador y manifiesto corregidos. Integración NO VALIDADA.
- Investigación: 6 fichas nuevas (ST-006, LIGHT-001, ASTRO-004, TEST-002, CI-002, A11Y-007), 5 ampliadas, TUT-042; un duplicado propio detectado y retirado.

## 22. Lote 14 (27-10-2026) — v0.14.1
- Directiva: repetir UNA vez la prueba mínima con v0.14.0 (sin `--bare`/`--restricted`; Read, Grep, Glob, Skill; modo plan; solo suscripción), verificador antes de borrar la carpeta temporal, revisión humana e integridad; marcar PROBADA EN ENTORNO AISLADO solo si pasa todo; no declarar activación automática, Windows, calidad ni mejora; no ejecutar las 3 pruebas de construcción; no preparar el informe final.
- Resultado: superada. Lectura e invocación manual PROBADAS EN ENTORNO AISLADO; integración NO VALIDADA. Registro en `evidence/integration/2026-10-27/prueba_minima_2/`.

## 23. Lote 15 (27-10-2026) — v0.15.0
- Directiva: auditoría de v0.14.1 "aprobada con reservas"; una única prueba de **activación automática** con encargo natural; adaptar el verificador (manual vs automática, contención de rutas); investigar gsap-skills, iluminación (baking, lightmaps, AO, HDR, glTF), WebGPU/TSL/posprocesado y web profesional; corregir el inventario (149 registros); no ejecutar las 3 pruebas de construcción; no preparar el informe final.
- Resultado: activación automática confirmada, uso parcial (prueba NO SUPERADA en conjunto); 3 fichas nuevas y 7 ampliadas; incidente con un script antiguo corregido.

## 24. Lote 16 (27-10-2026) — v0.16.0
- Directiva: endurecer el verificador (atribuciones a fichas no leídas, lecturas completas, áreas, manifiesto, registro y rutas absolutas, sin relajar criterios); una única repetición de la prueba automática con la Skill de v0.15.0 y el mismo encargo; investigar GSAP profesional, Three.js cinematográfico (verificar lo marcado de memoria) y web profesional; proteger la biblioteca frente a sobrescrituras; no ejecutar pruebas de construcción ni preparar el informe final.
- Resultado: activación automática confirmada otra vez; recuperación parcial (n.º 4 NO SUPERADA); verificador con autoprueba; Blender verificado por código fuente; PBR-001; protocolo de mantenimiento y comprobación de baseline.

## 25. Lote 17 (27-10-2026) — v0.17.0
- Directiva: última repetición controlada de la prueba de recuperación (v0.16.0, mismo encargo, "sin leer" aceptado); si supera, considerar demostrada la recuperación automática en Linux aislado; si falla, corregir solo documentalmente; trazabilidad sin carpeta temporal; seguir investigando (GSAP, Three.js, web profesional); no informe final.
- Resultado: prueba n.º 5 SUPERADA (verificador 24/24; revisión humana conforme con una reserva) → recuperación automática demostrada en Linux aislado. Trazas y `--remap` implementados y probados. NEXT-004 y REACT-001; notas de Timer y MotionPathHelper.

## 26. Lote 18 (27-10-2026) — v0.18.0
- Directiva: primer prototipo real (landing de barbería, Astro + GSAP si están disponibles, sin instalar nada), construido por Claude Code con un encargo natural; verificar uso de la biblioteca; ejecutar pruebas con las herramientas disponibles; evaluación visual; diseñar (no ejecutar) la comparación con/sin biblioteca; seguir investigando a partir de los fallos.
- Resultado: prototipo HTML/CSS/JS funcional (Astro/GSAP/Lighthouse bloqueados); activación automática y lectura previa de 11 fichas; registro no guardado como archivo (verificador 13/16); pruebas Playwright ejecutadas; fallo de cabecera móvil; comparación diseñada; versiones vigentes y licencia de GSAP documentadas.


## 27. Lote 19 (27-10-2026) — v0.19.0
- Directiva (aprobada con reservas): una ejecución de control B1 sin biblioteca con el mismo encargo que A1; misma batería de pruebas; comparación anónima y exploratoria; no modificar A1; plan Astro + GSAP sin instalar; seguir ampliando la biblioteca.
- Resultado: B1 ejecutado una vez con condiciones registradas antes; A1 intacto; batería genérica (TEST-004) y medición de contraste compuesto (TEST-003) sobre ambos; en esta única pareja no hay mejora atribuible a la biblioteca (A1 mejor en utilidad comercial; B1 mejor en cabecera móvil y peso); evaluación del orquestador no ciega; plan Astro + GSAP con TypeScript 6 por incompatibilidad de `@astrojs/check` con TS 7.

## 28. Lote 20 (27-10-2026) — v0.20.0
- Directiva: incorporar la referencia visual Enky (vídeo aportado por el usuario); auditoría con *timestamps*, separando montaje y movimiento de la página; extraer técnicas y fichas; tres criterios obligatorios (fidelidad visual, fidelidad de movimiento, calidad creativa) en la evaluación y las Skills; briefing y storyboard del prototipo n.º 2 sin implementarlo.
- Resultado: vídeo inspeccionado (6 reels etiquetados como "Contenido generado con IA"; web real no confirmada); 11 patrones; CASE-003, SEQ-001, DEPTH-001, ART-001 y EVAL-001; herramienta de composición; Skills actualizadas; storyboard "El ritual" con criterios de aceptación; bloqueo principal: el origen de los recursos fotorrealistas.

## 29. Lote 21 (27-10-2026) — v0.21.0
- Directiva (aprobada con reservas): consolidar C1–C3 (C2 también en héroes premium animados); comparar 3 estrategias gratuitas de recursos visuales; planificar la prueba de transición Actos I → II sin implementarla; preparar Astro + GSAP sin instalar; seguir investigando secuencias, producto fotorrealista, objetos continuos, capas y casos verificables.
- Resultado: estrategia comparada (recomendación: Blender + fotografía propia o libre); licencias verificadas; plan de la prueba con criterios de aceptación; lockfile resuelto sin instalar; SEQ-002, ASSET-001, CASE-004 y la herramienta `curvas_scroll.mjs`; OPTIKKA y Apple inspeccionadas en el DOM y la red.

## 30. Lote 22 (27-10-2026) — v0.22.0
- Directiva (aprobada con reservas): replantear la prueba en hitos A (fotograma), B (movimiento corto) y C (scroll); mantener C1–C3 en todas las Skills (C3 lo decide una persona); investigar recursos reales en tres vías; preparar Blender y Astro + GSAP sin instalar; que el conocimiento se traduzca en decisiones creativas.
- Resultado: plan con los 10 entregables; BLEND-001 y PROD-001; mapa de lectura por elemento en el router; lista contra lo genérico; K7–K9 y limpieza; siguiente acción: el fotograma del Hito A con Blender (pendiente de autorización y de saber qué GPU hay).

## 31. Lote 23 (27-10-2026) — v0.23.0
- Directiva: dejar preparado el Hito A (GPU real, 5.2.3 frente a 5.4, escena, límites, composición estática), evitar la complejidad innecesaria (modelo existente frente a propio, corrección de B0) y no ejecutar nada sin R1/R1b.
- Resultado: sin autorización → no hay render. Contenedor por debajo de los mínimos de Blender; ordenador del usuario Windows con GPU desconocida; API de 5.2.3 compatible; script de escena, detección de dispositivos y composición preparados; BLEND-002.

## 32. Lote 24 (01-11-2026) — v0.24.0 ("LOTE 23 — Especialización en movimiento web cinematográfico", según la directiva)
- Directiva: gramática del movimiento cinematográfico (continuidad, storytelling por scroll, profundidad y oclusión, transformaciones, cámara, movimiento secundario, tipografía, dirección de arte), referencias verificables, conocimiento ejecutable, tres recetas, Skills que decidan por el resultado buscado, C1–C3 y catálogo de fallos.
- Resultado: 7 fichas nuevas y 4 ampliadas; 3 microdemos medidas (mecánica probada, sin validación visual); herramienta de medición de escenas; Skills con tabla de decisión y regla de especificación obligatoria.

## 33. Lote 25 (01-11-2026) — v0.25.0 ("DE MECÁNICAS A RESULTADOS CINEMATOGRÁFICOS")
- Directiva: auditar las microdemos A/B/C (reversible, continua, ritmo, composición), portar a GSAP real (pedir autorización si hay que instalar; no afirmar pruebas no hechas), investigar calidad visual de producto, 3 casos de experto, apartado de dirección artística en las recetas, flujo de 10 pasos en las Skills, revisar el manifiesto de 35 KB.
- Resultado: 6 fichas nuevas (AUD-001, SEQ-003, MASK-002 implementadas con pruebas propias; GS-005 propuesta; MOT-002 y COMP-001 investigadas); recetas con §7b; EVAL-001 con tabla "funciona pero mediocre"; 3 herramientas nuevas; Skills con el flujo de 10 pasos.
- GSAP: **no instalado ni probado**; puerto y comparador preparados, a la espera de autorización (D2).
- Restricciones vigentes: 0 €, sin instalaciones ni descargas pesadas sin permiso, sin modificar proyectos, sin web completa, sin inventar la tecnología de Enky, sin informe final, investigación abierta.

## 34. Lote 26 (02-11-2026) — v0.26.0 ("VALIDACIÓN REAL CON GSAP", aprobada con reservas)
- Autorización: instalar **solo** GSAP 3.15.0 en una carpeta temporal aislada con npm; no Blender, Astro, otros programas ni servicios de pago.
- Resultado:
  - las 3 recetas funcionan con GSAP real (equivalencia visual 0 % con el motor nativo en layouts de px enteros);
  - pin, scrub, reversibilidad, resize, reduced motion y desmontaje probados;
  - 8 defectos reales corregidos (GS-005 §3); correcciones visuales de AUD-001 medidas;
  - plantilla verificada para Claude Code.
- No demostrado: calidad fotográfica (C1/C3), otros navegadores, dispositivos reales.
- Siguiente prioridad indicada por el usuario: elevar la calidad audiovisual de los protagonistas y las transiciones.

## 35. Lote 27 (02-11-2026) — v0.27.0 ("RECONSTRUCCIÓN CINEMATOGRÁFICA CON RECURSOS GENERADOS POR IA", aprobada con reservas)
- Cambio estratégico: el usuario generará las imágenes con IA; no más demos vectoriales.
- Entregado:
  - **A. Contrato de recursos REC-003** (`integration/contratos/`).
  - **B. Integración preparada** (`integration/plantillas/rec003_recursos/` + `preparar_recursos.py`), validada con fixtures rotulados.
  - Correcciones técnicas medidas: rendimiento, validador, oclusión y contraste.
- Sin imágenes reales todavía: C1 y C3 no evaluables. No se ha instalado nada; 0 €.

## 36. Lote 28 (03-11-2026) — v0.28.0 ("INVESTIGACIÓN DE YOUTUBE PENDIENTE")
- Directiva: estudiar de verdad los vídeos de Artiukh, Larose, Codegrid, Hyperplexed y GreenSock; distinguir los estados de la evidencia; aplicar al estándar Enky (A–G); probar la técnica más útil; actualizar fichas y las 4 Skills.
- Resultado:
  - 8 vídeos estudiados a través del navegador del usuario (transcripciones de YouTube y fotogramas) e informe por creador;
  - fase 4 con Flip.fit + expoScale en REC-003 y el filtro de turbulencia medido.
- Sin instalaciones; 0 €. Investigación abierta.

## 37. Lote 29 (04-11-2026) — v0.29.0 ("ENKY MOTION EDITING MASTERCLASS", recibida truncada tras la fase 1)
- Directiva: estudiar cómo se editan las transiciones audiovisuales antes de llevarlas a la web. Fuentes por prioridad:
  - Ben Marriott (receta "conectar dos escenas sin fundido");
  - Sonduckfilm (morphing líquido; vectorial frente a fotorrealista);
  - Curious Refuge y Runway (image-to-video, start/end frames, consistencia);
  - Artiukh en Codrops; Codegrid; Larose.
  - Regla de evidencia por fuente.
- Resultado: el ordenador del usuario estuvo desconectado → los vídeos quedan pendientes. Se leyeron Runway (guía oficial) y Curious Refuge → AIVID-001. Receta provisional sin atribuir. 0 €; sin instalaciones.

## 38. Lote 30 (04-11-2026) — v0.30.0 ("ANÁLISIS REAL DE VÍDEOS Y TRANSICIONES ENKY")
- **Directiva:** retomar con acceso al navegador:
  - Marriott, SonduckFilm y Artiukh, con 12 puntos por tutorial;
  - aplicar a una transición de CASE-003 con una receta de producción ejecutable y una prueba visual si es posible;
  - actualizar fichas y Skills.
- **Resultado:**
  - 9 vídeos estudiados (registro con sha256 y fotogramas);
  - EDIT-001;
  - receta ROSSO + animática medida y en vídeo (fixtures, solo C2).
  - 0 €; sin instalaciones; investigación abierta.

## 39. Lote 31 (04-11-2026) — v0.31.0 ("CINEMATIC MOTION ENGINEERING — OBJETIVO ENKY")
- **Directiva:**
  - auditar la ROSSO del lote 30 fotograma a fotograma;
  - corregir anticipación, trayectoria, velocidad, relevo, motion blur y secundarios;
  - comparar 3 estrategias de scroll;
  - A/B con los mismos recursos;
  - prueba web con GSAP;
  - C1–C3, contrato de recursos y actualización.
- **Resultado:** ver `evidence/demos/2026-11-04-lote31/INFORME_LOTE31.md`. Mejora demostrada en C2 mecánico; C1 y C3 sin evaluar (fixtures). 0 €; sin instalaciones; investigación abierta.

## 40. Lote 32 (04-11-2026) — v0.32.0 ("ESTUDIO DE 10 TUTORIALES PARA ALCANZAR EL NIVEL ENKY")
- **Directiva:**
  - 10 vídeos (SonduckFilm ×2, Marriott ×4, Artiukh ×4) sin duplicados;
  - recetas para Claude Code;
  - microprueba tras 3 vídeos útiles (producto + luz + profundidad + partículas);
  - comparación con CREMA/ROSSO.
- **Resultado:** `evidence/demos/2026-11-04-lote32/INFORME_LOTE32.md`. 0 €; sin instalaciones; investigación abierta.
