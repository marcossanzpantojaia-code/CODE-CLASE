import fs from 'node:fs';
import path from 'node:path';
import { dirs, ensureDir, newRunId } from './project';

/** Log de ejecución en JSONL: un evento por línea, en logs/<runId>.jsonl. */
export class RunLog {
  readonly runId: string;
  readonly file: string;

  constructor(
    label: string,
    private readonly echo: boolean = true,
  ) {
    this.runId = newRunId(label);
    this.file = path.join(ensureDir(dirs.logs), `${this.runId}.jsonl`);
  }

  event(event: string, data: Record<string, unknown> = {}): void {
    fs.appendFileSync(this.file, JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n');
  }

  info(msg: string, data: Record<string, unknown> = {}): void {
    this.event('info', { msg, ...data });
    if (this.echo) process.stderr.write(`· ${msg}\n`);
  }

  warn(msg: string, data: Record<string, unknown> = {}): void {
    this.event('warn', { msg, ...data });
    if (this.echo) process.stderr.write(`! ${msg}\n`);
  }

  /** Mide una etapa y registra su duración. */
  async stage<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const t0 = performance.now();
    this.info(`${name}…`);
    try {
      const out = await fn();
      this.event('stage', { name, ok: true, ms: Math.round(performance.now() - t0) });
      return out;
    } catch (err) {
      this.event('stage', { name, ok: false, ms: Math.round(performance.now() - t0), error: String(err) });
      throw err;
    }
  }
}
