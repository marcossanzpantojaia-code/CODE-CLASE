"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as RadixSelect } from "radix-ui";
import { useId } from "react";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { Spinner } from "./spinner";
import { fieldBase, fieldLabel, focusRing, stateTransition } from "./styles";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  "data-force"?: string;
};

/** Selector desplegable (Radix Select) con etiqueta visible. */
export function Select({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Elige una opción",
  disabled = false,
  loading = false,
  className,
  "data-force": force,
}: SelectProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <RadixSelect.Trigger
          id={id}
          aria-busy={loading || undefined}
          data-force={force}
          className={cn(
            fieldBase,
            stateTransition,
            focusRing,
            "kp-focus:outline-offset-0",
            disabled && "cursor-not-allowed opacity-50",
            loading && !disabled && "cursor-wait",
            "inline-flex items-center justify-between gap-2 text-left data-placeholder:text-text-muted",
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className="flex text-text-muted">
            {loading ? <Spinner label="Cargando" /> : <Icon icon={ChevronDown} />}
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-card border border-border bg-surface-2 p-1 data-[state=open]:animate-pop-in"
          >
            <RadixSelect.Viewport>
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex h-9 cursor-default items-center justify-between gap-4 rounded-control px-3 text-14 text-text-muted outline-none select-none data-highlighted:bg-surface data-highlighted:text-text data-[state=checked]:text-text"
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="flex text-accent">
                    <Icon icon={Check} />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
