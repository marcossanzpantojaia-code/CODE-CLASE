"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { GalleryItem } from "@/components/catalog/types";
import { cn } from "@/lib/cn";
import { headlineContrast } from "@/lib/compose";
import type { ParamValue } from "@/lib/prompt-render";

/** Transiciones con modo capa: tapan la página y avisan («kp:covered») cuando ya está tapada. */
const LAYER_TRANSITIONS = ["page-transition-blinds", "page-transition-curtain"];

type Selection = {
  f?: string;
  t?: string;
  o?: string;
  l?: string;
  n: string;
  v: Record<string, Record<string, ParamValue>>;
};

function parseSelection(search: string): Selection {
  const qs = new URLSearchParams(search);
  let v: Selection["v"] = {};
  try {
    v = JSON.parse(qs.get("v") ?? "{}");
  } catch {
    v = {};
  }
  return {
    f: qs.get("f") ?? undefined,
    t: qs.get("t") ?? undefined,
    o: qs.get("o") ?? undefined,
    l: qs.get("l") ?? undefined,
    n: qs.get("n") || "Tu negocio",
    v,
  };
}

function Layer({
  item,
  values,
  query = "modo=capa",
  className,
  title,
}: {
  item: GalleryItem;
  values?: Record<string, ParamValue>;
  query?: string;
  className: string;
  title: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = () =>
    frame.current?.contentWindow?.postMessage({ type: "kp:params", params: values ?? {} }, "*");
  useEffect(send);
  return (
    <iframe
      ref={frame}
      src={`${item.demo}?${query}`}
      title={title}
      sandbox="allow-scripts"
      tabIndex={-1}
      // La app es color-scheme: dark y las demos no declaran ninguno: si no coinciden, el navegador
      // pinta el iframe opaco y la capa taparía la página. Con el mismo esquema queda transparente.
      className={cn("scheme-light", className)}
      onLoad={send}
      data-capa={item.slug}
    />
  );
}

/** La web montada: las piezas elegidas en el constructor, juntas en una misma página de ejemplo. */
export function WebAssembly({ items }: { items: GalleryItem[] }) {
  // La selección viene en la dirección; en el servidor no hay dirección (null) y se pinta al hidratar.
  const search = useSyncExternalStore(
    () => () => {},
    () => window.location.search,
    () => null,
  );
  const sel = search === null ? null : parseSelection(search);
  const [page, setPage] = useState<"inicio" | "proyectos">("inicio");
  const overlay = useRef<HTMLDivElement>(null);
  const pending = useRef<null | (() => void)>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "kp:covered" && pending.current) {
        pending.current();
        pending.current = null;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!sel) return null;
  const find = (slug?: string) => items.find((i) => i.slug === slug);
  const fondo = find(sel.f),
    transicion = find(sel.t),
    objeto = find(sel.o),
    letras = find(sel.l);
  const layerTransition = transicion && LAYER_TRANSITIONS.includes(transicion.slug);
  const headline =
    fondo && letras ? headlineContrast(sel.v[fondo.slug]?.base, sel.v[letras.slug]?.color) : null;

  function go(next: "inicio" | "proyectos") {
    if (next === page) return;
    const swap = () => setPage(next);
    const frame = overlay.current?.querySelector("iframe");
    if (layerTransition && frame?.contentWindow) {
      // La capa tapa la página y avisa; si no avisa a tiempo, se cambia igual.
      pending.current = swap;
      frame.contentWindow.postMessage({ type: "kp:replay" }, "*");
      window.setTimeout(() => pending.current?.(), 2500);
      return;
    }
    if (typeof document.startViewTransition === "function") document.startViewTransition(swap);
    else swap();
  }

  const link = (target: "inicio" | "proyectos", label: string) => (
    <button
      type="button"
      onClick={() => go(target)}
      aria-current={page === target ? "page" : undefined}
      className={cn(
        "rounded-control px-3 py-2 text-14 font-medium outline-none kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid",
        page === target ? "bg-surface-2 text-text" : "text-text-muted kp-hover:text-text",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col">
      <section
        className="relative h-svh overflow-hidden bg-surface"
        aria-label={`Web de ejemplo de ${sel.n}`}
      >
        {fondo ? (
          <Layer
            item={fondo}
            values={sel.v[fondo.slug]}
            title={`Fondo: ${fondo.title}`}
            className="pointer-events-none absolute inset-0 size-full"
          />
        ) : null}
        <div className="relative z-10 flex h-full flex-col gap-6 p-6 md:p-12">
          <nav aria-label="Web de ejemplo" className="flex items-center justify-between gap-4">
            <span className="font-display text-20 font-bold tracking-display text-text">{sel.n}</span>
            {/* Los enlaces van sobre una pastilla para leerse encima de cualquier fondo. */}
            <span className="flex gap-1 rounded-control bg-bg/80 p-1 backdrop-blur-header">
              {link("inicio", "Inicio")}
              {link("proyectos", "Proyectos")}
            </span>
          </nav>
          {page === "inicio" ? (
            <div className="flex flex-1 flex-col justify-end gap-4" data-pagina="inicio">
              {letras ? (
                <Layer
                  item={letras}
                  values={sel.v[letras.slug]}
                  query={`modo=capa&texto=${encodeURIComponent(sel.n)}`}
                  title={`Titular: ${letras.title}`}
                  className="pointer-events-none w-full flex-1"
                />
              ) : (
                <h1 className="text-40 md:text-64">{sel.n}</h1>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-end gap-6" data-pagina="proyectos">
              <h1 className="text-40 md:text-64">Proyectos</h1>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {["Primero", "Segundo", "Tercero"].map((p) => (
                  <li
                    key={p}
                    className="aspect-16/10 rounded-card border border-border bg-surface-2 p-4 text-14 text-text-muted"
                  >
                    Proyecto {p.toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {layerTransition && transicion ? (
          <div ref={overlay} className="pointer-events-none absolute inset-0 z-20">
            <Layer
              item={transicion}
              values={sel.v[transicion.slug]}
              title={`Transición: ${transicion.title}`}
              className="size-full"
            />
          </div>
        ) : null}
      </section>
      {objeto ? (
        <section
          className="h-svh border-t border-border"
          aria-label={`Transición de objeto: ${objeto.title}`}
        >
          <Layer
            item={objeto}
            values={sel.v[objeto.slug]}
            query=""
            title={`Transición de objeto: ${objeto.title}`}
            className="size-full"
          />
        </section>
      ) : null}
      <footer className="flex flex-col gap-2 border-t border-border p-6 text-14 text-text-muted md:p-12">
        <p>
          Web de ejemplo montada con tus piezas
          {transicion && !layerTransition
            ? `. «${transicion.title}» se muestra aquí como un fundido; se ve entera en su demo`
            : ""}
          . Pulsa «Proyectos» para ver la transición de página.
        </p>
        {headline && !headline.ok ? (
          <p data-aviso-contraste>
            El titular tiene poco contraste con el fondo. En el constructor, pulsa «Usar texto {headline.tone}
            ».
          </p>
        ) : null}
        <Link
          href="/crear"
          className="w-fit rounded-control text-text underline underline-offset-4 outline-none kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid"
        >
          Volver al constructor
        </Link>
      </footer>
    </div>
  );
}
