'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogoMark } from '@/components/bracketup/logo-mark';
import { BracketHero } from '@/components/bracketup/bracket-hero';
import { JoinCodeInput } from '@/components/bracketup/join-code-input';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { EventIcon } from '@/components/bracketup/event-icon';
import { Button } from '@/components/ui/button';
import { EVENTS } from '@/lib/events';
import type { EventType } from '@/types/tournament';

// Home shows all 5 event types the wizard also offers (see Step1Details) —
// 'disc-golf' (full game, not putting) is omitted from new selection but
// stays supported for display on tournaments that already have it.
const HOME_EVENTS: EventType[] = ['disc-golf-putting', 'ping-pong', 'basketball', 'volleyball', 'custom'];

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [joinCode, setJoinCode] = useState(searchParams.get('code')?.toUpperCase().slice(0, 6) ?? '');

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length === 6) router.push(`/view/${code}`);
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col md:px-8">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-line-soft px-5 md:px-0">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-base font-semibold tracking-[-0.01em] text-fg">BracketUp</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/tournaments')}
            className="flex h-11 items-center text-sm text-fg-muted hover:text-fg"
          >
            My tournaments
          </button>
        </header>

        <div className="md:flex md:flex-1 md:items-center md:gap-12 md:py-16">
          {/* Hero + bracket illustration */}
          <section className="px-5 pt-9 md:flex-1 md:px-0 md:pt-0">
            <h1 className="text-[38px] font-semibold leading-[1.08] tracking-[-0.035em] text-fg md:text-[48px]">
              Run the whole tournament from your pocket.
            </h1>
            <p className="mt-4 text-base leading-[1.55] text-fg-muted">
              Round robin to set the seeds. A bracket to settle it. The payout, worked out. For ping pong night, the
              putting league, or whatever your crew plays.
            </p>

            <div className="mt-7 md:hidden">
              <BracketHero />
            </div>

            <div className="mt-8 md:mt-7">
              <label htmlFor="home-join" className="mb-2 block text-sm text-fg-muted">
                Have a share code? Watch live, no account needed.
              </label>
              <JoinCodeInput
                value={joinCode}
                onChange={setJoinCode}
                onSubmit={handleJoin}
                autoFocus={!!searchParams.get('code')}
              />
            </div>

            <div className="mt-8 hidden md:block">
              <Button size="cta-lg" className="px-8" onClick={() => router.push('/create')}>
                Start a tournament
              </Button>
            </div>
          </section>

          <div className="hidden md:block md:flex-1">
            <BracketHero />
          </div>
        </div>

        {/* How it works */}
        <section className="px-5 pt-12 md:px-0">
          <div className="flex flex-col md:flex-row md:gap-8">
            <HowItWorksRow
              phase={1}
              first
              phaseColorClass="bg-brand"
              labelColorClass="text-brand-soft"
              title="Round robin"
              description="Everyone plays everyone once. Tap in scores; the standings re-seed as you go."
            >
              <RoundRobinMatrix />
            </HowItWorksRow>

            <HowItWorksRow
              phase={2}
              phaseColorClass="bg-elim"
              labelColorClass="text-elim-fg"
              title="Seeded bracket"
              description="Top seed plays bottom seed. Lose once and you're out."
            >
              <div className="font-mono text-[13px] leading-[1.9] text-fg-muted" aria-hidden="true">
                <div>
                  <span className="text-fg">1</span> v 8
                </div>
                <div>4 v 5</div>
                <div>3 v 6</div>
                <div>2 v 7</div>
              </div>
            </HowItWorksRow>

            <HowItWorksRow
              phase={3}
              phaseColorClass="bg-done"
              labelColorClass="text-done-fg"
              title="Payout"
              description="Set the entry fee and the split once. Everyone sees the same numbers at the end."
            >
              <div className="w-full md:w-auto">
                <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                  <div className="h-full bg-gold" style={{ flex: 70 }} />
                  <div className="h-full bg-gray-500" style={{ flex: 30 }} />
                </div>
                <div className="mt-2.5 flex justify-between font-mono tabular-nums">
                  <div>
                    <p className="text-xs text-fg-muted">1st · 70%</p>
                    <p className="text-2xl font-bold tracking-[-0.03em] text-gold">$56</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-fg-muted">2nd · 30%</p>
                    <p className="text-2xl font-bold tracking-[-0.03em] text-silver">$24</p>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-fg-muted">Example: 8 players, $10 entry</p>
              </div>
            </HowItWorksRow>
          </div>
        </section>

        {/* Events */}
        <section className="px-5 pb-28 pt-10 md:px-0 md:pb-16">
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Singles or doubles, random or picked teams</h2>
          <div>
            {HOME_EVENTS.map((event) => (
              <div key={event} className="flex h-[52px] items-center gap-3.5 border-b border-line-soft last:border-0">
                <EventIcon event={event} />
                <span className="text-base text-fg">{EVENTS[event].label}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="hidden px-5 pb-10 text-sm text-fg-muted md:block md:px-0">BracketUp</footer>
      </div>

      <div className="md:hidden">
        <StickyActionBar>
          <Button size="cta" className="flex-1" onClick={() => router.push('/create')}>
            Start a tournament
          </Button>
        </StickyActionBar>
      </div>
    </div>
  );
}

function HowItWorksRow({
  phase,
  first = false,
  phaseColorClass,
  labelColorClass,
  title,
  description,
  children,
}: {
  phase: number;
  first?: boolean;
  phaseColorClass: string;
  labelColorClass: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-5 border-t border-line-soft py-6 md:flex-1 md:flex-col md:items-start md:border-t-0 md:py-0 ${first ? 'md:pl-0' : 'md:border-l md:pl-8'}`}
    >
      <div className="flex-1">
        <div className={`flex items-center gap-2 font-mono text-xs tracking-wider ${labelColorClass}`}>
          <span className={`h-2 w-2 rounded-[2px] ${phaseColorClass}`} aria-hidden="true" />
          PHASE {phase}
        </div>
        <h2 className="mb-1.5 mt-2 text-xl font-semibold tracking-[-0.02em] text-fg">{title}</h2>
        <p className="text-sm leading-[1.5] text-fg-muted">{description}</p>
      </div>
      <div className="shrink-0 self-center md:mt-4 md:w-full md:self-stretch">{children}</div>
    </div>
  );
}

function RoundRobinMatrix() {
  const played = 9;
  let k = 0;
  const cells: string[] = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (r === c) {
        cells.push('bg-transparent');
      } else if (c > r) {
        cells.push(k < played ? 'bg-brand' : 'bg-surface-2');
        k++;
      } else {
        cells.push('bg-line-soft');
      }
    }
  }
  return (
    <div className="grid w-[84px] grid-cols-6 gap-[3px]" aria-hidden="true">
      {cells.map((bg, i) => (
        <span key={i} className={`block aspect-square rounded-[2px] ${bg}`} />
      ))}
    </div>
  );
}
