import { Team, RoundRobinMatch, EliminationMatch, Player, Tournament } from '@/types/tournament';

// ─── ID generators ───────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function generateShareCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Team pairing ────────────────────────────────────────────────────────────

/**
 * Randomly pair players into teams of 2.
 * If odd number of players, last player is a solo team (will receive byes appropriately).
 */
export function randomPairPlayers(
  players: Player[],
  existingTeams: Team[] = []
): Team[] {
  // Collect player ids already on existing teams
  const pairedIds = new Set(existingTeams.flatMap((t) => t.playerIds));
  const unpairedPlayers = players.filter((p) => !pairedIds.has(p.id));

  // Shuffle unpaired players
  const shuffled = [...unpairedPlayers].sort(() => Math.random() - 0.5);

  const newTeams: Team[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const player1 = shuffled[i];
    const player2 = shuffled[i + 1];
    newTeams.push({
      id: generateId(),
      playerIds: player2 ? [player1.id, player2.id] : [player1.id],
      isPreset: false,
    });
  }

  return [...existingTeams, ...newTeams];
}

// ─── Round Robin Schedule (Circle Method) ────────────────────────────────────

/**
 * Generates a full round-robin schedule using the circle algorithm.
 * Every team plays every other team exactly once.
 * If odd number of teams, adds a virtual "bye" team (id: 'BYE').
 */
export function generateRoundRobinSchedule(teams: Team[]): RoundRobinMatch[] {
  const teamIds = teams.map((t) => t.id);
  let ids = [...teamIds];

  const hasBye = ids.length % 2 !== 0;
  if (hasBye) ids.push('BYE');

  const n = ids.length;
  const numRounds = n - 1;
  const matchesPerRound = n / 2;

  const matches: RoundRobinMatch[] = [];

  for (let round = 1; round <= numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const team1Id = ids[match];
      const team2Id = ids[n - 1 - match];

      // Skip bye matches
      if (team1Id === 'BYE' || team2Id === 'BYE') continue;

      matches.push({
        id: generateId(),
        round,
        team1Id,
        team2Id,
        status: 'pending',
      });
    }

    // Rotate: fix first element, rotate the rest
    const fixed = ids[0];
    const rotating = ids.slice(1);
    rotating.unshift(rotating.pop()!);
    ids = [fixed, ...rotating];
  }

  return matches;
}

// ─── Round Robin Standings ───────────────────────────────────────────────────

export interface Standing {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
}

export function calculateStandings(
  teams: Team[],
  matches: RoundRobinMatch[]
): Standing[] {
  const standingsMap = new Map<string, Standing>();

  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
    });
  }

  for (const match of matches) {
    if (match.status !== 'complete') continue;

    const s1 = standingsMap.get(match.team1Id);
    const s2 = standingsMap.get(match.team2Id);
    if (!s1 || !s2) continue;

    const score1 = match.team1Score ?? 0;
    const score2 = match.team2Score ?? 0;

    s1.pointsFor += score1;
    s1.pointsAgainst += score2;
    s2.pointsFor += score2;
    s2.pointsAgainst += score1;

    if (match.winnerId === match.team1Id) {
      s1.wins++;
      s2.losses++;
    } else if (match.winnerId === match.team2Id) {
      s2.wins++;
      s1.losses++;
    } else {
      s1.ties++;
      s2.ties++;
    }
  }

  // Calculate point diff
  for (const s of standingsMap.values()) {
    s.pointDiff = s.pointsFor - s.pointsAgainst;
  }

  // Sort: wins desc, then point diff desc, then points for desc
  return Array.from(standingsMap.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsFor - a.pointsFor;
  });
}

// ─── Single Elimination Bracket ──────────────────────────────────────────────

/**
 * Generates a single-elimination bracket from seeded teams.
 * Seeds higher teams against lower seeds (1 vs last, 2 vs second-last, etc.)
 * Top seeds get byes when bracket size exceeds team count.
 */
