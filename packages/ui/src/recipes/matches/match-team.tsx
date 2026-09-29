"use client";

import { useTranslations } from "next-intl";
import { cn } from "../../utils/cn";
import { ChampionImage } from "../game-assets/champion-image";
import type { SideView } from "./match-view";

interface MatchTeamProps {
  team: SideView;
  /** The profile owner, marked within their side. */
  playerKey?: string;
}

export default function MatchTeam({ team, playerKey }: MatchTeamProps) {
  const t = useTranslations("match");

  return (
    <div className="flex w-32 flex-col gap-1">
      <span className={cn("label-caps", team.won && "text-foreground")}>
        {team.side === "blue" ? t("sideBlue") : t("sideRed")}
      </span>
      <div className="flex flex-col gap-0.5">
        {team.participants.map((p) => (
          <div key={p.key} className="flex min-w-0 items-center gap-1.5">
            <ChampionImage
              championId={p.championId}
              width={16}
              height={16}
              className="size-4 shrink-0 object-cover"
            />
            <span
              className={cn(
                "truncate text-xs text-muted-foreground",
                p.key === playerKey && "font-semibold text-foreground",
              )}
            >
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
