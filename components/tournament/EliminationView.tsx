'use client';

import { useState } from 'react';
import { Tournament, EliminationMatch } from '@/types/tournament';
import { ScoreSheet } from '@/components/bracketup/score-sheet';
import { getTeamDisplayName } from '@/lib/tournament-logic';
import BracketView from './BracketView';
import BracketPhoneView from './BracketPhoneView';
import ChampionView from './ChampionView';

interface EliminationViewProps {
  tournament: Tournament;
  onUpdate: (t: Partial<Tournament>) => void;
  /** Opens the host's ShareSheet — ChampionView's "Share results" uses this. */
  onShare: () => void;
}

/**
 * Round tabs + mini-map on phones, a full multi-column bracket at md+ — both
 * rendered from the same data, toggled by breakpoint via Tailwind classes
 * rather than a user-facing view switcher (the old bracket/list toggle is
 * retired; round tabs supersede what the list view was for).
 */
export default function EliminationView({ tournament, onUpdate, onShare }: EliminationViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<EliminationMatch | null>(null);

  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    if (!team) return 'TBD';
    return getTeamDisplayName(team, tournament.players);
  };

  const openScoreDialog = (match: EliminationMatch) => {
    setSelectedMatch(match);
  };

  const submitScore = (s1: number, s2: number) => {
    if (!selectedMatch) return;
    const winnerId = s1 > s2 ? selectedMatch.team1Id! : selectedMatch.team2Id!;

    let updatedMatches = tournament.eliminationMatches.map((m) =>
      m.id === selectedMatch.id
        ? { ...m, team1Score: s1, team2Score: s2, winnerId, status: 'complete' as const }
        : m
    );

    // Advance winner to next match (round r → round r-1)
    if (selectedMatch.nextMatchId) {
      const isLeftSlot = selectedMatch.position % 2 !== 0;
      updatedMatches = updatedMatches.map((m) =>
        m.id === selectedMatch.nextMatchId
          ? {
              ...m,
              team1Id: isLeftSlot ? winnerId : m.team1Id,
              team2Id: !isLeftSlot ? winnerId : m.team2Id,
            }
          : m
      );
    }

    // Tournament complete when Finals (round === 1) is done
    const finalsMatch = updatedMatches.find((m) => m.round === 1);
    if (finalsMatch?.id === selectedMatch.id) {
      onUpdate({ eliminationMatches: updatedMatches, phase: 'complete' });
    } else {
      onUpdate({ eliminationMatches: updatedMatches });
    }

    setSelectedMatch(null);
  };

  if (tournament.phase === 'complete') {
    return <ChampionView tournament={tournament} onShare={onShare} />;
  }

  return (
    <div className="space-y-5">
      <div className="md:hidden">
        <BracketPhoneView tournament={tournament} onMatchClick={openScoreDialog} />
      </div>
      <div className="hidden md:block">
        <BracketView tournament={tournament} onMatchClick={openScoreDialog} />
      </div>

      {/* Score entry — ties are never allowed in elimination (allowTies defaults to false) */}
      <ScoreSheet
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
        team1={
          selectedMatch
            ? {
                seed: tournament.teams.find((t) => t.id === selectedMatch.team1Id)?.seed,
                name: teamName(selectedMatch.team1Id),
              }
            : { name: '' }
        }
        team2={
          selectedMatch
            ? {
                seed: tournament.teams.find((t) => t.id === selectedMatch.team2Id)?.seed,
                name: teamName(selectedMatch.team2Id),
              }
            : { name: '' }
        }
        initialScore1={selectedMatch?.team1Score}
        initialScore2={selectedMatch?.team2Score}
        onLock={submitScore}
      />
    </div>
  );
}
