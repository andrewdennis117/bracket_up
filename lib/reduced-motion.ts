/**
 * Defensive prefers-reduced-motion check. jsdom doesn't implement
 * window.matchMedia at all (hence the typeof guard, not just an
 * SSR/`typeof window` check), so any component using this needs to tolerate
 * environments where it's simply absent rather than assume a real browser.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
