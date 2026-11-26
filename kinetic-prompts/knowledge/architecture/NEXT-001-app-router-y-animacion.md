---
id: NEXT-001
titulo: Arquitectura Next.js App Router para webs animadas (Server/Client Components, límites 'use client', template.js)
categoria: architecture
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (nextjs.org: server-and-client-components, act. 2026-10-05; template.js, act. 2026-03-05)
versiones: Next.js App Router (docs vigentes, oct-2026); `template` desde v13.0.0
perfil: ambos
ultima_revision: 2026-10-26
---

# NEXT-001 · App Router + animación

1. **Finalidad.** Estructurar una web profesional en Next.js para que el contenido se sirva como HTML del servidor (SEO, LCP) y solo las islas interactivas (GSAP, Lenis, R3F) envíen JavaScript.
2. **Fuente.** nextjs.org/docs/app/getting-started/server-and-client-components y /docs/app/api-reference/file-conventions/template.
3. **Reglas oficiales.**
   - Layouts y pages son **Server Components** por defecto. Client Components para estado, eventos, efectos (`useEffect`), APIs del navegador y hooks propios.
   - `"use client"` declara una **frontera**: todo lo que ese archivo importa y renderiza directamente entra en el bundle de cliente. No afecta a Server Components pasados como `children`/props (se renderizan en el servidor).
   - Para reducir JS, poner `"use client"` en los componentes interactivos concretos, no en layouts grandes.
   - Props de servidor → cliente deben ser **serializables**.
   - Context: crear un Client Component proveedor que reciba `children`, y colocarlo **lo más profundo posible**.
   - Librerías de terceros sin `"use client"` → envolverlas en un archivo propio con la directiva.
   - `server-only` / `client-only` para evitar fugas de código o secretos; solo las variables `NEXT_PUBLIC_` llegan al cliente.
   - **`template.js`**: como un layout pero con clave única por segmento → se **remonta** al navegar (estado y DOM recreados, efectos re-ejecutados); los layouts persisten. Útil para animaciones de entrada por página. Las navegaciones en segmentos más profundos no remontan templates superiores; los search params no remontan.
4. **Patrón propuesto para la biblioteca (adaptación).**
   - `app/layout.tsx` (servidor): HTML semántico, fuentes, metadatos.
   - `app/providers.tsx` (`"use client"`): Lenis + sincronización con ScrollTrigger (LN-001), `gsap.registerPlugin` una vez, `gsap.matchMedia` global de reduced motion (A11Y-001). Envuelve solo `{children}`.
   - Secciones de contenido (servidor) con "islas" cliente: `<RevealText>`, `<MagneticButton>`, `<HeroCanvas>` (R3F cargado con `next/dynamic` y `ssr: false` tras el primer pintado; verificar API en la versión del proyecto).
   - Entrada por página: `template.tsx` cliente con `useGSAP` (GS-001); salidas entre páginas: View Transitions (CSS-002) o una librería; Next tiene soporte experimental de View Transitions (no verificado en este lote).
5. **Explicación.** Las animaciones necesitan el DOM ya hidratado; el contenido no. Separar ambos mantiene el LCP en el HTML (PERF-001).
6. **Dependencias.** next, react; gsap/@gsap/react, lenis, @react-three/fiber según el caso.
7. **Procedimiento.** Ver §4.
8. **Parámetros.** Profundidad de los proveedores, qué componentes son islas.
9. **Código.** Ejemplos de la doc oficial resumidos en §3 (no copiados).
10. **Problemas habituales.** `"use client"` en el layout raíz (todo a cliente); leer `window` en el render inicial (TUT-005); inicializar Lenis en una página y no en el proveedor (instancias duplicadas, TUT-001/011); animar en `layout` esperando que se re-ejecute al navegar (no lo hace: usar `template`).
11. **Accesibilidad.** Contenido completo sin JS; foco gestionado tras navegación.
12. **Compatibilidad.** Requiere App Router.
13. **Aplicaciones.** Webs comerciales y cinematográficas con Next.js.
14. **Pruebas.** Build de producción; tamaño de bundle por ruta; JS desactivado (contenido visible); navegación entre páginas (sin instancias duplicadas de Lenis/ScrollTrigger).
15. **Estado de evidencia.** Docs leídas. Patrón del §4 = propuesta propia, sin probar.
