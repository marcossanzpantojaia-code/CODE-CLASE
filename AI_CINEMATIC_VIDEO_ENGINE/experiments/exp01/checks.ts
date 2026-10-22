// Comprobaciones propias de EXP-01: solo son posibles porque el material es sintético
// y conocemos su verdad (forma del círculo, orientación, velocidad del cuadrado, color).
import type { RunLog } from '../../src/core/log';
import { probe } from '../../src/core/ffprobe';
import { run } from '../../src/core/proc';
import type { Check } from '../../src/qa/qa';

type Box = { x: number; y: number; w: number; h: number };
type RGB = [number, number, number];

/** Fotogramas [from, from+count) como RGB crudo, opcionalmente recortados (fracciones del encuadre). */
export async function rawFrames(video: string, from: number, count: number, log: RunLog, crop?: Box) {
  const v = (await probe(video, log)).video!;
  const W = v.displayWidth;
  const H = v.displayHeight;
  const c = crop
    ? { x: Math.round(crop.x * W), y: Math.round(crop.y * H), w: Math.round(crop.w * W), h: Math.round(crop.h * H) }
    : { x: 0, y: 0, w: W, h: H };
  const vf = `select='between(n,${from},${from + count - 1})',crop=${c.w}:${c.h}:${c.x}:${c.y}`;
  const res = await run(
    'ffmpeg',
    ['-hide_banner', '-nostdin', '-v', 'error', '-i', video, '-vf', vf, '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { log },
  );
  const size = c.w * c.h * 3;
  const frames: Buffer[] = [];
  for (let o = 0; o + size <= res.stdout.length; o += size) frames.push(res.stdout.subarray(o, o + size));
  return { w: c.w, h: c.h, frames };
}

export function meanRgb(buf: Buffer): RGB {
  let r = 0, g = 0, b = 0;
  const n = buf.length / 3;
  for (let i = 0; i < buf.length; i += 3) {
    r += buf[i]!;
    g += buf[i + 1]!;
    b += buf[i + 2]!;
  }
  return [r / n, g / n, b / n];
}

const maxDiff = (a: RGB, b: RGB) => Math.max(...a.map((x, i) => Math.abs(x - b[i]!)));
const fmt = (c: RGB) => `(${c.map((x) => x.toFixed(0)).join(',')})`;

/** Parche superior centrado: en todos los clips de EXP-01 cae sobre fondo plano. */
export const BG_PATCH: Box = { x: 0.4, y: 0.08, w: 0.2, h: 0.05 };

export async function patchColor(video: string, frame: number, log: RunLog): Promise<RGB> {
  const { frames } = await rawFrames(video, frame, 1, log, BG_PATCH);
  if (!frames[0]) throw new Error(`No se pudo leer el fotograma ${frame} de ${video}`);
  return meanRgb(frames[0]);
}

/** El círculo amarillo debe seguir siendo un círculo (sin deformación de aspecto). */
export async function circleAspect(video: string, frame: number, log: RunLog): Promise<Check> {
  const { w, h, frames } = await rawFrames(video, frame, 1, log);
  const f = frames[0]!;
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (f[i]! > 200 && f[i + 1]! > 170 && f[i + 2]! < 90) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
  }
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const ratio = x1 < 0 ? NaN : bw / bh;
  return {
    id: 'exp-aspect', name: 'Sin deformación (círculo de S1 sigue circular)', severity: 'Crítico',
    status: Math.abs(ratio - 1) <= 0.03 ? 'PASS' : 'FAIL',
    expected: 'ancho/alto = 1.00 ± 0.03', measured: x1 < 0 ? 'círculo no encontrado' : `${bw}×${bh} px → ${ratio.toFixed(3)}`,
  };
}

/** S3 llega girado en metadatos: la banda blanca debe quedar arriba, no abajo ni en un lateral. */
export async function upright(video: string, frame: number, log: RunLog): Promise<Check> {
  const luma = async (box: Box) => {
    const { frames } = await rawFrames(video, frame, 1, log, box);
    const [r, g, b] = meanRgb(frames[0]!);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const top = await luma({ x: 0.1, y: 0, w: 0.8, h: 0.03 });
  const bottom = await luma({ x: 0.1, y: 0.97, w: 0.8, h: 0.03 });
  const left = await luma({ x: 0, y: 0.3, w: 0.03, h: 0.4 });
  const right = await luma({ x: 0.97, y: 0.3, w: 0.03, h: 0.4 });
  const ok = top > 180 && bottom < 120 && left < 120 && right < 120;
  return {
    id: 'exp-rotation', name: 'Rotación de S3 aplicada (banda arriba)', severity: 'Crítico', status: ok ? 'PASS' : 'FAIL',
    expected: 'luma arriba > 180; abajo, izquierda y derecha < 120',
    measured: `arriba ${top.toFixed(0)}, abajo ${bottom.toFixed(0)}, izq ${left.toFixed(0)}, der ${right.toFixed(0)}`,
  };
}

/**
 * Cámara lenta real: a 0.5× un original de 60 fps aporta un fotograma nuevo por fotograma de
 * salida. Si se duplicaran fotogramas, el cuadrado blanco no se movería en algunos pasos.
 */
export async function slowMotion(video: string, from: number, count: number, expectedPxPerFrame: number, log: RunLog): Promise<Check> {
  const { w, h, frames } = await rawFrames(video, from, count, log, { x: 0, y: 0.68, w: 1, h: 0.04 });
  const xs = frames.map((f) => {
    let sum = 0, n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (f[i]! > 220 && f[i + 1]! > 220 && f[i + 2]! > 220) { sum += x; n++; }
    }
    return n > 0 ? sum / n : NaN;
  });
  const deltas = xs.slice(1).map((x, i) => x - xs[i]!);
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const minD = Math.min(...deltas);
  const ok = deltas.every(Number.isFinite) && minD > expectedPxPerFrame * 0.5 && Math.abs(mean - expectedPxPerFrame) / expectedPxPerFrame < 0.1;
  return {
    id: 'exp-slowmo', name: 'Cámara lenta 0.5× sin fotogramas repetidos', severity: 'Alto', status: ok ? 'PASS' : 'FAIL',
    expected: `avance ≈ ${expectedPxPerFrame.toFixed(2)} px/fotograma, nunca ≈ 0`,
    measured: `media ${mean.toFixed(2)}, mínimo ${minD.toFixed(2)} (${deltas.length} pasos)`,
    details: { xs: xs.map((x) => Number(x.toFixed(2))) },
  };
}

export function colorCheck(id: string, name: string, a: RGB, b: RGB, tol: number, severity: Check['severity'] = 'Alto'): Check {
  const d = maxDiff(a, b);
  return {
    id, name, severity, status: d <= tol ? 'PASS' : 'FAIL',
    expected: `diferencia máx. por canal ≤ ${tol}`, measured: `${fmt(a)} vs ${fmt(b)} → ${d.toFixed(1)}`,
  };
}

export { maxDiff, fmt };
export type { RGB };
