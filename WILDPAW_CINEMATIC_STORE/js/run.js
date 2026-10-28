/* WILDPAW — sección RUN WILD: vídeos reales de un perro y un gato corriendo.
   Los vídeos solo se reproducen mientras la sección está en pantalla; con
   movimiento reducido arrancan en pausa y el botón permite reproducirlos. */
(function (W) {
  'use strict';

  var $ = W.$, $$ = W.$$;
  var videos = [];
  var visible = false;
  var userPaused = W.motion.reduced;

  function sync() {
    videos.forEach(function (v) {
      if (visible && !userPaused) {
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* autoplay bloqueado: queda el póster */ });
      } else if (!v.paused) v.pause();
    });
  }

  function setPaused(paused) {
    userPaused = paused;
    var btn = $('[data-run-toggle]');
    btn.setAttribute('aria-pressed', String(paused));
    $('[data-run-toggle-label]', btn).textContent = paused ? 'Reproducir vídeos' : 'Pausar vídeos';
    sync();
  }

  W.Run = {
    init: function () {
      var section = $('[data-run]');
      if (!section) return;
      videos = $$('[data-run-video]', section);
      setPaused(userPaused);
      $('[data-run-toggle]', section).addEventListener('click', function () { setPaused(!userPaused); });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          sync();
        }, { threshold: .15 }).observe(section);
      } else {
        visible = true;
        sync();
      }
    },

    /* Entrada ligada al scroll (se crea después de la historia fijada para
       que ScrollTrigger mida las posiciones con el espaciador ya colocado) */
    animate: function () {
      var section = $('[data-run]');
      if (!section || !W.motion.cinematic) return;
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 15%', scrub: 1 }
      });
      tl.fromTo('[data-run-line]', { yPercent: 115 }, { yPercent: 0, stagger: .12, duration: .6, ease: 'power3.out' }, 0)
        .fromTo('[data-run-clip] .run__frame', { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', stagger: .18, duration: .7, ease: 'power2.out' }, .15)
        .fromTo('[data-run-video]', { scale: 1.3 }, { scale: 1, stagger: .18, duration: .9, ease: 'power2.out' }, .15)
        .fromTo('[data-run-speed]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .4 }, .6);

      // En esta sección ningún enlace de la barra está activo
      ScrollTrigger.create({
        trigger: section,
        start: 'top 50%',
        end: 'max',
        onToggle: function (self) {
          if (self.isActive) {
            W.navOverride = 'run';
            $$('[data-nav] [aria-current]').forEach(function (a) {
              if (a.getAttribute('href') !== '#tienda') a.removeAttribute('aria-current');
            });
          } else {
            W.navOverride = null;
            W.Scenes.resyncNav();
          }
        }
      });

      // Parallax: el gato flota a otra velocidad que el perro
      gsap.fromTo('.run__clip--cat', { y: 90 }, {
        y: -70, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  };
})(window.WILDPAW);
