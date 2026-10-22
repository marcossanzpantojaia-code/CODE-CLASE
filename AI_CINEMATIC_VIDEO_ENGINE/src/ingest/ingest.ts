import fs from 'node:fs';
import path from 'node:path';
import type { RunLog } from '../core/log';
import type { Manifest } from '../core/manifest';
import { sourceSecondsUsed } from '../core/manifest';
import { hashOf, sha256File } from '../core/hash';
import { type MediaInfo, type VideoInfo, probe } from '../core/ffprobe';
import { ffmpeg } from '../core/proc';
import { ProtectedPathError, dirs, ensureDir, rel, resolveFromRoot, writeJson } from '../core/project';

/**
 * Única vía sancionada para meter un fichero en assets/: copia sin sobrescribir nunca,
 * lo marca como solo lectura y devuelve su sha256.
 */
export async function importOriginal(src: string, destRelToAssets: string): Promise<{ path: string; sha256: string }> {
  const dest = path.resolve(dirs.assets, destRelToAssets);
  if (!dest.startsWith(dirs.assets + path.sep)) throw new ProtectedPathError(`Destino fuera de assets/: ${destRelToAssets}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(dest, 0o444);
  return { path: rel(dest), sha256: await sha256File(dest) };
}

/** Receta del intermedio. Cambiar MEZZANINE_RECIPE invalida la caché. */
export const MEZZANINE_RECIPE = {
  version: 2,
  crf: 14,
  preset: 'medium',
  gopSeconds: 0.5,
  /** El intermedio conserva hasta 2× la resolución que exige cubrir el encuadre: zoom 2× sin reescalar. */
  maxCoverFactor: 2,
  tonemap: 'mobius-0.8',
} as const;

const STANDARD_RATES: [number, string][] = [
  [24000 / 1001, '24000/1001'],
  [24, '24/1'],
  [25, '25/1'],
  [30000 / 1001, '30000/1001'],
  [30, '30/1'],
  [48, '48/1'],
  [50, '50/1'],
  [60000 / 1001, '60000/1001'],
  [60, '60/1'],
  [100, '100/1'],
  [120000 / 1001, '120000/1001'],
  [120, '120/1'],
  [240, '240/1'],
];

/** Frecuencia estándar más cercana (los móviles graban VFR alrededor de una nominal). */
export function standardRate(fps: number): { fps: number; fraction: string } {
  let best = STANDARD_RATES[0]!;
  for (const r of STANDARD_RATES) if (Math.abs(r[0] - fps) < Math.abs(best[0] - fps)) best = r;
  return { fps: best[0], fraction: best[1] };
}

const even = (n: number) => Math.max(2, 2 * Math.round(n / 2));

/**
 * HDR → SDR BT.709. npl=203 alinea el blanco de referencia HDR (BT.2408: 203 nits, 75 % de
 * señal HLG) con el blanco SDR; mobius deja intacto todo lo que está por debajo del 80 % y solo
 * comprime las altas luces hasta el pico (1000/203). Medido en EXP-01 frente a la alternativa
 * hable, que oscurecía todo el plano (blanco a 158/255): docs/FASE_2_INFRAESTRUCTURA.md.
 */
export const TONEMAP_CHAIN =
  'zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,' +
  'tonemap=tonemap=mobius:param=0.8:desat=0:peak=4.926,zscale=t=bt709:m=bt709:r=tv';

/** Construye los argumentos FFmpeg del intermedio. Puro: testeable sin ejecutar nada. */
export function buildMezzanineArgs(
  input: string,
  output: string,
  v: VideoInfo,
  out: { width: number; height: number },
): { args: string[]; notes: string[]; rate: { fps: number; fraction: string } } {
  const notes: string[] = [];
  const filters: string[] = [];

  // La rotación la aplica el decodificador de FFmpeg (autorotate) antes de estos filtros.
  if (v.rotation !== 0) notes.push(`rotación ${v.rotation}° aplicada`);
  if (v.sar !== '1:1' && v.sar !== '0:1' && v.sar !== 'N/A') {
    filters.push('scale=iw*sar:ih', 'setsar=1');
    notes.push(`píxeles no cuadrados (SAR ${v.sar}) corregidos`);
  }

  if (v.hdr) {
    filters.push(TONEMAP_CHAIN);
    notes.push(`HDR (${v.colorTransfer}) convertido a SDR BT.709 con tonemap ${MEZZANINE_RECIPE.tonemap}`);
  } else if (v.colorSpace === 'smpte170m' || v.colorSpace === 'bt470bg') {
    filters.push('colorspace=all=bt709');
    notes.push(`matriz ${v.colorSpace} convertida a BT.709`);
  } else if (!v.colorSpace || v.colorSpace === 'unknown') {
    notes.push('sin etiquetas de color: se asume BT.709');
  }

  const cover = Math.max(out.width / v.displayWidth, out.height / v.displayHeight);
  const k = cover * MEZZANINE_RECIPE.maxCoverFactor;
  if (k < 1) {
    filters.push(`scale=${even(v.displayWidth * k)}:${even(v.displayHeight * k)}:flags=lanczos`);
    notes.push(`reducido a ${MEZZANINE_RECIPE.maxCoverFactor}× la resolución necesaria`);
  } else if (v.displayWidth % 2 || v.displayHeight % 2) {
    filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');
  }
  if (cover > 1) notes.push(`AVISO: el original es más pequeño que el encuadre: se ampliará ${cover.toFixed(2)}× (pérdida de nitidez)`);
  filters.push('format=yuv420p');

  const rate = standardRate(v.avgFps || v.fps);
  if (v.vfrSuspect) notes.push(`VFR (media ${v.avgFps.toFixed(3)} fps) conformado a CFR ${rate.fraction}`);
  const gop = String(Math.max(1, Math.round(rate.fps * MEZZANINE_RECIPE.gopSeconds)));

  const args = [
    '-y', '-i', input,
    '-map', '0:v:0', '-an', '-sn', '-dn',
    '-vf', filters.join(','),
    '-fps_mode', 'cfr', '-r', rate.fraction,
    '-c:v', 'libx264', '-preset', MEZZANINE_RECIPE.preset, '-crf', String(MEZZANINE_RECIPE.crf),
    '-g', gop, '-keyint_min', gop, '-sc_threshold', '0', '-bf', '0',
    '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart',
    output,
  ];
  return { args, notes, rate };
}

export interface IngestedAsset {
  assetId: string;
  kind: 'video' | 'audio' | 'image';
  original: string;
  sha256: string;
  info: MediaInfo | null;
  notes: string[];
  /** Solo vídeo: intermedio normalizado que usa la composición. */
  mezzanine?: string;
  mezzanineInfo?: { width: number; height: number; fps: number; durationSec: number };
}

export interface IngestResult {
  manifest: string;
  assets: Record<string, IngestedAsset>;
}

export async function ingest(m: Manifest, log: RunLog): Promise<IngestResult> {
  const mezzDir = ensureDir(path.join(dirs.cache, 'mezzanine'));
  const assets: Record<string, IngestedAsset> = {};

  for (const [assetId, asset] of Object.entries(m.assets)) {
    const original = resolveFromRoot(asset.path);
    if (!fs.existsSync(original)) throw new Error(`Falta el fichero del asset "${assetId}": ${asset.path}`);
    const sha256 = await sha256File(original);
    // ffprobe lee PNG/JPG pero no SVG: para imágenes la sonda es opcional.
    const info = asset.kind === 'image' ? await probe(original, log).catch(() => null) : await probe(original, log);
    const entry: IngestedAsset = { assetId, kind: asset.kind, original: rel(original), sha256, info, notes: [] };

    if (asset.kind === 'video') {
      if (!info?.video) throw new Error(`El asset "${assetId}" no contiene vídeo`);
      const key = hashOf({ sha256, recipe: MEZZANINE_RECIPE, w: m.output.width, h: m.output.height }).slice(0, 16);
      const mezz = path.join(mezzDir, `${assetId}-${key}.mp4`);
      const { args, notes } = buildMezzanineArgs(original, mezz, info.video, m.output);
      entry.notes.push(...notes);
      if (!fs.existsSync(mezz)) {
        const tmp = `${mezz}.part.mp4`;
        await ffmpeg(args.map((a) => (a === mezz ? tmp : a)), { log, outputs: [tmp] });
        fs.renameSync(tmp, mezz);
      } else {
        entry.notes.push('intermedio reutilizado de caché');
      }
      const mi = await probe(mezz, log);
      entry.mezzanine = rel(mezz);
      entry.mezzanineInfo = { width: mi.video!.width, height: mi.video!.height, fps: mi.video!.fps, durationSec: mi.durationSec };
    }
    assets[assetId] = entry;
    log.event('ingest', { assetId, notes: entry.notes, mezzanine: entry.mezzanine });
  }

  // Cada clip debe caber en su original.
  for (const clip of m.video) {
    const a = assets[clip.asset]!;
    const available = a.mezzanineInfo!.durationSec;
    const needed = clip.sourceIn + sourceSecondsUsed(clip, m.output.fps);
    if (needed > available + 1e-6) {
      throw new Error(`El clip ${clip.id} necesita hasta ${needed.toFixed(3)} s pero "${clip.asset}" dura ${available.toFixed(3)} s`);
    }
    if (clip.speed < 1 && a.mezzanineInfo!.fps < m.output.fps / clip.speed - 0.01) {
      log.warn(`El clip ${clip.id} a ${clip.speed}× repetirá fotogramas: el original tiene ${a.mezzanineInfo!.fps.toFixed(2)} fps`);
    }
  }

  const result: IngestResult = { manifest: m.name, assets };
  writeJson(path.join(dirs.analysis, m.name, 'ingest.json'), result);
  return result;
}
