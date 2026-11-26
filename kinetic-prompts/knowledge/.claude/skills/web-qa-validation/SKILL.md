---
name: web-qa-validation
description: Runs technical and visual validation of a website or of a single library technique before declaring it done, and decides whether a technique card can be promoted to IMPLEMENTADO or VALIDADO. Use at the end of any web build, after adding animations or 3D, or when the user asks to test, audit, verify or fix a page.
---

# Validación técnica y visual

Estado: PROPUESTO (no probado: registrada en la sesión de la prueba n.º 2 del 2026-10-27, pero no invocada). Revisada en el lote 14 (v0.14.1): rutas resueltas con `${CLAUDE_SKILL_DIR}` y comprobadas con `integration/tools/library_check.py`.

## Raíz de la biblioteca (LIB) — resolver antes de nada
- **LIB = `${CLAUDE_SKILL_DIR}/../../..`** cuando esta Skill se carga desde `<biblioteca>/.claude/skills/<skill>/` (modo recomendado: `claude --add-dir <ruta de la biblioteca>`; Claude Code sustituye `${CLAUDE_SKILL_DIR}` por la carpeta real de esta Skill).
- Si la Skill se instaló copiándola fuera de la biblioteca, LIB es la ruta absoluta literal que figure en la línea `WEB_LIBRARY_ROOT=` del `CLAUDE.md` del proyecto (con barras `/`, sin `~`).
- **Comprobación obligatoria:** lee `LIB/KNOWLEDGE_INDEX.md` y anota su línea "Versión …". Si no existe, **detente** e informa de la ruta probada; no improvises con conocimiento propio.
- Todas las rutas de esta Skill son relativas a LIB.

## Comprobaciones mínimas

1. Consola sin errores; build de producción funcionando (plugins GSAP registrados).
2. Capturas en móvil, tablet y escritorio de cada sección; comparar con lo esperado.
3. Scroll rápido/lento, resize y rotación; recarga a mitad de página.
4. Teclado completo (Tab, espacio, AvPág) y foco visible.
5. `prefers-reduced-motion: reduce` emulado: contenido completo y legible.
6. Rendimiento: Core Web Vitals y, en 3D, `renderer.info` estable tras navegar.
7. Las pruebas específicas del campo 14 de cada ficha usada.
8. Guías de apoyo (rutas relativas a LIB): `accessibility/A11Y-005-proceso-de-pruebas-de-accesibilidad.md`, `testing/TEST-001-playwright-buenas-practicas.md`, `testing/CI-001-integracion-continua-github-actions.md`, `integration/tools/prueba_web_playwright.mjs` (pruebas automáticas genéricas: consola, recursos, desbordamiento, teclado, reduced motion, formulario, contraste, laboratorio), la comprobación de **cabecera en una fila a 320 y 375 px** (UX-004, lote 18) con `integration/tools/extra_generico.mjs` (también sin JS y vídeo; TEST-004), el **contraste sobre degradados y arte** con `integration/tools/contraste_compuesto.mjs` a 375 y 1440 px (criterio p10 ≥ mínimo; TEST-003), `testing/CI-002-lighthouse-ci.md`, `testing/TEST-002-regresion-visual-playwright.md`, `scrolltrigger/ST-004-errores-frecuentes.md`, `testing/DEPLOY-001-checklist-produccion-nextjs.md`, `performance/PERF-002-optimizar-inp.md`.
8b. Métrica de contenido oculto: usa `ocultos_con_contenido` (excluye decoración `aria-hidden`), no el recuento bruto (TEST-004, lote 19).
9. Entrega `CONSULTA_BIBLIOTECA.md` completo (plantilla en `integration/`), con artefactos de cada prueba.

## Criterios creativos obligatorios (lote 20)

