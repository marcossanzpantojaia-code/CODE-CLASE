// Validación de una animación del catálogo (skill kp-validar).
// Uso: node scripts/validar-animacion.mjs <slug> [--sin-estado]
//
// Sirve content/animaciones/<slug>/preview con un servidor local, ejecuta las comprobaciones con
// Playwright (Chromium), graba media/loop.webm y media/loop.mp4, saca media/poster.webp y, salvo
// con --sin-estado, escribe en item.json VALIDADO o NO VERIFICADO con el motivo.
//
// Las demos animan con Web Animations o CSS, así que se pueden congelar en un instante exacto
// (document.getAnimations()). Comprobaciones propias de cada demo: content/animaciones/<slug>/validar.mjs
// (opcional), que exporta `config` ({ video: { start, seconds }, poster: { at }, freezeAt }) y
// `checks` (lista de { name, run(page, helpers) → { ok, detail } }).
import { execFileSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const sharp = require("sharp");

const slug = process.argv[2];
const writeStatus = !process.argv.includes("--sin-estado");
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Uso: node scripts/validar-animacion.mjs <slug>");
  process.exit(2);
}

const root = process.cwd();
const dir = join(root, "content", "animaciones", slug);
const previewDir = join(dir, "preview");
const mediaDir = join(dir, "media");
const capturesDir = join(root, "tests", "visual", "validacion", slug);
const itemPath = join(dir, "item.json");
const item = JSON.parse(readFileSync(itemPath, "utf8"));
const prompt = readFileSync(join(dir, "prompt.md"), "utf8");

const extraPath = join(dir, "validar.mjs");
const extra = existsSync(extraPath) ? await import(pathToFileURL(extraPath).href) : {};
const config = {
  freezeAt: 500,
  video: { start: 0.5, seconds: 6 },
  poster: { at: 500 },
  ...(extra.config ?? {}),
};

const LIMITS = { video: 600 * 1024, poster: 80 * 1024, minSeconds: 4, maxSeconds: 8 };
const SECTIONS = [
  "Objetivo visual",
  "Stack",
  "Estructura",
  "Comportamiento paso a paso",
  "Parámetros configurables",
  "Responsive",
  "Accesibilidad",
  "Rendimiento",
  "Criterios de validación",
];

