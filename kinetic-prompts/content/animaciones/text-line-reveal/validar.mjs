// Comprobaciones propias de «Titular que emerge por líneas» para scripts/validar-animacion.mjs.
export const config = {
  freezeAt: 900, // las primeras líneas a medio salir de su máscara
  poster: { at: 1000 },
  video: { start: 0.2, seconds: 4 },
  reducedPlay: "movimiento",
};

export const checks = [
  {
    name: "Las líneas son las reales (ninguna se parte en dos) y se rehacen al cambiar el ancho",
    async run(page, { base }) {
      const check = () =>
        page.evaluate(() => {
          const lh = parseFloat(getComputedStyle(document.querySelector("h1")).lineHeight);
          const lines = [...document.querySelectorAll(".linea > span")];
          return { n: lines.length, single: lines.every((l) => l.getBoundingClientRect().height < lh * 1.5) };
        });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(base, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // Sin el ancho máximo del titular, los cortes dependen del ancho de la pantalla.
      await page.addStyleTag({ content: "h1 { max-width: none !important; }" });
      await page.setViewportSize({ width: 1279, height: 800 });
      await page.waitForTimeout(500);
      const wide = await check();
      await page.setViewportSize({ width: 390, height: 800 });
      await page.waitForTimeout(500);
      const narrow = await check();
      await page.setViewportSize({ width: 1280, height: 800 });
      const ok = wide.single && narrow.single && narrow.n !== wide.n;
      return { ok, detail: `sin ancho máximo: 1279 px → ${wide.n} líneas · 390 px → ${narrow.n}; cada línea de una sola altura: ${wide.single && narrow.single}` };
    },
  },
  {
    name: "Accesible: el titular se lee entero (aria-label) y los trozos están ocultos",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        const pieces = [...h1.querySelectorAll(".linea")];
        return { label: h1.getAttribute("aria-label"), hidden: pieces.every((p) => p.getAttribute("aria-hidden") === "true"), wrap: getComputedStyle(h1).textWrap || "" };
      });
      const ok = r.label === "Construimos espacios que se recuerdan durante años" && r.hidden && !r.wrap.includes("balance");
      return { ok, detail: `aria-label «${r.label}»; trozos ocultos: ${r.hidden}; text-wrap: ${r.wrap || "normal"}` };
    },
  },
];
