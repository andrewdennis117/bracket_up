import { render, screen } from '@testing-library/react';
import { StandingsTable, type StandingsRow } from '@/components/bracketup/standings-table';

function makeRows(count: number): StandingsRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    seed: i + 1,
    name: `Team ${i + 1}`,
    wins: count - i,
    losses: i,
    pointDiff: (count - i) * 2 - i,
  }));
}

describe('StandingsTable', () => {
  it('renders one row per team with W–L and a signed point diff', () => {
    render(<StandingsTable rows={makeRows(3)} />);
    expect(screen.getByText('Team 1')).toBeInTheDocument();
    expect(screen.getByText('3–0')).toBeInTheDocument();
    expect(screen.getByText('+6')).toBeInTheDocument();
  });

  it('shows a negative point diff without a double sign', () => {
    const rows: StandingsRow[] = [{ id: 'a', seed: 1, name: 'Alex', wins: 0, losses: 3, pointDiff: -8 }];
    render(<StandingsTable rows={rows} />);
    expect(screen.getByText('-8')).toBeInTheDocument();
  });

  it('shows the ties suffix only when a team has ties', () => {
    const rows: StandingsRow[] = [
      { id: 'a', seed: 1, name: 'Alex', wins: 2, losses: 1, ties: 1, pointDiff: 3 },
      { id: 'b', seed: 2, name: 'Sam', wins: 1, losses: 2, pointDiff: -3 },
    ];
    render(<StandingsTable rows={rows} />);
    expect(screen.getByText('1T')).toBeInTheDocument();
    expect(screen.queryByText('0T')).not.toBeInTheDocument();
  });

  it('draws no cut line when cutAfter is omitted', () => {
    render(<StandingsTable rows={makeRows(4)} />);
    expect(screen.queryByText('Bracket line')).not.toBeInTheDocument();
  });

  it('draws the cut line after the Nth row when cutAfter is given', () => {
    render(<StandingsTable rows={makeRows(6)} cutAfter={4} />);
    expect(screen.getByText('Bracket line')).toBeInTheDocument();
  });

  it('omits the cut line when it would fall after the last row', () => {
    render(<StandingsTable rows={makeRows(4)} cutAfter={4} />);
    expect(screen.queryByText('Bracket line')).not.toBeInTheDocument();
  });

  it('colors the #1 seed gold and other seeds muted', () => {
    render(<StandingsTable rows={makeRows(3)} />);
    const seedCells = screen.getAllByText(/^[1-3]$/, { selector: 'span' });
    const seed1 = seedCells.find((el) => el.textContent === '1');
    const seed2 = seedCells.find((el) => el.textContent === '2');
    expect(seed1).toHaveClass('text-gold');
    expect(seed2).toHaveClass('text-fg-muted');
  });
});
