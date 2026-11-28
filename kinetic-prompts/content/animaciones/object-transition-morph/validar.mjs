// Comprobaciones propias de «Forma que se transforma» para scripts/validar-animacion.mjs.
// Reloj por defecto: 4 figuras × (pausa 0,8 s + cambio 0,8 s) = 6,4 s, y el bucle cierra en el círculo.
const CYCLE = 6400;

export const config = {
  freezeAt: 1200, // a mitad del primer cambio (círculo → flor)
  poster: { at: 2000 }, // la flor, quieta
  video: { start: 0, seconds: 6.4 },
};

/** Puntos de paso del trazado (M y el final de cada C), en unidades del viewBox. */
const anchors = () => {
  const n = (document.getElementById("forma").getAttribute("d") || "").match(/-?\d+(\.\d+)?/g).map(Number);
  const pts = [[n[0], n[1]]];
  for (let i = 2; i + 5 < n.length; i += 6) pts.push([n[i + 4], n[i + 5]]);
  return pts.slice(0, -1); // el último C vuelve al primer punto
};

export const checks = [
  {
    name: "El bucle cierra sin salto: el primer fotograma y el del final del ciclo son iguales",
    async run(page, { base, freeze, send }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await send(page, { type: "kp:replay" });
      await freeze(page, 0);
      const a = await page.screenshot();
      await freeze(page, CYCLE);
      const b = await page.screenshot();
      return { ok: Buffer.compare(a, b) === 0, detail: "fotograma 0 frente a fotograma 6 400 ms" };
    },
  },
  {
    name: "Nunca se retuerce ni salta: contorno sin cruces y menos de 6 unidades entre fotogramas de 16 ms",
    async run(page, { base, send }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await send(page, { type: "kp:replay" });
      const r = await page.evaluate(
        async ({ cycle, anchorsSrc }) => {
          const anchors = new Function(`return (${anchorsSrc})()`);
          const raf = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
          let prev = null, maxStep = 0, crossings = 0, badCount = 0, frames = 0;
          for (let t = 0; t <= cycle; t += 16) {
            for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; }
            await raf();
            const pts = anchors();
            frames++;
            if (pts.length !== 120) badCount++;
            // Sin cruces: los ángulos de los puntos crecen siempre y dan una sola vuelta.
            let turn = 0;
            for (let i = 0; i < pts.length; i++) {
              const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
              let d = Math.atan2(y1, x1) - Math.atan2(y0, x0);
              if (d < -Math.PI) d += 2 * Math.PI;
              if (d > Math.PI) d -= 2 * Math.PI;
              if (d <= 0) crossings++;
              turn += d;
            }
            if (Math.abs(turn - 2 * Math.PI) > 1e-6) crossings++;
            // Sin saltos: cada punto tiene uno cercano en el fotograma anterior (vale aunque el círculo gire).
            if (prev)
              for (const [x, y] of pts) {
                let best = Infinity;
                for (const [u, v] of prev) best = Math.min(best, Math.hypot(x - u, y - v));
                maxStep = Math.max(maxStep, best);
              }
            prev = pts;
          }
          return { maxStep, crossings, badCount, frames };
        },
        { cycle: CYCLE, anchorsSrc: anchors.toString() },
      );
      return {
        ok: r.crossings === 0 && r.badCount === 0 && r.maxStep < 6,
        detail: `${r.frames} fotogramas · paso máximo ${r.maxStep.toFixed(2)} unidades · cruces ${r.crossings} · trazados sin 120 puntos ${r.badCount}`,
      };
    },
  },
  {
    name: "Al pulsar «Sol», la forma llega al sol (12 puntas) en menos de medio segundo y la opción queda marcada",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      await page.waitForTimeout(700);
      await page.getByRole("button", { name: "Sol" }).click();
      await page.waitForTimeout(560); // 0,45 s del cambio + el retraso del contorno
      const r = await page.evaluate((anchorsSrc) => {
        const pts = new Function(`return (${anchorsSrc})()`)();
        const radii = pts.map(([x, y]) => Math.hypot(x, y) / 78);
        let peaks = 0;
        for (let i = 0; i < radii.length; i++) {
          const a = radii[(i - 1 + radii.length) % radii.length], b = radii[i], c = radii[(i + 1) % radii.length];
          if (b > a && b >= c) peaks++;
        }
        return {
          peaks,
          min: Math.min(...radii),
          max: Math.max(...radii),
          pressed: document.querySelector('[data-forma="3"]').getAttribute("aria-pressed"),
          pause: document.getElementById("pausa").textContent,
        };
      }, anchors.toString());
      const ok = r.peaks === 12 && Math.abs(r.max - 1) < 0.02 && Math.abs(r.min - 0.72) < 0.02 && r.pressed === "true" && r.pause === "Seguir";
      return { ok, detail: `${r.peaks} puntas · radio ${r.min.toFixed(2)}–${r.max.toFixed(2)} · aria-pressed ${r.pressed} · botón «${r.pause}»` };
    },
  },
  {
    name: "«Pausar» congela el bucle y «Seguir» lo reanuda",
    async run(page, { base }) {
      await page.goto(base, { waitUntil: "load" });
      await page.waitForTimeout(500);
      const d = () => page.evaluate(() => document.getElementById("forma").getAttribute("d"));
      await page.getByRole("button", { name: "Pausar" }).click();
      const a = await d();
      await page.waitForTimeout(1700); // más que un tramo entero: sin pausa, la forma habría cambiado
      const b = await d();
      await page.getByRole("button", { name: "Seguir" }).click();
      await page.waitForTimeout(1700);
      const c = await d();
      return { ok: a === b && b !== c, detail: `en pausa ${a === b ? "quieta" : "se mueve"} · al seguir ${b !== c ? "se mueve" : "quieta"}` };
    },
  },
];
