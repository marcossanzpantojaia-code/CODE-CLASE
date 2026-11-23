// Scroll-scrubbed cover: a full-bleed campaign image stays pinned while one enormous single-line
// headline travels from fully offscreen right to fully offscreen left as the page scrolls down,
// and back when it scrolls up. Native document scrolling only: no hijacking, no wheel handling.
//
// mountScrollHeadline(sectionElement, options) -> { destroy(), update(), state }
// options: { headline, image, alt, textColor, background, scrollLength }
//
// Geometry (measured, never hard-coded, no easing on progress):
//   V = frame.clientWidth, T = headline.offsetWidth, D = runway.offsetHeight - frame.clientHeight
//   p = clamp(-runway.getBoundingClientRect().top / D, 0, 1),  x = V - p * (V + T)

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export function mountScrollHeadline(root, options = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('mountScrollHeadline: a section element is required');
  const runway = root.querySelector('.nocta-sweep__runway');
  const frame = root.querySelector('.nocta-sweep__frame');
  const headline = root.querySelector('.nocta-sweep__headline');
  const image = root.querySelector('.nocta-sweep__image');
  if (!runway || !frame || !headline) throw new Error('mountScrollHeadline: runway, frame and headline are required');

  if (typeof options.headline === 'string') headline.textContent = options.headline;
  if (image && options.image) image.src = options.image;
  if (image && typeof options.alt === 'string') image.alt = options.alt;
  if (options.textColor) root.style.setProperty('--sweep-text', options.textColor);
  if (options.background) root.style.setProperty('--sweep-bg', options.background);
  if (options.scrollLength) root.style.setProperty('--sweep-runway', options.scrollLength);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  let scrollListener = null; // only attached while the runway is near the viewport
  let raf = 0;
  let destroyed = false;
  const geo = { V: 0, T: 0, D: 0 };
  const state = { p: 0, x: 0, near: false, updates: 0 };

  function measure() {
    geo.V = frame.clientWidth;
    geo.T = headline.offsetWidth;
    geo.D = runway.offsetHeight - frame.clientHeight;
  }

  function update() {
    raf = 0;
    if (destroyed) return;
    state.updates++;
    if (reducedMotion.matches) {
      headline.style.transform = '';
      state.p = 0;
      state.x = 0;
      return;
    }
    const p = geo.D > 0 ? clamp(-runway.getBoundingClientRect().top / geo.D, 0, 1) : 0;
    const x = geo.V - p * (geo.V + geo.T);
    headline.style.transform = `translate3d(${x}px,-50%,0)`;
    state.p = p;
    state.x = x;
  }

  function schedule() {
    if (!raf && !destroyed) raf = requestAnimationFrame(update);
  }

  function remeasure() {
    if (destroyed) return;
    measure();
    schedule();
  }

  const nearObserver = new IntersectionObserver(
    (entries) => {
      state.near = entries[entries.length - 1].isIntersecting;
      if (state.near && !scrollListener) {
        scrollListener = new AbortController();
        window.addEventListener('scroll', schedule, { passive: true, signal: scrollListener.signal });
      } else if (!state.near && scrollListener) {
        scrollListener.abort();
        scrollListener = null;
      }
      schedule(); // also settles p at exactly 0 or 1 when the runway leaves
    },
    { rootMargin: '50% 0px' },
  );
  const resizeObserver = new ResizeObserver(remeasure);

  nearObserver.observe(runway);
  resizeObserver.observe(frame);
  resizeObserver.observe(headline);
  resizeObserver.observe(runway);
  reducedMotion.addEventListener('change', remeasure, { signal: listeners.signal });
  if (image) {
    if (!image.complete) image.addEventListener('load', remeasure, { once: true, signal: listeners.signal });
    // A missing campaign image must not show a broken-image icon; the headline still works.
    image.addEventListener('error', () => image.setAttribute('hidden', ''), { once: true, signal: listeners.signal });
    if (image.complete && image.naturalWidth === 0 && image.getAttribute('src')) image.setAttribute('hidden', '');
  }
  if (document.fonts?.ready) document.fonts.ready.then(remeasure, () => {});

  measure();
  update();

  return {
    update: remeasure,
    get state() {
      return { ...state, ...geo };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      scrollListener?.abort();
      scrollListener = null;
      listeners.abort();
      nearObserver.disconnect();
      resizeObserver.disconnect();
      headline.style.transform = '';
    },
  };
}
