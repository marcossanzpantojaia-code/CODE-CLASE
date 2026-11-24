// TEST-ONLY synthetic stand-ins. They are abstract geometric silhouettes (not shoes, not product
// imagery) with known geometry, used to measure the fluid/wipe mechanics without the real photos.
// They are generated in memory and served only through Playwright route interception.
import { crc32, deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

export function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Product-space silhouette, u,v in [0,1] (v down). Bounding box is exactly the unit square. */
export const SILHOUETTE_ASPECT = 2.6;

function region(u, v) {
  if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
  if (v >= 0.8) return u >= 0.0 && u <= 1.0 ? 2 : 0; // base band, full width
  const collar = u >= 0.03 && u <= 0.4 && !(u > 0.12 && u < 0.3 && v < 0.12); // notch near the top-left
  const slope = 0.1 + ((u - 0.4) / 0.58) * 0.5; // descending top line toward the right
  const body = u > 0.4 && u <= 0.98 && v >= slope;
  if (collar || body) return v > 0.5 && v < 0.6 ? 3 : 1;
  return 0;
}

/**
 * tone: 'black' (mid-grey so it is measurable above the near-black backdrop) or 'white'.
 * pad: transparent padding as fractions { left, right, top } of the image.
 */
export function syntheticSilhouette({ width, height, tone, pad }) {
  const productW = width * (1 - pad.left - pad.right);
  const productH = productW / SILHOUETTE_ASPECT;
  const left = width * pad.left;
  const top = height * pad.top;
  if (top + productH > height) throw new Error('fixture padding leaves no room for the silhouette');
  const colors = {
    black: { 1: [112, 112, 112], 2: [100, 100, 100], 3: [132, 132, 132] },
    white: { 1: [240, 240, 240], 2: [255, 255, 255], 3: [222, 222, 222] },
    orange: { 1: [235, 110, 30], 2: [225, 95, 20], 3: [250, 140, 60] },
  }[tone];
  const rgba = Buffer.alloc(width * height * 4);
  const ss = [0.25, 0.75];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let hits = 0;
      let kind = 0;
      for (const sy of ss) {
        for (const sx of ss) {
          const r = region((x + sx - left) / productW, (y + sy - top) / productH);
          if (r) {
            hits++;
            kind = r;
          }
        }
      }
      if (!hits) continue;
      const i = (y * width + x) * 4;
      const c = colors[kind];
      rgba[i] = c[0];
      rgba[i + 1] = c[1];
      rgba[i + 2] = c[2];
      rgba[i + 3] = Math.round((hits / 4) * 255);
    }
  }
  return {
    png: encodePNG(width, height, rgba),
    width,
    height,
    product: { left, top, width: productW, height: productH },
  };
}

/** TEST-ONLY stand-in for the cover's campaign image: an abstract dark gradient, no product. */
export function syntheticCampaign(width = 1600, height = 900) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = Math.hypot((x - width / 2) / (width * 0.45), (y - height * 0.48) / (height * 0.6));
      const v = 5 + 25 * Math.exp(-d * d * 1.8);
      const i = (y * width + x) * 4;
      rgba[i] = v;
      rgba[i + 1] = v + 1;
      rgba[i + 2] = v + 3;
      rgba[i + 3] = 255;
    }
  }
  return encodePNG(width, height, rgba);
}

/** Deliberately different canvas sizes and paddings: alignment must come from uniform scale + translation. */
export function makeFixturePair() {
  return {
    black: syntheticSilhouette({ width: 1800, height: 1000, tone: 'black', pad: { left: 0.06, right: 0.1, top: 0.18 } }),
    white: syntheticSilhouette({ width: 1500, height: 960, tone: 'white', pad: { left: 0.09, right: 0.05, top: 0.25 } }),
    // Same canvas and geometry as the white, like the real orange (a recolour of the white render).
    orange: syntheticSilhouette({ width: 1500, height: 960, tone: 'orange', pad: { left: 0.09, right: 0.05, top: 0.25 } }),
  };
}

/** TEST-ONLY stand-ins for the four line-up cut-outs (black and white tones, different canvases). */
export function makeLineupFixtures() {
  return {
    'nike-air-force-1-black': syntheticSilhouette({ width: 1400, height: 600, tone: 'black', pad: { left: 0.02, right: 0.02, top: 0.04 } }),
    'nike-air-force-1-white': syntheticSilhouette({ width: 1300, height: 560, tone: 'white', pad: { left: 0.03, right: 0.02, top: 0.05 } }),
    'nike-air-max-plus-white': syntheticSilhouette({ width: 1400, height: 620, tone: 'white', pad: { left: 0.02, right: 0.03, top: 0.06 } }),
    'nike-air-max-plus-black': syntheticSilhouette({ width: 1200, height: 520, tone: 'black', pad: { left: 0.02, right: 0.02, top: 0.04 } }),
  };
}
