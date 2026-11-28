"use client";

import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Param } from "@/lib/content";
import type { ParamValue } from "@/lib/prompt-render";

/** Control de un parámetro de item.json (lo usan el panel de la galería y el constructor). */
export function ParamControl({
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
