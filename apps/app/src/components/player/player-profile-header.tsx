"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ALL_TIME_SEASON } from "@v1/api/season";
import { Suspense } from "react";
import { ProfileIcon } from "@/components/game-assets/profile-icon";
import { useTRPC } from "@/trpc/react";
import { PlayerSoloRank } from "./player-solo-rank";

interface PlayerProfileHeaderProps {
  puuid: string;
  gameName: string;
  tagLine: string;
  platformId: string;
}

export function PlayerProfileHeader({
  puuid,
  gameName,
  tagLine,
  platformId,
}: PlayerProfileHeaderProps) {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.players.profileStats.queryOptions({
      puuid,
      season: ALL_TIME_SEASON,
    }),
  );

  const name = stats?.player?.game_name ?? gameName;
  const tag = stats?.player?.tag_line ?? tagLine;
  const iconId = stats?.player?.profile_icon ?? null;

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <ProfileIcon
        iconId={iconId}
        name={name}
        fallbackChars={2}
        avatarClassName="size-16 rounded-none sm:size-24"
        fallbackClassName="rounded-none"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="truncate text-3xl font-semibold leading-none tracking-[-0.03em] sm:text-5xl">
          {name}
          <span className="font-normal text-muted-foreground"> #{tag}</span>
        </h1>
        <Suspense fallback={null}>
          <PlayerSoloRank
            gameName={gameName}
            tagLine={tagLine}
            platformId={platformId}
          />
        </Suspense>
      </div>
    </div>
  );
}
