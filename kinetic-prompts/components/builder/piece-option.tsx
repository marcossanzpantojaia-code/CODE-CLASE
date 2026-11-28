"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Opción del constructor: una tarjeta que es un radio (flechas del teclado incluidas). */
export function PieceOption({
  name,
  value,
  checked,
  onSelect,
  title,
  meta,
  poster,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  meta?: string;
  poster?: string;
  children?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden rounded-card border bg-surface",
        "transition-[border-color,background-color] duration-(--dur-hover) ease-kp",
        "has-[:focus-visible]:outline-(length:--focus-w) has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-solid",
        checked ? "border-accent bg-surface-2" : "border-border kp-hover:border-border-strong",
        !poster && "border-dashed",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- póster ya optimizado (WebP < 80 KB)
        <img src={poster} alt="" className="aspect-16/10 w-full object-cover" loading="lazy" />
      ) : null}
      <span className="flex items-center justify-between gap-3 p-4">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-16 font-medium text-text">{title}</span>
          {meta ? <span className="truncate text-12 text-text-muted">{meta}</span> : null}
          {children}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full border",
            checked ? "border-accent bg-accent text-on-accent" : "border-border-strong",
          )}
        >
          {checked ? <Icon icon={Check} className="size-4" /> : null}
        </span>
      </span>
    </label>
  );
}
