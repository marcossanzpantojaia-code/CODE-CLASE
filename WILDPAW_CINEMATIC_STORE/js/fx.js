/* WILDPAW — microinteracciones: puntero propio, botones magnéticos, puntos de
   progreso y toques en el agua. Solo con ratón y sin movimiento
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

  /* ------------------------------------ Progreso: puntos de página laterales */
  function rail() {
    var el = document.createElement('div');
    el.className = 'rail';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
    document.body.appendChild(el);
    var dots = $$('i', el);
    var story = $('[data-story]'), duo = $('#juntos'), shop = $('#tienda');
    var last = -1;
    function current() {
      var mid = window.innerHeight * .5;
      if (shop.getBoundingClientRect().top < mid) return 4;
      if (duo && duo.getBoundingClientRect().top < mid) return 3;
      return story.getBoundingClientRect().bottom > mid ? W.Scenes.activeIndex() : 3;
    }
    function update() {
      var i = current();
      if (i === last) return;
      last = i;
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
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
