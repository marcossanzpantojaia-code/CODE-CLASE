"use client";

import type { LucideIcon } from "lucide-react";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { Spinner } from "./spinner";
import { disabledState, focusRing, loadingState, pressState, stateTransition } from "./styles";

export type ButtonVariant = "primario" | "secundario" | "fantasma";
export type ButtonSize = "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra el indicador de carga e impide la acción sin perder el foco. */
  loading?: boolean;
  icon?: LucideIcon;
  /** Renderiza el hijo (p. ej. un enlace) con el aspecto del botón. */
  asChild?: boolean;
  children?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primario: "bg-accent text-on-accent kp-hover:bg-accent-hover kp-active:bg-accent-press",
  secundario:
    "border border-border bg-surface-2 text-text kp-hover:border-border-strong kp-active:border-border-strong kp-active:bg-surface",
  fantasma:
    "bg-transparent text-text-muted kp-hover:bg-surface-2 kp-hover:text-text kp-active:bg-surface-2 kp-active:text-text",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-10 gap-2 px-4 text-14",
  lg: "h-12 gap-2 px-6 text-16",
};

export function Button({
  variant = "primario",
  size = "md",
  loading = false,
  icon,
  asChild = false,
  className,
  children,
  onClick,
  type,
  ...rest
}: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <Component
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex items-center justify-center rounded-control font-medium whitespace-nowrap select-none",
        stateTransition,
        focusRing,
        disabledState,
        loadingState,
        pressState,
        variants[variant],
        sizes[size],
        className,
      )}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon icon={icon} /> : null}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
    </Component>
  );
}
