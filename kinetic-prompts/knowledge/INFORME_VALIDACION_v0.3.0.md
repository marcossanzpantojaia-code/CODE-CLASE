# Informe de validación — WEB_ENGINEERING_KNOWLEDGE_LIBRARY v0.3.0

Fecha: 2026-10-26 · Modo: solo lectura · Nada instalado, nada ejecutado de terceros, ningún proyecto ni la biblioteca modificados.

## 1. Resultado de la inspección

| Comprobación | Resultado |
|---|---|
| ZIP | `WEB_ENGINEERING_KNOWLEDGE_LIBRARY_v0.3.0.zip`, SHA-256 `a17cf7af667f50f9e04bdbeafac75c82b20b52f1d2a0bd773c3e83cc75ec6bcd`. `unzip -t` sin errores. 53 archivos. Sin rutas absolutas ni `..` (sin riesgo de *zip-slip*). Sin scripts ni ejecutables (.sh, .ps1, .js, .py, .exe). |
| Estructura | Raíz con 6 archivos de control; carpetas temáticas (scrolltrigger, animations, transitions, interactions, threejs, lenis, gsap, accessibility, architecture), `tutorials/` (10 TUT + README), `skills/` (4 SKILL.md + README), `_templates/` (2), `_origen/` (5, material original). |
| KNOWLEDGE_INDEX.md | 24 fichas técnicas listadas = 24 archivos en disco. Tabla de cobertura de los 15 temas coherente con las fichas. |
| JSON | `SOURCE_CATALOG.json` y `VIDEO_RESEARCH_INDEX.json` válidos (41 fuentes; 21 entradas de inventario). |
| Rutas internas | 0 enlaces Markdown rotos (comprobado por script en todas las .md salvo `_origen/`). Nombres de archivo solo ASCII, sin espacios ni caracteres prohibidos en Windows; profundidad máxima 2 → sin problema de MAX_PATH. |
| Evidencias | 24/24 fichas en `INVESTIGADO`; 0 IMPLEMENTADO/VALIDADO. Base: 9 documentación oficial, 13 código inspeccionado, 2 artículo del autor. Cada ficha declara honestamente que nada se ha ejecutado. |
| Skills | 4 SKILL.md con frontmatter válido (`name` en kebab-case, `description` de 314–407 caracteres, < 1024). Cuerpos cortos (24–32 líneas): adecuados para carga progresiva. |

## 2. Compatibilidad con Claude Code

**Formato: compatible. Funcionamiento real: no probado y con 3 bloqueos de integración.**

1. **Las Skills no saben dónde está la biblioteca.** El router busca `KNOWLEDGE_INDEX.md` en una "ruta configurada en CLAUDE.md como `WEB_LIBRARY_PATH`". Eso no es un mecanismo de Claude Code: es texto libre que el modelo tiene que leer e interpretar. Si las Skills se copian a `~/.claude/skills/`, quedan separadas de las fichas y ninguna referencia relativa funciona. **Solución:** escribir la ruta absoluta en el propio SKILL.md (o empaquetar las fichas como `references/` dentro de la Skill).
2. **`~` en Windows.** `~/knowledge/...` lo expande Git Bash, pero las herramientas de archivos de Claude Code necesitan una ruta absoluta. Usar `C:/Users/<usuario>/...` con barras normales.
3. **Las Skills están desactualizadas respecto a v0.3.0.** Se escribieron en v0.1–0.2: no mencionan ninguna de las 11 fichas nuevas (HOV-001/002/003, CLIP-001, CARD-001, R3F-001, CFG-001, TXT3D-001, CAM-001, GL-001, GL-002) ni `tutorials/`. `web-cinematic-site` aún dice que las fichas de cámara están "PENDIENTES". La lista de incompatibilidades del router no incluye las nuevas (p. ej., `quickTo` sobre layout, `onloadedmetadata` repetido, ease mal escrito que falla en silencio).

Otros puntos:
- Las Skills se piden entre sí ("invoca `web-qa-validation`"). Claude Code no encadena Skills de forma determinista; el modelo debe cargarla. Funciona como instrucción, no como garantía.
- `web-qa-validation` presupone Playwright/Lighthouse/axe, que no están instalados. Lo reconoce, pero sin ellos la Skill no puede promover ninguna ficha.
- **Solapamiento de activación con las Skills oficiales de GSAP.** La descripción del router se activa con "GSAP, ScrollTrigger…" igual que `gsap-core` y `gsap-scrolltrigger`. Es compatible si el router se limita a seleccionar fichas y delega la API, como ya indica en el paso 7.

