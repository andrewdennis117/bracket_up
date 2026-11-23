import { cn } from '@/lib/utils';

interface LogoMarkProps {
  /** 28px (default, used everywhere) vs 32px (desktop header per spec). */
  size?: 'default' | 'lg';
  className?: string;
}

export function LogoMark({ size = 'default', className }: LogoMarkProps) {
  const tile = size === 'lg' ? 32 : 28;
  const icon = size === 'lg' ? 18 : 16;

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-chip bg-brand', className)}
      style={{ width: tile, height: tile }}
    >
      <svg
        aria-hidden="true"
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
      >
        <path d="M4 5h5v14H4" />
        <path d="M9 12h6" />
        <path d="M15 8h5v8h-5" />
      </svg>
    </div>
  );
}
