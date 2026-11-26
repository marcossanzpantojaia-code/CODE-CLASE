"use client";

import { RotateCcw, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ColorPicker } from "@/components/ui/color-picker";
import { CopyButton } from "@/components/ui/copy-button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Param } from "@/lib/content";
import { type ParamValue, renderPrompt, selectStack, STACKS, type StackId } from "@/lib/prompt-render";

import type { GalleryItem } from "./types";

function defaults(params: Param[]): Record<string, ParamValue> {
  return Object.fromEntries(params.map((p) => [p.id, p.default]));
}

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: Param;
  value: ParamValue;
  onChange: (value: ParamValue) => void;
}) {
  switch (param.type) {
    case "range":
      return (
        <Slider
          label={param.label}
          min={param.min}
          max={param.max}
          step={param.step}
          unit={param.unit}
          value={value as number}
          onValueChange={onChange}
        />
      );
    case "color":
      return <ColorPicker label={param.label} value={value as string} onValueChange={onChange} />;
    case "select":
      return (
        <Select
          label={param.label}
          options={param.options.map((o) => ({ value: o, label: o }))}
          value={value as string}
          onValueChange={onChange}
        />
      );
    case "text":
      return <Input label={param.label} value={value as string} onChange={(e) => onChange(e.target.value)} />;
    default:
      return null;
  }
}

/**
 * Panel de un efecto: demo en vivo, opciones (tipo de proyecto y parámetros), el prompt que sale de
 * esas opciones y los consejos de la biblioteca. Se elige y se copia aquí.
 */
export function EffectPanel({ item }: { item: GalleryItem }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [values, setValues] = useState<Record<string, ParamValue>>(() => defaults(item.params));
  const [stack, setStack] = useState<StackId>("auto");
  // El diálogo oculta el resto de la página a los lectores de pantalla: el aviso va dentro.
  const [announcement, setAnnouncement] = useState({ text: "", n: 0 });

  const prompt = useMemo(
    () => renderPrompt(selectStack(item.promptTemplate, stack), { ...values, title: item.title }),
    [item.promptTemplate, item.title, stack, values],
  );

  // La demo se actualiza con cada cambio (contrato kp:params de kp-crear-animacion).
  const send = (message: object) => frame.current?.contentWindow?.postMessage(message, "*");
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "kp:params", params: values }, "*");
  }, [values]);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-bg" />
      <Dialog.Content
        className="fixed inset-0 z-50 overflow-y-auto bg-bg outline-none motion-safe:animate-pop-in"
        data-panel={item.slug}
      >
        <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-6 md:px-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-12 text-text-muted">
                {item.categoryLabel} · Nivel {item.levelLabel.toLowerCase()} · {item.tech.join(" · ")}
              </p>
              <Dialog.Title className="text-28 md:text-40">{item.title}</Dialog.Title>
              <Dialog.Description className="text-14 text-text-muted">{item.summary}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton icon={X} label="Cerrar y volver a la galería" variant="secundario" />
            </Dialog.Close>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:grid-rows-[auto_1fr]">
            <section className="flex flex-col gap-4 lg:col-span-3" aria-label="Demo en vivo">
              <div className="relative aspect-16/10 overflow-hidden rounded-card border border-border bg-surface-2">
                {item.demo ? (
                  <iframe
                    ref={frame}
                    src={item.demo}
                    title={`Demo en vivo: ${item.title}`}
                    sandbox="allow-scripts"
                    className="absolute inset-0 size-full"
                    onLoad={() => send({ type: "kp:params", params: values })}
                  />
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secundario" icon={RotateCcw} onClick={() => send({ type: "kp:replay" })}>
                  Repetir
                </Button>
                <Button variant="fantasma" onClick={() => setValues(defaults(item.params))}>
                  Valores por defecto
                </Button>
              </div>
            </section>

            <section
              className="flex flex-col gap-6 lg:col-span-2 lg:row-span-2"
              aria-label="Opciones y prompt"
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-sans text-16 font-semibold tracking-normal">Tu proyecto</h3>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Tu proyecto">
                  {STACKS.map((s) => (
                    <Chip key={s.id} active={stack === s.id} onClick={() => setStack(s.id)}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>
              {item.params.length ? (
                <div className="flex flex-col gap-4">
                  <h3 className="font-sans text-16 font-semibold tracking-normal">Opciones</h3>
                  {item.params.map((param) => (
                    <ParamControl
                      key={param.id}
                      param={param}
                      value={values[param.id]!}
                      onChange={(value) => setValues((current) => ({ ...current, [param.id]: value }))}
                    />
                  ))}
                </div>
              ) : null}
              {/* En móvil, el botón queda fijo abajo mientras se baja por el panel. */}
              <div className="max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:bg-bg max-lg:py-3">
                <CopyButton
                  source={prompt}
                  size="lg"
                  what={`Prompt de ${item.title}`}
                  className="w-full"
                  onCopied={() =>
                    setAnnouncement((a) => ({
                      text: `Prompt de ${item.title} copiado al portapapeles.`,
                      n: a.n + 1,
                    }))
                  }
                />
              </div>
              <div role="status" aria-live="polite" className="sr-only">
                <span key={announcement.n}>{announcement.text}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-sans text-16 font-semibold tracking-normal">El prompt</h3>
                <pre
                  className="max-h-96 overflow-auto rounded-card border border-border bg-surface-2 p-4 font-mono text-14 leading-mono whitespace-pre-wrap"
                  data-prompt
                >
                  {prompt}
                </pre>
                <p className="text-12 text-text-muted">
                  Pégalo en tu IA (Claude Code, Cursor…) con tu proyecto abierto. Se reescribe solo al cambiar
                  las opciones.
                </p>
              </div>
            </section>
            {item.tips.length ? (
              <section className="lg:col-span-3" aria-label="Consejos de la biblioteca">
                <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
                  <h3 className="font-sans text-16 font-semibold tracking-normal">
                    Consejos de la biblioteca
                  </h3>
                  <ul className="flex list-disc flex-col gap-2 pl-6 text-14 text-text-muted">
                    {item.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                  {item.sources.length ? (
                    <p className="text-12 text-text-muted">
                      Basado en {item.sources.length} fichas de la biblioteca: {item.sources.join(" · ")}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
