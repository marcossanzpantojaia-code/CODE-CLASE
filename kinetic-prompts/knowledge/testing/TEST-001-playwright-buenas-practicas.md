---
id: TEST-001
titulo: Pruebas de extremo a extremo con Playwright — buenas prácticas oficiales y plan mínimo para una web de negocio
categoria: testing
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (playwright.dev/docs/best-practices)
versiones: Playwright actual (docs 2026-10-26)
perfil: ambos
ultima_revision: 2026-10-26
---

# TEST-001 · Playwright

1. **Finalidad.** Comprobar automáticamente lo que el usuario ve y hace (reservar cita, enviar contacto, navegar el menú) antes de cada despliegue.
2. **Fuente.** https://playwright.dev/docs/best-practices.
3. **Prácticas oficiales.**
   - Probar **comportamiento visible**, no detalles de implementación (clases CSS, nombres de funciones).
   - **Aislamiento:** cada test con su almacenamiento/cookies/datos; `beforeEach`; proyecto de *setup* para reutilizar sesión.
   - **Sin dependencias de terceros:** simular respuestas externas con `page.route`.
   - **Localizadores orientados al usuario:** `getByRole`, `getByLabel`, `getByText`; encadenar y `filter()`; evitar CSS/XPath frágiles.
   - **Aserciones web-first** que esperan y reintentan: `await expect(loc).toBeVisible()` (no `isVisible()` manual). `expect.soft()` para acumular fallos.
   - **Depuración:** `npx playwright test --debug`, extensión de VS Code; en CI, *trace viewer*.
   - **CI:** en cada commit/PR, preferible Linux; paralelismo y *sharding*; instalar solo los navegadores necesarios (`npx playwright install chromium --with-deps`).
   - **Calidad del código de test:** TypeScript, regla `@typescript-eslint/no-floating-promises` (detecta `await` olvidados), `tsc --noEmit`.
4. **Por qué `getByRole` es también una prueba de accesibilidad [criterio propio].** Si un botón no tiene nombre accesible o un menú es un `div`, el localizador no lo encuentra → el test falla igual que fallaría un lector de pantalla (relación con MENU-001, HOV-006, UX-003).
5. **Plan mínimo para perfil A [criterio propio].**
   1. Home carga, `h1` visible, sin errores de consola.
   2. Menú móvil: abre con botón, Esc cierra, foco vuelve.
   3. Formulario de cita: validación de campos, envío con servidor simulado, mensaje de éxito; error del servidor mostrado.
   4. Enlaces de teléfono/WhatsApp/mapa con `href` correcto.
   5. `prefers-reduced-motion: reduce` (`page.emulateMedia({ reducedMotion: 'reduce' })`) → sin animaciones bloqueantes.
   6. Viewports 375×667 y 1440×900.
6. **Dependencias.** `@playwright/test` (instalar **solo con autorización** en un proyecto del usuario).
7. **Animaciones y Playwright [criterio propio].** Las aserciones esperan, pero las animaciones con scroll (ScrollTrigger, Lenis) pueden requerir `reducedMotion` o desactivar el smooth en test para resultados deterministas.
8–9. **Código (adaptación; no ejecutada):**
   ```ts
   test("pedir cita", async ({ page }) => {
     await page.route("**/api/cita", r => r.fulfill({ status: 200, json: { ok: true } }));
     await page.goto("/");
     await page.getByRole("link", { name: "Pedir cita" }).click();
     await page.getByLabel("Nombre").fill("Ana");
     await page.getByRole("button", { name: "Enviar" }).click();
     await expect(page.getByRole("status")).toContainText("Recibido");
   });
   ```
10. **Problemas habituales.** `waitForTimeout` fijos; selectores CSS; depender de APIs reales; tests que comparten estado.
11–13. Ver §5.
14. **Complemento.** Lighthouse/Core Web Vitals (PERF-001, DEPLOY-001) y revisión manual con teclado y lector.
15. **Estado.** Documentación leída; ningún test escrito ni ejecutado.
