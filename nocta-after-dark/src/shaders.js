// GLSL ES 1.00 sources, shared by WebGL1 and WebGL2 contexts.
// The fluid passes reproduce the source pipeline 1:1:
//   BFECC advection -> radial force splat -> divergence -> 4x Poisson -> pressure projection.

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

// Full-frame quad. `position` is bound to attribute location 0 for every program.
export const QUAD_VERT = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// 1. BFECC advection: velocity_0 -> velocity_1, multiplied by dissipation (.96).
//    s0=uv; a=V(s0); s1=s0-a*dt*ratio; b=V(s1); s2=s1+b*dt*ratio; error=s2-s0;
//    s3=s0-error*.5; c=V(s3); s4=s3-c*dt*ratio; output=V(s4)*.96
export const ADVECTION_FRAG = `${PRECISION}
uniform sampler2D velocity;
uniform float dt;
uniform vec2 fboSize;
uniform float dissipation;
uniform bool isBFECC;
varying vec2 uv;
void main() {
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  if (isBFECC) {
    vec2 s0 = uv;
    vec2 a = texture2D(velocity, s0).xy;
    vec2 s1 = s0 - a * dt * ratio;          // backward trace
    vec2 b = texture2D(velocity, s1).xy;
    vec2 s2 = s1 + b * dt * ratio;          // forward trace
    vec2 error = s2 - s0;
    vec2 s3 = s0 - error * 0.5;             // correct source position by half the error
    vec2 c = texture2D(velocity, s3).xy;
    vec2 s4 = s3 - c * dt * ratio;          // backward trace again
    gl_FragColor = vec4(texture2D(velocity, s4).xy * dissipation, 0.0, 0.0);
  } else {
    vec2 vel = texture2D(velocity, uv).xy;
    gl_FragColor = vec4(texture2D(velocity, uv - vel * dt * ratio).xy * dissipation, 0.0, 0.0);
  }
}
`;

