/** Players and a drawn pair of teams, shaped the way the draw recipes take them. Names invented. */
import type {
  DrawnTeamView,
  DrawPlayerView,
} from "@v1/ui/recipes/draw/draw-view";

const player = (
  name: string,
  rankTier: string | null,
  rankLabel: string | null,
): DrawPlayerView => ({ key: name.toLowerCase(), name, rankTier, rankLabel });

export const PLAYERS: DrawPlayerView[] = [
  player("Kestrel", "diamond", "diamond IV"),
  player("Old Tom", "emerald", "emerald I"),
  player("Nightjar", null, null),
  player("Sutokopter", "emerald", "emerald II"),
  player("Wren", "gold", "gold I"),
  player("Bramble", "platinum", "platinum III"),
  player("Quill", "master", "master"),
  player("Emberly", "silver", "silver II"),
  player("Patologia", "diamond", "diamond II"),
  player("Lana", "emerald", "emerald III"),
  player("Ayuni", null, null),
  player("Chicharito", "gold", "gold IV"),
];

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
