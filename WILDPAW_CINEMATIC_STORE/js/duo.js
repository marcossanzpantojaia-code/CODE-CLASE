/* WILDPAW — "Juntos": el perro y el gato cruzan el plano caminando de perfil.
   Las fotos son fijas; las patas, la cola y la cabeza se mueven con la
   marioneta (js/rig.js). El paso va ligado a la distancia recorrida: cada
   píxel que avanzan con el scroll es un trozo de zancada, así que la pata
   apoyada no patina sobre el suelo, y al hacer scroll hacia arriba caminan
   hacia atrás. Sin scroll se quedan quietos, pero siguen respirando y
   moviendo la cola. */
(function (W) {
  'use strict';

  var $ = W.$;

  W.Duo = {
    init: function () {
      var section = $('[data-duo]');
      if (!section || !W.motion.cinematic) return;
      var row = $('[data-marquee]', section);
      var walkers = ['dog', 'cat'].map(function (k) {
        var el = $('[data-walker="' + k + '"]', section);
        return { key: k, el: el, img: $('.walker__img', el), shadow: $('.walker__shadow', el), rig: null, x0: 0 };
      });
      var vw = function (k) { return function () { return window.innerWidth * k; }; };

      // Los dos al mismo paso: el gato da más pasos porque sus patas son más cortas
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: .8,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onToggle: function (self) { walkers.forEach(function (w) { if (w.rig) w.rig.p.on = self.isActive; }); }
        },
        onUpdate: step
      });
      tl.fromTo(row, { x: vw(.04) }, { x: function () { return -row.scrollWidth * .46; } }, 0);
      walkers.forEach(function (w) { tl.fromTo(w.el, { x: vw(-.24) }, { x: vw(.14) }, 0); });

      function step() {
        walkers.forEach(function (w) {
          if (!w.rig) return;
          var x = gsap.getProperty(w.el, 'x');
          var stride = w.rig.stride() * w.el.offsetWidth / w.rig.R.w;
          w.rig.p.phase = (x + window.innerWidth * .24) / stride;
        });
      }

      if (W.Rig && W.Rig.supported()) {
        walkers.forEach(function (w) {
          W.Rig.attach({ pose: w.key + '-walk', host: w.el, shadow: w.shadow, layers: { s: w.img }, gait: 1 }).then(function (r) {
            if (!r) return;
            w.rig = r;
            r.p.on = tl.scrollTrigger.isActive;
            step();
            W.Rig.start();
          });
        });
      }

      gsap.fromTo([$('.duo__title', section), $('.duo__aside', section)], { y: 40, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 1, stagger: .1, ease: 'expo.out',
        scrollTrigger: { trigger: $('.duo__bar', section), start: 'top 88%', toggleActions: 'play none none reverse' }
      });
    }
  };
})(window.WILDPAW);
