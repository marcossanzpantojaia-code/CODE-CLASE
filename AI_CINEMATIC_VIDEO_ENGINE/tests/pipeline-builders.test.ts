import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { beatFrames, refineBeats } from '../src/audio/beats';
import { buildMixGraph, parseLoudnormJson, type ResolvedTrack } from '../src/audio/mix';
import { parseProbe, type VideoInfo } from '../src/core/ffprobe';
import { hashOf, stableStringify } from '../src/core/hash';
import { parseManifest } from '../src/core/manifest';
import { ProtectedPathError, ROOT, assertWritable } from '../src/core/project';
import { TONEMAP_CHAIN, buildMezzanineArgs, standardRate } from '../src/ingest/ingest';
import { parseSceneChanges, parseSignalStats } from '../src/qa/qa';

const video = (o: Partial<VideoInfo>): VideoInfo => ({
  codec: 'h264', width: 1080, height: 1920, displayWidth: 1080, displayHeight: 1920, rotation: 0, fps: 30, fpsFraction: '30/1',
  avgFps: 30, vfrSuspect: false, pixFmt: 'yuv420p', bitDepth: 8, colorTransfer: 'bt709', colorPrimaries: 'bt709', colorSpace: 'bt709',
  hdr: false, sar: '1:1', frameCount: null, ...o,
});
const OUT = { width: 1080, height: 1920 };
const vfOf = (args: string[]) => args[args.indexOf('-vf') + 1]!;

describe('protección de originales', () => {
  it('bloquea cualquier escritura bajo assets/', () => {
    expect(() => assertWritable('assets/originals/x.mp4')).toThrow(ProtectedPathError);
    expect(() => assertWritable(path.join(ROOT, 'assets'))).toThrow(ProtectedPathError);
    expect(() => assertWritable('cache/../assets/music/a.wav')).toThrow(ProtectedPathError);
    expect(assertWritable('cache/x.mp4')).toBe(path.join(ROOT, 'cache', 'x.mp4'));
    expect(assertWritable('assets-backup/x')).toBe(path.join(ROOT, 'assets-backup', 'x'));
  });
});

describe('intermedio (mezzanine)', () => {
  it('convierte HDR HLG con tonemap y etiqueta BT.709', () => {
    const { args, notes } = buildMezzanineArgs('in.mp4', 'out.mp4', video({ hdr: true, colorTransfer: 'arib-std-b67' }), OUT);
    expect(vfOf(args)).toContain(TONEMAP_CHAIN);
    expect(args).toEqual(expect.arrayContaining(['-color_trc', 'bt709', '-colorspace', 'bt709']));
    expect(notes.join(' ')).toContain('HDR');
  });

  it('conforma VFR a la frecuencia estándar más cercana en CFR', () => {
    const { args, notes } = buildMezzanineArgs('in.mp4', 'out.mp4', video({ fps: 30, avgFps: 29.83, vfrSuspect: true }), OUT);
    expect(args.slice(args.indexOf('-fps_mode'), args.indexOf('-fps_mode') + 4)).toEqual(['-fps_mode', 'cfr', '-r', '30000/1001']);
    expect(notes.join(' ')).toContain('VFR');
    expect(standardRate(59.9).fraction).toBe('60000/1001');
    expect(standardRate(25.02).fraction).toBe('25/1');
  });

  it('reduce un 4K vertical a 2× lo necesario y avisa si el original es más pequeño que el encuadre', () => {
    const big = buildMezzanineArgs('in.mp4', 'o.mp4', video({ width: 4320, height: 7680, displayWidth: 4320, displayHeight: 7680 }), OUT);
    expect(vfOf(big.args)).toContain('scale=2160:3840:flags=lanczos');
    const small = buildMezzanineArgs('in.mp4', 'o.mp4', video({ width: 720, height: 1280, displayWidth: 720, displayHeight: 1280 }), OUT);
    expect(small.notes.join(' ')).toContain('pérdida de nitidez');
  });

  it('corrige píxeles no cuadrados', () => {
    const { args } = buildMezzanineArgs('in.mp4', 'o.mp4', video({ sar: '4:3' }), OUT);
    expect(vfOf(args)).toMatch(/^scale=iw\*sar:ih,setsar=1/);
  });
});

