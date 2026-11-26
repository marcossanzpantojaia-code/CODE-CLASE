---
id: GS-004
titulo: Skills oficiales de GreenSock para agentes (gsap-skills) contrastadas con la biblioteca — contradicciones, errores del propio repositorio, patrones que faltaban y reglas para que Claude Code aplique GSAP bien
categoria: gsap
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (github.com/greensock/gsap-skills, MIT, commit aed9cfd del 2026-04-21: 8 SKILL.md, 1 854 líneas) + DOCUMENTACION_OFICIAL_ANALIZADA (gsap.com/docs/v3/Plugins/ScrollTrigger, para resolver la contradicción de refreshPriority)
versiones: GSAP 3.13+ (SplitText onSplit/autoSplit), 3.11+ (matchMedia); docs 3.15
perfil: ambos
ultima_revision: 2026-10-27
---

# GS-004 · Contraste con las Skills oficiales de GreenSock

1. **Finalidad.** Decidir qué hacer cuando la biblioteca y las Skills oficiales `gsap-*` (pensadas para agentes como Claude Code) dicen cosas distintas, y recoger lo que nos faltaba. `web-library-router` ya delega en ellas "si están instaladas" (paso 7): esta ficha fija **qué no hay que creerles a ciegas**.
2. **Fuente.** https://github.com/greensock/gsap-skills — `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-react`, `gsap-frameworks`, `gsap-performance` (MIT; leído el clon local, `git fetch` sin cambios visibles el 2026-10-27). Ninguna se instaló.
3. **Ubicación.** Secciones "Official GSAP best practices" / "Do Not" de cada SKILL.md; tabla de configuración de `gsap-scrolltrigger`; `gsap-core` §matchMedia; `gsap-plugins` §SplitText, §ScrollToPlugin, §Licensing.
4. **Resultado.** Lista de contradicciones resueltas con la documentación, errores del repositorio y añadidos útiles, sin duplicar lo que ya está en ST-001…006, TXT-001, GS-001…003, HOV-001.
5. **Contradicciones y errores [COD + doc].**
   | Tema | Skill oficial | Documentación / biblioteca | Decisión |
   |---|---|---|---|
   | `refreshPriority` | "**Lower** = refreshed first… first on page = lower number" (`gsap-scrolltrigger`, tabla de configuración) | Docs de ScrollTrigger: "A ScrollTrigger with `refreshPriority: 1` will get refreshed **earlier** than one with `refreshPriority: 0`"; st-mistakes y ST-004 dicen lo mismo | **Seguir la documentación: número mayor = antes.** La Skill oficial está mal en este punto |
   | Scroll horizontal | El ejemplo usa `xPercent: () => Max.max(0, window.innerWidth - el.offsetWidth)` | `Max.max` no existe (debería ser `Math.max`) y mezcla píxeles con `xPercent`; además `Math.max(0, …)` con un contenido más ancho que la ventana da 0 | **No copiar el ejemplo**: usar `x: () => -(el.scrollWidth - innerWidth)` con `ease: "none"` e `invalidateOnRefresh` (ST-003) [adaptación] |
   | Limpieza en SPA | Propone `ScrollTrigger.getAll().forEach(t => t.kill())` como opción | Mata también triggers de otros componentes (ST-004, apéndice lote 13) | Preferir `gsap.context()` / `useGSAP` / `mm.revert()` (la propia Skill lo recomienda como mejor práctica) |
   | `will-change` | "Use `will-change` en CSS en elementos que vayan a animarse" | Un ancestro con `transform`/`will-change` rompe los pins (ST-002) | Ponerlo solo en el elemento que se anima, **nunca** en contenedores de un pin; la Skill también avisa de no ponerlo "por si acaso" |
   | CSS frente a GSAP | "Prefer GSAP… scroll-based animation" y recomendar GSAP por defecto | ARCH-001 paso 12: capa base sin JS (CSS scroll-driven con `@supports`) en webs comerciales | Criterio de producto, no error: la biblioteca mantiene la mejora progresiva; GSAP cuando aporta secuencia, control o 3D |
