import { type Page, expect, test } from "@playwright/test";

function watchConsole(page: Page) {
  const messages: string[] = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && messages.push(m.text()));
  page.on("pageerror", (e) => messages.push(e.message));
  return messages;
}

test.describe("/crear", () => {
  test("carga con una pieza ya elegida en cada apartado, sin errores ni scroll horizontal", async ({
    page,
  }) => {
    const messages = watchConsole(page);
    await page.goto("/crear");
    await expect(page.getByRole("heading", { level: 1, name: "Crea tu web por partes" })).toBeVisible();
    const steps = page.locator("[data-paso]");
    const n = await steps.count();
    expect(n).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < n; i++) await expect(steps.nth(i).locator("input:checked")).toHaveCount(1);
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);
    expect(messages).toEqual([]);
  });

  test("copia el prompt de la web con lo elegido, el nombre del negocio y sin huecos", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/crear");
    await page.getByLabel("Nombre del negocio (opcional)").fill("Café Norte");
    // Letras: ninguna. El resto, lo que venga elegido.
    await page.locator('[data-paso="texto"]').getByText("Ninguna", { exact: true }).click();
    await page.getByRole("complementary").getByRole("button", { name: "Copiar el prompt de mi web" }).click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text.startsWith("# Prompt de mi web: Café Norte")).toBe(true);
    expect(text).toContain("## 3. Reglas de convivencia");
    expect(text).not.toMatch(/\{\{|<!--/);
    expect(text).not.toContain("Letras:");
    const resumen = await page.locator("[data-resumen] li").allTextContents();
    for (const row of resumen.filter((r) => !r.endsWith("Ninguna"))) {
      const title = row.replace(/^(Fondos|Transiciones de página|Transiciones de objetos|Letras)/, "");
      expect(text).toContain(title);
    }
  });

  test("las piezas se eligen con el teclado (grupo de radios)", async ({ page, isMobile }) => {
    test.skip(isMobile, "El teclado se prueba en escritorio.");
    await page.goto("/crear");
    const group = page.locator('[data-paso="fondos"]');
    await group.locator("input:checked").focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.locator("input").nth(1)).toBeChecked();
  });

  test("el inicio y la cabecera llevan al constructor", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Crear mi web por partes" }).click();
    await expect(page).toHaveURL(/\/crear$/);
    await expect(page.getByRole("link", { name: "Crear web" })).toHaveAttribute("aria-current", "page");
  });
});
