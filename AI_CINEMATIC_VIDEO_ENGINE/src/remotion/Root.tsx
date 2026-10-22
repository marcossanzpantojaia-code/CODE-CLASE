import { Composition } from 'remotion';
import { parseManifest } from '../core/manifest';
import { Edit } from './Edit';
import type { EditProps } from './props';

// Solo para abrir Remotion Studio sin props; los renders reales pasan manifiesto y media
// como inputProps (npm run studio -- --props=<cache/render/.../props.json>).
const placeholder: EditProps = {
  manifest: parseManifest({
    version: 1,
    name: 'placeholder',
    output: { durationInFrames: 30 },
    assets: { v: { kind: 'video', path: 'placeholder.mp4' } },
    video: [{ id: 'c1', asset: 'v', sourceIn: 0, at: 0, frames: 30 }],
  }),
  media: { v: { src: 'media/placeholder.mp4', width: 1080, height: 1920 } },
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Edit"
    component={Edit}
    defaultProps={placeholder}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.manifest.output.durationInFrames,
      fps: props.manifest.output.fps,
      width: props.manifest.output.width,
      height: props.manifest.output.height,
    })}
  />
);
