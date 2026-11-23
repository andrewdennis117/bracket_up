import { render } from '@testing-library/react';
import { PhaseRail } from '@/components/bracketup/phase-rail';

describe('PhaseRail', () => {
  it('fills only segment 1, proportionally, during round robin', () => {
    const { container } = render(<PhaseRail phase="round-robin" progress={0.4} />);
    const fills = container.querySelectorAll('.bg-brand-line, .bg-elim');
    const seg1 = container.querySelector('.bg-brand-line') as HTMLElement;
    const seg2 = container.querySelector('.bg-elim') as HTMLElement;
    expect(fills).toHaveLength(2);
    expect(seg1.style.width).toBe('40%');
    expect(seg2.style.width).toBe('0%');
  });

  it('locks segment 1 at full and fills segment 2 during elimination', () => {
    const { container } = render(<PhaseRail phase="elimination" progress={0.3} />);
    const seg1 = container.querySelector('.bg-brand-line') as HTMLElement;
    const seg2 = container.querySelector('.bg-elim') as HTMLElement;
    expect(seg1.style.width).toBe('100%');
    expect(seg2.style.width).toBe('30%');
  });

  it('fills both segments fully once complete', () => {
    const { container } = render(<PhaseRail phase="complete" />);
    const seg1 = container.querySelector('.bg-brand-line') as HTMLElement;
    const seg2 = container.querySelector('.bg-elim') as HTMLElement;
    expect(seg1.style.width).toBe('100%');
    expect(seg2.style.width).toBe('100%');
  });

  it('clamps out-of-range progress into 0–1', () => {
    const { container } = render(<PhaseRail phase="round-robin" progress={1.5} />);
    const seg1 = container.querySelector('.bg-brand-line') as HTMLElement;
    expect(seg1.style.width).toBe('100%');
  });

  it('marks "Round robin" as the current label while in round robin', () => {
    const { getByText } = render(<PhaseRail phase="round-robin" />);
    expect(getByText('Round robin')).toHaveClass('font-semibold', 'text-fg');
    expect(getByText('Bracket')).toHaveClass('text-fg-muted');
    expect(getByText('Complete')).toHaveClass('text-fg-muted');
  });

  it('marks "Complete" as current once the tournament is done', () => {
    const { getByText } = render(<PhaseRail phase="complete" />);
    expect(getByText('Complete')).toHaveClass('font-semibold', 'text-fg');
  });

  it('renders no node circles or labels in compact mode', () => {
    const { container, queryByText } = render(<PhaseRail phase="round-robin" progress={0.5} compact />);
    expect(container.querySelectorAll('.rounded-full.bg-done, .rounded-full.bg-brand').length).toBe(0);
    expect(queryByText('Round robin')).not.toBeInTheDocument();
  });
});
