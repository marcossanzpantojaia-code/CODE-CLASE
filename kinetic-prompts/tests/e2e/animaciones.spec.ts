import { type Page, expect, test } from "@playwright/test";

import { defaultPrompt, getPublishedAnimations } from "../../lib/content";

function watchConsole(page: Page) {
  const messages: string[] = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && messages.push(m.text()));
  page.on("pageerror", (e) => messages.push(e.message));
  return messages;
}

const published = getPublishedAnimations();

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

  test("un clic en la tarjeta copia su prompt, reproduce el ejemplo y vuelve a reposo", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const item = published[0]!;
    await page.goto("/animaciones");
    const tile = page.getByRole("button", { name: new RegExp(`^Copiar prompt: ${item.title}`) });
    await tile.click();
    await expect(page.getByRole("button", { name: new RegExp(`^Copiado: ${item.title}`) })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(defaultPrompt(item));
    const playing = await page.evaluate(() => {
      const video = document.querySelector("[data-galeria] video") as HTMLVideoElement | null;
      return video ? !video.paused : false;
    });
    expect(playing).toBe(true);
    await expect(page.getByRole("button", { name: new RegExp(`^Copiar prompt: ${item.title}`) })).toBeVisible(
      {
        timeout: 3000,
      },
    );
  });

  test("con movimiento reducido copia pero no reproduce el vídeo", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await page.goto("/animaciones");
    await page.locator("[data-galeria] button").first().click();
    await expect(page.locator("[data-galeria] button").first()).toHaveAttribute("data-estado", "copiado");
    const paused = await page.evaluate(
      () => (document.querySelector("[data-galeria] video") as HTMLVideoElement).paused,
    );
    expect(paused).toBe(true);
    await context.close();
  });

  test("el inicio lleva a la galería", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ver animaciones" }).click();
    await expect(page).toHaveURL(/\/animaciones$/);
  });
});
