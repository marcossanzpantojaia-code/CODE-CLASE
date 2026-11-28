"use client";

import { useEffect, useRef } from "react";

import type { ParamValue } from "@/lib/prompt-render";

/** Demo en vivo de una pieza elegida, con sus opciones aplicadas (kp:params). */
export function PiecePreview({
  title,
  label,
  demo,
  values,
}: {
  title: string;
  label: string;
  demo: string;
  values: Record<string, ParamValue>;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "kp:params", params: values }, "*");
  }, [values]);
  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-16/10 overflow-hidden rounded-card border border-border bg-surface-2">
        <iframe
          ref={frame}
          src={demo}
          title={`Demo en vivo: ${title}`}
          sandbox="allow-scripts"
          loading="lazy"
          className="absolute inset-0 size-full"
          onLoad={() => frame.current?.contentWindow?.postMessage({ type: "kp:params", params: values }, "*")}
        />
      </div>
      <figcaption className="text-12 text-text-muted">
        {label}: <span className="text-text">{title}</span>
      </figcaption>
    </figure>
  );
}
