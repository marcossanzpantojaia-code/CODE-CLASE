---
id: PT-001
titulo: Transiciones de página "paralelas" (página saliente y entrante a la vez) con una sola timeline GSAP coreografiada — React Router + hyperkinetic
categoria: transitions
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Codrops, Ismael Martínez, 08-10-2026) + CODIGO_INSPECCIONADO (repos `ismamz/amber`, sin licencia, y `ismamz/hyperkinetic`, MIT) (TUT-031)
versiones: fuente — react-router 8.4.0 (framework mode), react ~19.2, gsap ^3.15, hyperkinetic 0.1.0-alpha.0, three ^0.186 + R3F 9 + drei 10
perfil: cinematografico
ultima_revision: 2026-10-26
---

# PT-001 · Parallel page transitions

1. **Finalidad.** Navegar entre páginas sin pantallazo: la página que se va y la que llega conviven en el DOM y se animan juntas en **una timeline**, incluida una escena WebGL persistente que reacciona a cada navegación (tema 15; complementa CSS-002/NEXT-001 que son secuenciales o de View Transitions).
2. **Fuentes.** Artículo https://tympanus.net/codrops/2026/10/08/building-parallel-page-transitions-with-gsap-and-react-router/ ; demo https://amber.isma.uy (no abierta); código https://github.com/ismamz/amber (commit a0a317c, sin licencia → paráfrasis) y motor https://github.com/ismamz/hyperkinetic (MIT, alfa experimental). Relacionado: `ismamz/next-transition-router` (secuencial, Next.js). Modelos 3D CC BY 4.0 (créditos en el repo).
3. **Secuencial vs paralelo [artículo].** Secuencial: sale una y luego monta la otra (Barba, Swup, Taxi, Highway, trucos en App Router). Paralelo: ambas montadas y animadas a la vez (Swup Parallel, Barba `sync`, Nuxt sin `mode`). View Transition API se parece pero la saliente es una **captura estática** y la entrante la gestiona el navegador (orientada a estados), mientras que aquí todo es timeline.
4. **Mecánica [artículo + COD].**
   - `AnimatedOutlet` sustituye a `<Outlet />` en `root.tsx`; usa `useOutlet` de React Router para retener la página actual mientras monta la siguiente. Navegación normal con `Link`/`navigate`.
   - Por navegación: **una timeline en pausa**; los componentes añaden tweens y el motor la reproduce.
   - `choreograph({ tl, current, next, initial, reduced, ready, leaveEnd })`: único callback obligatorio; publica **etiquetas** (en Amber: `exit-end`, `scene-start`, `entrance-start`, `title-start`, `identity-start`) calculadas según la ruta de origen/destino (p. ej. al volver al índice, la escena empieza 0,12 s antes del fin de las salidas; los títulos entrantes esperan a `leaveEnd("titles")`).
   - Por componente, `usePageTransition`: `leave`, `enter`, `enterAt` (etiqueta), `prepare` (antes del primer pintado), `complete`, `group` + `leaveEnd(group)`.
   - Fuera del outlet (la escena 3D): `usePersistentTransition`; `useTransitionResource` retiene la transición hasta que la escena está lista (timeout 5 s por defecto).
   - **Fallback** para todo lo que no declara animación (Amber): salida `autoAlpha 0`, 0,35 s, stagger 0,035; entrada `autoAlpha 1`, 0,7 s, stagger 0,07, `clearProps`. Eases propias con `CustomEase`: `.76,0,.2,1` y `0.65,0.01,0.05,0.99`.
5. **Scroll [artículo + COD].** No montar `<ScrollRestoration />` (el autor lo deja comentado: salta a mitad de transición); `before` pone `history.scrollRestoration = "manual"`; la saliente conserva la altura del documento; la entrante va `fixed`; en `afterEnter` se hace `scrollTo(0,0)` con la saliente ya oculta; si la transición se interrumpe (`interrupted`), se resetea en `beforeEnter`. Lenis funciona; para pins usar `sticky` en lugar de ScrollTrigger pin.
6. **Accesibilidad [artículo].** La saliente recibe `inert` (no clicable, no enfocable, no leída) + `pointer-events: none`. `reduced` llega a cada callback: el desarrollador debe poner duraciones/staggers a 0 (Amber lo hace con `at = s => reduced ? 0 : s`). El motor **no** gestiona el foco ni anuncia la nueva página → añadir anunciador `aria-live` con el título y mover el foco al `h1`/`main`.
7. **Procedimiento profesional (adaptación).**
   1. Decidir si compensa: el artículo advierte del coste en rendimiento y accesibilidad. Para webs comerciales, View Transitions (CSS-002) o nada.
   2. Un solo outlet animado; tweens siempre finitos (si no, la transición no termina).
   3. Agrupar salidas por `group` para no recalcular etiquetas a mano al cambiar duraciones.
   4. `initial: true` → ocultar contenido con `data-page-initial` dentro de `@media (scripting: enabled)` para no esconderlo sin JS.
   5. Usar `debug.devTools` (GSDevTools) solo en desarrollo.
8. **Parámetros.** Ver §4 (duraciones, staggers, eases, offsets de etiquetas, timeout 5 s).
9. **Código (patrón del README de hyperkinetic, MIT; no ejecutado):** la configuración vive en un módulo aparte (`lib/transition.ts`, tipado con `satisfies AnimatedOutletProps`) y se esparce en el único outlet:
   ```tsx
   import { AnimatedOutlet } from "hyperkinetic";
   import { config as transition } from "@/lib/transition";
   <AnimatedOutlet {...transition} />
   ```
10. **Riesgos.** Motor en alfa (API puede cambiar); un único outlet; interrupciones (la entrante pasa a ser saliente); fuentes de Google por CDN en el repo.
11. **Rendimiento.** Dos páginas + escena 3D a la vez: vigilar memoria y INP durante la navegación; escena con carga diferida (`lazy`) y espera acotada.
12. **Compatibilidad.** React Router 8 framework mode; React 19.
13. **Aplicaciones.** Portfolio, web de producto o campaña con navegación entre fichas (proyectos, productos).
14. **Pruebas.** Navegar rápido varias veces (interrupción); Atrás/Adelante (scroll); teclado y lector (foco tras navegar); reduced motion (todo a 0); sin JS.
15. **Estado.** Artículo y código leídos; no ejecutado; demo no observada (panel oculto).
