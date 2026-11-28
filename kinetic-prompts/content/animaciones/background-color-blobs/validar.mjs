// Comprobaciones propias de «Manchas de color en movimiento» para scripts/validar-animacion.mjs.
// Con los valores por defecto, cada ida dura 3,5 s y el bucle completo (ida y vuelta), 7 s.
export const config = {
  freezeAt: 1500,
  poster: { at: 1500 },
  video: { start: 0.2, seconds: 7 },
  reducedPlay: "movimiento",
};

export const checks = [
  {
    name: "Sin filtros: el difuminado está en el degradado (FONDO-001)",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      const filters = await page.evaluate(() =>
        [...document.querySelectorAll(".mancha")].map((el) => getComputedStyle(el).filter).filter((f) => f !== "none"),
      );
      return { ok: filters.length === 0, detail: filters.length ? filters.join(", ") : "ninguna mancha con filter" };
    },
  },
  {
    name: "El fondo no captura clics ni lo leen los lectores de pantalla",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      const r = await page.evaluate(() => {
        const f = document.querySelector(".fondo");
        return { events: getComputedStyle(f).pointerEvents, hidden: f.getAttribute("aria-hidden") };
      });
      return { ok: r.events === "none" && r.hidden === "true", detail: `pointer-events ${r.events}, aria-hidden ${r.hidden}` };
    },
  },
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
];
