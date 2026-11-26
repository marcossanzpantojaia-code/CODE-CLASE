import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type IconProps = {
  icon: LucideIcon;
  className?: string;
  /** Solo si el icono transmite información por sí mismo; si es decorativo, se oculta. */
  label?: string;
};

/** Icono Lucide de 20 px con trazo de 1,5 px (tokens --icon-size y --icon-stroke). */
export function Icon({ icon: Glyph, className, label }: IconProps) {
  return (
    <Glyph
      className={cn("kp-icon", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
    />
  );
}
