import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { defaultPrompt, getAnimations, getPublishedAnimations, parseAnimation } from "./content";
import { promptVariables, renderPrompt, selectStack } from "./prompt-render";

const items = getAnimations();

describe("catálogo de Animaciones (content/animaciones)", () => {
  test("todos los item.json se leen sin errores", () => {
    expect(items.length).toBeGreaterThan(0);
  });

  test.each(items.map((i) => [i.slug, i] as const))("%s: cada parámetro sale en el prompt", (_, item) => {
    const used = promptVariables(item.promptTemplate);
    for (const param of item.params) expect(used).toContain(param.id);
  });

  test.each(items.map((i) => [i.slug, i] as const))(
    "%s: el prompt por defecto no deja {{variables}}",
    (_, item) => {
      expect(defaultPrompt(item)).not.toMatch(/\{\{/);
    },
  );

  test.each(items.map((i) => [i.slug, i] as const))("%s: las fichas citadas existen", (_, item) => {
    for (const ref of item.knowledgeRefs) expect(existsSync(join(process.cwd(), ref)), ref).toBe(true);
  });

  test("lo publicado tiene vídeo y póster dentro de los límites", () => {
    for (const item of getPublishedAnimations()) {
      const dir = join(process.cwd(), "content", "animaciones", item.slug);
      for (const [file, max] of [
        [item.media.video, 600 * 1024],
        [item.media.videoMp4, 600 * 1024],
        [item.media.poster, 80 * 1024],
      ] as const) {
        expect(file, `${item.slug}: falta un archivo de media`).toBeTruthy();
        expect(statSync(join(dir, file!)).size).toBeLessThan(max);
      }
    }
  });
});

describe("parseAnimation", () => {
  const valid = {
    section: "animaciones",
    slug: "demo-ok",
    title: "Demo",
    summary: "Se ve algo.",
    category: "transiciones",
    tech: ["CSS"],
    difficulty: 1,
    performance: "ligero",
    status: "IMPLEMENTADO",
    knowledgeRefs: ["knowledge/css/CSS-002-view-transitions.md"],
    usedIn: [],
    params: [
      {
        id: "duration",
        label: "Duración",
        type: "range",
        min: 0.1,
        max: 1,
        step: 0.1,
        unit: "s",
        default: 0.3,
      },
    ],
    media: {},
    createdAt: "2026-11-26",
  };

  test("acepta un elemento correcto", () => {
    expect(parseAnimation(valid, "# {{title}} en {{duration}} s", "x").slug).toBe("demo-ok");
  });

  test("rechaza una variable del prompt sin parámetro", () => {
    expect(() => parseAnimation(valid, "{{color}}", "x")).toThrow(/sin parámetro: color/);
  });

  test("rechaza NO VERIFICADO sin motivo", () => {
    expect(() => parseAnimation({ ...valid, status: "NO VERIFICADO" }, "x", "x")).toThrow(/statusReason/);
  });

  test("rechaza un default fuera de rango", () => {
    const params = [{ ...valid.params[0], default: 5 }];
    expect(() => parseAnimation({ ...valid, params }, "{{duration}}", "x")).toThrow(/fuera de/);
  });
});

describe("renderPrompt", () => {
  test("rellena con formato español y deja intactas las desconocidas", () => {
    expect(renderPrompt("{{a}} s · {{b}} · {{c}}", { a: 0.55, b: "#e4572e" })).toBe(
      "0,55 s · #e4572e · {{c}}",
    );
  });
});

describe("selectStack", () => {
  const template =
    "A\n<!-- solo: nextjs -->\nN\n<!-- fin -->\n<!-- solo: astro, html -->\nH\n<!-- fin -->\nZ";
  test("con «auto» deja todos los bloques y quita las marcas", () => {
    expect(selectStack(template, "auto")).toBe("A\nN\nH\nZ");
  });
  test("con un tipo de proyecto deja solo sus bloques", () => {
    expect(selectStack(template, "nextjs")).toBe("A\nN\nZ");
    expect(selectStack(template, "html")).toBe("A\nH\nZ");
  });
  test.each(items.map((i) => [i.slug, i] as const))(
    "%s: ningún tipo de proyecto deja marcas sueltas",
    (_, item) => {
      for (const stack of ["auto", "nextjs", "astro", "html"] as const) {
        expect(selectStack(item.promptTemplate, stack)).not.toMatch(/<!--/);
      }
    },
  );
});
