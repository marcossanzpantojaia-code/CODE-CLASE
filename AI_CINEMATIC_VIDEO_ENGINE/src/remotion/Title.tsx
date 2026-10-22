import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { TitleOverlay } from '../core/manifest';
import { clamp01, ease } from './geometry';
import { FONT_FAMILY, SAFE_AREA } from './props';

/** Título con jerarquía: texto principal espaciado, filete de acento y subtítulo opcional. */
export const Title: React.FC<{ o: TitleOverlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const inDur = Math.max(1, Math.min(18, Math.floor(o.frames / 3)));
  const outDur = Math.max(1, Math.min(12, Math.floor(o.frames / 4)));
  const pin = ease.easeOut(clamp01(f / inDur));
  const pout = ease.easeIn(clamp01((f - (o.frames - outDur)) / outDur));
  const opacity = pin * (1 - pout);
  const tracking = 0.26 + (1 - pin) * 0.1;
  const top = o.position === 'center' ? height * 0.42 : height * (1 - SAFE_AREA.bottom) - height * 0.2;

  return (
    <AbsoluteFill>
      {/* Degradado inferior: legibilidad sobre cualquier plano sin oscurecer todo el encuadre. */}
      <AbsoluteFill
        style={{ opacity: opacity * 0.9, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%)' }}
      />
      <div
        style={{
          position: 'absolute',
          left: width * SAFE_AREA.side,
          right: width * SAFE_AREA.side,
          top,
          opacity,
          transform: `translateY(${(1 - pin) * 28}px)`,
          textAlign: 'center',
          fontFamily: FONT_FAMILY,
          color: o.color,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: width * 0.068,
            lineHeight: 1.15,
            letterSpacing: `${tracking}em`,
            // El espaciado añade aire tras la última letra: se compensa para centrar ópticamente.
            paddingLeft: `${tracking}em`,
            textTransform: 'uppercase',
            textShadow: '0 2px 18px rgba(0,0,0,0.55)',
          }}
        >
          {o.text}
        </div>
        <div style={{ margin: `${height * 0.012}px auto 0`, height: 3, width: width * 0.12 * pin, background: o.accent }} />
        {o.subtitle ? (
          <div
            style={{
              marginTop: height * 0.012,
              fontWeight: 400,
              fontSize: width * 0.03,
              letterSpacing: '0.2em',
              paddingLeft: '0.2em',
              textTransform: 'uppercase',
              textShadow: '0 1px 10px rgba(0,0,0,0.6)',
            }}
          >
            {o.subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
