"use client";

import { Slider as RadixSlider } from "radix-ui";
import { useId, useState } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./spinner";
import { fieldLabel, focusRing, stateTransition } from "./styles";

export type SliderProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Unidad que se muestra junto al valor (p. ej. «s»). */
  unit?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** Fuerza un estado visual del tirador (solo para /design). */
  "data-force"?: string;
};

/** Tantos decimales como tenga el paso (0,005 → 3), para que el valor coincida con el del prompt. */
function formatterFor(step: number) {
  const decimals = Math.min(4, (String(step).split(".")[1] ?? "").length);
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: Math.max(2, decimals) });
}

/** Control deslizante (Radix Slider) con etiqueta y valor visibles. */
export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  unit,
  disabled = false,
  loading = false,
  className,
  "data-force": force,
}: SliderProps) {
  const labelId = useId();
  const [internal, setInternal] = useState(defaultValue ?? min);
  const current = value ?? internal;
  const shown = `${formatterFor(step).format(current)}${unit ? ` ${unit}` : ""}`;
  const inactive = disabled || loading;

  return (
    <div
      className={cn("flex flex-col gap-3", disabled && "opacity-50", className)}
      aria-busy={loading || undefined}
    >
      <div className="flex items-center justify-between gap-4">
        <span id={labelId} className={fieldLabel}>
          {label}
        </span>
        <span className="flex items-center gap-2 font-mono text-14 text-text-muted">
          {loading ? <Spinner label="Cargando" /> : null}
          {shown}
        </span>
      </div>
      <RadixSlider.Root
        min={min}
        max={max}
        step={step}
        value={[current]}
        disabled={inactive}
        onValueChange={([next]) => {
          if (next === undefined) return;
          if (value === undefined) setInternal(next);
          onValueChange?.(next);
        }}
        className={cn(
          "relative flex h-6 w-full touch-none items-center select-none",
          disabled ? "cursor-not-allowed" : loading ? "cursor-wait" : "cursor-pointer",
        )}
      >
        <RadixSlider.Track className="relative h-1 grow overflow-hidden rounded-full bg-border">
          <RadixSlider.Range className="absolute h-full bg-accent" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-labelledby={labelId}
          aria-valuetext={shown}
          data-force={force}
          className={cn(
            "block size-4 rounded-full border-2 border-accent bg-text",
            stateTransition,
            focusRing,
            "kp-hover:bg-accent kp-active:scale-(--press-scale) kp-active:bg-accent",
          )}
        />
      </RadixSlider.Root>
    </div>
  );
}
