import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { mixAudio, type MixResult } from '../audio/mix';
import { hashOf, sha256File } from '../core/hash';
import type { RunLog } from '../core/log';
import { type Manifest, parseManifest } from '../core/manifest';
import { ffmpeg, run } from '../core/proc';
import { ROOT, assertWritable, dirs, ensureDir, rel, resolveFromRoot, writeJson } from '../core/project';
import { type IngestResult, ingest } from '../ingest/ingest';
import type { EditProps, MediaRef } from '../remotion/props';

export type Quality = 'preview' | 'final';

export const QUALITY = {
  preview: { scale: 0.5, crf: 26, x264Preset: 'veryfast', imageFormat: 'jpeg', jpegQuality: 80, audioBitrate: '160k' },
  final: { scale: 1, crf: 16, x264Preset: 'medium', imageFormat: 'png', jpegQuality: undefined, audioBitrate: '256k' },
} as const;

/** Versión de Chrome Headless Shell con la que Remotion 4.0.537 está probado. */
export const CHROME_VERSION = '157.0.8080.0';

/** Navegador local si existe; si no, undefined y Remotion descarga el suyo (Windows/macOS). */
export function findBrowser(): string | undefined {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) return process.env.REMOTION_BROWSER_EXECUTABLE;
  const local = path.join(ROOT, '.cache', 'chrome-headless-shell', CHROME_VERSION, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
  return fs.existsSync(local) ? local : undefined;
}

/**
 * Enlace duro (sin copiar datos) o copia si está en otro volumen. No symlinks: el servidor
 * estático de Remotion responde 404 a ficheros enlazados simbólicamente.
 */
function linkOrCopy(src: string, dest: string): void {
  assertWritable(dest);
  fs.rmSync(dest, { force: true });
  try {
    fs.linkSync(src, dest);
  } catch {
    fs.copyFileSync(src, dest);
  }
}

/** Directorio público mínimo del render: solo los ficheros que usa este manifiesto. */
function stagePublicDir(m: Manifest, ing: IngestResult, workDir: string): { publicDir: string; media: Record<string, MediaRef> } {
  const publicDir = path.join(workDir, 'public');
  fs.rmSync(assertWritable(publicDir), { recursive: true, force: true });
  ensureDir(path.join(publicDir, 'media'));
  ensureDir(path.join(publicDir, 'fonts'));
  for (const f of fs.readdirSync(path.join(dirs.fonts, 'Inter')).filter((f) => f.endsWith('.otf'))) {
    linkOrCopy(path.join(dirs.fonts, 'Inter', f), path.join(publicDir, 'fonts', f));
  }

  const media: Record<string, MediaRef> = {};
  const used = new Set([...m.video.map((c) => c.asset), ...m.overlays.flatMap((o) => (o.type === 'logo' ? [o.asset] : []))]);
  for (const assetId of used) {
    const a = ing.assets[assetId]!;
    const source = resolveFromRoot(a.mezzanine ?? a.original);
    const name = `${assetId}${path.extname(source)}`;
    linkOrCopy(source, path.join(publicDir, 'media', name));
    const width = a.mezzanineInfo?.width ?? a.info?.video?.displayWidth ?? 0;
    const height = a.mezzanineInfo?.height ?? a.info?.video?.displayHeight ?? 0;
    media[assetId] = { src: `media/${name}`, width, height };
  }
  return { publicDir, media };
}

export interface RenderRecord {
  runId: string;
  manifest: { path: string; hash: string; name: string };
  quality: Quality;
  params: (typeof QUALITY)[Quality] & { concurrency: number; browser: string };
  output: { path: string; sha256: string; bytes: number };
  props: string;
  timingsMs: Record<string, number>;
  ingestNotes: Record<string, string[]>;
  audio: Pick<MixResult, 'pass1' | 'pass2' | 'cached'> & { file: string };
  versions: Record<string, string>;
}

