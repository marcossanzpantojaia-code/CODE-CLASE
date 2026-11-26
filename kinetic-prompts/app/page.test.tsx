import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { UIProviders } from "@/components/ui/providers";
import { APARTADOS } from "@/lib/apartados";

import Home from "./page";

test("el inicio presenta la app, enlaza la galería y muestra todos los apartados", () => {
  render(
    <UIProviders>
      <Home />
    </UIProviders>,
  );
  expect(screen.getByRole("heading", { level: 1, name: /Elige el efecto/ })).toBeDefined();
  expect(screen.getByRole("link", { name: /Kinetic Prompts/ })).toBeDefined();
  expect(screen.getByRole("link", { name: /Ver animaciones/ })).toBeDefined();
  for (const a of APARTADOS) expect(screen.getAllByText(a.label).length).toBeGreaterThan(0);
});
