"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { RankTag } from "@/components/rank-tag";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";

interface PlayerSoloRankProps {
  gameName: string;
  tagLine: string;
  platformId: string;
}

const APEX_TIERS = ["MASTER", "GRANDMASTER", "CHALLENGER"];

/** Riot Solo/Duo rank as a small tag; secondary to the ladder rating. */
export function PlayerSoloRank({
  gameName,
  tagLine,
  platformId,
}: PlayerSoloRankProps) {
  const t = useScopedI18n("dashboard.pages.player");
  const trpc = useTRPC();
  const { data: entries } = useSuspenseQuery(
    trpc.riot.getPlayerRankByRiotId.queryOptions({
      gameName,
      tagLine,
      platformId,
    }),
  );

  const soloQ = entries?.find((e) => e.queueType === "RANKED_SOLO_5x5");
  const tier = soloQ?.tier ?? null;
  const division =
    tier && !APEX_TIERS.includes(tier.toUpperCase()) ? soloQ?.rank : null;

  return (
    <RankTag tier={tier}>
      {t("soloDuo")} ·{" "}
      {tier ? [tier, division].filter(Boolean).join(" ") : t("unranked")}
      {soloQ && ` · ${soloQ.leaguePoints ?? 0} LP`}
    </RankTag>
  );
}