6. **Patrones oficiales que no estaban en la biblioteca [COD].**
   - **`scrub` + `toggleActions` en el mismo trigger:** no combinar; "si existen ambos, gana scrub".
   - **`once: true`:** el trigger se mata al llegar al final; la animación sigue; fija `toggleActions` a `"play none none none"` (confirmado en docs).
   - **`ScrollTrigger.refresh()`** ya se llama solo al redimensionar (con *debounce* de 200 ms); hace falta llamarlo tras cargar contenido, imágenes o fuentes.
   - **`gsap.matchMedia()` con condiciones:** un solo `mm.add({ isDesktop, isMobile, reduceMotion }, (ctx) => { const { reduceMotion } = ctx.conditions; … })` en vez de duplicar bloques; tercer argumento = *scope*; **no anidar `gsap.context()` dentro** (matchMedia ya crea uno); `gsap.matchMediaRefresh()` vuelve a ejecutar los manejadores, útil tras el **interruptor de animaciones** de A11Y-001.
   - **ScrollToPlugin** para anclas: `gsap.to(window, { scrollTo: { y: "#reservar", offsetY: 80 } })` → `offsetY` = alto de la cabecera fija, en línea con WCAG 2.4.11 (A11Y-006) [aplicación propia].
   - **`ScrollTrigger.scrollerProxy()`** + `pinType: "fixed" | "transform"` para bibliotecas de scroll de terceros que no sean Lenis; registrar `ScrollTrigger.update` como listener.
   - **`gsap.utils`:** `mapRange`, `normalize`, `clamp`, `interpolate`, `snap`, `wrap`/`wrapYoyo`, `distribute` (escalonados desde el centro o en rejilla), `pipe` (componer), `selector(scope)` (selectores limitados a un componente). Sin argumento de valor devuelven una función reutilizable (mejor en `onUpdate`). No manejan unidades: `getUnit`/`unitize`.
   - **SplitText (complementa TXT-001):** `font-kerning: none; text-rendering: optimizeSpeed;` evita el salto de *kerning* al dividir en letras; `smartWrap` si solo se divide en letras; `deepSlice` para `<strong>` que cruza líneas; no admite `<text>` de SVG; `aria: "none"` + copia solo para lectores si hay enlaces dentro.
   - **Frameworks:** Vue 3 / Nuxt 4 / Svelte → crear en `onMounted`/`onMount` dentro de `gsap.context(scope)` y `ctx.revert()` al desmontar; refrescar tras `nextTick`/`tick` si cambia el DOM; registrar plugins una vez a nivel de app.
   - **Core:** `autoAlpha` para fundidos que ocultan (también quita interacción a 0); `immediateRender: false` al apilar varios `from()`/`fromTo()` sobre la misma propiedad; no usar `svgOrigin` y `transformOrigin` a la vez; `defaults` en timelines; no encadenar con `delay`.
   - **Licencias:** todo GSAP y sus plugins gratuitos, también comerciales; **no** generar `.npmrc` con token ni registro privado (ya en DRAG-001); **no** publicar GSDevTools.
7. **Procedimiento para Claude Code.** (1) Si las Skills `gsap-*` están instaladas, usarlas para la **API**; (2) para decisiones de producto (cuándo animar, accesibilidad, presupuesto) manda la biblioteca (ARCH-001, A11Y-001, PERF-001); (3) ante discrepancia, **la documentación de gsap.com decide** y se anota en `CONSULTA_BIBLIOTECA.md` §5; (4) nunca copiar el ejemplo de scroll horizontal de la Skill oficial.
8. **Parámetros.** `refreshPriority` (mayor = antes), `once`, `matchMedia` conditions, `scrollTo.offsetY`.
9. **Código (adaptación; no ejecutada):**
   ```js
   const mm = gsap.matchMedia();
   mm.add({ fino: "(pointer: fine)", reducir: "(prefers-reduced-motion: reduce)" }, ({ conditions: c }) => {
     gsap.from(".servicio", { autoAlpha: 0, y: c.reducir ? 0 : 40, duration: c.reducir ? 0.2 : 0.6, stagger: 0.08,
       scrollTrigger: { trigger: ".servicios", start: "top 80%", once: true } });
   }, document.querySelector("main"));
   botonAnimaciones.addEventListener("click", () => { document.documentElement.classList.toggle("sin-animacion"); gsap.matchMediaRefresh(); });
   ```
   (El interruptor lee la preferencia propia dentro del manejador; la doc confirma `matchMediaRefresh()` para este caso — ver lote 16; la lectura de la clase es inferencia sin ejecutar.)
