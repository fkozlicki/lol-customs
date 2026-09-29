"use client";

import Link from "next/link";
import { ChampionImage } from "../game-assets/champion-image";
import { SpellImage } from "../game-assets/spell-image";
import { useRecipesI18n } from "../i18n/i18n";
import { RankTag } from "../rank-tag";
import type { ParticipantView } from "./match-view";

/** Champion, level, spells, name and rank: who a scoreboard row is. */
export default function MatchParticipantInfo({
  participant,
}: {
  participant: ParticipantView;
}) {
  const t = useRecipesI18n("match");

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <ChampionImage
          championId={participant.championId}
          width={34}
          height={34}
          className="size-8.5 shrink-0"
        />
        <span className="num absolute right-0 bottom-0 bg-foreground size-3.5 text-[9px] text-background grid place-items-center">
          {participant.level}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {participant.spellIds.map((spellId) => (
          <SpellImage key={spellId} spellId={spellId} width={16} height={16} />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <Link
          href={participant.href}
          className="max-w-[90px] truncate text-xs font-medium underline-offset-2 hover:underline"
        >
          {participant.name}
        </Link>
        <RankTag tier={participant.rankTier} size="sm">
          {participant.rankLabel ?? t("unranked")}
        </RankTag>
      </div>
    </div>
  );
}