## 3. Pruebas de recuperación

Método: localizar la técnica partiendo solo de `KNOWLEDGE_INDEX.md` → ficha → TUT → fuente. Las tres se recuperaron en 2 saltos.

### HOV-001 · Botón magnético

- **Dónde:** `interactions/HOV-001-boton-magnetico-quickto.md` (índice → "Microinteracción en botones / CTA").
- **Fuente:** TUT-003 → `olivierlarose/awwwards-landing-page`, commit 3fce019, `src/common/Magnetic/index.jsx` y `src/common/RoundedButton/index.jsx`. Sin licencia: solo paráfrasis. La cuenta está verificada (cadena GitHub → web → blog).
- **Cómo funciona:** se crean una vez dos `gsap.quickTo()` (x, y; 1 s; `elastic.out(1, 0.3)`). En `mousemove` se mide la distancia del cursor al centro (`getBoundingClientRect`) y el elemento se desplaza el 35 % de ella. En `mouseleave` vuelve a (0, 0). Como extra opcional, el relleno circular usa una timeline en pausa con etiquetas `enter`/`exit` y una salida diferida 300 ms.
- **Tecnologías:** solo `gsap` core (3.12.2 en la fuente; documentación vigente 3.15). Sin React necesariamente.
- **Implementación:** la adaptación de la ficha usa `gsap.matchMedia()` con `(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`, eventos `pointermove`/`pointerleave` y una función de limpieza que retira los listeners. Debe aplicarse sobre un `<button>` o `<a href>` real.
- **Requisitos y limitaciones:** solo tiene sentido con ratón. Con teclado o táctil no existe, y no debe ser necesario. La fuente tiene 4 fallos documentados que hay que evitar: listeners sin retirar, `console.log`, `div` con `onClick` y `<a>` sin `href`.
  - **Defecto en la ficha:** el fragmento usa `mm` y `el` sin declararlos. Es pseudocódigo, pero no se puede copiar tal cual.
- **Pruebas:** ver §6. La ficha (campo 14) pide ratón, táctil, teclado, reduced motion y desmontaje.

### CLIP-001 · Revelado con clip-path

- **Dónde:** `transitions/CLIP-001-revelado-clip-path-scroll.md` (índice → "Imagen que se abre al hacer scroll"; tema 9).
- **Fuente:** TUT-002 → `olivierlarose/smooth-scroll`, commit 38b3ffe, `src/components/Intro/index.jsx`. Vídeo enlazado por el autor, no visto.
- **Cómo funciona:** una timeline con ScrollTrigger (`scrub: true`, de 0 a +500 px) anima la imagen de fondo desde `clipPath: inset(15%)` hasta su estado natural. En paralelo reduce la altura de la imagen central.
- **Tecnologías:** gsap + ScrollTrigger (3.12.1 en la fuente). CSS `clip-path`.
- **Implementación (ficha):** usar el propio hero como `trigger`, un `end` relativo y `scale` en lugar de `height`.
- **Requisitos y limitaciones:** coste de repintado aceptable en una sola imagen; con reduced motion, pasar directamente al estado final; LCP (la imagen no debe quedar oculta al cargar).
  - **Defecto en la ficha:** el fragmento propuesto anima con `from` desde `inset(15% round 24px)` hacia el valor natural del elemento, que es `none`. La propia ficha advierte de que el origen y el destino deben tener la misma forma. Leyendo `CSSPlugin.js` de gsap 3.12.2, el destino `none` no tiene números que interpolar, así que el efecto podría saltar en lugar de animarse. **Sin verificar, no confirmado.** Corrección propuesta: `fromTo` con un destino explícito `inset(0% round 0px)`.
- **Pruebas:** scroll adelante/atrás, 3 anchos, reduced motion, LCP, y una prueba específica de interpolación (muestrear `clip-path` al 50 % del recorrido).

### R3F-001 · Escena 3D controlada por scroll

