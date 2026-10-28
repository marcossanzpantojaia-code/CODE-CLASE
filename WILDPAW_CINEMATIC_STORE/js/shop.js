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
      gsap.fromTo(badge, { scale: 1.45 }, { scale: 1, duration: .7, ease: 'elastic.out(1, .45)' });
    }
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
    var shown = [];
    W.$$('.product').forEach(function (li) {
      var match = cat === 'todos' || li.dataset.category === cat;
      li.hidden = !match;
      if (match) shown.push(li);
    });
    if (animate && window.gsap && !W.motion.reduced) {
      gsap.fromTo(shown, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .7, stagger: .06, ease: 'expo.out', overwrite: true, clearProps: 'transform' });
    }
  }

  W.Shop = {
    filter: applyFilter,
    init: function () {
      var grid = W.$('[data-grid]');
      var filters = W.$('[data-filters]');
      W.products.forEach(function (p) { grid.appendChild(productCard(p)); });

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
