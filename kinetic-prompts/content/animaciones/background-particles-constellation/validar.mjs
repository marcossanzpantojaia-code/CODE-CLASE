// Comprobaciones propias de «Constelación de partículas» para scripts/validar-animacion.mjs.
// El movimiento es periódico: el bucle dura 7 s y cierra exacto.
export const config = {
  freezeAt: 1500,
  poster: { at: 1500 },
  video: { start: 0.2, seconds: 7 },
  reducedPlay: "movimiento",
};

export const checks = [
  {
    name: "El bucle cierra: a los 7 s se ve igual que al principio",
    async run(page, { base, freeze }) {
      await page.goto(base, { waitUntil: "load" });
      await freeze(page, 0);
      const a = await page.screenshot();
      await freeze(page, 7000);
      const b = await page.screenshot();
      return { ok: Buffer.compare(a, b) === 0, detail: "fotograma 0 s = fotograma 7 s" };
    },
  },
  {
    name: "Nítido en pantallas de alta densidad (lienzo a 2× con DPR 2)",
    async run(page, { base }) {
      const context = await page.context().browser().newContext({ viewport: { width: 800, height: 500 }, deviceScaleFactor: 2 });
      const p = await context.newPage();
      await p.goto(base, { waitUntil: "load" });
      const r = await p.evaluate(() => { const c = document.querySelector("canvas"); return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight }; });
      await context.close();
      return { ok: r.w === r.cw * 2 && r.h === r.ch * 2, detail: `lienzo ${r.w}×${r.h} para ${r.cw}×${r.ch} px CSS` };
    },
  },
  {
    name: "Las partículas se apartan del cursor",
    async run(page, { base, freeze }) {
      await page.goto(base, { waitUntil: "load" });
      await freeze(page, 1500);
      const before = await page.screenshot();
      await page.mouse.move(640, 400);
      await page.waitForTimeout(120);
      const after = await page.screenshot();
      return { ok: Buffer.compare(before, after) !== 0, detail: "el fotograma cambia al mover el ratón al centro" };
    },
  },
  {
    name: "El lienzo no captura clics ni lo leen los lectores de pantalla",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      const r = await page.evaluate(() => { const c = document.querySelector("canvas"); return { events: getComputedStyle(c).pointerEvents, hidden: c.getAttribute("aria-hidden") }; });
      return { ok: r.events === "none" && r.hidden === "true", detail: `pointer-events ${r.events}, aria-hidden ${r.hidden}` };
    },
  },
];
