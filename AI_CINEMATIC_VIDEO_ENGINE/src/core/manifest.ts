// Manifiesto de edición: única fuente de verdad de un montaje.
// Módulo puro (solo zod): lo usan tanto el CLI en Node como la composición de Remotion.
import { z } from 'zod';

const frames = z.number().int().nonnegative();
const positiveFrames = z.number().int().positive();
const seconds = z.number().nonnegative();
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color en formato #RRGGBB');

export const EasingSchema = z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']);
export type Easing = z.infer<typeof EasingSchema>;

/** [fotograma relativo al inicio del clip, valor]; fotogramas estrictamente crecientes. */
const KeyframesSchema = z
  .array(z.tuple([frames, z.number()]))
  .min(1)
  .refine((kf) => kf.every((k, i) => i === 0 || k[0] > kf[i - 1]![0]), 'keyframes con fotogramas estrictamente crecientes');
export type Keyframes = z.infer<typeof KeyframesSchema>;

/**
 * Movimiento digital sobre el plano. zoom = 1 es "cubrir el encuadre exacto"; nunca < 1,
 * así que nunca aparecen bordes negros. pan va de -1 a 1 como fracción del margen
 * disponible a cada lado, así que nunca se sale del plano.
 */
export const TransformSchema = z.object({
  zoom: KeyframesSchema.refine((kf) => kf.every(([, v]) => v >= 1 && v <= 4), 'zoom entre 1 y 4').default([[0, 1]]),
  panX: KeyframesSchema.refine((kf) => kf.every(([, v]) => v >= -1 && v <= 1), 'panX entre -1 y 1').default([[0, 0]]),
  panY: KeyframesSchema.refine((kf) => kf.every(([, v]) => v >= -1 && v <= 1), 'panY entre -1 y 1').default([[0, 0]]),
  easing: EasingSchema.default('easeInOut'),
});
export type Transform = z.infer<typeof TransformSchema>;

/**
 * Cómo entra un clip desde el anterior. zoom-through no solapa los clips: el último
 * tramo del saliente acelera un zoom con desenfoque y el entrante se asienta desde el
 * mismo estado, así que el corte sigue cayendo en un fotograma exacto (medible).
 */
export const TransitionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('cut') }),
  z.object({
    type: z.literal('zoom-through'),
    frames: z.number().int().min(2).max(30),
    maxZoom: z.number().min(1).max(4).default(1.6),
    blurPx: z.number().min(0).max(60).default(14),
  }),
]);
export type Transition = z.infer<typeof TransitionSchema>;

export const VideoClipSchema = z.object({
  id: z.string().min(1),
  asset: z.string().min(1),
  /** Segundo del original donde empieza el plano. */
  sourceIn: seconds,
  /** Fotograma de la línea de tiempo donde empieza. */
  at: frames,
  /** Duración en la línea de tiempo. */
  frames: positiveFrames,
  /** 0.5 = cámara lenta a la mitad (usa fotogramas reales si el original tiene el doble de fps). */
  speed: z.number().min(0.1).max(4).default(1),
  transform: TransformSchema.prefault({}),
  transitionIn: TransitionSchema.default({ type: 'cut' }),
  /** El control de calidad exige un evento musical en el fotograma de entrada. */
  syncToBeat: z.boolean().default(false),
});
export type VideoClip = z.infer<typeof VideoClipSchema>;

const overlayTiming = { id: z.string().min(1), at: frames, frames: positiveFrames };

export const TitleOverlaySchema = z.object({
  ...overlayTiming,
  type: z.literal('title'),
  text: z.string().min(1).max(60),
  subtitle: z.string().max(80).optional(),
  position: z.enum(['center', 'lowerThird']).default('lowerThird'),
  color: hexColor.default('#F4EFE6'),
  accent: hexColor.default('#C8A165'),
});

export const LogoOverlaySchema = z.object({
  ...overlayTiming,
  type: z.literal('logo'),
  asset: z.string().min(1),
  background: hexColor.default('#0D0D0D'),
  widthFraction: z.number().min(0.1).max(0.9).default(0.5),
  tagline: z.string().max(60).optional(),
});

export const OverlaySchema = z.discriminatedUnion('type', [TitleOverlaySchema, LogoOverlaySchema]);
export type Overlay = z.infer<typeof OverlaySchema>;
export type TitleOverlay = z.infer<typeof TitleOverlaySchema>;
export type LogoOverlay = z.infer<typeof LogoOverlaySchema>;

export const AudioTrackSchema = z.object({
  id: z.string().min(1),
  asset: z.string().min(1),
  role: z.enum(['music', 'sfx', 'ambience']),
  at: frames,
  sourceIn: seconds.default(0),
  /** Por defecto: hasta el final del montaje o del fichero, lo que llegue antes. */
  frames: positiveFrames.optional(),
  gainDb: z.number().min(-60).max(12).default(0),
  fadeInFrames: frames.default(0),
  fadeOutFrames: frames.default(0),
});
export type AudioTrack = z.infer<typeof AudioTrackSchema>;

