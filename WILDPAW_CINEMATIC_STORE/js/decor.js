/* WILDPAW — elementos decorativos generados (hojas, luciérnagas, polvo,
   fondo marino y burbujas). Son SVG/DOM ligeros, sin imágenes extra. */
(function (W) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var rand = W.rand;

  function svgEl(name, attrs) {
    var el = document.createElementNS(NS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* ---------------------------------------------------------------- Hojas */
  function leafPath(len, w) {
    return 'M0 0 C' + (len * .28) + ' ' + (-w) + ' ' + (len * .72) + ' ' + (-w * .92) + ' ' + len + ' 0' +
           ' C' + (len * .72) + ' ' + (w * .92) + ' ' + (len * .28) + ' ' + w + ' 0 0Z';
  }

  // Rama: tallo curvo con hojas alternas que se hacen pequeñas hacia la punta
  function branch(opts) {
    var svg = svgEl('svg', { viewBox: '0 0 400 400', preserveAspectRatio: 'xMidYMid meet' });
    var id = 'lg' + Math.random().toString(36).slice(2, 7);
    var defs = svgEl('defs', {});
    var grad = svgEl('linearGradient', { id: id, x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.appendChild(svgEl('stop', { offset: '0', 'stop-color': opts.dark }));
    grad.appendChild(svgEl('stop', { offset: '1', 'stop-color': opts.light }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    var p0 = opts.from, p1 = opts.ctrl, p2 = opts.to;
    svg.appendChild(svgEl('path', {
      d: 'M' + p0.join(' ') + ' Q' + p1.join(' ') + ' ' + p2.join(' '),
      fill: 'none', stroke: opts.dark, 'stroke-width': opts.stem || 3, 'stroke-linecap': 'round'
    }));
    var n = opts.count || 9;
    for (var i = 1; i <= n; i++) {
      var t = i / (n + .6);
      var mt = 1 - t;
      var x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
      var y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
      var dx = 2 * mt * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
      var dy = 2 * mt * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      var ang = Math.atan2(dy, dx) * 180 / Math.PI + (i % 2 ? -1 : 1) * (opts.spread || 48) + rand(-8, 8);
      var len = (opts.leaf || 110) * (1 - t * .55) * rand(.85, 1.1);
      var g = svgEl('g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')' });
      g.appendChild(svgEl('path', { d: leafPath(len, len * (opts.ratio || .26)), fill: 'url(#' + id + ')' }));
      if (opts.vein) g.appendChild(svgEl('path', { d: 'M2 0 Q' + (len * .5) + ' ' + (-len * .02) + ' ' + (len * .94) + ' 0', stroke: opts.vein, 'stroke-width': 1.2, fill: 'none', opacity: .55 }));
      svg.appendChild(g);
    }
    return svg;
  }

  function placeSvg(svg, css) {
    for (var k in css) svg.style[k] = css[k];
    return svg;
  }

  W.decor = {};

  W.decor.leaves = function () {
    var back = W.$('[data-leaves="back"]');
    var front = W.$('[data-leaves="front"]');
    if (back) {
      back.appendChild(placeSvg(branch({ from: [0, 60], ctrl: [170, 70], to: [330, 210], dark: '#0C2A21', light: '#24564A', vein: '#3F7A66', count: 10, leaf: 120 }),
        { left: '-4vw', top: '8svh', width: '34vw', height: '34vw', transform: 'rotate(-6deg)' }));
      back.appendChild(placeSvg(branch({ from: [400, 360], ctrl: [250, 330], to: [90, 170], dark: '#0B261E', light: '#1F4D40', vein: '#356F5C', count: 9, leaf: 130 }),
        { right: '-6vw', bottom: '-6svh', width: '36vw', height: '36vw' }));
      back.appendChild(placeSvg(branch({ from: [400, 40], ctrl: [280, 30], to: [170, 150], dark: '#0E2C23', light: '#2A5E50', vein: '#3F7A66', count: 7, leaf: 100 }),
        { right: '-2vw', top: '6svh', width: '24vw', height: '24vw' }));
    }
    if (front) {
      front.appendChild(placeSvg(branch({ from: [-20, 400], ctrl: [120, 280], to: [300, 230], dark: '#03110C', light: '#0A2A20', count: 8, leaf: 170, ratio: .3 }),
        { left: '-10vw', bottom: '-12svh', width: '42vw', height: '42vw' }));
      front.appendChild(placeSvg(branch({ from: [420, -10], ctrl: [300, 90], to: [200, 260], dark: '#03110C', light: '#0B2D22', count: 7, leaf: 150, ratio: .3 }),
        { right: '-12vw', top: '-14svh', width: '36vw', height: '36vw' }));
    }
  };

  /* ------------------------------------------------- Partículas flotantes */
  function particles(container, count, opts) {
    if (!container) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      var s = rand(opts.min, opts.max);
      p.style.width = p.style.height = s.toFixed(1) + 'px';
      p.style.left = rand(3, 97).toFixed(1) + '%';
      p.style.top = rand(opts.top || 8, opts.bottom || 92).toFixed(1) + '%';
      p.style.setProperty('--dx', rand(-60, 60).toFixed(0) + 'px');
      p.style.setProperty('--dy', rand(-110, -20).toFixed(0) + 'px');
      p.style.setProperty('--d', rand(8, 18).toFixed(1) + 's');
      p.style.setProperty('--delay', (-rand(0, 18)).toFixed(1) + 's');
      p.style.setProperty('--o1', rand(.05, .3).toFixed(2));
      p.style.setProperty('--o2', rand(.5, 1).toFixed(2));
      frag.appendChild(p);
    }
    container.appendChild(frag);
  }

  W.decor.particles = function (lowPower) {
    particles(W.$('[data-dust]'), lowPower ? 8 : 16, { min: 2, max: 5 });
    particles(W.$('[data-motes]'), lowPower ? 8 : 18, { min: 4, max: 11, top: 15, bottom: 85 });
  };

  /* ------------------------------------------------------- Fondo marino */
  function blade(x, base, h, w, bend, color, still) {
    var d = 'M' + (x - w / 2) + ' ' + base +
      ' Q' + (x - w / 2 + bend * .4) + ' ' + (base - h * .55) + ' ' + (x + bend) + ' ' + (base - h) +
      ' Q' + (x + w / 2 + bend * .4) + ' ' + (base - h * .55) + ' ' + (x + w / 2) + ' ' + base + 'Z';
    // Solo algunas hojas se balancean: animar todas repinta el SVG entero
    var p = svgEl('path', { d: d, fill: color });
    if (still) return p;
    p.setAttribute('class', 'blade');
    p.style.setProperty('--d', rand(4.5, 8).toFixed(1) + 's');
    p.style.setProperty('--delay', (-rand(0, 8)).toFixed(1) + 's');
    p.style.setProperty('--a', rand(2.5, 6).toFixed(1) + 'deg');
    return p;
  }

  function rock(cx, base, w, h, fill) {
    var d = 'M' + (cx - w / 2) + ' ' + base +
      ' C' + (cx - w * .48) + ' ' + (base - h * .7) + ' ' + (cx - w * .2) + ' ' + (base - h) + ' ' + cx + ' ' + (base - h * .96) +
      ' C' + (cx + w * .26) + ' ' + (base - h * .92) + ' ' + (cx + w * .5) + ' ' + (base - h * .55) + ' ' + (cx + w / 2) + ' ' + base + 'Z';
    return svgEl('path', { d: d, fill: fill });
  }

  W.decor.seabed = function () {
    var bed = W.$('[data-seabed]');
    if (bed) {
      var svg = svgEl('svg', { viewBox: '0 0 1440 360', preserveAspectRatio: 'xMidYMax slice' });
      var defs = svgEl('defs', {});
      var g1 = svgEl('linearGradient', { id: 'rockA', x1: '0', y1: '0', x2: '0', y2: '1' });
      g1.appendChild(svgEl('stop', { offset: '0', 'stop-color': '#12455A' }));
      g1.appendChild(svgEl('stop', { offset: '1', 'stop-color': '#031621' }));
      var g2 = svgEl('linearGradient', { id: 'rockB', x1: '0', y1: '0', x2: '0', y2: '1' });
      g2.appendChild(svgEl('stop', { offset: '0', 'stop-color': '#0B3445' }));
      g2.appendChild(svgEl('stop', { offset: '1', 'stop-color': '#020F17' }));
      defs.appendChild(g1); defs.appendChild(g2);
      svg.appendChild(defs);
      var i;
      for (i = 0; i < 34; i++) svg.appendChild(blade(rand(0, 1440), 360, rand(110, 260), rand(6, 11), rand(-70, 70), '#0A3A47', true));
      svg.appendChild(rock(180, 372, 520, 150, 'url(#rockB)'));
      svg.appendChild(rock(1230, 372, 600, 190, 'url(#rockB)'));
      svg.appendChild(rock(760, 372, 420, 70, 'url(#rockB)'));
      for (i = 0; i < 22; i++) svg.appendChild(blade(rand(0, 1440), 368, rand(70, 170), rand(6, 10), rand(-50, 50), '#0D4A55', i % 5 !== 0));
      svg.appendChild(rock(420, 380, 300, 95, 'url(#rockA)'));
      svg.appendChild(rock(1020, 380, 260, 80, 'url(#rockA)'));
      bed.appendChild(svg);
    }
    var front = W.$('[data-grass-front]');
    if (front) {
      var fs = svgEl('svg', { viewBox: '0 0 1440 400', preserveAspectRatio: 'xMidYMax slice' });
      for (var j = 0; j < 9; j++) fs.appendChild(blade(rand(-20, 170), 412, rand(200, 360), rand(14, 22), rand(30, 110), '#031821', true));
      for (var k = 0; k < 9; k++) fs.appendChild(blade(rand(1270, 1460), 412, rand(180, 340), rand(14, 22), rand(-110, -30), '#031821', true));
      front.appendChild(fs);
    }
  };

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
