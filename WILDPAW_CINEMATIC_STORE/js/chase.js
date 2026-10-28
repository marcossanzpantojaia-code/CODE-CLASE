/* WILDPAW — "La persecución": un gato y un perro cruzan corriendo como sombras.
   El scroll mueve a los dos y el fotograma de cada sombra depende de la
   distancia recorrida (zancada), así las patas nunca "patinan" y todo es
   reversible al subir. Los rótulos se desplazan con la velocidad del scroll. */
(function (W) {
  'use strict';

  var $ = W.$, $$ = W.$$;
  // stride: fracción del ancho del sprite que avanza el animal en un ciclo
  var RUNNERS = {
    cat: { frames: 12, stride: 1.25, from: .02, to: .74 },
    dog: { frames: 14, stride: 1.05, from: .16, to: .98 }
  };
  var GHOST_GAP = .16; // separación de la estela (en anchos de sprite)

  function setFrame(el, frame, n) {
    var f = ((frame % n) + n) % n;
    el.style.backgroundPosition = (f / (n - 1) * 100).toFixed(3) + '% 0';
  }

  function place(runner, cfg, p, width) {
    var w = runner.el.offsetWidth;
    var t = W.clamp((p - cfg.from) / (cfg.to - cfg.from), 0, 1);
    var x = -w * 1.6 + t * (width + w * 2.2);
    runner.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    var travelled = (x + w * 1.6) / (w * cfg.stride) * cfg.frames;
    setFrame(runner.body, Math.floor(travelled), cfg.frames);
    runner.ghosts.forEach(function (g, i) {
      var k = i + 1;
      g.style.transform = 'translate3d(' + (-k * GHOST_GAP * w).toFixed(1) + 'px,0,0)';
      setFrame(g, Math.floor(travelled - k * GHOST_GAP / cfg.stride * cfg.frames), cfg.frames);
    });
    return t;
  }

  W.Chase = {
    init: function () {
      var section = $('[data-chase]');
      if (!section) return;
      var runners = {};
      $$('[data-runner]', section).forEach(function (el) {
        runners[el.getAttribute('data-runner')] = { el: el, body: $('.chase__body', el), ghosts: $$('.chase__ghost', el) };
      });
      var rows = $$('[data-marquee]', section);
      var speedEls = { cat: $('[data-speed="cat"]', section), dog: $('[data-speed="dog"]', section) };

      // Composición estática (sin GSAP o con movimiento reducido)
      function staticPose() {
        var width = section.clientWidth;
        place(runners.cat, RUNNERS.cat, .52, width);
        place(runners.dog, RUNNERS.dog, .5, width);
      }
      if (!W.motion.cinematic) {
        staticPose();
        window.addEventListener('resize', staticPose);
        return;
      }

      var progress = 0, velocity = 0;
      var marquee = rows.map(function (row) {
        return { el: row, dir: parseFloat(row.getAttribute('data-marquee')) || 1, x: 0 };
      });

      function render() {
        var width = section.clientWidth;
        var tc = place(runners.cat, RUNNERS.cat, progress, width);
        var td = place(runners.dog, RUNNERS.dog, progress, width);
        // El marcador "sube" mientras cada animal está en carrera
        speedEls.cat.textContent = Math.round(48 * Math.sin(Math.PI * tc));
        speedEls.dog.textContent = Math.round(70 * Math.sin(Math.PI * td));
      }

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=170%',
        pin: '[data-chase-pin]',
        scrub: true,
        refreshPriority: 1, // se crea después de triggers que están más abajo
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { progress = self.progress; velocity = self.getVelocity(); render(); },
        onToggle: function (self) {
          if (self.isActive) {
            W.navOverride = 'chase';
            $$('[data-nav] [aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
          } else {
            W.navOverride = null;
            if (self.direction < 0) W.Scenes.resyncNav();
          }
        }
      });

      // Rótulos: deriva continua + empuje e inclinación según la velocidad del scroll
      var skew = gsap.quickTo(rows, 'skewX', { duration: .5, ease: 'power3.out' });
      gsap.ticker.add(function (time, dt) {
        var v = W.clamp(velocity / 1000, -6, 6);
        marquee.forEach(function (m) {
          var w = m.el.firstElementChild.offsetWidth;
          if (!w) return;
          m.x -= m.dir * (0.04 + Math.abs(v) * .35) * dt;
          if (m.x <= -w) m.x += w;
          if (m.x > 0) m.x -= w;
          m.el.style.transform = 'translate3d(' + m.x.toFixed(1) + 'px,0,0) skewX(' + (gsap.getProperty(m.el, 'skewX') || 0) + 'deg)';
        });
        velocity *= .92;
      });
      ScrollTrigger.addEventListener('scrollEnd', function () { skew(0); });
      ScrollTrigger.create({
        trigger: section, start: 'top bottom', end: 'bottom top',
        onUpdate: function (self) { skew(W.clamp(self.getVelocity() / -300, -12, 12)); }
      });

      // Entrada: el sol sube y los rótulos aparecen al llegar a la sección
      gsap.fromTo('.chase__sun', { yPercent: 60, autoAlpha: 0 }, {
        yPercent: 0, autoAlpha: .9, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 90%', end: 'top 10%', scrub: true }
      });
      render();
    }
  };
})(window.WILDPAW);
