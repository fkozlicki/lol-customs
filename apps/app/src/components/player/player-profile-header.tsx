"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ALL_TIME_SEASON } from "@v1/api/season";
import { PlayerHeader } from "@v1/ui/recipes/player/player-header";
import { Suspense } from "react";
import { useTRPC } from "@/trpc/react";
import { PlayerSoloRank } from "./player-solo-rank";

interface PlayerProfileHeaderProps {
  puuid: string;
  /** From the URL, until the profile's own record says otherwise. */
  gameName: string;
  tagLine: string;
}

export function PlayerProfileHeader({
  puuid,
  gameName,
  tagLine,
}: PlayerProfileHeaderProps) {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.players.profileStats.queryOptions({ puuid, season: ALL_TIME_SEASON }),
  );

  return (
    <PlayerHeader
      name={stats?.player?.game_name ?? gameName}
      tagLine={stats?.player?.tag_line ?? tagLine}
      iconId={stats?.player?.profile_icon ?? null}
    >
      <Suspense fallback={null}>
        <PlayerSoloRank puuid={puuid} />
      </Suspense>
    </PlayerHeader>
  );
}
