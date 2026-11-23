import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export interface StandingsRow {
  id: string;
  seed: number;
  name: string;
  wins: number;
  losses: number;
  ties?: number;
  pointDiff: number;
}

interface StandingsTableProps {
  rows: StandingsRow[];
  /**
   * Draw a dashed "Bracket line" marker after this many rows (1-based count
   * of teams that advance). Not wired up anywhere yet — today every team
   * advances to the bracket (see docs/redesign/implementation-plan.md) — but
   * the prop exists so a future top-N cutoff doesn't require touching this
   * component again.
   */
  cutAfter?: number;
  className?: string;
}

export function StandingsTable({ rows, cutAfter, className }: StandingsTableProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex h-8 items-center border-b border-line font-mono text-[11px] tracking-wider text-fg-muted">
        <span className="w-8">#</span>
        <span className="flex-1">PLAYER</span>
        <span className="w-14 text-right">W–L</span>
        <span className="w-[52px] text-right">PTS±</span>
      </div>
      {rows.map((r, i) => (
        <Fragment key={r.id}>
          <div className="flex h-[50px] items-center border-b border-line-soft font-mono tabular-nums">
            <span className={cn('w-8 text-[15px] font-bold', r.seed === 1 ? 'text-gold' : 'text-fg-muted')}>
              {r.seed}
            </span>
            <span className="flex-1 truncate pr-2 font-sans text-base text-fg">{r.name}</span>
            <span className="w-14 text-right text-[17px] font-semibold text-fg">
              {r.wins}–{r.losses}
              {!!r.ties && <span className="ml-1 text-xs font-normal text-fg-muted">{r.ties}T</span>}
            </span>
            <span className="w-[52px] text-right text-sm text-fg-muted">
              {r.pointDiff >= 0 ? '+' : ''}
              {r.pointDiff}
            </span>
          </div>
          {cutAfter != null && i === cutAfter - 1 && i < rows.length - 1 && (
            <div className="relative my-2 flex h-0 items-center justify-center">
              <div className="w-full border-t border-dashed border-line-strong" />
              <span className="absolute bg-bg px-2 font-mono text-[11px] text-fg-muted">Bracket line</span>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
