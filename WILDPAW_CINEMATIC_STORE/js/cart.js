/* WILDPAW — carrito de demostración: estado, persistencia local y panel lateral.
   No hay pagos ni envío de datos: todo vive en este navegador. */
(function (W) {
  'use strict';

  var KEY = 'wildpaw-cart-v1';
  var listeners = [];
  var lines = sanitize(W.storage.get(KEY, []));

  function productById(id) {
    for (var i = 0; i < W.products.length; i++) if (W.products[i].id === id) return W.products[i];
    return null;
  }

  function sanitize(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (l) {
      return l && productById(l.id) && l.qty > 0;
    }).map(function (l) { return { id: l.id, qty: Math.min(99, Math.floor(l.qty)) }; });
  }

  function lineOf(id) {
    for (var i = 0; i < lines.length; i++) if (lines[i].id === id) return lines[i];
    return null;
  }

  function commit() {
    W.storage.set(KEY, lines);
    listeners.forEach(function (fn) { fn(); });
  }

  W.Cart = {
    product: productById,
    lines: function () { return lines.slice(); },
    count: function () { return lines.reduce(function (n, l) { return n + l.qty; }, 0); },
    total: function () {
      return lines.reduce(function (s, l) { return s + l.qty * productById(l.id).price; }, 0);
    },
    add: function (id, qty) {
      if (!productById(id)) return;
      var line = lineOf(id);
      if (line) line.qty = Math.min(99, line.qty + (qty || 1));
      else lines.push({ id: id, qty: qty || 1 });
      commit();
    },
    setQty: function (id, qty) {
      var line = lineOf(id);
      if (!line) return;
      if (qty <= 0) return W.Cart.remove(id);
      line.qty = Math.min(99, qty);
      commit();
    },
    remove: function (id) {
      lines = lines.filter(function (l) { return l.id !== id; });
      commit();
    },
    onChange: function (fn) { listeners.push(fn); }
  };

  /* -------------------------------------------------------------- Interfaz */
  var ui = {};
  var lastFocus = null;
  var isOpen = false;

  function render() {
    var count = W.Cart.count();
    W.$$('[data-cart-count]').forEach(function (el) { el.textContent = count; });
    W.$$('[data-cart-count-sr]').forEach(function (el) {
      el.textContent = ', ' + count + (count === 1 ? ' producto' : ' productos');
    });

    var list = ui.list;
    list.textContent = '';
    W.Cart.lines().forEach(function (line) {
      var p = productById(line.id);
      var li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML =
        '<div class="cart-item__media product--' + p.category + '"><img alt="" src="' + p.image + '"></div>' +
        '<div><p class="cart-item__name"></p><p class="cart-item__price"></p>' +
        '<div class="qty" role="group">' +
        '<button type="button" data-qty="-1"><span aria-hidden="true">−</span></button>' +
        '<output aria-live="polite"></output>' +
        '<button type="button" data-qty="1"><span aria-hidden="true">+</span></button></div></div>' +
        '<div class="cart-item__side"><span class="cart-item__total"></span>' +
        '<button type="button" class="cart-item__remove" data-remove>Eliminar</button></div>';
      li.querySelector('.cart-item__name').textContent = p.name;
      li.querySelector('.cart-item__price').textContent = W.money.format(p.price) + ' / ud.';
      li.querySelector('output').textContent = line.qty;
      li.querySelector('.qty').setAttribute('aria-label', 'Cantidad de ' + p.name);
      li.querySelector('[data-qty="-1"]').setAttribute('aria-label', 'Quitar una unidad de ' + p.name);
      li.querySelector('[data-qty="1"]').setAttribute('aria-label', 'Añadir una unidad de ' + p.name);
      li.querySelector('[data-remove]').setAttribute('aria-label', 'Eliminar ' + p.name + ' del carrito');
      li.querySelector('.cart-item__total').textContent = W.money.format(p.price * line.qty);
      li.dataset.id = p.id;
      list.appendChild(li);
    });

    var empty = count === 0;
    ui.empty.hidden = !empty;
    ui.foot.hidden = empty;
    ui.total.textContent = W.money.format(W.Cart.total());
    ui.msg.textContent = '';
  }

  function focusables() {
    return W.$$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', ui.panel)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function open(trigger) {
    if (isOpen) return;
    isOpen = true;
    lastFocus = trigger || document.activeElement;
    ui.panel.hidden = false;
    ui.overlay.hidden = false;
    document.body.classList.add('cart-open');
    W.$$('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    if (window.gsap && !W.motion.reduced) {
      gsap.fromTo(ui.panel, { xPercent: 100 }, { xPercent: 0, duration: .7, ease: 'expo.out' });
      gsap.fromTo(ui.overlay, { opacity: 0 }, { opacity: 1, duration: .4 });
      gsap.fromTo(ui.list.children, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: .6, stagger: .05, delay: .15, ease: 'expo.out' });
    }
    ui.close.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    W.$$('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    var done = function () {
      ui.panel.hidden = true;
      ui.overlay.hidden = true;
      document.body.classList.remove('cart-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (window.gsap && !W.motion.reduced) {
      gsap.to(ui.panel, { xPercent: 100, duration: .45, ease: 'power3.in' });
      gsap.to(ui.overlay, { opacity: 0, duration: .45, onComplete: done });
    } else done();
  }

  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  W.CartUI = {
    open: open,
    close: close,
    init: function () {
      ui.panel = W.$('[data-cart]');
      ui.overlay = W.$('[data-cart-overlay]');
      ui.list = W.$('[data-cart-list]');
      ui.empty = W.$('[data-cart-empty]');
      ui.foot = W.$('[data-cart-foot]');
      ui.total = W.$('[data-cart-total]');
      ui.msg = W.$('[data-cart-msg]');
      ui.close = W.$('.cart__close', ui.panel);

      W.$$('[data-cart-open]').forEach(function (btn) {
        btn.addEventListener('click', function () { open(btn); });
      });
      W.$$('[data-cart-close]').forEach(function (btn) { btn.addEventListener('click', close); });
      ui.overlay.addEventListener('click', close);
      // El fondo no se desplaza mientras el panel está abierto (sin bloquear el body)
      ui.overlay.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
      ui.overlay.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
      document.addEventListener('keydown', onKey);

      ui.list.addEventListener('click', function (e) {
        var li = e.target.closest('.cart-item');
        if (!li) return;
        var id = li.dataset.id;
        var line = W.Cart.lines().filter(function (l) { return l.id === id; })[0];
        var qtyBtn = e.target.closest('[data-qty]');
        if (qtyBtn && line) {
          var focusKey = qtyBtn.getAttribute('data-qty');
          W.Cart.setQty(id, line.qty + Number(focusKey));
          // Mantener el foco en el mismo control tras re-renderizar
          var again = W.$('.cart-item[data-id="' + id + '"] [data-qty="' + focusKey + '"]', ui.list);
          (again || ui.close).focus();
        } else if (e.target.closest('[data-remove]')) {
          var p = productById(id);
          W.Cart.remove(id);
          W.toast(p.name + ' eliminado del carrito');
          var next = W.$('[data-remove]', ui.list);
          (next || ui.close).focus();
        }
      });

      W.$('[data-cart-checkout]').addEventListener('click', function () {
        ui.msg.textContent = 'Tienda demostrativa: no se ha realizado ningún pago ni cargo.';
      });

      W.Cart.onChange(render);
      render();
    }
  };
})(window.WILDPAW);
