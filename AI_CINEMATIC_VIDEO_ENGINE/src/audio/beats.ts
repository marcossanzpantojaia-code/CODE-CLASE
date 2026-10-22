import fs from 'node:fs';
import path from 'node:path';
import type { RunLog } from '../core/log';
import { run } from '../core/proc';
import { dirs, venvPython } from '../core/project';

export interface Onset {
  t: number;
  strength: number;
}

export interface BeatAnalysis {
  tool: string;
  params: { sr: number; hop: number };
  durationSec: number;
  tempoBpm: number;
  /** Beats de librosa sin ajustar. */
  beats: number[];
  onsets: Onset[];
  rms: { hopSec: number; values: number[] };
}

export interface RefinedBeat {
  t: number;
  /** Tiempo original de beat_track. */
  rawT: number;
  snapped: boolean;
  strength: number;
}

export async function analyzeBeats(audioFile: string, log: RunLog): Promise<BeatAnalysis> {
  if (!fs.existsSync(venvPython)) {
    throw new Error('Falta el entorno Python del proyecto (.venv). Ver README: "Instalación".');
  }
  const res = await run(venvPython, ['-I', path.join(dirs.python, 'beats.py'), audioFile], { log });
  return JSON.parse(res.stdout.toString('utf8')) as BeatAnalysis;
}

/**
 * Ajusta cada beat al onset más cercano dentro de la tolerancia: beat_track da la rejilla
 * de tempo y los onsets dan la precisión temporal.
 */
export function refineBeats(beats: number[], onsets: Onset[], toleranceSec = 0.04): RefinedBeat[] {
  return beats.map((b) => {
    let best: Onset | null = null;
    for (const o of onsets) {
      if (Math.abs(o.t - b) <= toleranceSec && (!best || Math.abs(o.t - b) < Math.abs(best.t - b))) best = o;
    }
    return best ? { t: best.t, rawT: b, snapped: true, strength: best.strength } : { t: b, rawT: b, snapped: false, strength: 0 };
  });
}

export const secondsToFrame = (t: number, fps: number): number => Math.round(t * fps);

/**
 * El montador decide dónde quiere cortar; el beat solo afina: devuelve el beat más cercano
 * dentro de maxDistance fotogramas, o null si no hay ninguno (se respeta la narrativa).
 */
export function snapToBeat(desiredFrame: number, beatFrameList: number[], maxDistance: number): number | null {
  let best: number | null = null;
  for (const f of beatFrameList) {
    if (Math.abs(f - desiredFrame) <= maxDistance && (best === null || Math.abs(f - desiredFrame) < Math.abs(best - desiredFrame))) best = f;
  }
  return best;
}

/** Fotogramas de beat en [from, to), sin repetidos. */
export function beatFrames(beats: RefinedBeat[], fps: number, from = 0, to = Infinity): number[] {
  const out = new Set<number>();
  for (const b of beats) {
    const f = secondsToFrame(b.t, fps);
    if (f >= from && f < to) out.add(f);
  }
  return [...out].sort((a, b) => a - b);
}
