import { cn } from '@/lib/utils';

interface SeedBadgeProps {
  seed: number;
  /** Font size in px — spec's range is 11–15 depending on context. */
  size?: number;
  /** 22px surface-2 chip variant (radius 6) instead of a plain number. */
  square?: boolean;
  className?: string;
}

export function SeedBadge({ seed, size = 15, square = false, className }: SeedBadgeProps) {
  const isTopSeed = seed === 1;

  return (
    <span
      className={cn(
        'font-mono font-bold tabular-nums',
        isTopSeed ? 'text-gold' : 'text-fg-muted',
        square && 'inline-flex shrink-0 items-center justify-center rounded-[6px] bg-surface-2',
        className
      )}
      style={square ? { width: 22, height: 22, fontSize: size } : { fontSize: size }}
    >
      {seed}
    </span>
  );
}
