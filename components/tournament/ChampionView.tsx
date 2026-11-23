'use client';

import { useEffect } from 'react';
import type { Tournament } from '@/types/tournament';
import {
  calculatePayouts,
  calculateStandings,
  getTeamDisplayName,
  getTeamPathMatchIds,
} from '@/lib/tournament-logic';
import { celebrateOnce } from '@/lib/confetti';
import { exportSeasonCSV, downloadCSV } from '@/lib/export';
import { StandingsTable, type StandingsRow } from '@/components/bracketup/standings-table';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BracketView from './BracketView';
import BracketPhoneView from './BracketPhoneView';
import { Download, Share2 } from 'lucide-react';

interface ChampionViewProps {
  tournament: Tournament;
  onShare: () => void;
}

function getInitials(name: string): string {
  const words = name.split(/[\s&]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * "Final standings" reuses the round-robin StandingsTable (seed order from
 * calculateStandings) rather than a new bracket-placement ranking — the data
 * model only tracks champion/runner-up with certainty beyond that, and the
 * spec doesn't describe how the rest of the field should be ranked.
 */
export default function ChampionView({ tournament, onShare }: ChampionViewProps) {
  const finalsMatch = tournament.eliminationMatches.find((m) => m.round === 1);
  const championId = finalsMatch?.winnerId;
  const runnerUpId = championId
    ? championId === finalsMatch?.team1Id
      ? finalsMatch?.team2Id
      : finalsMatch?.team1Id
    : undefined;

  useEffect(() => {
    if (championId) celebrateOnce(tournament.id);
  }, [tournament.id, championId]);

  const teamName = (id?: string | null) => {
    if (!id) return 'TBD';
    const team = tournament.teams.find((t) => t.id === id);
    return team ? getTeamDisplayName(team, tournament.players) : 'TBD';
  };

  const totalPot = tournament.entryFeePerPlayer * tournament.players.length;
  const payouts =
    championId && runnerUpId && totalPot > 0
      ? calculatePayouts(
          tournament.teams,
          tournament.entryFeePerPlayer,
          tournament.prizeSplit.firstPercent,
          tournament.prizeSplit.secondPercent,
          championId,
          runnerUpId
        )
      : [];
  const firstPayout = payouts.find((p) => p.place === 1);
  const secondPayout = payouts.find((p) => p.place === 2);

  const standings = calculateStandings(tournament.teams, tournament.roundRobinMatches);
  const standingsRows: StandingsRow[] = standings.map((s) => ({
    id: s.teamId,
    seed: tournament.teams.find((t) => t.id === s.teamId)?.seed ?? 0,
    name: teamName(s.teamId),
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    pointDiff: s.pointDiff,
  }));

  const championPathIds = championId
    ? getTeamPathMatchIds(tournament.eliminationMatches, championId)
    : new Set<string>();

  const fmt = (n: number) => {
    // Round first — percentage math (e.g. totalPot * firstPercent / 100) can
    // land a hair off a whole number (28.000000000000004), and `n % 1 === 0`
    // would wrongly treat that as fractional and show two decimals.
    const rounded = Math.round(n * 100) / 100;
    return rounded.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    });
  };

  const handleExport = () => {
    const csv = exportSeasonCSV([tournament]);
    downloadCSV(csv, `${tournament.name.replace(/\s+/g, '-').toLowerCase()}-results.csv`);
  };

  if (!championId) return null;

  return (
    <div className="space-y-8 pb-28">
      {/* Podium */}
      <section className="pt-2 text-center">
        <span className="text-[40px]" aria-hidden="true">
          🏆
        </span>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-gold">Champion</p>

        <div className="mt-5 flex items-end justify-center gap-4">
          {runnerUpId && (
            <PodiumStep name={teamName(runnerUpId)} ring="silver" avatarSize={56} stepHeight={56} nameSize="title" />
          )}
          <PodiumStep
            name={teamName(championId)}
            ring="gold"
            avatarSize={72}
            stepHeight={88}
            nameSize="display"
            glow
          />
        </div>

        {finalsMatch && finalsMatch.team1Score != null && finalsMatch.team2Score != null && (
          <p className="mt-5 font-mono text-[28px] font-bold tracking-[-0.02em] text-fg">
            Final · {finalsMatch.team1Score}–{finalsMatch.team2Score}
          </p>
        )}
      </section>

      {/* Payout breakdown */}
      {totalPot > 0 && firstPayout && secondPayout && (
        <section>
          <div className="flex items-center justify-between border-b border-line py-3">
            <span className="text-sm text-fg-muted">Pot</span>
            <span className="font-mono text-sm text-fg">
              {fmt(totalPot)} = {tournament.players.length} × {fmt(tournament.entryFeePerPlayer)}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-line-soft py-3">
            <span className="text-sm text-fg-muted">1st · {tournament.prizeSplit.firstPercent}%</span>
            <span className="font-mono text-2xl font-bold tracking-[-0.03em] text-gold">
              {fmt(firstPayout.teamAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-fg-muted">2nd · {tournament.prizeSplit.secondPercent}%</span>
            <span className="font-mono text-2xl font-bold tracking-[-0.03em] text-silver">
              {fmt(secondPayout.teamAmount)}
            </span>
          </div>
        </section>
      )}

      {/* Collapsible, read-only bracket + standings */}
      <details className="group border-t border-line py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-fg">
          Bracket
          <span className="text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true">
            ⌄
          </span>
        </summary>
        <div className="mt-4">
          <div className="md:hidden">
            <BracketPhoneView tournament={tournament} highlightMatchIds={championPathIds} />
          </div>
          <div className="hidden md:block">
            <BracketView tournament={tournament} highlightMatchIds={championPathIds} />
          </div>
        </div>
      </details>

      <details className="group border-t border-line py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-fg">
          Final standings
          <span className="text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true">
            ⌄
          </span>
        </summary>
        <div className="mt-4">
          <StandingsTable rows={standingsRows} />
        </div>
      </details>

      <StickyActionBar>
        <Button size="cta" className="flex-1 gap-2" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          Share results
        </Button>
        <Button size="cta" variant="secondary" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </StickyActionBar>
    </div>
  );
}

function PodiumStep({
  name,
  ring,
  avatarSize,
  stepHeight,
  nameSize,
  glow,
}: {
  name: string;
  ring: 'gold' | 'silver';
  avatarSize: number;
  stepHeight: number;
  nameSize: 'title' | 'display';
  glow?: boolean;
}) {
  return (
    <div className="flex w-28 flex-col items-center">
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border-2 font-mono font-bold text-fg',
          ring === 'gold' ? 'border-gold' : 'border-silver'
        )}
        style={{
          width: avatarSize,
          height: avatarSize,
          fontSize: avatarSize * 0.32,
          boxShadow: glow ? '0 0 40px -8px color-mix(in oklch, var(--color-gold) 50%, transparent)' : undefined,
        }}
      >
        {getInitials(name)}
      </div>
      <p
        className={cn('mt-2 truncate text-center font-semibold text-fg', nameSize === 'display' ? 'text-xl' : 'text-base')}
        style={{ maxWidth: avatarSize + 24 }}
      >
        {name}
      </p>
      <div className="mt-3 w-full border-t-2 border-line-strong" style={{ height: stepHeight }} />
    </div>
  );
}
