// Lint config for the standalone browser concept. ESLint 10 resolves the nearest config per
// file, so the repository's `npm run lint` uses this one here and the backend's config elsewhere.
import js from '@eslint/js';

const readonly = (names) => Object.fromEntries(names.map((n) => [n, 'readonly']));

const browser = readonly([
  'window', 'document', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame',
  'IntersectionObserver', 'ResizeObserver', 'AbortController', 'Image', 'HTMLElement',
  'HTMLCanvasElement', 'EventTarget', 'Element', 'Event', 'URL', 'URLSearchParams',
  'getComputedStyle', 'console', 'WebGLRenderingContext', 'WebGL2RenderingContext',
  'DOMMatrixReadOnly', 'location',
]);

const node = readonly(['process', 'Buffer', 'URL', 'console']);

export default [
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: browser },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Node scripts; callbacks passed to page.evaluate() run in the browser.
    files: ['tests/**/*.mjs'],
    languageOptions: { globals: { ...node, ...browser } },
  },
];
