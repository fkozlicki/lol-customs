export function formatKdaRatio(
  kills: number | null,
  deaths: number | null,
  assists: number | null,
): string {
  if (kills == null && deaths == null && assists == null) return "—";

  if (deaths === 0) return "Perfect";

  const ratio = ((kills ?? 0) + (assists ?? 0)) / (deaths ?? 1);

  return `${ratio.toFixed(2)}:1`;
}

export function formatKdaStat(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatKda(
  avgKills: number | null,
  avgDeaths: number | null,
  avgAssists: number | null,
): string {
  if (avgKills == null && avgDeaths == null && avgAssists == null) return "—";
  const k = formatKdaStat(avgKills ?? 0);
  const d = formatKdaStat(avgDeaths ?? 0);
  const a = formatKdaStat(avgAssists ?? 0);
  return `${k} / ${d} / ${a}`;
}

export function formatWinrate(
  wins: number | null,
  losses: number | null,
): string {
  if (wins == null || losses == null) return "—";
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}
