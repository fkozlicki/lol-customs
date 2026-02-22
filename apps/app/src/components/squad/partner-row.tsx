"use client";

import type { RouterOutputs } from "@v1/api";
import { ProfileIcon } from "@/components/game-assets/profile-icon";

type PlayerInfo = RouterOutputs["duos"]["duosPerPlayer"][number]["player"];
type PartnerEntry = { puuid: string; player: PlayerInfo; count: number };

function displayName(player: PlayerInfo): string {
  if (player?.game_name != null && player?.tag_line != null) {
    return `${player.game_name}`;
  }
  return player?.game_name ?? "—";
}

interface PartnerRowProps {
  entry: PartnerEntry;
}

export function PartnerRow({ entry }: PartnerRowProps) {
  const name = displayName(entry.player);
  return (
    <div className="flex items-center gap-2">
      <ProfileIcon
        iconId={entry.player?.profile_icon ?? null}
        name={name}
        avatarClassName="size-6 rounded-md border border-border"
        fallbackClassName="rounded-md text-xs"
      />
      <span className="min-w-0 truncate text-sm">{name}</span>
      <span className="ml-auto shrink-0 rounded bg-primary/10 px-2 py-0.5 font-medium tabular-nums text-primary text-xs">
        {entry.count}
      </span>
    </div>
  );
}
