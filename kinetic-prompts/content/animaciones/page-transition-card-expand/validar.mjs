// Comprobaciones propias de «Tarjeta que se convierte en página» para scripts/validar-animacion.mjs.
export const config = {
  freezeAt: 600, // final del viaje, con el texto ya entrando (se ve el escalonado)
  poster: { at: 330 }, // la imagen a mitad de camino entre tarjeta y portada
  // Desde la carga: reposo 1,2 s, abrir ~1,1 s, reposo 1,2 s, cerrar 0,7 s. Empieza y acaba en la rejilla.
  video: { start: 0.6, seconds: 4.3 },
};

const rect = (page, sel) => page.evaluate((s) => {
  const r = document.querySelector(s).getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}, sel);

export const checks = [
  {
    name: "La imagen sale de la tarjeta y termina como portada (FLIP)",
    async run(page, { base, freeze, send }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      const card = await rect(page, '.card[data-i="2"] .card-img');
      await send(page, { type: "kp:replay" });
      await freeze(page, 0);
      const start = await rect(page, ".hero-img");
      await freeze(page, 700);
      const end = await rect(page, ".hero-img");
      const near = (a, b) => Math.abs(a - b) < 2;
      const fromCard = near(start.x, card.x) && near(start.y, card.y) && near(start.w, card.w) && near(start.h, card.h);
      const isHero = end.w > card.w * 2 && near(end.x, 0);
      return { ok: fromCard && isHero, detail: `inicio ${Math.round(start.w)}×${Math.round(start.h)} en (${Math.round(start.x)}, ${Math.round(start.y)}) = tarjeta; final ${Math.round(end.w)}×${Math.round(end.h)}` };
    },
  },
  {
    name: "Clic en una tarjeta abre su página con el foco en el título; «← Proyectos» vuelve",
    async run(page, { base }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await page.getByRole("button", { name: "Ático Sur" }).click();
      await page.waitForTimeout(1500);
      const opened = await page.evaluate(() => ({ title: document.getElementById("t-detalle").textContent, focus: document.activeElement?.id, grid: document.getElementById("proyectos").hidden }));
      await page.getByRole("link", { name: "← Proyectos" }).click();
      await page.waitForTimeout(1200);
      const back = await page.evaluate(() => ({ detail: document.getElementById("detalle").hidden, focus: document.activeElement?.id }));
      const ok = opened.title === "Ático Sur" && opened.focus === "t-detalle" && opened.grid && back.detail && back.focus === "t-proyectos";
      return { ok, detail: `abierto «${opened.title}», foco #${opened.focus}; al volver, foco #${back.focus}` };
    },
  },
  {
    name: "Clics rápidos no rompen el viaje (se ignoran mientras dura)",
    async run(page, { base }) {
      await page.goto(`${base}?loop=0`, { waitUntil: "load" });
      await page.getByRole("button", { name: "Casa Lirio" }).click();
      await page.waitForTimeout(100);
      await page.evaluate(() => document.querySelector('.card[data-i="3"]').click());
      await page.waitForTimeout(1500);
      const t = await page.evaluate(() => document.getElementById("t-detalle").textContent);
      return { ok: t === "Casa Lirio", detail: `página abierta: ${t}` };
    },
  },
];
