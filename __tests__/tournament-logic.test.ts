import {
  generateRoundRobinSchedule,
  calculateStandings,
  generateEliminationBracket,
  calculatePayouts,
  randomPairPlayers,
  getTeamDisplayName,
  getAllRoundsComplete,
  getEliminationRoundLabel,
  getTeamPathMatchIds,
  sortTournamentsForDashboard,
} from '@/lib/tournament-logic';
import { Player, Team, RoundRobinMatch, Tournament } from '@/types/tournament';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    playerIds: [`p${i * 2 + 1}`, `p${i * 2 + 2}`],
    isPreset: false,
  }));
}

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

function completeMatch(
  match: RoundRobinMatch,
  score1: number,
  score2: number
): RoundRobinMatch {
  const winnerId =
    score1 > score2 ? match.team1Id : score2 > score1 ? match.team2Id : null;
  return { ...match, team1Score: score1, team2Score: score2, winnerId, status: 'complete' };
}

// ─── randomPairPlayers ───────────────────────────────────────────────────────

describe('randomPairPlayers', () => {
  test('pairs all players into teams of 2 (even count)', () => {
    const players = makePlayers(8);
    const teams = randomPairPlayers(players);
    expect(teams).toHaveLength(4);
    teams.forEach((t) => expect(t.playerIds).toHaveLength(2));
    // Every player appears exactly once
    const allIds = teams.flatMap((t) => t.playerIds);
    expect(allIds).toHaveLength(8);
    expect(new Set(allIds).size).toBe(8);
  });

  test('handles odd number of players — last player is solo', () => {
    const players = makePlayers(7);
    const teams = randomPairPlayers(players);
    expect(teams).toHaveLength(4);
    const soloTeams = teams.filter((t) => t.playerIds.length === 1);
    expect(soloTeams).toHaveLength(1);
  });

  test('respects preset teams and only pairs remaining players', () => {
    const players = makePlayers(6);
    const presetTeam: Team = {
      id: 'preset-1',
      playerIds: [players[0].id, players[1].id],
      isPreset: true,
    };
    const teams = randomPairPlayers(players, [presetTeam]);
    expect(teams).toHaveLength(3);
    expect(teams[0].id).toBe('preset-1');
    // Preset players don't appear in other teams
    const newTeamIds = teams.slice(1).flatMap((t) => t.playerIds);
    expect(newTeamIds).not.toContain(players[0].id);
    expect(newTeamIds).not.toContain(players[1].id);
  });

  test('handles minimum 2 players', () => {
    const players = makePlayers(2);
    const teams = randomPairPlayers(players);
    expect(teams).toHaveLength(1);
    expect(teams[0].playerIds).toHaveLength(2);
  });

  test('handles single player — produces solo team', () => {
    const players = makePlayers(1);
    const teams = randomPairPlayers(players);
    expect(teams).toHaveLength(1);
    expect(teams[0].playerIds).toHaveLength(1);
  });
});

// ─── generateRoundRobinSchedule ─────────────────────────────────────────────

describe('generateRoundRobinSchedule', () => {
  test('4 teams → 6 matches, 3 rounds', () => {
    const teams = makeTeams(4);
    const matches = generateRoundRobinSchedule(teams);
    expect(matches).toHaveLength(6);
    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(3);
  });

  test('every team plays every other team exactly once', () => {
    const teams = makeTeams(6);
    const matches = generateRoundRobinSchedule(teams);
    // Count how many times each pair played
    const pairCounts = new Map<string, number>();
    for (const m of matches) {
      const key = [m.team1Id, m.team2Id].sort().join('|');
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    }
    pairCounts.forEach((count) => expect(count).toBe(1));
    // Total matches = n*(n-1)/2
    expect(matches).toHaveLength(15);
  });

  test('8 teams → 28 matches, 7 rounds', () => {
    const teams = makeTeams(8);
    const matches = generateRoundRobinSchedule(teams);
    expect(matches).toHaveLength(28);
    const maxRound = Math.max(...matches.map((m) => m.round));
    expect(maxRound).toBe(7);
  });

  test('odd number of teams — no team plays a bye twice', () => {
    const teams = makeTeams(5); // 5 teams → 5 rounds, each team gets 1 bye
    const matches = generateRoundRobinSchedule(teams);
    // Each real team should have exactly 4 games (plays everyone else once)
    const gameCounts = new Map<string, number>();
    for (const m of matches) {
      gameCounts.set(m.team1Id, (gameCounts.get(m.team1Id) ?? 0) + 1);
      gameCounts.set(m.team2Id, (gameCounts.get(m.team2Id) ?? 0) + 1);
    }
    gameCounts.forEach((count) => expect(count).toBe(4));
  });

  test('2 teams → 1 match, 1 round', () => {
    const teams = makeTeams(2);
    const matches = generateRoundRobinSchedule(teams);
    expect(matches).toHaveLength(1);
  });

  test('all matches start with pending status', () => {
    const matches = generateRoundRobinSchedule(makeTeams(4));
    matches.forEach((m) => expect(m.status).toBe('pending'));
  });
});

