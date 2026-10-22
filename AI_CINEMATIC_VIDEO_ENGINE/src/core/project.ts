import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const dirs = {
  root: ROOT,
  assets: path.join(ROOT, 'assets'),
  originals: path.join(ROOT, 'assets', 'originals'),
  analysis: path.join(ROOT, 'analysis'),
  editDecisions: path.join(ROOT, 'edit-decisions'),
  cache: path.join(ROOT, 'cache'),
  previews: path.join(ROOT, 'previews'),
  exports: path.join(ROOT, 'exports'),
  reports: path.join(ROOT, 'reports'),
  logs: path.join(ROOT, 'logs'),
  fonts: path.join(ROOT, 'resources', 'fonts'),
  python: path.join(ROOT, 'python'),
} as const;

export const venvPython =
  process.platform === 'win32'
    ? path.join(ROOT, '.venv', 'Scripts', 'python.exe')
    : path.join(ROOT, '.venv', 'bin', 'python');

export class ProtectedPathError extends Error {
  override name = 'ProtectedPathError';
}

function isInside(parent: string, target: string): boolean {
  const rel = path.relative(parent, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Toda ruta que el pipeline vaya a escribir pasa por aquí. Nada bajo assets/ se escribe
 * jamás: los originales solo entran por importOriginal(), que nunca sobrescribe.
 */
export function assertWritable(target: string): string {
  const abs = path.resolve(ROOT, target);
  if (isInside(dirs.assets, abs)) {
    throw new ProtectedPathError(`Escritura bloqueada en zona protegida: ${path.relative(ROOT, abs)}`);
  }
  return abs;
}

export function ensureDir(dir: string): string {
  const abs = assertWritable(dir);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

export function writeText(file: string, content: string): string {
  const abs = assertWritable(file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return abs;
}

export function writeJson(file: string, value: unknown): string {
  return writeText(file, JSON.stringify(value, null, 2) + '\n');
}

export function rel(abs: string): string {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

/** Ruta del manifiesto (relativa a la raíz) → absoluta. */
export function resolveFromRoot(p: string): string {
  return path.resolve(ROOT, p);
}

/** Identificador de ejecución ordenable y apto para nombres de fichero. */
export function newRunId(label: string): string {
  const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return `${ts}-${label}`;
}