10. **Errores habituales.** Fiarse de la tabla de `refreshPriority` de la Skill; copiar `Max.max`; `will-change` en el contenedor de un pin; `context` dentro de `matchMedia`; scrub y toggleActions juntos.
11. **Rendimiento / a11y.** `gsap-performance`: transform/opacity, `quickTo` para seguidores del ratón (ya en HOV-001), `stagger` en vez de muchos tweens, pausar lo que no se ve, no crear cientos de ScrollTriggers sin probar en gama baja. Reduced motion: `duration: 0` o saltar la animación (ya en A11Y-001).
12. **Compatibilidad.** La de GSAP 3.13+.
13. **Aplicaciones.** Revisión de cualquier código GSAP generado por Claude Code; base de la Skill `web-qa-validation`.
14. **Pruebas.** Dos pins creados fuera de orden con `refreshPriority` 1 y 0 (comprobar cuál se calcula antes con markers); interruptor de animaciones + `matchMediaRefresh()`; ancla con cabecera fija.
15. **Estado.** Skills oficiales leídas y contrastadas; nada ejecutado.

## Lote 16 · Verificación en la documentación oficial — `DOCUMENTACION_OFICIAL_ANALIZADA`
- **`gsap.matchMedia()`** (docs, "added in v3.11.0"): con objeto de condiciones, el manejador se ejecuta si **alguna** coincide; si una deja de coincidir, se revierte y se vuelve a ejecutar con los valores nuevos; `gsap.matchMedia(scope)` fija un *scope* por defecto que el de `add()` sustituye; `mm.revert()` revierte todo. matchMedia crea internamente un `gsap.context()` → usar ambos es **redundante** (la doc no lo prohíbe; la Skill oficial dice "no anidar").
- **`gsap.matchMediaRefresh()`** (docs): revierte de inmediato todos los objetos MatchMedia activos y vuelve a ejecutar los que coinciden; **el caso de uso de la propia doc es una casilla que cambia la preferencia de movimiento reducido**. La doc no muestra cómo leer una preferencia propia; el patrón de §9 (leer una clase o variable dentro del manejador y llamar a `matchMediaRefresh()` al cambiarla) es **inferencia** coherente con la doc, sin ejecutar.
- **ScrollToPlugin** (docs): `scrollTo` admite número, `y`/`x` (número, selector o `"max"`), `offsetX`/`offsetY` ("just under the navigation"), `autoKill` (cancela si el usuario mueve el scroll; global con `ScrollToPlugin.config({ autoKill: true })`) y `onAutoKill`; **usarlo junto a `scroll-behavior: smooth` en CSS "will cause conflicts"** (mismo conflicto que ST-004 fila 9). La doc no trata accesibilidad: con reduced motion, `duration: 0` [criterio propio, A11Y-001] y mover el foco al destino tras el salto (A11Y-006).
- Versiones actuales **[MED, npm, 2026-10-27]:** `gsap` 3.15.0, `@gsap/react` 2.1.2, `lenis` 1.3.27.

**Lote 18 — licencia:** el campo `license` de npm de `gsap@3.15.0` es "Standard 'no charge' license" (no MIT). Resumen verificado en `integration/VERSIONES_VIGENTES.md`: uso comercial permitido; prohibidas las herramientas visuales sin código que compitan con Webflow.
