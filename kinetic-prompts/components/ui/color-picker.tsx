"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./spinner";
import { disabledState, fieldBase, fieldError, fieldLabel, focusRing, stateTransition } from "./styles";

export type ColorPickerProps = {
  label: string;
  /** Color en formato #rrggbb. Es un dato del usuario (parámetro de una demo), no un color de la interfaz. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  "data-force"?: string;
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Selector de color: muestra nativa accesible + campo hexadecimal validado. */
export function ColorPicker({
  label,
  value,
  defaultValue = "",
  onValueChange,
  disabled = false,
  loading = false,
  className,
  "data-force": force,
}: ColorPickerProps) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue);
  const color = value ?? internal;
  const [draft, setDraft] = useState(color);
  const [synced, setSynced] = useState(color);
  if (color !== synced) {
    // El valor cambió desde fuera (componente controlado): el campo de texto lo refleja.
    setSynced(color);
    setDraft(color);
  }
  const [error, setError] = useState<string | null>(null);
  const inactive = disabled || loading;

  function commit(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={`${id}-hex`} className={fieldLabel}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "relative size-10 shrink-0 overflow-hidden rounded-control border border-border kp-hover:border-border-strong",
            stateTransition,
            focusRing,
            "has-focus-visible:outline-(length:--focus-w) has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-focus-visible:outline-solid",
            "kp-active:border-text",
            disabled && "opacity-50",
            loading && !disabled && "cursor-wait",
          )}
          data-force={force}
          style={{ backgroundColor: HEX.test(color) ? color : undefined }}
        >
          <input
            type="color"
            aria-label={`${label}: abrir el selector de color`}
            value={HEX.test(color) ? color : ""}
            disabled={inactive}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
              commit(event.target.value);
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0 outline-none disabled:cursor-not-allowed"
          />
        </span>
        <input
          id={`${id}-hex`}
          value={draft}
          disabled={disabled}
          readOnly={loading}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-busy={loading || undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const next = draft.trim();
            if (HEX.test(next)) {
              setError(null);
              commit(next.toLowerCase());
            } else {
              setError("Escribe un color en formato #rrggbb, por ejemplo #1a2b3c."); // kp-permitir-hex: ejemplo de formato para el usuario
            }
          }}
          className={cn(
            fieldBase,
            stateTransition,
            focusRing,
            "kp-focus:outline-offset-0",
            disabledState,
            loading && "cursor-wait",
            "font-mono uppercase",
          )}
        />
        {loading ? <Spinner label="Cargando" className="text-text-muted" /> : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className={fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
