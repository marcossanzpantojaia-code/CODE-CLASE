// Comprobaciones propias de «Objeto que une dos secciones» para scripts/validar-animacion.mjs.
// Reloj por defecto: reposo 0,6 s, ida 3 s (p de 0 a 1), meseta 0,9 s, vuelta 1 s. Total 5,5 s.
export const config = {
  freezeAt: 2940, // p = 0,78: jarra inclinada, chorro completo, panel subiendo
  poster: { at: 2820 },
  video: { start: 0.3, seconds: 5.5 },
};

async function shot(page, at, freeze) {
  await freeze(page, at);
  return page.screenshot();
}

export const checks = [
  {
    name: "Es reversible: al volver, el mismo punto del recorrido se ve igual (≤ 0,5 % de píxeles)",
    async run(page, { base, freeze, send }) {
      const sharp = (await import("sharp")).default;
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await send(page, { type: "kp:replay" });
      const ida = await shot(page, 2940, freeze);
      const vuelta = await shot(page, 4720, freeze);
      const a = await sharp(ida).raw().toBuffer({ resolveWithObject: true });
      const b = await sharp(vuelta).raw().toBuffer();
      let diff = 0;
      for (let i = 0; i < a.data.length; i += a.info.channels)
        if (Math.abs(a.data[i] - b[i]) + Math.abs(a.data[i + 1] - b[i + 1]) + Math.abs(a.data[i + 2] - b[i + 2]) > 24) diff++;
      const pct = (diff / (a.info.width * a.info.height)) * 100;
      return { ok: pct <= 0.5, detail: `${pct.toFixed(3)} % de píxeles distintos entre ida y vuelta` };
    },
  },
  {
    name: "El chorro une el pico de la jarra con la taza (±1 px)",
    async run(page, { base, freeze, send }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await send(page, { type: "kp:replay" });
      await freeze(page, 2940);
      const r = await page.evaluate(() => {
        const s = document.querySelector(".escenario").getBoundingClientRect();
        const c = (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2 - s.left, y: b.top + b.height / 2 - s.top }; };
        const path = document.getElementById("chorro");
        const start = path.getPointAtLength(0), end = path.getPointAtLength(path.getTotalLength());
        return { pico: c(document.getElementById("pico")), boca: c(document.getElementById("boca")), start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y }, opacity: getComputedStyle(path).opacity };
      });
      const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
      const ok = d(r.pico, r.start) <= 1 && d(r.boca, r.end) <= 1 && r.opacity === "1";
      return { ok, detail: `pico ${d(r.pico, r.start).toFixed(2)} px · taza ${d(r.boca, r.end).toFixed(2)} px · visible ${r.opacity === "1"}` };
    },
  },
  {
    name: "Con scroll real, el estado sigue al scroll (al 78 % la jarra está inclinada)",
    async run(page, { base }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await page.mouse.wheel(0, 10);
      await page.evaluate(() => scrollTo(0, (document.getElementById("acto").offsetHeight - innerHeight) * 0.78));
      await page.waitForTimeout(300);
      const angle = await page.evaluate(() => {
        const m = new DOMMatrix(getComputedStyle(document.getElementById("jarra")).transform);
        return (Math.atan2(m.b, m.a) * 180) / Math.PI;
      });
      return { ok: Math.abs(angle - -38) < 1, detail: `giro ${angle.toFixed(1)}°` };
    },
  },
];
