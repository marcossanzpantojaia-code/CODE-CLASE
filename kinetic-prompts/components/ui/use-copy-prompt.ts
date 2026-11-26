"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { copyPrompt, CopyBlockedError, type PromptSource } from "@/lib/clipboard";

import { useCopyContext } from "./copy-provider";

export type CopyStatus = "reposo" | "copiando" | "copiado" | "error";

/** Tiempo que se ve «Copiado ✓». Igual que el token --dur-copied (lo comprueba un test). */
export const COPIED_MS = 2000;

/**
 * La lógica de todos los botones de copia (CopyButton y la tarjeta de la galería): copia, anuncia,
 * vuelve a reposo a los 2 s y pasa al proveedor los bloqueos (sin sesión, límite) y los errores.
 */
export function useCopyPrompt({
  source,
  what,
  onCopied,
}: {
  source: PromptSource;
  what?: string;
  onCopied?: (text: string) => void;
}) {
  const copy = useCopyContext();
  const [status, setStatus] = useState<CopyStatus>("reposo");
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef({ source, what, onCopied });
  const retry = useRef<() => void>(() => {});

  useEffect(() => {
    latest.current = { source, what, onCopied };
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    window.clearTimeout(timer.current);
    const { source, what, onCopied } = latest.current;
    if (typeof source !== "string") setStatus("copiando");
    try {
      const text = await copyPrompt(source);
      setStatus("copiado");
      copy.announce(`${what ?? "Prompt"} copiado al portapapeles.`);
      onCopied?.(text);
      timer.current = window.setTimeout(() => setStatus("reposo"), COPIED_MS);
    } catch (error) {
      if (error instanceof CopyBlockedError) {
        setStatus("reposo");
        copy.blocked(error.block, () => retry.current());
      } else {
        setStatus("error");
        copy.failed(error);
      }
    } finally {
      busy.current = false;
    }
  }, [copy]);

  // El reintento (p. ej. tras iniciar sesión) repite la misma copia.
  useEffect(() => {
    retry.current = () => void run();
  }, [run]);

  return { status, copy: run };
}
