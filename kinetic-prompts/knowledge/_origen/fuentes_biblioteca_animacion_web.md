# Fuentes iniciales — Biblioteca de animación y desarrollo web

**Proyecto independiente** de `AI_CINEMATIC_VIDEO_ENGINE`. Esta lista procede de la conversación que aportó el usuario el 26 de octubre de 2026. Las especialidades y valoraciones asignadas en esa conversación son **hipótesis de investigación, no conclusiones auditadas**. Cowork debe verificar identidad, URL, accesibilidad, fechas y profundidad del contenido antes de extraer técnicas.

## Canales y creadores para investigar (verificar canales oficiales)

| Nombre | Temas priorizados según la conversación | Nota |
|---|---|---|
| GreenSock (canal oficial) | GSAP, ScrollTrigger, Flip, SplitText, MorphSVG, timelines | Prioridad máxima; contrastar con docs oficiales |
| Creative Coding Club (Carl Schooff) | Fundamentos GSAP, easing, timelines, stagger | Prioridad alta |
| Codegrid | Sitios de estilo agencia, pinning, revelados, menús, transiciones | Prioridad alta |
| Olivier Larose | React / Next.js, GSAP, ScrollTrigger, Lenis, parallax | Prioridad alta |
| Hyperplexed | Hovers, interacciones, efectos UI, texto | Prioridad media |
| DesignCourse (Gary Simon) | UI/UX, landing pages y GSAP | Prioridad media |
| Cassie Evans | SVG, GSAP, técnicas avanzadas | Identificar charlas y material fuente |
| Wael Yasmina | Three.js, GSAP, cámaras y scroll 3D | Prioridad alta para 3D |
| Wawa Sensei | React Three Fiber, interacciones y escenas 3D | Prioridad alta para 3D |
| JavaScript Mastery | Landings completas, Three.js, React, GSAP | Evaluar vigencia del código |
| The Code Creative | GSAP, Flip, ScrollTrigger | Prioridad media |
| Ihatetomatoes (Petr Tichy) | GSAP / ScrollTrigger | Comprobar versiones históricas |
| Rajacharles SRD | Landings, sliders, menús, ScrollTrigger | Prioridad media |
| Motion Tricks | Animaciones web con GSAP | Confirmar identidad/ubicación del material |
| Kevin Powell | CSS, transiciones de vistas, accesibilidad | Prioridad alta para soluciones sin JS |
| Yuri Artiukh (akella) | WebGL, shaders, distorsiones, efectos avanzados | Prioridad alta para WebGL |
| Frontend Horse (Alex Trost) | Entrevistas y técnicas de creative coding | Mayormente fuente secundaria |
| The Coding Train | Creative coding, principios de movimiento | Fundamentos, no necesariamente GSAP |

## Recursos, academias y colecciones (no asumir que son canales de YouTube)

| Nombre | Naturaleza a verificar | Uso |
|---|---|---|
| Codrops | Publicaciones, demos y experimentos | Investigación de efectos y fuentes de código |
| Osmo | Biblioteca/comunidad/cursos de desarrollo creativo | Transiciones y componentes; distinguir contenido público de pago |
| Mastering Web Animation | Curso / formación | Principios de motion design; acceso autorizado únicamente |
| Awwwards | Galería de webs premiadas y ejemplos | Referencias visuales, no prueba de implementación |
| Three.js Journey (Bruno Simon) | Curso de pago | Fundamentos avanzados de Three.js; no eludir acceso |

## Los 15 temas solicitados

1. Animación de entrada (GSAP)
2. Texto por letra/palabra (SplitText, stagger y alternativas)
3. Scroll suave (Lenis)
4. ScrollTrigger básico
5. Pinning (ScrollTrigger)
6. Parallax
7. Scroll horizontal
8. Transformación de elementos (Flip, MorphSVG, CSS transform)
9. Revelados de imágenes (clip-path, máscaras)
10. Hover y microinteracciones
11. Integración 3D + texto (Three.js + GSAP)
12. Productos 3D interactivos (Three.js / R3F)
13. Escenas 3D ligadas al scroll
14. Timelines de GSAP
15. Landing completa combinando técnicas

