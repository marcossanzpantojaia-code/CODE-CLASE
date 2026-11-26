"use client";

import { Check, Copy, LoaderCircle, RotateCcw } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { copyPrompt, CopyBlockedError, type PromptSource } from "@/lib/clipboard";

import { type ButtonSize, type ButtonVariant, buttonBase, buttonSizes, buttonVariants } from "./button";
import { useCopyContext } from "./copy-provider";
import { Icon } from "./icon";
import { Spinner } from "./spinner";

export type CopyStatus = "reposo" | "copiando" | "copiado" | "error";

/** Tiempo que se ve «Copiado ✓». Igual que el token --dur-copied (lo comprueba un test). */
export const COPIED_MS = 2000;

const FACES: readonly CopyStatus[] = ["reposo", "copiando", "copiado", "error"];

/* El estado sustituye a la variante: «Copiado» en --success y el error en --danger,
 * ambos sobre --surface-2 (parejas de contraste comprobadas en lib/contrast.ts). */
const statusTone: Partial<Record<CopyStatus, string>> = {
  copiado: "border-success bg-surface-2 text-success",
  error: "border-danger bg-surface-2 text-danger kp-hover:bg-surface kp-active:bg-surface",
};

export type CopyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> & {
  /** El prompt (texto) o una función que lo pide al servidor (fase 6: POST /api/copy). */
  source: PromptSource;
  /** Texto del botón en reposo: «Copiar prompt» en fichas, «Copiar» en tarjetas. */
  label?: string;
  /** Qué se copia, para el aviso de lectores de pantalla: «Prompt de Cortina curva». */
  what?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onCopied?: (text: string) => void;
  /** Solo para /design: fija el estado que se ve. */
  forceStatus?: CopyStatus;
  /** Equivale a forceStatus="copiando" (compatibilidad con la matriz de estados). */
  loading?: boolean;
};

/**
 * Cimiento de la app: copia un prompt con un clic. Lo usan la tarjeta de la galería, la ficha
 * (grande y fija) y cada sección de una web. No escribas otro código de portapapeles.
 */
export function CopyButton({
  source,
  label = "Copiar prompt",
  what,
  variant = "primario",
  size = "md",
  onCopied,
  forceStatus,
  loading = false,
  className,
  type,
  ...rest
}: CopyButtonProps) {
  const copy = useCopyContext();
  const [status, setStatus] = useState<CopyStatus>("reposo");
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shown = forceStatus ?? (loading ? "copiando" : status);

  async function run() {
    if (busy.current) return;
    busy.current = true;
    window.clearTimeout(timer.current);
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
        copy.blocked(error.block, () => void run());
      } else {
        setStatus("error");
        copy.failed(error);
      }
    } finally {
      busy.current = false;
    }
  }

  const faces: Record<CopyStatus, { text: string; icon: ReactNode; trailing?: boolean }> = {
    reposo: { text: label, icon: <Icon icon={Copy} /> },
    copiando: {
      text: "Copiando…",
      icon: shown === "copiando" ? <Spinner /> : <Icon icon={LoaderCircle} />,
    },
    copiado: { text: "Copiado", icon: <Icon icon={Check} />, trailing: true },
    error: { text: "Reintentar", icon: <Icon icon={RotateCcw} /> },
  };

  return (
    <button
      type={type ?? "button"}
      className={cn(buttonBase, buttonSizes[size], statusTone[shown] ?? buttonVariants[variant], className)}
      aria-busy={shown === "copiando" || undefined}
      data-loading={shown === "copiando" || undefined}
      data-estado={shown}
      onClick={() => {
        if (shown === "copiando" || forceStatus) return;
        void run();
      }}
      {...rest}
    >
      {/* Las cuatro caras ocupan la misma celda: el botón mide lo que la más ancha y no
       * cambia de tamaño al pasar a «Copiado». Solo la visible cuenta para el nombre accesible. */}
      <span className="grid">
        {FACES.map((face) => (
          <span
            key={face}
            aria-hidden={face === shown ? undefined : true}
            className={cn(
              "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
              "transition-[opacity,transform] duration-(--dur-ui) ease-kp",
              face === shown ? "opacity-100" : "translate-y-(--shift) opacity-0",
            )}
          >
            {faces[face].trailing ? null : faces[face].icon}
            {faces[face].text}
            {faces[face].trailing ? faces[face].icon : null}
          </span>
        ))}
      </span>
    </button>
  );
}
