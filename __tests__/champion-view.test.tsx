import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChampionView from '@/components/tournament/ChampionView';
import { generateEliminationBracket } from '@/lib/tournament-logic';
import type { Team, Tournament } from '@/types/tournament';

// Mocked so the test exercises our own gating logic (once-per-device,
// reduced-motion skip) rather than canvas-confetti's real rendering, which
// jsdom's unimplemented 2D canvas context can't support anyway.
jest.mock('canvas-confetti', () => jest.fn());
import confetti from 'canvas-confetti';

function makeCompleteTournament(entryFeePerPlayer = 10): Tournament {
  const teams: Team[] = Array.from({ length: 4 }, (_, i) => ({
    id: `team-${i + 1}`,
    playerIds: [`p${i + 1}`],
    isPreset: false,
    seed: i + 1,
  }));
  let matches = generateEliminationBracket(teams);
  const semis = matches.filter((m) => m.round === 2);
  const final = matches.find((m) => m.round === 1)!;

  matches = matches.map((m) => {
    if (m.id === semis[0].id) return { ...m, status: 'complete' as const, winnerId: m.team1Id, team1Score: 11, team2Score: 3 };
    if (m.id === semis[1].id) return { ...m, status: 'complete' as const, winnerId: m.team1Id, team1Score: 11, team2Score: 5 };
    return m;
  });
  const champion = semis[0].team1Id!;
  const runnerUp = semis[1].team1Id!;
  matches = matches.map((m) =>
    m.id === final.id
      ? { ...m, status: 'complete' as const, winnerId: champion, team1Id: champion, team2Id: runnerUp, team1Score: 21, team2Score: 17 }
      : m
  );

  return {
    id: 'champ-1',
    hostId: 'local',
    hostName: 'Host',
    name: 'Championship Test',
    event: 'ping-pong',
    format: 'singles',
    entryFeePerPlayer,
    prizeSplit: { firstPercent: 70, secondPercent: 30 },
    phase: 'complete',
    players: teams.map((t, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` })),
    teams,
    roundRobinMatches: [],
    eliminationMatches: matches,
    shareCode: 'CHAMP1',
    createdAt: new Date().toISOString(),
  };
}

describe('ChampionView', () => {
  beforeEach(() => {
    localStorage.clear();
    (confetti as jest.Mock).mockClear();
  });

  it('shows the champion and runner-up names and the final score', () => {
    const t = makeCompleteTournament();
    render(<ChampionView tournament={t} onShare={jest.fn()} />);
    // Each name also appears in the (DOM-present-but-collapsed) Final
    // standings table, so these aren't unique — just confirm they're shown.
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0); // champion
    expect(screen.getAllByText('Player 3').length).toBeGreaterThan(0); // runner-up
    expect(screen.getByText('Final · 21–17')).toBeInTheDocument();
  });

  it('shows the payout breakdown when there is an entry fee', () => {
    render(<ChampionView tournament={makeCompleteTournament(10)} onShare={jest.fn()} />);
    expect(screen.getByText(/\$40 = 4 × \$10/)).toBeInTheDocument(); // pot: 4 players x $10
    expect(screen.getByText('$28')).toBeInTheDocument(); // 1st: 70% of $40
    expect(screen.getByText('$12')).toBeInTheDocument(); // 2nd: 30% of $40
  });

  it('hides the payout section entirely when there is no entry fee', () => {
    render(<ChampionView tournament={makeCompleteTournament(0)} onShare={jest.fn()} />);
    expect(screen.queryByText(/Pot/)).not.toBeInTheDocument();
  });

  it('fires confetti once on first view', () => {
    render(<ChampionView tournament={makeCompleteTournament()} onShare={jest.fn()} />);
    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it('does not fire confetti again on a second view of the same tournament', () => {
    const t = makeCompleteTournament();
    const { unmount } = render(<ChampionView tournament={t} onShare={jest.fn()} />);
    unmount();
    render(<ChampionView tournament={t} onShare={jest.fn()} />);
    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it('calls onShare when "Share results" is clicked', async () => {
    const user = userEvent.setup();
    const onShare = jest.fn();
    render(<ChampionView tournament={makeCompleteTournament()} onShare={onShare} />);
    await user.click(screen.getByRole('button', { name: /Share results/ }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
