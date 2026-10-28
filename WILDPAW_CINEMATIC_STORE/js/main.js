/* WILDPAW — arranque: carga, intro, menú, navegación y modos de movimiento. */
(function (W) {
  'use strict';

  var $ = W.$, $$ = W.$$;
  var NAV_KEYS = { ' ': 1, PageDown: 1, PageUp: 1, ArrowDown: 1, ArrowUp: 1, Home: 1, End: 1 };

  /* ---------------------------------------------------------- Menú móvil */
  function initMenu() {
    var btn = $('[data-menu-toggle]'), menu = $('[data-menu]');
    function set(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('.visually-hidden').textContent = open ? 'Cerrar menú' : 'Abrir menú';
      document.body.classList.toggle('menu-open', open);
      if (open) {
        var first = $('a', menu); if (first) first.focus();
        if (window.gsap && !W.motion.reduced) {
          gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: 'expo.out' });
          // opacity (no autoAlpha) para que los enlaces sigan siendo enfocables
          gsap.fromTo($$('a', menu), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .06, duration: .7, ease: 'expo.out', delay: .1 });
        }
      }
    }
    btn.addEventListener('click', function () { set(menu.hidden); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); }
    });
    W.closeMenu = function () { if (!menu.hidden) set(false); };
  }

  /* ----------------------------------------------- Enlaces entre escenas */
  function goShop(e) {
    if (e) e.preventDefault();
    var shop = $('#tienda');
    shop.scrollIntoView({ behavior: W.motion.reduced ? 'auto' : 'smooth', block: 'start' });
    var title = $('#shop-title');
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
  }

  function initLinks() {
    $$('[data-goto]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (W.closeMenu) W.closeMenu();
        if (W.Scenes.scrollTo(a.dataset.goto)) e.preventDefault();
      });
    });
    $$('a[href="#tienda"]').forEach(function (a) {
      a.addEventListener('click', function (e) { if (W.closeMenu) W.closeMenu(); W.CartUI.close(); goShop(e); });
    });
  }

  /* ------------------------------------------- Bloqueo de scroll en la intro */
  function blocker(e) {
    if (e.type === 'keydown' && !NAV_KEYS[e.key]) return;
    e.preventDefault();
  }
  function lockScroll(on) {
    var fn = on ? 'addEventListener' : 'removeEventListener';
    window[fn]('wheel', blocker, { passive: false });
    window[fn]('touchmove', blocker, { passive: false });
    window[fn]('keydown', blocker, { passive: false });
  }

  /* -------------------------------------------------------- Pantalla de carga */
  function runLoader(tasks) {
    var countEl = $('[data-loader-count]'), bar = $('[data-loader-bar]');
    var shown = { v: 0 }, done = 0;
    function paint() {
      countEl.textContent = Math.round(shown.v * 100);
      bar.style.transform = 'scaleX(' + shown.v.toFixed(3) + ')';
    }
    tasks.forEach(function (p) {
      p.then(function () {
        done++;
        gsap.to(shown, { v: done / tasks.length, duration: .5, ease: 'power2.out', onUpdate: paint });
      });
    });
    var all = Promise.all(tasks);
    var timeout = new Promise(function (r) { setTimeout(r, 7000); });
    var minTime = new Promise(function (r) { setTimeout(r, 900); });
    return Promise.all([Promise.race([all, timeout]), minTime]).then(function () {
      return new Promise(function (resolve) {
        gsap.to(shown, { v: 1, duration: .35, onUpdate: paint, onComplete: resolve });
      });
    });
  }

  function hideLoader() {
    var loader = $('.loader');
    loader.classList.add('is-done');
    return gsap.to(loader, {
      yPercent: -100, duration: 1.15, ease: 'expo.inOut',
      onComplete: function () { loader.style.display = 'none'; }
    });
  }

  function jumpToHash() {
    var h = (location.hash || '').slice(1);
    var map = { perros: 'dog', gatos: 'cat', acuaticos: 'ocean' };
    if (map[h] && map[h] !== 'dog') {
      W.Scenes.scrollTo(map[h]);
    } else if (h === 'tienda') {
      $('#tienda').scrollIntoView();
    }
  }

  /* ---------------------------------------------------------------- Inicio */
  function boot() {
    W.CartUI.init();
    W.Shop.init();
    initMenu();
    initLinks();
    W.Scenes.prepare();
    var aquarium = W.Aquarium.init();

    if (!W.motion.cinematic) {
      aquarium.then(function () { W.Scenes.staticMode(); });
      W.Chase.init();
      return;
    }

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    lockScroll(true);

    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var tasks = [
      fonts,
      W.loadImage('assets/img/dog-hero.webp'),
      W.loadImage('assets/img/cat-hero.webp'),
      aquarium,
      W.Living.init()
    ];
    runLoader(tasks).then(function () {
      W.Scenes.refit();            // re-ajusta tipografías ya con las fuentes cargadas
      hideLoader();
      var intro = W.Scenes.intro();
      intro.delay(.45);
      // Se habilita el scroll cuando la composición del héroe ya está montada
      gsap.delayedCall(2.5, function () {
        W.Scenes.start();
        W.Chase.init();
        W.FX.init();
        W.Shop.reveal();
        ScrollTrigger.refresh();
        lockScroll(false);
        jumpToHash();
      });
    });
  }

  boot();
})(window.WILDPAW);
