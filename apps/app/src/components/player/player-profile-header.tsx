"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ProfileIcon } from "@/components/game-assets/profile-icon";
import { useTRPC } from "@/trpc/react";

interface PlayerProfileHeaderProps {
  puuid: string;
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
    trpc.players.profileStats.queryOptions({ puuid }),
  );

  const name = stats?.player?.game_name ?? gameName;
  const tag = stats?.player?.tag_line ?? tagLine;
  const iconId = stats?.player?.profile_icon ?? null;

  return (
    <div className="flex items-center gap-4 border-b p-6">
      <ProfileIcon
        iconId={iconId}
        name={name}
        fallbackChars={2}
        avatarClassName="size-16 ring-2 ring-border/50"
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {name}{" "}
          <span className="text-muted-foreground font-medium">#{tag}</span>
        </h1>
      </div>
    </div>
  );
}
