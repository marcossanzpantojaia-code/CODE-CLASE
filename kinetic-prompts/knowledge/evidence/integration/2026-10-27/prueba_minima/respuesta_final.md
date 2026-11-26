**Aviso previo: el paso 1 no se pudo completar.** Ninguna Skill de creación de webs está registrada en esta sesión. La lista del sistema trae `dataviz`, `artifact-design` y otras genéricas, pero ninguna sobre webs. Al llamar a `Skill` con `web-library-router` (existe en disco) devolvió `Unknown skill`. Por eso no tengo un valor resuelto de `CLAUDE_SKILL_DIR` y no voy a inventarlo.

Como alternativa, leí `.claude/skills/web-library-router/SKILL.md` con Read y seguí su procedimiento a mano. Esa SKILL.md define la raíz como `${CLAUDE_SKILL_DIR}/../../..`. Si se hubiera cargado desde `.claude/skills/web-library-router/`, la raíz sería la carpeta de la biblioteca. Esa es la ruta que usé:

`/tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY` (LIB)

Es la ruta del directorio de trabajo adicional. No viene de la sustitución de la Skill, así que la raíz queda sin confirmar por ese camino.

## 2. Versión (copiada literalmente de `KNOWLEDGE_INDEX.md`, línea 3)

> Versión 0.13.0 · Lotes 0–12 · 2026-10-27 · **Presupuesto 0 €**: solo recursos gratuitos

## 3–4. Las 5 fichas elegidas

El manifiesto se truncó a las 930 de 1240 líneas, y las 5 fichas están en la parte leída. Todas llevan estado INVESTIGADO. Ninguna está IMPLEMENTADA ni VALIDADA.

| ID | Parte | Ruta absoluta | Estado | ultima_revision |
|---|---|---|---|---|
| LEGAL-001 | Comercial | `LIB/security/LEGAL-001-cookies-consentimiento-espana-ue.md` | INVESTIGADO | `ultima_revision: 2026-10-27` |
| SEO-003 | Comercial | `LIB/seo/SEO-003-seo-local-perfil-de-empresa.md` | INVESTIGADO | `ultima_revision: 2026-10-26` |
| GL-006 | Cinematográfica | `LIB/threejs/GL-006-webgl-gsap-scroll-una-sola-timeline.md` | INVESTIGADO | `ultima_revision: 2026-10-27` |
| ST-001 | Cinematográfica | `LIB/scrolltrigger/ST-001-fundamentos-scrolltrigger.md` | INVESTIGADO | `ultima_revision: 2026-10-26` |
| A11Y-001 | Transversal | `LIB/accessibility/A11Y-001-reduced-motion.md` | INVESTIGADO | `ultima_revision: 2026-10-26` |

Aquí `LIB` es la ruta completa indicada arriba. Cada ruta absoluta es `LIB/` seguido de la ruta relativa del manifiesto.

## 5. Decisiones técnicas por ficha

**LEGAL-001** (cookies AEPD)
- **Banner con Aceptar, Rechazar y Configurar al mismo nivel y tamaño.** Sale de los campos 5 y 6 (primera capa, rechazo en la misma capa). Nada premarcado y sin CTA dominante, según 12.2.
- **Bloqueo previo de terceros, elección guardada 24 meses y enlace permanente en el pie.** Salen de los campos 8, 9 y 12.1/12.3/12.4. El mapa sería una imagen con enlace "Cómo llegar" (12.5).
- **Documentado:** los requisitos de la guía AEPD (campos 3–11). La ficha avisa de que no es asesoramiento jurídico, de que el texto de la guía se cortó al final del apdo. 4.2 y de que la nota de prensa no se pudo leer.
- **No probado:** toda la implementación técnica (campo 12, "traducción propia, no probada") y la prueba con Playwright (12.6). Campo 15: "implementación no probada".

