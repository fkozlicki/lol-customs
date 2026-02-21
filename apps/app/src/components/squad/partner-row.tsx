"use client";

import type { RouterOutputs } from "@v1/api";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";

type PlayerInfo = RouterOutputs["duos"]["duosPerPlayer"][number]["player"];
type PartnerEntry = { puuid: string; player: PlayerInfo; count: number };

const PROFILE_ICON_CDN =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons";

function profileIconUrl(iconId: number | null): string | null {
  if (iconId == null) return null;
  return `${PROFILE_ICON_CDN}/${iconId}.jpg`;
}

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
  const iconUrl = profileIconUrl(entry.player?.profile_icon ?? null);
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-6 shrink-0 rounded-md border border-border">
        <AvatarImage src={iconUrl ?? undefined} alt="" />
        <AvatarFallback className="rounded-md bg-muted text-muted-foreground text-xs">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-sm">{name}</span>
      <span className="ml-auto shrink-0 rounded bg-primary/10 px-2 py-0.5 font-medium tabular-nums text-primary text-xs">
        {entry.count}
      </span>
    </div>
  );
}
