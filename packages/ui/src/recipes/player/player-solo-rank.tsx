"use client";

import { useTranslations } from "next-intl";
import { RankTag } from "../rank-tag";

interface PlayerSoloRankProps {
  tier: string | null;
  /** "gold iv", "master"; null when unranked, which this says in the reader's language. */
  rankLabel: string | null;
}

/**
 * Solo/Duo rank as a small tag; secondary to the ladder rating. It is the rank Derby Sync recorded
 * with the player's latest match.
 */
export function PlayerSoloRank({ tier, rankLabel }: PlayerSoloRankProps) {
  const t = useTranslations("player");

  return (
    <RankTag tier={tier}>
      {t("soloDuo")} · {rankLabel ?? t("unranked")}
    </RankTag>
  );
}
