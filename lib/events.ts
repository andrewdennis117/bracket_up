/**
 * Single source of truth for event-type display (emoji + label).
 * Previously duplicated as `EVENT_ICONS` across app/page.tsx,
 * app/tournament/[id]/page.tsx and app/view/[code]/page.tsx.
 */

import type { EventType } from '@/types/tournament';

export interface EventInfo {
  emoji: string;
  label: string;
}

export const EVENTS: Record<EventType, EventInfo> = {
  'disc-golf-putting': { emoji: '🥏', label: 'Disc golf putting' },
  'disc-golf': { emoji: '🥏', label: 'Disc golf' },
  'ping-pong': { emoji: '🏓', label: 'Ping pong' },
  basketball: { emoji: '🏀', label: 'Basketball' },
  volleyball: { emoji: '🏐', label: 'Volleyball' },
  custom: { emoji: '🏆', label: 'Custom' },
};

export function getEventEmoji(event: EventType): string {
  return EVENTS[event]?.emoji ?? '🏆';
}

/** Falls back to the tournament's free-text `customEvent` for the 'custom' type. */
export function getEventLabel(event: EventType, customEvent?: string): string {
  if (event === 'custom' && customEvent) return customEvent;
  return EVENTS[event]?.label ?? 'Custom';
}
