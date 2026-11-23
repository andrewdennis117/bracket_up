import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoundRobinView from '@/components/tournament/RoundRobinView';
import { generateRoundRobinSchedule } from '@/lib/tournament-logic';
import type { Player, Team, Tournament } from '@/types/tournament';

function makeTournament(): Tournament {
  const players: Player[] = Array.from({ length: 4 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
  const teams: Team[] = players.map((p) => ({ id: `team-${p.id}`, playerIds: [p.id], isPreset: false }));
  const roundRobinMatches = generateRoundRobinSchedule(teams);

  return {
    id: 't1',
    hostId: 'local',
    hostName: 'Host',
    name: 'Test Tournament',
    event: 'ping-pong',
    format: 'singles',
    entryFeePerPlayer: 0,
    prizeSplit: { firstPercent: 70, secondPercent: 30 },
    phase: 'round-robin',
    players,
    teams,
    roundRobinMatches,
    eliminationMatches: [],
    shareCode: 'ABC123',
    createdAt: new Date().toISOString(),
    totalRounds: Math.max(...roundRobinMatches.map((m) => m.round)),
    currentRound: 1,
  };
}

describe('RoundRobinView — out-of-order play', () => {
  it('renders every round at once, not just the current one', () => {
    const tournament = makeTournament();
    render(<RoundRobinView tournament={tournament} onUpdate={jest.fn()} />);

    // 4 teams → 3 rounds via the round-robin circle method.
    expect(screen.getByText('ROUND 1')).toBeInTheDocument();
    expect(screen.getByText('ROUND 2')).toBeInTheDocument();
    expect(screen.getByText('ROUND 3')).toBeInTheDocument();
  });

  it('lets a later round be scored while an earlier round is still incomplete', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    const tournament = makeTournament();
    render(<RoundRobinView tournament={tournament} onUpdate={onUpdate} />);

    // Round 1 is untouched (incomplete). Open a Round 2 match directly —
    // this is the exact "team isn't ready, play the next match" workflow.
    const round2Heading = screen.getByText('ROUND 2');
    const round2Section = round2Heading.parentElement!;
    const round2MatchButton = within(round2Section).getAllByRole('button')[0];
    await user.click(round2MatchButton);

    // The ScoreSheet should now be open for that Round 2 match.
    expect(screen.getByRole('dialog', { name: 'Enter score' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByLabelText(/Player [0-9] score, empty/));
    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: /Lock in/ }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [updates] = onUpdate.mock.calls[0];
    const round2Matches = updates.roundRobinMatches.filter((m: { round: number }) => m.round === 2);
    const round1Matches = updates.roundRobinMatches.filter((m: { round: number }) => m.round === 1);

    // The Round 2 match just scored is complete...
    expect(round2Matches.some((m: { status: string }) => m.status === 'complete')).toBe(true);
    // ...while Round 1 was never touched and is still pending.
    expect(round1Matches.every((m: { status: string }) => m.status === 'pending')).toBe(true);
  });

  it('allows a tied score in round robin', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    const tournament = makeTournament();
    render(<RoundRobinView tournament={tournament} onUpdate={onUpdate} />);

    const round1Button = within(screen.getByText('ROUND 1').parentElement!).getAllByRole('button')[0];
    await user.click(round1Button);

    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByLabelText(/Player [0-9] score, empty/));
    await user.click(screen.getByRole('button', { name: '5' }));

    const lockButton = screen.getByRole('button', { name: /Lock in/ });
    expect(lockButton).toBeEnabled();
    await user.click(lockButton);

    const [updates] = onUpdate.mock.calls[0];
    const scored = updates.roundRobinMatches.find((m: { status: string }) => m.status === 'complete');
    expect(scored.winnerId).toBeNull();
  });

  it('shows "Start bracket" only once every match is complete', () => {
    const incomplete = makeTournament();
    const { rerender } = render(<RoundRobinView tournament={incomplete} onUpdate={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Start bracket' })).not.toBeInTheDocument();

    const complete: Tournament = {
      ...incomplete,
      roundRobinMatches: incomplete.roundRobinMatches.map((m, i) => ({
        ...m,
        status: 'complete',
        team1Score: 11,
        team2Score: 9 - i, // keep scores distinct across matches, avoids any tie edge case
        winnerId: m.team1Id,
      })),
    };
    rerender(<RoundRobinView tournament={complete} onUpdate={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Start bracket' })).toBeInTheDocument();
  });
});
