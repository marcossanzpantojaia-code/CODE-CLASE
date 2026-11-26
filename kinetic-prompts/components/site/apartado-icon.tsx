import {
  ArrowLeftRight,
  Box,
  MousePointerClick,
  PanelTop,
  ScrollText,
  Shapes,
  Type,
  Waves,
} from "lucide-react";

import { Icon } from "@/components/ui/icon";
import type { ApartadoId } from "@/lib/apartados";

const ICONS = {
  fondos: Waves,
  transiciones: ArrowLeftRight,
  objetos: Shapes,
  texto: Type,
  heros: PanelTop,
  scroll: ScrollText,
  microinteracciones: MousePointerClick,
  "3d-webgl": Box,
} as const;

export function ApartadoIcon({ id, className }: { id: ApartadoId; className?: string }) {
  return <Icon icon={ICONS[id]} className={className} />;
}