describe('ffprobe', () => {
  it('interpreta rotación, HDR, VFR y profundidad de bits', () => {
    const info = parseProbe({
      format: { duration: '3.0', format_name: 'mov', size: '100' },
      streams: [
        {
          codec_type: 'video', codec_name: 'hevc', width: 1920, height: 1080, r_frame_rate: '30/1', avg_frame_rate: '2900/100',
          pix_fmt: 'yuv420p10le', color_transfer: 'arib-std-b67', side_data_list: [{ rotation: -90 }],
        },
        { codec_type: 'audio', codec_name: 'aac', sample_rate: '48000', channels: 2 },
      ],
    });
    expect(info.video).toMatchObject({ displayWidth: 1080, displayHeight: 1920, hdr: true, vfrSuspect: true, bitDepth: 10 });
    expect(info.audio).toEqual({ codec: 'aac', sampleRate: 48000, channels: 2 });
  });
});

describe('audio', () => {
  const m = parseManifest({
    version: 1, name: 't', output: { durationInFrames: 300 },
    assets: { v: { kind: 'video', path: 'v.mp4' }, mu: { kind: 'audio', path: 'm.wav' }, fx: { kind: 'audio', path: 'f.wav' } },
    video: [{ id: 'c', asset: 'v', sourceIn: 0, at: 0, frames: 300 }],
    audio: [
      { id: 'music', asset: 'mu', role: 'music', at: 0, sourceIn: 2, fadeInFrames: 15, fadeOutFrames: 30, gainDb: -3 },
      { id: 'fx', asset: 'fx', role: 'sfx', at: 45 },
    ],
  });
  const tracks: ResolvedTrack[] = [
    { track: m.audio[0]!, file: 'm.wav', durationSec: 10 },
    { track: m.audio[1]!, file: 'f.wav', durationSec: 0.5 },
  ];

  it('construye la mezcla con recorte, ganancia, fades y retardo exacto en muestras', () => {
    const g = buildMixGraph(tracks, 30, 10);
    expect(g).toContain('[0:a]atrim=start=2:duration=10');
    expect(g).toContain('volume=-3dB');
    expect(g).toContain('afade=t=in:st=0:d=0.5');
    expect(g).toContain('afade=t=out:st=9:d=1');
    expect(g).toContain('[1:a]atrim=start=0:duration=0.5');
    expect(g).toContain('adelay=delays=72000S:all=1'); // 45 fotogramas a 30 fps = 1.5 s = 72000 muestras
    expect(g).toMatch(/\[a0\]\[a1\]amix=inputs=2:normalize=0.*atrim=duration=10\[mix\]$/);
  });

  it('genera silencio de la duración exacta si no hay pistas', () => {
    expect(buildMixGraph([], 30, 4)).toBe('anullsrc=r=48000:cl=stereo,atrim=duration=4[mix]');
  });

  it('lee las medidas JSON de loudnorm al final del log de FFmpeg', () => {
    const s = parseLoudnormJson('ruido {no}\n[Parsed_loudnorm_0]\n{\n "input_i" : "-20.1",\n "input_tp" : "-3.0",\n "input_lra" : "2.0",\n "input_thresh" : "-30.0",\n "target_offset" : "0.1"\n}\n');
    expect(s.input_i).toBe('-20.1');
  });

  it('ajusta beats al onset más cercano dentro de la tolerancia', () => {
    const r = refineBeats([1.0, 2.0, 3.0], [{ t: 0.99, strength: 1 }, { t: 2.1, strength: 1 }, { t: 3.02, strength: 0.5 }]);
    expect(r.map((x) => [x.t, x.snapped])).toEqual([[0.99, true], [2.0, false], [3.02, true]]);
    expect(beatFrames(r, 30)).toEqual([30, 60, 91]);
    expect(beatFrames(r, 30, 31, 90)).toEqual([60]);
  });
});

