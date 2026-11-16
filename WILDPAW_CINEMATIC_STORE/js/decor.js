/* WILDPAW — elementos decorativos generados por código. */
(function (W) {
  'use strict';

  var rand = W.rand;
  W.decor = {};

  /* Burbujas de la inmersión (las anima la línea de tiempo del scroll) */
  W.decor.bubbles = function (count) {
    var box = W.$('[data-bubbles]');
    if (!box) return [];
    var list = [];
    for (var i = 0; i < count; i++) {
      var b = document.createElement('i');
      var s = rand(6, 28);
      b.style.width = b.style.height = s.toFixed(0) + 'px';
      b.style.left = rand(2, 98).toFixed(1) + '%';
      box.appendChild(b);
      list.push(b);
    }
    return list;
  };
})(window.WILDPAW);