## Fuentes técnicas oficiales de contraste

- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- GSAP documentación: https://gsap.com/docs/v3/
- Lenis repositorio y guía de integración: https://github.com/darkroomengineering/lenis
- Three.js documentación: https://threejs.org/docs/
- Three.js gestión de recursos GPU: https://threejs.org/manual/pages/how-to-dispose-of-objects.html
- MDN accesibilidad / reduced motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Skills Claude Code: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

## Criterio metodológico

No atribuir procesos concretos sin examinar tutorial, código o material visual. Para cada técnica: fuente + marca temporal o ubicación de código, versión de librería, explicación, implementación verificable, controles de limpieza, responsive/performance/accesibilidad, situación de las licencias y estatus de evidencia. Mantener biblioteca separada de cualquier proyecto existente hasta autorización.

---

## Ampliación — Desarrollo web experto (aportación del usuario, 26 octubre 2026)

**Objetivo ampliado:** no limitar la biblioteca a efectos visuales. Formar una base de conocimiento para construir webs profesionales de extremo a extremo: arquitectura, HTML semántico, CSS, JavaScript, TypeScript, frameworks, accesibilidad, rendimiento, UX, SEO técnico, pruebas, despliegue y mantenimiento; combinar después estas competencias con GSAP/Lenis/Three.js cuando generen valor.

### Nuevos canales y creadores — añadir al inventario

| Fuente | Área inicial para clasificar | Utilidad prevista | Prioridad de investigación |
|---|---|---|---|
| Fireship | Ecosistema web, herramientas, tendencias y resúmenes | Radar de tecnologías, **no** guía definitiva de implementación | Media |
| Web Dev Simplified | JavaScript, DOM, React y fundamentos | Conceptos e implementación desde la base | Alta |
| freeCodeCamp | Formación de programación y proyectos completos | Cursos estructurados y ejemplos integrales | Alta |
| Theo Browne / t3.gg | Arquitectura y ecosistema JavaScript/TypeScript | Decisiones de stack; contrastar opiniones con fuentes primarias | Media |
| The Net Ninja | Series de React, Next.js y tecnologías web | Rutas de aprendizaje y proyectos | Alta |
| Traversy Media | Aplicaciones web y proyectos prácticos | Flujos completos, integración frontend/backend | Alta |
| Jack Herrington | React, Next.js y prácticas de ingeniería frontend | Patrones avanzados y mantenibilidad | Alta |
| ByteGrad | Next.js, TypeScript y proyectos | Flujos profesionales y aplicaciones modernas | Media |
| Matt Pocock | TypeScript y diseño de tipos | Código seguro, APIs y patrones de tipos | Alta |
| Coding in Public | Astro y frontend | Sitios rápidos, arquitectura de contenido | Media |
| ThePrimeagen | Desarrollo y criterios de ingeniería | Debate técnico, rendimiento, herramientas; verificar pertinencia web | Complementaria |
| Flux Academy | Diseño web, Webflow y negocio de servicios | Diseño centrado en clientes y entregables comerciales | Alta |
| midudev | JavaScript, React y desarrollo web en español | Proyectos y contexto del ecosistema | Alta |
| MoureDev | Enseñanza de programación y proyectos | Explicaciones y aprendizaje estructurado | Complementaria |
| Soy Dalto | Fundamentos web y programación en español | Nivel introductorio; contrastar prácticas y actualidad | Complementaria |
| Fazt | Desarrollo web y programación práctica | Proyectos full stack | Media |
| FalconMasters | HTML, CSS, JavaScript y diseño web | Fundamentos y ejemplos; auditar vigencia | Media |
| Carlos Azaustre | JavaScript, Node.js y React | Prácticas del ecosistema JS y frontend | Media |

### Fuentes mencionadas de nuevo (YA estaban incluidas; no duplicar)

