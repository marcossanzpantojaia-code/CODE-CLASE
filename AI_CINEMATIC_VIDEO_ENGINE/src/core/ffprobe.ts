import type { RunLog } from './log';
import { run } from './proc';

export interface VideoInfo {
  codec: string;
  /** Dimensiones codificadas. */
  width: number;
  height: number;
  /** Dimensiones tal como se ven (con la rotación aplicada). */
  displayWidth: number;
  displayHeight: number;
  rotation: number;
  fps: number;
  fpsFraction: string;
  avgFps: number;
  /** Frecuencia media distinta de la nominal: probable VFR (habitual en móviles). */
  vfrSuspect: boolean;
  pixFmt: string;
  bitDepth: number;
  colorTransfer: string | null;
  colorPrimaries: string | null;
  colorSpace: string | null;
  hdr: boolean;
  sar: string;
  frameCount: number | null;
}

export interface AudioInfo {
  codec: string;
  sampleRate: number;
  channels: number;
}

export interface MediaInfo {
  durationSec: number;
  formatName: string;
  sizeBytes: number;
  video: VideoInfo | null;
  audio: AudioInfo | null;
}

interface RawStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  pix_fmt?: string;
  bits_per_raw_sample?: string;
  color_transfer?: string;
  color_primaries?: string;
  color_space?: string;
  sample_aspect_ratio?: string;
  sample_rate?: string;
  channels?: number;
  nb_frames?: string;
  side_data_list?: { rotation?: number }[];
}

interface RawProbe {
  streams?: RawStream[];
  format?: { duration?: string; format_name?: string; size?: string };
}

export function parseRate(r: string | undefined): number {
  if (!r) return 0;
  const [n, d] = r.split('/').map(Number);
  if (!n || !d) return 0;
  return n / d;
}

const HDR_TRANSFERS = new Set(['arib-std-b67', 'smpte2084']);

export function parseProbe(raw: RawProbe): MediaInfo {
  const v = raw.streams?.find((s) => s.codec_type === 'video');
  const a = raw.streams?.find((s) => s.codec_type === 'audio');

  let video: VideoInfo | null = null;
  if (v && v.width && v.height) {
    const rotation = v.side_data_list?.find((d) => typeof d.rotation === 'number')?.rotation ?? 0;
    const quarterTurn = Math.abs(rotation) % 180 === 90;
    const fps = parseRate(v.r_frame_rate);
    const avgFps = parseRate(v.avg_frame_rate);
    const pixFmt = v.pix_fmt ?? 'unknown';
    const bitDepth = Number(v.bits_per_raw_sample) || (/p1[026]/.test(pixFmt) ? Number(/p(1[026])/.exec(pixFmt)![1]) : 8);
    video = {
      codec: v.codec_name ?? 'unknown',
      width: v.width,
      height: v.height,
      displayWidth: quarterTurn ? v.height : v.width,
      displayHeight: quarterTurn ? v.width : v.height,
      rotation,
      fps,
      fpsFraction: v.r_frame_rate ?? '0/0',
      avgFps,
      vfrSuspect: fps > 0 && avgFps > 0 && Math.abs(fps - avgFps) / fps > 0.01,
      pixFmt,
      bitDepth,
      colorTransfer: v.color_transfer ?? null,
      colorPrimaries: v.color_primaries ?? null,
      colorSpace: v.color_space ?? null,
      hdr: HDR_TRANSFERS.has(v.color_transfer ?? ''),
      sar: v.sample_aspect_ratio ?? '1:1',
      frameCount: v.nb_frames ? Number(v.nb_frames) : null,
    };
  }

  return {
    durationSec: Number(raw.format?.duration ?? 0),
    formatName: raw.format?.format_name ?? 'unknown',
    sizeBytes: Number(raw.format?.size ?? 0),
    video,
    audio: a ? { codec: a.codec_name ?? 'unknown', sampleRate: Number(a.sample_rate ?? 0), channels: a.channels ?? 0 } : null,
  };
}

export async function probe(file: string, log: RunLog): Promise<MediaInfo> {
  const res = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { log });
  return parseProbe(JSON.parse(res.stdout.toString('utf8')) as RawProbe);
}

/** Cuenta fotogramas decodificando (lento pero exacto). */
export async function countFrames(file: string, log: RunLog): Promise<number> {
  const res = await run(
    'ffprobe',
    ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file],
    { log },
  );
  return Number(res.stdout.toString('utf8').trim());
}
