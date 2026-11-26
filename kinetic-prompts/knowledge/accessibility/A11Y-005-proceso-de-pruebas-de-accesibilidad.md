---
id: A11Y-005
titulo: Proceso de comprobación de accesibilidad antes de entregar (enlace de salto, regiones, errores anunciados, lectores de pantalla, errores ARIA típicos)
categoria: accessibility
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (freeCodeCamp, Kunal Nalawade, "The Web Accessibility Handbook", 18-03-2025, mod. 24-03-2025)
versiones: —
perfil: ambos
ultima_revision: 2026-10-26
---

# A11Y-005 · Checklist de pruebas

1. **Finalidad.** Convertir las fichas de accesibilidad (A11Y-001…004) en un procedimiento de revisión repetible.
2. **Fuente.** https://www.freecodecamp.org/news/the-web-accessibility-handbook/ .
3. **Estructura [artículo].** Enlace "Saltar al contenido" como primer elemento enfocable, apuntando al `id` de `<main>`; regiones `<header> <nav> <main> <footer>` (o `role` si no hay elemento semántico); encabezados reales en orden.
4. **Formularios [artículo].** Etiqueta visible en todos los campos (algunos lectores ignoran el `placeholder`); contenedor de errores con `role="alert"` (se anuncia sin mover el foco); obligatorios marcados también para el lector, no solo con asterisco; `aria-labelledby` no da "clic en la etiqueta enfoca el campo" (preferir `<label for>`). [Nota propia: con el atributo nativo `required` el lector ya anuncia "obligatorio"; `aria-required` solo hace falta en controles personalizados.]
5. **Contenido dinámico [artículo].** `aria-live="polite"` (espera) o `"assertive"` (interrumpe) y `aria-atomic="true"` para leer el bloque completo; `aria-relevant` para elegir qué cambios se anuncian.
6. **Proceso de prueba [artículo].**
   1. Lighthouse (pestaña de accesibilidad) — en el ejemplo del autor la nota pasó de 74 a 100 corrigiendo `alt` ausentes, campos sin etiqueta y `tabindex` positivos. **Una nota de 100 no garantiza accesibilidad**: seguir con pruebas manuales.
   2. DevTools → Rendering: emular reduced motion, deficiencias de visión y contraste.
   3. Contraste ≥ 4,5:1 (AA) para texto normal (A11Y-003).
   4. Teclado en todo el sitio.
   5. Lectores: VoiceOver (⌘+F5) en Mac, Narrador (Ctrl+Win+Enter) en Windows; probar formularios, botones, enlaces y actualizaciones dinámicas.
   6. En React: `eslint-plugin-jsx-a11y`.
7. **Errores ARIA frecuentes [artículo].** ARIA donde bastaba HTML; `div role="button"` sin `tabindex="0"` ni teclado; `tabindex` > 0; enlaces `href="#"`/`javascript:void(0)` que actúan como botones.
8. **Procedimiento de la biblioteca [síntesis].** Orden recomendado en cada entrega: (1) lint a11y; (2) Lighthouse; (3) teclado completo (incluidos menú MENU-001, modales A11Y-004, carruseles); (4) lector en móvil y escritorio; (5) reduced motion y zoom 200 %; (6) Playwright con `getByRole` (TEST-001) como regresión. Registrar resultados en el informe de entrega (CLIENT-001).
9. **Contraejemplo de tutorial [freeCodeCamp, Paul Akinyemi, 12-04-2022, "How to Build an Animated Landing Page with GSAP and TailwindCSS"; demo y repo `Morgenstern2573/gsap-landing-article` no abiertos].** Según el artículo: animaciones de entrada con `gsap.timeline({ defaults })`, posición `"<"` y `matchMedia` evaluado una sola vez al cargar; `body` con `overflow-hidden` + `h-screen`, sin reduced motion, `delay` pasado a `gsap.set()` (sin efecto). Útil como lista de lo que no hay que hacer.
10–14. Ver §6 y §8.
15. **Estado.** Artículos leídos; procedimiento no aplicado aún a un proyecto.
