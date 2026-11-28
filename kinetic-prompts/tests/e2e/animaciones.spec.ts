import { type Page, expect, test } from "@playwright/test";

import { getPublishedAnimations } from "../../lib/content";

function watchConsole(page: Page) {
  const messages: string[] = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && messages.push(m.text()));
  page.on("pageerror", (e) => messages.push(e.message));
  return messages;
}

const published = getPublishedAnimations();
const blinds = published.find((i) => i.slug === "page-transition-blinds")!;

test.describe("/animaciones", () => {
  test("muestra las animaciones publicadas sin errores ni scroll horizontal", async ({ page }) => {
    const messages = watchConsole(page);
    await page.goto("/animaciones");
    await expect(page.getByRole("heading", { level: 1, name: "Animaciones" })).toBeVisible();
    await expect(page.locator("[data-galeria] > li")).toHaveCount(published.length);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(messages).toEqual([]);
  });

  test("al pulsar una tarjeta se abre el panel con la demo, las opciones y el prompt", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const messages = watchConsole(page);
    await page.goto("/animaciones");
    const tile = page.getByRole("button", { name: new RegExp(`^${blinds.title}, nivel`) });
    await tile.click();
    const dialog = page.getByRole("dialog", { name: blinds.title });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("iframe")).toHaveAttribute("sandbox", "allow-scripts");
    await expect.poll(() => page.frames().some((f) => f.url().includes(`${blinds.slug}/preview`))).toBe(true);
    const demo = page.frames().find((f) => f.url().includes(`${blinds.slug}/preview`));
    await demo!.waitForLoadState("load");
    const before = await demo!.evaluate(() => document.querySelectorAll(".tira").length);

    // Cambiar una opción reescribe el prompt y actualiza la demo en vivo.
    const prompt = dialog.locator("[data-prompt]");
    await expect(prompt).toContainText("24 tiras");
    await dialog.getByRole("slider", { name: "Número de tiras" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(prompt).toContainText("25 tiras");
    await expect.poll(() => demo!.evaluate(() => document.querySelectorAll(".tira").length)).not.toBe(before);

    // «Tu proyecto» deja solo las instrucciones de ese tipo de proyecto.
    await dialog.getByRole("button", { name: "Next.js", exact: true }).click();
    await expect(prompt).toContainText("TransitionLink");
    await expect(prompt).not.toContainText("Astro o HTML de varias páginas");

    // Lo copiado es exactamente lo que se ve.
    await dialog.getByRole("button", { name: "Copiar prompt" }).click();
    await expect(dialog.getByRole("button", { name: "Copiado" })).toBeVisible();
    const shown = await prompt.textContent();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shown);

    // Escape cierra y el foco vuelve a la tarjeta.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(tile).toBeFocused();
    expect(messages).toEqual([]);
  });

  test("cada elemento publicado abre su panel y copia un prompt sin {{variables}}", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/animaciones");
    for (const item of published) {
      await page.getByRole("button", { name: new RegExp(`^${item.title}, nivel`) }).click();
      const dialog = page.getByRole("dialog", { name: item.title });
      await dialog.getByRole("button", { name: "Copiar prompt" }).click();
      const text = await page.evaluate(() => navigator.clipboard.readText());
      expect(text.startsWith(`# ${item.title}`)).toBe(true);
      expect(text).not.toMatch(/\{\{|<!--/);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });

  test("en el panel, cada demo carga todas sus imágenes", async ({ page }) => {
    await page.goto("/animaciones");
    for (const item of published) {
      await page.getByRole("button", { name: new RegExp(`^${item.title}, nivel`) }).click();
      const dialog = page.getByRole("dialog", { name: item.title });
      await expect(dialog.locator("iframe")).toBeVisible();
      // El marco puede tardar un instante en tener su dirección: se espera a que aparezca.
      await expect.poll(() => page.frames().some((f) => f.url().includes(`${item.slug}/preview`))).toBe(true);
      const demo = page.frames().find((f) => f.url().includes(`${item.slug}/preview`))!;
      await demo.waitForLoadState("load");
      const broken = await demo.evaluate(() =>
        [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src),
      );
      expect(broken, `${item.slug}: imágenes sin cargar`).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });

  test("el inicio lleva a la galería", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ver animaciones" }).click();
    await expect(page).toHaveURL(/\/animaciones$/);
  });
});
