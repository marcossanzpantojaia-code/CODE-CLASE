import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import { FONT_FAMILY } from './props';

// Fuentes incluidas en el proyecto (no las del sistema): mismo resultado en Linux y Windows.
const FACES: [file: string, weight: string][] = [
  ['Inter-Regular.otf', '400'],
  ['Inter-Medium.otf', '500'],
  ['Inter-SemiBold.otf', '600'],
];

let requested = false;

export function loadFonts(): void {
  if (requested) return;
  requested = true;
  const handle = delayRender('Cargando fuentes');
  Promise.all(
    FACES.map(async ([file, weight]) => {
      const face = await new FontFace(FONT_FAMILY, `url(${staticFile(`fonts/${file}`)})`, { weight }).load();
      document.fonts.add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((err: unknown) => cancelRender(err));
}
