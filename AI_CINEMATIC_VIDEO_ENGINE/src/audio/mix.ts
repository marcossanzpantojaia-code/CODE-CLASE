import fs from 'node:fs';
import path from 'node:path';
import type { RunLog } from '../core/log';
import type { AudioTrack, Manifest } from '../core/manifest';
import { hashOf } from '../core/hash';
import { ffmpeg } from '../core/proc';
import { dirs, ensureDir, rel, resolveFromRoot, writeJson } from '../core/project';
import type { IngestResult } from '../ingest/ingest';

const SAMPLE_RATE = 48000;
const LRA = 11;
/**
 * Margen de true peak para la codificación AAC posterior. Medido en EXP-01: un WAV a −1.00 dBTP
 * salió a −0.7 dBTP tras AAC (+0.3 dB). Se normaliza 1 dB por debajo del objetivo.
 */
export const AAC_TRUE_PEAK_HEADROOM_DB = 1;

export interface ResolvedTrack {
  track: AudioTrack;
  file: string;
  /** Segundos que ocupa en la línea de tiempo. */
  durationSec: number;
}

const n6 = (x: number) => Number(x.toFixed(6)).toString();

/** Duración efectiva de cada pista: lo que pida, sin pasar del final del montaje ni del fichero. */
export function resolveTracks(m: Manifest, ingest: IngestResult): ResolvedTrack[] {
  const fps = m.output.fps;
  const totalSec = m.output.durationInFrames / fps;
  return m.audio.map((track) => {
    const a = ingest.assets[track.asset]!;
    const start = track.at / fps;
    const available = (a.info?.durationSec ?? 0) - track.sourceIn;
    const wanted = track.frames !== undefined ? track.frames / fps : totalSec - start;
    const durationSec = Math.min(wanted, available, totalSec - start);
    if (durationSec <= 0) throw new Error(`La pista ${track.id} no tiene audio que aportar (¿sourceIn más allá del final?)`);
    return { track, file: resolveFromRoot(a.original), durationSec };
  });
}

/** Grafo de mezcla FFmpeg. Puro: los tests comprueban fades, retardos y ganancias. */
export function buildMixGraph(tracks: ResolvedTrack[], fps: number, totalSec: number): string {
  if (tracks.length === 0) return `anullsrc=r=${SAMPLE_RATE}:cl=stereo,atrim=duration=${n6(totalSec)}[mix]`;
  const parts = tracks.map(({ track: t, durationSec: d }, i) => {
    const chain = [
      `atrim=start=${n6(t.sourceIn)}:duration=${n6(d)}`,
      'asetpts=PTS-STARTPTS',
      `aresample=${SAMPLE_RATE}`,
      'aformat=sample_fmts=fltp:channel_layouts=stereo',
      `volume=${n6(t.gainDb)}dB`,
    ];
    if (t.fadeInFrames > 0) chain.push(`afade=t=in:st=0:d=${n6(t.fadeInFrames / fps)}`);
    if (t.fadeOutFrames > 0) {
      const fo = Math.min(d, t.fadeOutFrames / fps);
      chain.push(`afade=t=out:st=${n6(d - fo)}:d=${n6(fo)}`);
    }
    chain.push(`adelay=delays=${Math.round((t.at / fps) * SAMPLE_RATE)}S:all=1`);
    return `[${i}:a]${chain.join(',')}[a${i}]`;
  });
  const labels = tracks.map((_, i) => `[a${i}]`).join('');
  parts.push(
    `${labels}amix=inputs=${tracks.length}:normalize=0:dropout_transition=0,apad,atrim=duration=${n6(totalSec)}[mix]`,
  );
  return parts.join(';');
}

export interface LoudnormStats {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
  output_i?: string;
  output_tp?: string;
  normalization_type?: string;
}

export function parseLoudnormJson(stderr: string): LoudnormStats {
  const start = stderr.lastIndexOf('{');
  const end = stderr.lastIndexOf('}');
  if (start === -1 || end < start) throw new Error('loudnorm no devolvió medidas');
  return JSON.parse(stderr.slice(start, end + 1)) as LoudnormStats;
}

export interface MixResult {
  file: string;
  pass1: LoudnormStats;
  pass2: LoudnormStats;
  cached: boolean;
}

/** Mezcla las pistas del manifiesto y normaliza en dos pasadas (EBU R128) al objetivo del manifiesto. */
export async function mixAudio(m: Manifest, ingest: IngestResult, log: RunLog): Promise<MixResult> {
  const fps = m.output.fps;
  const totalSec = m.output.durationInFrames / fps;
  const tracks = resolveTracks(m, ingest);
  const key = hashOf({
    tracks: tracks.map((t) => ({ ...t.track, sha256: ingest.assets[t.track.asset]!.sha256, d: t.durationSec })),
    loudness: m.loudness,
    fps,
    totalSec,
    v: 2,
  }).slice(0, 16);
  const dir = ensureDir(path.join(dirs.cache, 'audio'));
  const out = path.join(dir, `${m.name}-${key}.wav`);
  const statsFile = `${out}.json`;
  if (fs.existsSync(out) && fs.existsSync(statsFile)) {
    const s = JSON.parse(fs.readFileSync(statsFile, 'utf8')) as { pass1: LoudnormStats; pass2: LoudnormStats };
    return { file: out, ...s, cached: true };
  }

  const inputs = tracks.flatMap((t) => ['-i', t.file]);
  const graph = buildMixGraph(tracks, fps, totalSec);
  const target = `I=${m.loudness.integratedLufs}:TP=${m.loudness.truePeakDb - AAC_TRUE_PEAK_HEADROOM_DB}:LRA=${LRA}`;

  const p1 = await ffmpeg(
    [...inputs, '-filter_complex', `${graph};[mix]loudnorm=${target}:print_format=json[out]`, '-map', '[out]', '-f', 'null', '-'],
    { log },
  );
  const pass1 = parseLoudnormJson(p1.stderr);

  const measured =
    `measured_I=${pass1.input_i}:measured_TP=${pass1.input_tp}:measured_LRA=${pass1.input_lra}` +
    `:measured_thresh=${pass1.input_thresh}:offset=${pass1.target_offset}:linear=true`;
  const tmp = `${out}.part.wav`;
  const p2 = await ffmpeg(
    [
      '-y', ...inputs,
      '-filter_complex', `${graph};[mix]loudnorm=${target}:${measured}:print_format=json,aresample=${SAMPLE_RATE}[out]`,
      '-map', '[out]', '-c:a', 'pcm_s24le', tmp,
    ],
    { log, outputs: [tmp] },
  );
  const pass2 = parseLoudnormJson(p2.stderr);
  fs.renameSync(tmp, out);
  writeJson(statsFile, { pass1, pass2 });
  log.event('audio-mix', { file: rel(out), pass1, pass2 });
  if (pass2.normalization_type !== 'linear') {
    log.warn(`loudnorm usó modo ${pass2.normalization_type ?? '?'}: la dinámica se ha comprimido para respetar el true peak`);
  }
  return { file: out, pass1, pass2, cached: false };
}
