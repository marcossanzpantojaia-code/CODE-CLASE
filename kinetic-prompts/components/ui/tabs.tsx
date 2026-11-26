"use client";

import { Tabs as RadixTabs } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./spinner";
import { disabledState, focusRing, stateTransition } from "./styles";

/** Pestañas (Radix Tabs). La activa lleva texto principal y subrayado de 2 px en --accent. */
export function Tabs({ className, ...props }: ComponentProps<typeof RadixTabs.Root>) {
  return <RadixTabs.Root className={cn("flex flex-col gap-4", className)} {...props} />;
}

export function TabsList({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn("flex gap-1 border-b border-border", className)} {...props} />;
}

export function TabsTrigger({
  className,
  loading = false,
  children,
  ...props
}: ComponentProps<typeof RadixTabs.Trigger> & { loading?: boolean }) {
  return (
    <RadixTabs.Trigger
      aria-busy={loading || undefined}
      className={cn(
        "-mb-px inline-flex h-10 items-center gap-2 rounded-t-control border-b-2 border-transparent px-3 text-14 font-medium text-text-muted",
        stateTransition,
        focusRing,
        "kp-focus:outline-offset-0",
        disabledState,
        "data-[state=active]:border-accent data-[state=active]:text-text kp-hover:text-text",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </RadixTabs.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("rounded-control", focusRing, className)} {...props} />;
}
