import type { RandomTeamsTeam, TeamRole } from "@v1/domain/shuffle";
import type { DrawnTeamView } from "@v1/ui/recipes/draw/draw-view";
import { toPickablePlayerView } from "@/components/player-picker/picker-view";

export function toDrawnTeamView(team: RandomTeamsTeam): DrawnTeamView {
  return {
    avgRankTier: team.avgRankTier,
    avgRankLabel: team.avgRankLabel,
    players: team.players.map((player) => ({
      ...toPickablePlayerView(player),
      role: player.role as TeamRole,
      isCaptain: player.isCaptain,
    })),
  };
}
