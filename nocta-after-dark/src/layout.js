// Rigid, aspect-correct placement of the two product photographs. Pure functions, no DOM.
//
// Each photo is an independent plane whose size is naturalWidth x naturalHeight times ONE
// uniform scale. Planes are fitted by their product bounding box (the opaque alpha bbox), so
// transparent padding in the PNGs does not shift or shrink the shoe:
//   - both product boxes get the same width, <= .86 * W (and a height cap so short frames fit);
//   - the white product box is centred at (.5 W, .54 H) (DOM, y-down);
//   - the black product box shares that centre x and the white sole line (box bottom), which is
//     the same as centring it at .54 H when both boxes have the same height.
// Optional per-photo `adjust` = { dx, dy, scale } nudges alignment with translation and uniform
// scale only (dx/dy are fractions of the product width).

export const PRODUCT_LAYOUT = Object.freeze({
  centerX: 0.5,
  centerY: 0.54,
  maxWidth: 0.86,
  maxHeight: 0.62,
});

const FULL_BOX = Object.freeze({ x0: 0, y0: 0, x1: 1, y1: 1 });

/** photo = { width, height, bbox?: {x0,y0,x1,y1} normalised y-down, adjust?: {dx,dy,scale} } */
function productBox(photo) {
  const b = photo.bbox ?? FULL_BOX;
  return {
    w: (b.x1 - b.x0) * photo.width,
    h: (b.y1 - b.y0) * photo.height,
    cx: (b.x0 + b.x1) / 2,
    cy: (b.y0 + b.y1) / 2,
  };
}

function placePlane(photo, box, productWidth, centerX, centerY, soleY) {
  const adjust = photo.adjust ?? {};
  const scale = (productWidth / box.w) * (adjust.scale ?? 1); // CSS px per image px, both axes
  const width = photo.width * scale;
  const height = photo.height * scale;
  const pw = box.w * scale;
  const ph = box.h * scale;
  const pcx = centerX + (adjust.dx ?? 0) * productWidth;
  const pcy = (soleY === null ? centerY : soleY - ph / 2) + (adjust.dy ?? 0) * productWidth;
  const left = pcx - box.cx * width;
  const top = pcy - box.cy * height;
  return {
    left,
    top,
    width,
    height,
    scale,
    centerX: left + width / 2,
    centerY: top + height / 2,
    product: { left: pcx - pw / 2, top: pcy - ph / 2, width: pw, height: ph },
  };
}

export function fitPlanes(frameWidth, frameHeight, white, black, layout = PRODUCT_LAYOUT) {
  const wb = productBox(white);
  const bb = productBox(black);
  const minAspect = Math.min(wb.w / wb.h, bb.w / bb.h);
  const productWidth = Math.max(
    1,
    Math.min(frameWidth * layout.maxWidth, frameHeight * layout.maxHeight * minAspect),
  );
  const cx = frameWidth * layout.centerX;
  const cy = frameHeight * layout.centerY;
  const whitePlane = placePlane(white, wb, productWidth, cx, cy, null);
  const sole = whitePlane.product.top + whitePlane.product.height;
  const blackPlane = placePlane(black, bb, productWidth, cx, cy, sole);
  return { productWidth, white: whitePlane, black: blackPlane, product: whitePlane.product };
}

/** Plane centre/size in GL pixel space (y-up) for the compositor. */
export function toGL(plane, frameHeight) {
  return {
    center: [plane.centerX, frameHeight - plane.centerY],
    size: [plane.width, plane.height],
  };
}

export function rectToGL(rect, frameHeight) {
  return {
    center: [rect.left + rect.width / 2, frameHeight - (rect.top + rect.height / 2)],
    size: [rect.width, rect.height],
  };
}
