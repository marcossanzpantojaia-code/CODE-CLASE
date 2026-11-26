import { cn } from "@/lib/cn";

/**
 * Bloque de carga: brillo sobre --surface-2 (clase .kp-shimmer de app/globals.css).
 * Es decorativo; la región que carga debe llevar aria-busy y un texto para lectores.
 */
export function Skeleton({
  className,
  rounded = "control",
}: {
  className?: string;
  rounded?: "control" | "card";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("kp-shimmer", rounded === "card" ? "rounded-card" : "rounded-control", className)}
    />
  );
}
