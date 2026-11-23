'use client';

import { useEffect, useState } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { vibrate } from '@/lib/haptics';
import { BottomSheet, BottomSheetContent } from './bottom-sheet';

export interface ScoreSheetSide {
  seed?: number;
  name: string;
}

interface ScoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team1: ScoreSheetSide;
  team2: ScoreSheetSide;
  initialScore1?: number;
  initialScore2?: number;
  /** Elimination disallows ties; round robin allows them. */
  allowTies?: boolean;
  onLock: (score1: number, score2: number) => void;
}

// 1 2 3 / 4 5 6 / 7 8 9 / (blank) 0 (delete, appended after the map below).
const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0'] as const;

/**
 * Bottom-sheet score entry with a numeric keypad. No swap/switch-team key by
 * design — the active field changes only by tapping a field (or Tab on
 * desktop, which works for free since the fields are real focusable buttons).
 */
export function ScoreSheet({
  open,
  onOpenChange,
  team1,
  team2,
  initialScore1,
  initialScore2,
  allowTies = false,
  onLock,
}: ScoreSheetProps) {
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [active, setActive] = useState<'team1' | 'team2'>('team1');

  useEffect(() => {
    if (!open) return;
    // Re-sync fields to whichever match was just opened (or reopened to edit).
    setScore1(initialScore1 != null ? String(initialScore1) : '');
    setScore2(initialScore2 != null ? String(initialScore2) : '');
    setActive('team1');
  }, [open, initialScore1, initialScore2]);

  const applyToActive = (updater: (prev: string) => string) => {
    if (active === 'team1') setScore1(updater);
    else setScore2(updater);
  };

  const pressDigit = (digit: string) => {
    applyToActive((prev) => {
      if (prev === '0') return digit; // leading 0 is replaced by the next digit
      if (prev.length >= 2) return prev; // max 2 digits per field
      return prev + digit;
    });
  };

  const pressDelete = () => applyToActive((prev) => prev.slice(0, -1));

  const canLock = score1 !== '' && score2 !== '' && (allowTies || score1 !== score2);

  const lock = () => {
    if (!canLock) return;
    vibrate(10);
    onLock(Number(score1), Number(score2));
  };

  // Desktop/tablet: digits, Backspace and Enter work while the sheet is open.
  // Tab between fields is free — they're real focusable buttons in DOM order.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        pressDigit(e.key);
      } else if (e.key === 'Backspace') {
        pressDelete();
      } else if (e.key === 'Enter') {
        lock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, score1, score2, allowTies]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent aria-label="Enter score" className="px-4 pb-7 pt-2.5">
        <div className="flex gap-2.5">
          <ScoreField side={team1} value={score1} active={active === 'team1'} onSelect={() => setActive('team1')} />
          <ScoreField side={team2} value={score2} active={active === 'team2'} onSelect={() => setActive('team2')} />
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {DIGIT_KEYS.map((digit, i) =>
            digit ? (
              <Key key={digit} label={digit} onPress={() => pressDigit(digit)} />
            ) : (
              <span key={`blank-${i}`} aria-hidden="true" />
            )
          )}
          <Key label="Delete" isDelete onPress={pressDelete} />
        </div>

        <button
          type="button"
          onClick={lock}
          disabled={!canLock}
          className={cn(
            'mt-3.5 h-14 w-full rounded-control text-base font-semibold transition-transform active:scale-[0.97] motion-reduce:active:scale-100',
            canLock ? 'bg-brand text-white' : 'cursor-not-allowed bg-surface-2 text-fg-muted'
          )}
        >
          Lock in <span className="font-mono">{score1 || '–'}–{score2 || '–'}</span>
        </button>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function ScoreField({
  side,
  value,
  active,
  onSelect,
}: {
  side: ScoreSheetSide;
  value: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onFocus={onSelect}
      aria-pressed={active}
      aria-label={`${side.name} score, ${value || 'empty'}`}
      className={cn(
        'flex h-[104px] flex-1 flex-col items-center justify-center gap-1 rounded-card border-2 bg-bg transition-colors',
        active ? 'border-brand-line shadow-focus' : 'border-transparent'
      )}
    >
      <span className="text-[13px] text-fg-muted">{side.seed != null ? `${side.seed} · ${side.name}` : side.name}</span>
      <span className="font-mono text-[52px] font-bold leading-none tracking-[-0.04em] tabular-nums text-fg">
        {value || '–'}
      </span>
    </button>
  );
}

function Key({ label, onPress, isDelete }: { label: string; onPress: () => void; isDelete?: boolean }) {
  return (
    <button
      type="button"
      aria-label={isDelete ? 'Delete' : label}
      onClick={onPress}
      className={cn(
        'flex h-[58px] items-center justify-center rounded-control font-mono text-[26px] font-semibold transition-transform duration-press active:scale-[0.93] motion-reduce:transition-none motion-reduce:active:scale-100',
        isDelete ? 'border border-line bg-surface text-fg' : 'bg-surface-2 text-fg active:bg-gray-700'
      )}
    >
      {isDelete ? <Delete className="h-6 w-6" aria-hidden="true" /> : label}
    </button>
  );
}
