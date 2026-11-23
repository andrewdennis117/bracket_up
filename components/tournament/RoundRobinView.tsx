'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Tournament, RoundRobinMatch } from '@/types/tournament';
import {
  calculateStandings,
  getTeamDisplayName,
  getAllRoundsComplete,
  generateEliminationBracket,
} from '@/lib/tournament-logic';
import { MatchRow } from '@/components/bracketup/match-row';
import { StandingsTable, type StandingsRow } from '@/components/bracketup/standings-table';
import { ScoreSheet } from '@/components/bracketup/score-sheet';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { SeedBadge } from '@/components/bracketup/seed-badge';
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/bracketup/bottom-sheet';
import { Button } from '@/components/ui/button';

interface RoundRobinViewProps {
  tournament: Tournament;
  onUpdate: (t: Partial<Tournament>) => void;
}

/**
 * Every round is shown at once, scrollable, and every non-bye match is
 * tappable regardless of round or status — a host can skip a match whose
 * team isn't ready and come back to it later. See the "Round robin screen"
 * section of docs/redesign/implementation-plan.md for why this departs from
 * the single "now playing" row in the design spec's own artboard.
 */
export default function RoundRobinView({ tournament, onUpdate }: RoundRobinViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<RoundRobinMatch | null>(null);
  const [justSettledId, setJustSettledId] = useState<string | null>(null);
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const hasScrolledRef = useRef(false);
  const roundRefs = useRef(new Map<number, HTMLDivElement>());

  const standings = calculateStandings(tournament.teams, tournament.roundRobinMatches);
  const allComplete = getAllRoundsComplete(tournament.roundRobinMatches);
  const completedCount = tournament.roundRobinMatches.filter((m) => m.status === 'complete').length;
  const totalCount = tournament.roundRobinMatches.length;

  const teamName = (id: string) =>
    getTeamDisplayName(tournament.teams.find((t) => t.id === id)!, tournament.players);
  const teamSeed = (id: string) => tournament.teams.find((t) => t.id === id)?.seed;

  const rounds = useMemo(() => {
    const byRound = new Map<number, RoundRobinMatch[]>();
    for (const m of tournament.roundRobinMatches) {
      if (!byRound.has(m.round)) byRound.set(m.round, []);
      byRound.get(m.round)!.push(m);
    }
    return Array.from(byRound.entries()).sort(([a], [b]) => a - b);
  }, [tournament.roundRobinMatches]);

  // On first load, scroll to the first round that still has an incomplete
  // match — currentRound is no longer a display filter, just this hint.
  useEffect(() => {
    if (hasScrolledRef.current) return;
    const target = rounds.find(([, matches]) => matches.some((m) => m.status !== 'complete'));
    const round = target?.[0] ?? tournament.currentRound ?? rounds[0]?.[0];
    const el = round != null ? roundRefs.current.get(round) : undefined;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      hasScrolledRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.length]);

  const standingsRows: StandingsRow[] = standings.map((s) => ({
    id: s.teamId,
    seed: teamSeed(s.teamId) ?? 0,
    name: teamName(s.teamId),
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    pointDiff: s.pointDiff,
  }));

  const submitScore = (score1: number, score2: number) => {
    if (!selectedMatch) return;
    const winnerId = score1 > score2 ? selectedMatch.team1Id : score2 > score1 ? selectedMatch.team2Id : null;

    const updatedMatches = tournament.roundRobinMatches.map((m) =>
      m.id === selectedMatch.id
        ? { ...m, team1Score: score1, team2Score: score2, winnerId, status: 'complete' as const }
        : m
    );

    onUpdate({ roundRobinMatches: updatedMatches });
    setJustSettledId(selectedMatch.id);
    setSelectedMatch(null);
    window.setTimeout(() => setJustSettledId(null), 600);
  };

  const startElimination = () => {
    const seededTeams = standings
      .map((s, i) => ({ ...tournament.teams.find((t) => t.id === s.teamId)!, seed: i + 1 }))
      .filter(Boolean);
    const elimMatches = generateEliminationBracket(seededTeams);
    onUpdate({ phase: 'elimination', teams: seededTeams, eliminationMatches: elimMatches });
    setConfirmStartOpen(false);
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-fg">Standings</h2>
          <span className="text-xs text-fg-muted">Seeds update live</span>
        </div>
        <StandingsTable rows={standingsRows} />
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-fg">Matches</h2>
          <span className="text-xs text-fg-muted">
            {completedCount}/{totalCount} complete
          </span>
        </div>
        {rounds.map(([round, matches]) => (
          <div
            key={round}
            ref={(el) => {
              if (el) roundRefs.current.set(round, el);
              else roundRefs.current.delete(round);
            }}
          >
            <p className="mb-2 mt-5 font-mono text-[11px] tracking-wider text-fg-muted first:mt-0">
              ROUND {round}
            </p>
            {matches.map((match) => {
              const isComplete = match.status === 'complete';
              const winner =
                match.winnerId === match.team1Id ? 'team1' : match.winnerId === match.team2Id ? 'team2' : null;

              return (
                <MatchRow
                  key={match.id}
                  state={isComplete ? 'final' : 'upcoming'}
                  team1={{ seed: teamSeed(match.team1Id), name: teamName(match.team1Id), score: match.team1Score }}
                  team2={{ seed: teamSeed(match.team2Id), name: teamName(match.team2Id), score: match.team2Score }}
                  winner={winner}
                  justSettled={justSettledId === match.id}
                  onClick={() => setSelectedMatch(match)}
                />
              );
            })}
          </div>
        ))}
      </section>

      <StickyActionBar>
        {allComplete ? (
          <Button size="cta" className="flex-1" onClick={() => setConfirmStartOpen(true)}>
            Start bracket
          </Button>
        ) : (
          <p className="flex-1 py-3 text-center text-sm text-fg-muted">
            {completedCount} of {totalCount} matches complete
          </p>
        )}
      </StickyActionBar>

      <ScoreSheet
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
        team1={
          selectedMatch
            ? { seed: teamSeed(selectedMatch.team1Id), name: teamName(selectedMatch.team1Id) }
            : { name: '' }
        }
        team2={
          selectedMatch
            ? { seed: teamSeed(selectedMatch.team2Id), name: teamName(selectedMatch.team2Id) }
            : { name: '' }
        }
        initialScore1={selectedMatch?.team1Score}
        initialScore2={selectedMatch?.team2Score}
        allowTies
        onLock={submitScore}
      />

      <BottomSheet open={confirmStartOpen} onOpenChange={setConfirmStartOpen}>
        <BottomSheetContent aria-label="Start the elimination bracket" className="px-5 pb-7 pt-2.5">
          <BottomSheetTitle className="text-lg font-semibold text-fg">Start the bracket?</BottomSheetTitle>
          <p className="mt-1 text-sm text-fg-muted">Seeds are set from the final standings.</p>
          <div className="mt-4 max-h-64 overflow-y-auto">
            {standings.map((s, i) => (
              <div key={s.teamId} className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-0">
                <SeedBadge seed={i + 1} square />
                <span className="flex-1 truncate text-sm text-fg">{teamName(s.teamId)}</span>
              </div>
            ))}
          </div>
          <Button size="cta" className="mt-4 w-full" onClick={startElimination}>
            Start bracket
          </Button>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}
