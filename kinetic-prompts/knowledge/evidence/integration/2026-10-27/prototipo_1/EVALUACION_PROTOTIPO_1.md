# Prototipo n.º 1 — landing de "Barbería Castellana" construida por Claude Code con la biblioteca (2026-10-27)

> Primera implementación real. Todo lo marcado **CONFIRMADO** se ha ejecutado u observado; lo demás se indica como NO VERIFICADO o BLOQUEADO. Una página que compila no equivale a calidad profesional: ver §4.

## 0. Bloqueo previo
Astro, GSAP y Lighthouse **no están disponibles** y no se autorizó instalarlos → `BLOQUEO_DEPENDENCIAS.md`. El encargo pidió HTML/CSS/JS nativos. **Las técnicas GSAP de la biblioteca no se pusieron a prueba.**

## 1. Ejecución (una sola vez)
- Claude Code 2.1.311, Linux (contenedor), suscripción, modelo `claude-sonnet-5-5`; herramientas **Read, Grep, Glob, Skill, Write, Edit** (sin Bash ni red); `--permission-mode acceptEdits`; reglas *deny* de Edit/Write sobre la copia de la biblioteca (`settings.json`); copia del ZIP v0.17.0 (`dfeec461…`); carpeta `proyecto/` vacía. Criterios del verificador fijados antes (`criterios_previos.txt`).
- 11:16:07Z → ~11:21:26Z (duración según el resultado: 319 s; `end.txt` registra la comprobación posterior); 26 turnos; sin denegaciones; `isUsingOverage: false` (sin cargos adicionales); ventana de 5 h ≈ 0,54 al terminar.
- Encargo natural (`prompt.txt`): sin nombrar Skills ni biblioteca; contenido ficticio; testimonios marcados como ejemplos; sin servicios reales.
- Resultado: `index.html` (412 líneas), `styles.css` (474), `main.js` (140) en `proyecto/`. La copia de la biblioteca quedó **intacta** (sha256 de 308 archivos).

## 2. Uso de la biblioteca (fase 2 de la directiva)
**Verificador de construcción (`verify_build_evidence.py`, fijado antes): NO SUPERA — 13 de 16.** Fallan solo los tres criterios del archivo `CONSULTA_BIBLIOTECA.md`: no lo creó (el registro está en la respuesta final, no en un archivo, aunque podía escribir).

| Punto | Resultado (revisión humana) |
|---|---|
| 1. Activación automática | **CONFIRMADO**: `Skill(web-library-router)` primera acción; además invocó `web-commercial-site` y, al final, `web-qa-validation` |
| 2. Fichas recuperadas | **CONFIRMADO**: índice y manifiesto completos + 11 fichas: ARCH-001, UX-002, UI-002, A11Y-001, A11Y-007, CSS-001, FORM-001, SEO-001, PERF-001, ST-001, WGPU-001 |
| 3. Lectura antes de implementar | **CONFIRMADO**: las 11 lecturas ocurren antes del primer Write (traza ordenada en `traza.json`) |
| 4. Recomendaciones aplicadas en el código | **CONFIRMADO (grep sobre el código):** CSS-001 → `@supports (animation-timeline: …)` para el haz de luz; A11Y-001 → movimiento solo dentro de `@media (prefers-reduced-motion: no-preference)` y ocultación de `.reveal` solo con clase `.js` (contenido visible sin JS); FORM-001 → `label` visibles, `autocomplete`, 6 `aria-describedby`, errores con texto y foco al primer campo inválido; UX-002/PERF-001 → `h1` y CTA en el HTML desde el primer pintado, sin opacidad 0 en el héroe; A11Y-007 → leída para **descartar** el carrusel; ST-001 y WGPU-001 → leídas para descartar GSAP (no disponible) y 3D |
| 5. Registro de qué ficha fundamenta cada decisión | **PARCIAL**: registro en la respuesta (secciones 1–4, ficha → decisión), pero **no** como archivo y con rutas abreviadas (`.../ux/...`) salvo la primera |
| 6. Sin atribuciones a fichas no leídas | **CONFIRMADO**: TYPE-002, A11Y-003, A11Y-005, TEST-001 aparecen marcadas "(no leída)"; ningún ID en el código |
| 7. Adaptaciones propias declaradas | **CONFIRMADO**: `IntersectionObserver` para los revelados, poste de barbero en CSS, reglas de horario, plano SVG, mensajes de error |
| Observación | Reconoce que "los contrastes los calculé a ojo" sin leer A11Y-003 → la Skill no le obligó a medirlos; y que no pudo probar nada (sin navegador ni terminal) |

## 3. Pruebas de funcionamiento (ejecutadas por el orquestador con herramientas ya instaladas)
Entorno: servidor `python3 -m http.server` en 127.0.0.1; **Playwright 1.63.0** + **Chromium 153.0.8010.12**; scripts en `herramientas_prueba/`; datos en `pruebas/resultados_pruebas.json` y `resultados_extra.json`; capturas en `pruebas/capturas/` (JPEG reducidos de las PNG originales).

