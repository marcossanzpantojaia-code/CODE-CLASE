import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";

/** Indicador de carga. Con movimiento reducido no gira. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex", className)} role={label ? "status" : undefined}>
      <Icon icon={LoaderCircle} className="motion-safe:animate-spin" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
