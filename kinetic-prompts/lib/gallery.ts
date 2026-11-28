/** Datos de la galería y del inicio, preparados en el servidor a partir de content/. */
import type { GalleryItem } from "@/components/catalog/types";

import {
  type AnimationItem,
  CATEGORIES,
  contentUrl,
  getPublishedAnimations,
  knowledgeTitles,
  LEVELS,
} from "./content";

export function toGalleryItem(item: AnimationItem): GalleryItem {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    category: item.category,
    categoryLabel: CATEGORIES[item.category],
    level: item.difficulty,
    levelLabel: LEVELS[item.difficulty],
    tech: item.tech,
    params: item.params,
    promptTemplate: item.promptTemplate,
    tips: item.tips,
    brandParam: item.brandParam,
    nameParam: item.nameParam,
    sources: knowledgeTitles(item.knowledgeRefs),
    demo: contentUrl(item, "preview/index.html"),
    poster: item.media.poster ? contentUrl(item, item.media.poster) : undefined,
    video: item.media.video ? contentUrl(item, item.media.video) : undefined,
    videoMp4: item.media.videoMp4 ? contentUrl(item, item.media.videoMp4) : undefined,
  };
}

export function getGalleryItems(): GalleryItem[] {
  return getPublishedAnimations().map(toGalleryItem);
}

/** Fichas distintas de la biblioteca en las que se basan los efectos publicados. */
export function sourcesUsed(): number {
  return new Set(getPublishedAnimations().flatMap((i) => i.knowledgeRefs)).size;
}