/* ---------- servidor estático de preview/ ---------- */
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(previewDir, path || "index.html");
  if (!file.startsWith(previewDir) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/index.html`;

/* ---------- utilidades ---------- */
const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function freeze(page, at) {
  await page.evaluate((at) => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = at;
    }
  }, at);
  await page.waitForTimeout(80);
}

async function send(page, message) {
  await page.evaluate((m) => window.postMessage(m, "*"), message);
  await page.waitForTimeout(60);
}

const alternative = (p) => {
  if (p.type === "range") return p.default === p.max ? p.min : p.max;
  if (p.type === "color") return p.default.toLowerCase() === "#00ff00" ? "#ff00ff" : "#00ff00";
  if (p.type === "select") return p.options.find((o) => o !== p.default);
  if (p.type === "text") return `${p.default} prueba`;
  if (p.type === "palette") return p.default.map(() => "#00ff00");
  return undefined;
};

const browser = await chromium.launch();
const helpers = { freeze, send, base, config, item };

try {
  /* 1 y 2. Consola, peticiones y anchos */
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const problems = [];
    page.on(
      "console",
      (m) => ["error", "warning"].includes(m.type()) && problems.push(`${m.type()}: ${m.text()}`),
    );
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("requestfailed", (r) => problems.push(`petición fallida: ${r.url()}`));
    page.on("response", (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
    await page.goto(base, { waitUntil: "load" });
    await page.waitForTimeout(config.video.start * 1000 + config.video.seconds * 1000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    mkdirSync(capturesDir, { recursive: true });
    await page.screenshot({ path: join(capturesDir, `reposo-${viewport.width}.png`) });
    await send(page, { type: "kp:replay" });
    await freeze(page, config.poster.at);
    await page.screenshot({ path: join(capturesDir, `transicion-${viewport.width}.png`) });
    record(
      `Consola sin errores ni avisos a ${viewport.width} px`,
      problems.length === 0,
      problems.join(" | "),
    );
    record(`Sin desborde horizontal a ${viewport.width} px`, overflow <= 0, `${overflow} px`);
    await context.close();
  }

  /* 3, 4 y 7. Parámetros, repetición y propiedades animadas */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${base}?loop=0`, { waitUntil: "load" });
    await send(page, { type: "kp:replay" });
    await freeze(page, config.freezeAt);
    const baseline = await page.screenshot();
    const props = await page.evaluate(() => [
      ...new Set(
        document.getAnimations().flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))),
      ),
    ]);
    const forbidden = props.filter(
      (p) => !["transform", "opacity", "offset", "easing", "composite", "computedOffset"].includes(p),
    );
    record(
      "Solo se animan transform y opacity",
      props.length > 0 && forbidden.length === 0,
      `propiedades: ${props.join(", ") || "ninguna animación"}`,
    );

    // kp:replay a mitad de una transición vuelve al mismo fotograma que la primera vez.
    await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
    await page.waitForTimeout(300);
    await send(page, { type: "kp:replay" });
    await freeze(page, config.freezeAt);
    const again = await page.screenshot();
    record(
      "kp:replay reinicia la animación",
      Buffer.compare(baseline, again) === 0,
      "mismo fotograma tras reiniciar",
    );

    for (const p of item.params) {
      const value = alternative(p);
      await send(page, { type: "kp:params", params: { [p.id]: value } });
      await send(page, { type: "kp:replay" });
      await freeze(page, config.freezeAt);
      const changed = await page.screenshot();
      record(
        `kp:params cambia «${p.label}»`,
        Buffer.compare(baseline, changed) !== 0,
        `${p.id} = ${JSON.stringify(value)}`,
      );
      await send(page, { type: "kp:params", params: { [p.id]: p.default } });
    }

    for (const check of extra.checks ?? []) {
      const outcome = await check.run(page, helpers);
      record(check.name, outcome.ok, outcome.detail);
    }
    await context.close();
  }

  /* 6. Movimiento reducido */
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "load" });
    await page.waitForTimeout(3000);
    const running = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === "running").length,
    );
    const play = page.getByRole("button", { name: "Reproducir" });
    const playVisible = await play.isVisible().catch(() => false);
    record(
      "Con movimiento reducido queda en pausa",
      running === 0,
      `${running} animaciones en marcha tras 3 s`,
    );
    record("Con movimiento reducido ofrece «Reproducir»", playVisible);
    if (playVisible) {
      await play.click();
      await page.waitForTimeout(40); // antes de que acabe un fundido corto
      const props = await page.evaluate(() => [
        ...new Set(
          document.getAnimations().flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))),
        ),
      ]);
      const onlyFade = props.every((p) =>
        ["opacity", "offset", "easing", "composite", "computedOffset"].includes(p),
      );
      record(
        "Con movimiento reducido, «Reproducir» usa un fundido",
        props.length > 0 && onlyFade,
        props.join(", ") || "sin animación",
      );
    }
    await page.screenshot({ path: join(capturesDir, "movimiento-reducido.png") });
    await context.close();
  }

  /* 9. Prompt: plantilla completa */
  {
    const missing = SECTIONS.filter((s, i) => !new RegExp(`^## ${i + 1}\\. ${s}`, "m").test(prompt));
    record(
      "El prompt tiene las 9 secciones de la plantilla en orden",
      missing.length === 0,
      missing.join(", "),
    );
    const vars = [...new Set([...prompt.matchAll(/\{\{\s*([a-zA-Z][\w-]*)\s*\}\}/g)].map((m) => m[1]))];
    const ids = new Set([...item.params.map((p) => p.id), "title"]);
    const unknown = vars.filter((v) => !ids.has(v));
    const unused = item.params.map((p) => p.id).filter((id) => !vars.includes(id));
    record(
      "Cada {{variable}} existe en params y cada parámetro sale en el prompt",
      unknown.length + unused.length === 0,
      [...unknown.map((v) => `sin parámetro: ${v}`), ...unused.map((v) => `sin usar: ${v}`)].join(", "),
    );
  }

  /* Vídeo y póster */
  {
    rmSync(join(capturesDir, "video"), { recursive: true, force: true });
    const size = { width: 1280, height: 800 };
    const context = await browser.newContext({
      viewport: size,
      recordVideo: { dir: join(capturesDir, "video"), size },
    });
    const page = await context.newPage();
    const t0 = Date.now();
    await page.goto(base, { waitUntil: "load" });
    const loadAt = (Date.now() - t0) / 1000;
    await page.waitForTimeout((config.video.start + config.video.seconds) * 1000 + 600);
    await page.close();
    const raw = await page.video().path();
    await context.close();

    mkdirSync(mediaDir, { recursive: true });
    const start = (loadAt + config.video.start).toFixed(2);
    const seconds = config.video.seconds.toFixed(2);
    const common = ["-y", "-loglevel", "error", "-ss", start, "-t", seconds, "-i", raw, "-an", "-r", "30"];
    execFileSync("ffmpeg", [
      ...common,
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "38",
      "-row-mt",
      "1",
      "-pix_fmt",
      "yuv420p",
      join(mediaDir, "loop.webm"),
    ]);
    execFileSync("ffmpeg", [
      ...common,
      "-c:v",
      "libx264",
      "-crf",
      "27",
      "-preset",
      "slow",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      join(mediaDir, "loop.mp4"),
    ]);

    const posterContext = await browser.newContext({ viewport: size });
    const posterPage = await posterContext.newPage();
    await posterPage.goto(`${base}?loop=0`, { waitUntil: "load" });
    await send(posterPage, { type: "kp:replay" });
    await freeze(posterPage, config.poster.at);
    const png = await posterPage.screenshot();
    await sharp(png).webp({ quality: 80 }).toFile(join(mediaDir, "poster.webp"));
    await posterContext.close();

    const weights = Object.fromEntries(
      ["loop.webm", "loop.mp4", "poster.webp"].map((f) => [f, statSync(join(mediaDir, f)).size]),
    );
    const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
    const duration = Number(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        join(mediaDir, "loop.webm"),
      ]).toString(),
    );
    record(
      "Vídeo WebM de 4–8 s",
      duration >= LIMITS.minSeconds && duration <= LIMITS.maxSeconds,
      `${duration.toFixed(2)} s`,
    );
    record("Vídeo WebM < 600 KB", weights["loop.webm"] < LIMITS.video, kb(weights["loop.webm"]));
    record("Vídeo MP4 (Safari) < 600 KB", weights["loop.mp4"] < LIMITS.video, kb(weights["loop.mp4"]));
    record("Póster WebP < 80 KB", weights["poster.webp"] < LIMITS.poster, kb(weights["poster.webp"]));
    rmSync(join(capturesDir, "video"), { recursive: true, force: true });
    config.weights = Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, kb(v)]));
    config.duration = duration;
  }
} finally {
  await browser.close();
  server.close();
}