async function toolVersions(log: RunLog): Promise<Record<string, string>> {
  const ff = await run('ffmpeg', ['-hide_banner', '-version'], { log });
  const pkg = (name: string) =>
    (JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8')) as { version: string }).version;
  return {
    node: process.version,
    ffmpeg: ff.stdout.toString('utf8').split('\n')[0] ?? '?',
    remotion: pkg('remotion'),
    react: pkg('react'),
    platform: `${process.platform}-${process.arch}`,
  };
}

export async function renderManifestFile(
  manifestPath: string,
  quality: Quality,
  log: RunLog,
  opts: { concurrency?: number; outName?: string } = {},
): Promise<RenderRecord> {
  const m = parseManifest(JSON.parse(fs.readFileSync(resolveFromRoot(manifestPath), 'utf8')));
  return renderManifest(m, rel(resolveFromRoot(manifestPath)), quality, log, opts);
}

export async function renderManifest(
  m: Manifest,
  manifestPath: string,
  quality: Quality,
  log: RunLog,
  opts: { concurrency?: number; outName?: string } = {},
): Promise<RenderRecord> {
  const q = QUALITY[quality];
  const manifestHash = hashOf(m);
  const timings: Record<string, number> = {};
  const timed = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const t0 = performance.now();
    const out = await log.stage(name, fn);
    timings[name] = Math.round(performance.now() - t0);
    return out;
  };

  log.event('render-start', { manifestPath, manifestHash, quality });
  const ing = await timed('ingesta', () => ingest(m, log));
  const mix = await timed('mezcla de audio', () => mixAudio(m, ing, log));

  const workDir = ensureDir(path.join(dirs.cache, 'render', `${m.name}-${manifestHash.slice(0, 12)}`));
  const { publicDir, media } = stagePublicDir(m, ing, workDir);
  const props: EditProps = { manifest: m, media };
  const propsFile = writeJson(path.join(workDir, 'props.json'), props);

  const bundleDir = path.join(workDir, 'bundle');
  fs.rmSync(assertWritable(bundleDir), { recursive: true, force: true });
  const serveUrl = await timed('bundle', () =>
    bundle({
      entryPoint: path.join(ROOT, 'src', 'remotion', 'index.ts'),
      outDir: bundleDir,
      publicDir,
      symlinkPublicDir: true,
      enableCaching: true,
    }),
  );

  const browserExecutable = findBrowser();
  const concurrency = opts.concurrency ?? os.cpus().length;
  const composition = await timed('selección de composición', () =>
    selectComposition({ serveUrl, id: 'Edit', inputProps: props, browserExecutable, logLevel: 'warn' }),
  );

  const videoOnly = path.join(workDir, `video-${quality}.mp4`);
  assertWritable(videoOnly);
  let lastPct = -10;
  await timed('render Remotion', () =>
    renderMedia({
      serveUrl,
      composition,
      inputProps: props,
      codec: 'h264',
      outputLocation: videoOnly,
      muted: true,
      crf: q.crf,
      x264Preset: q.x264Preset,
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      imageFormat: q.imageFormat,
      ...(q.jpegQuality ? { jpegQuality: q.jpegQuality } : {}),
      scale: q.scale,
      concurrency,
      browserExecutable,
      overwrite: true,
      logLevel: 'warn',
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 100);
        if (pct >= lastPct + 10) {
          lastPct = pct - (pct % 10);
          log.info(`  render ${lastPct}%`);
        }
      },
    }),
  );

  const outDir = ensureDir(quality === 'final' ? dirs.exports : dirs.previews);
  const outFile = path.join(outDir, `${opts.outName ?? m.name}-${quality}-${log.runId}.mp4`);
  const totalSec = m.output.durationInFrames / m.output.fps;
  await timed('mux', () =>
    ffmpeg(
      [
        '-y', '-i', videoOnly, '-i', mix.file,
        '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', q.audioBitrate, '-ar', '48000', '-ac', '2',
        '-t', totalSec.toFixed(6), '-movflags', '+faststart',
        outFile,
      ],
      { log, outputs: [outFile] },
    ),
  );

  const record: RenderRecord = {
    runId: log.runId,
    manifest: { path: manifestPath, hash: manifestHash, name: m.name },
    quality,
    params: { ...q, concurrency, browser: browserExecutable ? rel(browserExecutable) : 'descargado por Remotion' },
    output: { path: rel(outFile), sha256: await sha256File(outFile), bytes: fs.statSync(outFile).size },
    props: rel(propsFile),
    timingsMs: timings,
    ingestNotes: Object.fromEntries(Object.entries(ing.assets).map(([k, a]) => [k, a.notes])),
    audio: { file: rel(mix.file), pass1: mix.pass1, pass2: mix.pass2, cached: mix.cached },
    versions: await toolVersions(log),
  };
  writeJson(`${outFile}.render.json`, record);
  log.event('render-done', { output: record.output, timingsMs: timings });
  return record;
}
