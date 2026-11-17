/* WILDPAW — dirección de movimiento con GSAP + ScrollTrigger.

   Toda la historia ocurre en un único estudio blanco y la "cámara" es el
   scroll. Los animales son fotografías fijas, así que solo se mueven como
   puede moverse una foto sin delatarse: acercándose o alejándose en el eje
   de la cámara (escala alrededor de un punto), con desenfoque de proximidad
   horneado y su sombra en una capa propia. Los cambios de pose se esconden:
     · en el objetivo — el animal cruza la cámara y su pelaje tapa el encuadre;
     · en la distancia — el gato se da la vuelta cuando es muy pequeño.
   Todo es reversible (scrub). Reglas para evitar conflictos:
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
  var LABELS = { dog: 0, cat: 5.75, ocean: 10.35 };
  var END = 11.6;
  var THEME = { dog: '#FFFFFF', cat: '#FFFFFF', ocean: '#EAF6FF' };

  /* Pivote de cada actor (el mismo que transform-origin en el CSS), proporción
     del lienzo y altura de la línea de apoyo dentro del lienzo */
  var CAST = {
    dogRun: { ar: 983 / 1143, px: .54, py: .46, foot: .92 },
    dogBack: { ar: 988 / 1179, px: .52, py: .42, foot: .92 },
    catBack: { ar: 1031 / 1196, px: .50, py: .50, foot: .95 },
    catLeap: { ar: 894 / 1402, px: .60, py: .42, foot: .90 }
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
    function stand(key, cx, footY, size) {
      var c = CAST[key];
      return [cx + (c.px - .5) * c.ar * size / k, footY - (c.foot - c.py) * size, size];
    }

    var raw;
    if (!portrait) {
      raw = {
        dogRun: { far: null, hero: stand('dogRun', .56, .93, .84), lens: [.52, .53, 6.2] },
        dogBack: { lens: [.50, .50, 5.2], bridge: stand('dogBack', .67, .90, .60), exit: [1.95, 1.0, 2.6] },
        catBack: { far: [.36, .475, .12], plat: stand('catBack', .47, .935, .72), far2: [.50, .44, .07] },
        catLeap: { far2: [.505, .436, .082], lens: [.50, .50, 5.6] }
      };
    } else {
      var dogH = Math.min(.56, 1.0 * k / CAST.dogRun.ar);
      var catH = Math.min(.42, .9 * k / CAST.catBack.ar);
      raw = {
        dogRun: { far: null, hero: stand('dogRun', .52, .745, dogH), lens: [.50, .52, 5.2] },
        dogBack: { lens: [.50, .50, 4.6], bridge: stand('dogBack', .60, .80, Math.min(.44, 1.0 * k / CAST.dogBack.ar)), exit: [3.2, 1.0, 2.2] },
        catBack: { far: [.20, .33, .085], plat: stand('catBack', .50, .64, catH), far2: [.50, .40, .052] },
        catLeap: { far2: [.505, .397, .061], lens: [.50, .50, 4.8] }
      };
    }
    // El perro entra desde lejos por el mismo eje: mismo pivote, escala mínima
    raw.dogRun.far = [raw.dogRun.hero[0], raw.dogRun.hero[1], portrait ? .05 : .06];

    var poses = {};
    Object.keys(raw).forEach(function (key) {
      var c = CAST[key];
      poses[key] = {};
      Object.keys(raw[key]).forEach(function (name) {
        var p = raw[key][name];
        poses[key][name] = { x: p[0] * w - c.px * c.ar * h, y: p[1] * h - c.py * h, s: p[2] };
      });
    });
    L = { w: w, h: h, portrait: portrait, poses: poses };
    return L;
  }

  function pose(key, name) {
    return {
      x: function () { return L.poses[key][name].x; },
      y: function () { return L.poses[key][name].y; },
      scale: function () { return L.poses[key][name].s; }
    };
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

  // Tramo del movimiento propio de un actor (marcha, velocidad, extensión)
  function gait(tl, key, from, to, at, dur, ease) {
    to = Object.assign({ duration: dur, ease: ease || 'power1.inOut', immediateRender: false }, to);
    return tl.fromTo(mo(key), from, to, at);
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
      fit(el, getComputedStyle(el).flexDirection === 'column' ? .9 : .95);
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

  /* ------------------------------------------------------- Intro del héroe */
  function intro() {
    var a = A.dogRun;
    var to = pose('dogRun', 'hero');
    to.duration = 1.7; to.ease = 'expo.out';
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    // El perro llega corriendo desde el fondo; la cámara retrocede a su paso
    tl.fromTo(a.el, pose('dogRun', 'far'), to, .1)
      .fromTo(a.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .25, ease: 'none' }, .1)
      .add(a.rig
        // Llega a toda velocidad y, al alcanzar su sitio, baja a un trote
        ? gsap.fromTo(a.rig.p, { gait: 1, speed: 1.35 }, { gait: GAIT0.dogRun.gait, speed: GAIT0.dogRun.speed, duration: 1.4, ease: 'power2.inOut' })
        : gsap.to(a.body, { yPercent: -2.2, duration: .13, ease: 'sine.out', yoyo: true, repeat: 9 }), a.rig ? .9 : .1)
      .fromTo(a.shadow, { opacity: 0 }, { opacity: 1, duration: .9, ease: 'power1.out' }, .5)
      .from('[data-mega="dog"] .ch > span', { yPercent: 135, duration: 1.2, stagger: .05 }, .35)
      .from('.dog__headline .line__in', { yPercent: 115, duration: 1.1, stagger: .12 }, .95)
      .from('[data-hero-fade]', { autoAlpha: 0, y: 18, duration: .9, stagger: .07 }, 1.15)
      .from('[data-nav]', { yPercent: -120, autoAlpha: 0, duration: 1 }, .9);
    return tl;
  }

  /* ------------------------------------------- Línea de tiempo del scroll */
  function buildMaster() {
    var small = L.portrait;
    var bubbles = W.decor.bubbles(small ? 14 : 26);
    var heroProxy = { p: 0 };
    var depthProxy = { m: 12 };
    var depthEl = $('[data-depth-meter]');
    var megaDog = $('[data-mega="dog"]');
    var catLetters = $$('[data-mega="cat"] .ch > span');
    var washDog = $('[data-wash="dog"]'), washCat = $('[data-wash="cat"]');
    var ocean = $('[data-scene="ocean"]');

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '[data-story]',
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * (L.portrait ? 8.2 : 9.6)); },
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
    tl.addLabel('dog', LABELS.dog).addLabel('cat', LABELS.cat).addLabel('ocean', LABELS.ocean);

    /* === A · El perro alcanza la cámara y la atraviesa (0.35 → 1.95) ======= */
    tl.fromTo('.dog__headline .line__in', { yPercent: 0 }, { yPercent: -115, duration: .5, stagger: .07, ease: 'power2.in', immediateRender: false }, .35)
      .fromTo('[data-hero-fade]', { y: 0, autoAlpha: 1 }, { y: -16, autoAlpha: 0, duration: .4, stagger: .04, ease: 'power2.in', immediateRender: false }, .35);
    travel(tl, 'dogRun', 'hero', 'lens', .45, 1.5);
    tl.fromTo(megaDog, { scale: 1, yPercent: 0 }, { scale: 1.07, yPercent: -3, duration: 1.5, ease: 'power1.in', immediateRender: false }, .45);
    fade(tl, A.dogRun.shadow, 1, 0, .9, .4);
    defocus(tl, 'dogRun', 1.0, .17);
    tl.fromTo(washDog, { autoAlpha: 0 }, { autoAlpha: 1, duration: .32, ease: 'power1.in', immediateRender: false }, 1.58)
      .fromTo($('i', washDog), { xPercent: 7, scale: 1 }, { xPercent: -7, scale: 1.18, duration: .8 }, 1.55);

    // Se lanza hacia la cámara: del trote al galope
    gait(tl, 'dogRun', { gait: GAIT0.dogRun.gait, speed: GAIT0.dogRun.speed }, { gait: 1, speed: 1.35 }, .45, .7);

    /* --- Corte oculto: con el encuadre tapado se cambia de plano ---------- */
    tl.set(A.dogRun.el, { autoAlpha: 0 }, 1.95)
      .set(megaDog, { autoAlpha: 0 }, 1.95)
      .set([A.dogBack.el, A.catBack.el], { autoAlpha: 1 }, 1.95);

    /* === B · Contraplano: el perro se aleja; al fondo, el gato (1.95 → 3.75) */
    travel(tl, 'dogBack', 'lens', 'bridge', 1.95, 1.25);
    tl.fromTo(washDog, { autoAlpha: 1 }, { autoAlpha: 0, duration: .34, ease: 'power1.out', immediateRender: false }, 1.98);
    refocus(tl, 'dogBack', 2.25, .16);
    fade(tl, A.dogBack.shadow, 0, 1, 2.6, .5);
    tl.set('[data-bridge]', { autoAlpha: 1 }, 2.7)
      .fromTo('[data-bridge] .line__in', { yPercent: 112 }, { yPercent: 0, duration: .5, ease: 'power3.out' }, 2.7)
      .fromTo('[data-bridge] .line__in', { yPercent: 0 }, { yPercent: -112, duration: .35, ease: 'power2.in', immediateRender: false }, 3.7);

    // Se para a mirarte ("Keep up.") moviendo la cola, y arranca otra vez al trote
    gait(tl, 'dogBack', { gait: 1, speed: 1 }, { gait: .2, speed: .8 }, 2.9, .4);
    gait(tl, 'dogBack', { gait: .2, speed: .8 }, { gait: 1, speed: 1.45 }, 3.7, .25);

    /* === C · Dolly: la cámara adelanta al perro y alcanza al gato (3.75 → 5.05) */
    travel(tl, 'dogBack', 'bridge', 'exit', 3.75, 1.1, 'power2.in');
    fade(tl, A.dogBack.shadow, 1, 0, 3.85, .3);
    defocus(tl, 'dogBack', 3.95, .13);
    tl.set(A.dogBack.el, { autoAlpha: 0 }, 4.9);
    travel(tl, 'catBack', 'far', 'plat', 3.75, 1.3, 'power2.inOut');
    tl.fromTo(catLetters, { yPercent: 135 }, { yPercent: 0, duration: .6, stagger: .05, ease: 'power3.out' }, 4.5)
      .fromTo('.cat__title .line__in', { yPercent: 112 }, { yPercent: 0, duration: .5, stagger: .1, ease: 'power3.out' }, 4.95)
      .fromTo('[data-cat-fade]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .4, stagger: .08, ease: 'power2.out' }, 5.05)
      .fromTo('[data-cat-cards] .cat-card', { y: 46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45, stagger: .18, ease: 'power3.out' }, 5.15);

    // El gato camina y se detiene, curioso, cuando la cámara lo alcanza
    gait(tl, 'catBack', { gait: GAIT0.catBack.gait }, { gait: 0 }, 4.75, .4);

    /* --- Meseta del gato: empuje muy lento de cámara ----------------------- */
    tl.fromTo(A.catBack.body, { scale: 1 }, { scale: 1.035, duration: 1.5 }, 5.1)
      .fromTo('[data-mega="cat"]', { xPercent: 0 }, { xPercent: -1.2, duration: 1.5 }, 5.1);

    /* === D · El gato se aleja, se gira a lo lejos y salta al objetivo ====== */
    tl.fromTo('[data-cat-cards] .cat-card', { y: 0, autoAlpha: 1 }, { y: -28, autoAlpha: 0, duration: .32, stagger: .06, ease: 'power2.in', immediateRender: false }, 6.5)
      .fromTo('.cat__title .line__in', { yPercent: 0 }, { yPercent: -112, duration: .4, stagger: .06, ease: 'power2.in', immediateRender: false }, 6.55)
      .fromTo('[data-cat-fade]', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, duration: .3, ease: 'power2.in', immediateRender: false }, 6.5)
      .fromTo(A.catBack.body, { scale: 1.035 }, { scale: 1, duration: .4, immediateRender: false }, 6.62);
    travel(tl, 'catBack', 'plat', 'far2', 6.65, .97, 'power2.inOut');
    gait(tl, 'catBack', { gait: 0 }, { gait: .9 }, 6.5, .3);
    // En el aire estira las patas hacia la cámara y la cola se queda atrás
    gait(tl, 'catLeap', { extend: 0 }, { extend: 1 }, 7.62, .8, 'power1.out');
    tl.fromTo(catLetters, { yPercent: 0 }, { yPercent: -135, duration: .5, stagger: .04, ease: 'power2.in', immediateRender: false }, 7.75)
      .set(A.catBack.el, { autoAlpha: 0 }, 7.62)
      .set(A.catLeap.el, { autoAlpha: 1 }, 7.62);
    travel(tl, 'catLeap', 'far2', 'lens', 7.62, 1.13);
    tl.fromTo(A.catLeap.body, { yPercent: 0 }, { yPercent: -9, duration: .55, ease: 'power2.out' }, 7.62)
      .fromTo(A.catLeap.body, { yPercent: -9 }, { yPercent: -3, duration: .55, ease: 'power1.in', immediateRender: false }, 8.2);
    fade(tl, A.catLeap.shadow, 1, 0, 8.05, .3);
    defocus(tl, 'catLeap', 8.36, .08);
    tl.fromTo(washCat, { autoAlpha: 0 }, { autoAlpha: 1, duration: .28, ease: 'power1.in', immediateRender: false }, 8.45)
      .fromTo($('i', washCat), { scale: 1 }, { scale: 1.25, duration: .8 }, 8.4);

    /* --- Corte oculto: bajo el pelaje, la cámara cae al agua --------------- */
    tl.set(A.catLeap.el, { autoAlpha: 0 }, 8.76)
      .set(ocean, { autoAlpha: 1 }, 8.76)
      .fromTo(washCat, { autoAlpha: 1 }, { autoAlpha: 0, duration: .26, ease: 'power2.out', immediateRender: false }, 8.8);

    bubbles.forEach(function (b, i) {
      tl.fromTo(b, { y: 0, autoAlpha: 0, scale: .4 },
        { y: function () { return -window.innerHeight * W.rand(.55, 1.2); }, autoAlpha: 1, scale: 1, duration: W.rand(.7, 1.3), ease: 'power1.out' },
        8.8 + (i / bubbles.length) * .7);
      tl.to(b, { autoAlpha: 0, duration: .25 }, '>-0.25');
    });

    /* === E · Mundo acuático ================================================ */
    tl.fromTo('.ocean__title .line__in', { yPercent: 112 }, { yPercent: 0, duration: .7, stagger: .15, ease: 'power3.out' }, 9.05)
      .fromTo('[data-ocean-fade]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .4, stagger: .1, ease: 'power2.out' }, 9.4)
      .fromTo('[data-ocean-cta]', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: 'power2.out' }, 10.25)
      .fromTo('[data-ocean-title]', { scale: 1 }, { scale: 1.05, duration: 2.1 }, 9.5)
      .to(heroProxy, { p: 1, duration: 2.2, onUpdate: function () { W.Aquarium.setHeroProgress(heroProxy.p); } }, 9.3)
      .to(depthProxy, { m: 38, duration: 2.6, onUpdate: function () { if (depthEl) depthEl.textContent = '-' + Math.round(depthProxy.m); } }, 9.0)
      .set({}, {}, END);

    return tl;
  }

  /* ----------------------------------- Escena activa: inert, nav, acuario */
  var lastActive = '';
  var els = null;
  function activeAt(t) { return t < 3.9 ? 'dog' : t < 8.76 ? 'cat' : 'ocean'; }
  function syncScenes() {
    var t = this.time();
    if (!els) els = { dog: $('[data-scene="dog"]'), cat: $('[data-scene="cat"]'), ocean: $('[data-scene="ocean"]') };
    els.dog.inert = t > 1.2;
    els.cat.inert = t < 4.9 || t > 6.9;
    els.ocean.inert = t < 9.0;
    // Pausa las animaciones CSS de lo que no está en cámara
    els.dog.classList.toggle('is-paused', t > 1.95);
    els.ocean.classList.toggle('is-paused', t < 8.7);
    W.Aquarium.setActive(t > 8.7);
    var active = activeAt(t);
    if (lastActive !== 'shop' && !W.navOverride && active !== lastActive) {
      lastActive = active;
      $$('[data-nav] [data-goto]').forEach(function (a) {
        if (a.dataset.goto === active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = THEME[active];
    }
  }

  /* -------------------------------------------- Navegación hacia una escena */
  function scrollToScene(name) {
    if (master && master.scrollTrigger) {
      var st = master.scrollTrigger;
      var y = st.start + (st.end - st.start) * (LABELS[name] / master.duration());
      window.scrollTo({ top: Math.round(y) + (name === 'dog' ? 0 : 2), behavior: 'smooth' });
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

  /* Movimiento propio de cada animal (js/rig.js). Si no hay WebGL, un objeto
     vacío recibe las mismas animaciones y no pasa nada. */
  var GAIT0 = { dogRun: { gait: .6, speed: .85 }, dogBack: { gait: 1, speed: 1 }, catBack: { gait: .6, speed: 1 }, catLeap: { gait: 0, extend: 0 } };
  function mo(key) { return (A[key] && A[key].rig) ? A[key].rig.p : (A[key].mo || (A[key].mo = { gait: 0, speed: 1, extend: 0, boost: 0 })); }
  var POSE = { dogRun: 'dog-run', dogBack: 'dog-back', catBack: 'cat-back', catLeap: 'cat-leap' };
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
    gsap.set(A.dogRun.el, pose('dogRun', 'hero'));
    gsap.set(A.dogBack.el, Object.assign(pose('dogBack', 'lens'), { autoAlpha: 0 }));
    gsap.set(A.catBack.el, Object.assign(pose('catBack', 'far'), { autoAlpha: 0 }));
    gsap.set(A.catLeap.el, Object.assign(pose('catLeap', 'far2'), { autoAlpha: 0 }));
    gsap.set([A.dogBack.s, A.dogBack.shadow], { opacity: 0 });
    gsap.set(A.dogBack.b2, { opacity: 1 });
    gsap.set('[data-scene="ocean"]', { autoAlpha: 0 });
    // El acto del gato espera fuera de cuadro desde el primer fotograma
    gsap.set('[data-mega="cat"] .ch > span', { yPercent: 135 });
    gsap.set('.cat__title .line__in', { yPercent: 112 });
    gsap.set('[data-cat-fade], [data-cat-cards] .cat-card', { autoAlpha: 0 });
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
      if (W.motion.cinematic && !master) { layout(); gsap.set(A.dogRun.el, pose('dogRun', 'hero')); }
    },
    /* Vuelve a marcar en la barra la escena activa (tras salir de otra sección) */
    resyncNav: function () { lastActive = ''; if (master) syncScenes.call(master); },
    /* Índice de la escena activa de la historia: 0 perro, 1 gato, 2 océano */
    activeIndex: function () {
      if (!master) return 0;
      var a = activeAt(master.time());
      return a === 'dog' ? 0 : a === 'cat' ? 1 : 2;
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
      master = buildMaster();
      syncScenes.call(master);
      // Sin marioneta, al menos respira
      if (!A.dogRun.rig) gsap.to(A.dogRun.body, { scaleY: 1.006, scaleX: 1.002, duration: 1.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      parallax();
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
