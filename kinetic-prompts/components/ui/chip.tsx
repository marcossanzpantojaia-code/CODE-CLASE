"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { Spinner } from "./spinner";
import { disabledState, focusRing, loadingState, pressState, stateTransition } from "./styles";

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Chip seleccionado (filtro aplicado). Se anuncia con aria-pressed. */
  active?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
};

/** Chip de filtro. El activo usa --surface-2, texto principal y borde --accent. */
export function Chip({
  active = false,
  loading = false,
  icon,
  className,
  children,
  onClick,
  ...rest
}: ChipProps) {
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
      aria-pressed={active}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-control border px-3 text-14 whitespace-nowrap select-none",
        stateTransition,
        focusRing,
        disabledState,
        loadingState,
        pressState,
        active
          ? "border-accent bg-surface-2 text-text kp-hover:border-accent-hover kp-active:bg-surface"
          : "border-border bg-transparent text-text-muted kp-hover:border-border-strong kp-hover:text-text kp-active:bg-surface-2 kp-active:text-text",
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon icon={icon} /> : null}
      {children}
    </button>
  );
}
