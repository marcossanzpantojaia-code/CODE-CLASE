import { mountNoctaFluidReveal } from './nocta-fluid-reveal.js';

const frame = document.querySelector('[data-nocta-reveal]');
if (frame) {
  const params = new URLSearchParams(window.location.search);
  const debug = params.has('debug');
  // `noidle` and `lockstep` exist for deterministic test runs (with `debug`); defaults are untouched.
  const instance = mountNoctaFluidReveal(frame, {
    debug,
    lockstep: params.has('lockstep'),
    idle: params.has('noidle') ? false : undefined,
  });
  if (debug) window.__noctaReveal = instance;
}
