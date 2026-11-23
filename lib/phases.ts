/**
 * Single source of truth for tournament-phase display (label + badge classes).
 * Previously duplicated (and inconsistent — the dashboard said "In Progress"
 * for round-robin while the tournament page said "Round Robin") across
 * app/page.tsx and app/tournament/[id]/page.tsx. Standardized on "Round Robin".
 *
 * `Record<BracketPhase, ...>` is exhaustive by construction — adding a phase
 * to the type will fail to compile here until it's given a label and class.
 */

import type { BracketPhase } from '@/types/tournament';

export const PHASE_LABELS: Record<BracketPhase, string> = {
  setup: 'Draft',
  pairing: 'Draft',
  'round-robin': 'Round Robin',
  elimination: 'Elimination',
  complete: 'Complete',
};

export const PHASE_BADGE_CLASSES: Record<BracketPhase, string> = {
  setup: 'bg-gray-800 text-gray-400 border-gray-700',
  pairing: 'bg-gray-800 text-gray-400 border-gray-700',
  'round-robin': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  elimination: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  complete: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};
