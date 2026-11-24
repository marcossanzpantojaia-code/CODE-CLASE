// The line-up carousel is the home screen. Opening a shoe goes to its page, a hash route:
// #/nocta, #/air-force-1 or #/air-max-plus, optionally followed by /black, /white or /orange for
// the colourway shown at rest. Any static server works, with no server-side routing.
// Every page is the same pair of components, the scroll-scrubbed cover headline and then the
// fluid colourway reveal, followed by a details section and previous/next shoe cards. Each page
// is cloned from its <template> on arrival and destroyed on leaving. Any other hash, such as
// the skip link's #after-dark, is an in-page anchor and leaves the view alone.
//
// The site chrome lives here too: the header (skip link, brand, shoe navigation, a back button
// on product pages; it hides while scrolling down and returns on the way up), the line-up's
// info panel (name, colourway, Discover), the colourway swatches and the footer.
import { mountNoctaFluidReveal } from './nocta-fluid-reveal.js';
import { mountScrollHeadline } from './nocta-scroll-headline.js';
import { mountShoeCarousel } from './nocta-shoe-carousel.js';

const params = new URLSearchParams(window.location.search);
const debug = params.has('debug');
// `noidle` and `lockstep` exist for deterministic test runs (with `debug`); defaults are untouched.
const revealOptions = { debug, lockstep: params.has('lockstep'), idle: params.has('noidle') ? false : undefined };

const PAGES = Object.freeze({
  nocta: { title: 'Nike NOCTA · After Dark' },
  'air-force-1': { title: 'Nike Air Force 1' },
  'air-max-plus': { title: 'Nike Air Max Plus (TN)' },
});
const HOME_TITLE = 'Nike line-up';
const SUFFIX = ' · unofficial concept';

const $ = (sel, root = document) => root.querySelector(sel);
const lineupSection = $('[data-nocta-lineup]');
const view = $('[data-product-view]');
const header = $('.site-header');
const skip = $('.site-skip');
const back = $('.site-header__back');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = null; // { page, start, sweep, reveal, abort }
let shownKey = null;
let navigations = 0;
let activeTransition = null; // a new navigation skips the running transition; only the latest cleans up

/** null: the home screen; undefined: not a route (an in-page anchor). */
export function parseRoute(hash) {
  if (!hash || hash === '#' || hash === '#/') return null;
  const m = /^#\/([a-z0-9-]+)(?:\/(black|white|orange))?\/?$/.exec(hash);
  if (!m) return undefined;
  return PAGES[m[1]] ? { page: m[1], start: m[2] || 'black' } : null;
}

// ------------------------------------------------------------------ header

function syncHeader(route) {
  for (const link of document.querySelectorAll('.site-nav__link')) {
    if (route && link.dataset.page === route.page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (back) back.hidden = !route;
  const revealId = route ? view.querySelector('.nocta-reveal')?.id : null;
  if (skip) {
    skip.hidden = !revealId;
    if (revealId) skip.setAttribute('href', `#${revealId}`);
  }
  if (header) {
    header.dataset.view = route ? 'page' : 'home';
    delete header.dataset.hidden;
  }
}

let lastScrollY = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    if (!header) return;
    const y = window.scrollY;
    if (y > lastScrollY + 4 && y > 80) header.dataset.hidden = '';
    else if (y < lastScrollY - 4 || y <= 80) delete header.dataset.hidden;
    lastScrollY = y;
  },
  { passive: true },
);

// ------------------------------------------------------------------ product pages

/** Colourway swatches: show the colourway asked for, and step the reveal's cycle to the one picked. */
function wireSwatches(frameEl, reveal, start, signal) {
  const group = view.querySelector('[data-swatches]');
  if (!group) return;
  let order = null; // the reveal's cycle once its photos are in (orange may be missing)
  const sync = (destination) => {
    for (const b of group.querySelectorAll('.nocta-swatch')) {
      b.hidden = Boolean(order) && !order.includes(b.dataset.colourway);
      b.setAttribute('aria-pressed', String(b.dataset.colourway === destination));
    }
  };
  frameEl.addEventListener(
    'nocta-reveal:change',
    (e) => {
      order = e.detail.order;
      sync(e.detail.destination);
    },
    { signal },
  );
  group.addEventListener(
    'click',
    (e) => {
      const button = e.target.closest('.nocta-swatch');
      if (!button || !order) return;
      const from = order.indexOf(reveal.state.destination);
      const to = order.indexOf(button.dataset.colourway);
      if (from < 0 || to < 0) return;
      for (let i = 0; i < (to - from + order.length) % order.length; i++) reveal.advance();
    },
    { signal },
  );
  sync(start);
}

function unmountPage() {
  if (!current) return;
  current.abort.abort();
  current.sweep?.destroy();
  current.reveal?.destroy();
  current = null;
  view.replaceChildren();
  view.hidden = true;
  delete view.dataset.page;
  if (debug) {
    window.__noctaSweep = null;
    window.__noctaReveal = null;
  }
}

