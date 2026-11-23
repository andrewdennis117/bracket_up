'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/StepIndicator';
import Step1Details from '@/components/wizard/Step1Details';
import Step2Players from '@/components/wizard/Step2Players';
import Step3Pairing from '@/components/wizard/Step3Pairing';
import Step4Prizes from '@/components/wizard/Step4Prizes';
import { Button } from '@/components/ui/button';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { EventType, FormatType, Player, Team, Tournament } from '@/types/tournament';
import {
  generateId,
  generateShareCode,
  generateRoundRobinSchedule,
  randomPairPlayers,
} from '@/lib/tournament-logic';
import { saveTournament } from '@/lib/tournament-store';
import { ChevronLeft } from 'lucide-react';

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [details, setDetails] = useState({
    name: '',
    event: 'disc-golf-putting' as EventType,
    customEvent: '',
    format: 'doubles' as FormatType,
  });

  // Step 2 state
  const [players, setPlayers] = useState<Player[]>([]);

  // Step 3 state
  const [teams, setTeams] = useState<Team[]>([]);

  // Step 4 state
  const [prizes, setPrizes] = useState({
    entryFeePerPlayer: 10,
    firstPercent: 60,
    secondPercent: 40,
  });

  const STEPS = [
    { label: 'Details' },
    { label: 'Players' },
    { label: 'Teams', skipped: details.format === 'singles' },
    { label: 'Prizes' },
  ];

  const handleCreateTournament = () => {
    // If doubles and no teams generated yet, auto-pair
    let finalTeams = teams;
    if (details.format === 'doubles' && teams.length === 0) {
      finalTeams = randomPairPlayers(players);
    }
    // If singles, each player is their own "team"
    if (details.format === 'singles') {
      finalTeams = players.map((p) => ({
        id: generateId(),
        playerIds: [p.id],
        isPreset: false,
      }));
    }

    const rrMatches = generateRoundRobinSchedule(finalTeams);
    const totalRounds = Math.max(...rrMatches.map((m) => m.round), 0);

    const tournament: Tournament = {
      id: generateId(),
      hostId: 'local', // will be replaced with auth uid in phase 2
      hostName: 'Host',
      name: details.name,
      event: details.event,
      customEvent: details.customEvent || undefined,
      format: details.format,
      entryFeePerPlayer: prizes.entryFeePerPlayer,
      prizeSplit: {
        firstPercent: prizes.firstPercent,
        secondPercent: prizes.secondPercent,
      },
      phase: 'round-robin',
      players,
      teams: finalTeams,
      roundRobinMatches: rrMatches,
      eliminationMatches: [],
      shareCode: generateShareCode(),
      createdAt: new Date().toISOString(),
      totalRounds,
      currentRound: 1,
    };

    saveTournament(tournament);
    router.push(`/tournament/${tournament.id}`);
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="mb-7">
          <h1 className="mb-1 text-2xl font-semibold tracking-[-0.02em] text-fg">New tournament</h1>
          <p className="text-sm text-fg-muted">Set up your event in 4 quick steps</p>
        </div>

        <div className="sticky top-0 z-10 mb-8 bg-bg pb-4 pt-1">
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>

        <div>
          {step === 0 && (
            <Step1Details
              data={details}
              onChange={(d) => setDetails((prev) => ({ ...prev, ...d }))}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <Step2Players
              players={players}
              format={details.format}
              onChange={setPlayers}
              onNext={() => {
                setTeams([]); // reset teams if players changed
                setStep(2);
              }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 &&
            (details.format === 'singles' ? (
              <div className="flex min-h-[70dvh] flex-col">
                <div className="flex-1">
                  <p className="py-8 text-center text-sm text-fg-muted">
                    Singles format — each of your {players.length} players competes individually. No teams to set up.
                  </p>
                </div>
                <StickyActionBar className="-mx-5 px-5">
                  <Button
                    size="cta"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    aria-label="Back"
                    className="w-[54px] shrink-0 px-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button size="cta" className="flex-1" onClick={() => setStep(3)}>
                    Next
                  </Button>
                </StickyActionBar>
              </div>
            ) : (
              <Step3Pairing
                players={players}
                teams={teams}
                onChange={setTeams}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            ))}
          {step === 3 && (
            <Step4Prizes
              data={prizes}
              playerCount={players.length}
              onChange={(d) => setPrizes((prev) => ({ ...prev, ...d }))}
              onSubmit={handleCreateTournament}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
