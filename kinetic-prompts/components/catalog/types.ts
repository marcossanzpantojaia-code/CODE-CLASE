import type { Param } from "@/lib/content";

/** Lo que la galería y el panel necesitan de cada elemento (sin fs: se puede usar en el cliente). */
export type GalleryItem = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  level: 1 | 2 | 3;
  levelLabel: string;
  tech: string[];
  params: Param[];
  /** prompt.md con {{variables}} y bloques por tipo de proyecto. */
  promptTemplate: string;
  /** Parámetro de color que toma el color de marca en el constructor. */
  brandParam?: string;
  /** Consejos de la biblioteca en lenguaje llano. */
  tips: string[];
  /** Títulos de las fichas de la biblioteca en las que se basa. */
  sources: string[];
  /** URL de la demo en vivo (preview/index.html). */
  demo?: string;
  poster?: string;
  video?: string;
  videoMp4?: string;
};
