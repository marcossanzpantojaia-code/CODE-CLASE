import { type Page, expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BOTONERA = JSON.parse(
  readFileSync(join(process.cwd(), "app/design/_components/botonera.json"), "utf8"),
) as Array<{ titulo: string; prompt: string }>;

/** Recoge errores y avisos de consola, y errores no capturados. */
function watchConsole(page: Page) {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      messages.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  return messages;
}

test.describe("/design", () => {
  test("carga sin errores ni avisos de consola y sin scroll horizontal", async ({ page }) => {
    const messages = watchConsole(page);
    const response = await page.goto("/design");
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole("heading", { level: 1, name: "Sistema de diseño" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(messages).toEqual([]);
  });

  test("las tres familias tipográficas del plan están cargadas", async ({ page }) => {
    await page.goto("/design");
    await page.evaluate(() => document.fonts.ready);
    const families = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
    );
    for (const family of ["Bricolage Grotesque", "Instrument Sans", "JetBrains Mono"]) {
      expect(families).toContain(family);
    }
  });

  test("todas las parejas de contraste cumplen 4,5:1 medidas en el navegador", async ({ page, isMobile }) => {
    test.skip(isMobile, "La tabla con datos solo se muestra a partir de 640 px.");
    await page.goto("/design");
    const rows = page.locator("[data-contraste]");
    // Los valores se calculan tras la hidratación: se espera a que estén las 12 filas.
    await expect(rows).toHaveCount(12);
    const ratios = await rows.evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute("data-contraste"))),
    );
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("la botonera copia el prompt con un clic y vuelve a reposo a los 2 s", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const messages = watchConsole(page);
    await page.goto("/design");
    const botonera = page.locator("[data-botonera]");
    await expect(botonera.getByRole("button")).toHaveCount(BOTONERA.length);

    const fondo = BOTONERA[0]!;
    const tile = botonera.locator("li", { hasText: fondo.titulo });
    const button = tile.getByRole("button");
    await expect(button).toHaveAccessibleName("Copiar prompt");
    const before = await button.boundingBox();

    await button.click();
    await expect(button).toHaveAccessibleName("Copiado");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(fondo.prompt);
    await expect(page.locator("[data-kp-copia-aviso]")).toHaveText(
      `Prompt de ${fondo.titulo} copiado al portapapeles.`,
    );
    // El ancho no cambia al pasar a «Copiado».
    expect((await button.boundingBox())?.width).toBe(before?.width);

    await expect(button).toHaveAccessibleName("Copiar prompt", { timeout: 3000 });
    expect(messages).toEqual([]);
  });

  test("copia también con el prompt servido de forma asíncrona (como /api/copy)", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/design");
    await page
      .getByRole("group", { name: "Origen del prompt" })
      .getByRole("button", { name: "Servidor" })
      .click();
    const item = BOTONERA[3]!;
    const button = page.locator("[data-botonera] li", { hasText: item.titulo }).getByRole("button");
    await button.click();
    await expect(button).toHaveAccessibleName("Copiando…");
    await expect(button).toHaveAccessibleName("Copiado");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(item.prompt);
  });

  test("sin sesión: no copia y avisa", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/design");
    await page.evaluate(() => navigator.clipboard.writeText("antes"));
    await page
      .getByRole("group", { name: "Origen del prompt" })
      .getByRole("button", { name: "Sin sesión" })
      .click();
    await page.locator("[data-botonera] li").first().getByRole("button").click();
    await expect(
      page.getByRole("status").filter({ hasText: "Inicia sesión con Google para copiar" }).first(),
    ).toBeAttached();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("antes");
  });

  test("el foco de teclado se ve: anillo de 2 px en --accent", async ({ page, isMobile }) => {
    test.skip(isMobile, "Navegación con teclado físico.");
    await page.goto("/design");
    const button = page.getByRole("button", { name: "Repetir" }).first();
    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const outline = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
    });
    expect(outline).toEqual({ width: "2px", style: "solid", color: "rgb(255, 107, 61)" });
  });

  test("con movimiento reducido las transiciones pasan a 100 ms y sin desplazamientos", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/design");
    const vars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return ["--dur-hover", "--dur-ui", "--dur-signature", "--lift", "--shift"].map((n) =>
        style.getPropertyValue(n).trim(),
      );
    });
    expect(vars.slice(0, 3).map((v) => (v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000))).toEqual([
      100, 100, 100,
    ]);
    expect(vars.slice(3).map((v) => parseFloat(v))).toEqual([0, 0]);
    await expect(page.locator("[data-reduced-motion=true]")).toBeVisible();
    await context.close();
  });

  test("capturas de referencia a 375 y 1440 px", async ({ page, isMobile }) => {
    test.skip(
      isMobile || !process.env.KP_CAPTURAS,
      "Solo con KP_CAPTURAS=1 (las revisa kp-revision-visual).",
    );
    for (const [width, height] of [
      [375, 812],
      [1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto("/design");
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `tests/visual/fase-1/design-${width}.png`, fullPage: true });
    }
  });
});
