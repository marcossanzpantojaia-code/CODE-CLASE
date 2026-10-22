import { spawn } from 'node:child_process';
import type { RunLog } from './log';
import { ROOT, assertWritable } from './project';

export interface RunOptions {
  log: RunLog;
  /** Ficheros que el comando va a escribir: se validan contra la zona protegida antes de lanzar. */
  outputs?: string[];
  /** Por defecto la raíz del proyecto: las rutas relativas de fuentes en filtros FFmpeg dependen de ello. */
  cwd?: string;
  allowFailure?: boolean;
}

export interface RunResult {
  code: number;
  stdout: Buffer;
  stderr: string;
  ms: number;
}

export class ProcError extends Error {
  override name = 'ProcError';
}

/** Lanza un proceso sin shell (array de argumentos: sin problemas de escapado en Windows) y lo registra. */
export function run(cmd: string, args: string[], opts: RunOptions): Promise<RunResult> {
  for (const o of opts.outputs ?? []) assertWritable(o);
  const cwd = opts.cwd ?? ROOT;
  const t0 = performance.now();

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, windowsHide: true });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on('data', (d: Buffer) => out.push(d));
    child.stderr.on('data', (d: Buffer) => err.push(d));
    child.on('error', (e) => {
      opts.log.event('proc', { cmd, args, cwd, error: String(e) });
      reject(new ProcError(`No se pudo lanzar ${cmd}: ${String(e)}`));
    });
    child.on('close', (code) => {
      const ms = Math.round(performance.now() - t0);
      const stderr = Buffer.concat(err).toString('utf8');
      const result: RunResult = { code: code ?? -1, stdout: Buffer.concat(out), stderr, ms };
      opts.log.event('proc', { cmd, args, cwd, code: result.code, ms, stderrTail: stderr.slice(-1500) });
      if (result.code !== 0 && !opts.allowFailure) {
        reject(new ProcError(`${cmd} terminó con código ${result.code}:\n${stderr.slice(-1500)}`));
      } else {
        resolve(result);
      }
    });
  });
}

export function ffmpeg(args: string[], opts: RunOptions): Promise<RunResult> {
  return run('ffmpeg', ['-hide_banner', '-nostdin', ...args], opts);
}
