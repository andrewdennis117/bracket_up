'use client';

import { Tournament, EliminationMatch } from '@/types/tournament';
import { getTeamDisplayName, getEliminationRoundLabel } from '@/lib/tournament-logic';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BracketViewProps {
  tournament: Tournament;
  /** Omit for a read-only bracket (e.g. the champion screen) — matches render non-interactive. */
  onMatchClick?: (match: EliminationMatch) => void;
  /** Match IDs whose advancing connector renders gold instead of amber —
   *  the champion screen's "champion path in gold" (see getTeamPathMatchIds). */
  highlightMatchIds?: Set<string>;
}

/**
 * Full multi-column bracket with real connector lines — the md+ desktop
 * layout (see BracketPhoneView for the phone round-tabs + mini-map layout).
 * Keeps the absolute-positioning / slot-height approach from the original
 * implementation, which already solved the hard part (connector geometry
 * across columns of halving match counts) correctly; just restyled.
 */
export default function BracketView({ tournament, onMatchClick, highlightMatchIds }: BracketViewProps) {
  const allMatches = tournament.eliminationMatches;
  if (!allMatches.length) return null;

  const maxRound = Math.max(...allMatches.map((m) => m.round));
  // Display order: earliest round (maxRound) → Finals (round 1)
  const rounds = Array.from({ length: maxRound }, (_, i) => maxRound - i);

  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    if (!team) return 'TBD';
    return getTeamDisplayName(team, tournament.players);
  };

  const getSeed = (teamId?: string | null) =>
    teamId ? tournament.teams.find((t) => t.id === teamId)?.seed : undefined;

  return (
    <div
      className="pb-4"
      style={{
        overflowX: 'auto',
        overflowY: 'visible',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        className="flex gap-0"
        style={{
          minWidth: 'max-content',
          minHeight: `${Math.pow(2, maxRound - 1) * 80}px`,
        }}
      >
        {rounds.map((round) => {
          const roundMatches = allMatches
            .filter((m) => m.round === round)
            .sort((a, b) => a.position - b.position);

          const isLastRound = round === 1;
          const totalSlots = Math.pow(2, round - 1); // matches in this round
          const colHeight = Math.pow(2, maxRound - 1) * 80; // total column height in px
          const slotHeight = colHeight / totalSlots;

          return (
            <div key={round} className="relative flex flex-col" style={{ width: '200px' }}>
              {/* Round label */}
              <div className="mb-1 py-1 text-center">
                <span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                  {getEliminationRoundLabel(round)}
                </span>
              </div>

              {/* Matches */}
              <div className="relative flex flex-1 flex-col" style={{ height: `${colHeight}px` }}>
                {roundMatches.map((match, matchIndex) => {
                  const done = match.status === 'complete';
                  const isBye = match.isBye;
                  const canPlay = !!match.team1Id && !!match.team2Id && !isBye && !!onMatchClick;
                  // Ready to play, not yet scored — the "now" glow (spec: this
                  // glow always stays violet, even inside the amber-accented
                  // bracket phase).
                  const isCurrent = canPlay && !done;
                  const isHighlighted = !!highlightMatchIds?.has(match.id);
                  const topOffset = matchIndex * slotHeight + (slotHeight - 72) / 2;

                  const showRightConnector = !isLastRound;
                  const isUpperMatch = matchIndex % 2 === 0;

                  return (
                    <div
                      key={match.id}
                      className="absolute left-0 right-0"
                      style={{ top: `${topOffset}px`, height: '72px' }}
                    >
                      {/* Match card */}
                      <div
                        onClick={() => canPlay && onMatchClick!(match)}
                        className={cn(
                          'mx-2 overflow-hidden rounded-card border transition-all duration-150',
                          isBye
                            ? 'cursor-default border-line bg-bg opacity-30'
                            : isCurrent
                              ? 'cursor-pointer border-brand-deep bg-surface shadow-glow'
                              : done
                                ? 'cursor-pointer border-line bg-surface/50 hover:border-line-strong'
                                : 'cursor-default border-line/50 bg-bg/50'
                        )}
                      >
                        <BracketTeamRow
                          name={teamName(match.team1Id)}
                          seed={getSeed(match.team1Id)}
                          score={match.team1Score}
                          isWinner={done && match.winnerId === match.team1Id}
                          isLoser={done && match.winnerId !== null && match.winnerId !== match.team1Id}
                          showScore={done}
                          isTbd={!match.team1Id}
                        />
                        <div className="h-px bg-line" />
                        <BracketTeamRow
                          name={teamName(match.team2Id)}
                          seed={getSeed(match.team2Id)}
                          score={match.team2Score}
                          isWinner={done && match.winnerId === match.team2Id}
                          isLoser={done && match.winnerId !== null && match.winnerId !== match.team2Id}
                          showScore={done}
                          isTbd={!match.team2Id}
                        />
                      </div>

                      {/* Right connector — the winner's advancing path renders
                          amber per spec ("locked results show the winner with
                          an amber 2px path stub"); everything else is a plain
                          hairline. */}
                      {showRightConnector && (
                        <div className="absolute right-0 top-0 bottom-0" style={{ width: '8px' }}>
                          <div
                            className={cn(
                              'absolute right-0 w-2',
                              done ? cn('h-0.5', isHighlighted ? 'bg-gold' : 'bg-elim') : 'h-px bg-line-strong'
                            )}
                            style={{ top: done ? '35.5px' : '36px' }}
                          />
                          <div
                            className={cn(
                              'absolute right-0',
                              done ? cn('w-0.5', isHighlighted ? 'bg-gold' : 'bg-elim') : 'w-px bg-line-strong'
                            )}
                            style={{
                              top: isUpperMatch ? '36px' : `${-slotHeight + 36}px`,
                              height: `${slotHeight / 2}px`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BracketTeamRowProps {
  name: string;
  seed?: number;
  score?: number;
  isWinner: boolean;
  isLoser: boolean;
  showScore: boolean;
  isTbd: boolean;
}

function BracketTeamRow({ name, seed, score, isWinner, isLoser, showScore, isTbd }: BracketTeamRowProps) {
  return (
    <div className={cn('flex min-h-[30px] items-center gap-1 px-2 py-1.5', isWinner && 'bg-done/10')}>
      {seed && <span className="w-3 shrink-0 font-mono text-[10px] text-fg-muted">{seed}</span>}
      <span
        className={cn(
          'flex-1 truncate text-xs font-medium',
          isTbd ? 'italic text-fg-muted' : isWinner ? 'font-semibold text-fg' : isLoser ? 'text-fg-muted' : 'text-fg'
        )}
      >
        {name}
      </span>
      {showScore && score !== undefined && (
        <span className={cn('ml-1 shrink-0 font-mono text-xs font-bold tabular-nums', isWinner ? 'text-fg' : 'text-fg-muted')}>
          {score}
        </span>
      )}
      {isWinner && <CheckCircle2 className="h-3 w-3 shrink-0 text-done" />}
    </div>
  );
}
