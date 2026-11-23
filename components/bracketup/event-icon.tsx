import type { EventType } from '@/types/tournament';
import { getEventEmoji } from '@/lib/events';
import { cn } from '@/lib/utils';

interface EventIconProps {
  event: EventType;
  /** 20px (lists) or 28px (wizard tiles) per spec. */
  size?: 'list' | 'tile';
  className?: string;
}

/** Decorative only (aria-hidden) — always pair with the event name as visible text. */
export function EventIcon({ event, size = 'list', className }: EventIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block leading-none', className)}
      style={{ fontSize: size === 'tile' ? 28 : 20 }}
    >
      {getEventEmoji(event)}
    </span>
  );
}
