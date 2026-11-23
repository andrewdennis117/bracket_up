'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getAllTournaments, deleteTournament } from '@/lib/tournament-store';
import { Tournament } from '@/types/tournament';
import { getPhaseProgress, sortTournamentsForDashboard } from '@/lib/tournament-logic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { LogoMark } from '@/components/bracketup/logo-mark';
import { EventIcon } from '@/components/bracketup/event-icon';
import { PhaseRail } from '@/components/bracketup/phase-rail';
import { StickyActionBar } from '@/components/bracketup/sticky-action-bar';
import { Search, ChevronRight, MoreVertical, Download, Trash2, Trophy } from 'lucide-react';
import { exportSeasonCSV, exportPlayerSeasonCSV, downloadCSV } from '@/lib/export';
import { PHASE_LABELS, PHASE_BADGE_CLASSES } from '@/lib/phases';

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);

  useEffect(() => {
    // localStorage is unavailable during SSR, so the list is synced in after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournaments(getAllTournaments());
  }, []);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTournament(deleteTarget.id);
    setTournaments(getAllTournaments());
    setDeleteTarget(null);
  };

  const exportOne = (t: Tournament) => {
    const csv = exportSeasonCSV([t]);
    downloadCSV(csv, `${t.name.replace(/\s+/g, '-').toLowerCase()}-results.csv`);
  };

  const sorted = sortTournamentsForDashboard(tournaments);
  const filtered = sorted.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-line-soft px-5">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <h1 className="text-base font-semibold text-fg">My tournaments</h1>
          </div>
          {tournaments.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More options" />}>
                <MoreVertical className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => downloadCSV(exportSeasonCSV(tournaments), 'bracketup-season-tournaments.csv')}
                >
                  <Download className="h-4 w-4" /> Export tournaments CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadCSV(exportPlayerSeasonCSV(tournaments), 'bracketup-season-players.csv')}
                >
                  <Download className="h-4 w-4" /> Export player stats CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="px-5 pb-28 pt-4">
          {tournaments.length > 3 && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <Input
                placeholder="Search tournaments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-line-strong bg-surface pl-9 text-sm text-fg placeholder:text-fg-muted"
              />
            </div>
          )}

          {tournaments.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-card bg-surface">
                <Trophy className="h-8 w-8 text-fg-muted" />
              </div>
              <p className="mb-1 text-lg font-semibold text-fg">No tournaments yet</p>
              <p className="mb-4 text-sm text-fg-muted">Start one in about a minute. Players join with a code.</p>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm font-medium text-brand-soft hover:underline"
              >
                Join with a code
              </button>
            </div>
          ) : (
            <div>
              {filtered.map((t) => (
                <div key={t.id} className="flex min-h-[76px] items-center gap-3 border-b border-line-soft py-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/tournament/${t.id}`)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface">
                      <EventIcon event={t.event} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-fg">{t.name}</p>
                      <p className="truncate text-[13px] text-fg-muted">
                        {t.players.length} players · {t.format === 'doubles' ? 'Doubles' : 'Singles'} ·{' '}
                        {format(new Date(t.createdAt), 'MMM d')}
                      </p>
                      <PhaseRail phase={t.phase} progress={getPhaseProgress(t)} compact className="mt-2" />
                    </div>
                  </button>

                  <Badge className={`shrink-0 rounded-full border text-xs ${PHASE_BADGE_CLASSES[t.phase]}`}>
                    {PHASE_LABELS[t.phase]}
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-fg-faint" aria-hidden="true" />

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`More options for ${t.name}`}
                          className="shrink-0"
                        />
                      }
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportOne(t)}>
                        <Download className="h-4 w-4" /> Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filtered.length === 0 && search && (
                <p className="py-8 text-center text-sm text-fg-muted">
                  No tournaments matching &quot;{search}&quot;
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <StickyActionBar>
        <Button size="cta" className="flex-1" onClick={() => router.push('/create')}>
          New tournament
        </Button>
      </StickyActionBar>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-fg-muted">This can&apos;t be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