| Prueba | Resultado |
|---|---|
| Carga (HTTP) en 1440 / 768 / 375 px | **CONFIRMADO** 200; 3 peticiones (HTML, CSS, JS) |
| Errores y avisos de consola, excepciones JS | **CONFIRMADO: 0** en los tres anchos |
| Recursos fallidos | **CONFIRMADO: 0** |
| Desbordamiento horizontal (1440, 768, 375, 320) | **CONFIRMADO: ninguno** (`scrollWidth = clientWidth`); el arte del héroe sobresale pero queda recortado |
| **Cabecera en móvil** | **FALLO**: a 375 y 320 px el botón de menú baja a una segunda fila (cabecera de 98 px a 375). [CALC] 161 (marca) + 147 (CTA) + 44 (menú) + 2×9,6 (huecos) = 371 px > 335 px disponibles, con `flex-wrap: wrap` |
| Menú móvil | **CONFIRMADO**: abre (`aria-expanded="true"`), Escape lo cierra y devuelve el foco al botón |
| Teclado (25 tabulaciones en escritorio) | **CONFIRMADO**: enlace de salto primero y visible; foco visible (`outline: 3px solid`) en 24/25 paradas. **Defecto menor**: la parada del selector de calendario del `input type=date` (Chromium) no tiene indicador. Varias paradas se midieron antes de terminar el desplazamiento suave (`scroll-behavior: smooth`), por eso figuran "fuera de vista": artefacto de la medición |
| Reduced motion (`reduce`) | **CONFIRMADO**: 0 de 23 `.reveal` ocultos al cargar y **0 animaciones activas** |
| Movimiento normal | **CONFIRMADO**: 23 `.reveal` ocultos al cargar y visibles tras recorrer la página; animaciones activas en el héroe: `breathe`, `drift` (haz de luz), `art-in`, `spin` (poste) |
| Curva de un revelado | **CONFIRMADO (muestreo)**: opacidad 0 hasta ~200 ms, 0,46 a 290 ms, 1 a ~690 ms (coherente con 0,55 s + retardo escalonado). El desplazamiento usa la propiedad `translate` (no muestreada) |
| Formulario | **CONFIRMADO**: envío vacío → 5 mensajes de error + resumen, foco en "Nombre", **0 peticiones de red** |
| Rendimiento de laboratorio | **MEDIDO** (Chromium local, sin limitación de red/CPU): LCP 132 ms (el `h1`), FCP 132 ms, **CLS 0**, HTML 21,7 KB + CSS 21,3 KB + JS 5,8 KB, 362 nodos DOM. **No equivale a Lighthouse ni a datos de campo** |
| Contraste (script propio, fondo opaco más cercano) | **24 pares medidos, 0 fallos**; **8 no medidos** (texto sobre degradado/imagen, incluido el `h1` del héroe) → revisar con una herramienta que componga el fondo |
| Lighthouse | **BLOQUEADO** (no instalado) |
| Validación HTML, lector de pantalla real, Safari/Firefox | **NO EJECUTADO** |

## 4. Evaluación visual y de diseño (capturas inspeccionadas por el orquestador; criterio propio, no medición)
- **Jerarquía:** clara. Titular serif grande con dos palabras en latón, subtítulo, CTA principal relleno y secundario con borde; un solo `h1`. **Bien.**
- **Tipografía:** serif de sistema (Iowan/Palatino/Georgia) para titulares y sans de sistema para texto; buen interlineado; sin fuentes externas (coherente con la restricción). Resultado elegante pero **dependiente del sistema operativo** (en Linux se ve la serif de reserva).
- **Color y composición:** paleta oscura con latón, rojo y azul de poste; coherente y "premium" en escritorio y tableta. La sección de servicios deja un gran vacío a la izquierda en escritorio (título fijo + lista larga).
- **Héroe:** sólido en escritorio (poste de barbero en CSS, haz de luz, viñeta y grano). En móvil el poste queda tras el texto a baja opacidad; legible.
- **Galería:** ilustraciones SVG genéricas sin rostro (avatares). Correctas como marcador, **no transmiten calidad de barbería real**; la web definitiva necesita fotografía propia.
- **Testimonios:** marcados claramente como ficticios. **Bien** (evita reseñas falsas).
- **Contacto:** dirección, teléfono y correo ficticios señalados; horario en tabla; plano esquemático SVG rotulado. **Bien.**
- **Móvil:** contenido bien apilado y legible; **defecto visible de la cabecera** (botón de menú en una segunda fila).
- **Ritmo de las animaciones y transiciones:** solo se muestreó la opacidad de un revelado; **ritmo, sensación cinematográfica y fluidez: NO VERIFICADOS** (no hay inspección de vídeo fiable).
- **Utilidad comercial:** CTA de reserva visible en cabecera y héroe, precios claros, horario y ubicación → orientada a conversión. El formulario es una demostración (no conecta con nada, como se pidió).
- **Accesibilidad / rendimiento:** ver §3 (buenos indicadores de laboratorio; pruebas con lector de pantalla pendientes).
- **Valoración global (opinión del orquestador):** prototipo **funcional y bien construido**, de aspecto profesional en escritorio; **no** alcanza todavía el nivel "cinematográfico premium" del encargo (sin GSAP, sin fotografía, efectos discretos) y tiene un defecto de cabecera en móvil. **No se declara validada su calidad.**

## 5. Fallos encontrados
1. Cabecera móvil desbordada en dos filas (375 y 320 px) — no detectado por Claude Code porque no pudo renderizar.
2. `CONSULTA_BIBLIOTECA.md` no creado pese a poder escribir; rutas del registro abreviadas.
3. Contraste elegido "a ojo" sin leer A11Y-003; 8 textos sobre degradado sin medir.
4. Indicador de foco ausente en el selector de calendario de Chromium.
5. Sin pruebas propias de Claude Code (no tenía navegador ni terminal): la Skill `web-qa-validation` se invocó pero no pudo ejecutarse.
6. GSAP, Astro y Lighthouse bloqueados por falta de autorización de instalación.

## 6. Reproducción
Ver `REPRODUCIR.md`.
