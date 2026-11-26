"use client";

import { type InputHTMLAttributes, type ReactNode, type Ref, useId } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./spinner";
import {
  disabledState,
  fieldBase,
  fieldError,
  fieldHint,
  fieldLabel,
  focusRing,
  stateTransition,
} from "./styles";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Etiqueta visible (obligatoria salvo que se use `hideLabel`). */
  label: string;
  hideLabel?: boolean;
  hint?: ReactNode;
  /** Mensaje de error: marca el campo como inválido y se anuncia. */
  error?: ReactNode;
  loading?: boolean;
  /** Elemento al inicio del campo (p. ej. un icono). */
  start?: ReactNode;
  /** Elemento al final del campo (p. ej. un botón de limpiar). */
  end?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function Input({
  label,
  hideLabel = false,
  hint,
  error,
  loading = false,
  start,
  end,
  id,
  className,
  disabled,
  ref,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-ayuda` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className={cn(fieldLabel, hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative flex items-center">
        {start ? (
          <span className="pointer-events-none absolute left-3 flex text-text-muted">{start}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(errorId, hintId) || undefined}
          aria-busy={loading || undefined}
          className={cn(
            fieldBase,
            stateTransition,
            focusRing,
            "kp-focus:outline-offset-0",
            disabledState,
            start ? "pl-12" : null,
            end || loading ? "pr-12" : null,
          )}
          {...rest}
        />
        {loading ? (
          <span className="absolute right-3 flex text-text-muted">
            <Spinner label="Cargando" />
          </span>
        ) : end ? (
          <span className="absolute right-1 flex">{end}</span>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className={fieldError}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={fieldHint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