// ─── calculateStandings ─────────────────────────────────────────────────────

describe('calculateStandings', () => {
  test('correctly tallies wins and losses', () => {
    const teams = makeTeams(3);
    const matches = generateRoundRobinSchedule(teams).map((m, i) => {
      // team-1 wins all, team-2 wins vs team-3
      if (m.team1Id === 'team-1') return completeMatch(m, 10, 5);
      if (m.team2Id === 'team-1') return completeMatch(m, 5, 10);
      return completeMatch(m, 3, 7); // team-3 beats team-2 (team2 is team1Id here)
    });
    const standings = calculateStandings(teams, matches);
    const t1 = standings.find((s) => s.teamId === 'team-1')!;
    expect(t1.wins).toBe(2);
    expect(t1.losses).toBe(0);
  });

  test('sorts by wins descending', () => {
    const teams = makeTeams(3);
    const matches = generateRoundRobinSchedule(teams).map((m) =>
      completeMatch(m, m.team1Id === 'team-1' ? 10 : 3, m.team1Id === 'team-1' ? 3 : 10)
    );
    const standings = calculateStandings(teams, matches);
    expect(standings[0].teamId).toBe('team-1');
  });

  test('breaks ties using point differential', () => {
    const teams = makeTeams(2);
    const matches = generateRoundRobinSchedule(teams).map((m) =>
      completeMatch(m, 10, 2)
    );
    const standings = calculateStandings(teams, matches);
    const winner = standings[0];
    expect(winner.pointDiff).toBeGreaterThan(0);
  });

  test('handles all ties (no scores entered yet)', () => {
    const teams = makeTeams(4);
    const matches = generateRoundRobinSchedule(teams); // all pending
    const standings = calculateStandings(teams, matches);
    standings.forEach((s) => {
      expect(s.wins).toBe(0);
      expect(s.losses).toBe(0);
    });
  });

  test('handles drawn matches (tie scores)', () => {
    const teams = makeTeams(2);
    const matches = generateRoundRobinSchedule(teams).map((m) =>
      completeMatch(m, 5, 5)
    );
    const standings = calculateStandings(teams, matches);
    standings.forEach((s) => {
      expect(s.ties).toBe(1);
      expect(s.wins).toBe(0);
    });
  });
});

// ─── generateEliminationBracket ─────────────────────────────────────────────

describe('generateEliminationBracket', () => {
  test('round 1 is always the Finals (1 match)', () => {
    [4, 6, 8, 16].forEach((n) => {
      const teams = makeTeams(n);
      const matches = generateEliminationBracket(teams);
      const finals = matches.filter((m) => m.round === 1);
      expect(finals).toHaveLength(1);
    });
  });

  test('4 teams → 3 total matches, 2 rounds', () => {
    const teams = makeTeams(4);
    const matches = generateEliminationBracket(teams);
    expect(matches).toHaveLength(3);
    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(2);
  });

  test('8 teams → 7 total matches, 3 rounds', () => {
    const teams = makeTeams(8);
    const matches = generateEliminationBracket(teams);
    expect(matches).toHaveLength(7);
  });

  test('bye created when team count is not a power of 2', () => {
    const teams = makeTeams(6); // bracket size = 8, 2 byes
    const matches = generateEliminationBracket(teams);
    const byes = matches.filter((m) => m.isBye);
    expect(byes.length).toBeGreaterThan(0);
  });

  test('bye matches are auto-completed and winner is advanced', () => {
    const teams = makeTeams(3); // bracketSize=4, 1 bye
    const matches = generateEliminationBracket(teams);
    const byeMatch = matches.find((m) => m.isBye);
    expect(byeMatch?.status).toBe('complete');
    expect(byeMatch?.winnerId).toBeTruthy();
  });

  test('all non-bye first-round matches have both teams assigned', () => {
    const teams = makeTeams(4);
    const matches = generateEliminationBracket(teams);
    const maxRound = Math.max(...matches.map((m) => m.round));
    const firstRound = matches.filter((m) => m.round === maxRound && !m.isBye);
    firstRound.forEach((m) => {
      expect(m.team1Id).toBeTruthy();
      expect(m.team2Id).toBeTruthy();
    });
  });

  test('later rounds start with TBD slots (no teams assigned yet)', () => {
    const teams = makeTeams(4);
    const matches = generateEliminationBracket(teams);
    // Finals should be TBD (waiting for semis winners) — undefined means not yet assigned
    const finals = matches.find((m) => m.round === 1)!;
    expect(finals.team1Id ?? null).toBeNull();
    expect(finals.team2Id ?? null).toBeNull();
  });

  test('returns empty array for fewer than 2 teams', () => {
    expect(generateEliminationBracket(makeTeams(1))).toHaveLength(0);
    expect(generateEliminationBracket([])).toHaveLength(0);
  });

  test('2 teams → 1 match, both teams assigned, no byes', () => {
    const teams = makeTeams(2);
    const matches = generateEliminationBracket(teams);
    expect(matches).toHaveLength(1);
    expect(matches[0].team1Id).toBe('team-1');
    expect(matches[0].team2Id).toBe('team-2');
    expect(matches[0].isBye).toBe(false);
  });
});

