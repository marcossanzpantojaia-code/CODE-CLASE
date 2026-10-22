import path from 'node:path';
import { analyzeBeats, refineBeats } from '../audio/beats';
import { countFrames, probe } from '../core/ffprobe';
import { sha256File } from '../core/hash';
import type { RunLog } from '../core/log';
import { type Manifest, visualBoundaries } from '../core/manifest';
import { ffmpeg, run } from '../core/proc';
import { ensureDir, rel, resolveFromRoot, writeJson, writeText } from '../core/project';
import type { IngestResult } from '../ingest/ingest';
import { QUALITY, type Quality } from '../rendering/render';

export type Status = 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
export type Severity = 'Crítico' | 'Alto' | 'Medio' | 'Bajo';

export interface Check {
  id: string;
  name: string;
  status: Status;
  severity: Severity;
  expected: string;
  measured: string;
  details?: unknown;
}

export interface QaReport {
  video: string;
  manifest: string;
  quality: Quality;
  checks: Check[];
  sceneChanges: SceneChange[];
  contactSheets: string[];
  verdict: string;
}

export interface SceneChange {
  frame: number;
  time: number;
  score: number;
}

type Interval = [number, number];

const within = (iv: Interval, allowed: Interval[], tol: number) => allowed.some(([a, b]) => iv[0] >= a - tol && iv[1] <= b + tol);

/** Tramos donde negro o imagen fija son intencionados (cierres con fondo sólido). */
function intendedStatic(m: Manifest): Interval[] {
  const fps = m.output.fps;
  return m.overlays.filter((o) => o.type === 'logo').map((o) => [o.at / fps, (o.at + o.frames) / fps] as Interval);
}

export function parseSceneChanges(metadataDump: string): SceneChange[] {
  const out: SceneChange[] = [];
  let frame = -1;
  let score = 0;
  for (const line of metadataDump.split('\n')) {
    const fm = /^frame:(\d+)\s/.exec(line);
    if (fm) {
      frame = Number(fm[1]);
      continue;
    }
    const sm = /^lavfi\.scd\.score=([\d.]+)/.exec(line);
    if (sm) score = Number(sm[1]);
    const tm = /^lavfi\.scd\.time=([\d.]+)/.exec(line);
    if (tm) out.push({ frame, time: Number(tm[1]), score });
  }
  return out;
}

export interface SignalStats {
  black: Interval[];
  freeze: Interval[];
  silence: Interval[];
  integratedLufs: number | null;
  truePeakDb: number | null;
}

