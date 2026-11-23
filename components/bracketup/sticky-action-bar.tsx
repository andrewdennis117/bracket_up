import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StickyActionBarProps {
  /** Compose Button(s) directly — a primary (flex-1) and optionally one
   *  secondary before it, per spec. Sizing/variant is the caller's call. */
  children: ReactNode;
  className?: string;
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn('sticky bottom-0 z-10 flex items-center gap-3 border-t border-line bg-bg px-5 pt-3', className)}
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  );
}
