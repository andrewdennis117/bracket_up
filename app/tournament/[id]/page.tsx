'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tournament } from '@/types/tournament';
import { getTournament, saveTournament } from '@/lib/tournament-store';
import RoundRobinView from '@/components/tournament/RoundRobinView';
import EliminationView from '@/components/tournament/EliminationView';
import ShareSheet from '@/components/tournament/ShareSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, ChevronLeft, Users } from 'lucide-react';
import { getEventEmoji } from '@/lib/events';
import { PHASE_LABELS, PHASE_BADGE_CLASSES } from '@/lib/phases';
import { PhaseRail } from '@/components/bracketup/phase-rail';

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR, so the tournament is synced in
    // after mount rather than read during render.
    const t = getTournament(params.id as string);
    if (!t) {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournament(t);
  }, [params.id, router]);

  const handleUpdate = (updates: Partial<Tournament>) => {
    if (!tournament) return;
    const updated = { ...tournament, ...updates };
    saveTournament(updated);
    setTournament(updated);
  };

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  const totalPot = tournament.entryFeePerPlayer * tournament.players.length;
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

  // Progress within the current phase, for PhaseRail's fill — all matches
  // regardless of round for round robin (there's no "current round" filter
  // anymore), non-bye matches only for elimination.
  const phaseProgress =
    tournament.phase === 'elimination'
      ? (() => {
          const playable = tournament.eliminationMatches.filter((m) => !m.isBye);
          return playable.length > 0
            ? playable.filter((m) => m.status === 'complete').length / playable.length
            : 0;
        })()
      : tournament.roundRobinMatches.length > 0
        ? tournament.roundRobinMatches.filter((m) => m.status === 'complete').length /
          tournament.roundRobinMatches.length
        : 0;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="-ml-1 p-1 text-fg-muted transition-colors hover:text-fg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="mx-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getEventEmoji(tournament.event)}</span>
                <h1 className="truncate text-base font-bold text-fg">{tournament.name}</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="gap-1.5 p-2 text-fg-muted hover:text-fg"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          {/* Meta row */}
          <div className="ml-1 mt-2 flex items-center gap-2">
            <Badge className={`text-xs border ${PHASE_BADGE_CLASSES[tournament.phase]}`}>
              {PHASE_LABELS[tournament.phase]}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-fg-faint">
              <Users className="h-3 w-3" /> {tournament.teams.length} teams
            </span>
            {totalPot > 0 && (
              <span className="flex items-center gap-1 text-xs text-fg-faint">💰 {fmt(totalPot)} pot</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-visible px-4 py-5">
          <PhaseRail phase={tournament.phase} progress={phaseProgress} className="mb-6" />

          {/* Main content */}
          {tournament.phase === 'round-robin' && (
            <RoundRobinView tournament={tournament} onUpdate={handleUpdate} />
          )}
          {(tournament.phase === 'elimination' || tournament.phase === 'complete') && (
            <EliminationView tournament={tournament} onUpdate={handleUpdate} onShare={() => setShareOpen(true)} />
          )}
        </div>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareCode={tournament.shareCode}
        tournamentName={tournament.name}
      />
    </div>
  );
}
