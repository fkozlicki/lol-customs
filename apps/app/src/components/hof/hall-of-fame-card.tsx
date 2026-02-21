"use client";

import type { RouterOutputs } from "@v1/api";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@v1/ui/card";
import { useScopedI18n } from "@/locales/client";
import type { HofTitleId } from "./hof-config";

const PROFILE_ICON_CDN =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons";

function profileIconUrl(iconId: number | null): string | null {
  if (iconId == null) return null;
  return `${PROFILE_ICON_CDN}/${iconId}.jpg`;
}

type HofLeaderEntry = RouterOutputs["riftRank"]["hofLeaders"][HofTitleId];

interface HallOfFameCardProps {
  titleId: HofTitleId;
  valueFormat?: "decimal" | "integer" | "percent" | "none";
  leader: HofLeaderEntry;
}

function formatValue(
  value: number | null,
  format: HallOfFameCardProps["valueFormat"],
): string | null {
  if (value == null || format === "none") return null;
  if (format === "percent") return `${(value * 100).toFixed(1)}%`;
  if (format === "integer") return Math.round(value).toLocaleString();
  if (format === "decimal") return value.toFixed(1);
  return String(value);
}

export default function HallOfFameCard({
  titleId,
  valueFormat = "decimal",
  leader,
}: HallOfFameCardProps) {
  const t = useScopedI18n("dashboard.pages.hallOfFame.cards");

  const title = t(`${titleId}.title` as "most_kills.title");
  const description = t(`${titleId}.description` as "most_kills.description");
  const displayName =
    leader?.game_name != null && leader?.tag_line != null
      ? `${leader.game_name} #${leader.tag_line}`
      : (leader?.game_name ?? "—");
  const valueStr = formatValue(leader?.value ?? null, valueFormat);
  const iconUrl = profileIconUrl(leader?.profile_icon ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0 rounded-lg border-2 border-border">
            <AvatarImage src={iconUrl ?? undefined} alt="" />
            <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="min-w-0 truncate font-medium">{displayName}</p>
        </div>
        {valueStr != null && (
          <p className="rounded-lg bg-primary/10 px-3 py-2 font-semibold tabular-nums text-primary">
            {valueStr}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
