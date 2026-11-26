---
id: TEST-004
titulo: Batería genérica para comparar webs construidas por agentes — métricas sin selectores del proyecto, falsos positivos detectados, cabecera en una fila, vídeo y fotogramas, anonimización
categoria: testing
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA (ejecutada sobre A1 y B1 el 2026-10-27, dos rondas)
versiones: Playwright 1.63.0 + Chromium 153.0.8010.12; ffmpeg del contenedor
perfil: ambos
ultima_revision: 2026-10-27
---

# TEST-004 · Batería genérica comparativa

1. **Finalidad.** Medir con las **mismas** pruebas webs distintas, sin depender de clases propias como `.reveal` o `.site-header`. El arnés del lote 18 (`run_tests.mjs`) estaba atado a A1 y no servía para B1.
2. **Fuente.** Método propio. Herramientas:
   - `integration/tools/prueba_web_playwright.mjs` (versión del lote 19);
   - `integration/tools/extra_generico.mjs`;
   - `integration/tools/contraste_compuesto.mjs` (TEST-003).
3. **Ubicación.** `evidence/integration/2026-10-27/comparacion_A1_B1/`.
4. **Resultado.** Métricas T1–T10 de `COMPARACION_CON_SIN_BIBLIOTECA.md`, capturas, vídeos `.webm` y mosaicos de fotogramas.
5. **Métricas genéricas.**
   - **Ocultos:** elementos visibles de `main` con opacidad < 0,99.
     - **Lección [OBS]:** el recuento bruto da **falsos positivos**. En la ronda 1 contó los puntos guía `aria-hidden` de B1 (opacidad 0,5) y el arte del héroe de A1 a mitad de su animación de entrada.
     - Se añadió **`ocultos_con_contenido`**: excluye todo lo que esté dentro de `[aria-hidden=true]` y exige texto o un medio (img, svg, video, canvas, `role=img`), propio **o descendiente**.
     - **Segunda lección:** una primera versión que solo miraba el texto propio daba 0 con movimiento normal, porque los contenedores `.reveal` no tienen texto propio. Con descendientes da 23, el valor correcto.
   - **Cabecera en una fila:** primer `<header>`; sus `a`/`button` visibles se agrupan por centro vertical (tolerancia 12 px) → `filas_distintas`. A1 da 2 a 320 y 375 px; B1 da 1.
   - **Sin JS:** contexto con `javaScriptEnabled: false` y la métrica de ocultos con contenido.
   - **Vídeo:** `recordVideo` a 1440 y 375 px, con recorrido de 120 px cada 110 ms. Mosaico con `ffmpeg -vf "fps=4,scale=360:-1,tile=5x2"`. Sirve para ver entradas (p. ej. `art-in` de A1, ~0,5 s), **no** para juzgar el ritmo: eso exige revisión humana.
6. **Dependencias.** Playwright (instalado) y ffmpeg (opcional, para los mosaicos).
7. **Procedimiento comparativo.**
   1. Generar los códigos anónimos al azar **antes** de probar.
   2. Copiar cada web a `sitios/<código>/` y servirlas desde el mismo servidor local.
   3. Ejecutar las 3 herramientas por código.
   4. Guardar la correspondencia aparte.
   5. Si quien puntúa ya conoce una de las webs, **declarar que la evaluación no es ciega**: el orquestador reconoció A1 por su peso (21,7 KB) y su número de nodos (362).
8. **Parámetros.** Anchos 320/375/768/1440; 25 tabulaciones; `reducedMotion` `reduce` y `no-preference`.
9. **Código.** Herramientas citadas (adaptación propia, ejecutadas).
10. **Problemas habituales.**
    - Cambiar una métrica después de ver los datos: se hizo en la ronda 2 por un falso positivo evidente. Se conservan las dos rondas y la versión anterior del arnés (`herramientas/prueba_web_playwright_v18.mjs`). Las métricas críticas no cambiaron de sentido.
    - `scroll-behavior: smooth` hace que algunas paradas de foco se midan "fuera de vista".
11. **Rendimiento.** ~1 min por web.
12. **Compatibilidad.** Solo Chromium. Faltan Firefox y WebKit (no instalados).
13. **Aplicaciones.** Comparaciones con y sin biblioteca; regresión entre versiones de un prototipo; QA de `web-qa-validation`.
14. **Pruebas pendientes.** Validar `filas_distintas` en cabeceras con iconos sin enlace; añadir Firefox y WebKit si se autoriza instalar sus navegadores.
15. **Estado.** **IMPLEMENTADO** sobre 2 webs; **no VALIDADO**.
