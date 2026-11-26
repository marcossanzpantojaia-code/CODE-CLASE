/**
 * Catálogo de Animaciones leído de content/animaciones/<slug>/ (item.json + prompt.md).
 * Se lee con fs síncrono: con Cache Components cuenta como valor predecible y entra en el
 * prerenderizado. Solo para el servidor.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type ParamValue, promptVariables, renderPrompt, selectStack, type StackId } from "./prompt-render";

export const CATEGORIES = {
  transiciones: "Transiciones de página",
  scroll: "Scroll",
  heros: "Heros",
  texto: "Letras",
  microinteracciones: "Microinteracciones",
  "3d-webgl": "3D / WebGL",
  fondos: "Fondos",
} as const;
export type Category = keyof typeof CATEGORIES;

/** Niveles de complejidad (docs/PLAN.md, «Niveles de complejidad»). */
export const LEVELS = { 1: "Básico", 2: "Intermedio", 3: "Avanzado" } as const;
export type Level = keyof typeof LEVELS;

export const STATUSES = ["IMPLEMENTADO", "VALIDADO", "NO VERIFICADO"] as const;
export type Status = (typeof STATUSES)[number];

export type Param =
  | {
      id: string;
      label: string;
      type: "range";
      min: number;
      max: number;
      step: number;
      unit: string;
      default: number;
    }
  | { id: string; label: string; type: "color"; default: string }
  | { id: string; label: string; type: "select"; options: string[]; default: string }
  | { id: string; label: string; type: "text"; default: string }
  | { id: string; label: string; type: "palette"; default: string[] };

export type AnimationItem = {
  section: "animaciones";
  slug: string;
  title: string;
  /** Una frase que dice qué se ve, para la tarjeta. */
  summary: string;
  category: Category;
  tech: string[];
  difficulty: Level;
  performance: "ligero" | "medio" | "pesado";
  status: Status;
  statusReason?: string;
  knowledgeRefs: string[];
  usedIn: string[];
  params: Param[];
  media: { video?: string; videoMp4?: string; poster?: string };
  createdAt: string;
  demo?: boolean;
  /** Consejos sacados de las fichas de la biblioteca, en lenguaje llano (se ven en el panel). */
  tips: string[];
  /** Plantilla de prompt.md, con {{variables}}. */
  promptTemplate: string;
};

class ContentError extends Error {
  constructor(file: string, message: string) {
    super(`${file}: ${message}`);
    this.name = "ContentError";
  }
}

