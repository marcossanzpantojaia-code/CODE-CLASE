"use client";

import type { ReactNode } from "react";

import { CopyProvider } from "./copy-provider";
import { ToastProvider } from "./toast";
import { TooltipProvider } from "./tooltip";

/** Proveedores de la interfaz: tooltips, avisos y botones de copia para toda la app. */
export function UIProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>
        <CopyProvider>{children}</CopyProvider>
      </ToastProvider>
    </TooltipProvider>
  );
}
