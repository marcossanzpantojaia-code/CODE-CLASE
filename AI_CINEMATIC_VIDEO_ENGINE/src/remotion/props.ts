import type { Manifest } from '../core/manifest';

/** Fichero servido desde el directorio público del render, con sus dimensiones reales. */
export type MediaRef = { src: string; width: number; height: number };

export type EditProps = {
  manifest: Manifest;
  /** assetId → fichero preparado para la composición (intermedio para vídeo). */
  media: Record<string, MediaRef>;
};

export const FONT_FAMILY = 'InterEngine';

/**
 * Márgenes de seguridad para la interfaz de TikTok/Reels, como fracción del encuadre.
 * Estimación conservadora, NO VERIFICADA contra la interfaz actual de cada plataforma.
 */
export const SAFE_AREA = { top: 0.08, bottom: 0.2, side: 0.1 } as const;
