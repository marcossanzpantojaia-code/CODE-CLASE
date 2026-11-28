// Comprobaciones propias de «Olas de luz» para scripts/validar-animacion.mjs.
export const config = {
  freezeAt: 1500,
  poster: { at: 2100 },
  video: { start: 0.2, seconds: 7 },
  reducedPlay: "movimiento",
};

async function pixelDiff(a, b) {
  const sharp = (await import("sharp")).default;
  const A = await sharp(a).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).raw().toBuffer();
  let n = 0;
  for (let i = 0; i < A.data.length; i += A.info.channels)
    if (Math.abs(A.data[i] - B[i]) + Math.abs(A.data[i + 1] - B[i + 1]) + Math.abs(A.data[i + 2] - B[i + 2]) > 24) n++;
  return (n / (A.info.width * A.info.height)) * 100;
}

export const checks = [
  {
    name: "Se pinta con WebGL (no con el respaldo)",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      const ok = await page.evaluate(() => { const c = document.querySelector("canvas"); return c.width > 0 && !!c.getContext("webgl"); });
      return { ok, detail: ok ? "contexto WebGL activo" : "sin WebGL" };
    },
  },
  {
    name: "El bucle cierra: a los 7 s se ve igual que al principio (≤ 0,5 % de píxeles)",
    async run(page, { base, freeze }) {
      await page.goto(base, { waitUntil: "load" });
      await freeze(page, 0);
      const a = await page.screenshot();
      await freeze(page, 7000);
      const b = await page.screenshot();
      const pct = await pixelDiff(a, b);
      return { ok: pct <= 0.5, detail: `${pct.toFixed(3)} % de píxeles distintos` };
    },
  },
  {
    name: "Búfer reducido: como mucho el 60 % del tamaño en pantalla y 400 000 píxeles (también en 4K)",
    async run(page, { base }) {
      const sizes = [[1280, 800], [3840, 2160]];
      const out = [];
      let ok = true;
      for (const [width, height] of sizes) {
        const context = await page.context().browser().newContext({ viewport: { width, height } });
        const p = await context.newPage();
        await p.goto(base, { waitUntil: "load" });
        await p.waitForTimeout(200);
        const r = await p.evaluate(() => { const c = document.querySelector("canvas"); return { w: c.width, h: c.height, cw: c.clientWidth }; });
        await context.close();
        if (!(r.w <= Math.round(r.cw * 0.6) + 1 && r.w * r.h <= 401000)) ok = false;
        out.push(`${r.cw} px → búfer ${r.w}×${r.h} (${Math.round((r.w * r.h) / 1000)} mil px)`);
      }
      return { ok, detail: out.join(" · ") };
    },
  },
  {
    name: "Sin WebGL queda el respaldo en CSS y no hay errores",
    async run(page, { base }) {
      const context = await page.context().browser().newContext({ viewport: { width: 1280, height: 800 } });
      const p = await context.newPage();
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
          return type === "webgl" || type === "webgl2" ? null : original.call(this, type, ...rest);
        };
      });
      await p.goto(base, { waitUntil: "load" });
      const bg = await p.evaluate(() => getComputedStyle(document.querySelector(".fondo")).backgroundImage);
      await context.close();
      return { ok: errors.length === 0 && bg.includes("radial-gradient"), detail: `${errors.length} errores; fondo CSS: ${bg.includes("radial-gradient")}` };
    },
  },
  {
    name: "Aguanta la pérdida del contexto y vuelve a pintar al recuperarlo",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const ok = await page.evaluate(async () => {
        const gl = document.querySelector("canvas").getContext("webgl");
        const ext = gl.getExtension("WEBGL_lose_context");
        if (!ext) return "sin extensión";
        ext.loseContext();
        await new Promise((r) => setTimeout(r, 200));
        ext.restoreContext();
        await new Promise((r) => setTimeout(r, 400));
        return !gl.isContextLost();
      });
      return { ok: ok === true && errors.length === 0, detail: `recuperado: ${ok}; errores: ${errors.length}` };
    },
  },
];