/* ---------- estado e informe ---------- */
const failed = results.filter((r) => !r.ok);
const status = failed.length === 0 ? "VALIDADO" : "NO VERIFICADO";
const today = new Date().toISOString().slice(0, 10);
const report = [
  `# Validación de ${item.title} (${slug})`,
  "",
  `Fecha: ${today} · Herramienta: scripts/validar-animacion.mjs (Playwright + Chromium) · Estado: **${status}**`,
  "",
  "| Comprobación | Resultado | Detalle |",
  "|---|---|---|",
  ...results.map((r) => `| ${r.name} | ${r.ok ? "✓" : "✗"} | ${r.detail.replace(/\|/g, "/")} |`),
  "",
  `Pesos: ${Object.entries(config.weights ?? {})
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ")}`,
  "",
  "Comprobado ejecutando la demo en Chromium. No comprobado aquí: Safari y Firefox (pendiente de prueba manual).",
  "",
].join("\n");
writeFileSync(join(dir, "VALIDACION.md"), report);

if (writeStatus) {
  item.status = status;
  if (status === "VALIDADO") delete item.statusReason;
  else item.statusReason = failed.map((f) => `${f.name}${f.detail ? ` (${f.detail})` : ""}`).join("; ");
  item.media = { video: "media/loop.webm", videoMp4: "media/loop.mp4", poster: "media/poster.webp" };
  writeFileSync(itemPath, `${JSON.stringify(item, null, 2)}\n`);
}
console.log(
  `\nEstado: ${status}${writeStatus ? " (escrito en item.json)" : ""} · ${results.length - failed.length}/${results.length} comprobaciones`,
);
process.exit(failed.length === 0 ? 0 : 1);
