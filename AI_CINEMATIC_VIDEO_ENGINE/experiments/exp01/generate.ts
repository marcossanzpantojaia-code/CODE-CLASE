// EXP-01: material sintético con propiedades conocidas por construcción (ground truth).
// Solo FFmpeg, para que el experimento se pueda repetir igual en Linux y Windows.
import fs from 'node:fs';
import path from 'node:path';
import type { RunLog } from '../../src/core/log';
import { ffmpeg } from '../../src/core/proc';
import { dirs, ensureDir } from '../../src/core/project';
import { importOriginal } from '../../src/ingest/ingest';

const FONT = 'resources/fonts/Inter/Inter-SemiBold.otf';

export const TRUTH = {
  fps: 30,
  music: { bpm: 120, firstBeatSec: 0.3, beatSec: 0.5, durationSec: 14 },
  /** Fondo uniforme de cada clip (RGB): permite medir color y deriva en zonas planas. */
  clips: {
    s1: { file: 'originals/exp01/s1_landscape_25fps.mp4', bg: [0x5a, 0x1a, 0x14], desc: '1920x1080 horizontal, 25 fps' },
    s2: { file: 'originals/exp01/s2_portrait_60fps.mp4', bg: [0x16, 0x3f, 0x2a], desc: '1080x1920, 60 fps (cámara lenta real a 0.5×)' },
    s3: { file: 'originals/exp01/s3_rotated_2997.mp4', bg: [0x1a, 0x2e, 0x5c], desc: 'codificado 1920x1080 con rotación 270°, 29.97 fps' },
    // Versión 2: blanco SDR en el 75 % de la señal HLG (BT.2408), como graba una cámara. La primera
    // versión (s4_hlg_hdr.mp4, sigue en assets/ sin usar) ponía el blanco en el pico HLG.
    s4: { file: 'originals/exp01/s4_hlg_bt2408.mp4', bg: [0x7a, 0x4a, 0x1e], desc: 'HLG 10-bit BT.2020 (HEVC), blanco de referencia al 75 %' },
  },
  musicFile: 'music/exp01_click_120bpm.wav',
  sfxFile: 'sound-effects/exp01_whoosh.wav',
  logoFile: 'logos/exp01_logo.png',
  /** El cuadrado blanco se mueve 400 px/s en coordenadas del original. */
  squarePxPerSec: 400,
} as const;

export function truthBeats(): number[] {
  const { firstBeatSec, beatSec, durationSec } = TRUTH.music;
  const out: number[] = [];
  for (let t = firstBeatSec; t < durationSec - 1e-9; t += beatSec) out.push(Number(t.toFixed(6)));
  return out;
}

const hex = (rgb: readonly number[]) => '0x' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

// Los fotogramas de lavfi no llevan primarias: sin p=bt709 explícito en la salida del primer
// zscale, falla con "no path between colorspaces".
const SDR_TO_HLG_BT2408 =
  'format=yuv420p,zscale=tin=bt709:min=bt709:pin=bt709:rin=tv:t=linear:p=bt709:npl=203,format=gbrpf32le,' +
  'zscale=p=2020:t=arib-std-b67:m=2020_ncl:r=tv:npl=203,format=yuv420p10le';

const ENC_709 = ['-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'];
const ENC_HLG = [
  '-c:v', 'libx265', '-crf', '16', '-tag:v', 'hvc1',
  '-x265-params', 'log-level=error:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc',
  '-color_primaries', 'bt2020', '-color_trc', 'arib-std-b67', '-colorspace', 'bt2020nc',
];

/** Fondo plano + círculo amarillo centrado + cuadrado blanco en movimiento + banda superior + rótulo. */
function clipArgs(o: { w: number; h: number; rate: string; dur: number; bg: readonly number[]; label: string; circle: string; post?: string }): string[] {
  const graph =
    `[0][1]overlay=x=(W-w)/2:y=(H-h)/2[a];` +
    `[a][2]overlay=x='mod(t*${TRUTH.squarePxPerSec},W-w)':y=H*0.7-h/2:shortest=1[b];` +
    `[b]drawbox=x=0:y=0:w=iw:h=ih*0.06:color=white:t=fill,` +
    `drawtext=fontfile=${FONT}:text='${o.label} f%{n}':x=40:y=h-90:fontsize=48:fontcolor=white` +
    (o.post ? `,${o.post}` : '') +
    `[v]`;
  return [
    '-y',
    '-f', 'lavfi', '-i', `color=c=${hex(o.bg)}:s=${o.w}x${o.h}:r=${o.rate}:d=${o.dur}`,
    '-i', o.circle,
    '-f', 'lavfi', '-i', `color=c=white:s=80x80:r=${o.rate}:d=${o.dur}`,
    '-filter_complex', graph, '-map', '[v]',
  ];
}

async function circlePng(dir: string, log: RunLog): Promise<string> {
  const circle = path.join(dir, 'circle.png');
  if (!fs.existsSync(circle)) {
    await ffmpeg(
      ['-y', '-f', 'lavfi', '-i', "color=c=black@0:s=300x300,format=rgba,geq=r=255:g=214:b=0:a='255*lte(hypot(X-150,Y-150),148)'", '-frames:v', '1', circle],
      { log, outputs: [circle] },
    );
  }
  return circle;
}

export interface Exp01Assets {
  clips: Record<keyof typeof TRUTH.clips, string>;
  music: string;
  sfx: string;
  logo: string;
  generated: string[];
}

