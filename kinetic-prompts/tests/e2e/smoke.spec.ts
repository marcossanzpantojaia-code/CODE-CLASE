import { expect, test } from "@playwright/test";

test("la página de inicio carga sin errores de consola", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Kinetic Prompts");
  await expect(page.getByRole("heading", { level: 1, name: "Kinetic Prompts" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  expect(errors).toEqual([]);
});
