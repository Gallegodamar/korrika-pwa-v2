export type RankingEntry = {
  id: string;
  userId: string | null;
  playerName: string;
  points: number;
  games: number;
};

type ScoreRow = {
  user_id?: string | null;
  player_name: string | null;
  correct_answers: number | null;
};

export const buildRanking = (rows: ScoreRow[], basePlayers: string[] = []) => {
  const scoreMap = new Map<string, RankingEntry>();

  basePlayers.forEach((name) => {
    const cleanName = name.trim().toUpperCase();
    if (!cleanName) return;
    scoreMap.set(cleanName, {
      id: cleanName,
      userId: null,
      playerName: cleanName,
      points: 0,
      games: 0
    });
  });

  rows.forEach((row) => {
    const name = (row.player_name ?? '').trim().toUpperCase();
    const stableKey = (row.user_id ?? '').trim() || name;
    if (!stableKey) return;

    const current = scoreMap.get(stableKey) ?? {
      id: stableKey,
      userId: (row.user_id ?? '').trim() || null,
      playerName: name || stableKey,
      points: 0,
      games: 0
    };
    if (row.user_id) {
      current.userId = row.user_id.trim();
    }
    if (name) {
      current.playerName = name;
    }
    current.points += row.correct_answers ?? 0;
    current.games += 1;
    scoreMap.set(stableKey, current);
  });

  return [...scoreMap.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.games !== b.games) return a.games - b.games;
    return a.playerName.localeCompare(b.playerName);
  });
};
