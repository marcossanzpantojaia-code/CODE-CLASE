import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { UIProviders } from "@/components/ui/providers";

import { DesignShowcase } from "./_components/showcase";
import DesignPage from "./page";

describe("/design", () => {
  afterEach(() => vi.unstubAllEnvs());

  test("en producción no existe (404)", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => DesignPage()).toThrow();
  });

  test("muestra todas las secciones, el botón de copia y los 12 componentes del plan", () => {
    render(
      <UIProviders>
        <DesignShowcase />
      </UIProviders>,
    );
    for (const name of [
      "Botón de copia",
      "Paleta",
      "Contraste",
      "Tipografía",
      "Espaciado y forma",
      "Movimiento",
      "Componentes",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeDefined();
    }
    const matrices = [...document.querySelectorAll("[data-matriz]")].map((el) =>
      el.getAttribute("data-matriz"),
    );
    for (const component of [
      "CopyButton · tarjeta",
      "CopyButton · ficha",
      "Button · primario",
      "Button · secundario",
      "Button · fantasma",
      "IconButton",
      "Chip · normal",
      "Chip · activo",
      "Input",
      "SearchField",
      "Select",
      "Slider",
      "ColorPicker",
      "TabsTrigger",
    ]) {
      expect(matrices).toContain(component);
    }
    // Un botón de copia por cada categoría de Animaciones, Fondos incluida.
    const botonera = document.querySelector("[data-botonera]");
    expect(botonera?.querySelectorAll("button")).toHaveLength(7);
    expect(botonera?.textContent).toContain("Fondos");
    for (const name of ["Botonera de prueba", "Avisos (Toast)", "Tooltip", "Skeleton (cargando)"]) {
      expect(screen.getByRole("heading", { level: 3, name })).toBeDefined();
    }
  });
});
