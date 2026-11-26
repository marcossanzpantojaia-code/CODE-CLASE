// Comprobaciones propias de «Cortina con borde curvo» para scripts/validar-animacion.mjs.
// Con los valores por defecto: cubrir 0,7 s, pausa 0,25 s, descubrir 0,7 s.
export const config = {
  freezeAt: 600, // casi tapado: el texto ya está en pantalla y la curva aún no es recta
  poster: { at: 360 }, // la curva bien marcada a mitad de camino
  // Desde la carga: reposo 1,2 s, ida 1,65 s, reposo 1,2 s, vuelta 1,65 s. Empieza y acaba en reposo.
  video: { start: 0.6, seconds: 5.7 },
};

const CREAM = [0xf3, 0xee, 0xe6];

export const checks = [
  {
    name: "Al terminar de cubrir no asoma la página (1366×768, 390×844 @3x, 1280×800)",
    async run(page, { base, freeze, send }) {
      const sharp = (await import("sharp")).default;
      const browser = page.context().browser();
      const report = [];
      let ok = true;
      for (const [viewport, dpr] of [
        [{ width: 1366, height: 768 }, 1],
        [{ width: 390, height: 844 }, 3],
        [{ width: 1280, height: 800 }, 1],
      ]) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: dpr });
        const p = await context.newPage();
        await p.goto(`${base}?loop=0`, { waitUntil: "load" });
        await send(p, { type: "kp:replay" });
        await freeze(p, 700);
        const { data, info } = await sharp(await p.screenshot()).raw().toBuffer({ resolveWithObject: true });
        await context.close();
        let leaks = 0;
        for (let i = 0; i < data.length; i += info.channels) {
          const d = Math.abs(data[i] - CREAM[0]) + Math.abs(data[i + 1] - CREAM[1]) + Math.abs(data[i + 2] - CREAM[2]);
          if (d <= 6) leaks++;
        }
        if (leaks > 0) ok = false;
        report.push(`${viewport.width}×${viewport.height}@${dpr}x: ${leaks} px de la página`);
      }
      return { ok, detail: report.join(" · ") };
    },
  },
  {
    name: "El borde llega curvo y se endereza al tapar",
    async run(page, { base, freeze, send }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await send(page, { type: "kp:replay" });
      const scaleAt = async (t) => {
        await freeze(page, t);
        return page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector(".lobulo.arriba")).transform).d);
      };
      const mid = await scaleAt(350);
      const end = await scaleAt(700);
      return { ok: mid > 0.05 && mid < 0.95 && end < 0.01, detail: `curva a mitad ${mid.toFixed(2)} · al llegar ${end.toFixed(2)}` };
    },
  },
  {
    name: "El texto de la cortina cambia a negro sobre un color claro",
    async run(page, { base, send }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await send(page, { type: "kp:params", params: { color: "#f5d76e" } });
      const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--t").trim());
      await send(page, { type: "kp:params", params: { color: "#1c1b19" } });
      const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--t").trim());
      return { ok: light === "#111111" && dark === "#ffffff", detail: `claro → ${light} · oscuro → ${dark}` };
    },
  },
];
