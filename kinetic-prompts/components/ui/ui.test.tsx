import { fireEvent, render, screen } from "@testing-library/react";
import { Heart } from "lucide-react";
import { describe, expect, test, vi } from "vitest";

import { Button } from "./button";
import { Chip } from "./chip";
import { ColorPicker } from "./color-picker";
import { IconButton } from "./icon-button";
import { Input } from "./input";
import { SearchField } from "./search-field";
import { Slider } from "./slider";

describe("Button", () => {
  test("cargando: se anuncia, sigue enfocable y no ejecuta la acción", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Copiar prompt
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Copiar prompt" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(false);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("deshabilitado: no ejecuta la acción", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Repetir
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Repetir" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  test("es type=button por defecto para no enviar formularios", () => {
    render(<Button>Repetir</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });
});

describe("IconButton y Chip", () => {
  test("IconButton usa la etiqueta como nombre accesible y anuncia el estado pulsado", () => {
    render(<IconButton icon={Heart} label="Añadir a favoritos" pressed />);
    const button = screen.getByRole("button", { name: "Añadir a favoritos" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  test("Chip activo se anuncia con aria-pressed", () => {
    render(
      <>
        <Chip active>Scroll</Chip>
        <Chip>Texto</Chip>
      </>,
    );
    expect(screen.getByRole("button", { name: "Scroll" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Texto" }).getAttribute("aria-pressed")).toBe("false");
  });
});

describe("Input", () => {
  test("la etiqueta está asociada y el error marca el campo como inválido", () => {
    render(<Input label="Ciudad" error="La ciudad debe tener al menos 2 letras." />);
    const input = screen.getByLabelText("Ciudad");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe("La ciudad debe tener al menos 2 letras.");
  });
});

describe("SearchField", () => {
  test("«/» enfoca el buscador y Escape lo vacía", () => {
    const onValueChange = vi.fn();
    render(<SearchField label="Buscar animaciones" shortcut onValueChange={onValueChange} />);
    const input = screen.getByRole("searchbox", { name: "Buscar animaciones" });
    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "cortina" } });
    expect(onValueChange).toHaveBeenLastCalledWith("cortina");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  test("el botón de borrar aparece con texto y vacía el campo", () => {
    render(<SearchField label="Buscar" defaultValue="scroll" />);
    fireEvent.click(screen.getByRole("button", { name: "Borrar búsqueda" }));
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
  });
});

describe("ColorPicker", () => {
  test("valida el formato al salir del campo", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker label="Color de la cortina" defaultValue="#112233" onValueChange={onValueChange} />);
    const field = screen.getByLabelText("Color de la cortina");
    fireEvent.change(field, { target: { value: "rojo" } });
    fireEvent.blur(field);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: "#AABBCC" } });
    fireEvent.blur(field);
    expect(field.getAttribute("aria-invalid")).toBeNull();
    expect(onValueChange).toHaveBeenCalledWith("#aabbcc");
  });
});

describe("Slider", () => {
  test("expone el valor con su unidad a los lectores de pantalla", () => {
    render(<Slider label="Duración" min={0.4} max={1.6} step={0.1} defaultValue={0.9} unit="s" />);
    const thumb = screen.getByRole("slider");
    expect(thumb.getAttribute("aria-valuetext")).toBe("0,9 s");
    expect(screen.getByText("0,9 s")).toBeDefined();
  });
});
