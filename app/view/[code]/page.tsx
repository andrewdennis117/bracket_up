'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tournament } from '@/types/tournament';
import { getTournamentByShareCode } from '@/lib/tournament-store';
import { calculateStandings, getTeamDisplayName, getPhaseProgress } from '@/lib/tournament-logic';
import { Badge } from '@/components/ui/badge';
import { getEventEmoji } from '@/lib/events';
import { MatchRow } from '@/components/bracketup/match-row';
import { StandingsTable, type StandingsRow } from '@/components/bracketup/standings-table';
import { PhaseRail } from '@/components/bracketup/phase-rail';
import { BracketHero } from '@/components/bracketup/bracket-hero';
import { JoinCodeInput } from '@/components/bracketup/join-code-input';
import BracketPhoneView from '@/components/tournament/BracketPhoneView';
import BracketView from '@/components/tournament/BracketView';
import ChampionView from '@/components/tournament/ChampionView';

/**
 * Read-only mirror of the host screens: same PhaseRail, StandingsTable,
 * MatchRow and bracket layouts, all with no tap-to-score handlers wired up
 * (BracketView/BracketPhoneView already render non-interactive when
 * onMatchClick is omitted — see the PR 4 note on that). No "Teams" section —
 * the host-side round robin screen dropped individual team-roster display
 * too (see PR 3), so this keeps parity rather than showing participants
 * something the host view itself doesn't.
 */
export default function ParticipantView() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryCode, setRetryCode] = useState('');

  useEffect(() => {
    // localStorage is unavailable during SSR, so the tournament is synced in
    // after mount rather than read during render.
    const t = getTournamentByShareCode(params.code as string);
    if (!t) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotFound(true);
      return;
    }
    setTournament(t);
  }, [params.code]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center">
        <div className="mb-6 w-[50%] max-w-[180px]">
          <BracketHero muted />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-fg">We couldn&apos;t find that tournament</h1>
        <p className="mb-6 text-sm text-fg-muted">Check the share code and try again.</p>
        <JoinCodeInput
          value={retryCode}
          onChange={setRetryCode}
          onSubmit={() => {
            if (retryCode.length === 6) window.location.href = `/view/${retryCode}`;
          }}
          className="w-full max-w-xs"
        />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    if (!team) return 'TBD';
    return getTeamDisplayName(team, tournament.players);
  };
  const teamSeed = (id?: string | null) => tournament.teams.find((t) => t.id === id)?.seed;

  const standings = calculateStandings(tournament.teams, tournament.roundRobinMatches);
  const standingsRows: StandingsRow[] = standings.map((s) => ({
    id: s.teamId,
    seed: teamSeed(s.teamId) ?? 0,
    name: teamName(s.teamId),
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    pointDiff: s.pointDiff,
  }));

  const rrRounds = (() => {
    const byRound = new Map<number, typeof tournament.roundRobinMatches>();
    for (const m of tournament.roundRobinMatches) {
      if (!byRound.has(m.round)) byRound.set(m.round, []);
      byRound.get(m.round)!.push(m);
    }
    return Array.from(byRound.entries()).sort(([a], [b]) => a - b);
  })();

  if (tournament.phase === 'complete') {
    return <ChampionView tournament={tournament} onShare={() => {}} readOnly />;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-lg">
        <div className="border-b border-line-soft px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getEventEmoji(tournament.event)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-fg">{tournament.name}</h1>
                <Badge variant="outline" className="shrink-0 border-line-strong text-xs text-fg-muted">
                  View only
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-4 py-5">
          <PhaseRail phase={tournament.phase} progress={getPhaseProgress(tournament)} />

          {tournament.phase === 'round-robin' ? (
            <>
              <section>
                <div className="mb-1 flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-fg">Standings</h2>
                  <span className="text-xs text-fg-muted">Seeds update live</span>
                </div>
                <StandingsTable rows={standingsRows} />
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold tracking-[-0.02em] text-fg">Matches</h2>
                {rrRounds.map(([round, matches]) => (
                  <div key={round}>
                    <p className="mb-2 mt-5 font-mono text-[11px] tracking-wider text-fg-muted first:mt-0">
                      ROUND {round}
                    </p>
                    {matches.map((match) => {
                      const winner =
                        match.winnerId === match.team1Id
                          ? 'team1'
                          : match.winnerId === match.team2Id
                            ? 'team2'
                            : null;
                      return (
                        <MatchRow
                          key={match.id}
                          state={match.status === 'complete' ? 'final' : 'upcoming'}
                          team1={{ seed: teamSeed(match.team1Id), name: teamName(match.team1Id), score: match.team1Score }}
                          team2={{ seed: teamSeed(match.team2Id), name: teamName(match.team2Id), score: match.team2Score }}
                          winner={winner}
                        />
                      );
                    })}
                  </div>
                ))}
              </section>
            </>
          ) : (
            <section>
              <div className="md:hidden">
                <BracketPhoneView tournament={tournament} />
              </div>
              <div className="hidden md:block">
                <BracketView tournament={tournament} />
              </div>
            </section>
          )}

          <p className="py-2 text-center text-xs text-fg-muted">Updates automatically</p>
        </div>
      </div>
    </div>
  );
}
