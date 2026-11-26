"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { ClipboardError, type CopyBlock } from "@/lib/clipboard";

import { useToast } from "./toast";

/** Qué hacer cuando una copia no se permite. `retry` repite la copia (p. ej. tras iniciar sesión). */
export type CopyBlockedHandler = (block: CopyBlock, retry: () => void) => void;

type CopyContextValue = {
  /** Lee el mensaje en la región aria-live compartida. Los toasts ya se anuncian solos (Radix). */
  announce: (message: string) => void;
  blocked: CopyBlockedHandler;
  failed: (error: unknown) => void;
};

const CopyContext = createContext<CopyContextValue | null>(null);

const renewalDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" });

/**
 * Proveedor de todos los botones de copia de la app: una sola región aria-live y un único
 * sitio donde se decide qué pasa si falta sesión o se alcanza el límite. Hasta la fase 6
 * avisa con un toast; en la fase 6 `onBlocked` abre el panel «Inicia sesión con Google para
 * copiar» y llama a `retry` al volver del login.
 */
export function CopyProvider({
  onBlocked,
  children,
}: {
  onBlocked?: CopyBlockedHandler;
  children: ReactNode;
}) {
  const toast = useToast();
  const [message, setMessage] = useState({ text: "", n: 0 });

  const announce = useCallback((text: string) => setMessage((m) => ({ text, n: m.n + 1 })), []);

  const blocked = useCallback<CopyBlockedHandler>(
    (block, retry) => {
      if (onBlocked) {
        onBlocked(block, retry);
        return;
      }
      if (block.reason === "sesion") {
        toast({
          title: "Inicia sesión con Google para copiar",
          description: "Explorar es libre; para copiar prompts hace falta una cuenta.",
          tone: "info",
        });
        return;
      }
      const when = block.renewsAt ? renewalDate.format(new Date(block.renewsAt)) : null;
      toast({
        title: "Has llegado al límite de copias de este mes",
        description: when
          ? `Se renueva el ${when}. Mejora tu plan para seguir copiando.`
          : "Mejora tu plan para seguir copiando.",
        tone: "aviso",
      });
    },
    [onBlocked, toast],
  );

  const failed = useCallback(
    (error: unknown) => {
      const clipboard = error instanceof ClipboardError;
      const title = clipboard ? "No se pudo copiar el prompt" : "No se pudo cargar el prompt";
      toast({
        title,
        description: clipboard
          ? "El navegador ha bloqueado el portapapeles. Pulsa «Reintentar»; si sigue fallando, revisa los permisos del sitio."
          : "Revisa tu conexión y pulsa «Reintentar».",
        tone: "error",
      });
    },
    [toast],
  );

  const value = useMemo(() => ({ announce, blocked, failed }), [announce, blocked, failed]);

  return (
    <CopyContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-kp-copia-aviso>
        {/* La clave nueva hace que el lector repita el aviso aunque el texto sea el mismo. */}
        <span key={message.n}>{message.text}</span>
      </div>
    </CopyContext.Provider>
  );
}

export function useCopyContext(): CopyContextValue {
  const value = useContext(CopyContext);
  if (!value) throw new Error("CopyButton necesita <CopyProvider> (incluido en <UIProviders>).");
  return value;
}
