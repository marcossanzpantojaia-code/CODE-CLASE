/* WILDPAW — Plano final "Juntos": cierre editorial de la historia.

   La sección es más alta que la pantalla y su encuadre se queda pegado
   (position: sticky): el perro y el gato empiezan a entrar andando mientras
   el encuadre sube —no hay un plano vacío— y siguen, juntos y a la misma
   velocidad, hasta pararse. Las fotos son fijas; patas, cola y cabeza se mueven
   con la marioneta (js/rig.js) y el paso va ligado a la distancia recorrida,
   así que la pata apoyada no patina (y al volver hacia arriba caminan hacia
   atrás). Las letras gigantes se levantan a su paso —las mueve la posición
   del hocico que va delante, no un reloj— y, cuando los dos se paran, se
   dibuja la navegación de la tienda por animal en la dirección de la marcha.
   Al pasar por un enlace, el animal de esa sección se queda en primer plano.
   Sin GSAP o con movimiento reducido se ve la composición final, quieta. */
(function (W) {
  'use strict';

  var $ = W.$, $$ = W.$$;
  var NOSE = { dog: .95, cat: .97 };   // hocico, en fracción del ancho de cada foto

  // Cada línea se divide en letras con máscara (como WILDPAW en la llegada)
  function split(line) {
    var text = line.textContent;
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(text, function (c) {
      var ch = document.createElement('span'), i = document.createElement('span');
      ch.className = 'ch';
      i.textContent = c === ' ' ? ' ' : c;
      ch.appendChild(i);
      line.appendChild(ch);
    });
  }

  // La línea más ancha ocupa como mucho el 86 % del ancho (sin pasar del CSS)
  function fitType(big) {
    big.style.fontSize = '';
    var css = parseFloat(getComputedStyle(big).fontSize);
    big.style.fontSize = '100px';
    var widest = Math.max.apply(null, $$('.line', big).map(function (l) { return l.getBoundingClientRect().width; }));
    big.style.fontSize = Math.min(css, 100 * window.innerWidth * .86 / Math.max(1, widest)).toFixed(2) + 'px';
  }

  W.Duo = {
    init: function () {
      var section = $('[data-duo]');
      if (!section) return;
      var big = $('.duo__big', section);
      $$('.line', big).forEach(split);
      fitType(big);
      var links = $$('[data-duo-link]', section);

      // El animal de la sección señalada se queda en primer plano
      links.forEach(function (a) {
        var who = { perros: 'dog', gatos: 'cat' }[a.getAttribute('data-filter-link')] || '';
        function on() { if (who) section.setAttribute('data-focus', who); }
        function off() { section.removeAttribute('data-focus'); }
        a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
        a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
      });

      if (!W.motion.cinematic) return;

      var chars = $$('.ch > span', big).map(function (el) { return { el: el, cx: 0, y: -1 }; });
      var walkers = ['dog', 'cat'].map(function (k) {
        var el = $('[data-walker="' + k + '"]', section);
        return { key: k, el: el, img: $('.walker__img', el), shadow: $('.walker__shadow', el), rig: null };
      });
      // Los dos recorren la misma distancia (salen de fuera de cuadro por la
      // izquierda), así van a la par y ninguno parece más rápido
      var dist = 0, tl = null;
      function measure() {
        dist = Math.max.apply(null, walkers.map(function (w) { return w.el.offsetLeft + w.el.offsetWidth; })) + window.innerWidth * .03;
        chars.forEach(function (c) { var r = c.el.parentNode.getBoundingClientRect(); c.cx = r.left + r.width / 2; c.y = -1; });
      }
      measure();

      function step() {
        var front = -1e9;
        walkers.forEach(function (w) {
          var x = gsap.getProperty(w.el, 'x');
          front = Math.max(front, w.el.offsetLeft + x + NOSE[w.key] * w.el.offsetWidth);
          if (!w.rig) return;
          var stride = w.rig.stride() * w.el.offsetWidth / w.rig.R.w;
          w.rig.p.phase = (x + dist) / stride;
        });
        // Cada letra sube mientras el hocico de delante recorre un 8 % del ancho;
        // al pararse, las que queden por delante de ellos terminan de subir
        var vw = window.innerWidth, lead = vw * .05, span = vw * .08;
        front += Math.max(0, ((tl ? tl.progress() : 0) - .56) / .1) * vw;
        chars.forEach(function (c) {
          var p = W.clamp((front + lead - c.cx) / span, 0, 1);
          p = 1 - Math.pow(1 - p, 3);
          var y = Math.round((1 - p) * 1300) / 10;   // 130 %: ni el punto de la «i» asoma
          if (y !== c.y) { c.y = y; c.el.style.transform = y ? 'translate3d(0,' + y + '%,0)' : 'none'; }
        });
      }

      tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: .8,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onRefresh: function () { measure(); step(); }
        },
        onUpdate: step
      });

      // 1 · Entran andando mientras sube el encuadre y frenan hasta pararse
      //     (0 → .42 el encuadre sube; desde ahí se queda pegado)
      walkers.forEach(function (w) {
        tl.fromTo(w.el, { x: function () { return -dist; } }, { x: 0, duration: .46, ease: 'power1.out', immediateRender: false }, .2);
      });
      // 2 · Al pararse vuelven a la postura de la foto
      var gaits = walkers.map(function () { return { gait: 1 }; });
      walkers.forEach(function (w, i) {
        tl.fromTo(gaits[i], { gait: 1 }, {
          gait: 0, duration: .12, ease: 'power1.inOut', immediateRender: false,
          onUpdate: function () { if (w.rig) w.rig.p.gait = gaits[i].gait; }
        }, .56);
      });
      // 3 · Se abre la tienda: la raya de cada enlace se dibuja hacia donde andaban
      tl.fromTo('[data-duo-fade]', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12, ease: 'power3.out', immediateRender: false }, .64);
      links.forEach(function (a, i) {
        var at = .68 + i * .045;
        // Hasta que se dibuja no se puede enfocar (ni queda un enlace sin nombre)
        tl.set(a, { visibility: 'visible' }, at)
          .fromTo(a, { '--draw': 0 }, { '--draw': 1, duration: .13, ease: 'power2.inOut', immediateRender: false }, at)
          .fromTo(a.children, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .11, stagger: .015, ease: 'power3.out', immediateRender: false }, at + .03);
      });
      tl.set({}, {}, 1);

      // Estado de partida: fuera de cuadro, letras abajo, tienda sin abrir
      walkers.forEach(function (w) { gsap.set(w.el, { x: -dist }); });
      gsap.set('[data-duo-fade]', { autoAlpha: 0 });
      links.forEach(function (a) { gsap.set(a, { '--draw': 0, visibility: 'hidden' }); gsap.set(a.children, { autoAlpha: 0 }); });
      step();

      // Las marionetas solo se dibujan con la sección en pantalla
      var seen = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        refreshPriority: 0,
        onToggle: function (self) { walkers.forEach(function (w) { if (w.rig) w.rig.p.on = self.isActive; }); }
      });
      // Con el cierre en pantalla no hay escena activa en la barra: la propia
      // sección es la navegación (al volver a la historia se recupera)
      ScrollTrigger.create({
        trigger: section,
        start: 'top 50%',
        endTrigger: '#tienda',
        end: function () { return 'top ' + ($('[data-nav]').offsetHeight + 1); },
        refreshPriority: 0,
        onToggle: function (self) {
          W.navOverride = self.isActive;
          if (self.isActive) $$('[data-nav] [data-goto][aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
          else if (W.Scenes.resyncNav) W.Scenes.resyncNav();
        }
      });
      // Antes de cada refresco (p. ej. al redimensionar): tipografía y distancias
      // nuevas, para que GSAP relea ya los valores buenos
      ScrollTrigger.addEventListener('refreshInit', function () { fitType(big); measure(); });

      if (W.Rig && W.Rig.supported()) {
        walkers.forEach(function (w, i) {
          W.Rig.attach({ pose: w.key + '-walk', host: w.el, shadow: w.shadow, layers: { s: w.img }, gait: 1 }).then(function (r) {
            if (!r) return;
            w.rig = r;
            r.p.on = seen.isActive;
            r.p.gait = gaits[i].gait;
            step();
            W.Rig.start();
          });
        });
      }
    }
  };
})(window.WILDPAW);
