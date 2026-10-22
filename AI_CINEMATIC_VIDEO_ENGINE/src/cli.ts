import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { analyzeBeats, refineBeats } from './audio/beats';
import { RunLog } from './core/log';
import { parseManifest } from './core/manifest';
import { resolveFromRoot } from './core/project';
import { type IngestResult, ingest } from './ingest/ingest';
import { technicalQa } from './qa/qa';
import { type Quality, renderManifestFile } from './rendering/render';

const USAGE = `Uso: npm run engine -- <orden> [opciones]

  render <manifiesto.json> [--final] [--concurrency N]   render (preview por defecto) + QA técnico
  qa <video.mp4> <manifiesto.json> [--final]              solo QA técnico de un vídeo ya renderizado
  ingest <manifiesto.json>                                verifica originales y genera intermedios
  beats <audio>                                           tempo, beats y onsets de una pista
`;

function loadManifest(p: string) {
  return parseManifest(JSON.parse(fs.readFileSync(resolveFromRoot(p), 'utf8')));
}

async function main(): Promise<number> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { final: { type: 'boolean', default: false }, concurrency: { type: 'string' }, help: { type: 'boolean', default: false } },
  });
  const [cmd, a1, a2] = positionals;
  const quality: Quality = values.final ? 'final' : 'preview';
  if (values.help || !cmd) {
    process.stdout.write(USAGE);
    return cmd ? 0 : 1;
  }

  const log = new RunLog(cmd);
  switch (cmd) {
    case 'render': {
      if (!a1) break;
      const rec = await renderManifestFile(a1, quality, log, values.concurrency ? { concurrency: Number(values.concurrency) } : {});
      const m = loadManifest(a1);
      const ing = JSON.parse(fs.readFileSync(resolveFromRoot(`analysis/${m.name}/ingest.json`), 'utf8')) as IngestResult;
      const qa = await log.stage('QA técnico', () => technicalQa(resolveFromRoot(rec.output.path), m, quality, log, { ingest: ing, mixFile: resolveFromRoot(rec.audio.file) }));
      process.stdout.write(`\n${rec.output.path}\n${qa.verdict}\nQA: ${rec.output.path}.qa/qa.md\nLog: ${log.file}\n`);
      return qa.checks.some((c) => c.status === 'FAIL') ? 2 : 0;
    }
    case 'qa': {
      if (!a1 || !a2) break;
      const m = loadManifest(a2);
      const ingFile = resolveFromRoot(`analysis/${m.name}/ingest.json`);
      const ing = fs.existsSync(ingFile) ? (JSON.parse(fs.readFileSync(ingFile, 'utf8')) as IngestResult) : undefined;
      const qa = await technicalQa(resolveFromRoot(a1), m, quality, log, ing ? { ingest: ing } : {});
      process.stdout.write(`${qa.verdict}\n`);
      return qa.checks.some((c) => c.status === 'FAIL') ? 2 : 0;
    }
    case 'ingest': {
      if (!a1) break;
      const res = await ingest(loadManifest(a1), log);
      for (const a of Object.values(res.assets)) process.stdout.write(`${a.assetId}: ${a.notes.join('; ') || 'sin cambios'}\n`);
      return 0;
    }
    case 'beats': {
      if (!a1) break;
      const b = await analyzeBeats(resolveFromRoot(a1), log);
      const refined = refineBeats(b.beats, b.onsets);
      process.stdout.write(JSON.stringify({ tempoBpm: b.tempoBpm, beats: refined.map((r) => r.t), onsets: b.onsets.length }, null, 2) + '\n');
      return 0;
    }
    default:
      break;
  }
  process.stdout.write(USAGE);
  return 1;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    process.stderr.write(`ERROR: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  },
);
