import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "./page";

test("la página de inicio muestra el nombre de la app", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "Kinetic Prompts" })).toBeDefined();
});
