/**
 * Escritura en el portapapeles para los botones de copia.
 *
 * El texto puede llegar al momento (string) o más tarde (función asíncrona). Lo segundo es
 * lo que pasará desde la fase 6, cuando el prompt completo solo llegue al navegador tras
 * POST /api/copy. Para no perder el gesto del usuario mientras se espera la respuesta (Safari
 * y Firefox lo exigen), se usa ClipboardItem con una promesa; si no existe, se espera al texto
 * y se usa writeText; y si el navegador lo bloquea, la copia clásica con execCommand.
 */

export type PromptSource = string | (() => Promise<string>);

/** El navegador no ha dejado escribir en el portapapeles. */
export class ClipboardError extends Error {
  constructor(cause?: unknown) {
    super("El navegador ha bloqueado el acceso al portapapeles.", { cause });
    this.name = "ClipboardError";
  }
}

export type CopyBlock = { reason: "sesion" } | { reason: "limite"; renewsAt?: string };

/** La copia no se permite todavía: falta iniciar sesión o se ha alcanzado el límite del mes. */
export class CopyBlockedError extends Error {
  readonly block: CopyBlock;

  constructor(block: CopyBlock) {
    super(
      block.reason === "sesion" ? "Hace falta iniciar sesión para copiar." : "Límite de copias alcanzado.",
    );
    this.name = "CopyBlockedError";
    this.block = block;
  }
}

/** Copia el texto del prompt y lo devuelve. Lanza el error del origen o ClipboardError. */
export async function copyPrompt(source: PromptSource): Promise<string> {
  if (typeof source === "string") {
    await writeText(source);
    return source;
  }

  const text = source();
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const blob = text.then((value) => new Blob([value], { type: "text/plain" }));
      // El error del origen se trata abajo; esto evita que además salga como «no capturado».
      blob.catch(() => {});
      await clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return await text;
    } catch {
      // Si falló el origen (sin sesión, límite, red), este await relanza su error.
      // Si falló el portapapeles, se prueba por las otras vías con el texto ya recibido.
      const value = await text;
      await writeText(value);
      return value;
    }
  }

  const value = await text;
  await writeText(value);
  return value;
}

async function writeText(text: string): Promise<void> {
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  let cause: unknown;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return;
    } catch (error) {
      cause = error;
    }
  }
  if (!legacyCopy(text)) throw new ClipboardError(cause);
}

/** Copia clásica: un textarea temporal, seleccionado, y execCommand("copy"). */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") return false;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.inset = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.append(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  textarea.remove();
  active?.focus({ preventScroll: true });
  return ok;
}
