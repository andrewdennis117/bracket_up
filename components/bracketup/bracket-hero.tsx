import { cn } from '@/lib/utils';

interface BracketHeroProps {
  className?: string;
  /** Dims the graphic and skips the seed-1 draw animation — for reuse
   *  outside the home hero (the dashboard's empty state), where this isn't
   *  the primary thing on screen. */
  muted?: boolean;
}

const SEEDS: { seed: number; y: number }[] = [
  { seed: 1, y: 16 },
  { seed: 8, y: 40 },
  { seed: 4, y: 64 },
  { seed: 5, y: 88 },
  { seed: 3, y: 112 },
  { seed: 6, y: 136 },
  { seed: 2, y: 160 },
  { seed: 7, y: 184 },
];

/**
 * 8 seeds converging in 3 rounds to a gold dot — the bracket illustration
 * used on the Home hero (artboard B-Home) and, at a smaller size, the
 * dashboard's empty state. Decorative: aria-hidden, scales via viewBox.
 */
export function BracketHero({ className, muted = false }: BracketHeroProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 350 196"
      className={cn('w-full', muted && 'opacity-50', className)}
    >
      <g fontFamily="var(--font-geist-mono), ui-monospace, monospace" fontSize={11} fill="var(--color-fg-faint)">
        {SEEDS.map(({ seed, y }) => (
          <text key={seed} x={0} y={y} fill={seed === 1 ? 'var(--color-fg)' : undefined}>
            {seed}
          </text>
        ))}
      </g>
      <g stroke="var(--color-line-strong)" strokeWidth={1.5} strokeLinejoin="round" fill="none">
        <path d="M16 12H90V36H16M90 24H170" />
        <path d="M16 60H90V84H16M90 72H170" />
        <path d="M16 108H90V132H16M90 120H170" />
        <path d="M16 156H90V180H16M90 168H170" />
        <path d="M170 24V72M170 48H250M170 120V168M170 144H250M250 48V144M250 96H330" />
      </g>
      <path
        d="M16 12H90V24H170V48H250V96H330"
        stroke="var(--color-brand-line)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        style={!muted ? { strokeDasharray: 420, strokeDashoffset: 420 } : undefined}
        className={!muted ? 'motion-safe:animate-draw motion-reduce:[stroke-dashoffset:0]' : undefined}
      />
      <circle cx={337} cy={96} r={7} fill="var(--color-gold)" />
    </svg>
  );
}
