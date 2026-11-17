/* WILDPAW — marionetas fotográficas.
   Cada animal es una foto fija. Para que corra, ande o mueva la cola sin
   inventar píxeles, la foto se pega sobre una malla fina y un esqueleto 2D
   (cadera, rodilla, pata, cola, cuello, orejas) la deforma, como la
   herramienta "marioneta" de After Effects, pero en WebGL y en tiempo real:
     · ciclo de paso con apoyo y vuelo (la pata apoyada barre hacia atrás a
       velocidad constante; la que vuela se recoge y adelanta);
     · bote del cuerpo, balanceo de caderas y cabeza que compensa el bote;
     · cola con una onda que viaja de la base a la punta;
     · orejas y lengua con muelles que reaccionan a la aceleración del cuerpo;
     · respiración y gestos sueltos (orejas que se sacuden, miradas).
   La malla y los pesos salen de tools/build-rigs.py (js/data/rigs.js).
   Sin WebGL o con movimiento reducido se ven las fotos tal cual. */
(function (W) {
  'use strict';

  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  var MARGIN0 = 0.16;         // el lienzo sobresale de la foto: la cola y las patas salen de su caja
  var actors = [];
  var ticking = false, last = 0;
  var castData = null;
  var LITE = false;           // WebGL por software (equipo sin aceleración gráfica): menos píxeles

  /* ------------------------------------------------------------ utilidades */
  function decode(s, T) {
    var bin = atob(s), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return new T(u.buffer);
  }
  function sm(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function frac(x) { return x - Math.floor(x); }
  // Ángulo de una pata a lo largo del ciclo: −1 adelante … +1 atrás.
  // Apoyo [0, D): barre hacia atrás a velocidad constante; vuelo [D, 1): vuelve suave.
  function swing(p, D) {
    p = frac(p);
    return p < D ? -1 + 2 * p / D : 1 - 2 * sm((p - D) / (1 - D));
  }
  // Cuánto se levanta la pata: 0 apoyada, 1 en mitad del vuelo
  function lift(p, D) {
    p = frac(p);
    return p < D ? 0 : Math.sin(Math.PI * (p - D) / (1 - D));
  }
  // Muelle amortiguado (PHYS-001), integrado en subpasos de 1/120 s para que
  // no dependa de la frecuencia de la pantalla
  function Spring(k, c) { this.x = 0; this.v = 0; this.k = k; this.c = c; }
  Spring.prototype.step = function (target, force, dt) {
    var n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for (var i = 0; i < n; i++) {
      this.v += (-this.k * (this.x - target) - this.c * this.v + force) * h;
      this.x += this.v * h;
    }
    return this.x;
  };

  /* ------------------------------------------------- dirección de movimiento
     legs: { hueso: [fase de la foto en el ciclo, intensidad, signo] }.
     Fase 0 = la pata acaba de apoyar delante; duty = final del apoyo. */
  var MOTION = {
    'dog-run': {
      kind: 'lift', hz: 2.1, duty: .42, lift: .042, liftRot: 4,
      legs: { legFR: [.2, 1, 1], legFM: [.7, .75, -1], legRL: [.78, .6, 1], legRM: [.25, .6, -1] },
      bob: .015, bobN: 1, bobPh: .2, roll: 1.3,
      head: { counter: .7, nod: 1.6 },
      tail: { A: 9, hz: 2.1, k: .9, idle: .5 },
      springs: { earL: [1, 900], earR: [-1, 900], tongue: [1, 520] },
      breath: .006
    },
    'dog-back': {
      kind: 'lift', hz: 1.6, duty: .58, lift: .018, liftRot: 2.5,
      legs: { legRA: [.8, 1, -1], legRB: [.3, 1, 1], legF: [.85, .8, -1] },
      bob: .009, bobN: 2, bobPh: 0, roll: 2.2,
      head: { counter: .55, nod: 1.2, look: 2.2 },
      tail: { A: 12, hz: 2.5, k: .85, idle: 1 },
      springs: { tongue: [1, 700] },
      breath: .006
    },
    'cat-back': {
      kind: 'lift', hz: 1.25, duty: .62, lift: .026, liftRot: 3,
      legs: { legRA: [.3, 1, 1], legRB: [.8, 1, -1], legF: [.82, .9, -1] },
      bob: .006, bobN: 2, bobPh: 0, roll: 1.5,
      head: { counter: .5, nod: .8, look: 3.2 },
      tail: { A: 6, hz: .42, k: .7, idle: 1 },
      springs: { earA: [1, 600], earB: [-1, 600] }, flick: ['earA', 'earB'],
      breath: .007
    },
    'cat-leap': {
      kind: 'leap', hz: 1,
      tail: { A: 4, hz: .9, k: .8, idle: 1 },
      springs: { earL: [1, 0], earR: [-1, 0], tail0: [1, 0] },
      breath: .004
    },
    'dog-walk': {
      kind: 'side', hz: 1.8, duty: .6, A: 13, flex: 34, margin: .07,
      legs: { legFF: [0, 1, 1], legRF: [.08, 1, -1], legFB: [.5, 1, 1], legRB: [.62, 1, -1] },
      bob: .008, bobN: 2, bobPh: .1, roll: 0, pitch: .7,
      head: { counter: .6, nod: 2.2 },
      tail: { A: 8, hz: 1.8, k: .9, idle: .7 },
      springs: { ear: [1, 1400] },
      breath: .005
    },
    'cat-walk': {
      kind: 'side', hz: 1.4, duty: .64, A: 12, flex: 30, margin: .07,
      legs: { legFF: [0, 1, 1], legRF: [.1, 1, -1], legFB: [.45, 1, 1], legRB: [.64, 1, -1] },
      bob: .006, bobN: 2, bobPh: .1, roll: 0, pitch: .5,
      head: { counter: .7, nod: 1.4 },
      tail: { A: 5, hz: .6, k: .75, idle: 1 },
      springs: { earA: [1, 900], earB: [1, 900] }, flick: ['earA'],
      breath: .006
    }
  };

  /* ---------------------------------------------------------------- shaders */
  var VS = 'attribute vec2 aPos;attribute vec2 aUv;uniform vec4 uView;varying vec2 vUv;' +
    'void main(){vUv=aUv;gl_Position=vec4((aPos.x+uView.x)*uView.z-1.0,1.0-(aPos.y+uView.y)*uView.w,0.0,1.0);}';
  // Mismo resultado que las tres capas del DOM (b2 debajo, b1, nítida encima)
  var FS = 'precision mediump float;uniform sampler2D uS;uniform sampler2D uB1;uniform sampler2D uB2;uniform vec3 uO;uniform float uBlur;varying vec2 vUv;' +
    'void main(){vec4 cs=texture2D(uS,vUv)*uO.x;if(uBlur<0.5){gl_FragColor=cs;return;}' +
    'vec4 c1=texture2D(uB1,vUv)*uO.y;vec4 c2=texture2D(uB2,vUv)*uO.z;' +
    'vec4 c=c1+c2*(1.0-c1.a);gl_FragColor=cs+c*(1.0-cs.a);}';

  function compile(gl) {
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  /* --------------------------------------------- texturas (y plan B en file://) */
  function loadCastData() {
    if (window.WILDPAW_CAST) return Promise.resolve(window.WILDPAW_CAST);
    if (!castData) {
      castData = new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = 'js/data/cast-data.js';
        s.onload = function () { resolve(window.WILDPAW_CAST || null); };
        s.onerror = function () { resolve(null); };
        document.head.appendChild(s);
      });
    }
    return castData;
  }
  function ready(img) {
    if (img.complete && img.naturalWidth) return img.decode ? img.decode().then(function () { return img; }, function () { return img; }) : Promise.resolve(img);
    return new Promise(function (r) { img.addEventListener('load', function () { r(img); }, { once: true }); img.addEventListener('error', function () { r(null); }, { once: true }); });
  }
  function upload(gl, tex, img, mip) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);   // SecurityError si la imagen viene de file://
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  }

  /* --------------------------------------------------------------- un actor */
  function Actor(o) {
    var R = W.rigs[o.pose];
    this.pose = o.pose; this.R = R; this.m = MOTION[o.pose];
    this.margin = this.m.margin || MARGIN0; this.blur = 0;
    this.host = o.host; this.watch = o.watch || o.host; this.shadow = o.shadow || null;
    this.layers = o.layers;           // elementos cuya opacidad decide nítida / b1 / b2
    this.p = { gait: o.gait == null ? 1 : o.gait, speed: 1, boost: 0, extend: 0, phase: null, on: true };
    this.t = Math.random() * 20; this.phase = 0; this.boost = 0; this.prevExtend = 0; this.rate = 0; this.lastPhase = null;
    this.flickAt = 2 + Math.random() * 3;
    var w = R.w, h = R.h, cell = R.cell;
    var v = decode(R.v, Uint16Array), nv = R.nv;
    this.rest = new Float32Array(nv * 2); this.pos = new Float32Array(nv * 2);
    var uv = new Float32Array(nv * 2);
    for (var i = 0; i < nv; i++) {
      var x = Math.min(v[2 * i] * cell, w), y = Math.min(v[2 * i + 1] * cell, h);
      this.rest[2 * i] = x; this.rest[2 * i + 1] = y;
      uv[2 * i] = x / w; uv[2 * i + 1] = y / h;
    }
    this.uv = uv;
    this.bi = decode(R.bi, Uint8Array);
    var bw = decode(R.bw, Uint8Array);
    this.bw = new Float32Array(bw.length);
    for (var j = 0; j < bw.length; j++) this.bw[j] = bw[j] / 255;
    this.tris = decode(R.t, Uint16Array);
    this.bones = R.bones.map(function (b) { return { n: b.n, px: b.p[0], py: b.p[1], qx: b.q ? b.q[0] : 0, qy: b.q ? b.q[1] : 0, parent: b.parent, r: 0, x: 0, y: 0, sx: 1, sy: 1 }; });
    this.by = {};
    for (var k = 0; k < this.bones.length; k++) this.by[this.bones[k].n] = this.bones[k];
    this.M = new Float32Array(this.bones.length * 6);
    this.springs = {};
    var sp = this.m.springs || {};
    for (var s in sp) this.springs[s] = new Spring(o.pose === 'cat-leap' ? 60 : 120, o.pose === 'cat-leap' ? 5 : 7);
    this.rootY = 0;
    if (this.m.kind === 'side') this.calibrate();
  }

  /* Paso sin patinar: cada pata apoyada debe barrer la MISMA distancia
     horizontal, aunque sea más larga o esté más inclinada. Se busca el ángulo
     de cada pata (bisección) para que su barrido iguale al de la delantera. */
  Actor.prototype.calibrate = function () {
    var m = this.m, self = this;
    function sweep(name, A) {
      var up = self.by[name + '0'], lo = self.by[name + '1'];
      var dx = lo.qx - up.px, dy = lo.qy - up.py, L = Math.hypot(dx, dy), phi = Math.atan2(dx, dy);
      var s0 = swing(m.legs[name][0], m.duty), a = A * DEG;
      return L * (Math.sin(phi + a * (1 + s0)) - Math.sin(phi - a * (1 - s0)));
    }
    var ref = sweep('legFB', m.A);
    this.legA = {};
    for (var name in m.legs) {
      var lo = 1, hi = 40;
      for (var i = 0; i < 40; i++) { var mid = (lo + hi) / 2; if (sweep(name, mid) < ref) lo = mid; else hi = mid; }
      this.legA[name] = (lo + hi) / 2;
    }
    this.sweepRef = ref;
  };

  Actor.prototype.init = function () {
    var self = this, R = this.R;
    var c = document.createElement('canvas');
    c.className = 'rig';
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;left:' + (-this.margin * 100) + '%;top:' + (-this.margin * 100) + '%;width:' + ((1 + 2 * this.margin) * 100) + '%;height:' + ((1 + 2 * this.margin) * 100) + '%;max-width:none;pointer-events:none';
    var opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
    var gl = c.getContext('webgl2', opts), gl2 = !!gl;
    if (!gl) gl = c.getContext('webgl', opts) || c.getContext('experimental-webgl', opts);
    if (!gl) return Promise.resolve(null);
    this.canvas = c; this.gl = gl; this.gl2 = gl2;
    var prog = compile(gl);
    gl.useProgram(prog);
    this.uView = gl.getUniformLocation(prog, 'uView');
    this.uO = gl.getUniformLocation(prog, 'uO');
    this.uBlur = gl.getUniformLocation(prog, 'uBlur');
    gl.uniform1i(gl.getUniformLocation(prog, 'uS'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'uB1'), 1);
    gl.uniform1i(gl.getUniformLocation(prog, 'uB2'), 2);
    gl.uniform4f(this.uView, this.margin * R.w, this.margin * R.h, 2 / ((1 + 2 * this.margin) * R.w), 2 / ((1 + 2 * this.margin) * R.h));
    this.posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.pos.byteLength, gl.DYNAMIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    var uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.uv, gl.STATIC_DRAW);
    var aUv = gl.getAttribLocation(prog, 'aUv');
    gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.tris, gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var L = this.layers;
    // La opacidad de cada capa decide la mezcla nítida / b1 / b2: se copia al
    // estilo en línea para leerla sin recalcular estilos en cada fotograma
    [L.s, L.b1, L.b2].forEach(function (el) { if (el && el.style.opacity === '') el.style.opacity = getComputedStyle(el).opacity; });
    var srcs = [L.s, L.b1 || L.s, L.b2 || L.s];
    this.tex = srcs.map(function () { return gl.createTexture(); });
    function put(imgs) {
      imgs.forEach(function (img, i) {
        gl.activeTexture(gl.TEXTURE0 + i);
        upload(gl, self.tex[i], img, gl2);
      });
    }
    return Promise.all(srcs.map(ready)).then(function (imgs) {
      if (imgs.some(function (i) { return !i; })) return null;
      try { put(imgs); return self; }
      catch (e) {
        // file://: el navegador no deja leer la imagen desde WebGL; se usan las incrustadas
        return loadCastData().then(function (data) {
          if (!data) return null;
          var keys = [self.pose, self.pose + '-b1', self.pose + '-b2'];
          return Promise.all(keys.map(function (k, i) {
            var im = new Image();
            im.src = data[k] || data[self.pose];
            return ready(im);
          })).then(function (alt) {
            try { put(alt); return self; } catch (e2) { return null; }
          });
        });
      }
    }).then(function (ok) {
      if (!ok) return null;
      self.host.appendChild(c);
      self.host.classList.add('is-rigged');
      // La sombra de la foto tiene una mancha bajo cada pata; con las patas en
      // movimiento se usa una sombra suave que no delata dónde estaban
      if (self.shadow && self.shadow.getAttribute('data-soft')) self.shadow.src = self.shadow.getAttribute('data-soft');
      gl.activeTexture(gl.TEXTURE0);
      self.fit(true);
      self.frame(0);
      return self;
    });
  };

  /* Resolución del lienzo según el tamaño con el que se ve (escala de la cámara
     incluida), sin pasar de la de la foto: de lejos el GPU reduce con mipmaps */
  Actor.prototype.fit = function (force) {
    var hostH = this.host.offsetHeight;
    if (!hostH) return;
    var shown = this.host.getBoundingClientRect().height / hostH;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var full = (1 + 2 * this.margin);
    var maxH = Math.min(this.R.h * full, 2400);
    // Desenfocada no necesita tanta definición: hasta un 55 % menos de píxeles
    var want = Math.max(48, Math.min(maxH, hostH * full * shown * dpr) * (1 - .45 * this.blur) * (LITE ? .66 : 1));
    var cur = this.canvas.height;
    if (!force && cur && want / cur < 1.3 && want / cur > .72 && !(want >= maxH && cur < maxH * .95)) return;
    var H = Math.round(want), Wd = Math.round(H * this.R.w / this.R.h);
    this.canvas.width = Wd; this.canvas.height = H;
    this.gl.viewport(0, 0, Wd, H);
  };

  Actor.prototype.visible = function () {
    var s = this.watch.style;
    return this.p.on && s.visibility !== 'hidden' && s.opacity !== '0' && this.host.offsetParent !== null;
  };

  /* --------------------------------------------------------- un fotograma */
  Actor.prototype.frame = function (dt) {
    this.t += dt;
    this.animate(dt);
    this.solve();
    this.draw();
  };

  Actor.prototype.reset = function () {
    for (var i = 0; i < this.bones.length; i++) { var b = this.bones[i]; b.r = 0; b.x = 0; b.y = 0; b.sx = 1; b.sy = 1; }
  };
  Actor.prototype.rot = function (name, deg) { var b = this.by[name]; if (b) b.r += deg * DEG; };
  Actor.prototype.off = function (name, x, y) { var b = this.by[name]; if (b) { b.x += x; b.y += y; } };

  Actor.prototype.animate = function (dt) {
    var m = this.m, P = this.p, H = this.R.h, t = this.t, self = this;
    this.reset();
    var g = Math.max(0, P.gait);
    this.boost += (P.boost - this.boost) * Math.min(1, dt * 4);
    P.boost *= Math.pow(.04, dt);       // sin scroll, el impulso se apaga en ~1 s
    var hz = m.hz * P.speed * (1 + .55 * this.boost);
    if (P.phase != null) this.phase = P.phase; else this.phase += dt * hz * (g > .001 ? 1 : 0);
    var ph = this.phase, D = m.duty;

    // Cuerpo: bote (relativo a la foto: en la fase 0 la pose es la original)
    var bobN = m.bobN || 1, bobPh = m.bobPh || 0;
    var th = TAU * (bobN * ph + bobPh), th0 = TAU * bobPh;
    var amp = g * (m.bob || 0) * H;
    var rootY = -amp * ((.5 - .5 * Math.cos(th)) - (.5 - .5 * Math.cos(th0)));
    // Aceleración vertical del cuerpo (alturas por s²): empuja orejas y lengua.
    // Con la fase marcada desde fuera (scroll), la cadencia se deduce de su avance.
    if (P.phase != null && dt > 0) {
      var rate = Math.abs(P.phase - (this.lastPhase == null ? P.phase : this.lastPhase)) / dt;
      this.rate += (Math.min(rate, 4) - this.rate) * Math.min(1, dt * 6);
      hz = this.rate;
    }
    this.lastPhase = P.phase;
    var w2 = TAU * bobN * hz;
    var accY = -amp * .5 * w2 * w2 * Math.cos(th) / H;
    var breath = Math.sin(TAU * .3 * t) * (m.breath || 0);
    var root = this.bones[0];
    root.y = rootY; root.sy = 1 + breath; root.sx = 1 - .4 * breath;
    root.r = g * ((m.roll || 0) * Math.sin(TAU * ph) + (m.pitch || 0) * Math.sin(TAU * 2 * ph + .7)) * DEG;
    // El balanceo gira alrededor del suelo, no del centro del tronco: así las
    // patas apoyadas no se arrastran
    var gx = 0, gy = .9 * H - root.py, cr = Math.cos(root.r), sr = Math.sin(root.r);
    root.x -= (cr - 1) * gx - sr * gy;
    root.y -= sr * gx + (cr - 1) * gy;
    this.rootY = rootY;

    // Patas
    var legs = m.legs || {};
    for (var name in legs) {
      var L = legs[name], p0 = L[0], k = L[1] * g, sg = L[2];
      var p = ph + p0;
      if (m.kind === 'side') {
        this.rot(name + '0', k * this.legA[name] * (swing(p, D) - swing(p0, D)));
        this.rot(name + '1', k * sg * m.flex * (lift(p, D) - lift(p0, D)));
      } else if (m.kind === 'lift') {
        var dl = lift(p, D) - lift(p0, D);
        if (dl < 0) dl *= .6;                        // una pata ya levantada en la foto baja poco
        this.off(name + '0', 0, -dl * m.lift * H * k);
        this.rot(name + '0', dl * m.liftRot * sg * k);
        this.rot(name + '1', dl * 6 * sg * k);
      }
    }

    // Cabeza: compensa el bote (los animales estabilizan la mirada) y asiente
    if (m.head) {
      this.off('head0', 0, -m.head.counter * rootY);
      this.rot('head0', g * m.head.nod * Math.sin(th + 1.2));
      if (m.head.look) this.rot('head0', m.head.look * (1 - .6 * g) * (Math.sin(TAU * .11 * t) + .5 * Math.sin(TAU * .27 * t + 1)));
    }

    // Cola: onda que viaja de la base a la punta (cada hueso se retrasa respecto al anterior)
    if (m.tail) {
      var T = m.tail, ta = T.A * (T.idle + (1 - T.idle) * g);
      for (var i = 0; i < 6; i++) {
        var bn = 'tail' + i;
        if (!this.by[bn]) break;
        this.rot(bn, ta * (i === 0 ? .55 : 1) * Math.sin(TAU * T.hz * t * (1 + .3 * this.boost) - i * T.k));
      }
    }

    // Salto del gato: patas que se estiran, orejas atrás, la cola se queda atrás
    if (m.kind === 'leap') {
      var e = P.extend, de = dt > 0 ? (e - this.prevExtend) / dt : 0;
      this.prevExtend = e;
      this.off('legFA0', 0, e * .018 * H);
      this.rot('legFA1', -e * 7);
      this.rot('legFB0', -e * 7); this.rot('legFB1', -e * 6);
      this.rot('legR0', e * 5);
      this.rot('head0', e * 2.5);
      var sT = this.springs.tail0.step(-e * 16, -de * 60, dt);
      this.rot('tail0', sT); this.rot('tail1', sT * .6);
      this.rot('earL', this.springs.earL.step(-e * 13, 0, dt));
      this.rot('earR', this.springs.earR.step(e * 13, 0, dt));
      return;
    }

    // Orejas y lengua: muelles empujados por la aceleración vertical del cuerpo
    var sp = m.springs || {};
    if (m.flick && t > this.flickAt) {
      var who = m.flick[Math.floor(Math.random() * m.flick.length)];
      if (this.springs[who]) this.springs[who].v += (Math.random() < .5 ? -1 : 1) * (380 + Math.random() * 220);
      this.flickAt = t + 2.2 + Math.random() * 4;
    }
    for (var s in sp) {
      var val = this.springs[s].step(0, sp[s][0] * sp[s][1] * accY, dt);
      this.rot(s, val);
    }
  };

  /* Matrices de cada hueso (afines 2D) y piel: cada vértice es la media de
     las posiciones que le darían sus huesos (hasta 4), según sus pesos */
  Actor.prototype.solve = function () {
    var B = this.bones, M = this.M, nb = B.length;
    for (var i = 0; i < nb; i++) {
      var b = B[i], c = Math.cos(b.r), s = Math.sin(b.r);
      var a = c * b.sx, bb = s * b.sx, cc = -s * b.sy, d = c * b.sy;
      var e = b.px + b.x - (a * b.px + cc * b.py), f = b.py + b.y - (bb * b.px + d * b.py);
      var o = i * 6;
      if (b.parent < 0) { M[o] = a; M[o + 1] = bb; M[o + 2] = cc; M[o + 3] = d; M[o + 4] = e; M[o + 5] = f; }
      else {
        var q = b.parent * 6, pa = M[q], pb = M[q + 1], pc = M[q + 2], pd = M[q + 3], pe = M[q + 4], pf = M[q + 5];
        M[o] = pa * a + pc * bb; M[o + 1] = pb * a + pd * bb;
        M[o + 2] = pa * cc + pc * d; M[o + 3] = pb * cc + pd * d;
        M[o + 4] = pa * e + pc * f + pe; M[o + 5] = pb * e + pd * f + pf;
      }
    }
    var rest = this.rest, pos = this.pos, bi = this.bi, bw = this.bw, n = rest.length / 2;
    for (var v = 0; v < n; v++) {
      var x = rest[2 * v], y = rest[2 * v + 1], X = 0, Y = 0;
      for (var k = 0; k < 4; k++) {
        var w = bw[4 * v + k];
        if (w === 0) continue;
        var m6 = bi[4 * v + k] * 6;
        X += w * (M[m6] * x + M[m6 + 2] * y + M[m6 + 4]);
        Y += w * (M[m6 + 1] * x + M[m6 + 3] * y + M[m6 + 5]);
      }
      pos[2 * v] = X; pos[2 * v + 1] = Y;
    }
  };

  function op(el) {
    if (!el) return 0;
    var o = el.style.opacity;
    return o === '' ? 1 : +o;
  }

  Actor.prototype.draw = function () {
    var gl = this.gl, L = this.layers;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.pos);
    var ob1 = L.b1 ? op(L.b1) : 0, ob2 = L.b2 ? op(L.b2) : 0;
    gl.uniform3f(this.uO, op(L.s), ob1, ob2);
    gl.uniform1f(this.uBlur, ob1 + ob2 > .001 ? 1 : 0);
    this.blur = Math.min(1, ob1 + ob2);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Los triángulos que cruzan huecos entre patas solo se dibujan con la foto
    // desenfocada: nítidos se estirarían; borrosos, su falta dejaría agujeros
    var n = (ob1 + ob2 > .01 ? (this.R.ntAll || this.R.nt) : this.R.nt) * 3;
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
    // La sombra se encoge y se aclara un poco cuando el cuerpo sube
    if (this.shadow) {
      var up = Math.max(-.05, -this.rootY / this.R.h);
      var k = 1 - up * 3.2;
      this.shadow.style.transform = 'scale(' + k.toFixed(4) + ',' + (1 - up * 2).toFixed(4) + ')';
    }
  };

  /* Longitud de una zancada (en píxeles de la foto): lo que avanza el cuerpo
     en un ciclo para que la pata apoyada no patine sobre el suelo */
  Actor.prototype.stride = function () {
    return this.sweepRef ? this.sweepRef / this.m.duty : 100;
  };

  /* ------------------------------------------------------------------ reloj */
  function tick() {
    var now = performance.now();
    var dt = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    for (var i = 0; i < actors.length; i++) {
      var a = actors[i];
      if (!a.visible()) continue;
      if ((a.n = (a.n || 0) + 1) % 6 === 1) a.fit(false);
      a.frame(dt);
    }
  }

  W.Rig = {
    /* ¿Se puede usar? WebGL y movimiento completo */
    supported: function () {
      if (!W.rigs || W.motion.reduced) return false;
      try {
        var c = document.createElement('canvas');
        var gl = c.getContext('webgl2') || c.getContext('webgl');
        if (!gl) return false;
        var info = gl.getExtension('WEBGL_debug_renderer_info');
        var name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
        LITE = /swiftshader|llvmpipe|software|basic render/i.test(name) && !window.WILDPAW_RIG_FULL;
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
        return true;
      } catch (e) { return false; }
    },
    /* Crea la marioneta de una foto. Devuelve una promesa con el actor o null
       (entonces se queda la foto del DOM tal cual). */
    attach: function (o) {
      if (!W.rigs || !W.rigs[o.pose] || !MOTION[o.pose]) return Promise.resolve(null);
      var a = new Actor(o);
      return a.init().then(function (ok) {
        if (ok) actors.push(a);
        return ok;
      }).catch(function () { return null; });
    },
    start: function () {
      if (ticking || !window.gsap) return;
      ticking = true; last = 0;
      gsap.ticker.add(tick);
    },
    actors: actors,
    lite: function () { return LITE; },
    motion: MOTION
  };
})(window.WILDPAW);