/** Genera e importa solo lo que falte en assets/ (nunca sobrescribe un original). */
export async function generateExp01(log: RunLog): Promise<Exp01Assets> {
  const gen = ensureDir(path.join(dirs.cache, 'exp01', 'gen'));
  const g = (f: string) => path.join(gen, f);
  const circle = await circlePng(gen, log);
  const { firstBeatSec: t0, beatSec: b, durationSec } = TRUTH.music;
  const click =
    `0.6*gte(t,${t0})*lt(mod(t-${t0},${b}),0.012)*sin(2*PI*if(lt(mod(t-${t0},${b * 4}),0.012),1600,1000)*t)*exp(-300*mod(t-${t0},${b}))` +
    `+0.05*sin(2*PI*110*t)+0.035*sin(2*PI*164.81*t)`;

  const jobs: [dest: string, tmp: string, args: string[]][] = [
    [TRUTH.clips.s1.file, g('s1.mp4'), [...clipArgs({ w: 1920, h: 1080, rate: '25', dur: 4, bg: TRUTH.clips.s1.bg, label: 'S1 25fps 16x9', circle }), ...ENC_709]],
    [TRUTH.clips.s2.file, g('s2.mp4'), [...clipArgs({ w: 1080, h: 1920, rate: '60', dur: 3, bg: TRUTH.clips.s2.bg, label: 'S2 60fps', circle }), ...ENC_709]],
    // S3: contenido vertical girado 90° antihorario; se marca para mostrarse girado 270° (se ve derecho).
    [TRUTH.clips.s3.file, g('s3_raw.mp4'), [...clipArgs({ w: 1080, h: 1920, rate: '30000/1001', dur: 3, bg: TRUTH.clips.s3.bg, label: 'S3 29.97 rot', circle, post: 'transpose=2' }), ...ENC_709]],
    [TRUTH.clips.s4.file, g('s4.mp4'), [...clipArgs({ w: 1080, h: 1920, rate: '30', dur: 3, bg: TRUTH.clips.s4.bg, label: 'S4 HLG', circle, post: SDR_TO_HLG_BT2408 }), ...ENC_HLG]],
    // Click track: golpe cada 0.5 s desde 0.3 s, acento cada 4, y un colchón grave (sin silencios).
    [TRUTH.musicFile, g('music.wav'), ['-y', '-f', 'lavfi', '-i', `aevalsrc=exprs='${click}':s=48000:d=${durationSec}`, '-ac', '2', '-c:a', 'pcm_s16le']],
    [TRUTH.sfxFile, g('whoosh.wav'), ['-y', '-f', 'lavfi', '-i', 'anoisesrc=d=0.45:c=pink:a=0.6:r=48000',
      '-af', 'highpass=f=300,lowpass=f=6000,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.15', '-ac', '2', '-c:a', 'pcm_s16le']],
    [TRUTH.logoFile, g('logo.png'), ['-y', '-f', 'lavfi', '-i',
      "color=c=black@0:s=800x800,format=rgba,geq=r=200:g=161:b=101:a='255*between(hypot(X-400,Y-400),340,362)'," +
        `drawtext=fontfile=${FONT}:text='BARBER':fontsize=150:fontcolor=0xEDE3D1:x=(w-tw)/2:y=(h-th)/2-50,` +
        `drawtext=fontfile=${FONT}:text='CO. EST 2026':fontsize=50:fontcolor=0xC8A165:x=(w-tw)/2:y=(h/2)+90`,
      '-frames:v', '1']],
  ];

  const generated: string[] = [];
  for (const [dest, tmp, args] of jobs) {
    if (fs.existsSync(path.join(dirs.assets, dest))) continue;
    await ffmpeg([...args, tmp], { log, outputs: [tmp] });
    let src = tmp;
    if (dest === TRUTH.clips.s3.file) {
      src = g('s3.mp4');
      await ffmpeg(['-y', '-display_rotation:v:0', '270', '-i', tmp, '-c', 'copy', src], { log, outputs: [src] });
    }
    // Entrada en assets/ por la única vía sancionada (sin sobrescribir, solo lectura).
    log.event('import-original', await importOriginal(src, dest));
    generated.push(dest);
  }

  const a = (p: string) => `assets/${p}`;
  return {
    clips: { s1: a(TRUTH.clips.s1.file), s2: a(TRUTH.clips.s2.file), s3: a(TRUTH.clips.s3.file), s4: a(TRUTH.clips.s4.file) },
    music: a(TRUTH.musicFile),
    sfx: a(TRUTH.sfxFile),
    logo: a(TRUTH.logoFile),
    generated,
  };
}

/**
 * Referencias de medida para S4 (no son originales): la versión SDR antes de pasar a HLG y
 * una decodificación "ingenua" que ignora el HDR. El tonemap debe acercarse a la primera.
 */
export async function makeS4References(log: RunLog): Promise<{ sdrRef: string; naive: string }> {
  const dir = ensureDir(path.join(dirs.cache, 'exp01', 'refs'));
  const circle = await circlePng(dir, log);
  const stem = path.basename(TRUTH.clips.s4.file, '.mp4');
  const sdrRef = path.join(dir, `${stem}_sdr_ref.mp4`);
  const naive = path.join(dir, `${stem}_naive_as_bt709.mp4`);
  if (!fs.existsSync(sdrRef)) {
    await ffmpeg([...clipArgs({ w: 1080, h: 1920, rate: '30', dur: 3, bg: TRUTH.clips.s4.bg, label: 'S4 HLG', circle }), ...ENC_709, sdrRef], {
      log,
      outputs: [sdrRef],
    });
  }
  if (!fs.existsSync(naive)) {
    await ffmpeg(
      ['-y', '-i', path.join(dirs.assets, TRUTH.clips.s4.file), '-vf', 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709,format=yuv420p', ...ENC_709, naive],
      { log, outputs: [naive] },
    );
  }
  return { sdrRef, naive };
}