export function generateEliminationBracket(seededTeams: Team[]): EliminationMatch[] {
  const n = seededTeams.length;
  if (n < 2) return [];

  const bracketSize = nextPowerOf2(n);
  const numRounds = Math.log2(bracketSize); // e.g. 4 teams → 2 rounds
  const byeCount = bracketSize - n;

  const seeds: (Team | null)[] = [...seededTeams, ...Array(byeCount).fill(null)];
  const firstRoundMatchups = buildFirstRoundMatchups(seeds);

  const matches: EliminationMatch[] = [];

  // Round numbering: round 1 = Finals (1 match), round numRounds = first round (most matches)
  // This makes round 1 always the championship, matching ROUND_LABELS and winner detection.
  for (let r = 1; r <= numRounds; r++) {
    const matchesInRound = Math.pow(2, r - 1); // r=1→1 match, r=2→2, r=numRounds→bracketSize/2
    for (let pos = 1; pos <= matchesInRound; pos++) {
      matches.push({
        id: generateId(),
        round: r,
        position: pos,
        isBye: false,
        status: 'pending',
      });
    }
  }

  // Fill first-round matches (round === numRounds, most matches)
  const firstRoundMatches = matches
    .filter((m) => m.round === numRounds)
    .sort((a, b) => a.position - b.position);

  for (let i = 0; i < firstRoundMatches.length; i++) {
    const match = firstRoundMatches[i];
    const [team1, team2] = firstRoundMatchups[i] ?? [null, null];

    match.team1Id = team1?.id ?? null;
    match.team2Id = team2?.id ?? null;

    if (!team1 || !team2) {
      match.isBye = true;
      match.status = 'complete';
      match.winnerId = team1?.id ?? team2?.id ?? null;
    }
  }

  // Wire nextMatchId: winner of round r → round r-1 (closer to finals)
  for (let r = numRounds; r > 1; r--) {
    const roundMatches = matches
      .filter((m) => m.round === r)
      .sort((a, b) => a.position - b.position);
    const nextRoundMatches = matches
      .filter((m) => m.round === r - 1)
      .sort((a, b) => a.position - b.position);

    for (let i = 0; i < roundMatches.length; i++) {
      const nextMatchPos = Math.ceil((i + 1) / 2);
      const nextMatch = nextRoundMatches.find((m) => m.position === nextMatchPos);
      if (nextMatch) {
        roundMatches[i].nextMatchId = nextMatch.id;
      }
    }
  }

  // Auto-advance bye winners into their next match slot
  const byeMatches = matches.filter((m) => m.isBye && m.winnerId);
  for (const byeMatch of byeMatches) {
    if (!byeMatch.nextMatchId) continue;
    const nextMatch = matches.find((m) => m.id === byeMatch.nextMatchId);
    if (!nextMatch) continue;
    if (!nextMatch.team1Id) {
      nextMatch.team1Id = byeMatch.winnerId ?? null;
    } else {
      nextMatch.team2Id = byeMatch.winnerId ?? null;
    }
  }

  return matches;
}

