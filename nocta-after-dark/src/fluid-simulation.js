import {
  ADVECTION_FRAG,
  DIVERGENCE_FRAG,
  FORCE_FRAG,
  FORCE_VERT,
  POISSON_FRAG,
  PRESSURE_FRAG,
  QUAD_VERT,
} from './shaders.js';
import { bindQuad, createProgram, createTarget } from './gl-utils.js';

/** Source simulation parameters. */
export const FLUID = Object.freeze({
  resolution: 0.1, // simulation size = round(frame CSS size * .1)
  stepHz: 60, // fixed 60 Hz stepping
  dt: 0.014,
  cellDivisor: 110, // px.x = 1/110, px.y = simW/simH/110
  BFECC: true,
  dissipation: 0.96,
  mouseForce: 50,
  cursorSize: 18,
  straightness: 1,
  isViscous: false,
  poissonIterations: 4,
});

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Multipass stable-fluids solver on ping-ponged float render targets:
 *   1. BFECC advection velocity_0 -> velocity_1 (x .96)
 *   2. radial force splat into velocity_1 (ONE, ONE)
 *   3. divergence(velocity_1)
 *   4. 4 Poisson iterations (pressure ping-pong, warm-started from the previous step)
 *   5. projection: velocity_0 = velocity_1 - gradP * dt
 * No pass ever samples the texture attached to the framebuffer it writes.
 */
export class FluidSimulation {
  constructor(res, format, quad) {
    this.res = res;
    this.gl = res.gl;
    this.format = format;
    this.quad = quad;
    this.width = 0;
    this.height = 0;
    this.px = [1 / FLUID.cellDivisor, 1 / FLUID.cellDivisor];
    this.targets = null;
    this.programs = {
      advection: createProgram(res, QUAD_VERT, ADVECTION_FRAG),
      force: createProgram(res, FORCE_VERT, FORCE_FRAG),
      divergence: createProgram(res, QUAD_VERT, DIVERGENCE_FRAG),
      poisson: createProgram(res, QUAD_VERT, POISSON_FRAG),
      pressure: createProgram(res, QUAD_VERT, PRESSURE_FRAG),
    };
  }

  /** Recreates the zero-initialised buffers when the simulation size changes. */
  resize(width, height) {
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    if (width === this.width && height === this.height && this.targets) return false;
    this.#releaseTargets();
    this.width = width;
    this.height = height;
    this.px = [1 / FLUID.cellDivisor, width / height / FLUID.cellDivisor];
    const make = () => createTarget(this.res, this.format, width, height);
    this.targets = {
      velocity0: make(),
      velocity1: make(),
      divergence: make(),
      pressure0: make(),
      pressure1: make(),
    };
    return true;
  }

  get velocityTexture() {
    return this.targets.velocity0.texture;
  }

  clear() {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    for (const t of Object.values(this.targets)) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * One fixed step. `force` is null or { x, y, fx, fy } with the pointer in clip coordinates
   * and fx/fy = (current - previous clip coords) / 2 * mouse_force.
   */
  step(force) {
    const gl = this.gl;
    const t = this.targets;
    const [pxX, pxY] = this.px;
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, this.width, this.height);
    bindQuad(gl, this.quad);

    // 1. BFECC advection.
    this.#pass(this.programs.advection, t.velocity1, { velocity: t.velocity0 }, (p) => {
      gl.uniform1f(p.loc('dt'), FLUID.dt);
      gl.uniform2f(p.loc('fboSize'), this.width, this.height);
      gl.uniform1f(p.loc('dissipation'), FLUID.dissipation);
      gl.uniform1i(p.loc('isBFECC'), FLUID.BFECC ? 1 : 0);
    });

    // 2. External force, additive.
    if (force) {
      const sizeX = FLUID.cursorSize * pxX;
      const sizeY = FLUID.cursorSize * pxY;
      const cx = clamp(force.x, -1 + sizeX + pxX * 2, 1 - sizeX - pxX * 2);
      const cy = clamp(force.y, -1 + sizeY + pxY * 2, 1 - sizeY - pxY * 2);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      this.#pass(this.programs.force, t.velocity1, {}, (p) => {
        gl.uniform2f(p.loc('force'), force.fx, force.fy);
        gl.uniform2f(p.loc('center'), cx, cy);
        gl.uniform2f(p.loc('scale'), FLUID.cursorSize, FLUID.cursorSize);
        gl.uniform2f(p.loc('px'), pxX, pxY);
      });
      gl.disable(gl.BLEND);
    }

    // 3. Divergence.
    this.#pass(this.programs.divergence, t.divergence, { velocity: t.velocity1 }, (p) => {
      gl.uniform1f(p.loc('dt'), FLUID.dt);
      gl.uniform2f(p.loc('px'), pxX, pxY);
    });

    // 4. Poisson iterations.
    let pressureOut = t.pressure0;
    for (let i = 0; i < FLUID.poissonIterations; i++) {
      const pressureIn = i % 2 === 0 ? t.pressure0 : t.pressure1;
      pressureOut = i % 2 === 0 ? t.pressure1 : t.pressure0;
      this.#pass(this.programs.poisson, pressureOut, { pressure: pressureIn, divergence: t.divergence }, (p) => {
        gl.uniform2f(p.loc('px'), pxX, pxY);
        gl.uniform1f(p.loc('straightness'), FLUID.straightness);
      });
    }

    // 5. Pressure projection back into velocity_0.
    this.#pass(this.programs.pressure, t.velocity0, { pressure: pressureOut, velocity: t.velocity1 }, (p) => {
      gl.uniform2f(p.loc('px'), pxX, pxY);
      gl.uniform1f(p.loc('dt'), FLUID.dt);
    });
  }

  /** Debug/test only: velocity_0 as Float32 RGBA, rows bottom-up. */
  readVelocity() {
    const gl = this.gl;
    const { width, height, fbo } = this.targets.velocity0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    let data = new Float32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
    if (gl.getError() !== gl.NO_ERROR) data = null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return data ? { width, height, data } : null;
  }

  dispose() {
    this.#releaseTargets();
    for (const p of Object.values(this.programs)) this.res.release(p.program);
    this.programs = null;
  }

  #pass(program, target, textures, setUniforms) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.useProgram(program.program);
    let unit = 0;
    for (const [name, source] of Object.entries(textures)) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      gl.uniform1i(program.loc(name), unit);
      unit++;
    }
    setUniforms(program);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  #releaseTargets() {
    if (!this.targets) return;
    for (const t of Object.values(this.targets)) {
      this.res.release(t.fbo);
      this.res.release(t.texture);
    }
    this.targets = null;
  }
}
