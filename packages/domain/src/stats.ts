/** Formatting for the numbers a match produces: KDA, win rate, duration. */

/**
 * Kills and assists per death, as "4.00:1".
 *
 * "Perfect" is reserved for a game survived with something to show for it — a player who went
 * 0/0/0 did not have a perfect game, they had an empty one.
 */
export function formatKdaRatio(
  kills: number | null,
  deaths: number | null,
  assists: number | null,
): string {
  if (kills == null && deaths == null && assists == null) return "—";

  const k = kills ?? 0;
  const d = deaths ?? 0;
  const a = assists ?? 0;

  if (d === 0) return k + a > 0 ? "Perfect" : "0.00:1";

  return `${((k + a) / d).toFixed(2)}:1`;
}

/** One averaged stat, without a pointless trailing ".0". */
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

/** A dash means "we do not know"; "0%" means "played and never won". */
export function formatWinrate(
  wins: number | null,
  losses: number | null,
): string {
  if (wins == null || losses == null) return "—";
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

/** Match length as "35:51". */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
