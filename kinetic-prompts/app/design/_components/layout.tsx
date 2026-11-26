import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="flex scroll-mt-8 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 id={`${id}-titulo`} className="text-28">
          {title}
        </h2>
        {intro ? <p className="text-14 text-text-muted">{intro}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-20 font-semibold">{children}</h3>;
}

export const STATES = ["Reposo", "Hover", "Foco", "Activo", "Deshabilitado", "Cargando"] as const;
export type StateName = (typeof STATES)[number];

/** Props que fuerzan cada estado en los componentes (variantes kp-hover/kp-focus/kp-active). */
export function stateProps(state: StateName): {
  "data-force"?: string;
  disabled?: boolean;
  loading?: boolean;
} {
  switch (state) {
    case "Hover":
      return { "data-force": "hover" };
    case "Foco":
      return { "data-force": "focus" };
    case "Activo":
      return { "data-force": "active" };
    case "Deshabilitado":
      return { disabled: true };
    case "Cargando":
      return { loading: true };
    default:
      return {};
  }
}

/** Fila de estados de un componente: reposo, hover, foco, activo, deshabilitado y cargando. */
export function StateMatrix<S extends string = StateName>({
  title,
  description,
  render,
  states,
  wide = false,
}: {
  title: string;
  description?: string;
  render: (state: S) => ReactNode;
  /** Estados propios (p. ej. CopyButton añade «Copiado» y «Error»). Por defecto, STATES. */
  states?: readonly S[];
  /** Celdas anchas para campos de formulario y botones grandes. */
  wide?: boolean;
}) {
  const list = states ?? (STATES as unknown as readonly S[]);
  return (
    <div className="flex flex-col gap-3" data-matriz={title}>
      <div className="flex flex-col gap-1">
        <h4 className="font-sans text-16 font-semibold tracking-normal">{title}</h4>
        {description ? <p className="text-14 text-text-muted">{description}</p> : null}
      </div>
      <ul
        className={cn(
          "grid gap-4 rounded-card border border-border bg-surface p-4",
          wide
            ? list.length > 6
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            : list.length > 6
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6",
        )}
      >
        {list.map((state) => (
          <li key={state} className="flex min-w-0 flex-col items-start gap-2">
            <span className="text-12 text-text-muted">{state}</span>
            {render(state)}
          </li>
        ))}
      </ul>
    </div>
  );
}
