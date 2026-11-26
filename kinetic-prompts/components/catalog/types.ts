/** Lo que la galería necesita de cada elemento (sin fs: se puede importar en el cliente). */
export type GalleryItem = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  level: 1 | 2 | 3;
  levelLabel: string;
  tech: string[];
  /** Prompt ya relleno con los valores por defecto: lo que se copia. */
  prompt: string;
  poster?: string;
  video?: string;
  videoMp4?: string;
};
