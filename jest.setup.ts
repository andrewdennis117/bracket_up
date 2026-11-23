import '@testing-library/jest-dom';

// jsdom doesn't implement window.matchMedia at all. Polyfill it to "no
// preference matches" so components using it (prefersReducedMotion, etc.)
// exercise their normal-motion code path instead of crashing under tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom doesn't implement scrollIntoView either. Components already guard
// for its absence defensively (see RoundRobinView), but stubbing it here
// too means tests exercise the "scrolled" branch instead of always hitting
// the no-op fallback.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
