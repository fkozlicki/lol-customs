/**
 * Two rows of one season's standings, as `riftRank.leaderboard` returns them: the leader and a player
 * still qualifying. What `toStandingsRowView` is tested against.
 *
 * Real data from the local database with the people replaced: names, tag lines, puuids, user ids.
 * This repo is public and the local database can be a copy of production. Typed against the router
 * output, so a change to the API shape fails typecheck here instead of leaving the mapper behind.
 */
import type { RouterOutputs } from "@v1/api";

export const STANDINGS = [
  {
    puuid: "fixture-puuid-01",
    rating: 1059,
    wins: 10,
    losses: 4,
    best_streak: 7,
    win_streak: 7,
    lose_streak: 0,
    updated_at: "2026-02-19T22:36:16.13+00:00",
    avg_kills: 7.357142857142857,
    avg_deaths: 6.071428571428571,
    avg_assists: 9.071428571428571,
    mvp_games: 2,
    ace_games: 2,
    matches_played: 14,
    qualified: true,
    player: {
      puuid: "fixture-puuid-01",
      game_name: "Kestrel",
      tag_line: "EUNE",
      profile_icon: 1295,
      platform_id: "EUN1",
    },
    position: 1,
  },
  {
    puuid: "fixture-puuid-13",
    rating: 978,
    wins: 0,
    losses: 2,
    best_streak: 0,
    win_streak: 0,
    lose_streak: 2,
    updated_at: "2026-02-17T19:34:51.257+00:00",
    avg_kills: 3,
    avg_deaths: 7.5,
    avg_assists: 5.5,
    mvp_games: 0,
    ace_games: 0,
    matches_played: 2,
    qualified: false,
    player: {
      puuid: "fixture-puuid-13",
      game_name: "Emberly",
      tag_line: "OCE",
      profile_icon: 5180,
      platform_id: "EUN1",
    },
    position: null,
  },
] satisfies RouterOutputs["riftRank"]["leaderboard"];
