import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import Step2Players from '@/components/wizard/Step2Players';
import Step3Pairing from '@/components/wizard/Step3Pairing';
import Step4Prizes from '@/components/wizard/Step4Prizes';
import type { Player, Team } from '@/types/tournament';

/** Step4Prizes's percent inputs are controlled — driving them in a test
 *  needs onChange actually fed back as new props, same as a real caller. */
function PrizesHarness({
  initial,
  onSubmit,
}: {
  initial: { entryFeePerPlayer: number; firstPercent: number; secondPercent: number };
  onSubmit?: () => void;
}) {
  const [data, setData] = useState(initial);
  return (
    <Step4Prizes
      data={data}
      playerCount={8}
      onChange={(d) => setData((prev) => ({ ...prev, ...d }))}
      onSubmit={onSubmit ?? jest.fn()}
      onBack={jest.fn()}
    />
  );
}

describe('Step2Players — paste a list to add many', () => {
  it('splits a comma-separated paste into multiple players', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Step2Players players={[]} format="singles" onChange={onChange} onNext={jest.fn()} onBack={jest.fn()} />);

    const input = screen.getByPlaceholderText('Add player');
    await user.click(input);
    await user.paste('Dana, Mike, Sam');

    const added = onChange.mock.calls[0][0];
    expect(added.map((p: Player) => p.name)).toEqual(['Dana', 'Mike', 'Sam']);
  });

  it('splits a newline-separated paste into multiple players', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Step2Players players={[]} format="singles" onChange={onChange} onNext={jest.fn()} onBack={jest.fn()} />);

    const input = screen.getByPlaceholderText('Add player');
    await user.click(input);
    await user.paste('Dana\nMike\nSam');

    const added = onChange.mock.calls[0][0];
    expect(added.map((p: Player) => p.name)).toEqual(['Dana', 'Mike', 'Sam']);
  });

  it('skips duplicates (case-insensitive) within a pasted list', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const existing: Player[] = [{ id: 'p1', name: 'Dana' }];
    render(
      <Step2Players players={existing} format="singles" onChange={onChange} onNext={jest.fn()} onBack={jest.fn()} />
    );

    const input = screen.getByPlaceholderText('Add player');
    await user.click(input);
    await user.paste('dana, Mike');

    const added = onChange.mock.calls[0][0];
    expect(added.map((p: Player) => p.name)).toEqual(['Dana', 'Mike']);
  });

  it('a single pasted name without a separator still goes through the normal input', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Step2Players players={[]} format="singles" onChange={onChange} onNext={jest.fn()} onBack={jest.fn()} />);

    const input = screen.getByPlaceholderText('Add player');
    await user.click(input);
    await user.paste('Dana');
    expect(onChange).not.toHaveBeenCalled(); // pasted into the field, not yet submitted

    await user.click(screen.getByRole('button', { name: 'Add player' }));
    expect(onChange.mock.calls[0][0].map((p: Player) => p.name)).toEqual(['Dana']);
  });
});

describe('Step3Pairing — tap two players to pair them', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Dana' },
    { id: 'p2', name: 'Mike' },
    { id: 'p3', name: 'Sam' },
    { id: 'p4', name: 'Lee' },
  ];

  it('pairs two tapped players into a team', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Step3Pairing players={players} teams={[]} onChange={onChange} onNext={jest.fn()} onBack={jest.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Manual' }));
    await user.click(screen.getByRole('button', { name: 'Dana' }));
    await user.click(screen.getByRole('button', { name: 'Mike' }));

    const teams: Team[] = onChange.mock.calls[0][0];
    expect(teams).toHaveLength(1);
    expect(teams[0].playerIds.sort()).toEqual(['p1', 'p2']);
    expect(teams[0].isPreset).toBe(true);
  });

  it('tapping the same player twice deselects instead of pairing them with themself', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Step3Pairing players={players} teams={[]} onChange={onChange} onNext={jest.fn()} onBack={jest.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Manual' }));
    await user.click(screen.getByRole('button', { name: 'Dana' }));
    await user.click(screen.getByRole('button', { name: 'Dana' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('only shows unpaired players as tappable chips', async () => {
    const user = userEvent.setup();
    const teams: Team[] = [{ id: 't1', playerIds: ['p1', 'p2'], isPreset: true }];
    render(<Step3Pairing players={players} teams={teams} onChange={jest.fn()} onNext={jest.fn()} onBack={jest.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Manual' }));
    expect(screen.queryByRole('button', { name: 'Dana' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sam' })).toBeInTheDocument();
  });
});

describe('Step4Prizes — self-balancing percent split', () => {
  const initial = { entryFeePerPlayer: 10, firstPercent: 60, secondPercent: 40 };

  it('editing 1st place updates 2nd place to keep the sum at 100', async () => {
    const user = userEvent.setup();
    render(<PrizesHarness initial={initial} />);

    const firstInput = screen.getByLabelText('1st place');
    await user.clear(firstInput);
    await user.type(firstInput, '75');

    expect(firstInput).toHaveValue(75);
    expect(screen.getByLabelText('2nd place')).toHaveValue(25);
  });

  it('editing 2nd place updates 1st place to keep the sum at 100', async () => {
    const user = userEvent.setup();
    render(<PrizesHarness initial={initial} />);

    const secondInput = screen.getByLabelText('2nd place');
    await user.clear(secondInput);
    await user.type(secondInput, '10');

    expect(secondInput).toHaveValue(10);
    expect(screen.getByLabelText('1st place')).toHaveValue(90);
  });

  it('hides the split section when "No prizes" is on', async () => {
    const user = userEvent.setup();
    render(<PrizesHarness initial={initial} />);

    expect(screen.getByLabelText('1st place')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'No prizes' }));
    expect(screen.queryByLabelText('1st place')).not.toBeInTheDocument();
  });

  it('calls onSubmit when "Create tournament" is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PrizesHarness initial={initial} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Create tournament' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
