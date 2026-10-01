"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { PlayerRelations as PlayerRelationsView } from "@v1/ui/recipes/player/player-relations";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { toRelationsView } from "./player-view";

interface PlayerRelationsProps {
  puuid: string;
  season: number;
}

export function PlayerRelations({ puuid, season }: PlayerRelationsProps) {
  const trpc = useTRPC();
  const seasonParam = useSeasonParam();
  const { data } = useSuspenseQuery(
    trpc.players.relations.queryOptions({ puuid, season }),
  );

  return (
    <PlayerRelationsView
      relations={toRelationsView(data, { season: seasonParam })}
    />
  );
}
