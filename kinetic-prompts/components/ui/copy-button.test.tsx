import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CopyBlockedError } from "@/lib/clipboard";

import { COPIED_MS, CopyButton } from "./copy-button";
import { CopyProvider } from "./copy-provider";
import { UIProviders } from "./providers";
import { ToastProvider } from "./toast";

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
});

/** Espera a que terminen las promesas del clic. */
async function flush() {
  await act(async () => {});
}

describe("CopyButton", () => {
  test("un clic copia el texto, pasa a «Copiado» 2 s y lo anuncia", async () => {
    vi.useFakeTimers();
    render(
      <UIProviders>
        <CopyButton source="prompt completo" what="Prompt de Cortina" />
      </UIProviders>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copiar prompt" }));
    await flush();

    expect(writeText).toHaveBeenCalledWith("prompt completo");
    expect(screen.getByRole("button", { name: "Copiado" })).toBeDefined();
    expect(document.querySelector("[data-kp-copia-aviso]")?.textContent).toBe(
      "Prompt de Cortina copiado al portapapeles.",
    );

    act(() => vi.advanceTimersByTime(COPIED_MS - 1));
    expect(screen.getByRole("button", { name: "Copiado" })).toBeDefined();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button", { name: "Copiar prompt" })).toBeDefined();
  });

  test("COPIED_MS coincide con el token --dur-copied", () => {
    const css = readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8");
    expect(css).toContain(`--dur-copied: ${COPIED_MS}ms;`);
  });

  test("las cuatro caras están en el DOM pero solo la visible da nombre al botón", () => {
    render(
      <UIProviders>
        <CopyButton source="x" label="Copiar" />
      </UIProviders>,
    );
    const button = screen.getByRole("button", { name: "Copiar" });
    expect(button.textContent).toContain("Copiado");
    expect(button.textContent).toContain("Reintentar");
  });

  test("sin sesión: no copia, vuelve a reposo y llama a onBlocked con un reintento", async () => {
    const onBlocked = vi.fn();
    const source = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new CopyBlockedError({ reason: "sesion" }))
      .mockResolvedValueOnce("tras el login");
    render(
      <ToastProvider>
        <CopyProvider onBlocked={onBlocked}>
          <CopyButton source={source} />
        </CopyProvider>
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copiar prompt" }));
    await flush();
    expect(writeText).not.toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalledWith({ reason: "sesion" }, expect.any(Function));
    expect(screen.getByRole("button", { name: "Copiar prompt" })).toBeDefined();

    const retry = onBlocked.mock.calls[0]![1] as () => void;
    act(() => retry());
    await flush();
    expect(writeText).toHaveBeenCalledWith("tras el login");
    expect(screen.getByRole("button", { name: "Copiado" })).toBeDefined();
  });

  test("límite alcanzado: aviso con la fecha de renovación", async () => {
    render(
      <UIProviders>
        <CopyButton
          source={() =>
            Promise.reject(new CopyBlockedError({ reason: "limite", renewsAt: "2026-12-01T10:00:00Z" }))
          }
        />
      </UIProviders>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copiar prompt" }));
    await flush();
    expect(screen.getAllByText("Has llegado al límite de copias de este mes").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Se renueva el 1 de diciembre/).length).toBeGreaterThan(0);
  });

  test("error del portapapeles: pasa a «Reintentar» y explica qué falló", async () => {
    writeText.mockRejectedValue(new Error("bloqueado"));
    document.execCommand = vi.fn().mockReturnValue(false);
    render(
      <UIProviders>
        <CopyButton source="x" />
      </UIProviders>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copiar prompt" }));
    await flush();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeDefined();
    expect(screen.getAllByText("No se pudo copiar el prompt").length).toBeGreaterThan(0);
  });

  test("mientras pide el prompt: «Copiando…», aria-busy y no repite la petición", async () => {
    let resolve!: (text: string) => void;
    const source = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    render(
      <UIProviders>
        <CopyButton source={source} />
      </UIProviders>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copiar prompt" }));
    await flush();
    const busy = screen.getByRole("button", { name: "Copiando…" });
    expect(busy.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(busy);
    expect(source).toHaveBeenCalledTimes(1);
    await act(async () => resolve("listo"));
    expect(writeText).toHaveBeenCalledWith("listo");
  });

  test("deshabilitado: no copia", () => {
    render(
      <UIProviders>
        <CopyButton source="x" disabled />
      </UIProviders>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copiar prompt" }));
    expect(writeText).not.toHaveBeenCalled();
  });

  test("sin proveedor avisa con un error claro", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<CopyButton source="x" />)).toThrow(/CopyProvider/);
  });
});
