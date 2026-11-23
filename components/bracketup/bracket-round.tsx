import { cn } from '@/lib/utils';

export interface BracketRoundSide {
  seed?: number;
  name: string;
  score?: number;
  isTbd?: boolean;
}

export interface BracketRoundMatch {
  id: string;
  team1: BracketRoundSide;
  team2: BracketRoundSide;
  winner?: 'team1' | 'team2' | null;
  isBye?: boolean;
  onClick?: () => void;
  /** Short caption under the box, e.g. "→ Semi 1". Omit for the final round. */
  advancesTo?: string;
}

interface BracketRoundProps {
  matches: BracketRoundMatch[];
  /** Amber accent for elimination-phase styling vs the default brand/violet. */
  accent?: 'brand' | 'elim';
  className?: string;
}

/**
 * One round's column of match boxes. The right-angled lines actually joining
 * a match to its sibling and the next round (the "bracket" look across
 * columns) are a BracketView-level concern, not this component's — this just
 * renders the box and an optional "→ Semi 1" stub caption per spec.
 */
export function BracketRound({ matches, accent = 'brand', className }: BracketRoundProps) {
  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      {matches.map((m) => (
        <BracketMatchBox key={m.id} match={m} accent={accent} />
      ))}
    </div>
  );
}

function BracketMatchBox({ match, accent }: { match: BracketRoundMatch; accent: 'brand' | 'elim' }) {
  const { team1, team2, winner, isBye, onClick, advancesTo } = match;

  if (isBye) {
    return (
      <div className="flex h-11 items-center justify-center rounded-control border border-line bg-bg opacity-40">
        <span className="text-sm text-fg-muted">Bye</span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          'w-full overflow-hidden rounded-control border border-line bg-surface text-left',
          !onClick && 'cursor-default'
        )}
      >
        <BracketSideRow side={team1} isWinner={winner === 'team1'} isLoser={winner === 'team2'} />
        <div className="h-px bg-line" />
        <BracketSideRow side={team2} isWinner={winner === 'team2'} isLoser={winner === 'team1'} />
      </button>
      {advancesTo && (
        <p className={cn('mt-1 text-right text-xs', accent === 'elim' ? 'text-elim-fg' : 'text-brand-soft')}>
          → {advancesTo}
        </p>
      )}
    </div>
  );
}

function BracketSideRow({
  side,
  isWinner,
  isLoser,
}: {
  side: BracketRoundSide;
  isWinner: boolean;
  isLoser: boolean;
}) {
  return (
    <div className={cn('flex h-11 items-center gap-2 px-3', isWinner && 'bg-done/10')}>
      {side.seed !== undefined && <span className="w-4 shrink-0 font-mono text-xs text-fg-muted">{side.seed}</span>}
      <span
        className={cn(
          'flex-1 truncate text-sm font-medium',
          side.isTbd ? 'italic text-fg-muted' : isWinner ? 'font-semibold text-fg' : isLoser ? 'text-fg-muted' : 'text-fg'
        )}
      >
        {side.name}
      </span>
      {side.score !== undefined && (
        <span
          className={cn('shrink-0 font-mono text-sm font-bold tabular-nums', isWinner ? 'text-fg' : 'text-fg-muted')}
        >
          {side.score}
        </span>
      )}
    </div>
  );
}
