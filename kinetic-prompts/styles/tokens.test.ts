import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { CONTRAST_PAIRS, MIN_TEXT_CONTRAST, contrastRatio } from "@/lib/contrast";

const css = readFileSync(join(__dirname, "tokens.css"), "utf8");
const [rootBlock, reducedBlock] = css.split("@media (prefers-reduced-motion: reduce)") as [string, string];

function token(name: string, block = rootBlock): string {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`Falta el token ${name}`);
  return match[1].trim();
}

describe("tokens de color", () => {
  test("coinciden con la tabla de docs/PLAN.md", () => {
    expect({
      "--bg": token("--bg"),
      "--surface": token("--surface"),
      "--surface-2": token("--surface-2"),
      "--border": token("--border"),
      "--text": token("--text"),
      "--text-muted": token("--text-muted"),
      "--accent": token("--accent"),
      "--success": token("--success"),
      "--warning": token("--warning"),
      "--danger": token("--danger"),
    }).toEqual({
      "--bg": "#0e0f12",
      "--surface": "#16181d",
      "--surface-2": "#1f2229",
      "--border": "#2a2e37",
      "--text": "#ecedef",
      "--text-muted": "#9095a0",
      "--accent": "#ff6b3d",
      "--success": "#3dd68c",
      "--warning": "#f5b841",
      "--danger": "#f2555a",
    });
  });

  test("criterio de la fase 1: --text-muted sobre --surface ≥ 4,5:1", () => {
    expect(contrastRatio(token("--text-muted"), token("--surface"))).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });

  test.each(CONTRAST_PAIRS.map((p) => [p.fg, p.bg, p.uso] as const))(
    "%s sobre %s (%s) cumple 4,5:1",
    (fg, bg) => {
      expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    },
  );

  test("el texto sobre el acento es --bg y el blanco no serviría", () => {
    expect(token("--on-accent")).toBe("var(--bg)");
    expect(contrastRatio("#ffffff", token("--accent"))).toBeLessThan(MIN_TEXT_CONTRAST);
  });
});

describe("tokens de forma y movimiento", () => {
  test("radios, escala tipográfica y easing del plan", () => {
    expect([token("--r-control"), token("--r-card"), token("--r-panel")]).toEqual(["6px", "12px", "20px"]);
    const scale = ["12", "14", "16", "20", "28", "40", "64"].map((n) => parseFloat(token(`--fs-${n}`)) * 16);
    expect(scale).toEqual([12, 14, 16, 20, 28, 40, 64]);
    expect(token("--ease")).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");
    expect([token("--dur-hover"), token("--dur-ui"), token("--dur-signature")]).toEqual([
      "150ms",
      "240ms",
      "600ms",
    ]);
  });

  test("con movimiento reducido todo pasa a fundidos de 100 ms sin desplazamientos", () => {
    expect(reducedBlock).toBeDefined();
    for (const name of ["--dur-hover", "--dur-ui", "--dur-signature"]) {
      expect(token(name, reducedBlock)).toBe("100ms");
    }
    expect([
      token("--lift", reducedBlock),
      token("--shift", reducedBlock),
      token("--press-scale", reducedBlock),
    ]).toEqual(["0px", "0px", "1"]);
  });
});
