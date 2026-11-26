---
id: A11Y-003
titulo: Contraste de color (1.4.3, 1.4.11) y tamaño mínimo de objetivos táctiles (2.5.8)
categoria: accessibility
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (W3C Understanding WCAG 2.2: Contrast (Minimum); Target Size (Minimum))
versiones: WCAG 2.2
perfil: ambos (AA = mínimo profesional)
ultima_revision: 2026-10-27
---

# A11Y-003 · Contraste y objetivos

1. **Finalidad.** Dos criterios AA que fallan a menudo en diseños "premium" oscuros y minimalistas.
2. **Fuentes.** w3.org/WAI/WCAG22/Understanding/contrast-minimum.html · …/target-size-minimum.html.
3. **1.4.3 Contraste mínimo (AA).** Texto normal **4,5:1**; texto grande **3:1** (grande = ≥ 18 pt ≈ 24 px, o ≥ 14 pt ≈ 18,5 px en negrita). Sin redondeo (4,499:1 no cumple). Se mide contra el fondo real; si se define color de texto sin fondo (o al revés) es fallo. Incluye placeholders y textos de hover/foco. Fondos con imagen: deben dar contraste suficiente (fallo F83). Excepciones: controles inactivos, texto decorativo o invisible, texto incidental en fotografías, logotipos. Fuentes finas pueden necesitar más contraste.
4. **1.4.11 Contraste no textual.** Iconos, gráficos y componentes de interfaz: 3:1 (citado desde 1.4.3).
5. **2.5.8 Tamaño de objetivo (AA).** Objetivos de al menos **24×24 px CSS**; si son menores, deben tener espacio: un círculo de 24 px centrado en cada uno no debe cortar a otros objetivos. Excepciones: enlaces en línea dentro de texto, control equivalente que cumple, controles nativos sin estilo propio, tamaño esencial (p. ej. chinchetas de un mapa).
6. **Aplicación a la biblioteca (análisis propio).** TXT-002 A empieza con texto al 20 % de opacidad → durante la animación hay texto por debajo de 4,5:1 (la mitad del párrafo, hasta que se hace scroll): aceptable solo si el estado final cumple y el contenido no depende de leerse en ese estado; HOV-004 usa subtítulos al 50 % de blanco sobre gris muy oscuro (comprobar ratio); textos sobre vídeo/imagen (VID-001, ZOOM-001) necesitan capa de contraste; iconos de navegación pequeños en menús animados → 24 px.
7. **Procedimiento.** Definir la paleta con pares texto/fondo verificados (≥ 4,5:1), añadir velo o sombra en textos sobre imagen, botones y enlaces de navegación ≥ 44 px de alto en móvil (convención habitual, no exigida por 2.5.8 que pide 24 px).
8–9. n/a.
10. **Errores habituales.** Gris claro sobre blanco "elegante"; texto blanco sobre fotos sin velo; iconos de 16 px pegados entre sí.
11–12. n/a.
13. **Aplicaciones.** Todas.
14. **Pruebas.** Comprobador de contraste en DevTools; inspección de tamaños de objetivos en móvil.
15. **Estado de evidencia.** Docs W3C leídas (resumen). §6–7 = análisis propio.

## Lote 18 · Texto sobre degradados o imágenes — `DOCUMENTACION_OFICIAL_ANALIZADA` (W3C, Understanding 1.4.3)
- El contraste se mide "with respect to the specified background over which the text is rendered in normal usage"; si no hay fondo especificado se supone blanco. **Fallo F83:** imágenes de fondo sin contraste suficiente con el texto. Texto grande = 18 pt o 14 pt en negrita (≈ 24 px / 18,66 px); los logotipos y el texto decorativo o inactivo están exentos (un logotipo presentado a propósito con poco contraste **no** lo está).
- La página **no** dice cómo medir un degradado → [criterio propio] medir contra el punto **menos favorable** del degradado o de la imagen bajo el texto, o añadir una capa sólida/semitransparente que garantice el contraste.
- **Lección del prototipo n.º 1:** Claude Code eligió los colores "a ojo" sin leer esta ficha; el script de medición encontró 24 pares correctos y **8 sin poder medir** (texto sobre degradado, incluido el `h1`) → elegir la paleta leyendo esta ficha y **medir** antes de entregar.

## Lote 19 · Medición de textos sobre degradado/arte — ver TEST-003
- Herramienta `integration/tools/contraste_compuesto.mjs` (muestreo de píxeles del fondo real con el texto oculto; criterio p10 ≥ mínimo). Primera ejecución: tanto A1 como B1 tienen **2 textos pequeños del héroe por debajo de 4,5:1 en móvil** (p10 3,6–4,2) por el poste de barbero detrás del texto; a 1440 px cumplen. Regla práctica: en móvil, o el arte se aparta del texto, o se añade una capa sólida/velo bajo el texto, o se sube el color del texto secundario.
