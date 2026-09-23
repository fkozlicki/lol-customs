"use client";

import { useScopedI18n } from "@/locales/client";
import { formatKdaRatio } from "@/utils/stats";
import { ChampionImage } from "../game-assets/champion-image";
import type { MatchParticipant, RawParticipant } from "./match-history-list";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantScore from "./match-participant-score";

interface PlayerMetadataProps {
  participant: MatchParticipant;
  rawData: RawParticipant | undefined;
  scores: number[];
  totalKills: number;
}

export function PlayerMetadata({
  participant,
  rawData,
  scores,
  totalKills,
}: PlayerMetadataProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const kdaRatio = formatKdaRatio(
    participant.kills,
    participant.deaths,
    participant.assists,
  );
  const killParticipation =
    totalKills > 0
      ? Math.round(
          (((participant.kills ?? 0) + (participant.assists ?? 0)) /
            totalKills) *
            100,
        )
      : 0;
  const cs =
    (participant.total_minions_killed ?? 0) +
    (participant.neutral_minions_killed ?? 0);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative shrink-0">
          <ChampionImage
            championId={participant.champion_id}
            width={48}
            height={48}
            className="size-11 object-cover sm:size-12"
          />
          <span className="num absolute -right-1 -bottom-1 bg-foreground size-4 grid place-items-center text-[10px] leading-4 text-background">
            {participant.champ_level}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="num text-base font-semibold">
            {participant.kills ?? 0}
            <span className="text-muted-foreground"> / </span>
            <span>{participant.deaths ?? 0}</span>
            <span className="text-muted-foreground"> / </span>
            {participant.assists ?? 0}
          </span>
          <span className="num text-xs text-muted-foreground">
            {kdaRatio === "Perfect" ? t("perfect") : kdaRatio} {t("kda")}
          </span>
        </div>
        <div className="num hidden flex-col gap-0.5 text-xs text-muted-foreground sm:flex">
          <span>
            {t("cs")} {cs}
          </span>
          <span>
            {t("killParticipation")} {killParticipation}%
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MatchParticipantItems rawData={rawData} />
        <MatchParticipantScore p={participant} scores={scores} hideScore />
      </div>
    </div>
  );
}
