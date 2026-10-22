import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { LogoOverlay } from '../core/manifest';
import { clamp01, ease } from './geometry';
import { FONT_FAMILY, type MediaRef } from './props';

/** Cierre de marca: fondo sólido con corte seco (medible) y logo que entra con escala y opacidad. */
export const LogoCard: React.FC<{ o: LogoOverlay; media: MediaRef }> = ({ o, media }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = ease.easeOut(clamp01(f / Math.min(18, o.frames / 2)));
  const pTag = ease.easeOut(clamp01((f - 8) / 16));

  return (
    <AbsoluteFill style={{ backgroundColor: o.background, alignItems: 'center', justifyContent: 'center' }}>
      <Img
        src={staticFile(media.src)}
        style={{ width: width * o.widthFraction, opacity: p, transform: `scale(${0.94 + 0.06 * p})` }}
      />
      {o.tagline ? (
        <div
          style={{
            marginTop: height * 0.03,
            opacity: pTag,
            fontFamily: FONT_FAMILY,
            fontWeight: 500,
            fontSize: width * 0.03,
            letterSpacing: `${0.3 + (1 - pTag) * 0.1}em`,
            paddingLeft: '0.3em',
            textTransform: 'uppercase',
            color: '#E9E3D8',
          }}
        >
          {o.tagline}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
