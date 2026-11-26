---
id: CSS-004
titulo: Container queries — componentes que se adaptan a su contenedor
categoria: css
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (MDN "CSS container queries")
versiones: CSS Containment Level 3
perfil: ambos
ultima_revision: 2026-10-26
---

# CSS-004 · Container queries

1. **Finalidad.** Que una tarjeta, testimonio o bloque de precios cambie de diseño según **el espacio que tiene** (sidebar, rejilla, ancho completo), no según la pantalla.
2. **Fuente.** developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries.
3. **API (docs).** `container-type: inline-size` (lo habitual: solo ancho), `size` (ancho y alto) o `normal` (no es contenedor de tamaño, pero sirve para consultas por nombre y de estilo); `container-name`; atajo `container: nombre / inline-size`. Consulta: `@container (width > 700px) { … }` o `@container nombre (…)`; consultas solo por nombre. Unidades `cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, `cqmax` (si no hay contenedor, equivalen a unidades `sv*`). Consultas de estilo con `container-type: normal` (guía aparte, no analizada).
4. **Cuándo usar (docs).** Media queries para el layout de página (navegación, rejilla general); container queries para componentes reutilizables.
5. **Explicación.** El contenedor aplica *containment* de tamaño en su eje, por eso su tamaño no puede depender de sus hijos en ese eje.
6. **Dependencias.** Ninguna.
7. **Procedimiento para Claude Code.** Envolver cada componente reutilizable en un contenedor `inline-size`; diseñar el componente de móvil a ancho y subir con `@container`; tipografía interna fluida con `clamp(…, … + 2cqi, …)`; fallback con Grid/Flex + media query (ejemplo de MDN).
8. **Parámetros.** Puntos de ruptura del componente (p. ej. 400 px, 700 px), unidades cq.
9. **Código (estructura de la doc):** `.card-wrap { container: card / inline-size; } @container card (width > 480px) { .card { grid-template-columns: 1fr 2fr; } }`
10. **Errores habituales.** Poner `container-type: size` sin altura definida (el contenedor colapsa); consultar el propio elemento que es contenedor (se consulta a un **ancestro**); olvidar el fallback.
11. **Rendimiento / a11y.** Sin coste relevante; el orden del DOM no cambia.
12. **Compatibilidad.** La página consultada no muestra la tabla de soporte en el texto extraído: **verificar en MDN/caniuse** antes de depender de ello (consultas de estilo con soporte más limitado).
13. **Aplicaciones.** Tarjetas de servicio/equipo/precios que aparecen en distintas columnas.
14. **Pruebas.** Mismo componente en contenedores de 300/600/900 px; navegador sin soporte (fallback).
15. **Estado de evidencia.** Docs leídas. Soporte de navegadores sin verificar en este lote.
