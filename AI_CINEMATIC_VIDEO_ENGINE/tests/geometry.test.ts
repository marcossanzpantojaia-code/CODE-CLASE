import { describe, expect, it } from 'vitest';
import { parseManifest, type VideoClip } from '../src/core/manifest';
import { clipLayout, coverScale, transitionFx, valueAt } from '../src/remotion/geometry';

const OUT = { width: 1080, height: 1920 };

function clips(transform: object = {}): [VideoClip, VideoClip] {
  const m = parseManifest({
    version: 1,
    name: 't',
    output: { durationInFrames: 60 },
    assets: { a: { kind: 'video', path: 'a.mp4' } },
    video: [
      { id: 'c1', asset: 'a', sourceIn: 0, at: 0, frames: 30, transform },
      { id: 'c2', asset: 'a', sourceIn: 0, at: 30, frames: 30, transitionIn: { type: 'zoom-through', frames: 8, maxZoom: 1.6, blurPx: 10 } },
    ],
  });
  return [m.video[0]!, m.video[1]!];
}

describe('geometría', () => {
  it('cover escala de forma uniforme: un 16:9 cubre un 9:16 sin deformar', () => {
    const s = coverScale(1920, 1080, 1080, 1920);
    expect(s).toBeCloseTo(1920 / 1080);
    expect((1920 * s) / (1080 * s)).toBeCloseTo(1920 / 1080);
  });

  it('interpola keyframes con easing y se mantiene constante fuera del rango', () => {
    const kf: [number, number][] = [[10, 1], [20, 2]];
    expect(valueAt(kf, 0, 'linear')).toBe(1);
    expect(valueAt(kf, 15, 'linear')).toBeCloseTo(1.5);
    expect(valueAt(kf, 15, 'easeInOut')).toBeCloseTo(1.5);
    expect(valueAt(kf, 12, 'easeIn')).toBeLessThan(valueAt(kf, 12, 'linear'));
    expect(valueAt(kf, 99, 'linear')).toBe(2);
  });

  it('nunca deja bordes vacíos: con cualquier zoom ≥ 1 y pan en [-1, 1] el plano cubre el encuadre', () => {
    for (const src of [{ width: 1920, height: 1080 }, { width: 1080, height: 1920 }, { width: 3840, height: 2160 }]) {
      for (const zoom of [1, 1.07, 1.5, 2]) {
        for (const pan of [-1, -0.3, 0, 0.6, 1]) {
          const [c1] = clips({ zoom: [[0, zoom]], panX: [[0, pan]], panY: [[0, -pan]] });
          const l = clipLayout(c1, undefined, 5, src, OUT);
          const halfW = (l.width * l.scale) / 2;
          const halfH = (l.height * l.scale) / 2;
          // Bordes del plano en coordenadas del encuadre (centro en el centro del encuadre + desplazamiento).
          expect(OUT.width / 2 + l.offsetX - halfW).toBeLessThanOrEqual(1e-6);
          expect(OUT.width / 2 + l.offsetX + halfW).toBeGreaterThanOrEqual(OUT.width - 1e-6);
          expect(OUT.height / 2 + l.offsetY - halfH).toBeLessThanOrEqual(1e-6);
          expect(OUT.height / 2 + l.offsetY + halfH).toBeGreaterThanOrEqual(OUT.height - 1e-6);
        }
      }
    }
  });

  it('pan = 1 muestra el borde derecho del plano', () => {
    const [c1] = clips({ zoom: [[0, 1]], panX: [[0, 1]] });
    const l = clipLayout(c1, undefined, 0, { width: 1920, height: 1080 }, OUT);
    expect(OUT.width / 2 + l.offsetX + (l.width * l.scale) / 2).toBeCloseTo(OUT.width);
  });

  it('zoom-through: máximo a ambos lados del corte y neutro fuera de la transición', () => {
    const [c1, c2] = clips();
    expect(transitionFx(c1, c2, 25)).toEqual({ extraZoom: 1, blurPx: 0 }); // antes de los últimos 4
    expect(transitionFx(c1, c2, 29)).toEqual({ extraZoom: 1.6, blurPx: 10 }); // último fotograma del saliente
    expect(transitionFx(c2, undefined, 0)).toEqual({ extraZoom: 1.6, blurPx: 10 }); // primero del entrante
    expect(transitionFx(c2, undefined, 4)).toEqual({ extraZoom: 1, blurPx: 0 });
    const ramp = [26, 27, 28, 29].map((f) => transitionFx(c1, c2, f).extraZoom);
    expect(ramp).toEqual([...ramp].sort((a, b) => a - b)); // acelera de forma monótona
  });
});