function buildFirstRoundMatchups(seeds: (Team | null)[]): [Team | null, Team | null][] {
  const n = seeds.length;
  const matchups: [Team | null, Team | null][] = [];
  const used = new Set<number>();

  for (let i = 0; i < n / 2; i++) {
    if (!used.has(i)) {
      const j = n - 1 - i;
      matchups.push([seeds[i], seeds[j]]);
      used.add(i);
      used.add(j);
    }
  }

  return matchups;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ─── Prize Calculator ────────────────────────────────────────────────────────

export interface PrizePayout {
  place: number;
  teamId: string;
  teamAmount: number;
  perPlayerAmount: number;
  playerIds: string[];
}

export function calculatePayouts(
  teams: Team[],
  entryFeePerPlayer: number,
  firstPercent: number,
  secondPercent: number,
  firstPlaceTeamId: string,
  secondPlaceTeamId: string
): PrizePayout[] {
  const totalPlayers = teams.reduce((sum, t) => sum + t.playerIds.length, 0);
  const totalPot = totalPlayers * entryFeePerPlayer;
  const firstTeam = teams.find((t) => t.id === firstPlaceTeamId);
  const secondTeam = teams.find((t) => t.id === secondPlaceTeamId);

  const payouts: PrizePayout[] = [];

  if (firstTeam) {
    const teamAmount = (totalPot * firstPercent) / 100;
    payouts.push({
      place: 1,
      teamId: firstPlaceTeamId,
      teamAmount,
      perPlayerAmount: teamAmount / (firstTeam.playerIds.length || 1),
      playerIds: firstTeam.playerIds,
    });
  }

  if (secondTeam) {
    const teamAmount = (totalPot * secondPercent) / 100;
    payouts.push({
      place: 2,
      teamId: secondPlaceTeamId,
      teamAmount,
      perPlayerAmount: teamAmount / (secondTeam.playerIds.length || 1),
      playerIds: secondTeam.playerIds,
    });
  }

  return payouts;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getTeamDisplayName(team: Team, players: Player[]): string {
  if (team.name) return team.name;
  const memberNames = team.playerIds
    .map((id) => players.find((p) => p.id === id)?.name ?? 'Unknown')
    .join(' & ');
  return memberNames;
}

export function isRoundRobinRoundComplete(
  matches: RoundRobinMatch[],
  round: number
): boolean {
  const roundMatches = matches.filter((m) => m.round === round);
  return roundMatches.length > 0 && roundMatches.every((m) => m.status === 'complete');
}

export function getAllRoundsComplete(matches: RoundRobinMatch[]): boolean {
  return matches.length > 0 && matches.every((m) => m.status === 'complete');
}

/**
 * Canonical elimination-round label (round 1 = Finals, counting from the
 * end — see EliminationMatch.round). Single source of truth replacing three
 * previously-independent, inconsistent naming schemes across BracketView's
 * column headers, the old list view, and the round tabs.
 */
export function getEliminationRoundLabel(round: number): string {
  if (round === 1) return 'Final';
  if (round === 2) return 'Semis';
  if (round === 3) return 'Quarters';
  return `Round of ${Math.pow(2, round)}`;
}

/**
 * Dashboard sort order: active tournaments (round-robin, elimination) first,
 * then complete, then draft (setup/pairing — unreachable today, since every
 * tournament is created already in round-robin phase, but handled for
 * forward compatibility). Within each bucket, most-recent first — there's
 * no `updatedAt` on Tournament (data model doesn't change in this
 * redesign), so this uses `createdAt` as an approximation, not a true
 * last-touched order.
 */
const DASHBOARD_PHASE_RANK: Record<Tournament['phase'], number> = {
  'round-robin': 0,
  elimination: 0,
  complete: 1,
  setup: 2,
  pairing: 2,
};

export function sortTournamentsForDashboard(tournaments: Tournament[]): Tournament[] {
  return [...tournaments].sort((a, b) => {
    const rankDiff = DASHBOARD_PHASE_RANK[a.phase] - DASHBOARD_PHASE_RANK[b.phase];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Progress (0–1) within a tournament's current phase — all round-robin
 * matches regardless of round (there's no "current round" filter; see the
 * implementation plan), non-bye matches only for elimination, 1 once
 * complete. Shared by the tournament page's PhaseRail and the dashboard's
 * compact per-row PhaseRail.
 */
export function getPhaseProgress(
  tournament: Pick<Tournament, 'phase' | 'roundRobinMatches' | 'eliminationMatches'>
): number {
  if (tournament.phase === 'elimination') {
    const playable = tournament.eliminationMatches.filter((m) => !m.isBye);
    return playable.length > 0 ? playable.filter((m) => m.status === 'complete').length / playable.length : 0;
  }
  if (tournament.phase === 'complete') return 1;
  const { roundRobinMatches } = tournament;
  return roundRobinMatches.length > 0
    ? roundRobinMatches.filter((m) => m.status === 'complete').length / roundRobinMatches.length
    : 0;
}

/**
 * IDs of the matches a given team actually won on its way to (or through)
 * the bracket — walking backward from the Finals via nextMatchId, since
 * matches don't store a "previous match" pointer directly. Used to render
 * the champion's specific path in gold on the read-only champion-screen
 * bracket, distinct from the bracket's normal amber advancing-path color.
 */
export function getTeamPathMatchIds(matches: EliminationMatch[], teamId: string): Set<string> {
  const pathIds = new Set<string>();
  let current = matches.find((m) => m.round === 1);
  while (current && current.winnerId === teamId) {
    pathIds.add(current.id);
    current = matches.find((m) => m.nextMatchId === current!.id && m.winnerId === teamId);
  }
  return pathIds;
}
