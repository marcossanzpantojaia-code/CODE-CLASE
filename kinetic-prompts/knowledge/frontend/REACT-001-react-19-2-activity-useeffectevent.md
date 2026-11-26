---
id: REACT-001
titulo: React 19.2 para webs animadas — <Activity> (oculto = efectos desmontados), useEffectEvent (leer valores sin reiniciar efectos), cacheSignal, pistas de rendimiento y su efecto en animaciones GSAP
categoria: frontend
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (react.dev/blog, "React 19.2", 2025-10-01, equipo de React)
versiones: React 19.2; eslint-plugin-react-hooks v6
perfil: ambos
ultima_revision: 2026-10-27
---

# REACT-001 · React 19.2

1. **Nombre y finalidad.** Usar las APIs nuevas de React sin romper animaciones: qué pasa con un timeline de GSAP dentro de una sección oculta con `<Activity>` y cómo evitar reiniciar un efecto de animación al cambiar un valor secundario. Complementa GS-001 (`useGSAP`) y NEXT-004.
2. **Fuente.** https://react.dev/blog/2025/10/01/react-19-2 (Ricky Hanlon, con revisión de Dan Abramov, Matt Carroll, Jack Pope y Joe Savona).
3. **Ubicación.** Secciones `<Activity />`, `useEffectEvent`, `cacheSignal`, Performance Tracks, Partial Pre-rendering, Batching Suspense Boundaries for SSR, eslint-plugin-react-hooks v6, cambio de prefijo de `useId`.
4. **Resultado.** Reglas para componer secciones ocultables, efectos de animación estables y análisis de rendimiento.
5. **Explicación técnica [artículo].**
   - **`<Activity mode="visible" | "hidden">`** sustituye a `{visible && <Page />}`. `hidden`: oculta los hijos, **desmonta sus efectos** y aplaza sus actualizaciones; el **estado se conserva** (p. ej. campos de formulario) y el contenido oculto puede prerenderizarse en segundo plano.
   - **`useEffectEvent`**: separa la parte "evento" de un efecto; lo que se lee dentro no es dependencia y siempre ve las props/estado actuales. Reglas: no ponerlo en el array de dependencias; declararlo en el mismo componente/Hook que el efecto; no usarlo para silenciar el *linter*.
   - **`cacheSignal()`** (solo Server Components): `AbortSignal` que termina con la vida de `cache()` → abortar `fetch` que ya no se usará.
   - **Performance Tracks** en DevTools de Chrome: *Scheduler ⚛* (prioridades: *blocking*, *transition*, espera de pintado) y *Components ⚛*.
   - **SSR:** React agrupa durante un tiempo corto la revelación de límites Suspense del servidor, pero **deja de agrupar si la carga se acerca a 2,5 s** (umbral "bueno" de LCP); prepara `<ViewTransition>` en SSR.
   - **Prerenderizado parcial** en `react-dom`: `prerender` devuelve `postponed`; `resume`, `resumeAndPrerender` (y variantes para *streams* de Node).
   - **`useId`** usa ahora el prefijo `_r_`, válido en `view-transition-name` (CSS-002).
   - **eslint-plugin-react-hooks v6:** `recommended` en *flat config*; reglas del React Compiler opcionales; `recommended-legacy` para la configuración antigua.
6. **Dependencias.** React 19.2; GSAP + `@gsap/react` (GS-001) para el caso animado.
7. **Procedimiento con GSAP (adaptación; inferencias a partir del artículo, no ejecutadas).**
   1. **Secciones dentro de `<Activity hidden>`**: como los efectos se desmontan, `useGSAP`/`gsap.context()` se **revierten** al ocultar y se recrean al mostrar → las animaciones vuelven a empezar (no "pausan"); si se quiere conservar el punto, guardar el progreso en estado (el estado sí se conserva) y aplicarlo al recrear.
   2. **ScrollTrigger** en contenido oculto: tras volver a `visible`, `ScrollTrigger.refresh()` (cambió el layout, ST-004 fila 7).
   3. **`useEffectEvent`** para leer valores que no deben reiniciar la animación (tema claro/oscuro, idioma, un *callback* de analítica al terminar) desde un efecto que crea el timeline solo al montar.
   4. **Diagnóstico de INP** (PERF-002) con las pistas *Scheduler ⚛* y *Components ⚛*.
8. **Parámetros.** `mode` de Activity; dependencias de los efectos.
9. **Código (adaptación; no ejecutada):**
   ```jsx
   const onFin = useEffectEvent(() => track('hero_visto', { tema }));   // lee `tema` actual sin ser dependencia
   useGSAP(() => { gsap.timeline({ onComplete: onFin }).from('.titular', { y: 40, autoAlpha: 0 }); }, { scope: ref });
   <Activity mode={pestaña === 'galeria' ? 'visible' : 'hidden'}><Galeria /></Activity>
   ```
   (Compatibilidad de un Effect Event usado como *callback* de GSAP dentro de `useGSAP`: **sin verificar**; el artículo solo muestra su uso desde `useEffect`.)
10. **Errores habituales.** Esperar que `hidden` pause las animaciones (desmonta efectos); meter Effect Events en dependencias; usar `useEffectEvent` para todo; olvidar `refresh()` tras mostrar contenido.
11. **Rendimiento / a11y.** `Activity` permite prerenderizar la siguiente sección probable; el contenido oculto no debe ser enfocable (comprobar con teclado — no tratado en el artículo).
12. **Compatibilidad.** React 19.2+.
13. **Aplicaciones.** Pestañas de servicios/galería, pasos de un formulario de reserva que conservan lo escrito, paneles que se precargan.
14. **Pruebas.** Ocultar/mostrar una sección con timeline (contar instancias de ScrollTrigger: no deben duplicarse); conservar campos al volver a un paso; pistas de rendimiento en DevTools.
15. **Estado.** Artículo oficial leído; integración con GSAP = inferencia sin ejecutar.
