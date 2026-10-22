import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoClip } from '../core/manifest';
import { clipLayout } from './geometry';
import type { MediaRef } from './props';

export const ClipLayer: React.FC<{ clip: VideoClip; next: VideoClip | undefined; media: MediaRef }> = ({ clip, next, media }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const l = clipLayout(clip, next, f, media, { width, height });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: (width - l.width) / 2,
          top: (height - l.height) / 2,
          width: l.width,
          height: l.height,
          transform: `translate(${l.offsetX}px, ${l.offsetY}px) scale(${l.scale})`,
          filter: l.blurPx > 0.05 ? `blur(${l.blurPx}px)` : undefined,
        }}
      >
        <OffthreadVideo
          src={staticFile(media.src)}
          trimBefore={Math.round(clip.sourceIn * fps)}
          playbackRate={clip.speed}
          muted
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </AbsoluteFill>
  );
};
