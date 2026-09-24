"use client";

import { formatRank } from "@v1/domain/rank";
import Link from "next/link";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { ChampionImage } from "@/components/game-assets/champion-image";
import { SpellImage } from "@/components/game-assets/spell-image";
import { RankTag } from "@/components/rank-tag";
import { useScopedI18n } from "@/locales/client";
import { withSeason } from "@/utils/season";
import type { MatchParticipant, RawParticipant } from "./match-history-list";

interface MatchParticipantInfoProps {
  p: MatchParticipant;
  rawData: RawParticipant | undefined;
}

export default function MatchParticipantInfo({
  p,
  rawData,
}: MatchParticipantInfoProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const season = useSeasonParam();

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <ChampionImage
          championId={p.champion_id}
          width={34}
          height={34}
          className="size-8.5 shrink-0"
        />
        <span className="num absolute right-0 bottom-0 bg-foreground size-3.5 text-[9px] text-background grid place-items-center">
          {p.champ_level}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {rawData?.spell1Id != null && rawData.spell1Id !== 0 && (
          <SpellImage spellId={rawData.spell1Id} width={16} height={16} />
        )}
        {rawData?.spell2Id != null && rawData.spell2Id !== 0 && (
          <SpellImage spellId={rawData.spell2Id} width={16} height={16} />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <Link
          href={withSeason(
            p.players?.game_name && p.players?.tag_line
              ? `/players/${encodeURIComponent(p.players.game_name)}-${encodeURIComponent(p.players.tag_line)}`
              : "#",
            season,
          )}
          className="max-w-[90px] truncate text-xs font-medium underline-offset-2 hover:underline"
        >
          {p.players.game_name}
        </Link>
        <RankTag tier={p.rank_tier} size="sm">
          {formatRank(p.rank_tier?.toLowerCase() ?? null, p.rank_division) ??
            t("unranked")}
        </RankTag>
      </div>
    </div>
  );
}
