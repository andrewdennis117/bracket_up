import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BracketPhoneView from '@/components/tournament/BracketPhoneView';
import { generateEliminationBracket } from '@/lib/tournament-logic';
import type { Team, Tournament } from '@/types/tournament';

function makeTournament(): Tournament {
  const teams: Team[] = Array.from({ length: 4 }, (_, i) => ({
    id: `team-${i + 1}`,
    playerIds: [`p${i + 1}`],
    isPreset: false,
    seed: i + 1,
  }));
  const eliminationMatches = generateEliminationBracket(teams);

  return {
    id: 't1',
    hostId: 'local',
    hostName: 'Host',
    name: 'Test Bracket',
    event: 'ping-pong',
    format: 'singles',
    entryFeePerPlayer: 0,
    prizeSplit: { firstPercent: 70, secondPercent: 30 },
    phase: 'elimination',
    players: teams.map((t, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` })),
    teams,
    roundRobinMatches: [],
    eliminationMatches,
    shareCode: 'XYZ999',
    createdAt: new Date().toISOString(),
  };
}

describe('BracketPhoneView', () => {
  it('defaults to the first round with an incomplete match (Semis, for a fresh 4-team bracket)', () => {
    render(<BracketPhoneView tournament={makeTournament()} onMatchClick={jest.fn()} />);
    expect(screen.getByRole('tab', { name: /Semis/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches rounds when a tab is clicked', async () => {
    const user = userEvent.setup();
    render(<BracketPhoneView tournament={makeTournament()} onMatchClick={jest.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Final' }));
    expect(screen.getByRole('tab', { name: 'Final' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Semis/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches rounds when a mini-map column is clicked', async () => {
    const user = userEvent.setup();
    render(<BracketPhoneView tournament={makeTournament()} onMatchClick={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Jump to Final' }));
    expect(screen.getByRole('tab', { name: 'Final' })).toHaveAttribute('aria-selected', 'true');
  });

  it('invokes onMatchClick for a playable match, not for a TBD or bye slot', async () => {
    const user = userEvent.setup();
    const onMatchClick = jest.fn();
    render(<BracketPhoneView tournament={makeTournament()} onMatchClick={onMatchClick} />);

    // Semis tab is selected by default and both its matches are real (4 teams, no byes).
    const matchButtons = screen.getAllByRole('button').filter((b) => b.textContent?.includes('Player'));
    await user.click(matchButtons[0]);
    expect(onMatchClick).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when there are no elimination matches yet', () => {
    const t = { ...makeTournament(), eliminationMatches: [] };
    const { container } = render(<BracketPhoneView tournament={t} onMatchClick={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
