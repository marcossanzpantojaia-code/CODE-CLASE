import { describe, expect, it } from 'vitest';
import { type ManifestInput, ManifestSchema, parseManifest, sourceSecondsUsed, visualBoundaries } from '../src/core/manifest';

function base(): ManifestInput {
  return {
    version: 1,
    name: 'test',
    output: { durationInFrames: 90 },
    assets: {
      a: { kind: 'video', path: 'a.mp4' },
      b: { kind: 'video', path: 'b.mp4' },
      m: { kind: 'audio', path: 'm.wav' },
      logo: { kind: 'image', path: 'logo.png' },
    },
    video: [
      { id: 'c1', asset: 'a', sourceIn: 0, at: 0, frames: 30 },
      { id: 'c2', asset: 'b', sourceIn: 1, at: 30, frames: 30, transitionIn: { type: 'zoom-through', frames: 8 }, syncToBeat: true },
    ],
    overlays: [{ id: 'end', type: 'logo', asset: 'logo', at: 60, frames: 30 }],
    audio: [{ id: 'music', asset: 'm', role: 'music', at: 0 }],
  };
}

const errors = (input: unknown) => {
  const r = ManifestSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('manifiesto', () => {
  it('aplica valores por defecto (1080x1920 a 30 fps, −14 LUFS, transformaciones neutras)', () => {
    const m = parseManifest(base());
    expect(m.output).toEqual({ width: 1080, height: 1920, fps: 30, durationInFrames: 90 });
    expect(m.loudness).toEqual({ integratedLufs: -14, truePeakDb: -1 });
    expect(m.video[0]!.transform).toEqual({ zoom: [[0, 1]], panX: [[0, 0]], panY: [[0, 0]], easing: 'easeInOut' });
    expect(m.video[0]!.transitionIn).toEqual({ type: 'cut' });
    expect(m.video[1]!.transitionIn).toMatchObject({ type: 'zoom-through', frames: 8, maxZoom: 1.6 });
  });

  it('rechaza referencias a assets inexistentes o del tipo equivocado', () => {
    const m = base();
    m.video[0]!.asset = 'nope';
    m.audio![0]!.asset = 'a';
    const e = errors(m);
    expect(e.some((x) => x.includes('"nope" no declarado'))).toBe(true);
    expect(e.some((x) => x.includes('es video, se esperaba audio'))).toBe(true);
  });

  it('rechaza solapes y huecos negros sin cubrir', () => {
    const overlap = base();
    overlap.video[1]!.at = 25;
    expect(errors(overlap).some((x) => x.includes('se solapa'))).toBe(true);

    const gap = base();
    gap.overlays = [];
    expect(errors(gap).some((x) => x.includes('el fotograma 60 queda en negro'))).toBe(true);
  });

  it('rechaza zoom < 1 (bordes negros) y pan fuera de [-1, 1]', () => {
    const m = base();
    m.video[0]!.transform = { zoom: [[0, 0.9]], panX: [[0, 1.5]] };
    const e = errors(m);
    expect(e).toContain('zoom entre 1 y 4');
    expect(e).toContain('panX entre -1 y 1');
  });

  it('exige keyframes con fotogramas crecientes', () => {
    const m = base();
    m.video[0]!.transform = { zoom: [[10, 1], [5, 1.2]] };
    expect(errors(m)).toContain('keyframes con fotogramas estrictamente crecientes');
  });

  it('exige que zoom-through tenga un clip anterior contiguo y quepa en ambos', () => {
    const first = base();
    first.video[0]!.transitionIn = { type: 'zoom-through', frames: 8 };
    expect(errors(first).some((x) => x.includes('clip anterior contiguo'))).toBe(true);

    const long = base();
    long.video[1]!.transitionIn = { type: 'zoom-through', frames: 30 };
    long.video[0]!.frames = 10;
    long.video[1]!.at = 10;
    long.video[1]!.frames = 50;
    expect(errors(long).some((x) => x.includes('más larga que los clips'))).toBe(true);
  });

  it('lista las fronteras visuales que QA debe encontrar', () => {
    expect(visualBoundaries(parseManifest(base()))).toEqual([
      { frame: 30, kind: 'zoom-through', id: 'c2', syncToBeat: true },
      { frame: 60, kind: 'endcard', id: 'end', syncToBeat: false },
    ]);
  });

  it('calcula los segundos de original que consume un clip con velocidad', () => {
    const m = parseManifest(base());
    expect(sourceSecondsUsed({ ...m.video[0]!, speed: 0.5 }, 30)).toBeCloseTo(0.5);
  });
});
