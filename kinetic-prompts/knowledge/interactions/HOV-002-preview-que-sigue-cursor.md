---
id: HOV-002
titulo: Lista de proyectos con vista previa que sigue al cursor
categoria: interactions
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-003 Projects; variante simple en TUT-002 Projects)
versiones: fuente — gsap ^3.12.2 + framer-motion ^10.13.0
perfil: ambos
ultima_revision: 2026-10-26
---

# HOV-002 · Preview flotante en listas

1. **Nombre y finalidad.** Al pasar por una fila de una lista de proyectos aparece una miniatura flotante (más un círculo "View") que sigue al cursor con retraso (tema 10).
2. **Fuente.** `olivierlarose/awwwards-landing-page`, `src/components/Projects/index.jsx` y `components/project/index.jsx` (TUT-003). Variante sin seguimiento: `olivierlarose/smooth-scroll`, `Projects` (TUT-002).
3. **Ubicación.** Projects/index.jsx (≈110 líneas).
4. **Resultado.** Ventana con todas las miniaturas apiladas en vertical; solo se ve la de la fila activa (desplazamiento `top: índice × −100%`). Tres capas (ventana, círculo, etiqueta) con duraciones distintas (0,8 / 0,5 / 0,45 s) dan sensación de "arrastre".
5. **Explicación técnica.** Seis `quickTo` (x/y por capa) llamados desde `mousemove` del contenedor; aparición/desaparición con variantes de framer-motion (escala 0↔1).
6. **Dependencias.** gsap (quickTo), framer-motion (opcional: puede hacerse todo con GSAP).
7. **Procedimiento (adaptación).** quickTo sobre `x`/`y` (no `left`/`top`), posición `fixed` con `pointer-events: none`; filas como enlaces reales; en táctil, mostrar la miniatura dentro de la fila.
8. **Parámetros.** Duraciones por capa, ease (`power3`), tamaño de ventana.
9. **Código.** Sin fragmento de la fuente (sin licencia). Ver patrón quickTo en HOV-001.
10. **Problemas habituales (vistos).** quickTo sobre propiedades de layout; filas `div` sin enlace ni foco; miniaturas con `alt="image"`; la miniatura tapa el texto en pantallas estrechas.
11. **Rendimiento / a11y.** Cargar miniaturas con `loading="lazy"` y tamaños adecuados; la información no debe depender del hover.
12. **Compatibilidad.** Universal; desactivar en `(hover: none)`.
13. **Aplicaciones.** Portfolio de un estudio, listado de tratamientos con foto, casos de un despacho.
14. **Pruebas.** Ratón rápido entre filas, salida por el borde, scroll con la preview abierta, teclado, táctil.
15. **Estado de evidencia.** Código leído, no ejecutado.
