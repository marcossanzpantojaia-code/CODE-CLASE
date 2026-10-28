/* WILDPAW — microinteracciones: cursor propio, botones magnéticos, barra de
   progreso por escenas y toques en el agua. Solo con ratón y sin movimiento
   reducido; en táctil o con movimiento reducido no se activa nada de esto. */
(function (W) {
  'use strict';

  var $ = W.$, $$ = W.$$;

  /* ------------------------------------------------------------- Cursor */
  function cursor() {
    var el = document.createElement('div');
    el.className = 'cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"><span class="cursor__label"></span></span>';
    document.body.appendChild(el);
    document.documentElement.classList.add('has-cursor');
    var dot = $('.cursor__dot', el), ring = $('.cursor__ring', el), label = $('.cursor__label', el);
    var dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3.out' });
    var dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3.out' });
    var rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3.out' });
    var ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3.out' });

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      el.classList.add('is-visible');
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { el.classList.remove('is-visible'); });
    window.addEventListener('pointerdown', function () { el.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { el.classList.remove('is-down'); });

    document.addEventListener('pointerover', function (e) {
      var hot = e.target.closest('a, button, [data-cursor]');
      el.classList.toggle('is-hover', !!hot);
      var text = hot && hot.getAttribute('data-cursor');
      label.textContent = text || '';
      el.classList.toggle('has-label', !!text);
    });
  }

  /* --------------------------------------------------- Botones magnéticos */
  // Se mueve el contenido del botón, no el botón: así no choca con las
  // animaciones de entrada/scroll que ya usan su transform.
  function magnetic() {
    $$('.btn, .nav__cart, .product__add, .cat-card__add, .filter, .nav__burger').forEach(function (btn) {
      var kids = Array.prototype.slice.call(btn.children);
      if (!kids.length) return;
      var movers = kids.map(function (k, i) {
        return { x: gsap.quickTo(k, 'x', { duration: .5, ease: 'power3.out' }), y: gsap.quickTo(k, 'y', { duration: .5, ease: 'power3.out' }), f: i === kids.length - 1 ? .35 : .18 };
      });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2), my = e.clientY - (r.top + r.height / 2);
        movers.forEach(function (m) { m.x(mx * m.f); m.y(my * m.f); });
      });
      btn.addEventListener('pointerleave', function () {
        kids.forEach(function (k) { gsap.to(k, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)', overwrite: true }); });
      });
    });
  }

  /* ------------------------------------------- Barra de progreso por escenas */
  function rail() {
    var el = document.createElement('div');
    el.className = 'rail';
    el.setAttribute('aria-hidden', 'true');
    // Textos como contenido CSS (attr): la barra es decorativa y está oculta a lectores de pantalla
    el.innerHTML = '<span class="rail__num" data-rail-num data-text="01"></span><span class="rail__track"><i data-rail-fill></i></span><span class="rail__total" data-text="05"></span><span class="rail__name" data-rail-name data-text="Perros"></span>';
    document.body.appendChild(el);
    var fill = $('[data-rail-fill]', el), num = $('[data-rail-num]', el), name = $('[data-rail-name]', el);
    var NAMES = ['Perros', 'Gatos', 'Acuáticos', 'Persecución', 'Tienda'];
    var last = -1;
    function current() {
      var st = ScrollTrigger.getAll().filter(function (s) { return s.pin; });
      var story = st[0], y = window.scrollY;
      if (!story) return 0;
      if (y < story.end - 2) {
        var t = (y - story.start) / (story.end - story.start) * 10;
        return t < 1.6 ? 0 : t < 6.4 ? 1 : 2;
      }
      var shop = $('#tienda');
      return y + window.innerHeight * .5 < shop.getBoundingClientRect().top + y ? 3 : 4;
    }
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.transform = 'scaleY(' + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ')';
      var i = current();
      if (i !== last) {
        last = i;
        num.setAttribute('data-text', '0' + (i + 1));
        name.setAttribute('data-text', NAMES[i]);
        gsap.fromTo([num, name], { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .5, ease: 'power3.out', overwrite: true });
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------------------------------------------------- Tocar el agua */
  function splash() {
    var water = $('.ocean__inner');
    if (!water) return;
    water.setAttribute('data-cursor', 'Toca el agua');
    water.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      var r = water.getBoundingClientRect();
      W.Aquarium.splash(e.clientX - r.left, e.clientY - r.top);
    });
  }

  W.FX = {
    init: function () {
      if (!W.motion.cinematic) return;
      splash();
      if (!W.motion.finePointer) return;
      cursor();
      magnetic();
      rail();
    }
  };
})(window.WILDPAW);
