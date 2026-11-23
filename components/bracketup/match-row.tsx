'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type MatchRowState = 'current' | 'locked' | 'upcoming' | 'final';

export interface MatchRowSide {
  seed?: number;
  name: string;
  score?: number;
}

interface MatchRowProps {
  state: MatchRowState;
  team1: MatchRowSide;
  team2: MatchRowSide;
  /** Which side won — drives score/name emphasis for 'locked' and 'final'. */
  winner?: 'team1' | 'team2' | null;
  onClick?: () => void;
  /** 12px caption centered under the row. */
  statusLine?: ReactNode;
  statusTone?: 'muted' | 'done';
  /** Pass true for exactly the render right after a score locks in to play
   *  the one-shot emerald flash, then drop it back to false. */
  justSettled?: boolean;
  className?: string;
}

/**
 * current/locked render as a full surface card (min 72px); upcoming/final
 * render as a plain hairline row (48px) — the spec reserves the card
 * treatment for a single emphasized match (round robin has none today; see
 * docs/redesign/implementation-plan.md), using it for elimination instead.
 */
export function MatchRow({
  state,
  team1,
  team2,
  winner,
  onClick,
  statusLine,
  statusTone = 'muted',
  justSettled = false,
  className,
}: MatchRowProps) {
  const isCard = state === 'current' || state === 'locked';
  const showScores = state === 'locked' || state === 'final';

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          'flex w-full items-center gap-2 text-left transition-colors',
          isCard
            ? cn(
                'min-h-[72px] rounded-card border bg-surface px-4 py-3',
                state === 'current' && 'border-brand-deep shadow-glow',
                state === 'locked' && 'border-done-deep shadow-locked'
              )
            : 'h-12 border-b border-line-soft px-1',
          // Round robin has no card ('locked') state at all — a match goes
          // straight from upcoming to final — so the flash has to work on
          // the plain hairline row too, not just the card states.
          justSettled && 'motion-safe:animate-settle',
          !onClick && 'cursor-default'
        )}
      >
        <Seed seed={team1.seed} align="left" />
        <NameLabel name={team1.name} muted={state === 'final' && winner === 'team2'} align="left" />

        {showScores ? (
          <ScorePair score1={team1.score} score2={team2.score} winner={winner} />
        ) : (
          <span className="shrink-0 px-2 text-xs font-bold uppercase tracking-wider text-fg-muted">vs</span>
        )}

        <NameLabel name={team2.name} muted={state === 'final' && winner === 'team1'} align="right" />
        <Seed seed={team2.seed} align="right" />
      </button>
      {statusLine && (
        <p className={cn('mt-2 text-center text-xs', statusTone === 'done' ? 'text-done-fg' : 'text-fg-muted')}>
          {statusLine}
        </p>
      )}
    </div>
  );
}

function Seed({ seed, align }: { seed?: number; align: 'left' | 'right' }) {
  if (seed === undefined) return <span className="w-4 shrink-0" />;
  return (
    <span className={cn('w-4 shrink-0 font-mono text-xs text-fg-muted', align === 'right' && 'text-right')}>
      {seed}
    </span>
  );
}

function NameLabel({ name, muted, align }: { name: string; muted: boolean; align: 'left' | 'right' }) {
  return (
    <span
      className={cn(
        'flex-1 truncate text-[17px] font-semibold',
        align === 'right' ? 'text-right' : 'text-left',
        muted ? 'text-fg-muted' : 'text-fg'
      )}
    >
      {name}
    </span>
  );
}

function ScorePair({
  score1,
  score2,
  winner,
}: {
  score1?: number;
  score2?: number;
  winner?: 'team1' | 'team2' | null;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 font-mono text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums">
      <span className={winner === 'team2' ? 'text-fg-muted' : 'text-fg'}>{score1 ?? '–'}</span>
      <span className="text-xl text-fg-faint">–</span>
      <span className={winner === 'team1' ? 'text-fg-muted' : 'text-fg'}>{score2 ?? '–'}</span>
    </span>
  );
}
