/** A drawn pair of teams, shaped the way the draw recipes take them. Names invented. */
import type {
  DrawnTeamView,
  DrawPlayerView,
} from "@v1/ui/recipes/draw/draw-view";
import { PLAYERS } from "../player-picker/player-picker.fixtures";

export { PLAYERS };

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;

const team = (
  players: DrawPlayerView[],
  avgRankLabel: string,
  avgRankTier: string,
): DrawnTeamView => ({
  avgRankTier,
  avgRankLabel,
  players: players.map((p, i) => ({
    ...p,
    role: ROLES[i]!,
    isCaptain: i === 2,
  })),
});

export const TEAMS = {
  a: team(PLAYERS.slice(0, 5), "Emerald III", "emerald"),
  b: team(PLAYERS.slice(5, 10), "Platinum I", "platinum"),
};
