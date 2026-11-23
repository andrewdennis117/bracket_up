'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { Player, Team } from '@/types/tournament';
import { generateId, randomPairPlayers, getTeamDisplayName } from '@/lib/tournament-logic';
import { Shuffle, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step3Props {
  players: Player[];
  teams: Team[];
  onChange: (teams: Team[]) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Manual mode drops the old text-input "add existing team" form (typing two
 * names + an optional team name via a datalist) for the spec's tap-to-pair
 * flow. That also drops the ability to give a team a custom display name —
 * getTeamDisplayName's "Dana & Ray" fallback is all Manual mode produces now,
 * matching the spec's own example text, which doesn't describe a naming step.
 */
export default function Step3Pairing({ players, teams, onChange, onNext, onBack }: Step3Props) {
  const [mode, setMode] = useState<'random' | 'manual'>('random');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const pairedPlayerIds = new Set(teams.flatMap((t) => t.playerIds));
  const unpairedPlayers = players.filter((p) => !pairedPlayerIds.has(p.id));

  const handlePairRemaining = () => {
    const presetTeams = teams.filter((t) => t.isPreset);
    onChange(randomPairPlayers(players, presetTeams));
  };

  const handleReshuffleAll = () => {
    onChange(randomPairPlayers(players, []));
  };

  const removeTeam = (teamId: string) => {
    onChange(teams.filter((t) => t.id !== teamId));
  };

  const tapPlayer = (playerId: string) => {
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
      return;
    }
    if (!selectedPlayerId) {
      setSelectedPlayerId(playerId);
      return;
    }
    const newTeam: Team = {
      id: generateId(),
      playerIds: [selectedPlayerId, playerId],
      isPreset: true,
    };
    onChange([...teams, newTeam]);
    setSelectedPlayerId(null);
  };

  const canContinue = teams.length >= 2;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="flex-1 space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-fg">Teams · {teams.length}</h2>
          {unpairedPlayers.length > 0 && (
            <span className="text-xs text-elim-fg">{unpairedPlayers.length} unpaired</span>
          )}
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'random' | 'manual')}>
          <TabsList className="h-11 w-full">
            <TabsTrigger value="random" className="h-full text-sm">
              Random
            </TabsTrigger>
            <TabsTrigger value="manual" className="h-full text-sm">
              Manual
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'random' && unpairedPlayers.length >= 2 && (
          <Button variant="secondary" className="w-full gap-2" onClick={handlePairRemaining}>
            <Shuffle className="h-4 w-4" />
            {teams.length === 0 ? 'Shuffle teams' : 'Pair remaining'}
          </Button>
        )}

        {mode === 'manual' && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-fg-muted">Tap two players to pair them</p>
            <div className="flex flex-wrap gap-2">
              {unpairedPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => tapPlayer(p.id)}
                  className={cn(
                    'h-11 rounded-control border-2 px-4 text-sm font-medium transition-colors',
                    selectedPlayerId === p.id
                      ? 'border-brand-line bg-brand-deep/40 text-fg'
                      : 'border-line-strong bg-surface-2 text-fg'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {unpairedPlayers.length === 0 && (
              <p className="py-4 text-center text-sm text-fg-muted">Everyone&apos;s paired up.</p>
            )}
          </div>
        )}

        {teams.length > 0 && (
          <div>
            {teams.map((team, i) => (
              // Keyed by team.id, which is freshly generated on every
              // shuffle — new DOM nodes naturally fade in via animate-in,
              // approximating the spec's "150ms crossfade" without a
              // separate transition system.
              <div
                key={team.id}
                className="flex h-[52px] animate-in items-center gap-3 border-b border-line-soft fade-in-0 duration-150"
              >
                <span className="w-5 shrink-0 text-right font-mono text-sm text-fg-muted">{i + 1}</span>
                <span className="flex-1 truncate text-base text-fg">{getTeamDisplayName(team, players)}</span>
                <button
                  type="button"
                  onClick={() => removeTeam(team.id)}
                  aria-label={`Unpair ${getTeamDisplayName(team, players)}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-fg-muted transition-colors hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {mode === 'random' && teams.length > 0 && (
          <Button variant="ghost" className="w-full gap-2 text-fg-muted" onClick={handleReshuffleAll}>
            <Shuffle className="h-4 w-4" />
            Reshuffle all
          </Button>
        )}
      </div>

      {!canContinue && <p className="pb-2 text-center text-xs text-fg-muted">Pair at least 2 teams</p>}
      <StickyActionBar className="-mx-5 px-5">
        <Button size="cta" variant="secondary" onClick={onBack} aria-label="Back" className="w-[54px] shrink-0 px-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button size="cta" className="flex-1" onClick={onNext} disabled={!canContinue}>
          Next
        </Button>
      </StickyActionBar>
    </div>
  );
}
