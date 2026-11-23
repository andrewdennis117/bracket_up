'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BracketRound, type BracketRoundMatch } from '@/components/bracketup/bracket-round';
import { getTeamDisplayName, getEliminationRoundLabel } from '@/lib/tournament-logic';
import { cn } from '@/lib/utils';
import type { Tournament, EliminationMatch } from '@/types/tournament';

interface BracketPhoneViewProps {
  tournament: Tournament;
  /** Omit for a read-only bracket (e.g. the champion screen) — matches render non-interactive. */
  onMatchClick?: (match: EliminationMatch) => void;
  /** Match IDs whose "→ next round" caption renders gold instead of amber —
   *  the champion screen's "champion path in gold" (see getTeamPathMatchIds). */
  highlightMatchIds?: Set<string>;
}

/**
 * Phone bracket experience: a mini-map for orientation + one round at a time
 * via tabs, instead of horizontally scrolling a multi-column bracket (which
 * at 390px shows ~1.5 columns and forces two-axis scrolling). The full
 * multi-column bracket lives in BracketView, shown at md+ instead of this.
 */
export default function BracketPhoneView({ tournament, onMatchClick, highlightMatchIds }: BracketPhoneViewProps) {
  const allMatches = tournament.eliminationMatches;
  const maxRound = allMatches.length ? Math.max(...allMatches.map((m) => m.round)) : 1;
  // Bracket progression order: earliest round (highest number) first, Final last.
  const rounds = Array.from({ length: maxRound }, (_, i) => maxRound - i);

  const isRoundComplete = (round: number) => {
    const matches = allMatches.filter((m) => m.round === round && !m.isBye);
    return matches.length > 0 && matches.every((m) => m.status === 'complete');
  };

  const [selectedRound, setSelectedRound] = useState(() => {
    const firstIncomplete = rounds.find((r) => !isRoundComplete(r));
    return String(firstIncomplete ?? rounds[rounds.length - 1] ?? 1);
  });

  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    return team ? getTeamDisplayName(team, tournament.players) : 'TBD';
  };
  const getSeed = (id?: string | null) => (id ? tournament.teams.find((t) => t.id === id)?.seed : undefined);

  if (!allMatches.length) return null;

  return (
    <div>
      <BracketMiniMap
        rounds={rounds}
        allMatches={allMatches}
        selectedRound={Number(selectedRound)}
        onSelectRound={(r) => setSelectedRound(String(r))}
      />

      <Tabs value={selectedRound} onValueChange={(v) => setSelectedRound(v as string)} className="mt-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          {rounds.map((round) => (
            <TabsTrigger key={round} value={String(round)} className="h-11 shrink-0 px-3">
              {getEliminationRoundLabel(round)}
              {isRoundComplete(round) && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-done" aria-hidden="true" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {rounds.map((round) => {
          const roundMatches = allMatches
            .filter((m) => m.round === round)
            .sort((a, b) => a.position - b.position);
          const nextRoundLabel = round > 1 ? getEliminationRoundLabel(round - 1) : undefined;

          const matches: BracketRoundMatch[] = roundMatches.map((m) => ({
            id: m.id,
            team1: { seed: getSeed(m.team1Id), name: teamName(m.team1Id), score: m.team1Score, isTbd: !m.team1Id },
            team2: { seed: getSeed(m.team2Id), name: teamName(m.team2Id), score: m.team2Score, isTbd: !m.team2Id },
            winner: m.winnerId === m.team1Id ? 'team1' : m.winnerId === m.team2Id ? 'team2' : null,
            isBye: m.isBye,
            onClick: onMatchClick && !m.isBye && m.team1Id && m.team2Id ? () => onMatchClick(m) : undefined,
            advancesTo: nextRoundLabel,
            highlight: highlightMatchIds?.has(m.id),
          }));

          return (
            <TabsContent key={round} value={String(round)} className="mt-4">
              <BracketRound matches={matches} accent="elim" />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function BracketMiniMap({
  rounds,
  allMatches,
  selectedRound,
  onSelectRound,
}: {
  rounds: number[];
  allMatches: EliminationMatch[];
  selectedRound: number;
  onSelectRound: (round: number) => void;
}) {
  const width = 100;
  const height = 56;
  const colWidth = width / rounds.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-14 w-full">
      <title>Bracket overview — tap a column to jump to that round</title>
      {rounds.map((round, i) => {
        const matchCount = allMatches.filter((m) => m.round === round).length;
        const isSelected = round === selectedRound;
        const x = i * colWidth;
        const rowHeight = height / Math.max(matchCount, 1);

        return (
          <g
            key={round}
            role="button"
            tabIndex={0}
            aria-label={`Jump to ${getEliminationRoundLabel(round)}`}
            aria-pressed={isSelected}
            onClick={() => onSelectRound(round)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectRound(round);
            }}
            className={cn('cursor-pointer outline-none', !isSelected && 'opacity-80')}
          >
            {isSelected && <rect x={x} y={0} width={colWidth} height={height} className="fill-elim/15" />}
            {Array.from({ length: matchCount }, (_, m) => (
              <rect
                key={m}
                x={x + colWidth * 0.2}
                y={m * rowHeight + rowHeight / 2 - 1}
                width={colWidth * 0.6}
                height={2}
                className={isSelected ? 'fill-elim' : 'fill-line-strong'}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
