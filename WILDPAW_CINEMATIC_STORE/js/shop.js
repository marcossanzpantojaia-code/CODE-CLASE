/* WILDPAW — catálogo: filtros, tarjetas y tarjetas flotantes de la escena gato. */
(function (W) {
  'use strict';

  var PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var labels = { perros: 'Perros', gatos: 'Gatos', acuaticos: 'Acuáticos' };
  var current = 'todos';

  function addFeedback(btn, product) {
    W.Cart.add(product.id, 1);
    W.toast('Añadido al carrito: ' + product.name);
    var label = btn.querySelector('[data-label]');
    if (label) {
      btn.classList.add('is-added');
      label.textContent = 'Añadido';
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { btn.classList.remove('is-added'); label.textContent = 'Añadir'; }, 1400);
    }
    var badge = W.$('[data-cart-count]');
    if (badge && window.gsap && !W.motion.reduced) {
      var source = btn.closest('li').querySelector('img');
      flyToCart(source, badge, function () {
        gsap.fromTo(badge, { scale: 1.6 }, { scale: 1, duration: .8, ease: 'elastic.out(1, .4)' });
      });
    }
  }

  /* El producto "vuela" en arco hasta el contador del carrito */
  function flyToCart(img, target, done) {
    if (!img) { done(); return; }
    var a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    var ghost = img.cloneNode();
    ghost.alt = '';
    ghost.className = 'fly';
    ghost.style.left = a.left + 'px';
    ghost.style.top = a.top + 'px';
    ghost.style.width = a.width + 'px';
    ghost.style.height = a.height + 'px';
    document.body.appendChild(ghost);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2);
    var dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var tl = gsap.timeline({ onComplete: function () { ghost.remove(); done(); } });
    tl.to(ghost, { x: dx, duration: .85, ease: 'power2.inOut' }, 0)
      .to(ghost, { y: dy, duration: .85, ease: 'back.in(1.6)' }, 0)
      .to(ghost, { scale: .08, rotation: 25, duration: .85, ease: 'power2.in' }, 0)
      .to(ghost, { autoAlpha: 0, duration: .15 }, .72);
  }

  /* Inclinación 3D de las tarjetas y brillo que sigue al ratón */
  function tilt(li) {
    if (!window.gsap || W.motion.reduced || !W.motion.finePointer) return;
    var card = li.querySelector('.product__card');
    var rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3.out' });
    var ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - .5) * 10);
      rx((.5 - py) * 8);
      card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerenter', function () { gsap.to(card, { y: -8, duration: .6, ease: 'power3.out' }); });
    card.addEventListener('pointerleave', function () { rx(0); ry(0); gsap.to(card, { y: 0, duration: .8, ease: 'power3.out' }); });
  }

  function productCard(p) {
    var li = document.createElement('li');
    li.className = 'product product--' + p.category;
    li.dataset.category = p.category;
    li.innerHTML =
      '<article class="product__card">' +
      '<div class="product__media">' +
      (p.badge ? '<span class="product__badge"></span>' : '') +
      '<span class="product__cat">' + labels[p.category] + '</span>' +
      '<img loading="lazy" decoding="async" src="' + p.image + '">' +
      '</div>' +
      '<div class="product__body">' +
      '<h3 class="product__name"></h3>' +
      '<p class="product__tagline"></p>' +
      '<div class="product__row"><span class="product__price"></span>' +
      '<button type="button" class="product__add">' + PLUS + '<span data-label>Añadir</span></button></div>' +
      '</div></article>';
    if (p.badge) li.querySelector('.product__badge').textContent = p.badge;
    li.querySelector('img').alt = p.alt;
    li.querySelector('.product__name').textContent = p.name;
    li.querySelector('.product__tagline').textContent = p.tagline;
    li.querySelector('.product__price').textContent = W.money.format(p.price);
    var btn = li.querySelector('.product__add');
    btn.setAttribute('aria-label', 'Añadir ' + p.name + ' al carrito, ' + W.money.format(p.price));
    btn.addEventListener('click', function () { addFeedback(btn, p); });
    return li;
  }

  function catCard(p) {
    var li = document.createElement('li');
    li.className = 'cat-card';
    li.innerHTML =
      '<article class="cat-card__inner">' +
      (p.badge ? '<span class="cat-card__tag"></span>' : '') +
      '<div class="cat-card__media"><img decoding="async" src="' + p.image + '"></div>' +
      '<div><h3></h3><p></p><div class="cat-card__row"><span class="cat-card__price"></span>' +
      '<button type="button" class="cat-card__add">' + '<span data-label>Añadir</span></button></div></div>' +
      '</article>';
    if (p.badge) li.querySelector('.cat-card__tag').textContent = p.badge;
    li.querySelector('img').alt = p.alt;
    li.querySelector('h3').textContent = p.name;
    li.querySelector('p').textContent = p.tagline;
    li.querySelector('.cat-card__price').textContent = W.money.format(p.price);
    var btn = li.querySelector('.cat-card__add');
    btn.setAttribute('aria-label', 'Añadir ' + p.name + ' al carrito, ' + W.money.format(p.price));
    btn.addEventListener('click', function () { addFeedback(btn, p); });
    return li;
  }

  function applyFilter(cat, animate) {
    current = cat;
    W.$$('.filter').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === cat)); });
    var items = W.$$('.product');
    var flip = animate && window.gsap && window.Flip && !W.motion.reduced;
    var state = flip ? Flip.getState(items) : null;
    var grid = W.$('[data-grid]');
    var h0 = grid.offsetHeight;
    items.forEach(function (li) {
      li.hidden = !(cat === 'todos' || li.dataset.category === cat);
    });
    // La rejilla cambia de alto suavemente (Flip saca las tarjetas del flujo)
    if (flip) gsap.fromTo(grid, { height: h0 }, { height: grid.offsetHeight, duration: .75, ease: 'expo.inOut', clearProps: 'height' });
    // Las tarjetas que quedan se recolocan; las demás salen y entran con escala
    if (flip) {
      Flip.from(state, {
        duration: .75,
        ease: 'expo.inOut',
        absolute: true,
        stagger: .03,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .8, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: .7, stagger: .05, ease: 'expo.out', delay: .15 }); },
        onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .8, duration: .4, ease: 'power2.in' }); }
      });
    }
  }

  W.Shop = {
    filter: applyFilter,
    /* Entradas con el scroll: título por líneas y tarjetas en tandas */
    reveal: function () {
      if (!W.motion.cinematic) return;
      gsap.fromTo('[data-shop-line]', { yPercent: 110 }, {
        yPercent: 0, duration: 1.1, stagger: .12, ease: 'expo.out',
        scrollTrigger: { trigger: '#tienda', start: 'top 75%', toggleActions: 'play none none reverse' }
      });
      ScrollTrigger.batch('.product', {
        start: 'top 92%',
        once: true,
        onEnter: function (batch) {
          gsap.fromTo(batch, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: .08, ease: 'expo.out' });
        }
      });
    },
    init: function () {
      var grid = W.$('[data-grid]');
      var filters = W.$('[data-filters]');
      W.products.forEach(function (p) { var li = productCard(p); grid.appendChild(li); tilt(li); });
      if (window.gsap && window.Flip) gsap.registerPlugin(Flip);

      W.categories.forEach(function (c) {
        var n = c.id === 'todos' ? W.products.length : W.products.filter(function (p) { return p.category === c.id; }).length;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'filter';
        b.dataset.filter = c.id;
        b.innerHTML = c.label + '<span aria-hidden="true">' + n + '</span>';
        b.setAttribute('aria-pressed', String(c.id === current));
        b.addEventListener('click', function () { applyFilter(c.id, true); });
        filters.appendChild(b);
      });

      var cards = W.$('[data-cat-cards]');
      if (cards) {
        ['cat-tree', 'cat-bed', 'cat-toy'].forEach(function (id) { cards.appendChild(catCard(W.Cart.product(id))); });
      }

      // Enlaces que abren la tienda ya filtrada (p. ej. desde la escena acuática)
      W.$$('[data-filter-link]').forEach(function (a) {
        a.addEventListener('click', function () { applyFilter(a.getAttribute('data-filter-link'), true); });
      });
    }
  };
})(window.WILDPAW);
