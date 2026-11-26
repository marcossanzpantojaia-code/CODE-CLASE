"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { Spinner } from "./spinner";
import { disabledState, focusRing, loadingState, pressState, stateTransition } from "./styles";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon;
  /** Obligatorio: es el nombre accesible del botón. */
  label: string;
  variant?: "fantasma" | "secundario";
  /** Estado activo persistente (p. ej. favorito marcado). */
  pressed?: boolean;
  loading?: boolean;
};

const surfaces = {
  fantasma: "bg-transparent kp-hover:bg-surface-2 kp-active:bg-surface-2",
  secundario: "border border-border bg-surface-2 kp-hover:border-border-strong kp-active:bg-surface",
};

const textColors = {
  fantasma: "text-text-muted kp-hover:text-text kp-active:text-text",
  secundario: "text-text",
};

export function IconButton({
  icon,
  label,
  variant = "fantasma",
  pressed,
  loading = false,
  className,
  onClick,
  ...rest
}: IconButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-control",
        stateTransition,
        focusRing,
        disabledState,
        loadingState,
        pressState,
        surfaces[variant],
        pressed ? "text-accent" : textColors[variant],
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      {loading ? <Spinner /> : <Icon icon={icon} />}
    </button>
  );
}
