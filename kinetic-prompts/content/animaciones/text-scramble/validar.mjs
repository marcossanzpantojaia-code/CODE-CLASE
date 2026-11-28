// Comprobaciones propias de «Texto que se descifra» para scripts/validar-animacion.mjs.
// Ciclo por defecto: 0,4 s cifrado, 1 s descifrando, 2,6 s legible (4 s).
export const config = {
  freezeAt: 900, // a mitad del descifrado
  poster: { at: 800 },
  video: { start: 2.0, seconds: 4 }, // empieza y acaba con el texto legible
  reducedPlay: "movimiento",
};

export const checks = [
  {
    name: "Accesible: se lee el texto real (aria-label) y las letras que cambian están ocultas",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      const r = await page.evaluate(() => ({ label: document.querySelector("h1").getAttribute("aria-label"), hidden: document.getElementById("letras").getAttribute("aria-hidden") }));
      return { ok: r.label === "DATOS SEGUROS" && r.hidden === "true", detail: `aria-label «${r.label}», letras aria-hidden ${r.hidden}` };
    },
  },
  {
    name: "El ancho no salta mientras cambian las letras (fuente monoespaciada)",
    async run(page, { base, freeze }) {
      await page.goto(base, { waitUntil: "load" });
      const widths = [];
      for (const t of [100, 500, 900, 1300, 2000]) {
        await freeze(page, t);
        widths.push(await page.evaluate(() => Math.round(document.getElementById("letras").getBoundingClientRect().width)));
      }
      return { ok: new Set(widths).size === 1, detail: `anchos: ${widths.join(", ")} px` };
    },
  },
  {
    name: "En una web, se descifra al pasar el ratón y termina en el texto real",
    async run(page, { base }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      const before = await page.textContent("#letras");
      await page.hover("h1");
      await page.waitForTimeout(500);
      const during = await page.textContent("#letras");
      await page.waitForTimeout(1500);
      const after = await page.textContent("#letras");
      return { ok: before === "DATOS SEGUROS" && during !== "DATOS SEGUROS" && after === "DATOS SEGUROS", detail: `antes «${before}» · durante «${during}» · después «${after}»` };
    },
  },
];
