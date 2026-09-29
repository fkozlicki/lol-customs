"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatRank } from "@v1/domain/rank";
import { RankTag } from "@v1/ui/recipes/rank-tag";
import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/react";

/**
 * Solo/Duo rank as a small tag; secondary to the ladder rating. It is the rank Derby Sync recorded
 * with the player's latest match, read from the database rather than from the Riot API.
 */
export function PlayerSoloRank({ puuid }: { puuid: string }) {
  const t = useTranslations("dashboard.pages.player");
  const trpc = useTRPC();
  const { data: rank } = useSuspenseQuery(
    trpc.players.soloRank.queryOptions({ puuid }),
  );

  const tier = rank?.tier ?? null;

  return (
    <RankTag tier={tier}>
      {t("soloDuo")} ·{" "}
      {formatRank(tier, rank?.division ?? null) ?? t("unranked")}
    </RankTag>
  );
}
