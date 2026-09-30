import type { RouterOutputs } from "@v1/api";
import { formatRank } from "@v1/domain/rank";
import { riotIdKey } from "@v1/domain/riot-id";
import type {
  RandomTeamsTeam,
  RosterPlayer,
  TeamRole,
} from "@v1/domain/shuffle";
import type {
  DrawnTeamView,
  DrawPlayerView,
} from "@v1/ui/recipes/draw/draw-view";

type LadderPlayer = RouterOutputs["players"]["all"][number];

export function toDrawPlayerView(player: RosterPlayer): DrawPlayerView {
  return {
    key: riotIdKey(player),
    name: player.gameName,
    rankTier: player.rankTier,
    rankLabel: formatRank(player.rankTier, player.rankDivision),
  };
}

export function toDrawnTeamView(team: RandomTeamsTeam): DrawnTeamView {
  return {
    avgRankTier: team.avgRankTier,
    avgRankLabel: team.avgRankLabel,
    players: team.players.map((player) => ({
      ...toDrawPlayerView(player),
      role: player.role as TeamRole,
      isCaptain: player.isCaptain,
    })),
  };
}

/** A ladder player as the roster holds them; null without a Riot ID, which a draw cannot use. */
export function toRosterPlayer(player: LadderPlayer): RosterPlayer | null {
  if (!player.game_name || !player.tag_line) return null;
  return {
    gameName: player.game_name,
    tagLine: player.tag_line,
    rankTier: player.rank_tier,
    rankDivision: player.rank_division,
  };
}

/** The ladder players who could still join: with a Riot ID, not on the roster, matching the search. */
export function ladderCandidates(
  players: LadderPlayer[],
  { roster, search }: { roster: RosterPlayer[]; search: string },
): RosterPlayer[] {
  const taken = new Set(roster.map(riotIdKey));
  const query = search.trim().toLowerCase();
  return players.flatMap((player) => {
    const candidate = toRosterPlayer(player);
    if (!candidate || taken.has(riotIdKey(candidate))) return [];
    if (query && !candidate.gameName.toLowerCase().includes(query)) return [];
    return [candidate];
  });
}
