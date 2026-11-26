---
id: ST-004
titulo: Errores frecuentes de ScrollTrigger y sus soluciones (checklist de depuración)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (artículo completo leído)
versiones: GSAP 3.15
perfil: ambos
ultima_revision: 2026-10-27
---

# ST-004 · Errores frecuentes de ScrollTrigger

1. **Finalidad.** Checklist de diagnóstico para Claude Code cuando una animación de scroll falla, salta o se desalinea.
2. **Fuente.** GreenSock, "ScrollTrigger tips & mistakes": https://gsap.com/resources/st-mistakes — 11 secciones, cada una con demo en CodePen (demos no inspeccionadas).
3. **Ubicación.** Secciones del artículo citadas abajo entre comillas por su título.
4. **Resultado.** Diagnóstico sistemático en lugar de prueba y error.
5. **Explicación técnica y soluciones (paráfrasis del artículo):**

| Síntoma | Causa | Solución documentada |
|---|---|---|
| Animación de una timeline no responde bien al scroll | ScrollTriggers en tweens **hijos** de una timeline: la timeline padre y el scroll compiten por el playhead | Un solo ScrollTrigger en la timeline padre, o tweens independientes |
| El elemento vuelve a su valor inicial entre dos tramos | Varios `to()` sobre la misma propiedad: los valores iniciales se **cachean al crear** el ScrollTrigger | `immediateRender: false`, `fromTo()` en los posteriores o una sola timeline |
| Todas las secciones se animan a la vez | Un único tween para muchos elementos | Bucle: una animación + un ScrollTrigger por sección |
| Valores incorrectos tras resize | `end`/`start` calculados una sola vez | Valores basados en función y `invalidateOnRefresh: true` |
| Quiero arrancar a media pantalla pero resetear fuera de pantalla | Un solo trigger no tiene dos zonas | Dos ScrollTriggers: uno para reproducir y otro para resetear |
| Animaciones que se disparan antes de tiempo bajo un pin | Triggers creados fuera de orden | Crear en orden de página o `refreshPriority` |
| Posiciones mal tras cargar imágenes/contenido | Layout cambia tras el cálculo | `ScrollTrigger.refresh()` tras la carga; imágenes con width/height |
| El scrub salta al cargar | `start` antes del scroll 0 (p. ej. `"top bottom"` en el hero) | Ajustar `start` o usar `clamp()` (≥ 3.12) |
| Markers descolocados al redimensionar | `scroll-behavior: smooth` en html (Bootstrap 5 lo trae) | `html { scroll-behavior: auto !important; }` |
| El scrub "dura poco" | La duración se ajusta siempre a start→end | Alargar `end` (p. ej. `"+=600"`) |
| Falla al volver a una página en una SPA | Los ScrollTriggers no se destruyen/recrean | Matar en el desmontaje y recrear al montar; `refresh()` si solo cambian medidas |

   **Consejo de depuración oficial:** hacer funcionar la animación **sin** ScrollTrigger primero y conectar el scroll al final.
6. **Dependencias.** gsap + ScrollTrigger.
7. **Procedimiento.** Ante un fallo, recorrer la tabla en orden antes de modificar código.
8. **Parámetros.** `immediateRender`, `invalidateOnRefresh`, `refreshPriority`, `clamp()`.
9. **Código.** No se reproduce; las soluciones están en la tabla. Ver demos oficiales enlazadas en el artículo.
10. **Problemas habituales.** La propia tabla.
11. **Rendimiento / a11y.** Relacionado: `scroll-behavior: smooth` también afecta a Lenis (LN-001).
12. **Compatibilidad.** General.
13. **Aplicaciones.** Base de la Skill `web-qa-validation`.
14. **Pruebas.** Cada fila de la tabla es un caso de prueba reproducible.
15. **Evidencia.** Artículo oficial leído íntegro. Las demos de CodePen no se han inspeccionado.

## Lote 13 · Relectura y procedimiento de revisión de código
- **Vigencia [doc, 2026-10-27]:** la página (docs v3.15, sin fecha visible) mantiene los mismos 11 apartados; la tabla sigue siendo válida.
- **Revisión estática antes de dar por buena una animación con scroll (adaptación):** (1) buscar `scrollTrigger:` dentro de tweens añadidos a timelines; (2) la misma propiedad/objetivo en varios triggers; (3) `offsetHeight`/`innerHeight` fuera de funciones en `start/end`; (4) orden de creación de los pins; (5) imágenes sin `width/height`; (6) `scroll-behavior: smooth` en el CSS global; (7) limpieza al desmontar.
- **Matiz a la fila SPA [criterio propio]:** limpiar con `gsap.context()`/`useGSAP` (GS-001), no con `ScrollTrigger.getAll().forEach(t => t.kill())`, que mata también los triggers de otros componentes (visto en el repo de TUT-042, CAM-001).
- Móvil y `normalizeScroll()`: [ST-006](ST-006-normalizescroll-y-movil.md).

**Lote 15 — `refreshPriority`:** la Skill oficial `gsap-scrolltrigger` (gsap-skills, commit aed9cfd) dice "Lower = refreshed first"; la documentación de ScrollTrigger dice lo contrario ("`refreshPriority: 1` will get refreshed earlier than one with `refreshPriority: 0`"). Esta ficha sigue la documentación (**mayor = antes**). Detalle y otras discrepancias en [GS-004](../gsap/GS-004-contraste-skills-oficiales-greensock.md).
