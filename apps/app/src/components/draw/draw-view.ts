import type { Team, TeamRole } from "@v1/domain/draw";
import type { DrawnTeamView } from "@v1/ui/recipes/draw/draw-view";
import { toPickablePlayerView } from "@/components/player-picker/picker-view";

export function toDrawnTeamView(team: Team): DrawnTeamView {
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
