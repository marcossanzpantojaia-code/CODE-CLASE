// Comprobaciones propias de «Persianas desde el centro» para scripts/validar-animacion.mjs.
// Tiempos con los valores por defecto: cada fase dura 0,55 s + 0,015 s × 11,5 = 0,72 s.
export const config = {
  freezeAt: 400, // a mitad de cubrir
  poster: { at: 300 }, // el centro ya casi cerrado y los bordes abiertos: se lee «desde el centro»
  // Desde la carga: reposo 1,2 s, ida 1,45 s, reposo 1,2 s, vuelta 1,45 s. Empieza y acaba en reposo.
  video: { start: 0.6, seconds: 5.29 },
};

/* Costuras (MASK-002 §8): con todas las tiras cerradas, ningún píxel de la página de debajo. */
async function seams(browser, viewport, deviceScaleFactor, base, freeze, send) {
  const context = await browser.newContext({ viewport, deviceScaleFactor });
  const page = await context.newPage();
  await page.goto(`${base}?loop=0`, { waitUntil: "load" });
  await send(page, { type: "kp:replay" });
  await freeze(page, 900); // 0,55 s + 0,17 s de escalonado: todas cerradas
  const png = await page.screenshot();
  await context.close();
  return png;
}

export const checks = [
  {
    name: "Sin costuras con las tiras cerradas (1366×768, 390×844 @3x, 1280×800)",
    async run(page, { base, freeze, send }) {
      const sharp = (await import("sharp")).default;
      const browser = page.context().browser();
      const cases = [
        [{ width: 1366, height: 768 }, 1],
        [{ width: 390, height: 844 }, 3],
        [{ width: 1280, height: 800 }, 1],
      ];
      const report = [];
      let ok = true;
      for (const [viewport, dpr] of cases) {
        const png = await seams(browser, viewport, dpr, base, freeze, send);
        const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
        // Cuenta los píxeles que no son del color de las tiras (#e4572e, con tolerancia).
        let bad = 0;
        for (let i = 0; i < data.length; i += info.channels) {
          const dr = Math.abs(data[i] - 0xe4), dg = Math.abs(data[i + 1] - 0x57), db = Math.abs(data[i + 2] - 0x2e);
          if (dr + dg + db > 24) bad++;
        }
        if (bad > 0) ok = false;
        report.push(`${viewport.width}×${viewport.height}@${dpr}x: ${bad} px`);
      }
      return { ok, detail: report.join(" · ") };
    },
  },
  {
    name: "Las tiras cubren desde el centro (la central antes que la del borde)",
    async run(page, { base, freeze, send }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await send(page, { type: "kp:replay" });
      await freeze(page, 300);
      const scales = await page.evaluate(() =>
        [...document.querySelectorAll(".tira")].map((el) => new DOMMatrix(getComputedStyle(el).transform).d),
      );
      const middle = scales[Math.floor(scales.length / 2)];
      const edge = scales[0];
      return { ok: middle > edge, detail: `centro ${middle.toFixed(2)} · borde ${edge.toFixed(2)}` };
    },
  },
  {
    name: "Un clic en un enlace cambia de página y deja el foco en su título",
    async run(page, { base }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await page.getByRole("link", { name: "Proyectos" }).first().click();
      await page.waitForFunction(() => !document.getElementById("proyectos").hidden);
      await page.waitForTimeout(1600);
      const focused = await page.evaluate(() => document.activeElement?.id);
      const covered = await page.evaluate(() =>
        [...document.querySelectorAll(".tira")].some((el) => new DOMMatrix(getComputedStyle(el).transform).d > 0.01),
      );
      return { ok: focused === "t-proyectos" && !covered, detail: `foco en #${focused}; tiras recogidas: ${!covered}` };
    },
  },
];