describe('QA: parseo de salidas de FFmpeg', () => {
  it('extrae cambios de plano de scdet con su fotograma', () => {
    const dump = 'frame:0    pts:0 pts_time:0\nlavfi.scd.mafd=0\nlavfi.scd.score=0\nframe:45   pts:23040 pts_time:1.5\nlavfi.scd.mafd=30\nlavfi.scd.score=20.9\nlavfi.scd.time=1.5\n';
    expect(parseSceneChanges(dump)).toEqual([{ frame: 45, time: 1.5, score: 20.9 }]);
  });

  it('extrae negros, congelados, silencios y sonoridad', () => {
    const err = [
      '[blackdetect @ 0x1] black_start:8.2 black_end:8.4 black_duration:0.2',
      '[freezedetect @ 0x2] lavfi.freezedetect.freeze_start: 8.6',
      '[freezedetect @ 0x2] lavfi.freezedetect.freeze_end: 9.8',
      '[silencedetect @ 0x3] silence_start: 1.5',
      '[silencedetect @ 0x3] silence_end: 2.5 | silence_duration: 1',
      '[Parsed_ebur128_1 @ 0x4] Summary:', '  Integrated loudness:', '    I:         -14.2 LUFS', '  True peak:', '    Peak:       -1.4 dBFS',
    ].join('\n');
    expect(parseSignalStats(err, 10)).toEqual({
      black: [[8.2, 8.4]], freeze: [[8.6, 9.8]], silence: [[1.5, 2.5]], integratedLufs: -14.2, truePeakDb: -1.4,
    });
  });
});

describe('hash estable', () => {
  it('no depende del orden de las claves', () => {
    expect(stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
    expect(hashOf({ x: 1, y: 2 })).toBe(hashOf({ y: 2, x: 1 }));
  });
});

describe('QA: verificación de cortes y sincronía', () => {
  it('exige el pico de diferencia exactamente en el fotograma del corte', async () => {
    const { verifyBoundary } = await import('../src/qa/qa');
    const d = [0, 1, 1.2, 0.9, 30, 1.1, 1, 0.8];
    expect(verifyBoundary(d, 4)).toEqual({ peakFrame: 4, prominence: 30 / 1 });
    expect(verifyBoundary(d, 3).peakFrame).toBe(4); // un corte un fotograma antes del real se detecta
    const flat = [0, 1, 1, 1, 1.2, 1, 1];
    expect(verifyBoundary(flat, 4).prominence).toBeLessThan(2); // corte indistinguible → WARN
  });

  it('encuentra el desfase entre dos señales por correlación', async () => {
    const { bestLag } = await import('../src/qa/qa');
    const a = new Float32Array(2000).map((_, i) => Math.sin(i * 0.37) + (i % 97 === 0 ? 3 : 0));
    const b = new Float32Array(2000);
    b.set(a.subarray(0, 1990), 10); // b retrasada 10 muestras
    expect(bestLag(a, b, 40)).toMatchObject({ lag: 10 });
    expect(bestLag(a, a, 40)).toMatchObject({ lag: 0 });
  });

  it('ajusta un corte deseado al beat más cercano solo dentro del margen', async () => {
    const { snapToBeat } = await import('../src/audio/beats');
    expect(snapToBeat(54, [0, 9, 24, 39, 54, 69], 6)).toBe(54);
    expect(snapToBeat(50, [39, 54], 6)).toBe(54);
    expect(snapToBeat(44, [39, 54], 6)).toBe(39);
    expect(snapToBeat(46, [39, 54], 6)).toBeNull(); // 7 y 8 fotogramas: fuera del margen
    expect(snapToBeat(100, [39, 54], 6)).toBeNull(); // sin beat cerca: se respeta el corte narrativo
  });
});