export function parseSignalStats(stderr: string, totalSec: number): SignalStats {
  const num = (re: RegExp) => [...stderr.matchAll(re)].map((x) => Number(x[1]));
  const black = [...stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((x) => [Number(x[1]), Number(x[2])] as Interval);
  const pair = (starts: number[], ends: number[]): Interval[] => starts.map((s, i) => [s, ends[i] ?? totalSec]);
  const freeze = pair(num(/freeze_start: ([\d.]+)/g), num(/freeze_end: ([\d.]+)/g));
  const silence = pair(num(/silence_start: (-?[\d.]+)/g), num(/silence_end: ([\d.]+)/g));
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  const i = /I:\s+(-?[\d.]+) LUFS/.exec(summary);
  const tp = /Peak:\s+(-?[\d.]+|-inf) dBFS/.exec(summary);
  return {
    black,
    freeze,
    silence,
    integratedLufs: i ? Number(i[1]) : null,
    truePeakDb: tp ? (tp[1] === '-inf' ? -Infinity : Number(tp[1])) : null,
  };
}

/** Contact sheet (miniaturas uniformes) y tira de fotogramas alrededor de cada corte. */
export async function contactSheets(video: string, m: Manifest, height: number, outDir: string, log: RunLog): Promise<string[]> {
  const font = 'resources/fonts/Inter/Inter-SemiBold.otf';
  const label = `drawtext=fontfile=${font}:text='%{n}':x=8:y=8:fontsize=${Math.round(height / 22)}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=6`;
  const n = m.output.durationInFrames;
  const step = Math.max(1, Math.ceil(n / 24));
  const rows = Math.ceil(n / step / 6);
  const sheet = path.join(outDir, 'contact-sheet.png');
  await ffmpeg(
    ['-y', '-i', video, '-vf', `${label},select='not(mod(n,${step}))',scale=216:-2,tile=6x${rows}`, '-frames:v', '1', sheet],
    { log, outputs: [sheet] },
  );
  const outputs = [sheet];

  const bounds = visualBoundaries(m);
  if (bounds.length > 0) {
    const expr = bounds.map((b) => `between(n,${b.frame - 2},${b.frame + 2})`).join('+');
    const cuts = path.join(outDir, 'cuts.png');
    await ffmpeg(
      ['-y', '-i', video, '-vf', `${label},select='${expr}',scale=216:-2,tile=5x${bounds.length}`, '-frames:v', '1', cuts],
      { log, outputs: [cuts] },
    );
    outputs.push(cuts);
  }
  return outputs;
}

const XCORR_RATE = 8000;

/** Diferencia media entre fotogramas consecutivos (RGB a 72x128): d[n] compara n con n-1. */
export async function frameDifferences(video: string, log: RunLog): Promise<number[]> {
  const W = 72;
  const H = 128;
  const res = await run('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'error', '-i', video, '-vf', `scale=${W}:${H}:flags=area,format=rgb24`, '-f', 'rawvideo', '-'], { log });
  const size = W * H * 3;
  const px = res.stdout;
  const d = [0];
  for (let i = 1; (i + 1) * size <= px.length; i++) {
    let sum = 0;
    for (let k = 0, a = i * size, b = (i - 1) * size; k < size; k++) sum += Math.abs(px[a + k]! - px[b + k]!);
    d.push(sum / size);
  }
  return d;
}

/** Pico de diferencia en ±win fotogramas alrededor de la frontera y cuánto destaca sobre sus vecinos. */
export function verifyBoundary(d: number[], frame: number, win = 3): { peakFrame: number; prominence: number } {
  const lo = Math.max(1, frame - win);
  const hi = Math.min(d.length - 1, frame + win);
  let peakFrame = lo;
  for (let f = lo; f <= hi; f++) if (d[f]! > d[peakFrame]!) peakFrame = f;
  const others = [];
  for (let f = lo; f <= hi; f++) if (f !== frame) others.push(d[f]!);
  others.sort((a, b) => a - b);
  const median = others.length ? others[Math.floor(others.length / 2)]! : 0;
  return { peakFrame, prominence: (d[frame] ?? 0) / Math.max(median, 0.01) };
}

async function decodeMono(file: string, log: RunLog, seconds = 6): Promise<Float32Array> {
  const res = await run('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'error', '-i', file, '-t', String(seconds), '-vn', '-ac', '1', '-ar', String(XCORR_RATE), '-f', 'f32le', '-'], { log });
  return new Float32Array(res.stdout.buffer.slice(res.stdout.byteOffset, res.stdout.byteOffset + res.stdout.byteLength));
}

/** Desfase (en muestras) que maximiza la correlación normalizada; lag > 0: b va retrasada respecto a a. */
export function bestLag(a: Float32Array, b: Float32Array, maxLag: number): { lag: number; corr: number } {
  let best = { lag: 0, corr: -Infinity };
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sab = 0, saa = 0, sbb = 0;
    for (let i = Math.max(0, -lag); i < a.length && i + lag < b.length; i++) {
      const x = a[i]!;
      const y = b[i + lag]!;
      sab += x * y;
      saa += x * x;
      sbb += y * y;
    }
    const corr = sab / Math.sqrt(saa * sbb || 1);
    if (corr > best.corr) best = { lag, corr };
  }
  return best;
}

export async function technicalQa(
  video: string,
  m: Manifest,
  quality: Quality,
  log: RunLog,
  opts: { ingest?: IngestResult; outDir?: string; mixFile?: string } = {},
): Promise<QaReport> {
  const fps = m.output.fps;
  const frameSec = 1 / fps;
  const totalSec = m.output.durationInFrames / fps;
  const scale = QUALITY[quality].scale;
  const W = Math.round(m.output.width * scale);
  const H = Math.round(m.output.height * scale);
  // Junto al render y fuera de git: las contact sheets contienen fotogramas del metraje (clientes).
  const outDir = ensureDir(opts.outDir ?? `${video}.qa`);
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  // 1. Formato y etiquetas
  const info = await probe(video, log);
  const v = info.video;
  const a = info.audio;
  const fmtOk = !!v && v.codec === 'h264' && v.pixFmt === 'yuv420p' && v.width === W && v.height === H && Math.abs(v.fps - fps) < 1e-6 && Math.abs(v.avgFps - fps) < 1e-3;
  add({
    id: 'video-format', name: 'Formato de vídeo', severity: 'Crítico', status: fmtOk ? 'PASS' : 'FAIL',
    expected: `h264 yuv420p ${W}x${H} ${fps}/1 CFR`,
    measured: v ? `${v.codec} ${v.pixFmt} ${v.width}x${v.height} ${v.fpsFraction} (media ${v.avgFps.toFixed(3)})` : 'sin vídeo',
  });
  const colorOk = !!v && v.colorSpace === 'bt709' && v.colorTransfer === 'bt709' && v.colorPrimaries === 'bt709';
  add({
    id: 'color-tags', name: 'Etiquetas de color', severity: 'Alto', status: colorOk ? 'PASS' : 'FAIL',
    expected: 'bt709 / bt709 / bt709',
    measured: v ? `${v.colorSpace} / ${v.colorTransfer} / ${v.colorPrimaries}` : '-',
  });
  const audioOk = !!a && a.codec === 'aac' && a.sampleRate === 48000 && a.channels === 2;
  add({
    id: 'audio-format', name: 'Formato de audio', severity: 'Alto', status: audioOk ? 'PASS' : 'FAIL',
    expected: 'aac 48000 Hz estéreo', measured: a ? `${a.codec} ${a.sampleRate} Hz ${a.channels} canales` : 'sin audio',
  });

  // 2. Duración exacta y sincronía de duraciones
  const frames = await countFrames(video, log);
  add({
    id: 'frame-count', name: 'Número de fotogramas', severity: 'Crítico', status: frames === m.output.durationInFrames ? 'PASS' : 'FAIL',
    expected: String(m.output.durationInFrames), measured: String(frames),
  });
  const durs = JSON.parse(
    (await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,duration', '-of', 'json', video], { log })).stdout.toString('utf8'),
  ) as { streams: { codec_type: string; duration?: string }[] };
  const vd = Number(durs.streams.find((s) => s.codec_type === 'video')?.duration ?? NaN);
  const ad = Number(durs.streams.find((s) => s.codec_type === 'audio')?.duration ?? NaN);
  const aacFrame = 1024 / 48000;
  add({
    id: 'av-duration', name: 'Duración audio vs vídeo', severity: 'Alto',
    status: Math.abs(vd - ad) <= frameSec + aacFrame ? 'PASS' : 'FAIL',
    expected: `|Δ| ≤ ${((frameSec + aacFrame) * 1000).toFixed(0)} ms`, measured: `vídeo ${vd.toFixed(3)} s, audio ${ad.toFixed(3)} s`,
  });

  // 3. Integridad de decodificación
  const dec = await run('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'error', '-i', video, '-f', 'null', '-'], { log, allowFailure: true });
  add({
    id: 'decode', name: 'Decodificación sin errores', severity: 'Crítico', status: dec.code === 0 && dec.stderr.trim() === '' ? 'PASS' : 'FAIL',
    expected: 'sin errores', measured: dec.stderr.trim() === '' ? 'sin errores' : dec.stderr.trim().slice(0, 300),
  });

  // 4. Negros, congelados, silencios y sonoridad en una pasada
  const sig = await run(
    'ffmpeg',
    [
      '-hide_banner', '-nostdin', '-i', video,
      '-vf', 'blackdetect=d=0.05:pix_th=0.10,freezedetect=n=0.003:d=0.4',
      '-af', 'silencedetect=n=-50dB:d=0.5,ebur128=peak=true',
      '-f', 'null', '-',
    ],
    { log },
  );
  const st = parseSignalStats(sig.stderr, totalSec);
  const intended = intendedStatic(m);
  const badBlack = st.black.filter((iv) => !within(iv, intended, frameSec));
  add({
    id: 'black', name: 'Negros no previstos', severity: 'Alto', status: badBlack.length === 0 ? 'PASS' : 'FAIL',
    expected: 'ninguno fuera de los cierres', measured: badBlack.length ? JSON.stringify(badBlack) : `ninguno (${st.black.length} previstos)`,
  });
  const badFreeze = st.freeze.filter((iv) => !within(iv, intended, frameSec));
  add({
    id: 'freeze', name: 'Imagen congelada no prevista', severity: 'Medio', status: badFreeze.length === 0 ? 'PASS' : 'WARN',
    expected: 'ninguna fuera de los cierres', measured: badFreeze.length ? JSON.stringify(badFreeze) : `ninguna (${st.freeze.length} previstas)`,
  });
  add({
    id: 'silence', name: 'Silencios ≥ 0.5 s', severity: 'Medio',
    status: st.silence.length === 0 ? 'PASS' : m.audio.length === 0 ? 'SKIP' : 'WARN',
    expected: 'ninguno', measured: st.silence.length ? JSON.stringify(st.silence) : 'ninguno',
  });
  const lufsOk = st.integratedLufs !== null && Math.abs(st.integratedLufs - m.loudness.integratedLufs) <= 1;
  const tpOk = st.truePeakDb !== null && st.truePeakDb <= m.loudness.truePeakDb + 0.1;
  add({
    id: 'loudness', name: 'Sonoridad (EBU R128)', severity: 'Alto',
    status: m.audio.length === 0 ? 'SKIP' : lufsOk && tpOk ? 'PASS' : 'FAIL',
    expected: `${m.loudness.integratedLufs} ± 1 LUFS, true peak ≤ ${m.loudness.truePeakDb} dBTP`,
    measured: `${st.integratedLufs} LUFS, true peak ${st.truePeakDb} dBTP`,
  });

  // 5. Cortes: en cada frontera del manifiesto la diferencia entre fotogramas debe tener su pico
  //    exactamente en ese fotograma. (scdet solo sirve para detectar cambios NO previstos: mide
  //    sobre todo luminancia y no vio un corte verde oscuro → azul oscuro en EXP-01.)
  const diffs = await frameDifferences(video, log);
  const bounds = visualBoundaries(m);
  const verified = bounds.map((b) => ({ ...b, ...verifyBoundary(diffs, b.frame) }));
  const offPeak = verified.filter((x) => x.peakFrame !== x.frame);
  const faint = verified.filter((x) => x.peakFrame === x.frame && x.prominence < 2);
  add({
    id: 'cuts', name: 'Cortes en el fotograma exacto del manifiesto', severity: 'Crítico',
    status: offPeak.length ? 'FAIL' : faint.length ? 'WARN' : 'PASS',
    expected: `${bounds.map((b) => b.frame).join(', ') || '(sin cortes)'} (pico de diferencia, prominencia ≥ 2)`,
    measured: verified.map((x) => `${x.peakFrame}(Δ${x.peakFrame - x.frame}, ×${x.prominence.toFixed(1)})`).join(', '),
    details: verified,
  });
  const scd = await run('ffmpeg', ['-hide_banner', '-nostdin', '-i', video, '-vf', 'scdet=threshold=8,metadata=print:file=-', '-an', '-f', 'null', '-'], { log });
  const scenes = parseSceneChanges(scd.stdout.toString('utf8'));
  const unexpected = scenes.filter((s) => !bounds.some((b) => Math.abs(s.frame - b.frame) <= 1));
  add({
    id: 'unexpected-scene-changes', name: 'Cambios de plano no previstos', severity: 'Bajo', status: unexpected.length === 0 ? 'PASS' : 'WARN',
    expected: 'ninguno', measured: unexpected.length ? unexpected.map((s) => `${s.frame}(score ${s.score})`).join(', ') : 'ninguno',
  });

  // 6a. Sincronía audio-vídeo de la salida: el audio del MP4 debe coincidir con la mezcla.
  if (opts.mixFile) {
    const [ref, out] = await Promise.all([decodeMono(opts.mixFile, log), decodeMono(video, log)]);
    const { lag, corr } = bestLag(ref, out, Math.round(0.05 * XCORR_RATE));
    const offsetMs = (lag / XCORR_RATE) * 1000;
    add({
      id: 'av-offset', name: 'Desfase audio (salida vs mezcla)', severity: 'Alto', status: Math.abs(offsetMs) <= 5 && corr > 0.9 ? 'PASS' : 'FAIL',
      expected: '|desfase| ≤ 5 ms, correlación > 0.9', measured: `${offsetMs.toFixed(2)} ms (correlación ${corr.toFixed(3)})`,
    });
  }

  // 6b. Cortes sobre eventos musicales: beats de la pista de música colocados en la línea de tiempo.
  //     (Medirlo sobre la mezcla final falla en cuanto un efecto de sonido tapa el golpe.)
  const synced = verified.filter((x) => x.syncToBeat);
  const musicTracks = m.audio.filter((t) => t.role === 'music');
  if (synced.length > 0 && opts.ingest && musicTracks.length > 0) {
    const events: number[] = [];
    for (const t of musicTracks) {
      const a = await analyzeBeats(resolveFromRoot(opts.ingest.assets[t.asset]!.original), log);
      const start = t.at / fps;
      const end = t.frames !== undefined ? start + t.frames / fps : totalSec;
      for (const r of refineBeats(a.beats, a.onsets)) {
        const tl = r.t - t.sourceIn + start;
        if (tl >= start && tl <= end) events.push(tl);
      }
    }
    const res = synced.map((x) => {
      const cutT = x.peakFrame / fps;
      const nearest = events.reduce((best, e) => (Math.abs(e - cutT) < Math.abs(best - cutT) ? e : best), Infinity);
      return { id: x.id, cutFrame: x.peakFrame, cutT, beatT: nearest, deltaMs: Math.round((nearest - cutT) * 1000) };
    });
    const worst = Math.max(...res.map((r) => Math.abs(r.deltaMs)));
    add({
      id: 'beat-sync', name: 'Cortes sobre eventos musicales', severity: 'Alto', status: worst <= frameSec * 1000 ? 'PASS' : 'FAIL',
      expected: `|Δ| ≤ ${(frameSec * 1000).toFixed(1)} ms (1 fotograma)`, measured: res.map((r) => `${r.id} ${r.deltaMs} ms`).join(', '),
      details: res,
    });
  } else if (synced.length > 0) {
    add({
      id: 'beat-sync', name: 'Cortes sobre eventos musicales', severity: 'Alto', status: 'SKIP',
      expected: 'beats de la pista de música', measured: 'sin ingesta o sin pista de música: no verificable',
    });
  }

  // 7. Originales intactos
  if (opts.ingest) {
    const changed: string[] = [];
    for (const asset of Object.values(opts.ingest.assets)) {
      if ((await sha256File(resolveFromRoot(asset.original))) !== asset.sha256) changed.push(asset.original);
    }
    add({
      id: 'originals', name: 'Originales intactos (sha256)', severity: 'Crítico', status: changed.length === 0 ? 'PASS' : 'FAIL',
      expected: `${Object.keys(opts.ingest.assets).length} hashes iguales a la ingesta`, measured: changed.length ? `cambiados: ${changed.join(', ')}` : 'todos iguales',
    });
  }

  const sheets = await contactSheets(video, m, H, outDir, log);
  const fails = checks.filter((c) => c.status === 'FAIL');
  const verdict = fails.length
    ? `NO APTO: ${fails.length} comprobación(es) fallida(s): ${fails.map((c) => c.id).join(', ')}`
    : 'Sin fallos técnicos automáticos. PENDIENTE: revisión visual humana en reproducción real.';
  const report: QaReport = { video: rel(video), manifest: m.name, quality, checks, sceneChanges: scenes, contactSheets: sheets.map(rel), verdict };
  writeJson(path.join(outDir, 'qa.json'), report);
  writeText(path.join(outDir, 'qa.md'), qaMarkdown(report));
  log.event('qa', { video: rel(video), verdict, fails: fails.map((c) => c.id) });
  return report;
}

export function qaMarkdown(r: QaReport): string {
  const esc = (s: string) => s.replace(/\|/g, '\\|');
  const rows = r.checks.map((c) => `| ${c.status} | ${c.severity} | ${esc(c.name)} | ${esc(c.expected)} | ${esc(c.measured)} |`);
  return [
    `# QA técnico — ${r.manifest} (${r.quality})`,
    '',
    `Vídeo: \`${r.video}\``,
    '',
    `**Veredicto:** ${r.verdict}`,
    '',
    '| Estado | Gravedad | Comprobación | Esperado | Medido |',
    '|---|---|---|---|---|',
    ...rows,
    '',
    'Contact sheets: ' + r.contactSheets.map((s) => `\`${s}\``).join(', '),
    '',
  ].join('\n');
}

