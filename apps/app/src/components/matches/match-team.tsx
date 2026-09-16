"use client";

import { cn } from "@v1/ui/cn";
import { ChampionImage } from "@/components/game-assets/champion-image";
import { useScopedI18n } from "@/locales/client";
import type { MatchParticipant } from "./match-history-list";

interface MatchTeamProps {
  team: MatchParticipant[];
  side: "blue" | "red";
  playerParticipant?: MatchParticipant;
}

export default function MatchTeam({
  side,
  team,
  playerParticipant,
}: MatchTeamProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const won = team[0]?.win === true;

  return (
    <div className="flex w-32 flex-col gap-1">
      <span className={cn("label-caps", won && "text-foreground")}>
        {side === "blue" ? t("sideBlue") : t("sideRed")}
      </span>
      <div className="flex flex-col gap-0.5">
        {team.map((p) => {
          const isPlayer = p.puuid === playerParticipant?.puuid;

          return (
            <div key={p.puuid} className="flex min-w-0 items-center gap-1.5">
              <ChampionImage
                championId={p.champion_id}
                width={16}
                height={16}
                className="size-4 shrink-0 object-cover"
              />
              <span
                className={cn(
                  "truncate text-xs text-muted-foreground",
                  isPlayer && "font-semibold text-foreground",
                )}
              >
                {p.players.game_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