- **Kevin Powell:** se amplía su ficha a CSS moderno, diseño responsive, arquitectura CSS y accesibilidad; además de animación CSS/View Transitions.
- **DesignCourse (Gary Simon):** diseño visual, UI/UX, tipografía, jerarquía, componentes y conversión de diseño a código; además de efectos.
- **JavaScript Mastery:** aplicaciones completas, React y experiencias web visualmente elaboradas; auditar versiones y prácticas.

### Capas de conocimiento que deben coexistir

| Capa | Conocimientos y resultados | Fuentes candidatas |
|---|---|---|
| **A. Ingeniería base** | HTML semántico, CSS responsive, JS, TS, React, componentes | Kevin Powell, Web Dev Simplified, Matt Pocock, The Net Ninja, freeCodeCamp |
| **B. Arquitectura profesional** | Next.js/Astro, gestión de estado, datos, seguridad básica, tests, build, despliegue, mantenimiento | Jack Herrington, ByteGrad, Coding in Public, Traversy Media, Theo; documentación oficial |
| **C. Diseño y negocio** | UI/UX, diseño de sistemas, accesibilidad, conversión, brief de clientes | DesignCourse, Flux Academy, Kevin Powell, Codrops (referencias) |
| **D. Movimiento e interacción** | GSAP, ScrollTrigger, Lenis, page transitions, microinteracciones | GreenSock, Creative Coding Club, Codegrid, Olivier Larose, Hyperplexed |
| **E. 3D y experiencias** | Three.js, R3F, WebGL, shaders, performance GPU, escenas por scroll | Wael Yasmina, Wawa Sensei, Yuri Artiukh, JavaScript Mastery, Three.js Journey |
| **F. Verificación** | Lighthouse/Core Web Vitals, pruebas de navegador, accesibilidad, seguridad, SEO técnico | Fuentes primarias y pruebas propias; no sustituir evidencia por la reputación del creador |

### Arquitectura de uso recomendada

- **Perfil web de negocio:** diseño sólido, conversión, accesibilidad, móvil, SEO y tiempos de carga; animación puntual al servicio de objetivos comerciales.
- **Perfil web creativa/premium:** identidad visual fuerte, storytelling, transiciones GSAP/Lenis y 3D con presupuestos explícitos de rendimiento.
- **Perfil experiencia inmersiva para PC:** escenas 3D y cámaras sincronizadas con scroll; no imponer requisitos móviles si el producto es expresamente solo escritorio.

### Reglas de investigación y calidad

1. Registrar **enlaces oficiales confirmados** por Cowork y disponibilidad. No adivinar handles ni aceptar rankings como verificación.
2. La recomendación del usuario y enlaces secundarios (abajo) sirven para descubrir fuentes; **no prueban** por sí solos calidad, actualidad ni adecuación de cada técnica.
3. Priorizar tutoriales actuales y contrastar la **versión exacta** de React/Next.js/Astro/TypeScript/GSAP/Three.js con documentación vigente.
4. Para cada técnica distinguir: *observada en material fuente*, *adaptación propuesta*, *implementada*, *validada en navegador*.
5. Guardar proyectos de ejemplo, tests o referencias a repositorios **sin ejecutar código externo no auditado**.
6. Asegurar que el catálogo y sus Skills sean independientes de la biblioteca de edición audiovisual.
7. Incorporar guías de seguridad web (validación, autenticación, secretos, cabeceras, dependencias), automatización de QA, rendimiento, UX y accesibilidad; no centrarse solo en animación.

### Pistas bibliográficas suministradas por el usuario (pendientes de verificación individual)

- https://learnwithpath.com/blog/best-youtube-channels-for-web-development-2026
- https://www.webreactiva.com/blog/mejores-canales-youtube-programacion
- https://dev.to/sebasttiandaza/12-canales-de-youtube-para-aprender-programacion-3njo
- https://www.genbeta.com/desarrollo/otros-12-canales-mas-de-youtube-de-desarrollo-en-espanol-que-no-te-puedes-perder/amp

**Estado global:** catálogo ampliado a **36 canales/creadores y 5 recursos/academias/colecciones diferenciados**, 41 entradas únicas. El listado NO constituye una auditoría de contenido ni acredita que se haya visto ningún vídeo.
