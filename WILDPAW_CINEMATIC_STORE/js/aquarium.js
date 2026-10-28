/* WILDPAW — acuario en canvas.
   Cada pez es una fotografía real recortada. Para que nade de forma creíble
   se divide en franjas verticales que siguen una trayectoria curva (la
   columna se dobla al girar) y se simula el batido lateral de la cola:
   visto de perfil, ese batido se percibe como un escorzo rítmico de la
   aleta caudal y un leve movimiento de la cola. La cabeza permanece rígida. */
(function (W) {
  'use strict';

  var TAU = Math.PI * 2;

  // len: longitud relativa · speed: px/s a escala 1 · beat: Hz · amp: amplitud
  // del batido (fracción de la longitud) · rigid: fracción rígida desde la cabeza
  var SPECIES = [
    { key: 'clownfish', len: .55, speed: 62, beat: 3.1, amp: .22, rigid: .4 },
    { key: 'garibaldi', len: .82, speed: 58, beat: 2.5, amp: .2, rigid: .44 },
    { key: 'anthias', len: .82, speed: 88, beat: 2.9, amp: .21, rigid: .42 },
    { key: 'rainbowfish', len: .7, speed: 84, beat: 3.3, amp: .22, rigid: .4 },
    { key: 'yellow-tang', len: .62, speed: 60, beat: 2.7, amp: .18, rigid: .48 },
    { key: 'silver-grunt', len: .78, speed: 78, beat: 2.5, amp: .18, rigid: .46 },
    { key: 'copperband', len: .58, speed: 46, beat: 2.3, amp: .17, rigid: .5 },
    { key: 'damselfish', len: .52, speed: 70, beat: 3.5, amp: .2, rigid: .44 }
  ];
  var HERO = { key: 'lionfish', len: 1.5, speed: 30, beat: 1.4, amp: .11, rigid: .55 };

  var state = {
    ready: false, running: false, active: false,
    w: 0, h: 0, dpr: 1, unit: 200, t: 0, last: 0,
    pointer: { x: -9999, y: -9999, on: false },
    fish: [], bubbles: [], snow: [], ripples: [], hero: null, heroP: -1,
    sprites: {}, layers: {}
  };

  function makeVariant(img, tint, blur) {
    var c = document.createElement('canvas');
    var pad = Math.ceil(blur * 3);
    c.width = img.naturalWidth + pad * 2;
    c.height = img.naturalHeight + pad * 2;
    var x = c.getContext('2d');
    if (blur && 'filter' in x) x.filter = 'blur(' + blur + 'px)';
    x.drawImage(img, pad, pad);
    x.filter = 'none';
    // Perspectiva atmosférica: los peces lejanos se tiñen del azul del agua
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(10, 58, 82,' + tint + ')';
    x.fillRect(0, 0, c.width, c.height);
    return { img: c, w: c.width, h: c.height, pad: pad };
  }

  function spriteFor(sp, far) {
    var s = state.sprites[sp.key];
    return far ? s.far : s.near;
  }

  // Baraja de especies: evita repetir la misma especie en pantalla
  var deck = [];
  function nextSpecies() {
    if (!deck.length) deck = SPECIES.slice().sort(function () { return Math.random() - .5; });
    return deck.pop();
  }

  // Los peces cercanos nadan sobre todo por encima o por debajo del titular
  function laneY(layer) {
    if (layer === 'back') return W.rand(.1, .82);
    return Math.random() < .5 ? W.rand(.1, .3) : W.rand(.64, .84);
  }

  function newFish(layer, spreadX, slot, slots) {
    var sp = nextSpecies();
    var z = layer === 'back' ? W.rand(.05, .45) : W.rand(.62, 1);
    var dir = Math.random() < .5 ? 1 : -1;
    var f = {
      sp: sp, layer: layer, z: z, dir: dir,
      scale: .32 + .68 * z,
      x: 0,
      yBase: laneY(layer) * state.h,
      speed: sp.speed * W.rand(.8, 1.2),
      phase: Math.random() * TAU,
      beat: sp.beat * W.rand(.85, 1.15),
      a1: W.rand(14, 46), k1: W.rand(.0025, .006), p1: Math.random() * TAU, f1: W.rand(.2, .5),
      a2: W.rand(4, 14), k2: W.rand(.01, .02), p2: Math.random() * TAU,
      avoid: 0, startle: 0
    };
    var L = f.sp.len * state.unit * f.scale;
    if (spreadX) f.x = (slot + W.rand(.15, .85)) / slots * (state.w + L) - L * .3;
    else f.x = dir > 0 ? -W.rand(20, 360) : state.w + W.rand(20, 360);
    return f;
  }

  function yAt(f, x) {
    return f.yBase + f.a1 * Math.sin(f.k1 * x + f.p1 + state.t * f.f1) + f.a2 * Math.sin(f.k2 * x + f.p2) + f.avoid;
  }

  var N_STRIPS = 22;

  function drawFish(ctx, f, far) {
    var spr = spriteFor(f.sp, far);
    if (!spr) return;
    var dpr = state.dpr;
    var L = f.sp.len * state.unit * f.scale;
    var srcW = spr.w - spr.pad * 2;
    var H = L * (spr.h / srcW);
    var n = N_STRIPS;
    var l0 = L / n;
    var sw = srcW / n;
    var phi = state.t * TAU * f.beat * (1 + f.startle * .9) + f.phase;
    var amp = f.sp.amp * L;
    var rigid = f.sp.rigid;
    var acc = 0;
    var dir = f.dir;
    var padScale = L / srcW;

    function lateral(s) { // s: 0 = cabeza, 1 = cola
      var q = W.clamp((s - rigid) / (1 - rigid), 0, 1);
      return amp * q * q * Math.sin(phi - TAU * .85 * q);
    }

    ctx.globalAlpha = f.layer === 'back' ? .5 + f.z * .8 : 1;
    // Franjas desde la cabeza (derecha de la imagen) hacia la cola
    for (var i = n - 1; i >= 0; i--) {
      var sA = (n - 1 - i) / n, sB = (n - i) / n, sM = (sA + sB) / 2;
      var dA = lateral(sA), dB = lateral(sB), dM = lateral(sM);
      var theta = Math.atan2(dB - dA, l0);
      var c = Math.max(.5, Math.cos(theta));
      var depth = 1 + .1 * (dM / (amp || 1)) * W.clamp((sM - rigid) / (1 - rigid), 0, 1);
      var seg = l0 * c;
      var cx = f.x - dir * (acc + seg / 2);
      acc += seg;
      var cy = yAt(f, cx);
      var slope = (yAt(f, cx + 2) - yAt(f, cx - 2)) / 4;
      var ang = Math.atan2(dir * slope, dir);
      var cos = Math.cos(ang), sin = Math.sin(ang);
      var sx = c, sy = dir * depth;
      var flick = dM * .28; // componente visible del batido
      ctx.setTransform(cos * sx * dpr, sin * sx * dpr, -sin * sy * dpr, cos * sy * dpr,
        (cx - sin * flick) * dpr, (cy + cos * flick) * dpr);
      var srcX = spr.pad + i * sw;
      ctx.drawImage(spr.img, Math.max(0, srcX - .6), 0, sw + 1.2, spr.h,
        -l0 / 2 - .7, -H / 2 - spr.pad * padScale, l0 + 1.4, H + spr.pad * 2 * padScale);
    }
    ctx.globalAlpha = 1;
  }

  function drawBubbles(ctx, dt) {
    if (state.bubbles.some(function (b) { return b.dead; })) state.bubbles = state.bubbles.filter(function (b) { return !b.dead; });
    var dpr = state.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.bubbles.forEach(function (b) {
      b.y -= b.v * dt;
      b.x += Math.sin(state.t * b.f + b.p) * .35;
      if (b.y < -20) {
        if (b.burst) { b.dead = true; return; }
        b.y = state.h + W.rand(10, 200); b.x = W.rand(0, state.w);
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.strokeStyle = 'rgba(241,248,247,' + b.a + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.r * .35, b.y - b.r * .35, b.r * .28, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,' + (b.a + .2) + ')';
      ctx.fill();
    });
  }

  function drawSnow(ctx, dt) {
    var dpr = state.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgba(200,236,232,.5)';
    state.snow.forEach(function (s) {
      s.y += s.v * dt; s.x += Math.sin(state.t * .3 + s.p) * .12;
      if (s.y > state.h + 4) { s.y = -4; s.x = W.rand(0, state.w); }
      ctx.globalAlpha = s.a;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    ctx.globalAlpha = 1;
  }

  function update(dt) {
    var p = state.pointer;
    state.fish.forEach(function (f, idx) {
      var L = f.sp.len * state.unit * f.scale;
      // Interacción suave: los peces se apartan del cursor
      var target = 0;
      if (p.on) {
        var fy = yAt(f, f.x - f.dir * L * .5) - f.avoid;
        var dx = (f.x - f.dir * L * .5) - p.x, dy = fy - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy), R = 120 + L * .6;
        if (dist < R) {
          target = (dy >= 0 ? 1 : -1) * (R - dist) * .9;
          f.startle = Math.min(1, f.startle + dt * 3);
        }
      }
      // Onda al tocar el agua: empujón que se disipa
      state.ripples.forEach(function (r) {
        if (r.age > .25) return;
        var hx = f.x - f.dir * L * .5, hy = yAt(f, hx);
        var rx = hx - r.x, ry = hy - r.y, rd = Math.sqrt(rx * rx + ry * ry), RR = 300;
        if (rd < RR && !r.hit[idx]) {
          r.hit[idx] = true;
          f.kick = (f.kick || 0) + (ry >= 0 ? 1 : -1) * (RR - rd) * .8;
          f.startle = 1;
        }
      });
      f.kick = (f.kick || 0) * Math.exp(-dt * 1.6);
      target += f.kick;
      f.avoid += (target - f.avoid) * Math.min(1, dt * 2.2);
      f.startle = Math.max(0, f.startle - dt * .6);
      f.x += f.dir * f.speed * f.scale * (1 + f.startle * 1.4) * dt;
      var out = f.dir > 0 ? f.x - L > state.w + 30 : f.x + L < -30;
      if (out) state.fish[idx] = newFish(f.layer, false);
    });
    if (state.hero && state.heroP >= 0) {
      var h = state.hero, HL = h.sp.len * state.unit * h.scale;
      h.x = W.lerp(state.w + HL * 1.05, -HL * .2, state.heroP);
    }
  }

  function render(dt) {
    var back = state.layers.back, front = state.layers.front;
    back.ctx.setTransform(1, 0, 0, 1, 0, 0);
    back.ctx.clearRect(0, 0, back.el.width, back.el.height);
    front.ctx.setTransform(1, 0, 0, 1, 0, 0);
    front.ctx.clearRect(0, 0, front.el.width, front.el.height);

    drawSnow(back.ctx, dt);
    var sorted = state.fish.slice().sort(function (a, b) { return a.z - b.z; });
    sorted.forEach(function (f) {
      drawFish(f.layer === 'back' ? back.ctx : front.ctx, f, f.layer === 'back');
    });
    if (state.hero && state.heroP > 0 && state.heroP < 1) drawFish(front.ctx, state.hero, false);
    drawBubbles(front.ctx, dt);
    drawRipples(front.ctx, dt);
  }

  function drawRipples(ctx, dt) {
    var dpr = state.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.ripples = state.ripples.filter(function (r) { r.age += dt; return r.age < 1.6; });
    state.ripples.forEach(function (r) {
      for (var k = 0; k < 3; k++) {
        var a = r.age - k * .14;
        if (a <= 0) continue;
        var rad = 14 + a * 240;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rad, rad * .9, 0, 0, TAU);
        ctx.strokeStyle = 'rgba(241,248,247,' + (Math.max(0, .55 * (1 - a / 1.4))).toFixed(3) + ')';
        ctx.lineWidth = 1.6 - k * .4;
        ctx.stroke();
      }
    });
  }

  function frame(now) {
    if (!state.running) return;
    var dt = Math.min(.05, (now - (state.last || now)) / 1000);
    state.last = now;
    state.t += dt;
    update(dt);
    render(dt);
    requestAnimationFrame(frame);
  }

  function resize() {
    var el = state.layers.back.el;
    var w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    var ratioY = state.h ? h / state.h : 1;
    state.w = w; state.h = h;
    state.dpr = Math.min(window.devicePixelRatio || 1, W.motion.lowPower ? 1 : 1.75);
    state.unit = W.clamp(w * .24, 150, 380);
    ['back', 'front'].forEach(function (k) {
      var c = state.layers[k].el;
      c.width = Math.round(w * state.dpr);
      c.height = Math.round(h * state.dpr);
    });
    state.fish.forEach(function (f) { f.yBase *= ratioY; });
  }

  function populate() {
    var small = state.w < 700;
    var nb = W.motion.lowPower ? 4 : small ? 5 : 9;
    var nf = W.motion.lowPower ? 2 : small ? 3 : 3;
    state.fish = [];
    for (var i = 0; i < nb; i++) state.fish.push(newFish('back', true, i, nb));
    for (var j = 0; j < nf; j++) state.fish.push(newFish('front', true, j, nf));
    state.bubbles = [];
    for (var b = 0; b < (small ? 10 : 18); b++) {
      state.bubbles.push({ x: W.rand(0, state.w), y: W.rand(0, state.h), r: W.rand(1.5, 5.5), v: W.rand(25, 70), f: W.rand(1, 2.5), p: Math.random() * TAU, a: W.rand(.25, .55) });
    }
    state.snow = [];
    for (var s = 0; s < (small ? 40 : 90); s++) {
      state.snow.push({ x: W.rand(0, state.w), y: W.rand(0, state.h), r: W.rand(1, 2.4), v: W.rand(3, 12), p: Math.random() * TAU, a: W.rand(.15, .6) });
    }
    var hero = newFish('front', false);
    hero.sp = HERO; hero.z = 1; hero.scale = 1; hero.dir = -1;
    hero.yBase = state.h * (small ? .62 : .6); hero.a1 = 26; hero.k1 = .003; hero.f1 = .25; hero.a2 = 6; hero.beat = HERO.beat;
    state.hero = hero;
  }

  W.Aquarium = {
    init: function () {
      var back = W.$('[data-fish-layer="back"]'), front = W.$('[data-fish-layer="front"]');
      if (!back || !front) return Promise.resolve(false);
      state.layers.back = { el: back, ctx: back.getContext('2d') };
      state.layers.front = { el: front, ctx: front.getContext('2d') };

      var all = SPECIES.concat([HERO]);
      return Promise.all(all.map(function (sp) {
        return W.loadImage('assets/img/fish/' + sp.key + '.webp').then(function (img) {
          if (!img) return;
          state.sprites[sp.key] = { near: makeVariant(img, 0, 0), far: makeVariant(img, .42, 1.6) };
        });
      })).then(function () {
        SPECIES = SPECIES.filter(function (sp) { return state.sprites[sp.key]; });
        if (!SPECIES.length) return false;
        resize();
        populate();
        state.ready = true;

        var scene = back.closest('.ocean__inner') || back.parentNode;
        scene.addEventListener('pointermove', function (e) {
          var r = back.getBoundingClientRect();
          state.pointer.x = e.clientX - r.left; state.pointer.y = e.clientY - r.top; state.pointer.on = true;
        });
        scene.addEventListener('pointerleave', function () { state.pointer.on = false; });
        var rt;
        window.addEventListener('resize', function () {
          clearTimeout(rt);
          rt = setTimeout(function () { resize(); if (!state.running) render(0); }, 120);
        });
        return true;
      });
    },
    /* Activa el bucle solo cuando la escena acuática es visible */
    setActive: function (on) {
      if (!state.ready || W.motion.reduced) return;
      if (on && !state.running) {
        state.running = true; state.last = 0;
        requestAnimationFrame(frame);
      } else if (!on) state.running = false;
    },
    setHeroProgress: function (p) { state.heroP = p; },
    /* Toque en el agua: onda, burbujas y los peces cercanos huyen */
    splash: function (x, y) {
      if (!state.ready) return;
      state.ripples.push({ x: x, y: y, age: 0, hit: {} });
      for (var i = 0; i < 14; i++) {
        state.bubbles.push({ x: x + W.rand(-24, 24), y: y + W.rand(-10, 20), r: W.rand(1.5, 6), v: W.rand(60, 160), f: W.rand(1, 3), p: Math.random() * TAU, a: W.rand(.35, .7), burst: true });
      }
      if (!state.running) render(0);
    },
    /* Movimiento reducido: un único fotograma estático y bien compuesto */
    renderStatic: function () {
      if (!state.ready) return;
      state.fish.forEach(function (f, i) { f.x = (i + .5) / state.fish.length * (state.w + 200); });
      state.heroP = .62;
      update(0);
      render(0);
    }
  };
})(window.WILDPAW);
