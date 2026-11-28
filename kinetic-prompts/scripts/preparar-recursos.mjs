// Prepara imágenes de objetos generadas con IA sobre fondo verde croma (AIIMG-001):
// recorte por llave de color, descontaminación del borde (sin halo verde), recorte al objeto,
// reducción, sombra de contacto opcional y exportación WebP con alfa.
// Uso: node scripts/preparar-recursos.mjs <entrada> <salida.webp> [--ancho 900] [--sombra]
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const [input, output] = process.argv.slice(2);
const flag = (name) => process.argv.includes(name);
const value = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? Number(process.argv[i + 1]) : fallback;
};
const width = value("--ancho", 900);

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const out = Buffer.alloc(W * H * 4);

// Llave por dominancia del verde: d = g − max(r, b). Fondo ≈ 115–180; objeto ≤ 10.
const OPAQUE = 24; // d por debajo: opaco
const CLEAR = 70; // d por encima: transparente
let minX = W,
  minY = H,
  maxX = 0,
  maxY = 0;
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  let r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  const d = g - Math.max(r, b);
  const a = d <= OPAQUE ? 1 : d >= CLEAR ? 0 : 1 - (d - OPAQUE) / (CLEAR - OPAQUE);
  // Descontaminación: en el borde se quita el verde sobrante (despill), así no queda halo.
  if (d > 0) g = Math.max(r, b);
  out[j] = r;
  out[j + 1] = g;
  out[j + 2] = b;
  out[j + 3] = Math.round(a * 255);
  if (a > 0.5) {
    const x = (j / 4) % W,
      y = Math.floor(j / 4 / W);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

const margin = 8;
const crop = {
  left: Math.max(0, minX - margin),
  top: Math.max(0, minY - margin),
  width: Math.min(W, maxX + margin + 1) - Math.max(0, minX - margin),
  height: Math.min(H, maxY + margin + 1) - Math.max(0, minY - margin),
};
let image = sharp(out, { raw: { width: W, height: H, channels: 4 } }).extract(crop);

// Sombra de contacto horneada debajo del objeto (elipse difuminada), en el mismo archivo.
let extraBottom = 0;
if (flag("--sombra")) {
  extraBottom = Math.round(crop.height * 0.08);
  const sw = Math.round(crop.width * 0.8),
    sh = Math.round(crop.height * 0.07);
  const shadow = Buffer.from(
    `<svg width="${crop.width}" height="${crop.height + extraBottom}"><defs><filter id="f"><feGaussianBlur stdDeviation="${sh / 2.5}"/></filter></defs>` +
      `<ellipse cx="${crop.width * 0.44}" cy="${crop.height - sh * 0.15}" rx="${sw / 2}" ry="${sh / 2}" fill="black" opacity="0.38" filter="url(#f)"/></svg>`,
  );
  const object = await image.png().toBuffer();
  image = sharp({
    create: {
      width: crop.width,
      height: crop.height + extraBottom,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: shadow }, { input: object, top: 0, left: 0 }]);
  image = sharp(await image.png().toBuffer());
}

const finalW = Math.min(width, crop.width);
await image
  .resize({ width: finalW, kernel: "lanczos3" })
  .webp({ quality: 86, alphaQuality: 90, effort: 6 })
  .toFile(output);

// Anclas en % del recurso final: pico (punto más a la izquierda del tercio superior) y
// superficie del líquido (centroide de los píxeles muy oscuros del tercio superior).
const fullH = crop.height + extraBottom;
let spout = null,
  sx = 0,
  sy = 0,
  n = 0;
for (let y = crop.top; y < crop.top + crop.height * 0.4; y++) {
  for (let x = crop.left; x < crop.left + crop.width; x++) {
    const j = (y * W + x) * 4;
    if (out[j + 3] > 200) {
      if (!spout || x < spout.x) spout = { x, y };
      if (out[j] < 60 && out[j + 1] < 50 && out[j + 2] < 45) {
        sx += x;
        sy += y;
        n++;
      }
    }
  }
}
const pct = (x, y) => ({
  x: +(((x - crop.left) / crop.width) * 100).toFixed(2),
  y: +(((y - crop.top) / fullH) * 100).toFixed(2),
});
const meta = await sharp(output).metadata();
console.log(
  JSON.stringify({
    salida: output,
    tamano: `${meta.width}x${meta.height}`,
    pico: spout ? pct(spout.x, spout.y) : null,
    liquido: n ? pct(sx / n, sy / n) : null,
  }),
);
