import { afterEach, describe, expect, test, vi } from "vitest";

import { ClipboardError, copyPrompt, CopyBlockedError } from "./clipboard";

function stubClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
}

afterEach(() => {
  stubClipboard(undefined);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("copyPrompt", () => {
  test("con texto: lo escribe con writeText y lo devuelve", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    await expect(copyPrompt("hola")).resolves.toBe("hola");
    expect(writeText).toHaveBeenCalledWith("hola");
  });

  test("con origen asíncrono: usa ClipboardItem con la promesa para no perder el gesto", async () => {
    const items: Array<Record<string, Promise<Blob>>> = [];
    vi.stubGlobal(
      "ClipboardItem",
      class {
        constructor(data: Record<string, Promise<Blob>>) {
          items.push(data);
        }
      },
    );
    const write = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    stubClipboard({ write, writeText });

    await expect(copyPrompt(async () => "del servidor")).resolves.toBe("del servidor");
    expect(write).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    const blob = await items[0]!["text/plain"]!;
    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("del servidor");
  });

  test("si ClipboardItem falla, reintenta con writeText y el texto ya recibido", async () => {
    vi.stubGlobal("ClipboardItem", class {});
    const write = vi.fn().mockRejectedValue(new DOMException("no", "NotAllowedError"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write, writeText });
    await expect(copyPrompt(async () => "texto")).resolves.toBe("texto");
    expect(writeText).toHaveBeenCalledWith("texto");
  });

  test("propaga el bloqueo del origen (sin sesión o límite) sin tocar el portapapeles", async () => {
    vi.stubGlobal("ClipboardItem", class {});
    const write = vi.fn(async (items: unknown[]) => {
      void items;
      throw new DOMException("origen rechazado", "AbortError");
    });
    const writeText = vi.fn();
    stubClipboard({ write, writeText });
    const blocked = new CopyBlockedError({ reason: "sesion" });
    await expect(copyPrompt(() => Promise.reject(blocked))).rejects.toBe(blocked);
    expect(writeText).not.toHaveBeenCalled();
  });

  test("sin API de portapapeles: copia con execCommand y limpia el textarea", async () => {
    stubClipboard(undefined);
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;
    await expect(copyPrompt("clásico")).resolves.toBe("clásico");
    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });

  test("si todo falla, lanza ClipboardError", async () => {
    stubClipboard({ writeText: vi.fn().mockRejectedValue(new Error("bloqueado")) });
    document.execCommand = vi.fn().mockReturnValue(false);
    await expect(copyPrompt("x")).rejects.toBeInstanceOf(ClipboardError);
  });
});
