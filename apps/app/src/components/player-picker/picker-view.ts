import type { RouterOutputs } from "@v1/api";
import { formatRank } from "@v1/domain/rank";
import { type RiotId, riotIdKey } from "@v1/domain/riot-id";
import type { RosterPlayer } from "@v1/domain/shuffle";
import type { PickablePlayerView } from "@v1/ui/recipes/player-picker/pickable-player-view";

export type LadderPlayer = RouterOutputs["players"]["all"][number];

export function toPickablePlayerView(player: RosterPlayer): PickablePlayerView {
  return {
    key: riotIdKey(player),
    name: player.gameName,
    rankTier: player.rankTier,
    rankLabel: formatRank(player.rankTier, player.rankDivision),
  };
}

/** A ladder player as a roster or pool holds them; null without a Riot ID, which neither can use. */
export function toRosterPlayer(player: LadderPlayer): RosterPlayer | null {
  if (!player.game_name || !player.tag_line) return null;
  return {
    gameName: player.game_name,
    tagLine: player.tag_line,
    rankTier: player.rank_tier,
    rankDivision: player.rank_division,
  };
}

/** The ladder players who could still be picked: with a Riot ID, not picked, matching the search. */
export function ladderCandidates(
  ladder: LadderPlayer[],
  { picked, search }: { picked: RosterPlayer[]; search: string },
): RosterPlayer[] {
  const taken = new Set(picked.map(riotIdKey));
  const query = search.trim().toLowerCase();
  return ladder.flatMap((player) => {
    const candidate = toRosterPlayer(player);
    if (!candidate || taken.has(riotIdKey(candidate))) return [];
    if (query && !candidate.gameName.toLowerCase().includes(query)) return [];
    return [candidate];
  });
}

/** Someone typed in by Riot ID: a player the ladder knows keeps their rank, a stranger is unranked. */
export function withLadderRank(
  riotId: RiotId,
  ladder: LadderPlayer[],
): RosterPlayer {
  const known = ladder
    .map(toRosterPlayer)
    .find((player) => player && riotIdKey(player) === riotIdKey(riotId));
  return {
    ...riotId,
    rankTier: known?.rankTier ?? null,
    rankDivision: known?.rankDivision ?? null,
  };
}
