'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JoinCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
  className?: string;
}

/** Auto-submits once the 6th character is entered — callers don't need to
 *  check length themselves. */
export function JoinCodeInput({ value, onChange, onSubmit, autoFocus, className }: JoinCodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleChange = (raw: string) => {
    const next = raw.toUpperCase().slice(0, 6);
    onChange(next);
    if (next.length === 6) onSubmit();
  };

  return (
    <div className={cn('flex h-14 overflow-hidden rounded-control border border-line-strong bg-surface', className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        maxLength={6}
        placeholder="Enter code"
        aria-label="Share code"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        className="min-w-0 flex-1 bg-transparent px-4 font-mono text-xl font-medium uppercase tracking-[0.2em] text-fg outline-none placeholder:text-fg-muted placeholder:tracking-normal placeholder:normal-case"
      />
      <button
        type="button"
        aria-label="Join tournament"
        onClick={onSubmit}
        className="flex w-14 shrink-0 items-center justify-center border-l border-line-strong bg-surface-2 text-fg transition-transform duration-quick active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
