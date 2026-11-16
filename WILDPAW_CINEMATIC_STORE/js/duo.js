/* WILDPAW — "Juntos": travelling lateral con las dos fotografías de perfil.
   Es movimiento de cámara, no animación de los animales: al hacer scroll la
   cámara se desplaza de lado, el rótulo del fondo corre más despacio que los
   protagonistas y el gato (más cerca) se mueve más que el perro. */
(function (W) {
  'use strict';

  var $ = W.$;

  W.Duo = {
    init: function () {
      var section = $('[data-duo]');
      if (!section || !W.motion.cinematic) return;
      var row = $('[data-marquee]', section);
      var dog = $('[data-walker="dog"]', section), cat = $('[data-walker="cat"]', section);
      var vw = function (k) { return function () { return window.innerWidth * k; }; };

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: .8,
          refreshPriority: 1,
          invalidateOnRefresh: true
        }
      });
      tl.fromTo(row, { x: vw(.04) }, { x: function () { return -row.scrollWidth * .46; } }, 0)
        .fromTo(dog, { x: vw(-.2) }, { x: vw(.1) }, 0)
        .fromTo(cat, { x: vw(-.44) }, { x: vw(.2) }, 0);

      gsap.fromTo([$('.duo__title', section), $('.duo__aside', section)], { y: 40, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 1, stagger: .1, ease: 'expo.out',
        scrollTrigger: { trigger: $('.duo__bar', section), start: 'top 88%', toggleActions: 'play none none reverse' }
      });
    }
  };
})(window.WILDPAW);
