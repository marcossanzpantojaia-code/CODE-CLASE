/* WILDPAW — utilidades compartidas. Scripts clásicos (sin módulos) para que
   la web funcione abriendo index.html directamente con doble clic (file://). */
window.WILDPAW = window.WILDPAW || {};

(function (W) {
  'use strict';

  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  W.$ = function (sel, root) { return (root || document).querySelector(sel); };
  W.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  W.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  W.lerp = function (a, b, t) { return a + (b - a) * t; };
  W.rand = function (a, b) { return a + Math.random() * (b - a); };

  W.motion = {
    reduced: reducedQuery.matches,
    finePointer: fineQuery.matches,
    // Equipos modestos: menos peces, menos partículas
    lowPower: (navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory || 4) <= 2
  };
  W.motion.cinematic = !W.motion.reduced && !!(window.gsap && window.ScrollTrigger);

  W.money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  /* Listener con limpieza: devuelve la función que lo elimina */
  W.on = function (el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    return function () { el.removeEventListener(type, fn, opts); };
  };

  var toastTimer;
  W.toast = function (msg) {
    var el = W.$('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2400);
  };

  W.storage = {
    get: function (key, fallback) {
      try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado */ }
    }
  };

  /* Carga y decodifica imágenes antes de animarlas (evita saltos) */
  W.loadImage = function (src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        if (img.decode) img.decode().then(function () { resolve(img); }, function () { resolve(img); });
        else resolve(img);
      };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  };
})(window.WILDPAW);
