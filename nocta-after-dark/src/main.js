// The line-up carousel is the home screen. Opening the shoe in the centre goes to its page, a
// hash route (#/nocta, #/air-force-1, #/air-max-plus, optionally followed by /black, /white or
// /orange for the colourway shown at rest). It works from file:// as well. Every page is the
// same pair of components: the scroll-scrubbed cover headline, then the fluid colourway reveal.
// Each page is cloned from its <template> on arrival and destroyed on leaving. Any other hash,
// such as a skip link's #after-dark, is an in-page anchor and leaves the view alone.
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
  'air-max-plus': { title: 'Nike Air Max Plus' },
});
const HOME_TITLE = 'Nike line-up';
const SUFFIX = ' · unofficial concept';

const lineupSection = document.querySelector('[data-nocta-lineup]');
const view = document.querySelector('[data-product-view]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = null; // { page, start, sweep, reveal }
let shownKey = null;
let navigations = 0;

/** null: the home screen; undefined: not a route (an in-page anchor). */
export function parseRoute(hash) {
  if (!hash || hash === '#' || hash === '#/') return null;
  const m = /^#\/([a-z0-9-]+)(?:\/(black|white|orange))?\/?$/.exec(hash);
  if (!m) return undefined;
  return PAGES[m[1]] ? { page: m[1], start: m[2] || 'black' } : null;
}

function unmountPage() {
  if (!current) return;
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
  const sweepEl = view.querySelector('[data-nocta-sweep]');
  const frameEl = view.querySelector('[data-nocta-reveal]');
  current = {
    ...route,
    sweep: sweepEl ? mountScrollHeadline(sweepEl) : null,
    reveal: frameEl ? mountNoctaFluidReveal(frameEl, { ...revealOptions, start: route.start }) : null,
  };
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
    if (lineupSection) lineupSection.hidden = false;
    document.title = `${HOME_TITLE}${SUFFIX}`;
  }
  if (!initial) {
    window.scrollTo(0, 0);
    // Move focus to the new view so the next Tab starts there (no scroll: it is already at the top).
    (route ? view : lineupSection)?.focus({ preventScroll: true });
  }
}

/** Waits (briefly) for the arriving cover image so the transition lands on a finished frame. */
async function coverReady() {
  const img = view.hidden ? null : view.querySelector('.nocta-sweep__image');
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
    t.finished.finally(() => delete document.documentElement.dataset.transition);
  } else {
    show(route);
  }
}

if (lineupSection) {
  const instance = mountShoeCarousel(lineupSection, { debug });
  if (debug) window.__noctaLineup = instance;
}
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
  };
}
