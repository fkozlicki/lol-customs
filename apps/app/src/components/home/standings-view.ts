import { playerHref } from "@v1/domain/riot-id";
import { formatKda, formatKdaRatio, formatWinrate } from "@v1/domain/stats";
import type { StandingsRowView } from "@v1/ui/recipes/home/standings-view";
import { withSeason } from "@/utils/season";

/**
 * What the mapper reads from a rating row. `standings.get` rows and `players.profileStats`
 * both have it.
 */
export interface StandingsSource {
  puuid: string;
  rating: number;
  wins: number;
  losses: number;
  avg_kills: number | null;
  avg_deaths: number | null;
  avg_assists: number | null;
  mvp_games: number;
  ace_games: number;
  win_streak: number;
  lose_streak: number;
  best_streak: number;
  matches_played: number;
  qualified: boolean;
  position: number | null;
  player: {
    game_name: string | null;
    tag_line: string | null;
    profile_icon: number | null;
  } | null;
}

/**
 * A `standings.get` row as the standings recipes take it: formatted with the domain's rules,
 * linked with the season in view, and positioned only once the player has qualified.
 */
export function toStandingsRowView(
  row: StandingsSource,
  { season }: { season: string | null },
): StandingsRowView {
  const wins = row.wins;
  const losses = row.losses;

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
    rating: Math.round(row.rating),
    wins,
    losses,
    winrate: formatWinrate(wins, losses),
    kdaRatio: formatKdaRatio(row.avg_kills, row.avg_deaths, row.avg_assists),
    kda: formatKda(row.avg_kills, row.avg_deaths, row.avg_assists),
    mvpGames: row.mvp_games,
    aceGames: row.ace_games,
    winStreak: row.win_streak,
    loseStreak: row.lose_streak,
    bestStreak: row.best_streak,
  };
}