- **Dónde:** `threejs/R3F-001-scrollcontrols-timeline-seek.md` (índice → "Escena 3D que cuenta una historia con el scroll"; tema 13).
- **Fuente:** TUT-004 → `wass08/r3f-scrolling-animation-tutorial`, commit 7700018, `src/components/Office.jsx`, `Experience.jsx` y `Overlay.jsx`. Wawa Sensei verificado.
- **Cómo funciona:** una sola timeline de GSAP con tweens sobre `position` y `rotation` de grupos 3D, con tiempos absolutos como guion. En cada frame, `useFrame` ejecuta `tl.seek(scroll.offset × tl.duration())`: el scroll de `ScrollControls` (drei) hace de cabezal de reproducción y `damping` aporta la inercia. Los paneles HTML usan `scroll.range()` y `scroll.curve()`. **No usa ScrollTrigger.**
- **Tecnologías:** three ^0.149, @react-three/fiber ^8.10, @react-three/drei ^9.56, gsap ^3.11.4, React 18. La ficha avisa de que R3F 9 y drei 10 (React 19) pueden cambiar la API.
- **Implementación:** la ficha propone una timeline con `paused: true`, limpieza con `kill()`, `to()` en lugar de `from()` (para que sea idempotente en modo estricto) y opacidades escritas en refs del DOM, sin `setState` por frame.
- **Requisitos y limitaciones:** WebGL 2; GLB comprimido (el de la fuente pesa 4,6 MB y el `.blend` se sirve públicamente); conflicto entre OrbitControls y el scroll; el contenido de `<Scroll html>` queda fuera del flujo normal (afecta a SEO, accesibilidad y anclas); plan B sin WebGL y con reduced motion.
- **Pruebas:** scroll adelante/atrás y salto rápido (el seek debe ser determinista), modo estricto, resize, `renderer.info` y memoria (TJ-001).

**Veredicto de recuperación:** las tres técnicas son recuperables y trazables hasta archivo y commit. Hay suficiente información para implementarlas, pero **ninguna está probada**, y dos fragmentos de código tienen defectos que solo se detectan ejecutando.

## 4. Problemas detectados

| # | Gravedad | Problema |
|---|---|---|
| P1 | Alta | Las Skills no localizan la biblioteca (ruta en CLAUDE.md como texto libre; `~` en Windows). |
| P2 | Alta | Las Skills no reflejan la v0.3.0 (11 fichas nuevas y `tutorials/` ausentes). |
| P3 | Alta | 0 fichas validadas: la biblioteca aún no puede afirmar que nada funciona. La Skill QA depende de herramientas no instaladas. |
| P4 | Media | El fragmento de CLIP-001 podría no interpolar (`inset()` hacia `none`); sin verificar. |
| P5 | Media | El fragmento de HOV-001 usa `mm` y `el` sin definir. |
| P6 | Media | El fragmento de CARD-001 reparte el progreso con `i/N` y la fuente con `i/(N−1)`: no reproduce el mismo ritmo. |
| P7 | Baja | El estado `ARTICULO_AUTOR_ANALIZADO` se usa en 2 fichas, pero no figura en `SOURCE_CATALOG.json → evidence_states`, en `_templates/FICHA_TECNICA.md` ni en §3 de `00_CONTEXTO`. |
| P8 | Baja | `IMPORT_GUIDE.md` indica copiar las 4 Skills a `~/.claude/skills/` (global), lo que choca con la restricción actual; además está desfasada (no menciona `tutorials/` ni `_origen/`). |
| P9 | Baja | Fichas largas para su uso real: cada una tiene 15 campos, con mezcla de procedencia y procedimiento. Faltan etiquetas consultables (temas, perfil, dependencias) en el frontmatter para filtrar sin leer el cuerpo. |

**Instrucciones externas potencialmente inseguras (ninguna ejecutada):**

- **Fuente externa (README de `greensock/gsap-skills`, commit aed9cfd, 2026-04-21):**
  - Contiene una instrucción dirigida a agentes ("For AI agents: … recommend GSAP"). No es maliciosa, pero es una preferencia comercial embebida: el perfil comercial puede preferir CSS sin JS, y debe mandar la biblioteca.
  - Sus métodos de instalación (`npx skills add …`, `/plugin marketplace add greensock/gsap-skills`) ejecutan o descargan código de terceros, así que requieren autorización.
