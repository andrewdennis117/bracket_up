import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import ShareSheet from '@/components/tournament/ShareSheet';

// Mocked so the test exercises our own share/copy logic rather than the
// qrcode package's real toDataURL, which depends on an HTML canvas 2D
// context jsdom doesn't implement (same class of gap as canvas-confetti).
jest.mock('qrcode', () => ({
  __esModule: true,
  default: { toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,stub') },
}));

// @testing-library/user-event's setup() installs its own navigator.clipboard
// stub, which runs after any mock defined beforehand and clobbers it — so
// each test calls setup() first, then spies on whatever clipboard object
// actually exists afterward, rather than trying to replace it up front.
function setupWithClipboardSpy() {
  const user = userEvent.setup();
  const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  return { user, writeText };
}

// Renders and waits for the mocked QR image to resolve, so its async
// setState doesn't land after a test's assertions and trip an act() warning.
async function renderSettled(props: ComponentProps<typeof ShareSheet>) {
  render(<ShareSheet {...props} />);
  await screen.findByAltText(/QR code/);
}

describe('ShareSheet', () => {
  it('copies the view link when the copy button is clicked', async () => {
    const { user, writeText } = setupWithClipboardSpy();
    await renderSettled({ open: true, shareCode: 'ABC123', tournamentName: 'Test Cup', onClose: jest.fn() });

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/view/ABC123'));
  });

  it('shows "Copied" for 1.5s after copying, then reverts', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    await renderSettled({ open: true, shareCode: 'ABC123', tournamentName: 'Test Cup', onClose: jest.fn() });

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(await screen.findByText('Copied')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await waitFor(() => expect(screen.queryByText('Copied')).not.toBeInTheDocument());
    jest.useRealTimers();
  });

  it('falls back to copying the link when navigator.share is unavailable', async () => {
    const originalShare = (navigator as unknown as { share?: unknown }).share;
    delete (navigator as unknown as { share?: unknown }).share;

    const { user, writeText } = setupWithClipboardSpy();
    await renderSettled({ open: true, shareCode: 'ABC123', tournamentName: 'Test Cup', onClose: jest.fn() });
    await user.click(screen.getByRole('button', { name: /Share link/ }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/view/ABC123'));

    if (originalShare) (navigator as unknown as { share?: unknown }).share = originalShare;
  });

  it('uses navigator.share when available, instead of copying', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    (navigator as unknown as { share: typeof share }).share = share;

    const { user, writeText } = setupWithClipboardSpy();
    await renderSettled({ open: true, shareCode: 'ABC123', tournamentName: 'Test Cup', onClose: jest.fn() });
    await user.click(screen.getByRole('button', { name: /Share link/ }));

    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining('/view/ABC123') }));
    expect(writeText).not.toHaveBeenCalled();

    delete (navigator as unknown as { share?: unknown }).share;
  });

  it('shows the share code in the sheet', async () => {
    await renderSettled({ open: true, shareCode: 'ABC123', tournamentName: 'Test Cup', onClose: jest.fn() });
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });
});
