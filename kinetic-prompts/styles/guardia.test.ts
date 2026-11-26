/**
 * Guardia del sistema de diseño: recorre app/ y components/ y falla si encuentra algo de la
 * lista «Prohibido» de docs/PLAN.md (colores o tamaños sueltos, sombras, degradados, emojis).
 * Los únicos archivos con valores literales son styles/tokens.css y app/globals.css (el tema).
 * Una línea puede permitir un hex de contenido (p. ej. el valor de ejemplo de un parámetro)
 * con el comentario «kp-permitir-hex».
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, test } from "vitest";

const ROOT = join(__dirname, "..");
const SOURCES = ["app", "components"];
const THEME_FILES = new Set(["app/globals.css"]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const files = SOURCES.flatMap((dir) => walk(join(ROOT, dir))).map((path) => ({
  path: relative(ROOT, path),
  lines: readFileSync(path, "utf8").split("\n"),
}));

type Rule = { name: string; pattern: RegExp; allow?: (line: string) => boolean; themeToo?: boolean };

const TAILWIND_PALETTE =
  "white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const ALLOWED_SPACING = new Set(["0", "1", "2", "3", "4", "6", "8", "12", "16", "24"]);

const RULES: Rule[] = [
  {
    name: "color hexadecimal suelto",
    pattern: /#[0-9a-fA-F]{3,8}\b/,
    allow: (line) => line.includes("kp-permitir-hex"),
    themeToo: true,
  },
  { name: "función de color suelta", pattern: /\b(rgba?|hsla?|oklch|oklab|lch|lab|hwb)\(/, themeToo: true },
  { name: "valor arbitrario con unidades", pattern: /-\[[^\]]*\d(px|rem|em|vh|vw|%)[^\]]*\]/ },
  { name: "longitud literal en style", pattern: /style=\{\{[^}]*\d+(px|rem|em)/ },
  { name: "sombra", pattern: /(?<![\w-])(drop-|inset-)?shadow-(?!none\b)[\w[(]/ },
  {
    name: "degradado",
    pattern: /(?<![\w-])(bg-(linear|radial|conic|gradient)|from-|via-)[\w[(]|linear-gradient\(/,
  },
  {
    name: "color de la paleta por defecto de Tailwind",
    pattern: new RegExp(`(?<![\\w-])[a-z]+-(${TAILWIND_PALETTE})(-\\d+)?\\b`),
  },
  { name: "emoji", pattern: /(?!✓)\p{Extended_Pictographic}/u },
];

function findViolations(rule: Rule) {
  return files
    .filter((file) => rule.themeToo || !THEME_FILES.has(file.path))
    .flatMap((file) =>
      file.lines.flatMap((line, i) =>
        rule.pattern.test(line) && !rule.allow?.(line) ? [`${file.path}:${i + 1}  ${line.trim()}`] : [],
      ),
    );
}

describe("guardia del sistema de diseño", () => {
  test("hay archivos que revisar", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  test.each(RULES.map((rule) => [rule.name, rule] as const))("sin %s", (_name, rule) => {
    expect(findViolations(rule)).toEqual([]);
  });

  test("espaciado solo de la escala 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96", () => {
    const spacing =
      /(?<![\w-])-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|scroll-mt)-(\d+(?:\.\d+)?)(?![\w.])/g;
    const violations = files
      .filter((file) => file.path.endsWith(".tsx") || file.path.endsWith(".ts"))
      .flatMap((file) =>
        file.lines.flatMap((line, i) =>
          [...line.matchAll(spacing)]
            .filter((match) => !ALLOWED_SPACING.has(match[1] ?? ""))
            .map((match) => `${file.path}:${i + 1}  ${match[0]}`),
        ),
      );
    expect(violations).toEqual([]);
  });
});