**SEO-003** (SEO local)
- **NAP idéntico en texto y en el JSON-LD `LocalBusiness`, igual que en el Perfil de Empresa.** Sale de la tabla del campo 5 (relevancia), con SEO-002 para el JSON-LD. Añadiría una página propia por servicio, por ejemplo "Corte y barba", con `h1` y `title` de servicio y ciudad.
- **Botón de reserva y enlace `tel:` visibles en móvil, con horarios especiales sincronizados con el perfil.** Salen del campo 7 (paso 5) y de la tabla del campo 5.
- **Documentado:** los factores de relevancia, distancia y prominencia, y las acciones recomendadas (campos 3 y 4, doc. oficial de Google). La ficha indica que no se puede pagar posición local.
- **No probado:** los campos 5–7 son "criterio propio no validado con datos de posicionamiento" (campo 15). La prueba de resultados enriquecidos aún no se ha hecho.

**GL-006** (WebGL + GSAP + scroll)
- **Una timeline maestra, con ScrollTrigger `scrub` solo sobre ella, y un bucle único.** Sale del campo 3 ("cabezal único"). El render iría en el `ticker` de GSAP o en `setAnimationLoop`, nunca con dos rAF. El suavizado estaría en un solo sitio.
- **Uniforms animables con GSAP, sin lógica de animación en el shader salvo `time`, y degradación a estado final con reduced motion.** Salen del campo 3 (uniforms), del campo 5 (degradación) y del campo 6.3. Si Theatre.js entrara en el proyecto, el campo 4 pide no publicar `@theatre/studio` (AGPL-3.0-only) y valorar el riesgo de mantenimiento.
- **Documentado:** las licencias y el estado del repo de Theatre.js (campo 4, inspección de código).
- **No probado:** el patrón es una síntesis (campo 3, "[síntesis]"). Campo 15: "nada implementado". El 60 fps en el móvil objetivo y el determinismo en scroll rápido están sin medir (campo 14).

**ST-001** (fundamentos de ScrollTrigger)
- **Una timeline por bloque con un único ScrollTrigger.** Usaría `clamp(top 80%)`, `scrub` numérico y solo `transform` y `autoAlpha`. Sale de los campos 7, 8 y 11, y el ejemplo del campo 9 es la base.
- **Registrar el plugin una vez y llamar a `ScrollTrigger.refresh()` tras cargar imágenes y fuentes.** Salen del campo 5 y del campo 7 (pasos 1 y 5). Los `markers` se quitan en producción.
- **Documentado:** la doc oficial de GSAP 3.15 (campos 5, 8 y 10).
- **No probado:** el código del campo 9 es "adaptación propuesta, no ejecutada" (campo 15). Safari iOS con `normalizeScroll()` está pendiente de ficha (campo 12). La URL de errores frecuentes aparece como "pendiente de análisis" en el campo 2.

**A11Y-001** (reduced motion)
- **`gsap.matchMedia()` con dos ramas, `no-preference` y `reduce`.** En la rama `reduce` iría el estado final o un fundido, y para la escena Three.js no habría rotación automática ni cámara guiada por scroll. Sale del campo 7, del código del campo 9 y de la actualización del lote 3.
- **Contenido visible sin JS y un interruptor de animaciones en la propia página.** El primero sale del campo 10 (no ocultar con `opacity: 0` en CSS). El segundo sale de la actualización del lote 3.
- **Documentado:** el patrón `matchMedia` y los criterios de qué reducir (guía oficial de gsap.com, lote 3).
- **No probado:** el campo 11 dice "criterio WCAG exacto pendiente de contrastar" y MDN está pendiente. Código no ejecutado (campo 15). El interruptor se apoya en una demo no inspeccionada.

## 6. Registro (formato de `CONSULTA_BIBLIOTECA_TEMPLATE.md`, secciones 1–4)

