/* WILDPAW — dirección de movimiento con GSAP + ScrollTrigger.
   1) Intro del héroe (temporal).  2) Línea de tiempo maestra ligada al scroll:
   perro → portal → gato → inmersión → océano. Todo es reversible (scrub).
   Regla para evitar conflictos: el parallax del ratón usa x/y de los
   elementos .px; la intro y el scroll animan hijos u otras propiedades. */
(function (W) {
  'use strict';

  var $ = W.$, $$ = W.$$;
  var root = document.documentElement;
  var master = null;
  var cleanups = [];
  var LABELS = { dog: 0, cat: 3.35, ocean: 8.1 };
  var END = 10;

  var COLORS = {
    dog: { bg: '#F5E9D6', fg: '#201B17', accent: '#DF794C' },
    cat: { bg: '#173D32', fg: '#F5F4EF', accent: '#B7D5BC' },
    ocean: { bg: '#082E42', fg: '#F1F8F7', accent: '#37B9B1' }
  };

  /* --------------------------------------------------- Preparación de texto */
  function splitChars(el) {
    if (!el || el.dataset.split) return;
    var text = el.textContent;
    el.textContent = '';
    text.split('').forEach(function (c) {
      var o = document.createElement('span'); o.className = 'ch';
      var i = document.createElement('span'); i.textContent = c;
      o.appendChild(i); el.appendChild(o);
    });
    el.dataset.split = '1';
  }

  // Ajusta una palabra gigante al ancho disponible (mide y escala la fuente)
  function fit(el, ratio) {
    if (!el) return;
    var stage = $('[data-stage]');
    var avail = (stage ? stage.clientWidth : window.innerWidth) * ratio;
    var column = getComputedStyle(el).flexDirection === 'column';
    el.style.fontSize = '100px';
    // Se mide el texto (hijos), no la caja: la caja puede ocupar todo el ancho
    var widths = Array.prototype.map.call(el.children, function (c) { return c.getBoundingClientRect().width; });
    var widest = column ? Math.max.apply(null, widths) : widths.reduce(function (a, b) { return a + b; }, 0);
    if (widest) el.style.fontSize = (100 * avail / widest).toFixed(2) + 'px';
  }

  function fitWords() {
    fit($('[data-word]'), getComputedStyle($('[data-word]')).flexDirection === 'column' ? .9 : .95);
    fit($('[data-cat-word]'), .9);
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
      layers.forEach(function (l) { l.x(mx * l.d * -26); l.y(my * l.d * -16); });
    }, { passive: true }));
  }

  /* -------------------------------------------------- Movimiento ambiental */
  function ambient() {
    // Respiración sutil y deriva de cámara: es movimiento simulado sobre una
    // fotografía fija, no animación real del animal.
    gsap.to('[data-dog-img]', { scaleY: 1.012, scaleX: 1.004, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.cat__img', { scaleY: 1.01, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 100%' });
    gsap.fromTo('[data-toy]', { rotation: -8 }, { rotation: 8, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /* ------------------------------------------------------- Intro del héroe */
  function intro() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.dog-bg__glow', { autoAlpha: 0, scale: .7, duration: 2.2 }, 0)
      .from('[data-arch]', { scaleY: 0, transformOrigin: '50% 100%', duration: 1.6, ease: 'expo.inOut' }, 0)
      .from('[data-arch-line]', { scaleY: 0, transformOrigin: '50% 100%', duration: 1.9, ease: 'expo.inOut' }, .12)
      .from('.word .ch > span', { yPercent: 112, duration: 1.5, stagger: .055 }, .45)
      .from('[data-dog-intro]', { yPercent: 22, scale: 1.16, autoAlpha: 0, duration: 2.1 }, .6)
      .from('.dog__headline .line__in', { yPercent: 115, duration: 1.3, stagger: .12 }, 1.05)
      .from(['.dog__meta', '.dog__aside', '.scroll-cue'], { autoAlpha: 0, y: 24, duration: 1.1, stagger: .1 }, 1.3)
      .from('[data-badge]', { scale: 0, rotation: -140, duration: 1.5, ease: 'back.out(1.5)' }, 1.35)
      .from(['[data-dust]', '.bokeh'], { autoAlpha: 0, duration: 2 }, 1.1)
      .from('[data-nav]', { yPercent: -100, autoAlpha: 0, duration: 1.1 }, 1.0);
    return tl;
  }

  /* ---------------------------------------------- Portal: geometría del arco */
  function archClip() {
    var s = $('[data-stage]').getBoundingClientRect();
    var a = $('[data-arch]').getBoundingClientRect();
    var r = a.width / 2;
    return 'inset(' + (a.top - s.top).toFixed(1) + 'px ' + (s.right - a.right).toFixed(1) + 'px ' +
      Math.max(0, s.bottom - a.bottom).toFixed(1) + 'px ' + (a.left - s.left).toFixed(1) + 'px round ' +
      r.toFixed(1) + 'px ' + r.toFixed(1) + 'px 0px 0px)';
  }
  var FULL_CLIP = 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)';

  /* ------------------------------------------- Línea de tiempo del scroll */
  function buildMaster() {
    var small = window.innerWidth < 760;
    var bubbles = W.decor.bubbles(small ? 14 : 26);
    var heroProxy = { p: 0 };
    var depthProxy = { m: 12 };
    var depthEl = $('[data-depth-meter]');
    var catChars = $$('[data-cat-word] .ch > span');
    var wordChars = $$('.word .ch');

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '[data-story]',
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * (small ? 7 : 8.5)); },
        pin: '[data-stage]',
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      },
      onUpdate: syncScenes
    });

    tl.addLabel('dog', LABELS.dog).addLabel('cat', LABELS.cat).addLabel('ocean', LABELS.ocean);

    /* --- B · perro → gato ------------------------------------------------ */
    tl.to('[data-hero-line]', { y: -50, autoAlpha: 0, stagger: .1, duration: .55, ease: 'power2.in' }, .25)
      .to('[data-hero-fade]', { y: -24, autoAlpha: 0, stagger: .04, duration: .45, ease: 'power2.in' }, .2)
      .to('[data-badge] svg', { autoAlpha: 0, scale: .5, duration: .5, ease: 'power2.in' }, .3)
      .to('[data-arch-line]', { autoAlpha: 0, duration: .6 }, .35)
      .fromTo('[data-scene="cat"]', { autoAlpha: 0, clipPath: archClip }, { autoAlpha: 1, duration: .7, ease: 'power1.inOut' }, .35)
      .to('[data-scene="cat"]', { clipPath: FULL_CLIP, duration: 1.3, ease: 'power2.inOut' }, .9)
      // La cámara avanza hacia el portal y pasa por encima del perro: el
      // protagonista crece y sale del encuadre por abajo (sin fundirse con el gato)
      .to('[data-dog-cam]', { scale: 1.7, yPercent: 102, transformOrigin: '50% 0%', duration: 1.6, ease: 'power2.in' }, .45)
      .set('[data-dog-cam]', { autoAlpha: 0 }, 2.06)
      .to(wordChars, {
        x: function (i) { return (i - (wordChars.length - 1) / 2) * window.innerWidth * .09; },
        autoAlpha: 0, duration: 1.1, ease: 'power1.in'
      }, .5)
      .to(['[data-dust]', '.bokeh--b'], { autoAlpha: 0, duration: .7 }, .6)
      .to('.dog-bg__glow', { autoAlpha: 0, duration: .8 }, 1.1)
      .to(root, { '--bg': COLORS.cat.bg, duration: .8, ease: 'power1.inOut' }, 1.0)
      .to(root, { '--fg': COLORS.cat.fg, '--accent': COLORS.cat.accent, duration: .5 }, 1.3);

    // Entrada del gato desde un lateral, con tipografía por detrás
    tl.fromTo('[data-cat-move]', { x: function () { return window.innerWidth * (small ? .8 : .75); }, rotation: 6, scale: 1.12 },
      { x: 0, rotation: 0, scale: 1, duration: 1.5, ease: 'power2.out' }, 1.55)
      .fromTo(catChars, { yPercent: 108 }, { yPercent: 0, duration: .9, stagger: .07, ease: 'power3.out' }, 1.95)
      .fromTo('.cat__kicker .line__in', { yPercent: 110 }, { yPercent: 0, duration: .6, ease: 'power3.out' }, 2.15)
      .fromTo('[data-cat-sub] .line__in', { yPercent: 110 }, { yPercent: 0, duration: .6, ease: 'power3.out' }, 2.6)
      .fromTo('[data-leaves="back"] svg', { x: function (i) { return (i % 2 ? 1 : -1) * window.innerWidth * .14; }, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, 1.45)
      .fromTo('[data-leaves="front"] svg', { scale: 1.35, x: function (i) { return (i ? 1 : -1) * window.innerWidth * .16; } },
        { scale: 1, x: 0, duration: 1.4, ease: 'power2.out' }, 1.7)
      .fromTo('[data-toy]', { yPercent: -70 }, { yPercent: 0, duration: .9, ease: 'back.out(1.4)' }, 2.35)
      .fromTo('[data-motes]', { autoAlpha: 0 }, { autoAlpha: 1, duration: .8 }, 2.1)
      .fromTo('.scene--cat .scene-index', { autoAlpha: 0 }, { autoAlpha: .8, duration: .4 }, 2.7);

    /* --- C · mundo gato: productos y encuadre ---------------------------- */
    tl.fromTo('[data-cat-cards] .cat-card', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, stagger: .22, ease: 'power3.out' }, 3.1)
      .to('[data-cat-cam]', { scale: 1.08, xPercent: -3, duration: 2.6 }, 3.0)
      .to('[data-cat-word]', { xPercent: 2, duration: 2.6 }, 3.0)
      .to('[data-leaves="front"] svg', { yPercent: -10, duration: 2.6 }, 3.0)
      .to('[data-leaves="back"] svg', { yPercent: 6, duration: 2.6 }, 3.0);

    /* --- D · inmersión: gato → océano ------------------------------------ */
    tl.to('[data-cat-cards] .cat-card', { y: -40, autoAlpha: 0, duration: .4, stagger: .08, ease: 'power2.in' }, 5.15)
      .to('.cat__shade', { opacity: .6, duration: 1.3 }, 5.3)
      .to(root, { '--bg': COLORS.ocean.bg, duration: 1.2 }, 5.7)
      .fromTo('[data-scene="ocean"]', { yPercent: 120 }, { yPercent: 0, duration: 1.7, ease: 'power2.inOut' }, 5.55)
      .to('[data-cat-move]', { yPercent: -8, scale: .93, duration: 1.6, ease: 'power1.in' }, 5.6)
      .to('[data-cat-word]', { yPercent: -30, autoAlpha: .2, duration: 1.6, ease: 'power1.in' }, 5.6)
      .to(root, { '--accent': COLORS.ocean.accent, '--fg': COLORS.ocean.fg, duration: .5 }, 6.4);

    bubbles.forEach(function (b, i) {
      tl.fromTo(b, { y: 0, autoAlpha: 0, scale: .4 },
        { y: function () { return -window.innerHeight * W.rand(.5, 1.15); }, autoAlpha: 1, scale: 1, duration: W.rand(.9, 1.5), ease: 'power1.out' },
        5.75 + (i / bubbles.length) * .9);
      tl.to(b, { autoAlpha: 0, duration: .3 }, '>-0.3');
    });

    /* --- E · mundo acuático ---------------------------------------------- */
    tl.fromTo('.ocean__title .line__in', { yPercent: 112 }, { yPercent: 0, duration: .8, stagger: .18, ease: 'power3.out' }, 6.9)
      .fromTo('.ocean__rays', { autoAlpha: 0 }, { autoAlpha: 1, duration: .8 }, 6.7)
      .fromTo('[data-seabed] svg', { yPercent: 35 }, { yPercent: 0, duration: 1.1, ease: 'power2.out' }, 6.6)
      .fromTo('[data-grass-front] svg', { yPercent: 45 }, { yPercent: 0, duration: 1.1, ease: 'power2.out' }, 6.8)
      .fromTo('[data-ocean-cta]', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: 'power2.out' }, 8.6)
      .fromTo('.scene--ocean .scene-index, .ocean__depth', { autoAlpha: 0 }, { autoAlpha: 1, duration: .5 }, 7.2)
      .to('[data-ocean-title]', { scale: 1.06, duration: 2.6 }, 7.4)
      .to(heroProxy, { p: 1, duration: 2.7, onUpdate: function () { W.Aquarium.setHeroProgress(heroProxy.p); } }, 7.2)
      .to(depthProxy, { m: 38, duration: 3, onUpdate: function () { if (depthEl) depthEl.textContent = '-' + Math.round(depthProxy.m); } }, 7.0)
      .set({}, {}, END);

    return tl;
  }

  /* ----------------------------------- Escena activa: inert, nav, acuario */
  var lastActive = '';
  var els = null;
  function syncScenes() {
    var t = this.time();
    if (!els) els = { dog: $('[data-scene="dog"]'), dogBg: $('.dog-bg'), cat: $('[data-scene="cat"]'), ocean: $('[data-scene="ocean"]') };
    var dogScene = els.dog, catScene = els.cat, oceanScene = els.ocean;
    dogScene.inert = t > 1.4;
    // Pausa las animaciones CSS de lo que no está en cámara
    dogScene.classList.toggle('is-paused', t > 2.1);
    els.dogBg.classList.toggle('is-paused', t > 2.1);
    catScene.classList.toggle('is-paused', t < .3 || t > 7.3);
    oceanScene.classList.toggle('is-paused', t < 5.4);
    catScene.inert = t < 1.9 || t > 6.3;
    oceanScene.inert = t < 6.6;
    W.Aquarium.setActive(t > 5.5);
    var active = t < 1.6 ? 'dog' : t < 6.4 ? 'cat' : 'ocean';
    if (lastActive !== 'shop' && active !== lastActive) {
      lastActive = active;
      $$('[data-nav] [data-goto]').forEach(function (a) {
        if (a.dataset.goto === active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = COLORS[active].bg;
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
    $('[data-nav]').classList.add('is-solid');
    var ocean = $('[data-scene="ocean"]');
    if (W.motion.reduced) { W.Aquarium.renderStatic(); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        W.Aquarium.setActive(entries[0].isIntersecting);
        W.Aquarium.setHeroProgress(.62);
      }, { threshold: .05 }).observe(ocean);
    }
  }

  W.Scenes = {
    scrollTo: function (name) { return scrollToScene(name); },
    prepare: function () {
      splitChars($('[data-cat-word]'));
      W.decor.leaves();
      W.decor.particles(W.motion.lowPower);
      W.decor.seabed();
      if (W.motion.cinematic) {
        root.classList.add('is-cinematic');
        gsap.set('[data-scene="ocean"]', { yPercent: 120 });
      }
      fitWords();
    },
    refit: fitWords,
    staticMode: staticMode,
    intro: intro,
    /* Se llama al terminar la intro: crea el scroll y el movimiento ambiental */
    start: function () {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      ScrollTrigger.addEventListener('refreshInit', fitWords);
      master = buildMaster();
      syncScenes.call(master);
      ambient();
      parallax();
      ScrollTrigger.create({
        trigger: '#tienda',
        start: function () { return 'top ' + ($('[data-nav]').offsetHeight + 1); },
        end: 'max',
        toggleClass: { targets: '[data-nav]', className: 'is-solid' },
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
