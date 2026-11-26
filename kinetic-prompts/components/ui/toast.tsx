"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Toast as RadixToast } from "radix-ui";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { focusRing, stateTransition } from "./styles";

export type ToastTone = "info" | "exito" | "aviso" | "error";

export type ToastMessage = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

const toneIcon = { info: Info, exito: CircleCheck, aviso: TriangleAlert, error: CircleAlert };
const toneColor = {
  info: "text-text-muted",
  exito: "text-success",
  aviso: "text-warning",
  error: "text-danger",
};

/** Aspecto de un toast, reutilizable fuera del sistema de avisos (p. ej. en /design). */
export function ToastCard({
  title,
  description,
  tone = "info",
  action,
  className,
}: ToastMessage & { action?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 rounded-card border border-border bg-surface-2 p-4 text-text",
        className,
      )}
    >
      <Icon icon={toneIcon[tone]} className={toneColor[tone]} />
      <div className="flex min-w-0 grow flex-col gap-1">
        <p className="text-14 font-medium">{title}</p>
        {description ? <p className="text-14 text-text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

type ToastItem = ToastMessage & { id: number };

const ToastContext = createContext<((message: ToastMessage) => void) | null>(null);

/** Muestra avisos breves. Requiere <ToastProvider> en el árbol. */
export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast necesita <ToastProvider>.");
  return show;
}

let nextId = 0;

/** Proveedor de avisos: región aria-live (Radix Toast) abajo a la derecha (abajo del todo en móvil). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: ToastMessage) => {
    nextId += 1;
    setItems((current) => [...current, { ...message, id: nextId }]);
  }, []);

  const remove = useCallback(
    (id: number) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider label="Avisos" duration={4000} swipeDirection="right">
        {children}
        {items.map((item) => (
          <RadixToast.Root
            key={item.id}
            type={item.tone === "error" ? "foreground" : "background"}
            onOpenChange={(open) => {
              if (!open) remove(item.id);
            }}
            className="data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in"
          >
            <ToastCard
              title={item.title}
              description={item.description}
              tone={item.tone}
              action={
                <RadixToast.Close
                  aria-label="Cerrar aviso"
                  className={cn(
                    "-m-1 inline-flex size-8 items-center justify-center rounded-control text-text-muted kp-hover:text-text",
                    stateTransition,
                    focusRing,
                  )}
                >
                  <Icon icon={X} />
                </RadixToast.Close>
              }
            />
            <RadixToast.Title className="sr-only">{item.title}</RadixToast.Title>
            {item.description ? (
              <RadixToast.Description className="sr-only">{item.description}</RadixToast.Description>
            ) : null}
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed right-0 bottom-0 z-50 flex w-full flex-col gap-2 p-4 outline-none sm:max-w-96 sm:p-6" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
