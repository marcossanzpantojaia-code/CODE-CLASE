import { mountNoctaFluidReveal } from './nocta-fluid-reveal.js';
import { mountScrollHeadline } from './nocta-scroll-headline.js';

const params = new URLSearchParams(window.location.search);
const debug = params.has('debug');

const sweep = document.querySelector('[data-nocta-sweep]');
if (sweep) {
  const instance = mountScrollHeadline(sweep);
  if (debug) window.__noctaSweep = instance;
}

const frame = document.querySelector('[data-nocta-reveal]');
if (frame) {
  // `noidle` and `lockstep` exist for deterministic test runs (with `debug`); defaults are untouched.
  const instance = mountNoctaFluidReveal(frame, {
    debug,
    lockstep: params.has('lockstep'),
    idle: params.has('noidle') ? false : undefined,
  });
  if (debug) window.__noctaReveal = instance;
}
