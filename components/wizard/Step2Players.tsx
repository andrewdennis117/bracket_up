'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { Player } from '@/types/tournament';
import { generateId } from '@/lib/tournament-logic';
import { Plus, X, ChevronLeft } from 'lucide-react';

interface Step2Props {
  players: Player[];
  format: 'singles' | 'doubles';
  onChange: (players: Player[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Players({ players, format, onChange, onNext, onBack }: Step2Props) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addNames = (names: string[]) => {
    const existing = new Set(players.map((p) => p.name.toLowerCase()));
    const toAdd: Player[] = [];
    let skipped = 0;

    for (const raw of names) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      existing.add(key);
      toAdd.push({ id: generateId(), name: trimmed });
    }

    if (toAdd.length > 0) onChange([...players, ...toAdd]);
    setError(skipped > 0 && toAdd.length === 0 ? 'Already added' : '');
    setInputValue('');
    inputRef.current?.focus();
  };

  const removePlayer = (id: string) => {
    onChange(players.filter((p) => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addNames([inputValue]);
  };

  // Paste a comma- or newline-separated list to add many players at once.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!/[,\n]/.test(text)) return; // a single name pastes normally
    e.preventDefault();
    addNames(text.split(/[,\n]+/));
  };

  const min = format === 'doubles' ? 4 : 2;
  const canContinue = players.length >= min;
  const hasSolo = format === 'doubles' && players.length % 2 !== 0;

  const handleNext = () => {
    if (!canContinue) return;
    onNext();
  };

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="flex-1 space-y-4">
        <h2 className="text-lg font-semibold text-fg">Players · {players.length}</h2>

        {/* Pinned add-player row */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Add player"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="h-12 flex-1 border-line-strong bg-surface text-base text-fg placeholder:text-fg-muted"
          />
          <Button size="icon-lg" onClick={() => addNames([inputValue])} aria-label="Add player">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}

        {players.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">
            Add players above — paste a comma or newline list to add many at once.
          </p>
        ) : (
          <div>
            {players.map((player, i) => (
              <div key={player.id} className="flex h-[52px] items-center gap-3 border-b border-line-soft">
                <span className="w-5 shrink-0 text-right font-mono text-sm text-fg-muted">{i + 1}</span>
                <span className="flex-1 truncate text-base text-fg">{player.name}</span>
                <button
                  type="button"
                  onClick={() => removePlayer(player.id)}
                  aria-label={`Remove ${player.name}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-fg-muted transition-colors hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!canContinue ? (
        <p className="pb-2 text-center text-xs text-fg-muted">
          Add at least {min} players for {format}
        </p>
      ) : (
        hasSolo && (
          <p className="pb-2 text-center text-xs text-elim-fg">
            Odd number of players — the last one gets a solo team with extra byes
          </p>
        )
      )}
      <StickyActionBar className="-mx-5 px-5">
        <Button size="cta" variant="secondary" onClick={onBack} aria-label="Back" className="w-[54px] shrink-0 px-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button size="cta" className="flex-1" onClick={handleNext} disabled={!canContinue}>
          Next
        </Button>
      </StickyActionBar>
    </div>
  );
}
