import { describe, expect, test } from "vitest";

import { composeWebPrompt, embedPiece } from "./compose";
import { CATEGORIES, defaultValues, getPublishedAnimations } from "./content";

const items = getPublishedAnimations();
const pick = (category: string) => {
  const item = items.find((i) => i.category === category)!;
  return { ...item, categoryLabel: CATEGORIES[item.category], values: defaultValues(item) };
};

describe("composeWebPrompt", () => {
  const pieces = ["fondos", "transiciones", "texto", "objetos"].map(pick);

  test.each(["auto", "nextjs", "astro", "html"] as const)(
    "con %s, sin variables ni marcas sueltas",
    (stack) => {
      const text = composeWebPrompt({ pieces, stack, brief: { name: "Café Norte", sector: "cafetería" } });
      expect(text).not.toMatch(/\{\{|<!--/);
      expect(text.startsWith("# Prompt de mi web: Café Norte")).toBe(true);
      for (const p of pieces) expect(text).toContain(`${p.categoryLabel}: ${p.title}`);
    },
  );

  test("monta la transición de página al final y el fondo primero", () => {
    const text = composeWebPrompt({ pieces: [pieces[1]!, pieces[0]!], stack: "auto" });
    expect(text.indexOf(pieces[0]!.title)).toBeLessThan(text.indexOf(pieces[1]!.title));
    expect(text).toContain("Una sola transición de página");
    expect(text).toContain("Un solo fondo animado");
  });

  test("incrusta cada pieza sin su título y con las secciones un nivel más abajo", () => {
    const body = embedPiece(pieces[0]!, "auto");
    expect(body.startsWith("### 1. Objetivo visual")).toBe(true);
    expect(body).not.toMatch(/^# /m);
    expect(body).not.toMatch(/^## /m);
  });

  test("sin nombre, usa el contenido del proyecto; con Next.js, deja solo sus instrucciones", () => {
    const text = composeWebPrompt({ pieces, stack: "nextjs" });
    expect(text).toContain("usa el nombre y el contenido que ya tenga el proyecto");
    expect(text).not.toContain("Astro o HTML de varias páginas");
  });
});
