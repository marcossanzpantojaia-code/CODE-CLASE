// EXP-01 "ground truth": genera material sintético, monta a partir de los beats DETECTADOS,
// renderiza preview y final, valida contra la verdad conocida y deja un informe.
import fs from 'node:fs';
import path from 'node:path';
import { analyzeBeats, beatFrames, refineBeats, snapToBeat } from '../../src/audio/beats';
import { RunLog } from '../../src/core/log';
import { type Manifest, type ManifestInput, parseManifest } from '../../src/core/manifest';
import { run } from '../../src/core/proc';
import { dirs, ensureDir, rel, resolveFromRoot, writeJson, writeText } from '../../src/core/project';
import type { IngestResult } from '../../src/ingest/ingest';
import { type Check, type QaReport, technicalQa } from '../../src/qa/qa';
import { QUALITY, type RenderRecord, renderManifest } from '../../src/rendering/render';
import { circleAspect, colorCheck, maxDiff, patchColor, slowMotion, upright, fmt } from './checks';
import { TRUTH, generateExp01, makeS4References, truthBeats } from './generate';

const FPS = TRUTH.fps;

/** Dónde quiere cortar el montador (segundos); el beat detectado más cercano afina el fotograma. */
export const DESIRED_CUTS_SEC = { a: [1.8, 3.8, 5.8, 7.8], b: [1.8, 4.3, 5.8, 7.8] } as const;
const SNAP_MAX_FRAMES = 6;

function cutFrames(bf: number[], variant: 'a' | 'b'): number[] {
  return DESIRED_CUTS_SEC[variant].map((t) => {
    const f = snapToBeat(Math.round(t * FPS), bf, SNAP_MAX_FRAMES);
    if (f === null) throw new Error(`No hay beat a ±${SNAP_MAX_FRAMES} fotogramas de ${t} s`);
    return f;
  });
}

function buildManifest(bf: number[], variant: 'a' | 'b', a: Awaited<ReturnType<typeof generateExp01>>): ManifestInput {
  // variante b: el segundo corte se mueve un beat (0.5 s) para probar la reexportación
  const [cut1, cut2, cut3, end] = cutFrames(bf, variant) as [number, number, number, number];
  const total = end + 60;
  return {
    version: 1,
    name: variant === 'a' ? 'exp01' : 'exp01-b',
    style: 'exp01-ground-truth',
    output: { width: 1080, height: 1920, fps: FPS, durationInFrames: total },
    assets: {
      s1: { kind: 'video', path: a.clips.s1 },
      s2: { kind: 'video', path: a.clips.s2 },
      s3: { kind: 'video', path: a.clips.s3 },
      s4: { kind: 'video', path: a.clips.s4 },
      music: { kind: 'audio', path: a.music, license: 'Sintético, generado por EXP-01' },
      whoosh: { kind: 'audio', path: a.sfx, license: 'Sintético, generado por EXP-01' },
      logo: { kind: 'image', path: a.logo },
    },
    video: [
      { id: 'c1', asset: 's1', sourceIn: 0.4, at: 0, frames: cut1, transform: { zoom: [[0, 1], [cut1 - 1, 1.08]], panX: [[0, -0.4], [cut1 - 1, 0.2]] } },
      { id: 'c2', asset: 's2', sourceIn: 0.5, at: cut1, frames: cut2 - cut1, speed: 0.5, transitionIn: { type: 'zoom-through', frames: 8 }, syncToBeat: true },
      {
        id: 'c3', asset: 's3', sourceIn: 0.3, at: cut2, frames: cut3 - cut2, syncToBeat: true,
        transform: { zoom: [[0, 1.15]], panX: [[0, -1], [cut3 - cut2 - 1, 1]], panY: [[0, -1]], easing: 'linear' },
      },
      { id: 'c4', asset: 's4', sourceIn: 0.2, at: cut3, frames: end - cut3, syncToBeat: true, transform: { zoom: [[0, 1.12], [end - cut3 - 1, 1]] } },
    ],
    overlays: [
      { id: 'title', type: 'title', text: 'Barbería Sintética', subtitle: 'EXP-01 · ground truth', at: cut3 + 6, frames: end - cut3 - 6 },
      { id: 'endcard', type: 'logo', asset: 'logo', at: end, frames: total - end, tagline: 'Reserva tu cita' },
    ],
    audio: [
      { id: 'music', asset: 'music', role: 'music', at: 0, fadeOutFrames: 20 },
      { id: 'whoosh', asset: 'whoosh', role: 'sfx', at: cut1 - 8, gainDb: -6 },
    ],
    provenance: {
      createdBy: 'experiments/exp01/run.ts',
      instruction: `Cortes cerca de ${DESIRED_CUTS_SEC[variant].join(', ')} s, ajustados al beat detectado más cercano; zoom-through en el primero.`,
      notes: [`beats detectados (fotogramas): ${bf.slice(0, 20).join(', ')}`],
    },
  };
}

