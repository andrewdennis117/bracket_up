import { cn } from '@/lib/utils';
import type { BracketPhase } from '@/types/tournament';

interface PhaseRailProps {
  phase: BracketPhase;
  /** 0–1 progress within the current phase (e.g. matches or rounds complete
   *  out of the total). Ignored once phase is 'complete'. */
  progress?: number;
  /** Dashboard-card variant: 4px track only, no nodes or labels. */
  compact?: boolean;
  className?: string;
}

const LABELS = ['Round robin', 'Bracket', 'Complete'] as const;

/**
 * Three nodes — Round robin / Bracket / Complete — joined by a two-segment
 * track. Segment 1 always fills brand (violet) as round-robin progresses;
 * segment 2 always fills elim (amber) as the bracket progresses — the
 * segment's color says which phase it belongs to, not whether that phase is
 * currently active. Node color says status: done phases go emerald, the
 * active phase is brand-filled with a glow, future phases are a hollow ring.
 * The terminal "Complete" node is the one exception — spec calls it out as
 * emerald rather than brand once reached, since there's no "future" phase
 * after it for brand-glow's "in progress" meaning to apply to.
 */
export function PhaseRail({ phase, progress = 0, compact = false, className }: PhaseRailProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const isElimination = phase === 'elimination';
  const isComplete = phase === 'complete';

  const seg1 = isElimination || isComplete ? 1 : clamped;
  const seg2 = isComplete ? 1 : isElimination ? clamped : 0;
  const currentIndex = isComplete ? 2 : isElimination ? 1 : 0;

  if (compact) {
    return (
      <div className={cn('flex h-1 w-full overflow-hidden rounded-full', className)} aria-hidden="true">
        <Segment fraction={seg1} colorClassName="bg-brand-line" trackClassName="bg-line" />
        <Segment fraction={seg2} colorClassName="bg-elim" trackClassName="bg-line" />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex h-3.5 items-center justify-between" aria-hidden="true">
        <div className="absolute inset-y-0 left-[7px] right-[7px] top-1/2 flex h-0.5 -translate-y-1/2">
          <Segment fraction={seg1} colorClassName="bg-brand-line" trackClassName="bg-line" />
          <Segment fraction={seg2} colorClassName="bg-elim" trackClassName="bg-line" />
        </div>
        {LABELS.map((_, i) => (
          <PhaseNode key={i} index={i} currentIndex={currentIndex} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs">
        {LABELS.map((label, i) => (
          <span key={label} className={i === currentIndex ? 'font-semibold text-fg' : 'text-fg-muted'}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Segment({
  fraction,
  colorClassName,
  trackClassName,
}: {
  fraction: number;
  colorClassName: string;
  trackClassName: string;
}) {
  return (
    <div className={cn('relative h-full flex-1', trackClassName)}>
      <div className={cn('absolute inset-y-0 left-0', colorClassName)} style={{ width: `${fraction * 100}%` }} />
    </div>
  );
}

function PhaseNode({ index, currentIndex }: { index: number; currentIndex: number }) {
  const isDone = index < currentIndex;
  const isCurrent = index === currentIndex;
  const isTerminal = index === 2;
  const isBracket = index === 1;

  if (isDone || (isCurrent && isTerminal)) {
    return <span className="relative z-10 h-3.5 w-3.5 rounded-full bg-done" />;
  }
  // The bracket screen spec calls this out specifically: "PhaseRail Bracket
  // node is amber" — a per-screen override of the generic brand/glow rule
  // below, not applied to any other node.
  if (isCurrent && isBracket) {
    return <span className="relative z-10 h-3.5 w-3.5 rounded-full bg-elim" />;
  }
  if (isCurrent) {
    return <span className="relative z-10 h-3.5 w-3.5 rounded-full bg-brand shadow-node" />;
  }
  return <span className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-line-strong bg-bg" />;
}
