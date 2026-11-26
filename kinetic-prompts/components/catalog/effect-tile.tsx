"use client";

import { Check, Copy, RotateCcw } from "lucide-react";
import { type HTMLAttributes, useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { focusRing } from "@/components/ui/styles";
import { type CopyStatus, useCopyPrompt } from "@/components/ui/use-copy-prompt";
import { cn } from "@/lib/cn";

import type { GalleryItem } from "./types";

/* Nunca más de 6 vídeos a la vez (criterio de la fase 2): al empezar el séptimo se para el más antiguo. */
const MAX_PLAYING = 6;
const playing = new Set<HTMLVideoElement>();

function play(video: HTMLVideoElement, fromStart: boolean) {
  if (fromStart) video.currentTime = 0;
  if (!playing.has(video) && playing.size >= MAX_PLAYING) {
    const oldest = playing.values().next().value;
    oldest?.pause();
    if (oldest) playing.delete(oldest);
  }
  playing.add(video);
  video.play().catch(() => playing.delete(video));
}

function stop(video: HTMLVideoElement) {
  video.pause();
  playing.delete(video);
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PILL: Record<CopyStatus, { text: string; tone: string }> = {
  reposo: { text: "Copiar prompt", tone: "border-border text-text" },
  copiando: { text: "Copiando…", tone: "border-border text-text" },
  copiado: { text: "Copiado", tone: "border-success text-success" },
  error: { text: "Reintentar", tone: "border-danger text-danger" },
};

function LevelDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={cn("size-2 rounded-full", n <= level ? "bg-text" : "bg-border-strong")} />
      ))}
    </span>
  );
}

/**
 * Tarjeta-botón de la galería: toda la tarjeta es el botón. Un clic reproduce el ejemplo y copia
 * su prompt (principio «ver y copiar a la vez»). En escritorio, el vídeo se reproduce al pasar el
 * ratón o con el foco; en táctil, cuando la tarjeta está a la vista.
 */
export function EffectTile({
  item,
  forceStatus,
  ...rest
}: { item: GalleryItem; forceStatus?: CopyStatus } & Omit<HTMLAttributes<HTMLButtonElement>, "onClick">) {
  const summaryId = useId();
  const video = useRef<HTMLVideoElement>(null);
  const [isPlaying, setPlaying] = useState(false);
  const { status, copy } = useCopyPrompt({
    source: item.prompt,
    what: `Prompt de ${item.title}`,
    onCopied: () => {
      if (video.current && !reducedMotion()) play(video.current, true);
    },
  });
  const shown = forceStatus ?? status;
  const pill = PILL[shown];

  // En pantallas táctiles no hay hover: se reproduce cuando al menos la mitad está a la vista.
  useEffect(() => {
    const el = video.current;
    if (!el || !window.matchMedia("(hover: none)").matches || reducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? play(el, false) : stop(el)),
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      stop(el);
    };
  }, []);

  const start = () => video.current && !reducedMotion() && play(video.current, false);
  const end = () => video.current && stop(video.current);

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-card border border-border bg-surface text-left",
        "transition-[transform,border-color] duration-(--dur-hover) ease-kp",
        "kp-hover:translate-y-(--lift) kp-hover:border-border-strong kp-active:scale-(--press-scale)",
        focusRing,
      )}
      aria-label={`${shown === "copiado" ? "Copiado" : "Copiar prompt"}: ${item.title}, nivel ${item.levelLabel.toLowerCase()}`}
      aria-describedby={summaryId}
      aria-busy={shown === "copiando" || undefined}
      data-estado={shown}
      onClick={() => {
        if (!forceStatus) void copy();
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && start()}
      onPointerLeave={(e) => e.pointerType === "mouse" && end()}
      onFocus={start}
      onBlur={end}
      {...rest}
    >
      <span className="relative block aspect-16/10 w-full overflow-hidden bg-surface-2">
        {item.poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- póster ya optimizado (WebP < 80 KB)
          <img src={item.poster} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
        ) : null}
        {item.video ? (
          <video
            ref={video}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-(--dur-hover) ease-kp",
              isPlaying ? "opacity-100" : "opacity-0",
            )}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <source src={item.video} type="video/webm" />
            {item.videoMp4 ? <source src={item.videoMp4} type="video/mp4" /> : null}
          </video>
        ) : null}
        <span className="absolute top-3 left-3 flex items-center gap-2 rounded-control border border-border bg-surface px-2 py-1 text-12 font-medium text-text">
          <LevelDots level={item.level} />
          {item.levelLabel}
        </span>
        <span
          className={cn(
            "absolute right-3 bottom-3 flex items-center gap-2 rounded-control border bg-surface px-3 py-2 text-14 font-medium",
            "transition-colors duration-(--dur-ui) ease-kp",
            pill.tone,
          )}
          aria-hidden="true"
        >
          {shown === "copiando" ? <Spinner /> : null}
          {shown === "reposo" ? <Icon icon={Copy} /> : null}
          {shown === "error" ? <Icon icon={RotateCcw} /> : null}
          {pill.text}
          {shown === "copiado" ? <Icon icon={Check} /> : null}
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-1 p-4">
        <span className="truncate text-16 font-medium text-text">{item.title}</span>
        <span className="truncate text-12 text-text-muted">
          {item.categoryLabel} · {item.tech.slice(0, 3).join(" · ")}
        </span>
        <span id={summaryId} className="sr-only">
          {item.summary}
        </span>
      </span>
    </button>
  );
}
