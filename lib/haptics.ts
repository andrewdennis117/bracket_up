/**
 * Thin wrapper around navigator.vibrate — feature-detected since Safari/iOS
 * doesn't implement the Vibration API. Used for the ScoreSheet lock-in tap
 * (spec: "haptic navigator.vibrate(10) where supported").
 */

export function vibrate(durationMs: number): void {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Some browsers throw if called outside a user gesture — safe to ignore.
  }
}
