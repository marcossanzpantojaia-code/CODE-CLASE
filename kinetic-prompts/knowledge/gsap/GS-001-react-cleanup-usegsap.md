---
id: GS-001
titulo: GSAP en React/Next.js — useGSAP, scope y limpieza
categoria: gsap
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (README de greensock/gsap-skills); gsap.com/resources/React pendiente
versiones: gsap 3.15.0; @gsap/react 2.1.2 (**[MED]** registro npm, 2026-10-27)
perfil: ambos
ultima_revision: 2026-10-27
---

# GS-001 · GSAP en React con limpieza

1. **Finalidad.** Evitar fugas, animaciones duplicadas y pins rotos al montar/desmontar componentes (StrictMode, navegación en Next.js).
2. **Fuente.** https://github.com/greensock/gsap-skills (Quick reference, punto 5) · https://gsap.com/resources/React (pendiente).
3. **Ubicación.** README → "Quick reference (for AI agents)".
4. **Resultado.** Animaciones revertidas al desmontar; selectores limitados al componente.
5. **Explicación técnica.** `useGSAP()` (`@gsap/react`) crea un `gsap.context()` y lo revierte al desmontar; `scope` limita los selectores a un contenedor. Equivalente manual: `useEffect` + `gsap.context()` + `ctx.revert()` en el cleanup.
6. **Dependencias.** `gsap`, `@gsap/react`. En Next.js App Router, componente cliente.
7. **Procedimiento.** Registrar plugins y `useGSAP` una vez; refs; `scope` siempre que se usen selectores.
8. **Parámetros.** `scope`, `dependencies`, `revertOnUpdate` (verificar en doc).
9. **Código (adaptación del patrón oficial; no ejecutado):**
   ```jsx
   "use client";
   import { useRef } from "react";
   import { gsap } from "gsap";
   import { useGSAP } from "@gsap/react";
   gsap.registerPlugin(useGSAP);
   export function Hero() {
     const root = useRef(null);
     useGSAP(() => { gsap.from(".hero__title", { y: 40, autoAlpha: 0 }); }, { scope: root });
     return <section ref={root}><h1 className="hero__title">…</h1></section>;
   }
   ```
10. **Problemas.** Doble ejecución en StrictMode sin limpieza; pins que saltan tras navegar; SSR accediendo a `window`.
11. **Rendimiento / a11y.** Como ST-001; reduced motion con `gsap.matchMedia()`.
12. **Compatibilidad.** React 18/19. Vue/Svelte: skill oficial `gsap-frameworks`.
13. **Aplicaciones.** Cualquier web React/Next.js.
14. **Pruebas.** Navegar entre rutas 10 veces y comprobar `ScrollTrigger.getAll().length` estable, con StrictMode.
15. **Evidencia.** README oficial. Código no ejecutado.

**Actualización lote 3 (2026-10-26) — guía oficial gsap.com/resources/React (DOCUMENTACION_OFICIAL_ANALIZADA).**
- `useGSAP(callback, config | deps)`: sin segundo argumento se ejecuta una vez al montar y sin scope. Config: `scope` (ref que acota los selectores de texto), `dependencies` (como en `useEffect`; por defecto vacío), `revertOnUpdate` (por defecto `false`: al cambiar dependencias **no** revierte; `true` revierte y limpia en cada re-ejecución).
- Registrar el hook: `gsap.registerPlugin(useGSAP)` para que hook y GSAP compartan instancia de React.
- Limpieza automática al desmontar (animaciones, ScrollTriggers, Draggables, SplitText) mediante `gsap.context()`.
- Animaciones creadas **después** de ejecutar el hook (clics, `setTimeout`) no se limpian solas: envolverlas con `contextSafe` (devuelto por el hook o como segundo argumento del callback). Listeners añadidos a mano: quitarlos en la función de limpieza devuelta.
- Modo estricto de React 18: los efectos se ejecutan dos veces en desarrollo; el hook lo resuelve revirtiendo (evita duplicados y conflictos de `from()`, el fallo visto en TUT-004).
- SSR/Next.js: el hook usa `useLayoutEffect` si existe `window` y `useEffect` si no; en App Router, `"use client"`.
- Demos oficiales: CodePen GreenSock/OJmQvLZ (starter), GreenSock/ZEKJPLa (contextSafe), StackBlitz gsap-react-basic-f48716 (no inspeccionados).
- **Aplicación a la biblioteca:** 7 de los 17 TUT usan `useEffect`/`useLayoutEffect` sin limpieza; la corrección estándar es este hook.