// ─── calculatePayouts ────────────────────────────────────────────────────────

describe('calculatePayouts', () => {
  const teams = makeTeams(8);

  // 8 teams × 2 players = 16 players × $20 = $320 pot
  test('60/40 split on $20 per player, 8 teams of 2', () => {
    const totalPot = 16 * 20; // $320
    const payouts = calculatePayouts(teams, 20, 60, 40, 'team-1', 'team-2');
    expect(payouts[0].teamAmount).toBeCloseTo(totalPot * 0.6); // $192
    expect(payouts[1].teamAmount).toBeCloseTo(totalPot * 0.4); // $128
  });

  test('per-player amounts are teamAmount / player count', () => {
    const payouts = calculatePayouts(teams, 10, 60, 40, 'team-1', 'team-2');
    expect(payouts[0].perPlayerAmount).toBeCloseTo(payouts[0].teamAmount / 2);
  });

  test('places are 1 and 2', () => {
    const payouts = calculatePayouts(teams, 20, 60, 40, 'team-1', 'team-2');
    expect(payouts[0].place).toBe(1);
    expect(payouts[1].place).toBe(2);
  });

  test('zero entry fee returns zero payouts', () => {
    const payouts = calculatePayouts(teams, 0, 60, 40, 'team-1', 'team-2');
    payouts.forEach((p) => expect(p.teamAmount).toBe(0));
  });

  test('returns empty if winning team not found', () => {
    const payouts = calculatePayouts(teams, 20, 60, 40, 'nonexistent', 'team-2');
    const first = payouts.find((p) => p.place === 1);
    expect(first).toBeUndefined();
  });
});

// ─── getTeamDisplayName ──────────────────────────────────────────────────────

describe('getTeamDisplayName', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ];

  test('returns team name if set', () => {
    const team: Team = { id: 't1', name: 'The Eagles', playerIds: ['p1', 'p2'], isPreset: true };
    expect(getTeamDisplayName(team, players)).toBe('The Eagles');
  });

  test('returns "Player1 & Player2" if no team name', () => {
    const team: Team = { id: 't1', playerIds: ['p1', 'p2'], isPreset: false };
    expect(getTeamDisplayName(team, players)).toBe('Alice & Bob');
  });

  test('handles solo player', () => {
    const team: Team = { id: 't1', playerIds: ['p1'], isPreset: false };
    expect(getTeamDisplayName(team, players)).toBe('Alice');
  });

  test('handles unknown player id gracefully', () => {
    const team: Team = { id: 't1', playerIds: ['p1', 'ghost'], isPreset: false };
    const name = getTeamDisplayName(team, players);
    expect(name).toContain('Alice');
    expect(name).toContain('Unknown');
  });
});

// ─── getAllRoundsComplete ────────────────────────────────────────────────────

describe('getAllRoundsComplete', () => {
  test('returns false when no matches', () => {
    expect(getAllRoundsComplete([])).toBe(false);
  });

  test('returns false when any match is pending', () => {
    const teams = makeTeams(3);
    const matches = generateRoundRobinSchedule(teams);
    expect(getAllRoundsComplete(matches)).toBe(false);
  });

  test('returns true when all matches are complete', () => {
    const teams = makeTeams(2);
    const matches = generateRoundRobinSchedule(teams).map((m) =>
      completeMatch(m, 10, 5)
    );
    expect(getAllRoundsComplete(matches)).toBe(true);
  });
});

