"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export const tooltipBubble =
  "z-50 max-w-64 rounded-control border border-border bg-surface-2 px-2 py-1 text-12 text-text";

/** Proveedor común: un único retraso para toda la app. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300} skipDelayDuration={200}>
      {children}
    </RadixTooltip.Provider>
  );
}

export type TooltipProps = {
  /** Texto de ayuda. No sustituye al nombre accesible del control. */
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  defaultOpen?: boolean;
};

/** Tooltip (Radix): aparece con hover y con foco de teclado; se cierra con Escape. */
export function Tooltip({ content, children, side = "top", open, defaultOpen }: TooltipProps) {
  return (
    <RadixTooltip.Root open={open} defaultOpen={defaultOpen}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={8}
          className={cn(
            tooltipBubble,
            "data-[state=closed]:animate-pop-out data-[state=delayed-open]:animate-pop-in data-[state=instant-open]:animate-pop-in",
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-surface-2" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
