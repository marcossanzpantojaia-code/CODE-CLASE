import { describe, expect, test } from "vitest";

import { composeWebPrompt, embedPiece, headlineContrast } from "./compose";
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

describe("headlineContrast", () => {
  test("avisa del titular oscuro sobre un fondo oscuro y propone uno claro que sí se lee", () => {
    const check = headlineContrast("#071a1f", "#1c1b19")!; // kp-permitir-hex: colores de las demos
    expect(check.ok).toBe(false);
    expect(check.tone).toBe("claro");
    expect(headlineContrast("#071a1f", check.suggestion)!.ok).toBe(true); // kp-permitir-hex
  });

  test("da por bueno un titular claro sobre un fondo oscuro y no comprueba si falta un color", () => {
    expect(headlineContrast("#0e1417", "#e9f5d0")!.ok).toBe(true); // kp-permitir-hex
    expect(headlineContrast(undefined, "#e9f5d0")).toBeNull(); // kp-permitir-hex
  });

  test("todos los fondos tienen color base y todas las letras color de texto (la comprobación depende de ello)", () => {
    for (const item of items.filter((i) => i.category === "fondos"))
      expect(
        item.params.some((p) => p.id === "base" && p.type === "color"),
        item.slug,
      ).toBe(true);
    for (const item of items.filter((i) => i.category === "texto"))
      expect(
        item.params.some((p) => p.id === "color" && p.type === "color"),
        item.slug,
      ).toBe(true);
  });
});
