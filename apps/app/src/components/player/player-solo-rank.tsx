"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatRank } from "@v1/domain/rank";
import { PlayerSoloRank as PlayerSoloRankView } from "@v1/ui/recipes/player/player-solo-rank";
import { useTRPC } from "@/trpc/react";

/** The rank Derby Sync recorded with the player's latest match, read from the database. */
export function PlayerSoloRank({ puuid }: { puuid: string }) {
  const trpc = useTRPC();
  const { data: rank } = useSuspenseQuery(
    trpc.players.soloRank.queryOptions({ puuid }),
  );
  const tier = rank?.tier ?? null;

  return (
    <PlayerSoloRankView
      tier={tier}
      rankLabel={formatRank(tier, rank?.division ?? null)}
    />
  );
}