// 2. Force splat quad, positioned at the pointer with half-size cursor_size * cellScale.
export const FORCE_VERT = `
attribute vec2 position;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main() {
  vec2 pos = position * scale * px + center;
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

// Radial force shape (1 - min(length((uv - .5) * 2), 1))^2, added with ONE,ONE blending.
export const FORCE_FRAG = `${PRECISION}
uniform vec2 force;
varying vec2 vUv;
void main() {
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`;

// 3. Divergence at one cell: (right - left + up - down) / 2 / dt.
export const DIVERGENCE_FRAG = `${PRECISION}
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main() {
  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
  float divergence = (x1 - x0 + y1 - y0) / 2.0;
  gl_FragColor = vec4(divergence / dt);
}
`;

// 4. Poisson iteration, neighbours at +/-2 cells:
//    newP = (pRight + pLeft + pUp + pDown) / (4 + straightness) - divergence.
export const POISSON_FRAG = `${PRECISION}
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
uniform float straightness;
varying vec2 uv;
void main() {
  float pR = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float pL = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float pU = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float pD = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, uv).r;
  float newP = (pR + pL + pU + pD) / (4.0 + straightness) - div;
  gl_FragColor = vec4(newP);
}
`;

// 5. Pressure projection at +/-1 cell: velocity_0 = velocity_1 - gradP * dt.
export const PRESSURE_FRAG = `${PRECISION}
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main() {
  float pR = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
  float pL = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
  float pU = texture2D(pressure, uv + vec2(0.0, px.y)).r;
  float pD = texture2D(pressure, uv - vec2(0.0, px.y)).r;
  vec2 v = texture2D(velocity, uv).xy;
  vec2 gradP = vec2(pR - pL, pU - pD) * 0.5;
  v = v - gradP * dt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

// 6. Compositor. Two rigid, aspect-correct photo planes over a near-black studio backdrop.
//    The source output shader (color = mix(1, (v*.5+.5, 1), |v|)) is evaluated inline and
//    clamped to [0,1] exactly as an 8-bit render target would store it; reveal energy is
//    1 - color.r, softened with smoothstep(.085, .115).
//    Coordinates: vUv and all *Center uniforms are y-up (GL); uPointer is DOM y-down.
export const COMPOSITE_FRAG = `${PRECISION}
uniform sampler2D uVelocity;
uniform sampler2D uBlack;
uniform sampler2D uWhite;
uniform sampler2D uHalo;   // pre-blurred alpha of the black photo, same plane UVs
uniform vec2 uFrame;
uniform vec2 uBlackCenter;
uniform vec2 uBlackSize;
uniform vec2 uWhiteCenter;
uniform vec2 uWhiteSize;
uniform vec2 uProductCenter;
uniform vec2 uProductSize;
uniform vec2 uPointer;
uniform float uFullReveal;
uniform float uFluid;
uniform float uParallax;
uniform float uHaloRadius;
varying vec2 uv;

const float PI = 3.141592653589793;
const vec3 BASE = vec3(0.019608);            // #050505

// Rigid image plane: UV = ((subjectPx - planeCenterPx) / planeSizePx) + .5.
// The whole image spans [0,1] on its plane; 1px anti-aliased edge, nothing else.
vec2 planeUv(vec2 p, vec2 center, vec2 size) {
  return (p - center) / size + 0.5;
}

float planeEdge(vec2 puv, vec2 size) {
  vec2 e = clamp(min(puv, 1.0 - puv) * size + 0.5, 0.0, 1.0);
  return e.x * e.y;
}

vec4 samplePlane(sampler2D tex, vec2 puv, vec2 size) {
  return texture2D(tex, clamp(puv, 0.0, 1.0)) * planeEdge(puv, size);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Fluid reveal energy.
  vec2 vel = texture2D(uVelocity, uv).xy;
  float len = length(vel);
  vec3 fluidColor = clamp(mix(vec3(1.0), vec3(vel * 0.5 + 0.5, 1.0), len), 0.0, 1.0);
  float energy = 1.0 - fluidColor.r;
  float fluidMask = smoothstep(0.085, 0.115, energy) * uFluid;

  // Curved bottom-to-top wipe (wave evaluated in top-down coordinates).
  vec2 w = vec2(uv.x, 1.0 - uv.y);
  float wave = w.y + sin(w.x * PI) * sin(uFullReveal * PI) * 0.2;
  float fullMask = smoothstep(1.0 - uFullReveal - 0.018, 1.0 - uFullReveal + 0.018, wave);
  // Endpoint guard: exactly black at 0 and exactly white at 1 (the raw edge sits on the frame border).
  fullMask = mix(fullMask * smoothstep(0.0, 0.02, uFullReveal), 1.0, smoothstep(0.98, 1.0, uFullReveal));
  float mask = max(fluidMask, fullMask);

  // Uniform sub-pixel translation only: subjectPos = uv + (P - .5) * .008 * (1 - fullReveal).
  vec2 P = vec2(uPointer.x, 1.0 - uPointer.y);
  vec2 subjectUv = uv + (P - 0.5) * 0.008 * (1.0 - uFullReveal) * uParallax;
  vec2 sp = subjectUv * uFrame;
  vec2 fp = uv * uFrame;

  // Studio backdrop: graphite falloff behind the product and a soft floor highlight under the sole.
  vec2 d = (fp - uProductCenter) / (uProductSize * vec2(0.78, 1.45));
  vec3 bg = BASE + vec3(0.046, 0.050, 0.057) * exp(-dot(d, d) * 1.6);
  float soleY = uProductCenter.y - uProductSize.y * 0.5;
  vec2 f = vec2((fp.x - uProductCenter.x) / (uProductSize.x * 0.46),
                (fp.y - soleY) / (uProductSize.y * 0.06 + 2.0));
  bg += vec3(0.80, 0.82, 0.86) * 0.03 * exp(-dot(f, f));
  // The same reveal mask lifts the backdrop slightly.
  bg += vec3(0.050, 0.054, 0.060) * mask;

  vec2 bUv = planeUv(sp, uBlackCenter, uBlackSize);
  vec4 b = samplePlane(uBlack, bUv, uBlackSize);
  vec4 wt = samplePlane(uWhite, planeUv(sp, uWhiteCenter, uWhiteSize), uWhiteSize);

  // Restrained cool rim light so the black colourway separates from the backdrop:
  // a soft outer halo from the pre-blurred silhouette alpha plus a thin top-edge highlight.
  // Both are additive light; photo geometry is untouched.
  float halo = samplePlane(uHalo, bUv, uBlackSize).a * (1.0 - b.a);
  vec2 upUv = planeUv(sp + vec2(0.0, uHaloRadius * 0.3), uBlackCenter, uBlackSize);
  float rim = b.a * (1.0 - samplePlane(uBlack, upUv, uBlackSize).a);

  vec3 blackComp = b.rgb + bg * (1.0 - b.a);
  blackComp += vec3(0.56, 0.59, 0.64) * 0.17 * halo;
  blackComp += vec3(0.80, 0.82, 0.86) * 0.08 * rim;
  vec3 whiteComp = wt.rgb + bg * (1.0 - wt.a);

  vec3 color = mix(blackComp, whiteComp, mask);
  color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;   // dither the near-black gradients
  gl_FragColor = vec4(color, 1.0);
}
`;
