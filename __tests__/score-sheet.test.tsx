import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ScoreSheet } from '@/components/bracketup/score-sheet';

/**
 * Wraps ScoreSheet with the open/score state a real caller would own, so
 * tests exercise the actual onLock callback contract rather than reaching
 * into internal state.
 */
function Harness({
  allowTies = false,
  onLock,
}: {
  allowTies?: boolean;
  onLock: (s1: number, s2: number) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <ScoreSheet
      open={open}
      onOpenChange={setOpen}
      team1={{ seed: 1, name: 'Dana' }}
      team2={{ seed: 4, name: 'Mike' }}
      allowTies={allowTies}
      onLock={(s1, s2) => {
        onLock(s1, s2);
        setOpen(false);
      }}
    />
  );
}

describe('ScoreSheet', () => {
  it('locks in an 11–9 score in the 4-tap flow: 1, 1, tap field B, 9', async () => {
    const user = userEvent.setup();
    const onLock = jest.fn();
    render(<Harness onLock={onLock} />);

    // Field A (Dana) is active by default.
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByLabelText('Dana score, 11')).toBeInTheDocument();

    // Tap field B to switch — no swap/switch-team key exists.
    await user.click(screen.getByLabelText(/Mike score/));
    await user.click(screen.getByRole('button', { name: '9' }));
    expect(screen.getByLabelText('Mike score, 9')).toBeInTheDocument();

    const lockButton = screen.getByRole('button', { name: /Lock in/ });
    expect(lockButton).toBeEnabled();
    await user.click(lockButton);

    expect(onLock).toHaveBeenCalledWith(11, 9);
  });

  it('has no swap/switch-team key on the keypad', () => {
    render(<Harness onLock={jest.fn()} />);
    expect(screen.queryByLabelText(/swap/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/switch/i)).not.toBeInTheDocument();
  });

  it('disables Lock in when scores are empty or tied, by default', async () => {
    const user = userEvent.setup();
    render(<Harness onLock={jest.fn()} />);

    expect(screen.getByRole('button', { name: /Lock in/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByRole('button', { name: /Lock in/ })).toBeDisabled();

    await user.click(screen.getByLabelText(/Mike score/));
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByRole('button', { name: /Lock in/ })).toBeDisabled();
  });

  it('allows a tied score to lock in when allowTies is true', async () => {
    const user = userEvent.setup();
    const onLock = jest.fn();
    render(<Harness allowTies onLock={onLock} />);

    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByLabelText(/Mike score/));
    await user.click(screen.getByRole('button', { name: '5' }));

    const lockButton = screen.getByRole('button', { name: /Lock in/ });
    expect(lockButton).toBeEnabled();
    await user.click(lockButton);
    expect(onLock).toHaveBeenCalledWith(5, 5);
  });

  it('replaces a leading 0 with the next digit instead of appending', async () => {
    const user = userEvent.setup();
    render(<Harness onLock={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: '0' }));
    expect(screen.getByLabelText('Dana score, 0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '7' }));
    expect(screen.getByLabelText('Dana score, 7')).toBeInTheDocument();
  });

  it('caps a field at 2 digits', async () => {
    const user = userEvent.setup();
    render(<Harness onLock={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByLabelText('Dana score, 11')).toBeInTheDocument();
  });

  it('deletes the last digit of the active field', async () => {
    const user = userEvent.setup();
    render(<Harness onLock={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByLabelText('Dana score, 1')).toBeInTheDocument();
  });

  it('does not auto-move focus to field B after field A gets its 2nd digit', async () => {
    const user = userEvent.setup();
    render(<Harness onLock={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    // Pressing another digit still lands on field A (capped at 2), proving
    // field A, not field B, is still active.
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByLabelText('Dana score, 11')).toBeInTheDocument();
    expect(screen.getByLabelText('Mike score, empty')).toBeInTheDocument();
  });

  it('pre-fills scores when reopened to edit an existing match', () => {
    render(
      <ScoreSheet
        open
        onOpenChange={() => {}}
        team1={{ seed: 1, name: 'Dana' }}
        team2={{ seed: 4, name: 'Mike' }}
        initialScore1={11}
        initialScore2={9}
        onLock={() => {}}
      />
    );
    expect(screen.getByLabelText('Dana score, 11')).toBeInTheDocument();
    expect(screen.getByLabelText('Mike score, 9')).toBeInTheDocument();
  });
});
