import { AbsoluteFill, Sequence } from 'remotion';
import { ClipLayer } from './ClipLayer';
import { loadFonts } from './fonts';
import { LogoCard } from './LogoCard';
import type { EditProps, MediaRef } from './props';
import { Title } from './Title';

loadFonts();

function mediaFor(media: EditProps['media'], assetId: string): MediaRef {
  const ref = media[assetId];
  if (!ref) throw new Error(`No hay media preparada para el asset "${assetId}"`);
  return ref;
}

/** Composición genérica: todo lo que se ve sale del manifiesto. */
export const Edit: React.FC<EditProps> = ({ manifest, media }) => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    {manifest.video.map((clip, i) => (
      <Sequence key={clip.id} name={clip.id} from={clip.at} durationInFrames={clip.frames}>
        <ClipLayer clip={clip} next={manifest.video[i + 1]} media={mediaFor(media, clip.asset)} />
      </Sequence>
    ))}
    {manifest.overlays.map((o) => (
      <Sequence key={o.id} name={o.id} from={o.at} durationInFrames={o.frames}>
        {o.type === 'title' ? <Title o={o} /> : <LogoCard o={o} media={mediaFor(media, o.asset)} />}
      </Sequence>
    ))}
  </AbsoluteFill>
);
