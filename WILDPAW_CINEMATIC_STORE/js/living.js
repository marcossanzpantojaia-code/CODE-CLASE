/* WILDPAW — fotos vivas: la foto real se proyecta sobre su mapa de profundidad
   en WebGL y una cámara virtual gira levemente a su alrededor (ratón, scroll
   y una deriva lenta). Es un movimiento de cámara en 3D, no se deforma al
   animal. Si WebGL no está disponible, se queda la <img> normal. */
(function (W) {
  'use strict';

  var VERT = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }';
  var FRAG = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform sampler2D uImg, uDepth;',
    'uniform vec2 uCam;',          // desplazamiento de la cámara virtual
    'uniform float uZoom;',
    'void main(){',
    '  vec2 uv = (v - .5) / uZoom + .5;',
    '  float d = texture2D(uDepth, uv).r;',
    // Varias muestras a lo largo del rayo: evita "estirar" bordes cercanos
    '  vec2 o = uCam * (d - .45);',
    '  float d2 = texture2D(uDepth, uv + o).r;',
    '  o = uCam * (mix(d, d2, .5) - .45);',
    '  gl_FragColor = texture2D(uImg, uv + o);',
    '}'
  ].join('\n');

  var items = [];
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var running = false;
  var t0 = performance.now();

  function shader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function texture(gl, unit, img) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function create(canvas, src, opts) {
    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return Promise.resolve(null);
    return Promise.all([W.loadImage(src.color), W.loadImage(src.depth)]).then(function (imgs) {
      if (!imgs[0] || !imgs[1]) return null;
      try {
        var prog = gl.createProgram();
        gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        gl.useProgram(prog);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        texture(gl, 0, imgs[0]);
        texture(gl, 1, imgs[1]);
        gl.uniform1i(gl.getUniformLocation(prog, 'uImg'), 0);
        gl.uniform1i(gl.getUniformLocation(prog, 'uDepth'), 1);
      } catch (e) {
        return null; // p. ej. una imagen bloqueada: se queda la foto normal
      }
      return {
        canvas: canvas, gl: gl, opts: opts, active: false, scroll: 0,
        uCam: gl.getUniformLocation(prog, 'uCam'),
        uZoom: gl.getUniformLocation(prog, 'uZoom')
      };
    });
  }

  function resize(it) {
    var r = it.canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    if (it.canvas.width !== w || it.canvas.height !== h) {
      it.canvas.width = w; it.canvas.height = h;
      it.gl.viewport(0, 0, w, h);
    }
  }

  function draw(it, time) {
    var o = it.opts;
    // Deriva lenta (Lissajous) + ratón + scroll: el ángulo de cámara final
    var ix = Math.sin(time * .00031) * .55 + Math.sin(time * .00083) * .25;
    var iy = Math.cos(time * .00027) * .4;
    var cx = (pointer.x * .85 + ix * .45) * o.strength;
    var cy = (pointer.y * .7 + iy * .45 + it.scroll * o.scrollTilt) * o.strength;
    it.gl.uniform2f(it.uCam, -cx, -cy);
    it.gl.uniform1f(it.uZoom, o.zoom);
    it.gl.clearColor(0, 0, 0, 0);
    it.gl.clear(it.gl.COLOR_BUFFER_BIT);
    it.gl.drawArrays(it.gl.TRIANGLE_STRIP, 0, 4);
  }

  function frame(now) {
    pointer.x += (pointer.tx - pointer.x) * .06;
    pointer.y += (pointer.ty - pointer.y) * .06;
    var any = false;
    items.forEach(function (it) {
      if (!it.active) return;
      any = true;
      resize(it);
      draw(it, now - t0);
    });
    running = any;
    if (any) requestAnimationFrame(frame);
  }

  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

  W.Living = {
    /* Sustituye cada <img data-living-src> por su versión 3D cuando WebGL funciona */
    init: function () {
      if (W.motion.reduced || !W.livingPhotos) return Promise.resolve();
      window.addEventListener('pointermove', function (e) {
        pointer.tx = e.clientX / window.innerWidth * 2 - 1;
        pointer.ty = e.clientY / window.innerHeight * 2 - 1;
      }, { passive: true });
      var jobs = W.$$('[data-living]').map(function (canvas) {
        var key = canvas.getAttribute('data-living');
        var opts = {
          strength: parseFloat(canvas.getAttribute('data-living-strength')) || .035,
          zoom: parseFloat(canvas.getAttribute('data-living-zoom')) || 1,
          scrollTilt: parseFloat(canvas.getAttribute('data-living-scroll')) || .8
        };
        return create(canvas, W.livingPhotos[key], opts).then(function (it) {
          if (!it) return;
          it.key = key;
          items.push(it);
          canvas.classList.add('is-ready');
          var img = canvas.parentNode.querySelector('img');
          if (img) img.classList.add('is-living');
          it.active = true;
          resize(it);
          draw(it, 0);
          kick();
        });
      });
      return Promise.all(jobs);
    },
    /* Solo se dibuja lo que está en cámara */
    setActive: function (key, on) {
      items.forEach(function (it) { if (it.key === key && it.active !== on) { it.active = on; if (on) kick(); } });
    },
    /* -1…1: el scroll inclina la cámara (sensación de dolly) */
    setScroll: function (key, value) {
      items.forEach(function (it) { if (it.key === key) it.scroll = value; });
    }
  };
})(window.WILDPAW);
