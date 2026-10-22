// Geometría y tiempos de la composición. Puro (sin React ni Remotion): se testea en Node.
import type { Easing, Keyframes, Transition, VideoClip } from '../core/manifest';

export const ease: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - (1 - t) ** 3,
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
};

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Valor de una curva de keyframes en un fotograma; constante fuera del rango. */
export function valueAt(kf: Keyframes, frame: number, easing: Easing): number {
  const first = kf[0]!;
  if (frame <= first[0]) return first[1];
  for (let i = 1; i < kf.length; i++) {
    const [f1, v1] = kf[i]!;
    const [f0, v0] = kf[i - 1]!;
    if (frame <= f1) return v0 + (v1 - v0) * ease[easing]((frame - f0) / (f1 - f0));
  }
  return kf[kf.length - 1]![1];
}

/** Escala uniforme mínima para que el plano cubra el encuadre (nunca deforma). */
export function coverScale(srcW: number, srcH: number, outW: number, outH: number): number {
  return Math.max(outW / srcW, outH / srcH);
}

/** pan en [-1, 1] → desplazamiento en px dentro del margen que deja el tamaño escalado. pan = 1 muestra el borde derecho/inferior. */
export function panOffset(pan: number, scaledSize: number, outSize: number): number {
  return -pan * Math.max(0, (scaledSize - outSize) / 2);
}

export interface TransitionFx {
  extraZoom: number;
  blurPx: number;
}

const NO_FX: TransitionFx = { extraZoom: 1, blurPx: 0 };
type ZoomThrough = Extract<Transition, { type: 'zoom-through' }>;

/**
 * Efecto zoom-through en el fotograma f (relativo al clip). El saliente acelera hacia el
 * máximo en sus últimos ceil(n/2) fotogramas; el entrante arranca en el máximo y se asienta
 * en floor(n/2). Ambos lados del corte están en el mismo estado: el corte queda oculto.
 */
export function transitionFx(clip: VideoClip, next: VideoClip | undefined, f: number): TransitionFx {
  let amount = 0;
  let tr: ZoomThrough | null = null;

  const tin = clip.transitionIn;
  if (tin.type === 'zoom-through') {
    const k = Math.floor(tin.frames / 2);
    if (k > 0 && f < k) {
      amount = (1 - f / k) ** 2;
      tr = tin;
    }
  }
  if (next && next.at === clip.at + clip.frames && next.transitionIn.type === 'zoom-through') {
    const h = Math.ceil(next.transitionIn.frames / 2);
    const start = clip.frames - h;
    if (f >= start) {
      const a = ((f - start + 1) / h) ** 2;
      if (a > amount) {
        amount = a;
        tr = next.transitionIn;
      }
    }
  }
  if (!tr) return NO_FX;
  return { extraZoom: 1 + (tr.maxZoom - 1) * amount, blurPx: tr.blurPx * amount };
}

export interface ClipLayout {
  /** Tamaño base del plano (ya escalado para cubrir) antes del zoom. */
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  blurPx: number;
}

export function clipLayout(
  clip: VideoClip,
  next: VideoClip | undefined,
  f: number,
  src: { width: number; height: number },
  out: { width: number; height: number },
): ClipLayout {
  const cover = coverScale(src.width, src.height, out.width, out.height);
  const width = src.width * cover;
  const height = src.height * cover;
  const t = clip.transform;
  const fx = transitionFx(clip, next, f);
  const scale = valueAt(t.zoom, f, t.easing) * fx.extraZoom;
  return {
    width,
    height,
    scale,
    offsetX: panOffset(valueAt(t.panX, f, t.easing), width * scale, out.width),
    offsetY: panOffset(valueAt(t.panY, f, t.easing), height * scale, out.height),
    blurPx: fx.blurPx,
  };
}