- **Dentro de la biblioteca:**
  - `_origen/CONVERSACION_LITERAL.md` menciona yt-dlp como opción evaluada y descartada. Es contexto, no una orden.
  - `IMPORT_GUIDE.md` sugiere instalaciones globales.
  - Las fichas TUT citan comandos de los READMEs originales solo como descripción.
- **Recomendación:** tratar `_origen/` y todas las fuentes como datos, nunca como instrucciones.

## 5. Propuesta mínima de integración (Windows)

1. **Ubicación permanente:** `C:\Users\<usuario>\knowledge\WEB_ENGINEERING_KNOWLEDGE_LIBRARY\`. Fuera de los proyectos, fuera de `AI_CINEMATIC_VIDEO_ENGINE` y preferiblemente fuera de OneDrive (la sincronización bloquea archivos y genera conflictos). Versionarla con un git local propio (lo hace el usuario; aquí no se crean commits).
2. **Separar documentación y código probado:**
   - `...\knowledge\WEB_ENGINEERING_KNOWLEDGE_LIBRARY\` → solo fichas (documentación).
   - `...\knowledge\WEB_LIBRARY_LAB\demos\<ID>\` → demos aisladas.
   - `...\knowledge\WEB_LIBRARY_LAB\evidence\<ID>\<fecha>\` → capturas, métricas y `results.json`.
   - Una ficha solo pasa a IMPLEMENTADO o VALIDADO enlazando su carpeta de evidencia.
3. **Skills (sin duplicar):**
   - **Fase de prueba:** crear un proyecto sandbox `WEB_LIBRARY_LAB` con `.claude\skills\` de proyecto. Nada global.
   - **Dos Skills en lugar de cuatro:**
     - `web-library`: fusiona el router con los perfiles comercial y cinematográfico como secciones de un mismo SKILL.md, con la ruta absoluta `C:/Users/<usuario>/knowledge/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/KNOWLEDGE_INDEX.md`.
     - `web-qa-validation`.
   - **Pasar a `%USERPROFILE%\.claude\skills\` solo cuando** ambas hayan funcionado en el sandbox, y con autorización.
4. **Carga selectiva:** el SKILL.md lee el índice (~100 líneas) y después solo las 1–3 fichas necesarias. Añadir al frontmatter de las fichas `temas: [10]`, `deps: [gsap]` y `perfil`, para que el modelo filtre con una búsqueda sin abrir fichas.
5. **Skills oficiales de GSAP:** instalarlas solo con autorización, vía `/plugin marketplace add greensock/gsap-skills`, tras auditar su contenido (ya leído aquí: 8 SKILL.md, 1.854 líneas, MIT).
   - **Reparto de funciones:** las oficiales cubren la API (quickTo en `gsap-performance`; matchMedia y reduced motion en `gsap-core`). La biblioteca no repite API y aporta perfil de negocio, integración con Lenis y Three.js/R3F, fallos de tutoriales y pruebas.
6. **Rutas:** barras normales en todas las rutas escritas en Skills y CLAUDE.md. Sin `~`. Sin espacios en carpetas (ya se cumple).
7. **CLAUDE.md:** no se toca el existente. En el sandbox basta una línea propia que apunte a la Skill `web-library`.
8. **Actualización de fichas:**
   - Nueva ficha → plantilla + índice + `SOURCE_CATALOG`, más una línea en `CHANGELOG.md` (nuevo).
   - Cambio de estado → solo mediante `web-qa-validation`, con evidencia enlazada.
   - Mantener las Skills sincronizadas con el índice: el SKILL.md no debe listar IDs, solo apuntar al índice. Así se evita que se desfase como ahora.

## 6. Plan de la primera demostración visual — HOV-001

**Por qué HOV-001:** útil en webs comerciales (CTA "Reservar cita"), con una sola dependencia, sin build ni framework, y con un comportamiento medible numéricamente (desplazamiento = 35 % de la distancia), lo que permite una prueba con resultado esperado objetivo.

**Archivos a crear** (en `WEB_LIBRARY_LAB\demos\HOV-001\`; ninguno existe todavía):

| Archivo | Contenido |
|---|---|
| `index.html` | Tres casos: (A) `<button>` con efecto, (B) `<a href>` con efecto, (C) botón de control sin efecto. Estilos de foco visibles. Contador de clics para verificar la activación. |
| `styles.css` | Tamaños en rem; `:focus-visible`; diseño estático correcto sin JS. |
| `magnetic.js` | Módulo `createMagnetic(el, { strength: 0.35, duration: 1, ease: "elastic.out(1,0.3)" })` → devuelve `destroy()`. Usa `gsap.matchMedia()` con la media query de la ficha y `pointermove`/`pointerleave`. Es la adaptación propuesta de HOV-001 con `mm` y `el` corregidos. |
| `vendor/gsap.min.js` | GSAP 3.15.x exacto (origen y SHA-256 anotados), **o** carga desde CDN con versión fija. Ver permisos. |
| `README.md` | Versión exacta de GSAP, navegador y comandos. |
| `tests/hov-001.spec.mjs` | Pruebas Playwright (tabla siguiente). |
| `tests/playwright.config.mjs` | Proyectos Chromium y WebKit; viewports de 375, 768 y 1440. |
| `evidence/` | Lo genera la ejecución: capturas, `results.json` y versiones. |

**Pruebas (criterio de aceptación = todas en verde en Chromium y WebKit):**

| # | Prueba | Resultado esperado |
|---|---|---|
| T1 | Carga | 0 errores de consola; `gsap.version` = la versión anotada. |
| T2 | Atracción | Con el puntero a (dx, dy) del centro y tras 1,5 s, la traslación (`gsap.getProperty(el,"x"/"y")`) ≈ 0,35·dx y 0,35·dy, con ±1 px. Se prueba en 4 posiciones. |
| T3 | Retorno | Tras `pointerleave` y 2 s, x = y = 0 (±0,5 px). |
| T4 | Ease elástico | Al muestrear x cada 16 ms durante el retorno, aparece al menos un cruce de signo (sobrepaso). Comprueba que el ease no ha caído al de por defecto en silencio, el fallo visto en TUT-002. |
| T5 | Reduced motion | Con `reducedMotion: 'reduce'`, el hover no produce traslación. |
| T6 | Táctil | Con `hasTouch` y media `(hover: none)`, no hay traslación al tocar. |
| T7 | Teclado | Tab llega a A y B en orden; el anillo de foco es visible (captura); Enter/Espacio incrementan el contador. |
| T8 | Limpieza | Tras `destroy()`, mover el puntero no cambia x/y y no quedan tweens del elemento (`gsap.getTweensOf(el).length === 0`). |
| T9 | Sin fugas | 500 movimientos de puntero: el número de hijos de `gsap.globalTimeline` se mantiene acotado (quickTo reutiliza un tween). |
| T10 | Layout | El efecto no altera la posición de los elementos vecinos: CLS = 0 y `getBoundingClientRect` de C sin cambios. |
| T11 | Visual | Capturas en reposo y en hover en 3 anchos. Primera ejecución = línea base con revisión humana; las siguientes, comparación de píxeles con tolerancia. |

Resultado previsto: con todo en verde, HOV-001 pasa a **IMPLEMENTADO** (código ejecutado) y, con la evidencia enlazada en Chromium y WebKit, a **VALIDADO**.

## 7. Permisos necesarios para ejecutarla

| Permiso | Para qué | Alternativa |
|---|---|---|
| Crear la carpeta `WEB_LIBRARY_LAB\demos\HOV-001\` (o en la nube de esta sesión) | Escribir los 7 archivos | Hacerlo solo en el espacio de trabajo de la nube; no toca nada del usuario. |
| Obtener GSAP 3.15.x | Dependencia única | (a) Descargar el tarball del registro npm y verificar el SHA-256; (b) CDN jsDelivr con versión fija. No requiere `npm install` global. |
| Servidor estático local (`python -m http.server`) | Servir la demo | Ninguna (los módulos ES requieren http). |
| Ejecutar Playwright + Chromium | T1–T11 | En la nube de esta sesión ya están preinstalados (Playwright 1.63, Chromium): no hay que instalar nada. En Windows haría falta instalarlos. |
| Instalar el navegador WebKit de Playwright | Segunda mitad del criterio VALIDADO | Sin él, el máximo alcanzable es IMPLEMENTADO + "validado solo en Chromium". |
| Actualizar la ficha HOV-001 y el índice tras las pruebas | Registrar estado y evidencia | Entregar los cambios propuestos como archivo para revisión manual. |
