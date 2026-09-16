"use client";

import Link from "next/link";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { ChampionImage } from "@/components/game-assets/champion-image";
import { RankCrest } from "@/components/game-assets/rank-crest";
import { SpellImage } from "@/components/game-assets/spell-image";
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
  const season = useSeasonParam();

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <ChampionImage
          championId={p.champion_id}
          width={32}
          height={32}
          className="size-8 shrink-0"
        />
        <span className="num absolute -right-1 -bottom-1 bg-foreground px-0.5 text-[9px] leading-3.5 text-background">
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
        <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
          <RankCrest
            tier={p.rank_tier}
            width={14}
            height={14}
            className="shrink-0"
          />
          {p.rank_tier?.toLowerCase() ?? "Unranked"} {p.rank_division ?? ""}
        </span>
      </div>
    </div>
  );
}
