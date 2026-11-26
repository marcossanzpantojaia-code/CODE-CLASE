"use client";

import { Search, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { Icon } from "./icon";
import { IconButton } from "./icon-button";
import { Input } from "./input";

export type SearchFieldProps = {
  label: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Activa el atajo de teclado «/» para enfocar el buscador. */
  shortcut?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  "data-force"?: string;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Buscador con icono, botón de limpiar y atajo «/». */
export function SearchField({
  label,
  placeholder = "Buscar",
  value,
  defaultValue = "",
  onValueChange,
  shortcut = false,
  loading = false,
  disabled = false,
  className,
  "data-force": force,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  useEffect(() => {
    if (!shortcut) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  function update(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <div role="search" className={className}>
      <Input
        ref={inputRef}
        type="search"
        label={label}
        hideLabel
        placeholder={placeholder}
        value={current}
        disabled={disabled}
        loading={loading}
        data-force={force}
        onChange={(event: ChangeEvent<HTMLInputElement>) => update(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && current) {
            event.preventDefault();
            update("");
          }
        }}
        start={<Icon icon={Search} />}
        end={
          current ? (
            <IconButton
              icon={X}
              label="Borrar búsqueda"
              disabled={disabled}
              onClick={() => {
                update("");
                inputRef.current?.focus();
              }}
            />
          ) : shortcut ? (
            <kbd className="mr-2 rounded-control border border-border px-2 text-12 text-text-muted">/</kbd>
          ) : null
        }
      />
    </div>
  );
}
