// Small raw-WebGL helpers. Every GL object goes through GLResources so the component can
// dispose everything it created (and tests can assert that nothing leaks).

export class GLResources {
  constructor(gl) {
    this.gl = gl;
    this.live = new Map();
  }

  texture() {
    return this.#track(this.gl.createTexture(), 'texture');
  }

  framebuffer() {
    return this.#track(this.gl.createFramebuffer(), 'framebuffer');
  }

  buffer() {
    return this.#track(this.gl.createBuffer(), 'buffer');
  }

  program() {
    return this.#track(this.gl.createProgram(), 'program');
  }

  release(obj) {
    const kind = this.live.get(obj);
    if (!kind) return;
    this.live.delete(obj);
    const gl = this.gl;
    if (gl.isContextLost()) return;
    if (kind === 'texture') gl.deleteTexture(obj);
    else if (kind === 'framebuffer') gl.deleteFramebuffer(obj);
    else if (kind === 'buffer') gl.deleteBuffer(obj);
    else if (kind === 'program') gl.deleteProgram(obj);
  }

  releaseAll() {
    for (const obj of [...this.live.keys()]) this.release(obj);
  }

  /** Forget objects without deleting them (they died with a lost context). */
  forgetAll() {
    this.live.clear();
  }

  get count() {
    return this.live.size;
  }

  #track(obj, kind) {
    if (!obj) throw new Error(`WebGL could not create a ${kind}`);
    this.live.set(obj, kind);
    return obj;
  }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

/** Links a program with `position` fixed at attribute location 0. */
export function createProgram(res, vertexSource, fragmentSource) {
  const gl = res.gl;
  const program = res.program();
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  gl.detachShader(program, vs);
  gl.detachShader(program, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(program);
    res.release(program);
    throw new Error(`Program link failed: ${log}`);
  }
  const locations = new Map();
  return {
    program,
    loc(name) {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      return locations.get(name);
    },
  };
}

/** One clip-space quad (triangle strip) shared by every pass. */
export function createQuad(res) {
  const gl = res.gl;
  const buffer = res.buffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  return buffer;
}

export function bindQuad(gl, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

function isRenderable(gl, fmt) {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internalFormat, 4, 4, 0, fmt.format, fmt.type, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  return ok;
}

/**
 * Renderable, linearly filterable, blendable floating-point RGBA format, or null.
 * Half float is preferred: it is filterable and blendable everywhere it is renderable
 * (32-bit float blending would additionally need EXT_float_blend).
 */
export function getFloatFormat(gl, isWebGL2) {
  if (isWebGL2) {
    const ok = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
    if (!ok) return null;
    const fmt = { internalFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT, label: 'RGBA16F' };
    return isRenderable(gl, fmt) ? fmt : null;
  }
  const half = gl.getExtension('OES_texture_half_float');
  const halfLinear = gl.getExtension('OES_texture_half_float_linear');
  gl.getExtension('EXT_color_buffer_half_float');
  if (half && halfLinear) {
    const fmt = { internalFormat: gl.RGBA, format: gl.RGBA, type: half.HALF_FLOAT_OES, label: 'RGBA half (WebGL1)' };
    if (isRenderable(gl, fmt)) return fmt;
  }
  const full = gl.getExtension('OES_texture_float');
  const fullLinear = gl.getExtension('OES_texture_float_linear');
  const fullBlend = gl.getExtension('EXT_float_blend');
  gl.getExtension('WEBGL_color_buffer_float');
  if (full && fullLinear && fullBlend) {
    const fmt = { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.FLOAT, label: 'RGBA float (WebGL1)' };
    if (isRenderable(gl, fmt)) return fmt;
  }
  return null;
}

/** Float render target, zero-initialised, CLAMP_TO_EDGE + LINEAR. */
export function createTarget(res, fmt, width, height) {
  const gl = res.gl;
  const texture = res.texture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internalFormat, width, height, 0, fmt.format, fmt.type, null);
  const fbo = res.framebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Float framebuffer is incomplete');
  }
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { texture, fbo, width, height };
}

const isPowerOfTwo = (n) => (n & (n - 1)) === 0;

/** Single-channel ALPHA texture from { data: Uint8Array, width, height } (rows top-down), or 1x1 zero. */
export function createAlphaTexture(res, map) {
  const gl = res.gl;
  const width = map?.width ?? 1;
  const height = map?.height ?? 1;
  const data = map?.data ?? new Uint8Array(1);
  const texture = res.texture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, width, height, 0, gl.ALPHA, gl.UNSIGNED_BYTE, data);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

/**
 * Uploads a photograph as a premultiplied, y-flipped texture. The texture always spans the
 * whole image; geometry is taken from naturalWidth/naturalHeight, never from the texture.
 */
export function createImageTexture(res, image, isWebGL2) {
  const gl = res.gl;
  const maxSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096);
  const nw = image.naturalWidth;
  const nh = image.naturalHeight;
  let source = image;
  if (Math.max(nw, nh) > maxSize) {
    const s = maxSize / Math.max(nw, nh);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(nw * s));
    canvas.height = Math.max(1, Math.round(nh * s));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    source = canvas;
  }
  const texture = res.texture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const w = source === image ? nw : source.width;
  const h = source === image ? nh : source.height;
  if (isWebGL2 || (isPowerOfTwo(w) && isPowerOfTwo(h))) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}
