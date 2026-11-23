import confetti from 'canvas-confetti';
import { prefersReducedMotion } from './reduced-motion';

const STORAGE_PREFIX = 'bracketup:celebrated:';

/**
 * Fires the champion-screen confetti burst — gold/violet-400/emerald-400/
 * white, ~80 particles — at most once per device per tournament (tracked in
 * localStorage), and never under prefers-reduced-motion.
 */
export function celebrateOnce(tournamentId: string): void {
  if (typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const key = STORAGE_PREFIX + tournamentId;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    // Storage unavailable (private mode, quota) — still fine to celebrate this one load.
  }

  confetti({
    particleCount: 80,
    spread: 75,
    startVelocity: 45,
    gravity: 0.9,
    ticks: 110, // ~1800ms of visible fall at ~60fps, per spec's duration
    origin: { x: 0.5, y: 0 },
    colors: ['#facc15', '#a78bfa', '#34d399', '#ffffff'], // gold, violet-400, emerald-400, white
  });
}
