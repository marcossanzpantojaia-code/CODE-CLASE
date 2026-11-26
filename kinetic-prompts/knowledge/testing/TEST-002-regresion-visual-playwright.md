---
id: TEST-002
titulo: Regresión visual con Playwright — toHaveScreenshot(), líneas base por navegador y sistema, máscaras, animaciones desactivadas y cómo usarla con webs animadas
categoria: testing
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (playwright.dev/docs/test-snapshots y referencia PageAssertions)
versiones: Playwright Test (maskColor desde 1.35, stylePath desde 1.41)
perfil: ambos
ultima_revision: 2026-10-27
---

# TEST-002 · Regresión visual con Playwright

1. **Nombre y finalidad.** Detectar cambios visuales no deseados (maquetación, tipografía, estados) en cada PR. Hueco de ARCH-001 ("pruebas visuales de regresión"); complementa TEST-001 (E2E) y CI-001.
2. **Fuentes.** https://playwright.dev/docs/test-snapshots · https://playwright.dev/docs/api/class-pageassertions (toHaveScreenshot).
3. **Ubicación.** Guía "Visual comparisons" y tabla de opciones de `toHaveScreenshot`.
4. **Resultado.** Imágenes de referencia versionadas y fallo del test si la captura difiere más de lo tolerado.
5. **Funcionamiento [doc].**
   - `await expect(page).toHaveScreenshot()`: la primera ejecución **escribe** la referencia (toma capturas hasta que dos seguidas coinciden); las siguientes comparan.
   - Referencias en `<archivo>.spec.ts-snapshots/`, nombre con navegador y plataforma (p. ej. `example-test-1-chromium-darwin.png`) → **una línea base por navegador y sistema**; `snapshotPathTemplate` cambia la ruta. Versionarlas en git.
   - Actualizar a propósito: `npx playwright test --update-snapshots`.
   - **El renderizado varía con sistema, versión, ajustes y hardware → ejecutar en el mismo entorno donde se generaron** (en la práctica, el contenedor de CI) [doc; "contenedor" es criterio propio].
   - `toMatchSnapshot()` para texto o binarios.
6. **Opciones [doc, valores por defecto].** `animations: "disabled"` (por defecto: detiene CSS, transiciones y Web Animations; las finitas saltan al final, las infinitas se reinician), `caret: "hide"`, `fullPage: false`, `mask: Locator[]` (cajas de color, `maskColor` rosa `#FF00FF`), `maxDiffPixels`, `maxDiffPixelRatio` (0–1), `threshold: 0.2` (diferencia YIQ por píxel), `scale: "css"`, `stylePath` (CSS aplicado solo en la captura), `omitBackground`, `clip`, `timeout`. Valores comunes en `expect.toHaveScreenshot` de la config.
7. **Procedimiento para webs animadas (adaptación).**
   1. `animations: "disabled"` **no detiene GSAP ni WebGL** (son JS/rAF; la opción afecta a CSS y Web Animations) [inferencia a partir de la doc, verificar] → emular `reducedMotion: 'reduce'` en el contexto de Playwright y que la web muestre el estado final (A11Y-001), o exponer un `?static` de pruebas.
   2. Enmascarar `canvas` 3D, vídeos, carruseles y contenido dinámico (`mask`) o ocultarlos con `stylePath`.
   3. Retirar el ratón (`page.mouse.move(-1, -1)`) para no capturar *hover*.
   4. Capturar 3 anchos (TEST-001) y estados clave (menú abierto, modal, error de formulario).
   5. Esperar a fuentes e imágenes (`document.fonts.ready`) antes de capturar [criterio propio].
8. **Parámetros.** Tolerancias (`maxDiffPixelRatio` ~0,01 como punto de partida [EST]), proyectos por navegador.
9. **Código (adaptación propuesta; no ejecutada):**
   ```ts
   test.use({ reducedMotion: 'reduce' });
   test('home', async ({ page }) => {
     await page.goto('/'); await page.evaluate(() => document.fonts.ready);
     await expect(page).toHaveScreenshot('home.png', { fullPage: true, mask: [page.locator('canvas')], maxDiffPixelRatio: 0.01 });
   });
   ```
10. **Problemas habituales.** Referencias generadas en macOS y comparadas en Linux; animaciones JS a medio camino; fechas/horarios dinámicos; fuentes web sin cargar; tolerancias tan altas que nada falla.
11. **Rendimiento / a11y.** No mide accesibilidad (A11Y-005) ni rendimiento (CI-002).
12. **Compatibilidad.** Chromium, Firefox, WebKit (líneas base separadas).
13. **Aplicaciones.** Webs de clientes con mantenimiento (cambios de CMS o de dependencias), sistemas de diseño (DS-001).
14. **Pruebas.** Introducir un cambio deliberado de 1 px y comprobar que falla; ejecutar dos veces seguidas sin cambios y comprobar que pasa (estabilidad).
15. **Estado.** Documentación leída; nada ejecutado.
