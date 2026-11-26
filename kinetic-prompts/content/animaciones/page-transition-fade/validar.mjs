// Comprobaciones propias de «Fundido nativo entre páginas» para scripts/validar-animacion.mjs.
export const config = {
  freezeAt: 175, // a mitad del fundido de 0,35 s
  poster: { at: 175 },
  // Desde la carga: dos idas y vueltas (reposo 1,2 s + 0,35 s, cuatro veces). Empieza y acaba en reposo.
  video: { start: 0.6, seconds: 6.2 },
};

export const checks = [
  {
    name: "Usa la View Transitions API (document.startViewTransition)",
    async run(page, { base }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      const used = await page.evaluate(async () => {
        let called = false;
        const original = document.startViewTransition.bind(document);
        document.startViewTransition = (cb) => {
          called = true;
          return original(cb);
        };
        document.querySelector('nav a[href="#proyectos"]').click();
        await new Promise((r) => setTimeout(r, 600));
        return called && !document.getElementById("proyectos").hidden;
      });
      return { ok: used, detail: used ? "transición nativa y página cambiada" : "no se llamó o no cambió la página" };
    },
  },
  {
    name: "Sin soporte del navegador, el cambio de página ocurre igual",
    async run(page, { base }) {
      await page.addInitScript(() => {
        delete Document.prototype.startViewTransition;
      });
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await page.getByRole("link", { name: "Proyectos" }).first().click();
      const changed = await page.evaluate(() => !document.getElementById("proyectos").hidden);
      const focused = await page.evaluate(() => document.activeElement?.id);
      return { ok: changed && focused === "t-proyectos", detail: `página cambiada: ${changed}; foco en #${focused}` };
    },
  },
];
