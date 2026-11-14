"use client";

import { useTranslations } from "next-intl";
import { cn } from "../../utils/cn";
import { ChampionImage } from "../game-assets/champion-image";
import type { SideView } from "./match-view";

interface MatchSideProps {
  view: SideView;
  /** The profile owner, marked within their side. */
  playerKey?: string;
}

export default function MatchSide({ view, playerKey }: MatchSideProps) {
  const t = useTranslations("match");

  return (
    <div className="flex w-32 flex-col gap-1">
      <span className={cn("label-caps", view.won && "text-foreground")}>
        {view.side === "blue" ? t("sideBlue") : t("sideRed")}
      </span>
      <div className="flex flex-col gap-0.5">
        {view.participants.map((p) => (
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