describe('sortTournamentsForDashboard', () => {
  function makeTournament(phase: Tournament['phase'], createdAt: string, name: string): Tournament {
    return {
      id: name,
      hostId: 'local',
      hostName: 'Host',
      name,
      event: 'ping-pong',
      format: 'singles',
      entryFeePerPlayer: 0,
      prizeSplit: { firstPercent: 70, secondPercent: 30 },
      phase,
      players: [],
      teams: [],
      roundRobinMatches: [],
      eliminationMatches: [],
      shareCode: 'CODE01',
      createdAt,
    };
  }

  test('active phases (round-robin, elimination) sort before complete, which sorts before draft', () => {
    const draft = makeTournament('setup', '2024-01-01', 'draft');
    const complete = makeTournament('complete', '2024-01-02', 'complete');
    const rr = makeTournament('round-robin', '2024-01-03', 'rr');
    const elim = makeTournament('elimination', '2024-01-04', 'elim');

    const sorted = sortTournamentsForDashboard([draft, complete, rr, elim]);
    const phases = sorted.map((t) => t.phase);
    expect(phases.indexOf('round-robin')).toBeLessThan(phases.indexOf('complete'));
    expect(phases.indexOf('elimination')).toBeLessThan(phases.indexOf('complete'));
    expect(phases.indexOf('complete')).toBeLessThan(phases.indexOf('setup'));
  });

  test('within the same phase bucket, most recently created sorts first', () => {
    const older = makeTournament('round-robin', '2024-01-01', 'older');
    const newer = makeTournament('round-robin', '2024-06-01', 'newer');

    const sorted = sortTournamentsForDashboard([older, newer]);
    expect(sorted.map((t) => t.name)).toEqual(['newer', 'older']);
  });

  test('does not mutate the input array', () => {
    const input = [makeTournament('complete', '2024-01-01', 'a'), makeTournament('round-robin', '2024-01-02', 'b')];
    const inputCopy = [...input];
    sortTournamentsForDashboard(input);
    expect(input).toEqual(inputCopy);
  });
});

describe('getTeamPathMatchIds', () => {
  test('includes only the matches a team actually won, walking back to round 1', () => {
    const teams = makeTeams(4).map((t, i) => ({ ...t, seed: i + 1 }));
    const matches = generateEliminationBracket(teams);

    const semis = matches.filter((m) => m.round === 2);
    const final = matches.find((m) => m.round === 1)!;
    const [semiA, semiB] = semis;

    // Seed 1 (team-1) wins their semi, then wins the final.
    const completed = matches.map((m) => {
      if (m.id === semiA.id) return { ...m, status: 'complete' as const, winnerId: semiA.team1Id };
      if (m.id === semiB.id) return { ...m, status: 'complete' as const, winnerId: semiB.team1Id };
      return m;
    });
    const champion = semiA.team1Id!;
    const finalWithWinner = { ...final, status: 'complete' as const, winnerId: champion };
    const withFinal = completed.map((m) => (m.id === final.id ? finalWithWinner : m));

    const path = getTeamPathMatchIds(withFinal, champion);

    expect(path.has(final.id)).toBe(true);
    expect(path.has(semiA.id)).toBe(true);
    expect(path.has(semiB.id)).toBe(false);
    expect(path.size).toBe(2);
  });

  test('returns an empty set for a team that never reached or won the final', () => {
    const teams = makeTeams(4).map((t, i) => ({ ...t, seed: i + 1 }));
    const matches = generateEliminationBracket(teams);
    const path = getTeamPathMatchIds(matches, 'some-team-that-lost-early');
    expect(path.size).toBe(0);
  });
});

describe('getEliminationRoundLabel', () => {
  test('round 1 is Final', () => {
    expect(getEliminationRoundLabel(1)).toBe('Final');
  });
  test('round 2 is Semis', () => {
    expect(getEliminationRoundLabel(2)).toBe('Semis');
  });
  test('round 3 is Quarters', () => {
    expect(getEliminationRoundLabel(3)).toBe('Quarters');
  });
  test('round 4 is Round of 16', () => {
    expect(getEliminationRoundLabel(4)).toBe('Round of 16');
  });
  test('round 5 is Round of 32', () => {
    expect(getEliminationRoundLabel(5)).toBe('Round of 32');
  });
});
