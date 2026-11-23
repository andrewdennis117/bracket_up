'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventType, FormatType } from '@/types/tournament';
import { EventIcon } from '@/components/bracketup/event-icon';
import { getEventLabel } from '@/lib/events';
import { cn } from '@/lib/utils';

// 5 tiles in a 3+2 grid per spec, matching the Home page's 5-item event list.
// 'disc-golf' (full game, not putting) isn't offered here — the spec never
// mentions it distinctly anywhere in 350 lines of copy, only "Disc golf
// putting" and "Your own game" — but it stays fully supported for display
// (lib/events.ts) on any tournament created before this redesign.
const WIZARD_EVENTS: EventType[] = ['disc-golf-putting', 'ping-pong', 'basketball', 'volleyball', 'custom'];

interface Step1Props {
  data: {
    name: string;
    event: EventType;
    customEvent: string;
    format: FormatType;
  };
  onChange: (data: Partial<Step1Props['data']>) => void;
  onNext: () => void;
}

export default function Step1Details({ data, onChange, onNext }: Step1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = 'Tournament name is required';
    if (data.event === 'custom' && !data.customEvent.trim()) e.customEvent = 'Please name your event';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm text-fg-muted">
          Tournament name
        </Label>
        <Input
          id="name"
          placeholder="e.g. Friday night putting league"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="h-14 border-line-strong bg-surface text-base text-fg placeholder:text-fg-muted"
        />
        {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
      </div>

      <div className="space-y-3">
        <Label className="text-sm text-fg-muted">Event</Label>
        <div className="grid grid-cols-3 gap-3">
          {WIZARD_EVENTS.map((event) => {
            const selected = data.event === event;
            return (
              <button
                key={event}
                type="button"
                onClick={() => onChange({ event })}
                className={cn(
                  'flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-card border-2 bg-surface px-1 text-center transition-colors',
                  selected ? 'border-brand-line shadow-focus' : 'border-transparent'
                )}
              >
                <EventIcon event={event} size="tile" />
                <span className={cn('text-xs font-medium', selected ? 'text-fg' : 'text-fg-muted')}>
                  {getEventLabel(event)}
                </span>
              </button>
            );
          })}
        </div>
        {data.event === 'custom' && (
          <div className="space-y-1">
            <Input
              placeholder="Name your event…"
              value={data.customEvent}
              onChange={(e) => onChange({ customEvent: e.target.value })}
              className="h-12 border-line-strong bg-surface text-fg placeholder:text-fg-muted"
            />
            {errors.customEvent && <p className="text-xs text-danger">{errors.customEvent}</p>}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm text-fg-muted">Format</Label>
        <Tabs value={data.format} onValueChange={(v) => onChange({ format: v as FormatType })}>
          <TabsList className="h-12 w-full">
            <TabsTrigger value="singles" className="h-full text-sm capitalize">
              Singles
            </TabsTrigger>
            <TabsTrigger value="doubles" className="h-full text-sm capitalize">
              Doubles
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Button size="cta" className="w-full" onClick={handleNext}>
        Next: Add players
      </Button>
    </div>
  );
}