function fail(file: string, message: string): never {
  throw new ContentError(file, message);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseParam(raw: unknown, file: string): Param {
  if (!raw || typeof raw !== "object") fail(file, "un parámetro no es un objeto");
  const p = raw as Record<string, unknown>;
  if (!isString(p.id) || !/^[a-zA-Z][\w-]*$/.test(p.id))
    fail(file, `id de parámetro no válido: ${String(p.id)}`);
  if (!isString(p.label)) fail(file, `al parámetro ${p.id} le falta label`);
  switch (p.type) {
    case "range":
      for (const key of ["min", "max", "step", "default"] as const)
        if (typeof p[key] !== "number") fail(file, `${p.id}: ${key} debe ser un número`);
      if (!isString(p.unit)) fail(file, `${p.id}: falta unit`);
      if ((p.default as number) < (p.min as number) || (p.default as number) > (p.max as number))
        fail(file, `${p.id}: default fuera de [min, max]`);
      break;
    case "color":
      if (!isString(p.default) || !/^#[0-9a-f]{6}$/i.test(p.default))
        fail(file, `${p.id}: default debe ser #rrggbb`);
      break;
    case "select":
      if (!Array.isArray(p.options) || !p.options.every(isString))
        fail(file, `${p.id}: options debe ser una lista`);
      if (!isString(p.default) || !(p.options as string[]).includes(p.default))
        fail(file, `${p.id}: default debe ser una de las options`);
      break;
    case "text":
      if (!isString(p.default)) fail(file, `${p.id}: falta default`);
      break;
    case "palette":
      if (
        !Array.isArray(p.default) ||
        !p.default.every((c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c))
      )
        fail(file, `${p.id}: default debe ser una lista de #rrggbb`);
      break;
    default:
      fail(file, `${p.id}: tipo desconocido ${String(p.type)}`);
  }
  return p as unknown as Param;
}

/** Lee y comprueba un elemento. Lanza un error que dice qué falla y en qué archivo. */
export function parseAnimation(raw: unknown, promptTemplate: string, file: string): AnimationItem {
  if (!raw || typeof raw !== "object") fail(file, "no es un objeto JSON");
  const d = raw as Record<string, unknown>;
  if (d.section !== "animaciones") fail(file, 'section debe ser "animaciones"');
  if (!isString(d.slug) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) fail(file, "slug debe ir en kebab-case");
  if (!isString(d.title)) fail(file, "falta title");
  if (!isString(d.summary)) fail(file, "falta summary");
  if (!isString(d.category) || !(d.category in CATEGORIES))
    fail(file, `category desconocida: ${String(d.category)}`);
  if (!Array.isArray(d.tech) || !d.tech.every(isString) || d.tech.length === 0)
    fail(file, "tech debe ser una lista");
  if (d.difficulty !== 1 && d.difficulty !== 2 && d.difficulty !== 3)
    fail(file, "difficulty debe ser 1, 2 o 3");
  if (!["ligero", "medio", "pesado"].includes(d.performance as string)) fail(file, "performance no válido");
  if (!STATUSES.includes(d.status as Status)) fail(file, `status no válido: ${String(d.status)}`);
  if (d.status === "NO VERIFICADO" && !isString(d.statusReason))
    fail(file, "NO VERIFICADO necesita statusReason");
  if (
    !Array.isArray(d.knowledgeRefs) ||
    !d.knowledgeRefs.every((r) => isString(r) && r.startsWith("knowledge/"))
  )
    fail(file, "knowledgeRefs debe ser una lista de rutas que empiecen por knowledge/");
  if (!Array.isArray(d.usedIn)) fail(file, "usedIn debe ser una lista");
  if (!Array.isArray(d.params)) fail(file, "params debe ser una lista");
  const params = d.params.map((p) => parseParam(p, file));
  if (!d.media || typeof d.media !== "object") fail(file, "falta media");
  if (d.tips !== undefined && (!Array.isArray(d.tips) || !d.tips.every(isString)))
    fail(file, "tips debe ser una lista de frases");
  if (!isString(d.createdAt) || !/^\d{4}-\d{2}-\d{2}$/.test(d.createdAt))
    fail(file, "createdAt debe ser AAAA-MM-DD");
  if (!isString(promptTemplate)) fail(file, "prompt.md está vacío");

  const known = new Set([...params.map((p) => p.id), "title"]);
  const unknown = promptVariables(promptTemplate).filter((v) => !known.has(v));
  if (unknown.length) fail(file, `el prompt usa variables sin parámetro: ${unknown.join(", ")}`);

  return {
    ...(d as unknown as AnimationItem),
    params,
    tips: (d.tips as string[] | undefined) ?? [],
    promptTemplate,
  };
}

/** Todos los elementos, de más nuevo a más antiguo. Las rutas están fijas en content/animaciones
 * para que el empaquetador no rastree todo el proyecto. */
export function getAnimations(): AnimationItem[] {
  if (!existsSync(join(process.cwd(), "content", "animaciones"))) return [];
  const items = readdirSync(join(process.cwd(), "content", "animaciones"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => {
      const slug = entry.name;
      const file = `content/animaciones/${slug}/item.json`;
      const item = parseAnimation(
        JSON.parse(readFileSync(join(process.cwd(), "content", "animaciones", slug, "item.json"), "utf8")),
        readFileSync(join(process.cwd(), "content", "animaciones", slug, "prompt.md"), "utf8"),
        file,
      );
      if (item.slug !== slug) fail(file, `el slug (${item.slug}) no coincide con la carpeta`);
      return item;
    });
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title, "es"));
}

/** Solo lo publicable: VALIDADO y que no sea de ejemplo (docs/PLAN.md, «Publicación»). */
export function getPublishedAnimations(): AnimationItem[] {
  return getAnimations().filter((item) => item.status === "VALIDADO" && !item.demo);
}

export function defaultValues(item: Pick<AnimationItem, "params" | "title">): Record<string, ParamValue> {
  return Object.fromEntries([["title", item.title], ...item.params.map((p) => [p.id, p.default])]);
}

/** El prompt con los valores por defecto y las instrucciones de todos los tipos de proyecto. */
export function defaultPrompt(item: AnimationItem, stack: StackId = "auto"): string {
  return renderPrompt(selectStack(item.promptTemplate, stack), defaultValues(item));
}

type Manifest = { columnas: string[]; fichas: string[][] };

/** Títulos de las fichas citadas, leídos del manifiesto de la biblioteca (sin cargar las fichas). */
export function knowledgeTitles(refs: string[]): string[] {
  const path = join(process.cwd(), "knowledge", "integration", "LIBRARY_MANIFEST.json");
  if (!existsSync(path)) return [];
  const manifest = JSON.parse(
    readFileSync(join(process.cwd(), "knowledge", "integration", "LIBRARY_MANIFEST.json"), "utf8"),
  ) as Manifest;
  const ruta = manifest.columnas.indexOf("ruta");
  const titulo = manifest.columnas.indexOf("titulo");
  const byPath = new Map(manifest.fichas.map((f) => [`knowledge/${f[ruta]}`, f[titulo]!]));
  return refs.map((ref) => byPath.get(ref)).filter((t): t is string => Boolean(t));
}

/** URL pública de un archivo de preview/ o media/ (copiado por scripts/sync-content.mjs). */
export function contentUrl(item: Pick<AnimationItem, "slug">, path: string): string {
  return `/contenido/animaciones/${item.slug}/${path}`;
}
