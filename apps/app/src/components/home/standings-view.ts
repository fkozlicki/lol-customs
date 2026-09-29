import type { RouterOutputs } from "@v1/api";
import { playerHref } from "@v1/domain/riot-id";
import { formatKda, formatKdaRatio, formatWinrate } from "@v1/domain/stats";
import type { StandingsRowView } from "@v1/ui/recipes/home/standings-view";
import { withSeason } from "@/utils/season";

export type StandingsRow = RouterOutputs["riftRank"]["leaderboard"][number];

/**
 * A `riftRank.leaderboard` row as the standings recipes take it: formatted with the domain's rules,
 * linked with the season in view, and positioned only once the player has qualified.
 */
export function toStandingsRowView(
  row: StandingsRow,
  { season }: { season: string | null },
): StandingsRowView {
  const wins = row.wins ?? 0;
  const losses = row.losses ?? 0;

  return {
    key: row.puuid,
    name: row.player?.game_name ?? row.puuid.slice(0, 8),
    href: withSeason(
      playerHref(row.player?.game_name, row.player?.tag_line),
      season,
    ),
    iconId: row.player?.profile_icon ?? null,
    position: row.qualified ? (row.position ?? null) : null,
    matchesPlayed: row.matches_played,
    rating: Math.round(row.rating ?? 0),
    wins,
    losses,
    winrate: formatWinrate(wins, losses),
    kdaRatio: formatKdaRatio(row.avg_kills, row.avg_deaths, row.avg_assists),
    kda: formatKda(row.avg_kills, row.avg_deaths, row.avg_assists),
    mvpGames: row.mvp_games ?? 0,
    aceGames: row.ace_games ?? 0,
    winStreak: row.win_streak,
    loseStreak: row.lose_streak,
    bestStreak: row.best_streak,
  };
}
