/* WILDPAW — dirección de movimiento con GSAP + ScrollTrigger.

   Siete planos en un único escenario fijado; la "cámara" es el scroll:
     1 The Arrival     el gato entra caminando (zancada ligada a la distancia).
     2 The Connection  corte en iris desde su cabeza a un primer plano: te mira
                       y sigue el cursor con un muelle.
     3 The Leap        salta hacia el objetivo; su pelaje tapa el encuadre.
     4 The Energy      bajo el pelaje, el perro llega galopando desde el fondo.
     5 The Reveal      cruza la cámara; contraplano: se aleja y mira atrás.
     6 The Meeting     la cámara lo adelanta y alcanza al gato.
     7 The Deep        el gato se aleja y el agua sube: el océano.
   Los cambios de foto se esconden siempre (iris, pelaje, distancia) y todo es
   reversible (scrub). Reglas para evitar conflictos:
     · el parallax del ratón mueve las capas .px; el scroll mueve los actores;
     · un único pivote (transform-origin) por actor, fijado en el CSS;
     · estados iniciales con gsap.set y tramos encadenados con fromTo
       (immediateRender: false) y valores por función (se recalculan al
       redimensionar con invalidateOnRefresh). */
(function (W) {
  'use strict';

  var $ = W.$, $$ = W.$$;
  var root = document.documentElement;
  var master = null;
  var cleanups = [];
  var LABELS = { arrival: 0, cat: 1.75, dog: 4.95, ocean: 13.45 };
  var END = 14.85;
  var THEME = { arrival: '#F4F2EE', connection: '#EEEAE4', dog: '#F7EAD6', cat: '#FFFFFF', ocean: '#EAF6FF' };
  var CHAPTERS = [
    [0, 'The Arrival'], [1.15, 'The Connection'], [2.85, 'The Leap'], [3.75, 'The Energy'],
    [7.1, 'The Reveal'], [10.05, 'The Meeting'], [11.4, 'The Deep']
  ];

  /* Pivote de cada actor (el mismo que transform-origin en el CSS), proporción
     del lienzo, altura de la línea de apoyo y, si hace falta, un punto de
     referencia (la cabeza o la cara) en fracciones del lienzo */
  var CAST = {
    catWalk: { ar: 1113 / 634, px: .50, py: .60, foot: .923, head: [.89, .25] },
    catLeap: { ar: 894 / 1402, px: .60, py: .42, foot: .90, face: [.56, .38] },
    dogRun: { ar: 983 / 1143, px: .54, py: .46, foot: .92 },
    dogBack: { ar: 988 / 1179, px: .52, py: .42, foot: .92 },
    catBack: { ar: 1031 / 1196, px: .50, py: .50, foot: .95 }
  };
  var A = {};     // elementos de cada actor
  var L = null;   // encuadres calculados para el tamaño actual

  /* ------------------------------------------------------------- Encuadres */
  // Un encuadre es [x, y, h]: dónde cae el pivote (fracción del escenario) y
  // la altura del lienzo del actor (fracción del alto del escenario).
  /* Tamaño real del escenario (100svh). No se mide el propio escenario porque,
     mientras está fijado, ScrollTrigger le deja el ancho y el alto anteriores. */
  var probe = null;
  function stageSize() {
    if (!probe) {
      probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100vh;height:100svh;visibility:hidden;pointer-events:none;z-index:-1';
      document.body.appendChild(probe);
    }
    return { w: probe.clientWidth, h: Math.max(520, probe.clientHeight) };
  }

  function layout() {
    var size = stageSize();
    var w = size.w, h = size.h;
    var k = w / h;
    var portrait = k < .8 || w < 700;

    // Coloca un actor por su centro horizontal y su línea de apoyo
    function stand(key, cx, footY, sz) {
      var c = CAST[key];
      return [cx + (c.px - .5) * c.ar * sz / k, footY - (c.foot - c.py) * sz, sz];
    }
    // Coloca el punto (fx, fy) del lienzo en (sx, sy) de la pantalla
    function at(key, fx, fy, sx, sy, sz) {
      var c = CAST[key];
      return [sx + (c.px - fx) * c.ar * sz / k, sy + (c.py - fy) * sz, sz];
    }
    // Dónde queda en pantalla un punto del lienzo con un encuadre dado
    function point(key, raw, fx, fy) {
      var c = CAST[key];
      return [raw[0] + (fx - c.px) * c.ar * raw[2] / k, raw[1] + (fy - c.py) * raw[2]];
    }

    var raw = {};
    var walkS = portrait ? .98 * k / CAST.catWalk.ar : Math.min(.62 * k / CAST.catWalk.ar, .62);
    if (!portrait) {
      raw.catWalk = { plat: stand('catWalk', .56, .865, walkS), enter: stand('catWalk', -.48, .865, walkS) };
      raw.catLeap = { close: at('catLeap', .56, .38, .665, .43, 1.42), lens: [.50, .50, 5.6] };
      raw.dogRun = { hero: stand('dogRun', .56, .93, .84), lens: [.52, .53, 6.2] };
      raw.dogBack = { lens: [.50, .50, 5.2], bridge: stand('dogBack', .67, .90, .60), exit: [1.95, 1.0, 2.6] };
      raw.catBack = { far: [.36, .475, .12], plat: stand('catBack', .47, .935, .72), far2: [.50, .44, .07] };
    } else {
      var dogH = Math.min(.56, 1.0 * k / CAST.dogRun.ar);
      var catH = Math.min(.42, .9 * k / CAST.catBack.ar);
      raw.catWalk = { plat: stand('catWalk', .5, .64, walkS), enter: stand('catWalk', -.62, .64, walkS) };
      raw.catLeap = { close: at('catLeap', .56, .38, .5, .37, .84), lens: [.50, .50, 4.8] };
      raw.dogRun = { hero: stand('dogRun', .52, .745, dogH), lens: [.50, .52, 5.2] };
      raw.dogBack = { lens: [.50, .50, 4.6], bridge: stand('dogBack', .60, .80, Math.min(.44, 1.0 * k / CAST.dogBack.ar)), exit: [3.2, 1.0, 2.2] };
      raw.catBack = { far: [.20, .33, .085], plat: stand('catBack', .50, .64, catH), far2: [.50, .40, .052] };
    }
    // El perro llega desde lejos por el mismo eje: mismo pivote, escala mínima
    raw.dogRun.far = [raw.dogRun.hero[0], raw.dogRun.hero[1], portrait ? .05 : .06];
    // Corte en iris: el primer plano nace en la cabeza del gato del plano
    // general, con la cara del mismo tamaño que tenía la cabeza
    var head = point('catWalk', raw.catWalk.plat, CAST.catWalk.head[0], CAST.catWalk.head[1]);
    raw.catLeap.iris = at('catLeap', CAST.catLeap.face[0], CAST.catLeap.face[1], head[0], head[1], walkS * 1.05);
    var face = point('catLeap', raw.catLeap.close, CAST.catLeap.face[0], CAST.catLeap.face[1]);

    var poses = {};
    Object.keys(raw).forEach(function (key) {
      var c = CAST[key];
      poses[key] = {};
      Object.keys(raw[key]).forEach(function (name) {
        var p = raw[key][name];
        poses[key][name] = { x: p[0] * w - c.px * c.ar * h, y: p[1] * h - c.py * h, s: p[2] };
      });
    });
    L = {
      w: w, h: h, portrait: portrait, poses: poses,
      iris: { x0: head[0] * w, y0: head[1] * h, r0: .2 * walkS * h, x1: face[0] * w, y1: face[1] * h, r1: Math.hypot(w, h) * 1.02 }
    };
    return L;
  }

  function pose(key, name) {
    return {
      x: function () { return L.poses[key][name].x; },
      y: function () { return L.poses[key][name].y; },
      scale: function () { return L.poses[key][name].s; }
    };
  }

  // Posición en pantalla de un punto del lienzo de un actor, ahora mismo
  function screenPoint(key, fx, fy) {
    var c = CAST[key], el = A[key].el, layer = el.parentNode;
    var Wd = c.ar * L.h, s = gsap.getProperty(el, 'scale');
    var x = gsap.getProperty(el, 'x') + gsap.getProperty(layer, 'x');
    var y = gsap.getProperty(el, 'y') + gsap.getProperty(layer, 'y');
    return [x + c.px * Wd + (fx - c.px) * Wd * s, y + c.py * L.h + (fy - c.py) * L.h * s];
  }

  /* Acercarse o alejarse a velocidad constante se percibe como un cambio de
     escala exponencial, no lineal: esta curva interpola la escala así. Como
     x e y usan la misma curva, el actor recorre una recta en perspectiva. */
  function depthEase(key, from, to) {
    return function (p) {
      var a = L.poses[key][from].s, b = L.poses[key][to].s;
      return (a * Math.pow(b / a, p) - a) / (b - a);
    };
  }

  // Tramo de un actor entre dos encuadres (encadenable)
  function travel(tl, key, from, to, at, dur, ease) {
    var v = pose(key, to);
    v.duration = dur;
    v.ease = ease || depthEase(key, from, to);
    v.immediateRender = false;
    return tl.fromTo(A[key].el, pose(key, from), v, at);
  }

  /* Desenfoque de proximidad con relevo "sin valle": la capa que entra se
     pone al 100 % por debajo y la que sale se funde por encima, así la
     silueta nunca pierde opacidad a mitad del cambio. */
  function fade(tl, el, a, b, at, d) {
    return tl.fromTo(el, { opacity: a }, { opacity: b, duration: d, immediateRender: false }, at);
  }
  // Tiempos: la capa inferior llega al 100 % ANTES de que la superior empiece
  // a irse (cobertura medida = 1 en todo el tramo).
  function defocus(tl, key, at, d) {   // nítido → b1 → b2
    var a = A[key];
    fade(tl, a.b1, 0, 1, at, d * .5); fade(tl, a.s, 1, 0, at + d * .5, d);
    fade(tl, a.b2, 0, 1, at + d * 1.5, d * .5); fade(tl, a.b1, 1, 0, at + d * 2, d);
  }
  function refocus(tl, key, at, d) {   // b2 → b1 → nítido
    var a = A[key];
    fade(tl, a.b1, 0, 1, at, d); fade(tl, a.b2, 1, 0, at + d, d * .5);
    fade(tl, a.s, 0, 1, at + d * 1.5, d); fade(tl, a.b1, 1, 0, at + d * 2.5, d * .5);
  }

  /* Movimiento propio de cada animal (js/rig.js). Si no hay WebGL, un objeto
     vacío recibe las mismas animaciones y no pasa nada. */
  var GAIT0 = {
    catWalk: { gait: 1, phase: 0 }, catLeap: { gait: 0, extend: 0, look: true, lookIdle: true },
    dogRun: { gait: 1, speed: 1.35 }, dogBack: { gait: 1, speed: 1 }, catBack: { gait: .6, speed: 1 }
  };
  var POSE = { catWalk: 'cat-walk', catLeap: 'cat-leap', dogRun: 'dog-run', dogBack: 'dog-back', catBack: 'cat-back' };
  function mo(key) { return (A[key] && A[key].rig) ? A[key].rig.p : (A[key].mo || (A[key].mo = { gait: 0, speed: 1, extend: 0, boost: 0 })); }
  function rigAll() {
    if (!W.Rig || !W.Rig.supported()) return Promise.resolve(false);
    return Promise.all(Object.keys(POSE).map(function (key) {
      var a = A[key], g = GAIT0[key];
      return W.Rig.attach({
        pose: POSE[key], host: a.body, watch: a.el, shadow: a.shadow,
        layers: { s: a.s, b1: a.b1, b2: a.b2 }, gait: g.gait
      }).then(function (r) {
        if (r) { a.rig = r; Object.keys(g).forEach(function (k) { r.p[k] = g[k]; }); }
        return !!r;
      });
    })).then(function (ok) {
      if (ok.some(Boolean)) W.Rig.start();
      return ok.every(Boolean);
    });
  }

  // Tramo del movimiento propio de un actor (marcha, velocidad, extensión)
  function gait(tl, key, from, to, at, dur, ease) {
    to = Object.assign({ duration: dur, ease: ease || 'power1.inOut', immediateRender: false }, to);
    return tl.fromTo(mo(key), from, to, at);
  }

  /* El gato camina de verdad por el plano: la fase del paso sale de la
     distancia recorrida, así la pata apoyada no patina */
  function walkPhase() {
    var r = A.catWalk.rig;
    if (!r) return;
    var c = CAST.catWalk, s = gsap.getProperty(A.catWalk.el, 'scale');
    var stride = r.stride() * c.ar * L.h * s / r.R.w;
    r.p.phase = (gsap.getProperty(A.catWalk.el, 'x') - L.poses.catWalk.enter.x) / stride;
  }

  /* --------------------------------------------------- Tipografía gigante */
  // Ajusta una palabra gigante al ancho disponible (mide el texto y escala)
  function fit(el, ratio) {
    if (!el) return;
    var avail = stageSize().w * ratio;
    var column = getComputedStyle(el).flexDirection === 'column';
    el.style.fontSize = '100px';
    var widths = Array.prototype.map.call(el.children, function (c) { return c.getBoundingClientRect().width; });
    var widest = column ? Math.max.apply(null, widths) : widths.reduce(function (a, b) { return a + b; }, 0);
    if (widest) el.style.fontSize = (100 * avail / widest).toFixed(2) + 'px';
  }
  function fitWords() {
    $$('[data-mega]').forEach(function (el) {
      var column = getComputedStyle(el).flexDirection === 'column';
      fit(el, column ? .9 : (el.getAttribute('data-mega') === 'cat' ? .62 : .95));
    });
  }

  /* ---------------------------------------------------- Parallax del ratón */
  function parallax() {
    if (!W.motion.finePointer) return;
    var layers = $$('.px[data-depth]').map(function (el) {
      var d = parseFloat(el.dataset.depth) || 0;
      return {
        d: d,
        x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' })
      };
    });
    cleanups.push(W.on(window, 'pointermove', function (e) {
      var mx = e.clientX / window.innerWidth * 2 - 1;
      var my = e.clientY / window.innerHeight * 2 - 1;
      layers.forEach(function (l) { l.x(mx * l.d * -22); l.y(my * l.d * -12); });
    }, { passive: true }));
  }

  /* El primer plano mira al cursor: la cabeza se inclina hacia él con un
     muelle (retraso natural) y, si el ratón se queda quieto, el gato mira a su
     alrededor por su cuenta (js/rig.js). Solo con el primer plano en cámara. */
  function gaze() {
    var p = A.catLeap.rig && A.catLeap.rig.p;
    if (!p) return;
    var lastMove = -1e9;
    cleanups.push(W.on(window, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !master) return;
      var t = master.time();
      if (t < 1.2 || t > 2.85) return;
      var f = screenPoint('catLeap', CAST.catLeap.face[0], CAST.catLeap.face[1]);
      p.lookX = W.clamp((e.clientX - f[0]) / (L.w * .32), -1, 1);
      p.lookY = W.clamp((e.clientY - f[1]) / (L.h * .4), -1, 1);
      p.lookIdle = false;
      lastMove = performance.now();
    }, { passive: true }));
    gsap.ticker.add(function () {
      if (!p.lookIdle && performance.now() - lastMove > 2600) { p.lookIdle = true; }
      if (master && master.time() > 2.85 && !p.lookIdle) { p.lookX = 0; p.lookY = 0; }
    });
  }

  /* ------------------------------------------- Intro: el gato llega andando */
  function intro() {
    var a = A.catWalk;
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('[data-nav]', { yPercent: -120, autoAlpha: 0, duration: 1 }, .5)
      .from('[data-mega="arrival"] .ch > span', { yPercent: 135, duration: 1.3, stagger: .06 }, .15)
      .from('.hud', { autoAlpha: 0, y: 12, duration: .9 }, 1.2)
      .from('[data-arrive-fade]', { autoAlpha: 0, y: 18, duration: .9, stagger: .08 }, 2.1);
    if (a.rig) {
      // Entra desde fuera de cuadro, frena y se queda parado: las patas
      // avanzan lo mismo que el cuerpo (walkPhase) y, al pararse, se asientan
      var to = pose('catWalk', 'plat');
      to.duration = 3.2; to.ease = 'power2.out'; to.onUpdate = walkPhase;
      tl.fromTo(a.el, pose('catWalk', 'enter'), to, 0)
        .fromTo(a.rig.p, { gait: 1 }, { gait: 0, duration: .8, ease: 'power2.inOut' }, 2.6);
    } else {
      // Sin marioneta no se finge la caminata: aparece ya en su sitio
      gsap.set(a.el, pose('catWalk', 'plat'));
      tl.fromTo(a.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, .3);
    }
    return tl;
  }

  /* ------------------------------------------- Línea de tiempo del scroll */
  function buildMaster() {
    var small = L.portrait;
    var bubbles = W.decor.bubbles(small ? 14 : 26);
    var heroProxy = { p: 0 };
    var depthProxy = { m: 12 };
    var irisP = { p: 0 };
    var depthEl = $('[data-depth-meter]');
    var arrival = $('[data-scene="arrival"]'), connection = $('[data-scene="connection"]');
    var dogScene = $('[data-scene="dog"]'), ocean = $('[data-scene="ocean"]');
    var catLetters = $$('[data-mega="cat"] .ch > span');
    var washDog = $('[data-wash="dog"]'), washCat = $('[data-wash="cat"]');

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '[data-story]',
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * (L.portrait ? 10.4 : 12.2)); },
        pin: '[data-stage]',
        scrub: 1,
        refreshPriority: 2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Cuanto más rápido el scroll, más rápido corren (se apaga solo al parar)
        onUpdate: function (self) {
          var b = Math.min(1, Math.abs(self.getVelocity()) / 2600);
          Object.keys(POSE).forEach(function (k) { var p = mo(k); p.boost = Math.max(p.boost || 0, b); });
        }
      },
      onUpdate: syncScenes
    });
    tl.addLabel('arrival', LABELS.arrival).addLabel('cat', LABELS.cat).addLabel('dog', LABELS.dog).addLabel('ocean', LABELS.ocean);

    /* === 1 → 2 · Corte en iris: de la cabeza del gato a su primer plano ==== */
    // El círculo nace sobre la cabeza del plano general y crece siguiendo la
    // cara del primer plano, que viaja desde ese mismo tamaño hasta su encuadre
    function applyIris() {
      var I = L.iris, p = irisP.p;
      var f = screenPoint('catLeap', CAST.catLeap.face[0], CAST.catLeap.face[1]);
      var r = p < .12 ? I.r0 * (p / .12) : I.r0 + (I.r1 - I.r0) * Math.pow((p - .12) / .88, 1.6);
      // Abierto del todo, sin recorte: así no se repinta la capa en cada fotograma
      connection.style.clipPath = p >= 1 ? 'none' : p <= 0 ? 'circle(0px at 50% 50%)' :
        'circle(' + r.toFixed(1) + 'px at ' + f[0].toFixed(1) + 'px ' + f[1].toFixed(1) + 'px)';
    }
    tl.fromTo('[data-arrive-fade]', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: .35, stagger: .04, ease: 'power2.in', immediateRender: false }, .45)
      .fromTo(arrival, { scale: 1 }, {
        scale: 1.07, duration: 1.0, ease: 'power2.in', immediateRender: false,
        transformOrigin: function () { return L.iris.x0 + 'px ' + L.iris.y0 + 'px'; }
      }, .55)
      .set(connection, { autoAlpha: 1 }, .55);
    travel(tl, 'catLeap', 'iris', 'close', .55, 1.0, 'power2.inOut');
    tl.fromTo(irisP, { p: 0 }, { p: 1, duration: 1.0, ease: 'power1.inOut', onUpdate: applyIris, immediateRender: false }, .55)
      .set(arrival, { autoAlpha: 0 }, 1.56)
      .fromTo(catLetters, { yPercent: 135 }, { yPercent: 0, duration: .6, stagger: .05, ease: 'power3.out', immediateRender: false }, 1.05)
      .fromTo('.cat__title .line__in', { yPercent: 112 }, { yPercent: 0, duration: .5, stagger: .1, ease: 'power3.out', immediateRender: false }, 1.3)
      .fromTo('[data-cat-fade]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .4, stagger: .08, ease: 'power2.out', immediateRender: false }, 1.45)
      .fromTo('[data-cat-cards] .cat-card', { y: 46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45, stagger: .15, ease: 'power3.out', immediateRender: false }, 1.55);

    /* --- Meseta del primer plano: respira, mira, y la cámara empuja un poco */
    tl.fromTo(A.catLeap.body, { scale: 1 }, { scale: 1.03, duration: 1.2, immediateRender: false }, 1.6);

    /* === 2 → 3 → 4 · Salta hacia el objetivo y, bajo su pelaje, el perro === */
    tl.fromTo('[data-cat-cards] .cat-card', { y: 0, autoAlpha: 1 }, { y: -28, autoAlpha: 0, duration: .3, stagger: .05, ease: 'power2.in', immediateRender: false }, 2.75)
      .fromTo('.cat__title .line__in', { yPercent: 0 }, { yPercent: -112, duration: .35, stagger: .06, ease: 'power2.in', immediateRender: false }, 2.78)
      .fromTo('[data-cat-fade]', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, duration: .3, ease: 'power2.in', immediateRender: false }, 2.75)
      .fromTo(catLetters, { yPercent: 0 }, { yPercent: -135, duration: .4, stagger: .03, ease: 'power2.in', immediateRender: false }, 2.8)
      .fromTo('.connection__fog', { autoAlpha: 1 }, { autoAlpha: 0, duration: .3, immediateRender: false }, 2.85)
      .fromTo(A.catLeap.body, { scale: 1.03 }, { scale: 1, duration: .3, immediateRender: false }, 2.8);
    travel(tl, 'catLeap', 'close', 'lens', 2.85, .9);
    tl.fromTo(A.catLeap.body, { yPercent: 0 }, { yPercent: -4, duration: .45, ease: 'power2.out', immediateRender: false }, 2.85)
      .fromTo(A.catLeap.body, { yPercent: -4 }, { yPercent: -1.5, duration: .45, ease: 'power1.in', immediateRender: false }, 3.3);
    gait(tl, 'catLeap', { extend: 0 }, { extend: 1 }, 2.85, .7, 'power1.out');
    defocus(tl, 'catLeap', 3.42, .08);
    tl.fromTo(washCat, { autoAlpha: 0, yPercent: 0 }, { autoAlpha: 1, duration: .25, ease: 'power1.in', immediateRender: false }, 3.5)
      .fromTo($('i', washCat), { scale: 1 }, { scale: 1.25, duration: .9 }, 3.45)
      // Corte oculto: el gato ha pasado por debajo de la cámara
      .set([connection], { autoAlpha: 0 }, 3.75)
      .set(dogScene, { autoAlpha: 1 }, 3.75)
      .set(A.dogRun.el, { autoAlpha: 1 }, 3.75)
      // El pelaje sale hacia abajo, en la dirección del salto (raccord de movimiento)
      .fromTo(washCat, { yPercent: 0 }, { yPercent: 112, duration: .38, ease: 'power2.in', immediateRender: false }, 3.78)
      .set(washCat, { autoAlpha: 0 }, 4.16);

    /* === 4 · The Energy: el perro llega galopando desde el fondo ========== */
    travel(tl, 'dogRun', 'far', 'hero', 3.8, 1.15);
    fade(tl, A.dogRun.shadow, 0, 1, 4.2, .5);
    gait(tl, 'dogRun', { gait: 1, speed: 1.35 }, { gait: .6, speed: .85 }, 4.6, .45);
    tl.fromTo('.dog__headline .line__in', { yPercent: 115 }, { yPercent: 0, duration: .55, stagger: .12, ease: 'power3.out', immediateRender: false }, 4.55)
      .fromTo('[data-hero-fade]', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .45, stagger: .07, ease: 'power2.out', immediateRender: false }, 4.75);

    /* === 4 → 5 · El perro alcanza la cámara y la atraviesa ================ */
    var o = 5.15;
    tl.fromTo('.dog__headline .line__in', { yPercent: 0 }, { yPercent: -115, duration: .5, stagger: .07, ease: 'power2.in', immediateRender: false }, .35 + o)
      .fromTo('[data-hero-fade]', { y: 0, autoAlpha: 1 }, { y: -16, autoAlpha: 0, duration: .4, stagger: .04, ease: 'power2.in', immediateRender: false }, .35 + o);
    travel(tl, 'dogRun', 'hero', 'lens', .45 + o, 1.5);
    gait(tl, 'dogRun', { gait: .6, speed: .85 }, { gait: 1, speed: 1.35 }, .45 + o, .7);
    fade(tl, A.dogRun.shadow, 1, 0, .9 + o, .4);
    defocus(tl, 'dogRun', 1.0 + o, .17);
    tl.fromTo(washDog, { autoAlpha: 0 }, { autoAlpha: 1, duration: .32, ease: 'power1.in', immediateRender: false }, 1.58 + o)
      .fromTo($('i', washDog), { xPercent: 7, scale: 1 }, { xPercent: -7, scale: 1.18, duration: .8 }, 1.55 + o)
      // Corte oculto: con el encuadre tapado se cambia de plano (y de luz)
      .set(A.dogRun.el, { autoAlpha: 0 }, 1.95 + o)
      .set('.dog__bg', { autoAlpha: 0 }, 1.95 + o)
      .set([A.dogBack.el, A.catBack.el], { autoAlpha: 1 }, 1.95 + o);

    /* === 5 · The Reveal: contraplano, se aleja; al fondo, el gato ========= */
    travel(tl, 'dogBack', 'lens', 'bridge', 1.95 + o, 1.25);
    tl.fromTo(washDog, { autoAlpha: 1 }, { autoAlpha: 0, duration: .34, ease: 'power1.out', immediateRender: false }, 1.98 + o);
    refocus(tl, 'dogBack', 2.25 + o, .16);
    fade(tl, A.dogBack.shadow, 0, 1, 2.6 + o, .5);
    tl.set('[data-bridge]', { autoAlpha: 1 }, 2.7 + o)
      .fromTo('[data-bridge] .line__in', { yPercent: 112 }, { yPercent: 0, duration: .5, ease: 'power3.out' }, 2.7 + o)
      .fromTo('[data-bridge] .line__in', { yPercent: 0 }, { yPercent: -112, duration: .35, ease: 'power2.in', immediateRender: false }, 3.7 + o);
    // Se para a mirarte ("Keep up.") moviendo la cola, y arranca otra vez al trote
    gait(tl, 'dogBack', { gait: 1, speed: 1 }, { gait: .2, speed: .8 }, 2.9 + o, .4);
    gait(tl, 'dogBack', { gait: .2, speed: .8 }, { gait: 1, speed: 1.45 }, 3.7 + o, .25);

    /* === 6 · The Meeting: la cámara adelanta al perro y alcanza al gato === */
    travel(tl, 'dogBack', 'bridge', 'exit', 3.75 + o, 1.1, 'power2.in');
    fade(tl, A.dogBack.shadow, 1, 0, 3.85 + o, .3);
    defocus(tl, 'dogBack', 3.95 + o, .13);
    tl.set(A.dogBack.el, { autoAlpha: 0 }, 4.9 + o);
    travel(tl, 'catBack', 'far', 'plat', 3.75 + o, 1.3, 'power2.inOut');
    gait(tl, 'catBack', { gait: GAIT0.catBack.gait }, { gait: 0 }, 4.75 + o, .4);
    tl.fromTo(A.catBack.body, { scale: 1 }, { scale: 1.03, duration: .6, immediateRender: false }, 10.25)
      .fromTo(A.catBack.body, { scale: 1.03 }, { scale: 1, duration: .35, immediateRender: false }, 10.85);

    /* === 6 → 7 · The Deep: el gato se aleja y el agua sube ================ */
    gait(tl, 'catBack', { gait: 0 }, { gait: .9 }, 10.65, .3);
    travel(tl, 'catBack', 'plat', 'far2', 10.8, .95, 'power2.inOut');
    tl.set(ocean, { autoAlpha: 1 }, 11.25)
      .fromTo(ocean, { yPercent: 100 }, { yPercent: 0, duration: .9, ease: 'power2.inOut', immediateRender: false }, 11.25)
      .set(A.catBack.el, { autoAlpha: 0 }, 12.15);
    bubbles.forEach(function (b, i) {
      tl.fromTo(b, { y: 0, autoAlpha: 0, scale: .4 },
        { y: function () { return -window.innerHeight * W.rand(.55, 1.2); }, autoAlpha: 1, scale: 1, duration: W.rand(.7, 1.3), ease: 'power1.out' },
        11.6 + (i / bubbles.length) * .7);
      tl.to(b, { autoAlpha: 0, duration: .25 }, '>-0.25');
    });

    /* === 7 · Mundo acuático =============================================== */
    tl.fromTo('.ocean__title .line__in', { yPercent: 112 }, { yPercent: 0, duration: .7, stagger: .15, ease: 'power3.out' }, 12.25)
      .fromTo('[data-ocean-fade]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .4, stagger: .1, ease: 'power2.out' }, 12.6)
      .fromTo('[data-ocean-cta]', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: 'power2.out' }, 13.45)
      .fromTo('[data-ocean-title]', { scale: 1 }, { scale: 1.05, duration: 2.1 }, 12.7)
      .to(heroProxy, { p: 1, duration: 2.2, onUpdate: function () { W.Aquarium.setHeroProgress(heroProxy.p); } }, 12.5)
      .to(depthProxy, { m: 38, duration: 2.6, onUpdate: function () { if (depthEl) depthEl.textContent = '-' + Math.round(depthProxy.m); } }, 12.2)
      .set({}, {}, END);

    return tl;
  }

  /* ----------------------------------- Escena activa: inert, nav, acuario */
  var lastActive = '', lastChapter = -1;
  var els = null;
  function activeAt(t) { return t < 3.75 ? 'cat' : t < 10.05 ? 'dog' : t < 11.7 ? 'cat' : 'ocean'; }
  function chapterAt(t) { var i = 0; while (i < CHAPTERS.length - 1 && t >= CHAPTERS[i + 1][0]) i++; return i; }
  function timecode(t) {
    var sec = t * 6.4, fr = Math.floor((sec % 1) * 24);
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return '00:' + two(Math.floor(sec / 60)) + ':' + two(Math.floor(sec % 60)) + ':' + two(fr);
  }
  function syncScenes() {
    var t = this.time();
    if (!els) {
      els = {
        arrival: $('[data-scene="arrival"]'), connection: $('[data-scene="connection"]'), dog: $('[data-scene="dog"]'),
        cat: $('[data-scene="cat"]'), ocean: $('[data-scene="ocean"]'),
        num: $('[data-hud-num]'), name: $('[data-hud-name]'), bar: $('[data-hud-bar]'), tc: $('[data-hud-tc]')
      };
    }
    els.arrival.inert = t > .9;
    els.connection.inert = t < 1.3 || t > 2.95;
    els.dog.inert = t < 4.6 || t > 5.9;
    els.cat.inert = true;
    els.ocean.inert = t < 12.4;
    // Pausa las animaciones CSS de lo que no está en cámara
    els.arrival.classList.toggle('is-paused', t > 1.6);
    els.ocean.classList.toggle('is-paused', t < 11.1);
    W.Aquarium.setActive(t > 11.15);
    // Rótulo del plano y código de tiempo
    var ch = chapterAt(t);
    if (ch !== lastChapter) {
      lastChapter = ch;
      els.num.textContent = '0' + (ch + 1);
      els.name.textContent = CHAPTERS[ch][1];
      gsap.fromTo(els.name, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out', overwrite: true });
    }
    els.bar.style.transform = 'scaleX(' + (t / END).toFixed(4) + ')';
    els.tc.textContent = timecode(t);
    var active = activeAt(t);
    if (lastActive !== 'shop' && !W.navOverride && active !== lastActive) {
      lastActive = active;
      $$('[data-nav] [data-goto]').forEach(function (a) {
        if (a.dataset.goto === active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    var theme = t < 1.2 ? 'arrival' : t < 3.75 ? 'connection' : t < 7.1 ? 'dog' : t < 11.7 ? 'cat' : 'ocean';
    if (meta && meta.content !== THEME[theme]) meta.content = THEME[theme];
  }

  /* -------------------------------------------- Navegación hacia una escena */
  function scrollToScene(name) {
    if (master && master.scrollTrigger) {
      var st = master.scrollTrigger;
      var y = st.start + (st.end - st.start) * (LABELS[name] / master.duration());
      window.scrollTo({ top: Math.round(y) + (name === 'arrival' ? 0 : 2), behavior: 'smooth' });
      return true;
    }
    return false;
  }

  /* --------------------------------------------- Modo estático (sin GSAP) */
  function staticMode() {
    root.classList.remove('is-cinematic');
    var ocean = $('[data-scene="ocean"]');
    if (W.motion.reduced) { W.Aquarium.renderStatic(); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        W.Aquarium.setActive(entries[0].isIntersecting);
        W.Aquarium.setHeroProgress(.62);
      }, { threshold: .05 }).observe(ocean);
    }
  }

  function collect() {
    $$('[data-actor]').forEach(function (el) {
      A[el.getAttribute('data-actor')] = {
        el: el,
        shadow: $('[data-shadow]', el),
        body: $('[data-body]', el),
        s: $('[data-layer="s"]', el),
        b1: $('[data-layer="b1"]', el),
        b2: $('[data-layer="b2"]', el)
      };
    });
  }

  // Estado de partida de todo lo que la línea de tiempo irá encadenando
  function initialState() {
    gsap.set(A.catWalk.el, pose('catWalk', 'enter'));
    gsap.set(A.catLeap.el, pose('catLeap', 'iris'));
    gsap.set(A.dogRun.el, Object.assign(pose('dogRun', 'far'), { autoAlpha: 0 }));
    gsap.set(A.dogRun.shadow, { opacity: 0 });
    gsap.set(A.dogBack.el, Object.assign(pose('dogBack', 'lens'), { autoAlpha: 0 }));
    gsap.set(A.catBack.el, Object.assign(pose('catBack', 'far'), { autoAlpha: 0 }));
    gsap.set([A.dogBack.s, A.dogBack.shadow], { opacity: 0 });
    gsap.set(A.dogBack.b2, { opacity: 1 });
    gsap.set('[data-scene="connection"]', { autoAlpha: 0, clipPath: 'circle(0px at 50% 50%)' });
    gsap.set('[data-scene="dog"]', { autoAlpha: 0 });
    gsap.set('[data-scene="ocean"]', { autoAlpha: 0, yPercent: 100 });
    // Lo que entra más tarde espera fuera de cuadro desde el primer fotograma
    gsap.set('[data-mega="cat"] .ch > span', { yPercent: 135 });
    gsap.set('.cat__title .line__in', { yPercent: 112 });
    gsap.set('.dog__headline .line__in', { yPercent: 115 });
    gsap.set('[data-cat-fade], [data-cat-cards] .cat-card, [data-hero-fade]', { autoAlpha: 0 });
  }

  W.Scenes = {
    scrollTo: function (name) { return scrollToScene(name); },
    prepare: function () {
      collect();
      if (W.motion.cinematic) {
        root.classList.add('is-cinematic');
        fitWords();
        layout();
        initialState();
      } else {
        fitWords();
      }
    },
    refit: function () {
      fitWords();
      if (W.motion.cinematic && !master) {
        layout();
        gsap.set(A.catWalk.el, pose('catWalk', 'enter'));
        gsap.set(A.catLeap.el, pose('catLeap', 'iris'));
        gsap.set(A.dogRun.el, pose('dogRun', 'far'));
      }
    },
    /* Vuelve a marcar en la barra la escena activa (tras salir de otra sección) */
    resyncNav: function () { lastActive = ''; if (master) syncScenes.call(master); },
    /* Índice de la escena activa de la historia: 0 gato, 1 perro, 2 encuentro y océano */
    activeIndex: function () {
      if (!master) return 0;
      var t = master.time();
      return t < 3.75 ? 0 : t < 10.05 ? 1 : 2;
    },
    staticMode: staticMode,
    /* Crea las marionetas de los animales (promesa; true si todas funcionan) */
    rig: function () { return W.motion.cinematic ? rigAll() : Promise.resolve(false); },
    intro: intro,
    /* Se llama al terminar la intro: crea el scroll y el movimiento ambiental */
    start: function () {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      ScrollTrigger.addEventListener('refreshInit', function () { fitWords(); layout(); });
      // El gato ya está en su sitio aunque la intro se haya acortado
      gsap.set(A.catWalk.el, pose('catWalk', 'plat'));
      if (A.catWalk.rig) { walkPhase(); A.catWalk.rig.p.gait = 0; }
      master = buildMaster();
      syncScenes.call(master);
      // Sin marioneta, al menos respira
      if (!A.dogRun.rig) gsap.to(A.dogRun.body, { scaleY: 1.006, scaleX: 1.002, duration: 1.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      parallax();
      gaze();
      ScrollTrigger.create({
        trigger: '#tienda',
        start: function () { return 'top ' + ($('[data-nav]').offsetHeight + 1); },
        end: 'max',
        onToggle: function (self) {
          var shopLink = $('[data-nav] a[href="#tienda"]');
          if (self.isActive) {
            $$('[data-nav] [aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
            shopLink.setAttribute('aria-current', 'true');
            lastActive = 'shop';
          } else {
            shopLink.removeAttribute('aria-current');
            lastActive = '';
            syncScenes.call(master);
          }
        }
      });
      ScrollTrigger.refresh();
    },
    destroy: function () {
      cleanups.forEach(function (fn) { fn(); });
      cleanups = [];
      if (master) { master.scrollTrigger.kill(); master.kill(); master = null; }
    }
  };
})(window.WILDPAW);