### 1. Encargo
- **Descripción breve:** web profesional para una barbería de Madrid, con reservas, SEO local, cookies conformes en España y animaciones cinematográficas (GSAP, ScrollTrigger y escena Three.js en el héroe). Fase actual: solo preparar conocimiento, sin construir.
- **Perfil (A/B) y motivo:** híbrido, A como base y B acotado al héroe. Conversión, SEO y cumplimiento mandan, y lo cinematográfico queda limitado al héroe y a unos pocos revelados.
- **Versión de la biblioteca:** Versión 0.13.0 · Lotes 0–12 · 2026-10-27 · **Presupuesto 0 €**: solo recursos gratuitos
- **Stack y versiones instaladas:** no hay proyecto. Las fichas citan GSAP 3.15 y three.js r186 (GL-006), pero no hay versiones instaladas con las que contrastarlas.

### 2. Necesidades → fichas
| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Banner de cookies legal en España | LEGAL-001 | `security/LEGAL-001-cookies-consentimiento-espana-ue.md` | INVESTIGADO | Normativa AEPD mayo 2024 / sin proyecto |
| Aparecer en Google Maps y paquete local | SEO-003 | `seo/SEO-003-seo-local-perfil-de-empresa.md` | INVESTIGADO | — / sin proyecto |
| Héroe 3D guiado por scroll con GSAP | GL-006 | `threejs/GL-006-webgl-gsap-scroll-una-sola-timeline.md` | INVESTIGADO | GSAP 3.15, three.js r186 / sin proyecto |
| Animar al hacer scroll | ST-001 | `scrolltrigger/ST-001-fundamentos-scrolltrigger.md` | INVESTIGADO | GSAP 3.15 / sin proyecto |
| Accesibilidad del movimiento (obligatoria) | A11Y-001 | `accessibility/A11Y-001-reduced-motion.md` | INVESTIGADO | lenis 1.3.27, GSAP 3.15 / sin proyecto |

### 3. Aplicación
Todavía no se ha escrito código, así que quedan como decisiones previstas.

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| LEGAL-001 | Aceptar, Rechazar y Configurar al mismo nivel; bloqueo previo; 24 meses | pendiente (sin proyecto) | No | Sí |
| SEO-003 | NAP idéntico en texto y JSON-LD; página por servicio; reserva y `tel:` en móvil | pendiente (sin proyecto) | No | Sí |
| GL-006 | Timeline maestra con ScrollTrigger `scrub`; bucle único; uniforms animables | pendiente (sin proyecto) | No (si se usa Theatre.js, `@theatre/studio` AGPL-3.0 solo en desarrollo) | Sí |
| ST-001 | Un ScrollTrigger por timeline; `clamp()`; `refresh()` tras cargar | pendiente (sin proyecto) | No | Sí |
| A11Y-001 | `gsap.matchMedia()` con ramas `no-preference` y `reduce`; contenido visible sin JS | pendiente (sin proyecto) | No | Sí |

### 4. Fichas consultadas y descartadas
| Ficha | Motivo |
|---|---|
| ARCH-001 | Aparece en el manifiesto y está recomendada como punto de partida, pero no la leí. No la elegí porque el límite era exactamente 5 fichas. |
| SEO-002 | Cubre `LocalBusiness`, pero SEO-003 ya remite a ella. La dejé para la fase de construcción. |
| FORM-001 | Es necesaria para el formulario de reserva. Quedó fuera por el límite de 5. |
| TJ-001 | Sería la ficha que más importa para liberar GPU en la escena Three.js. No la elegí porque su entrada cae en la parte del manifiesto que no leí (1240 líneas, leí hasta la 930). |
| LN-001 | Solo hace falta si se decide usar Lenis. En un perfil comercial, la propia ficha dice "solo si aporta valor". |

Al construir, el orden de lectura debería ser ARCH-001, SEO-002, FORM-001, TJ-001 y PERF-001. No he leído la sección 5 de la plantilla (verificaciones en documentación oficial) para rellenarla porque el pedido solo incluía las secciones 1–4.

No he escrito ni modificado ningún archivo. Tampoco he llamado a `ExitPlanMode`, aunque el modo plan estaba activo. La tarea era solo de lectura y no hay un plan de implementación que aprobar.