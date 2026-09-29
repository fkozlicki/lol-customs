"use client";

import { ChampionImage } from "../game-assets/champion-image";
import { useRecipesI18n } from "../i18n/i18n";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantScore from "./match-participant-score";
import type { ParticipantView } from "./match-view";

/** The profile owner's part of a card: champion, KDA, CS, kill participation, items and OP place. */
export function PlayerMetadata({
  participant,
}: {
  participant: ParticipantView;
}) {
  const t = useRecipesI18n("match");

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative shrink-0">
          <ChampionImage
            championId={participant.championId}
            width={48}
            height={48}
            className="size-11 object-cover sm:size-12"
          />
          <span className="num absolute -right-1 -bottom-1 bg-foreground size-4 grid place-items-center text-[10px] leading-4 text-background">
            {participant.level}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="num text-base font-semibold">
            {participant.kills}
            <span className="text-muted-foreground"> / </span>
            <span>{participant.deaths}</span>
            <span className="text-muted-foreground"> / </span>
            {participant.assists}
          </span>
          <span className="num text-xs text-muted-foreground">
            {participant.kdaRatio ?? t("perfect")} {t("kda")}
          </span>
        </div>
        <div className="num hidden flex-col gap-0.5 text-xs text-muted-foreground sm:flex">
          <span>
            {t("cs")} {participant.cs}
          </span>
          <span>
            {t("killParticipation")} {participant.killParticipation}%
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MatchParticipantItems itemIds={participant.itemIds} />
        <MatchParticipantScore participant={participant} hideScore />
      </div>
    </div>
  );
}
