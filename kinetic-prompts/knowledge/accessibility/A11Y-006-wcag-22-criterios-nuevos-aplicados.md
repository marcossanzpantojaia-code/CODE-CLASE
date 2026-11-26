---
id: A11Y-006
titulo: WCAG 2.2 — los criterios nuevos y dónde chocan con las técnicas de la biblioteca (cabeceras fijas, arrastre, objetivos, ayuda, reintroducir datos, autenticación)
categoria: accessibility
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (W3C WAI, "What's New in WCAG 2.2")
versiones: WCAG 2.2
perfil: ambos
ultima_revision: 2026-10-27
---

# A11Y-006 · WCAG 2.2 aplicado

1. **Finalidad.** Revisar las fichas de animación e interacción contra los criterios añadidos en WCAG 2.2 (A11Y-003 ya cubre 2.5.8).
2. **Fuente.** https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ .
3. **Criterios nuevos [W3C] → impacto en la biblioteca [síntesis].**
   | Criterio | Nivel | Requisito | Dónde aplica |
   |---|---|---|---|
   | 2.4.11 Foco no oculto (mínimo) | AA | El elemento enfocado debe verse al menos en parte, no tapado por contenido del autor (banners o cabeceras fijas) | Cabeceras fijas/"píldora" (ASTRO-003, UX-004), banner de cookies (LEGAL-001), botón flotante de reserva → `scroll-padding-top` igual a la altura de la cabecera [técnica general] |
   | 2.4.12 Foco no oculto (mejorado) | AAA | Totalmente visible | Objetivo deseable en comerciales |
   | 2.4.13 Apariencia del foco | AAA | Indicador ≥ 2 px CSS alrededor y contraste 3:1 con el estado sin foco | Estilos `:focus-visible` (A11Y-004), botones neón (CSS-006) |
   | 2.5.7 Movimientos de arrastre | AA | Alternativa de puntero simple (p. ej. botones) para toda acción por arrastre | "Desliza para confirmar" (BTN-001), galería que se arrastra (DRAG-001), cristal arrastrable (TSL-002), gestos (OBS-001/002) |
   | 2.5.8 Tamaño del objetivo (mínimo) | AA | ≥ 24×24 px CSS o espaciado equivalente | A11Y-003 |
   | 3.2.6 Ayuda coherente | A | Los mecanismos de ayuda repetidos (teléfono, chat, FAQ) en el mismo orden relativo en todas las páginas | Pie y cabecera de webs comerciales (UX-002) |
   | 3.3.7 Entrada redundante | A | No pedir de nuevo datos ya introducidos en el mismo proceso: autocompletar o permitir seleccionarlos | Formularios en pasos y reservas (UX-003, FORM-001) |
   | 3.3.8 Autenticación accesible (mínimo) | AA | No exigir pruebas cognitivas (recordar contraseñas, puzzles) para iniciar sesión sin alternativa o ayuda | Áreas privadas (NEXT-002): permitir gestores de contraseñas y pegar; enlaces mágicos/passkeys como alternativa [técnica general] |
   | 3.3.9 Autenticación accesible (mejorado) | AAA | Tampoco reconocimiento de objetos ni contenido aportado por el usuario | — |
   **Eliminado:** 4.1.1 Procesamiento (obsoleto).
4. **Procedimiento.** Añadir estas comprobaciones al checklist de A11Y-005: (1) tabular por la página con la cabecera fija y el banner visibles; (2) para cada gesto de arrastre, localizar su alternativa de clic/teclado; (3) medir objetivos táctiles; (4) comparar el orden de la ayuda entre páginas; (5) recorrer formularios multipaso buscando datos repetidos; (6) iniciar sesión pegando la contraseña desde un gestor.
5–13. **Aplicaciones.** Todas las webs; especialmente las fichas de interacción del perfil B.
14. **Pruebas.** Teclado con cabecera fija; ratón sin arrastrar (solo clics); zoom 200 %; lector.
15. **Estado.** Fuente oficial leída; impacto = síntesis propia.
