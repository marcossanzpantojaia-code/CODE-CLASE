"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "./toast";
import { TooltipProvider } from "./tooltip";

/** Proveedores de la interfaz: tooltips y avisos para toda la app. */
export function UIProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>{children}</ToastProvider>
    </TooltipProvider>
  );
}
