'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

interface Step4Props {
  data: {
    entryFeePerPlayer: number;
    firstPercent: number;
    secondPercent: number;
  };
  playerCount: number;
  onChange: (data: Partial<Step4Props['data']>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function Step4Prizes({ data, playerCount, onChange, onSubmit, onBack }: Step4Props) {
  const noPrizes = data.entryFeePerPlayer === 0;
  const totalPot = data.entryFeePerPlayer * playerCount;
  const firstPayout = (totalPot * data.firstPercent) / 100;
  const secondPayout = (totalPot * data.secondPercent) / 100;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

  // Editing one percent field always keeps the other at 100 - value, so
  // there's nothing to validate — the split can never be out of sync.
  const setFirstPercent = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    onChange({ firstPercent: clamped, secondPercent: 100 - clamped });
  };
  const setSecondPercent = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    onChange({ secondPercent: clamped, firstPercent: 100 - clamped });
  };

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="flex-1 space-y-7">
        <div className="space-y-2">
          <Label htmlFor="entry-fee" className="text-sm text-fg-muted">
            Entry fee per player
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[28px] font-bold text-fg-muted">
              $
            </span>
            <input
              id="entry-fee"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={data.entryFeePerPlayer || ''}
              onChange={(e) => onChange({ entryFeePerPlayer: Math.max(0, parseFloat(e.target.value) || 0) })}
              placeholder="0"
              className="h-16 w-full rounded-control border border-line-strong bg-surface pl-10 pr-4 font-mono text-[28px] font-bold tracking-[-0.02em] text-fg outline-none placeholder:text-fg-muted"
            />
          </div>
          {totalPot > 0 && (
            <p className="text-sm text-fg-muted">
              Pot{' '}
              <span className="font-mono text-base font-bold tracking-[-0.03em] text-fg">{fmt(totalPot)}</span>
              <span className="ml-1 text-fg-faint">
                ({playerCount} × {fmt(data.entryFeePerPlayer)})
              </span>
            </p>
          )}
        </div>

        {/* "No prizes" switch — no Switch primitive is installed; a small
            accessible role="switch" button is simpler than adding one. */}
        <button
          type="button"
          role="switch"
          aria-checked={noPrizes}
          onClick={() => onChange({ entryFeePerPlayer: noPrizes ? 10 : 0 })}
          className="flex w-full items-center justify-between border-b border-line py-3"
        >
          <span className="text-sm text-fg">No prizes</span>
          <span
            className={cn(
              'relative h-6 w-10 shrink-0 rounded-full transition-colors',
              noPrizes ? 'bg-brand' : 'bg-surface-2'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                noPrizes ? 'translate-x-[18px]' : 'translate-x-0.5'
              )}
            />
          </span>
        </button>

        {!noPrizes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="first-percent" className="text-xs text-fg-muted">
                  1st place
                </Label>
                <div className="relative">
                  <input
                    id="first-percent"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={data.firstPercent}
                    onChange={(e) => setFirstPercent(parseInt(e.target.value, 10) || 0)}
                    className="h-11 w-full rounded-control border border-line-strong bg-surface pl-3 pr-7 text-fg outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="second-percent" className="text-xs text-fg-muted">
                  2nd place
                </Label>
                <div className="relative">
                  <input
                    id="second-percent"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={data.secondPercent}
                    onChange={(e) => setSecondPercent(parseInt(e.target.value, 10) || 0)}
                    className="h-11 w-full rounded-control border border-line-strong bg-surface pl-3 pr-7 text-fg outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
              <div className="h-full bg-gold" style={{ flex: data.firstPercent }} />
              <div className="h-full bg-gray-500" style={{ flex: data.secondPercent }} />
            </div>

            {totalPot > 0 && (
              <div className="flex justify-between font-mono tabular-nums">
                <div>
                  <p className="text-xs text-fg-muted">1st · {data.firstPercent}%</p>
                  <p className="text-2xl font-bold tracking-[-0.03em] text-gold">{fmt(firstPayout)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-fg-muted">2nd · {data.secondPercent}%</p>
                  <p className="text-2xl font-bold tracking-[-0.03em] text-silver">{fmt(secondPayout)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <StickyActionBar className="-mx-5 px-5">
        <Button size="cta" variant="secondary" onClick={onBack} aria-label="Back" className="w-[54px] shrink-0 px-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button size="cta" className="flex-1" onClick={onSubmit}>
          Create tournament
        </Button>
      </StickyActionBar>
    </div>
  );
}