async function framemd5(file: string, log: RunLog): Promise<string[]> {
  const res = await run('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'error', '-i', file, '-map', '0:v:0', '-f', 'framemd5', '-'], { log });
  return res.stdout.toString('utf8').split('\n').filter((l) => l && !l.startsWith('#'));
}

/** Línea base solo-FFmpeg del mismo montaje (cortes secos, sin zoom ni animación): solo para comparar coste. */
async function ffmpegBaseline(m: Manifest, ing: IngestResult, audio: string, log: RunLog): Promise<{ file: string; ms: number }> {
  const { scale } = QUALITY.preview;
  const W = m.output.width * scale;
  const H = m.output.height * scale;
  const inputs: string[] = [];
  const parts: string[] = [];
  m.video.forEach((c, i) => {
    inputs.push('-i', resolveFromRoot(ing.assets[c.asset]!.mezzanine!));
    const dur = (c.frames / FPS) * c.speed;
    parts.push(
      `[${i}:v]trim=start=${c.sourceIn}:duration=${dur.toFixed(6)},setpts=(PTS-STARTPTS)/${c.speed},fps=${FPS},` +
        `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,trim=end_frame=${c.frames}[v${i}]`,
    );
  });
  const end = m.overlays.find((o) => o.type === 'logo')!;
  const li = m.video.length;
  inputs.push('-i', resolveFromRoot(ing.assets['logo']!.original), '-i', audio);
  parts.push(
    `color=c=0x0D0D0D:s=${W}x${H}:r=${FPS}:d=${(end.frames / FPS).toFixed(6)}[bg]`,
    `[${li}:v]scale=${Math.round(W / 2)}:-1[lg]`,
    `[bg][lg]overlay=(W-w)/2:(H-h)/2:shortest=1[end]`,
    `${m.video.map((_, i) => `[v${i}]`).join('')}[end]concat=n=${li + 1}:v=1:a=0,format=yuv420p[v]`,
  );
  const out = path.join(ensureDir(path.join(dirs.cache, 'exp01')), 'baseline-ffmpeg-preview.mp4');
  const res = await run(
    'ffmpeg',
    [
      '-hide_banner', '-nostdin', '-y', ...inputs, '-filter_complex', parts.join(';'), '-map', '[v]', '-map', `${li + 1}:a`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-c:a', 'aac', '-b:a', '160k', out,
    ],
    { log, outputs: [out] },
  );
  return { file: out, ms: res.ms };
}

function summarize(label: string, qa: QaReport): Check[] {
  return qa.checks.map((c) => ({ ...c, id: `${label}:${c.id}` }));
}

async function main(): Promise<number> {
  const log = new RunLog('exp01');
  const reportDir = ensureDir(path.join(dirs.reports, 'exp01', log.runId));
  const checks: Check[] = [];

  const assets = await log.stage('generar material sintético', () => generateExp01(log));
  const refs = await makeS4References(log);

  // 1. Beats detectados vs verdad
  const analysis = await log.stage('detección de beats', () => analyzeBeats(resolveFromRoot(assets.music), log));
  const refined = refineBeats(analysis.beats, analysis.onsets);
  const truth = truthBeats();
  const errs = truth.map((t) => {
    const nearest = refined.reduce((best, r) => (Math.abs(r.t - t) < Math.abs(best - t) ? r.t : best), Infinity);
    return (nearest - t) * 1000;
  });
  const within = errs.filter((e) => Math.abs(e) <= 1000 / FPS).length;
  checks.push({
    id: 'exp-beats', name: 'Beats detectados vs click track (120 BPM)', severity: 'Alto',
    status: within / truth.length >= 0.95 ? 'PASS' : 'FAIL',
    expected: `≥ 95 % de ${truth.length} golpes a ≤ 1 fotograma (33.3 ms)`,
    measured: `${within}/${truth.length}; error medio ${(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(1)} ms, máx ${Math.max(...errs.map(Math.abs)).toFixed(1)} ms; tempo ${analysis.tempoBpm.toFixed(2)} BPM; ${refined.filter((r) => r.snapped).length}/${refined.length} beats ajustados a onset`,
    details: { truth, refined, errorsMs: errs },
  });
  const extra = refined.filter((r) => !truth.some((t) => Math.abs(r.t - t) <= 1 / FPS));
  checks.push({
    id: 'exp-beat-extra', name: 'Beats detectados que no son golpes del click', severity: 'Bajo', status: extra.length ? 'WARN' : 'PASS',
    expected: 'ninguno', measured: extra.length ? extra.map((r) => `${r.t.toFixed(3)} s`).join(', ') + ' (inicio del colchón grave en t=0)' : 'ninguno',
  });
  const bf = beatFrames(refined, FPS);
  const truthCuts = DESIRED_CUTS_SEC.a.map((t) => snapToBeat(Math.round(t * FPS), truth.map((x) => Math.round(x * FPS)), SNAP_MAX_FRAMES));
  const chosen = cutFrames(bf, 'a');
  checks.push({
    id: 'exp-beat-frames', name: 'Fotogramas de corte elegidos sobre beats detectados', severity: 'Alto',
    status: chosen.every((f, i) => f === truthCuts[i]) ? 'PASS' : 'FAIL',
    expected: truthCuts.join(', ') + ' (golpes reales)', measured: chosen.join(', '),
  });

  // 2. Manifiesto A (versionado en git: es la propuesta de montaje)
  const mA = parseManifest(buildManifest(bf, 'a', assets));
  const pathA = writeJson(path.join(dirs.editDecisions, 'exp01.json'), buildManifest(bf, 'a', assets));
  const ingest = (): IngestResult => JSON.parse(fs.readFileSync(path.join(dirs.analysis, mA.name, 'ingest.json'), 'utf8')) as IngestResult;

  // 3-4. Preview y final + QA técnico
  const renders: Record<string, RenderRecord> = {};
  const qas: Record<string, QaReport> = {};
  for (const q of ['preview', 'final'] as const) {
    renders[q] = await log.stage(`render ${q}`, () => renderManifest(mA, rel(pathA), q, log));
    qas[q] = await log.stage(`QA ${q}`, () => technicalQa(resolveFromRoot(renders[q]!.output.path), mA, q, log, { ingest: ingest(), mixFile: resolveFromRoot(renders[q]!.audio.file) }));
    checks.push(...summarize(q, qas[q]!));
  }
  const finalVideo = resolveFromRoot(renders.final!.output.path);
  const ing = ingest();
  const clip = (id: string) => mA.video.find((c) => c.id === id)!;
  const mid = (id: string) => clip(id).at + Math.floor(clip(id).frames / 2);

  // 5. Comprobaciones con verdad conocida (sobre el final)
  checks.push(await circleAspect(finalVideo, mid('c1'), log));
  checks.push(await upright(finalVideo, mid('c3'), log));
  const c2 = clip('c2');
  const mezzS2Fps = ing.assets['s2']!.mezzanineInfo!.fps;
  const pxPerFrame = (TRUTH.squarePxPerSec / mezzS2Fps) * ((c2.speed * mezzS2Fps) / FPS); // = 400 * 0.5 / 30
  checks.push(await slowMotion(finalVideo, c2.at + 6, c2.frames - 6, pxPerFrame, log));

  for (const id of ['s1', 's2', 's3'] as const) {
    const a = ing.assets[id]!;
    const f = Math.round(a.mezzanineInfo!.fps);
    checks.push(colorCheck(`exp-color-ingest-${id}`, `Color: original vs intermedio (${id})`,
      await patchColor(resolveFromRoot(a.original), f, log), await patchColor(resolveFromRoot(a.mezzanine!), f, log), 3));
  }
  for (const c of mA.video) {
    const a = ing.assets[c.asset]!;
    const mf = Math.round((c.sourceIn + ((mid(c.id) - c.at) / FPS) * c.speed) * a.mezzanineInfo!.fps);
    checks.push(colorCheck(`exp-color-render-${c.id}`, `Color: intermedio vs salida Remotion (${c.id})`,
      await patchColor(resolveFromRoot(a.mezzanine!), mf, log), await patchColor(finalVideo, mid(c.id), log), 6));
  }
  const ref = await patchColor(refs.sdrRef, 30, log);
  const tonemapped = await patchColor(resolveFromRoot(ing.assets['s4']!.mezzanine!), 30, log);
  const naive = await patchColor(refs.naive, 30, log);
  checks.push({
    id: 'exp-hdr', name: 'HDR (HLG): el tonemap acerca el color al SDR de referencia', severity: 'Alto',
    status: maxDiff(tonemapped, ref) <= 12 && maxDiff(tonemapped, ref) < maxDiff(naive, ref) ? 'PASS' : 'FAIL',
    expected: 'diferencia(tonemap, ref) ≤ 12 y menor que ignorando el HDR',
    measured: `ref ${fmt(ref)}; tonemap ${fmt(tonemapped)} (Δ${maxDiff(tonemapped, ref).toFixed(1)}); ignorando HDR ${fmt(naive)} (Δ${maxDiff(naive, ref).toFixed(1)})`,
  });

  // 6. Determinismo: mismo manifiesto → mismos fotogramas
  const again = await log.stage('render preview (repetición)', () => renderManifest(mA, rel(pathA), 'preview', log, { outName: 'exp01-repeat' }));
  const [h1, h2] = await Promise.all([framemd5(resolveFromRoot(renders.preview!.output.path), log), framemd5(resolveFromRoot(again.output.path), log)]);
  const diffFrames = h1.filter((l, i) => l !== h2[i]).length + Math.abs(h1.length - h2.length);
  checks.push({
    id: 'exp-determinism', name: 'Determinismo (dos renders del mismo manifiesto)', severity: 'Medio',
    status: diffFrames === 0 ? 'PASS' : 'WARN', expected: '0 fotogramas distintos (framemd5)', measured: `${diffFrames} de ${h1.length} distintos`,
  });

  // 7. Reexportación tras cambiar el manifiesto (corte c2→c3 un beat más tarde)
  const mB = parseManifest(buildManifest(bf, 'b', assets));
  const pathB = writeJson(path.join(dirs.editDecisions, 'exp01-b.json'), buildManifest(bf, 'b', assets));
  const recB = await log.stage('render preview variante B', () => renderManifest(mB, rel(pathB), 'preview', log));
  const qaB = await log.stage('QA variante B', () => technicalQa(resolveFromRoot(recB.output.path), mB, 'preview', log, { ingest: JSON.parse(fs.readFileSync(path.join(dirs.analysis, mB.name, 'ingest.json'), 'utf8')) as IngestResult, mixFile: resolveFromRoot(recB.audio.file) }));
  checks.push(...summarize('reexport-b', qaB).filter((c) => ['reexport-b:cuts', 'reexport-b:frame-count', 'reexport-b:beat-sync', 'reexport-b:av-offset'].includes(c.id)));

  // 8. Línea base solo-FFmpeg (coste)
  const base = await log.stage('línea base solo-FFmpeg', () => ffmpegBaseline(mA, ing, resolveFromRoot(renders.preview!.audio.file), log));

  // 9. Informe
  for (const q of ['preview', 'final'] as const) {
    for (const s of qas[q]!.contactSheets) fs.copyFileSync(resolveFromRoot(s), path.join(reportDir, `${q}-${path.basename(s)}`));
  }
  const summary = {
    runId: log.runId,
    log: rel(log.file),
    manifests: [rel(pathA), rel(pathB)],
    renders: { preview: renders.preview!, final: renders.final!, repeat: again, variantB: recB },
    baseline: { file: rel(base.file), ms: base.ms },
    checks,
  };
  writeJson(path.join(reportDir, 'summary.json'), summary);
  writeText(path.join(reportDir, 'REPORT.md'), reportMarkdown(summary, mA));

  const fails = checks.filter((c) => c.status === 'FAIL');
  process.stdout.write(`\nEXP-01: ${checks.length} comprobaciones, ${fails.length} FAIL, ${checks.filter((c) => c.status === 'WARN').length} WARN\n`);
  for (const c of checks) process.stdout.write(`  ${c.status.padEnd(4)} ${c.id}: ${c.measured}\n`);
  process.stdout.write(`Informe: ${rel(path.join(reportDir, 'REPORT.md'))}\n`);
  return fails.length ? 2 : 0;
}

function reportMarkdown(s: { runId: string; log: string; renders: Record<string, RenderRecord>; baseline: { ms: number }; checks: Check[] }, m: Manifest): string {
  const esc = (x: string) => x.replace(/\|/g, '\\|');
  const r = s.renders;
  const t = (rec: RenderRecord) => Object.entries(rec.timingsMs).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)} s`).join(' · ');
  const renderOnly = (rec: RenderRecord) => (rec.timingsMs['render Remotion'] ?? 0) / 1000;
  const frames = m.output.durationInFrames;
  return [
    `# EXP-01 — informe de ejecución ${s.runId}`,
    '',
    `Log: \`${s.log}\` · Manifiestos: \`edit-decisions/exp01.json\`, \`edit-decisions/exp01-b.json\``,
    '',
    '## Comprobaciones',
    '',
    '| Estado | Gravedad | Id | Esperado | Medido |',
    '|---|---|---|---|---|',
    ...s.checks.map((c) => `| ${c.status} | ${c.severity} | ${c.id} | ${esc(c.expected)} | ${esc(c.measured)} |`),
    '',
    '## Tiempos (4 vCPU, sin GPU)',
    '',
    `- Preview 540×960 (${frames} fotogramas): ${t(r.preview!)} → render Remotion ${(frames / renderOnly(r.preview!)).toFixed(1)} fps`,
    `- Final 1080×1920: ${t(r.final!)} → render Remotion ${(frames / renderOnly(r.final!)).toFixed(1)} fps`,
    `- Línea base solo-FFmpeg (preview, sin zoom/transición/texto animado): ${(s.baseline.ms / 1000).toFixed(1)} s`,
    '',
    '## Versiones',
    '',
    '```json',
    JSON.stringify(r.final!.versions, null, 2),
    '```',
    '',
    'Contact sheets en esta carpeta (material sintético). Revisión visual: ver docs/FASE_2_INFRAESTRUCTURA.md.',
    '',
  ].join('\n');
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    process.stderr.write(`ERROR: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
    process.exit(1);
  },
);