export const AssetSchema = z.object({
  kind: z.enum(['video', 'audio', 'image']),
  /** Ruta relativa a la raíz del proyecto. */
  path: z.string().min(1),
  /** Procedencia y licencia (obligatorio en la práctica para música). */
  license: z.string().optional(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const ManifestSchema = z
  .object({
    version: z.literal(1),
    name: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/i, 'nombre apto para ficheros'),
    style: z.string().default('custom'),
    output: z.object({
      width: z.number().int().positive().default(1080),
      height: z.number().int().positive().default(1920),
      fps: z.number().int().min(12).max(60).default(30),
      durationInFrames: positiveFrames,
    }),
    loudness: z
      .object({
        integratedLufs: z.number().min(-30).max(-8).default(-14),
        truePeakDb: z.number().min(-9).max(0).default(-1),
      })
      .prefault({}),
    assets: z.record(z.string(), AssetSchema),
    video: z.array(VideoClipSchema).min(1),
    overlays: z.array(OverlaySchema).default([]),
    audio: z.array(AudioTrackSchema).default([]),
    provenance: z
      .object({
        createdBy: z.string(),
        instruction: z.string().optional(),
        notes: z.array(z.string()).default([]),
      })
      .optional(),
  })
  .superRefine((m, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
    const total = m.output.durationInFrames;

    const checkAsset = (path: (string | number)[], id: string, kind: Asset['kind']) => {
      const asset = m.assets[id];
      if (!asset) issue(path, `asset "${id}" no declarado en assets`);
      else if (asset.kind !== kind) issue(path, `asset "${id}" es ${asset.kind}, se esperaba ${kind}`);
    };

    m.video.forEach((clip, i) => {
      checkAsset(['video', i, 'asset'], clip.asset, 'video');
      if (clip.at + clip.frames > total) issue(['video', i], `el clip ${clip.id} acaba después del final del montaje`);
      const prev = m.video[i - 1];
      if (prev && clip.at < prev.at + prev.frames) issue(['video', i], `el clip ${clip.id} se solapa con ${prev.id}`);
      if (clip.transitionIn.type === 'zoom-through') {
        const n = clip.transitionIn.frames;
        if (!prev || prev.at + prev.frames !== clip.at) {
          issue(['video', i, 'transitionIn'], 'zoom-through necesita un clip anterior contiguo');
        } else if (Math.ceil(n / 2) > prev.frames || Math.floor(n / 2) > clip.frames) {
          issue(['video', i, 'transitionIn'], 'la transición es más larga que los clips que une');
        }
      }
    });

    m.overlays.forEach((o, i) => {
      if (o.at + o.frames > total) issue(['overlays', i], `el overlay ${o.id} acaba después del final del montaje`);
      if (o.type === 'logo') checkAsset(['overlays', i, 'asset'], o.asset, 'image');
    });

    m.audio.forEach((t, i) => {
      checkAsset(['audio', i, 'asset'], t.asset, 'audio');
      if (t.at >= total) issue(['audio', i], `la pista ${t.id} empieza después del final`);
    });

    // Ningún fotograma puede quedar sin imagen: o lo cubre un clip o un cierre con logo.
    const covered = new Uint8Array(total);
    for (const c of m.video) covered.fill(1, c.at, Math.min(total, c.at + c.frames));
    for (const o of m.overlays) if (o.type === 'logo') covered.fill(1, o.at, Math.min(total, o.at + o.frames));
    const gap = covered.indexOf(0);
    if (gap !== -1) issue(['video'], `el fotograma ${gap} queda en negro: ningún clip ni cierre lo cubre`);
  });

export type Manifest = z.output<typeof ManifestSchema>;
export type ManifestInput = z.input<typeof ManifestSchema>;

export function parseManifest(input: unknown): Manifest {
  return ManifestSchema.parse(input);
}

export interface Boundary {
  frame: number;
  kind: 'cut' | 'zoom-through' | 'endcard';
  id: string;
  syncToBeat: boolean;
}

/** Fotogramas donde la imagen cambia de plano según el manifiesto (lo que QA debe encontrar). */
export function visualBoundaries(m: Manifest): Boundary[] {
  const out: Boundary[] = [];
  for (const c of m.video) {
    if (c.at > 0) out.push({ frame: c.at, kind: c.transitionIn.type, id: c.id, syncToBeat: c.syncToBeat });
  }
  for (const o of m.overlays) {
    if (o.type === 'logo' && o.at > 0) out.push({ frame: o.at, kind: 'endcard', id: o.id, syncToBeat: false });
  }
  return out.sort((a, b) => a.frame - b.frame);
}

/** Segundos del original que consume un clip. */
export function sourceSecondsUsed(clip: VideoClip, fps: number): number {
  return (clip.frames / fps) * clip.speed;
}
