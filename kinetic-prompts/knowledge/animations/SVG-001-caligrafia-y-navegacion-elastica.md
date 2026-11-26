---
id: SVG-001
titulo: Animación de caligrafía con máscaras por tramos (DrawSVG) y navegación "elástica" en SVG (Motion Tricks)
categoria: animations
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Motion Tricks, Craig Roblewsky, 2020)
versiones: GSAP 3 + DrawSVGPlugin (gratuito), Adobe Illustrator para preparar el arte
perfil: ambos
ultima_revision: 2026-10-26
---

# SVG-001 · Motion Tricks

1. **Finalidad.** (A) Firma o logotipo caligráfico que "se escribe" de forma creíble; (B) indicador de menú que se estira hacia el elemento pulsado (temas 2, 8 y 10).
2. **Fuentes.** Craig Roblewsky (Motion Tricks; en CodePen y foros de GSAP como "PointC"): https://www.motiontricks.com/svg-calligraphy-handwriting-animation/ (04-08-2020) y https://www.motiontricks.com/svg-stretchy-navigation/ (01-07-2020, mod. 14-07-2020). Demos en CodePen (p. ej. `PointC/pen/e1ffdd8fa02dda9fe187f7131096eefc`, `PointC/pen/e6989203a7ade04dd717735fadf16085`) **no leídas** en este lote.
3. **(A) Caligrafía — por qué por tramos [artículo].** El trazo caligráfico cambia de grosor y se solapa consigo mismo: una sola máscara ancha descubre partes antes de tiempo. Solución: dividir la letra en piezas, cada una con su propia máscara.
4. **(A) Preparación del arte [artículo].**
   1. Pasar el texto a contornos y dividir la letra en tramos (cuchillo, tijeras, Shape Builder o Pathfinder).
   2. Por tramo, un trazado **abierto** con la pluma por el centro, en el **sentido de escritura**, con grosor que cubra la parte más gruesa.
   3. Solapar las máscaras vecinas 1–2 px (evita costuras y parpadeo).
   4. Duplicar la máscara, "Contornear trazo" e intersecar con la pieza para obtener la pieza cerrada; limpiar restos finos y cerrar puntos.
   5. Exportar; máscaras en `<defs>` con clase común (`strokeMask`) y **trazo blanco**; pieza y máscara emparejadas por clase (`part1`…).
5. **(A) Animación [artículo].**
   - `gsap.set(".strokeMask", { drawSVG: 0 })`; timeline `defaults: { ease: "none" }`, `repeat: -1`, `repeatDelay: 1`.
   - **Duración proporcional a la longitud:** medir cada máscara (`getLength()`) y asignar a cada tramo su fracción de una duración total (1,6 s en el ejemplo); tramo 1: 0,75 s `sine.inOut`; tramo 2: ~31 % `sine.in`, solapado −0,25 s; tramo 3: ~36 % **lineal**; tramo 4: ~33 % `sine`.
   - El tramo central lineal hace que tres piezas conectadas se lean como un trazo continuo (cualquier ease ahí "tartamudea").
   - Opcional: girar pieza **y** máscara juntas con `svgOrigin`, duración larga y `elastic.out` al final.
6. **(B) Navegación elástica [artículo].**
   - Un `rect` indicador y 6 destinos con fondo transparente; posiciones de los bordes izquierdos **escritas a mano** (20, 120…, cada 100 u.) en lugar de `getBBox()`, porque el diseño se hizo con guías.
   - Guardas: si se pulsa el activo, salir; si hay animación en curso, saltar su timeline al final (evita solapes).
   - Duración según distancia: `mapRange(100, 500, 0.5, 1)` × duración base.
   - Izquierda→derecha: ensanchar a distancia + 60 y luego mover `x` y volver a 60 de ancho; derecha→izquierda: mover y ensanchar a la vez y luego volver a 60.
   - "Aplastado": tween paralelo de altura/`y` con `yoyo` y `repeat: 1`.
   - Eases: `back.in(2)` para estirar y `back` (= `back.out`) para el pequeño rebote final.
7. **Procedimiento profesional (adaptación).**
   - (A) Firma de una barbería/estudio en el hero: reproducir una vez (no `repeat: -1` salvo decorado pausable), `aria-label` con el texto en el `<svg role="img">`, reduced motion → mostrar el estado final.
   - (B) Sustituir posiciones fijas por medidas reales al redimensionar si el menú no está en un SVG de tamaño fijo; los destinos deben ser `<a>`/`<button>` accesibles, no grupos SVG clicables.
8. **Parámetros.** §5–§6.
9. **Código.** No incluido (sin licencia explícita en los artículos; los pens de CodePen serían MIT, pendiente de leerlos).
10. **Problemas habituales [artículo].** Revelados prematuros; costuras sin solape; restos de Pathfinder; máscara sin trazo blanco; preparar el arte es lo que más tiempo lleva.
11–13. **Aplicaciones.** Firma/logotipo animado, rótulo "hecho a mano", menú de pestañas con indicador.
14. **Pruebas.** Revisar a 0,25× de velocidad (costuras); lector (nombre accesible); teclado en el menú; reduced motion.
15. **Estado.** Artículos leídos; pens pendientes; no implementado.