- Si el encargo es **cinematográfico** (o un héroe premium), además de lo anterior aplica EVAL-001: **C1 fidelidad visual** (`integration/tools/composicion_captura.py` + capturas lado a lado), **C2 fidelidad de movimiento** (curvas valor/progreso con `integration/tools/curvas_scroll.mjs`, continuidad de la secuencia vía `window.__secuencia`, vídeo) y **C3 calidad creativa** (rúbrica humana).
- Las pruebas técnicas aprobadas **no** implican calidad creativa. Sin referencia o storyboard, C1/C2 quedan NO VERIFICADOS y la web no se aprueba como cinematográfica.
- Un **héroe premium animado** en una web comercial también debe superar C2.
- Los umbrales de C1 son **provisionales** (salen de una referencia de baja resolución, EVAL-001 §4).
- En los hitos A/B/C (`integration/PLAN_LOTE22_HITOS_ABC.md` §7): C1 con capturas reales lado a lado con el storyboard y referencias R1, sin ilustraciones genéricas donde el realismo sea esencial; C2 con registros reproducibles (comando, versión, JSON) y vídeo inspeccionable.
- **Hito A** (fotograma de producto): aplica la tabla de aceptación de EVAL-001 (apéndice del lote 23). Un objeto **no** se aprueba por haberse creado con Blender ni por compilar la escena.
- **Escenas por scroll:** mide la reversibilidad, los 5 estados, los tiempos de fotograma, el reduced motion y el vídeo con `integration/tools/medir_escena_scroll.mjs` (la página debe exponer `window.__estado` con el progreso y los valores clave), y revisa el **catálogo de fallos** de EVAL-001 (apéndice del lote 24).
- **Auditoría visual de escenas (lote 25):** ejecuta `node integration/tools/auditoria_visual_escena.mjs <url> <dir> '{"protagonista":"#sel","textos":["#t1"],"lienzo":"canvas"}' 1440` y a 375, y `python3 integration/tools/cortes_video.py <video>`; aplica la tabla «funciona pero mediocre» de EVAL-001 (apéndice del lote 25; detalle en `testing/AUD-001-*`). Con GSAP, ejecuta `node integration/tools/validar_gsap.mjs <url> <salida> 1440` y `375` y `python3 integration/tools/diferencias.py <salida>` (informa del % con cualquier diferencia y del % visible, sin tolerancias ocultas; compara motores con layouts de px enteros, GS-005 D7). Comprueba: `gsap.version` y las respuestas HTTP de `node_modules/gsap/dist/`, pin fijo en top 0, triggers constantes tras los resize, reduced motion en caliente (1→0→1), desmontaje sin estilos residuales y 0 cortes en los vídeos. Separa script, render (estilo/layout frente a pintado) y fluidez (fotogramas > 33 ms). Nunca declares probado GSAP si no se ejecutó.
- **Recursos de imagen (lote 27):**
  - Antes de C1, `python3 integration/tools/preparar_recursos.py inspeccionar <imagen>` o `preparar` con el contrato: ningún aviso de tamaño, luz, elevación o halo (|x| < 25 tras descontaminar).
  - En la auditoría, añade `"ocluyentes_img": ["#delante", "#heroe"]`: alfa real y solo las capas por delante del texto.
  - Comprueba que el titular no cruza paneles de bajo contraste.
  - Los fixtures rotulados nunca cuentan para C1 ni C3.
- **Técnicas del lote 28:**
  - con `expoScale`, comprueba el ritmo del zoom (log del área frente a la curva; `evidence/youtube/2026-11-03-lote28/fase4/prueba_flip_expo.mjs`) también **después de un resize**;
  - con `Flip.fit`, mide el error de alineación (≤ 2 px);
  - un filtro SVG de turbulencia o desplazamiento a pantalla completa debe medirse antes de aceptarlo (en el lote 28: p95 = 50 ms sin GPU).
- **Cambios de escena (lote 30, EDIT-001 §12)** con `evidence/youtube/2026-11-04-lote30/fase4/medir30.py` sobre la serie de `capturar30.mjs`:
  - 0 fotogramas de doble imagen (0,05 < opacidad < 0,95 con los nidos separados);
  - relevo a ±1 fotograma del pico de velocidad;
  - nidos ≤ 2 px en el relevo;
  - velocidad tras el relevo con el mismo signo (sin meseta);
  - 0 cortes;
  - con `scrub`, prueba también un desplazamiento **lento**: si el relevo se ve, la página no pasa.
- **Lote 31:**
  - el relevo se mide entre el último fotograma VISIBLE y el primero nuevo (salto ≤ 2 px; diferencia de píxeles ≤ 3× la mediana del movimiento): `evidence/demos/2026-11-04-lote31/auditar31.py`;
  - el motion blur se valida contra una referencia de supermuestreo (`ref_blur.mjs`, `err_blur.py`): error de borde < sin blur;
  - el scroll se prueba por **fotograma renderizado** con `test_scroll31.mjs`: lento (Δopacidad ≤ 0,1 por fotograma), rápido (estela limitada), zigzag (0 relevos repetidos), saltos, resize, reduced motion, recursos retrasados y desmontaje (0 residuos), en 1 280 y 375.
- **Lote 32:**
  - coste con `evidence/demos/2026-11-04-lote32/medir32.mjs` con CPU × 1 y × 4 (≤ 2 fotogramas > 33 ms), aislando capas con `?sin=`;
  - **un cambio de foco o un desenfoque afecta por igual a todas las capas del mismo plano** (fallo encontrado);
  - partículas solo donde se ven (fondo oscuro);
  - los fixtures nunca cuentan para C1.
- Claude Code no puede aprobar C3 por sí mismo: entrega la rúbrica rellenada como propuesta y pide la puntuación de una persona.

## Promoción de estados

- **IMPLEMENTADO:** el código existe en un proyecto y se ha ejecutado.
- **VALIDADO:** además ha pasado las pruebas anteriores en al menos Chromium y WebKit, con evidencia (capturas, métricas, versión). Actualiza la ficha con fecha, versiones y enlace a la evidencia.
- Nunca promuevas una ficha sin evidencia registrada.
