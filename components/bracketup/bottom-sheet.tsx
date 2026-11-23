'use client';

import * as React from 'react';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

/**
 * A bottom sheet matching the redesign spec: dark 72%-opacity scrim with no
 * blur, surface bg, radius-sheet top corners, grab handle, sheetup entrance.
 * Built directly on @base-ui/react/dialog rather than components/ui/sheet.tsx
 * because SheetContent bakes in its own overlay (blur + different scrim) and
 * default close button that this spec explicitly doesn't want, and those are
 * baked into one className string that's awkward to reliably override via
 * tailwind-merge rather than just composing the primitive directly.
 */
export const BottomSheet = SheetPrimitive.Root;
export const BottomSheetTrigger = SheetPrimitive.Trigger;
export const BottomSheetClose = SheetPrimitive.Close;
export const BottomSheetTitle = SheetPrimitive.Title;

export function BottomSheetContent({
  className,
  children,
  ...props
}: SheetPrimitive.Popup.Props) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        className="fixed inset-0 z-50 bg-bg/72 data-starting-style:opacity-0 data-ending-style:opacity-0 data-open:animate-in data-open:fade-in-0 data-open:duration-150 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-150"
      />
      <SheetPrimitive.Popup
        data-slot="bottom-sheet-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-sheet border-t border-line bg-surface shadow-sheet outline-none',
          'data-open:motion-safe:animate-sheet-up',
          'data-open:motion-reduce:animate-in data-open:motion-reduce:fade-in-0 data-open:motion-reduce:duration-[120ms]',
          'data-closed:animate-out data-closed:fade-out-0 data-closed:duration-150',
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
        {children}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}