function mountPage(route) {
  const template = document.getElementById(`product-${route.page}`);
  if (!template) return false;
  view.replaceChildren(template.content.cloneNode(true));
  view.dataset.page = route.page;
  view.hidden = false;
  const sweepEl = $('[data-nocta-sweep]', view);
  const frameEl = $('[data-nocta-reveal]', view);
  const abort = new AbortController();
  const reveal = frameEl ? mountNoctaFluidReveal(frameEl, { ...revealOptions, start: route.start }) : null;
  current = { ...route, abort, sweep: sweepEl ? mountScrollHeadline(sweepEl) : null, reveal };
  if (reveal) wireSwatches(frameEl, reveal, route.start, abort.signal);
  if (debug) {
    window.__noctaSweep = current.sweep;
    window.__noctaReveal = current.reveal;
  }
  return true;
}

function show(route, { initial = false } = {}) {
  const key = route ? `${route.page}/${route.start}` : 'home';
  if (key === shownKey) return;
  shownKey = key;
  navigations++;
  unmountPage();
  if (route && mountPage(route)) {
    if (lineupSection) lineupSection.hidden = true;
    document.title = `${PAGES[route.page].title}${SUFFIX}`;
  } else {
    route = null;
    if (lineupSection) lineupSection.hidden = false;
    document.title = `${HOME_TITLE}${SUFFIX}`;
  }
  syncHeader(route);
  if (!initial) {
    window.scrollTo(0, 0);
    lastScrollY = 0;
    // Move focus to the new view so the next Tab starts there (no scroll: it is already at the top).
    (route ? view : lineupSection)?.focus({ preventScroll: true });
  }
}

/** Waits (briefly) for the arriving cover image so the transition lands on a finished frame. */
async function coverReady() {
  const img = view.hidden ? null : $('.nocta-sweep__image', view);
  if (!img) return;
  await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 900))]);
}

function navigate(route) {
  const key = route ? `${route.page}/${route.start}` : 'home';
  if (key === shownKey) return;
  if (typeof document.startViewTransition === 'function' && !reducedMotion.matches) {
    document.documentElement.dataset.transition = route ? 'open' : 'close';
    const t = document.startViewTransition(async () => {
      show(route);
      await coverReady();
    });
    activeTransition = t;
    t.finished.finally(() => {
      if (activeTransition !== t) return;
      activeTransition = null;
      delete document.documentElement.dataset.transition;
    });
  } else {
    show(route);
  }
}

// ------------------------------------------------------------------ line-up info panel

const info = lineupSection && {
  panel: $('[data-lineup-info]', lineupSection),
  index: $('[data-lineup-index]', lineupSection),
  total: $('[data-lineup-total]', lineupSection),
  name: $('[data-lineup-name]', lineupSection),
  colour: $('[data-lineup-colour]', lineupSection),
  line: $('[data-lineup-line]', lineupSection),
  cta: $('[data-lineup-cta]', lineupSection),
  ctaName: $('[data-lineup-cta-name]', lineupSection),
  backdrop: $('[data-lineup-backdrop]', lineupSection),
  hint: $('[data-lineup-hint]', lineupSection),
};
const pad = (n) => String(n).padStart(2, '0');

function showSelection({ index, href, alt, element }) {
  if (!info?.panel) return;
  const d = element.dataset;
  const total = lineupSection.querySelectorAll('.nocta-lineup__items li').length;
  info.index.textContent = pad(index + 1);
  info.total.textContent = pad(total);
  info.name.textContent = d.name ?? alt;
  info.colour.textContent = d.colour ?? '';
  info.line.textContent = d.line ?? '';
  if (href) info.cta.setAttribute('href', href);
  info.ctaName.textContent = ` ${alt.replace(/, side view$/, '')}`;
  if (info.backdrop.textContent !== d.short) {
    info.backdrop.textContent = d.short ?? '';
    info.backdrop.classList.remove('is-in');
    void info.backdrop.offsetWidth; // restart the fade
    info.backdrop.classList.add('is-in');
  }
  info.panel.hidden = false;
  info.panel.classList.remove('is-in');
  void info.panel.offsetWidth;
  info.panel.classList.add('is-in');
}

if (lineupSection) {
  let firstSelection = true;
  const instance = mountShoeCarousel(lineupSection, {
    debug,
    openNeighbours: true,
    onSelect: (sel) => {
      showSelection(sel);
      if (info?.hint) {
        if (firstSelection) info.hint.hidden = false;
        else info.hint.dataset.done = ''; // the hint fades once the visitor has moved the line-up
      }
      firstSelection = false;
    },
  });
  if (debug) window.__noctaLineup = instance;
}

// ------------------------------------------------------------------ footer

$('[data-back-to-top]')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  $('.site-header__brand')?.focus({ preventScroll: true });
});

// ------------------------------------------------------------------ start

if (view) {
  show(parseRoute(window.location.hash) ?? null, { initial: true });
  window.addEventListener('hashchange', () => {
    const route = parseRoute(window.location.hash);
    if (route === undefined) return; // an in-page anchor such as a skip link
    navigate(route);
  });
}
if (debug) {
  window.__noctaApp = {
    parseRoute,
    get route() {
      return current ? { page: current.page, start: current.start } : null;
    },
    get navigations() {
      return navigations;
    },
    get transitioning() {
      return Boolean(activeTransition);
    },
  };
}
